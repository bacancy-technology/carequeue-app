import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { inviteEmail } from '../notifications/email.templates';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorQueryDto } from './dto/doctor-query.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';

const DOCTOR_SELECT = {
  id: true,
  specialization: true,
  licenseNumber: true,
  phone: true,
  bio: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  },
};

@Injectable()
export class DoctorsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async create(dto: CreateDoctorDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const licenseUsed = await this.prisma.doctor.findUnique({
      where: { licenseNumber: dto.licenseNumber },
    });
    if (licenseUsed) throw new ConflictException('License number already registered');

    const tempPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const doctor = await this.prisma.doctor.create({
      data: {
        specialization: dto.specialization,
        licenseNumber: dto.licenseNumber,
        phone: dto.phone,
        bio: dto.bio,
        user: {
          create: {
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: Role.DOCTOR,
            isActive: false,
          },
        },
      },
      select: { ...DOCTOR_SELECT, user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } } },
    });

    // Generate invite token (7 day expiry)
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: doctor.user.id, token: inviteToken, expiresAt, isInvite: true },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/invite/accept?token=${inviteToken}`;

    await this.emailService.send({
      to: dto.email,
      subject: "You're invited to CareQueue",
      html: inviteEmail({ name: `${dto.firstName} ${dto.lastName}`, role: 'Doctor', inviteUrl }),
    });

    return doctor;
  }

  async findAll(query: DoctorQueryDto) {
    const { search, specialization, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(specialization && {
        specialization: { contains: specialization, mode: 'insensitive' as const },
      }),
      ...(search && {
        OR: [
          { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
          { user: { lastName: { contains: search, mode: 'insensitive' as const } } },
          { user: { email: { contains: search, mode: 'insensitive' as const } } },
          { specialization: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [doctors, total] = await this.prisma.$transaction([
      this.prisma.doctor.findMany({
        where,
        select: DOCTOR_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return { data: doctors, total, page, limit };
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      select: {
        ...DOCTOR_SELECT,
        availability: {
          orderBy: { dayOfWeek: 'asc' },
        },
        _count: { select: { appointments: true } },
      },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async findByUserId(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      select: { ...DOCTOR_SELECT, availability: { orderBy: { dayOfWeek: 'asc' } } },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    return doctor;
  }

  async updateByUserId(userId: string, dto: UpdateDoctorDto) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    return this.update(doctor.id, dto);
  }

  async update(id: string, dto: UpdateDoctorDto) {
    await this.ensureExists(id);

    const { firstName, lastName, ...doctorFields } = dto as UpdateDoctorDto & {
      firstName?: string;
      lastName?: string;
      specialization?: string;
      licenseNumber?: string;
      phone?: string;
      bio?: string;
    };

    return this.prisma.doctor.update({
      where: { id },
      data: {
        ...(doctorFields.specialization && { specialization: doctorFields.specialization }),
        ...(doctorFields.licenseNumber && { licenseNumber: doctorFields.licenseNumber }),
        ...(doctorFields.phone && { phone: doctorFields.phone }),
        ...(doctorFields.bio !== undefined && { bio: doctorFields.bio }),
        ...(firstName || lastName
          ? {
              user: {
                update: {
                  ...(firstName && { firstName }),
                  ...(lastName && { lastName }),
                },
              },
            }
          : {}),
      },
      select: DOCTOR_SELECT,
    });
  }

  async remove(id: string) {
    const doctor = await this.ensureExists(id);
    await this.prisma.user.delete({ where: { id: doctor.userId } });
    return { message: 'Doctor deleted' };
  }

  // ─── Availability ─────────────────────────────────────────────────────────────

  async setAvailability(doctorId: string, dto: SetAvailabilityDto) {
    await this.ensureExists(doctorId);

    // Upsert each slot — unique on (doctorId, dayOfWeek)
    const upserts = dto.slots.map((slot) =>
      this.prisma.doctorAvailability.upsert({
        where: { doctorId_dayOfWeek: { doctorId, dayOfWeek: slot.dayOfWeek } },
        create: { doctorId, ...slot },
        update: { startTime: slot.startTime, endTime: slot.endTime, isAvailable: slot.isAvailable },
      }),
    );

    await this.prisma.$transaction(upserts);
    return this.getAvailability(doctorId);
  }

  async getAvailability(doctorId: string) {
    await this.ensureExists(doctorId);
    return this.prisma.doctorAvailability.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  /**
   * Returns a list of free time slots for a given doctor on a given date,
   * excluding slots already booked with SCHEDULED or RESCHEDULED appointments.
   */
  async getAvailableSlots(doctorId: string, query: AvailableSlotsQueryDto) {
    await this.ensureExists(doctorId);

    const date = new Date(query.date);
    const dayOfWeek = date.getUTCDay(); // 0=Sun … 6=Sat
    const slotDuration = query.slotDuration ?? 30;

    // Find availability for this day
    const avail = await this.prisma.doctorAvailability.findUnique({
      where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
    });

    if (!avail || !avail.isAvailable) return { date: query.date, slots: [] };

    // Check if doctor has leave on this date
    const leaveDate = new Date(query.date);
    leaveDate.setHours(0, 0, 0, 0);
    const leaveEnd = new Date(leaveDate);
    leaveEnd.setHours(23, 59, 59, 999);
    const leave = await this.prisma.doctorLeave.findFirst({
      where: { doctorId, date: { gte: leaveDate, lte: leaveEnd } },
    });
    if (leave) return { date: query.date, slots: [], leaveReason: leave.reason };

    // Get existing bookings on this date
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const booked = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['SCHEDULED', 'RESCHEDULED'] },
      },
      select: { scheduledAt: true, duration: true },
    });

    // Generate slots
    const slots = this.generateSlots(
      query.date,
      avail.startTime,
      avail.endTime,
      slotDuration,
      booked,
    );

    return { date: query.date, slots };
  }

  // ─── Leave ───────────────────────────────────────────────────────────────────

  async addLeave(doctorId: string, dto: CreateLeaveDto, user: { id: string; role: Role }) {
    const doctor = await this.ensureExists(doctorId);
    // Doctor can only add leave for themselves
    if (user.role === Role.DOCTOR && doctor.userId !== user.id) {
      throw new ForbiddenException('You can only manage your own leave');
    }
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);
    return this.prisma.doctorLeave.upsert({
      where: { doctorId_date: { doctorId, date } },
      create: { doctorId, date, reason: dto.reason },
      update: { reason: dto.reason },
    });
  }

  async getLeaves(doctorId: string) {
    await this.ensureExists(doctorId);
    return this.prisma.doctorLeave.findMany({
      where: { doctorId, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    });
  }

  async removeLeave(doctorId: string, leaveId: string, user: { id: string; role: Role }) {
    const doctor = await this.ensureExists(doctorId);
    if (user.role === Role.DOCTOR && doctor.userId !== user.id) {
      throw new ForbiddenException('You can only manage your own leave');
    }
    await this.prisma.doctorLeave.deleteMany({ where: { id: leaveId, doctorId } });
    return { message: 'Leave removed' };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private generateSlots(
    dateStr: string,
    startTime: string,
    endTime: string,
    duration: number,
    booked: { scheduledAt: Date; duration: number }[],
  ) {
    const slots: { time: string; available: boolean }[] = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let cur = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (cur + duration <= end) {
      const slotDate = new Date(`${dateStr}T${this.pad(Math.floor(cur / 60))}:${this.pad(cur % 60)}:00Z`);
      const slotEnd = cur + duration;

      const isBooked = booked.some((b) => {
        const bStart = b.scheduledAt.getTime();
        const bEnd = bStart + b.duration * 60000;
        const sStart = slotDate.getTime();
        const sEnd = sStart + duration * 60000;
        return sStart < bEnd && sEnd > bStart; // overlap check
      });

      slots.push({
        time: `${this.pad(Math.floor(cur / 60))}:${this.pad(cur % 60)}`,
        available: !isBooked,
      });

      cur += duration;
    }

    return slots;
  }

  private pad(n: number) {
    return String(n).padStart(2, '0');
  }

  private async ensureExists(id: string) {
    const doc = await this.prisma.doctor.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!doc) throw new NotFoundException('Doctor not found');
    return doc;
  }
}
