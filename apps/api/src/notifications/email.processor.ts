import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { EMAIL_QUEUE, EmailJob } from './notifications.service';

@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  @Process()
  async handleEmail(job: Job<EmailJob>) {
    const { to, subject, html, notificationId } = job.data;
    this.logger.log(`Processing email job ${job.id} → ${to}`);

    const sent = await this.emailService.send({ to, subject, html });

    // Mark notification as sent in DB
    if (notificationId && sent) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { sentAt: new Date() },
      });
    }
  }
}
