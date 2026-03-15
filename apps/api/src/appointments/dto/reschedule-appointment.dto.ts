import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RescheduleAppointmentDto {
  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  duration?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
