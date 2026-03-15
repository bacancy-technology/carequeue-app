import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Runs every day at 08:00 AM.
   * Finds all appointments scheduled for tomorrow and sends reminder emails.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyReminders() {
    this.logger.log('Running daily appointment reminders…');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(tomorrow);
    start.setHours(0, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        status: { in: ['SCHEDULED', 'RESCHEDULED'] },
      },
      select: {
        id: true,
        scheduledAt: true,
        duration: true,
        reason: true,
        patient: {
          select: {
            id: true,
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    this.logger.log(`Sending reminders for ${appointments.length} appointments`);

    for (const appt of appointments) {
      try {
        await this.notificationsService.sendReminder(appt);
      } catch (err) {
        this.logger.error(`Failed to queue reminder for appointment ${appt.id}`, err);
      }
    }
  }
}
