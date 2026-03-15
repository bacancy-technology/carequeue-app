import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import {
  appointmentConfirmedEmail,
  appointmentCancelledEmail,
  appointmentRescheduledEmail,
  appointmentReminderEmail,
  doctorAppointmentEmail,
} from './email.templates';

export const EMAIL_QUEUE = 'email';

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  notificationId?: string;
}

interface AppointmentData {
  id: string;
  scheduledAt: Date;
  duration: number;
  reason: string;
  patient: { id: string; user: { id: string; email: string; firstName: string; lastName: string } };
  doctor: {
    id: string;
    specialization: string;
    user: { id: string; email: string; firstName: string; lastName: string };
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue<EmailJob>,
  ) {}

  // ─── In-app notifications ─────────────────────────────────────────────────

  async getMyNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { data: items, total, unread, page, limit };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async markUnread(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: false },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  }

  // ─── Appointment event dispatchers ────────────────────────────────────────

  async onAppointmentBooked(appt: AppointmentData) {
    const { patientName, doctorName, dateStr, timeStr } = this.formatAppt(appt);

    // Patient notification
    const patientNotif = await this.createNotification({
      userId: appt.patient.user.id,
      appointmentId: appt.id,
      type: 'EMAIL',
      subject: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${doctorName} on ${dateStr} at ${timeStr} is confirmed.`,
    });
    await this.queueEmail({
      to: appt.patient.user.email,
      subject: 'Appointment Confirmed — CareQueue',
      html: appointmentConfirmedEmail({
        patientName,
        doctorName,
        specialization: appt.doctor.specialization,
        date: dateStr,
        time: timeStr,
        duration: appt.duration,
        reason: appt.reason,
      }),
      notificationId: patientNotif.id,
    });

    // Doctor notification
    const doctorNotif = await this.createNotification({
      userId: appt.doctor.user.id,
      appointmentId: appt.id,
      type: 'EMAIL',
      subject: 'New Appointment',
      message: `New appointment: ${patientName} on ${dateStr} at ${timeStr}.`,
    });
    await this.queueEmail({
      to: appt.doctor.user.email,
      subject: 'New Appointment — CareQueue',
      html: doctorAppointmentEmail({
        doctorName,
        patientName,
        date: dateStr,
        time: timeStr,
        duration: appt.duration,
        reason: appt.reason,
        type: 'BOOKED',
      }),
      notificationId: doctorNotif.id,
    });
  }

  async onAppointmentCancelled(appt: AppointmentData) {
    const { patientName, doctorName, dateStr, timeStr } = this.formatAppt(appt);

    const patientNotif = await this.createNotification({
      userId: appt.patient.user.id,
      appointmentId: appt.id,
      type: 'EMAIL',
      subject: 'Appointment Cancelled',
      message: `Your appointment with Dr. ${doctorName} on ${dateStr} has been cancelled.`,
    });
    await this.queueEmail({
      to: appt.patient.user.email,
      subject: 'Appointment Cancelled — CareQueue',
      html: appointmentCancelledEmail({
        patientName,
        doctorName,
        specialization: appt.doctor.specialization,
        date: dateStr,
        time: timeStr,
        reason: appt.reason,
      }),
      notificationId: patientNotif.id,
    });

    const doctorNotif = await this.createNotification({
      userId: appt.doctor.user.id,
      appointmentId: appt.id,
      type: 'EMAIL',
      subject: 'Appointment Cancelled',
      message: `Appointment with ${patientName} on ${dateStr} has been cancelled.`,
    });
    await this.queueEmail({
      to: appt.doctor.user.email,
      subject: 'Appointment Cancelled — CareQueue',
      html: doctorAppointmentEmail({
        doctorName,
        patientName,
        date: dateStr,
        time: timeStr,
        duration: appt.duration,
        reason: appt.reason,
        type: 'CANCELLED',
      }),
      notificationId: doctorNotif.id,
    });
  }

  async onAppointmentRescheduled(appt: AppointmentData, previousDate: Date) {
    const { patientName, doctorName, dateStr, timeStr } = this.formatAppt(appt);
    const oldDateStr = previousDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const oldTimeStr = previousDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const patientNotif = await this.createNotification({
      userId: appt.patient.user.id,
      appointmentId: appt.id,
      type: 'EMAIL',
      subject: 'Appointment Rescheduled',
      message: `Your appointment with Dr. ${doctorName} has been moved to ${dateStr} at ${timeStr}.`,
    });
    await this.queueEmail({
      to: appt.patient.user.email,
      subject: 'Appointment Rescheduled — CareQueue',
      html: appointmentRescheduledEmail({
        patientName,
        doctorName,
        specialization: appt.doctor.specialization,
        oldDate: oldDateStr,
        oldTime: oldTimeStr,
        newDate: dateStr,
        newTime: timeStr,
        duration: appt.duration,
        reason: appt.reason,
      }),
      notificationId: patientNotif.id,
    });

    const doctorNotif = await this.createNotification({
      userId: appt.doctor.user.id,
      appointmentId: appt.id,
      type: 'EMAIL',
      subject: 'Appointment Rescheduled',
      message: `Appointment with ${patientName} rescheduled to ${dateStr} at ${timeStr}.`,
    });
    await this.queueEmail({
      to: appt.doctor.user.email,
      subject: 'Appointment Rescheduled — CareQueue',
      html: doctorAppointmentEmail({
        doctorName,
        patientName,
        date: dateStr,
        time: timeStr,
        duration: appt.duration,
        reason: appt.reason,
        type: 'RESCHEDULED',
      }),
      notificationId: doctorNotif.id,
    });
  }

  async sendReminder(appt: AppointmentData) {
    const { patientName, doctorName, dateStr, timeStr } = this.formatAppt(appt);

    const notif = await this.createNotification({
      userId: appt.patient.user.id,
      appointmentId: appt.id,
      type: 'EMAIL',
      subject: 'Appointment Reminder',
      message: `Reminder: appointment with Dr. ${doctorName} tomorrow at ${timeStr}.`,
    });

    await this.queueEmail({
      to: appt.patient.user.email,
      subject: 'Appointment Reminder — Tomorrow — CareQueue',
      html: appointmentReminderEmail({
        patientName,
        doctorName,
        specialization: appt.doctor.specialization,
        date: dateStr,
        time: timeStr,
        duration: appt.duration,
        reason: appt.reason,
      }),
      notificationId: notif.id,
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async createNotification(data: {
    userId: string;
    appointmentId?: string;
    type: string;
    subject?: string;
    message: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  private async queueEmail(job: EmailJob) {
    await this.emailQueue.add(job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    });
  }

  private formatAppt(appt: AppointmentData) {
    return {
      patientName: `${appt.patient.user.firstName} ${appt.patient.user.lastName}`,
      doctorName: `${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`,
      dateStr: appt.scheduledAt.toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      }),
      timeStr: appt.scheduledAt.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit',
      }),
    };
  }
}
