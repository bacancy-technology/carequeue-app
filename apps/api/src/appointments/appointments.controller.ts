import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthUser {
  id: string;
  role: Role;
}

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  findAll(@Query() query: AppointmentQueryDto, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.findAll(query, user.id, user.role);
  }

  @Get('calendar')
  getCalendar(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.getCalendarEvents(user.id, user.role, dateFrom, dateTo);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.update(id, dto, user.id, user.role);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.reschedule(id, dto, user.id, user.role);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.cancel(id, dto, user.id, user.role);
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.complete(id, user.id, user.role);
  }
}
