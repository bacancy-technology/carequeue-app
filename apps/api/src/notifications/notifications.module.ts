import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from './email.module';
import { EmailProcessor } from './email.processor';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ReminderScheduler } from './reminder.scheduler';
import { EMAIL_QUEUE } from './notifications.service';

@Module({
  imports: [
    EmailModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
      }),
    }),
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
  ],
  providers: [EmailProcessor, NotificationsService, ReminderScheduler],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
