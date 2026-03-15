import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { inviteEmail } from '../notifications/email.templates';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { Role } from '@prisma/client';

const PATIENT_SELECT = {
  id: true,
  dateOfBirth: true,
  gender: true,
  phone: true,
  address: true,
  emergencyContact: true,
  medicalHistory: true,
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
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(dto: CreatePatientDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const tempPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const patient = await this.prisma.patient.create({
      data: {
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        phone: dto.phone,
        address: dto.address,
        emergencyContact: dto.emergencyContact,
        medicalHistory: dto.medicalHistory,
        user: {
          create: {
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: Role.PATIENT,
            isActive: false,
          },
        },
      },
      select: { ...PATIENT_SELECT, user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } } },
    });

    // Generate invite token (7 day expiry)
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: patient.user.id, token: inviteToken, expiresAt, isInvite: true },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/invite/accept?token=${inviteToken}`;

    await this.emailService.send({
      to: dto.email,
      subject: "You're invited to CareQueue",
      html: inviteEmail({ name: `${dto.firstName} ${dto.lastName}`, role: 'Patient', inviteUrl }),
    });

    return patient;
  }

  async findAll(query: PatientQueryDto) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
            { user: { lastName: { contains: search, mode: 'insensitive' as const } } },
            { user: { email: { contains: search, mode: 'insensitive' as const } } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [patients, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        select: PATIENT_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data: patients, total, page, limit };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      select: {
        ...PATIENT_SELECT,
        notes: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdBy: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 5,
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            reason: true,
            duration: true,
            doctor: {
              select: {
                user: { select: { firstName: true, lastName: true } },
                specialization: true,
              },
            },
          },
        },
      },
    });

    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async findByUserId(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: PATIENT_SELECT,
    });
    if (!patient) throw new NotFoundException('Patient profile not found');
    return patient;
  }

  async updateByUserId(userId: string, dto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!patient) throw new NotFoundException('Patient profile not found');
    return this.update(patient.id, dto);
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.ensureExists(id);

    const { firstName, lastName, ...patientFields } = dto as UpdatePatientDto & {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      gender?: string;
      phone?: string;
      address?: string;
      emergencyContact?: string;
      medicalHistory?: string;
    };

    return this.prisma.patient.update({
      where: { id },
      data: {
        ...(patientFields.dateOfBirth && {
          dateOfBirth: new Date(patientFields.dateOfBirth),
        }),
        ...(patientFields.gender && { gender: patientFields.gender }),
        ...(patientFields.phone && { phone: patientFields.phone }),
        ...(patientFields.address && { address: patientFields.address }),
        ...(patientFields.emergencyContact !== undefined && {
          emergencyContact: patientFields.emergencyContact,
        }),
        ...(patientFields.medicalHistory !== undefined && {
          medicalHistory: patientFields.medicalHistory,
        }),
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
      select: PATIENT_SELECT,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    // Cascade deletes the user via Prisma schema
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    await this.prisma.user.delete({ where: { id: patient!.userId } });
    return { message: 'Patient deleted' };
  }

  // ─── Notes ───────────────────────────────────────────────────────────────────

  async addNote(patientId: string, dto: CreateNoteDto, authorId: string) {
    await this.ensureExists(patientId);
    return this.prisma.patientNote.create({
      data: { patientId, content: dto.content, createdBy: authorId },
    });
  }

  async getNotes(patientId: string) {
    await this.ensureExists(patientId);
    return this.prisma.patientNote.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteNote(noteId: string, requesterId: string, requesterRole: Role) {
    const note = await this.prisma.patientNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    if (requesterRole !== Role.ADMIN && note.createdBy !== requesterId) {
      throw new ForbiddenException('Cannot delete another user\'s note');
    }
    await this.prisma.patientNote.delete({ where: { id: noteId } });
    return { message: 'Note deleted' };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.patient.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Patient not found');
    return exists;
  }
}
