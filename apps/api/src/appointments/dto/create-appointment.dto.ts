import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @IsDateString()
  scheduledAt: string; // ISO 8601 e.g. "2026-03-16T09:00:00.000Z"

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  duration?: number = 30; // minutes

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
