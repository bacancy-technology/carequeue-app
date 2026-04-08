import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { AppointmentStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';

const APPOINTMENT_SELECT = {
  id: true,
  scheduledAt: true,
  duration: true,
  status: true,
  reason: true,
  notes: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
  patient: {
    select: {
      id: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
  doctor: {
    select: {
      id: true,
      specialization: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
};

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ─── Book ─────────────────────────────────────────────────────────────────

  async create(dto: CreateAppointmentDto) {
    const scheduledAt = new Date(dto.scheduledAt);
    const duration = dto.duration ?? 30;

    // 1. Validate patient & doctor exist
    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: dto.patientId } }),
      this.prisma.doctor.findUnique({
        where: { id: dto.doctorId },
        include: { availability: true },
      }),
    ]);
    if (!patient) throw new NotFoundException('Patient not found');
    if (!doctor) throw new NotFoundException('Doctor not found');

    // 2. Validate doctor availability for this day of week
    const dayOfWeek = scheduledAt.getUTCDay();
    const avail = doctor.availability.find((a) => a.dayOfWeek === dayOfWeek);
    if (!avail || !avail.isAvailable) {
      throw new BadRequestException(
        `Doctor is not available on ${this.dayName(dayOfWeek)}`,
      );
    }

    // 3. Validate appointment time within availability window
    const apptMinutes = scheduledAt.getUTCHours() * 60 + scheduledAt.getUTCMinutes();
    const [startH, startM] = avail.startTime.split(':').map(Number);
    const [endH, endM] = avail.endTime.split(':').map(Number);
    const availStart = startH * 60 + startM;
    const availEnd = endH * 60 + endM;

    if (apptMinutes < availStart || apptMinutes + duration > availEnd) {
      throw new BadRequestException(
        `Appointment must be within doctor's hours: ${avail.startTime}–${avail.endTime}`,
      );
    }

    // 4. Double-booking check — doctor side
    await this.assertNoOverlap(dto.doctorId, scheduledAt, duration);

    // 5. Patient concurrent booking check
    await this.assertPatientFree(dto.patientId, scheduledAt, duration);

    const appt = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        scheduledAt,
        duration,
        reason: dto.reason,
        notes: dto.notes,
        status: AppointmentStatus.SCHEDULED,
      },
      select: APPOINTMENT_SELECT,
    });

    // Fire-and-forget notification (don't let email failure break booking)
    this.notificationsService.onAppointmentBooked(appt as never).catch(() => null);

    return appt;
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async findAll(query: AppointmentQueryDto, requesterId: string, requesterRole: Role) {
    const { patientId, doctorId, status, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Scope results based on role
    let scopedPatientId = patientId;
    let scopedDoctorId = doctorId;

    if (requesterRole === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: requesterId },
        select: { id: true },
      });
      // No patient profile yet → return empty (never leak other patients' data)
      if (!patient) return { data: [], total: 0, page, limit };
      scopedPatientId = patient.id;
    } else if (requesterRole === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: requesterId },
        select: { id: true },
      });
      // No doctor profile yet → return empty
      if (!doctor) return { data: [], total: 0, page, limit };
      scopedDoctorId = doctor.id;
    }

    const where = {
      ...(scopedPatientId && { patientId: scopedPatientId }),
      ...(scopedDoctorId && { doctorId: scopedDoctorId }),
      ...(status && { status }),
      ...(dateFrom || dateTo
        ? {
            scheduledAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
    };

    const [appointments, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        select: APPOINTMENT_SELECT,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data: appointments, total, page, limit };
  }

  async findOne(id: string, requesterId: string, requesterRole: Role) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      select: APPOINTMENT_SELECT,
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    this.assertCanAccess(appt, requesterId, requesterRole);
    return appt;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateAppointmentDto, requesterId: string, requesterRole: Role) {
    const appt = await this.findOne(id, requesterId, requesterRole);
    this.assertMutable(appt);

    return this.prisma.appointment.update({
      where: { id },
      data: dto,
      select: APPOINTMENT_SELECT,
    });
  }

  // ─── Reschedule ───────────────────────────────────────────────────────────

  async reschedule(id: string, dto: RescheduleAppointmentDto, requesterId: string, requesterRole: Role) {
    const appt = await this.findOne(id, requesterId, requesterRole);
    this.assertMutable(appt);

    const scheduledAt = new Date(dto.scheduledAt);
    const duration = dto.duration ?? appt.duration;

    // Re-validate availability
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: appt.doctor.id },
      include: { availability: true },
    });
    const dayOfWeek = scheduledAt.getUTCDay();
    const avail = doctor!.availability.find((a) => a.dayOfWeek === dayOfWeek);
    if (!avail || !avail.isAvailable) {
      throw new BadRequestException(`Doctor is not available on ${this.dayName(dayOfWeek)}`);
    }

    const apptMinutes = scheduledAt.getUTCHours() * 60 + scheduledAt.getUTCMinutes();
    const [startH, startM] = avail.startTime.split(':').map(Number);
    const [endH, endM] = avail.endTime.split(':').map(Number);
    if (apptMinutes < startH * 60 + startM || apptMinutes + duration > endH * 60 + endM) {
      throw new BadRequestException(
        `Appointment must be within doctor's hours: ${avail.startTime}–${avail.endTime}`,
      );
    }

    // Double-booking check (exclude current appointment)
    await this.assertNoOverlap(appt.doctor.id, scheduledAt, duration, id);
    await this.assertPatientFree(appt.patient.id, scheduledAt, duration, id);

    const previousDate = new Date(appt.scheduledAt);
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        scheduledAt,
        duration,
        notes: dto.notes ?? appt.notes,
        status: AppointmentStatus.RESCHEDULED,
      },
      select: APPOINTMENT_SELECT,
    });

    this.notificationsService.onAppointmentRescheduled(updated as never, previousDate).catch(() => null);
    return updated;
  }

  // ─── Cancel ───────────────────────────────────────────────────────────────

  async cancel(id: string, dto: CancelAppointmentDto, requesterId: string, requesterRole: Role) {
    const appt = await this.findOne(id, requesterId, requesterRole);
    this.assertMutable(appt);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        ...(dto.cancellationReason && { cancellationReason: dto.cancellationReason }),
      },
      select: APPOINTMENT_SELECT,
    });

    this.notificationsService.onAppointmentCancelled(updated as never).catch(() => null);
    return updated;
  }

  // ─── Complete ─────────────────────────────────────────────────────────────

  async complete(id: string, requesterId: string, requesterRole: Role) {
    if (requesterRole !== Role.ADMIN && requesterRole !== Role.CLINIC_STAFF && requesterRole !== Role.DOCTOR) {
      throw new ForbiddenException();
    }
    const appt = await this.findOne(id, requesterId, requesterRole);
    if (appt.status !== AppointmentStatus.SCHEDULED && appt.status !== AppointmentStatus.RESCHEDULED) {
      throw new BadRequestException('Only scheduled appointments can be marked complete');
    }
    return this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.COMPLETED },
      select: APPOINTMENT_SELECT,
    });
  }

  // ─── Calendar Feed ────────────────────────────────────────────────────────

  async getCalendarEvents(requesterId: string, requesterRole: Role, dateFrom: string, dateTo: string) {
    let where: Record<string, unknown> = {
      scheduledAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED] },
    };

    if (requesterRole === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: requesterId },
        select: { id: true },
      });
      if (!doctor) return [];
      where = { ...where, doctorId: doctor.id };
    } else if (requesterRole === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: requesterId },
        select: { id: true },
      });
      if (!patient) return [];
      where = { ...where, patientId: patient.id };
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      select: APPOINTMENT_SELECT,
      orderBy: { scheduledAt: 'asc' },
    });

    // Transform to FullCalendar event format
    return appointments.map((a) => ({
      id: a.id,
      title: `${a.patient.user.firstName} ${a.patient.user.lastName} — Dr. ${a.doctor.user.lastName}`,
      start: a.scheduledAt,
      end: new Date(new Date(a.scheduledAt).getTime() + a.duration * 60000),
      status: a.status,
      patientId: a.patient.id,
      doctorId: a.doctor.id,
      reason: a.reason,
      extendedProps: { status: a.status, reason: a.reason, duration: a.duration },
    }));
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async assertNoOverlap(
    doctorId: string,
    scheduledAt: Date,
    duration: number,
    excludeId?: string,
  ) {
    const end = new Date(scheduledAt.getTime() + duration * 60000);
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED] },
        scheduledAt: { lt: end },
        AND: [
          {
            scheduledAt: {
              gt: new Date(scheduledAt.getTime() - duration * 60000),
            },
          },
        ],
      },
    });
    if (conflict) {
      throw new ConflictException('Doctor already has an appointment at this time');
    }
  }

  private async assertPatientFree(
    patientId: string,
    scheduledAt: Date,
    duration: number,
    excludeId?: string,
  ) {
    const end = new Date(scheduledAt.getTime() + duration * 60000);
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        patientId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED] },
        scheduledAt: { lt: end },
        AND: [
          {
            scheduledAt: {
              gt: new Date(scheduledAt.getTime() - duration * 60000),
            },
          },
        ],
      },
    });
    if (conflict) {
      throw new ConflictException('Patient already has an appointment at this time');
    }
  }

  private assertMutable(appt: { status: AppointmentStatus }) {
    if (
      appt.status === AppointmentStatus.COMPLETED ||
      appt.status === AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(`Cannot modify a ${appt.status.toLowerCase()} appointment`);
    }
  }

  private assertCanAccess(
    appt: { patient: { user: { id: string } }; doctor: { user: { id: string } } },
    requesterId: string,
    role: Role,
  ) {
    if (role === Role.ADMIN || role === Role.CLINIC_STAFF) return;
    if (role === Role.DOCTOR && appt.doctor.user.id === requesterId) return;
    if (role === Role.PATIENT && appt.patient.user.id === requesterId) return;
    throw new ForbiddenException('You do not have access to this appointment');
  }

  private dayName(day: number) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
  }
}
