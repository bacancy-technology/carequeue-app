import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'PATIENT',
        patient: {
          create: {
            dateOfBirth: new Date('1990-01-01'),
            gender: 'OTHER',
            phone: '',
            address: '',
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = this.signToken(user.id, user.email, user.role);
    return { user, accessToken: token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const { passwordHash, ...safeUser } = user;
    const token = this.signToken(user.id, user.email, user.role);
    return { user: safeUser, accessToken: token };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    // Invalidate old tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // Always log the URL for dev/debugging
    this.logger.log(`Password reset link for ${email}: ${resetUrl}`);

    // Send password reset email
    await this.emailService.send({
      to: email,
      subject: 'CareQueue — Reset Your Password',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #F5F3EE;">
          <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #E8E6E1;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: #1A6B5C; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 20px; font-weight: bold;">C</span>
              </div>
              <span style="font-size: 18px; font-weight: 700; color: #1A1D1F;">CareQueue</span>
            </div>
            <h2 style="font-size: 22px; font-weight: 700; color: #1A1D1F; margin: 0 0 8px;">Reset Your Password</h2>
            <p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              We received a request to reset the password for your CareQueue account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${resetUrl}"
               style="display: inline-block; background: #1A6B5C; color: white; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-bottom: 24px;">
              Reset Password
            </a>
            <p style="color: #9CA3AF; font-size: 13px; margin: 0 0 8px;">
              If you didn't request a password reset, you can safely ignore this email — your password will not be changed.
            </p>
            <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
              Or copy this link: <a href="${resetUrl}" style="color: #1A6B5C;">${resetUrl}</a>
            </p>
          </div>
        </div>
      `,
    });

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  async acceptInvite(token: string, password: string) {
    const inviteToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!inviteToken || !inviteToken.isInvite || inviteToken.used || inviteToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired invite link');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: inviteToken.userId },
        data: { passwordHash, isActive: true },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: inviteToken.id },
        data: { used: true },
      }),
    ]);

    const accessToken = this.signToken(inviteToken.userId, inviteToken.user.email, inviteToken.user.role);
    return {
      user: {
        id: inviteToken.user.id,
        email: inviteToken.user.email,
        firstName: inviteToken.user.firstName,
        lastName: inviteToken.user.lastName,
        role: inviteToken.user.role,
        createdAt: inviteToken.user.createdAt,
      },
      accessToken,
    };
  }

  private signToken(userId: string, email: string, role: string) {
    return this.jwtService.sign({ sub: userId, email, role });
  }
}
