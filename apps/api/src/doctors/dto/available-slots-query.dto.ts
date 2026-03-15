import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailableSlotsQueryDto {
  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  slotDuration?: number = 30; // minutes
}
