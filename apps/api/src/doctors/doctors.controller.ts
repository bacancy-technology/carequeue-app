import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorQueryDto } from './dto/doctor-query.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthUser {
  id: string;
  role: Role;
}

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CLINIC_STAFF, Role.PATIENT)
  findAll(@Query() query: DoctorQueryDto) {
    return this.doctorsService.findAll(query);
  }

  @Get('me')
  @Roles(Role.DOCTOR)
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.doctorsService.findByUserId(user.id);
  }

  @Patch('me')
  @Roles(Role.DOCTOR)
  updateMyProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.updateByUserId(user.id, dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CLINIC_STAFF)
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }

  // ─── Availability ──────────────────────────────────────────────────────────

  @Get(':id/availability')
  @Roles(Role.ADMIN, Role.CLINIC_STAFF, Role.DOCTOR, Role.PATIENT)
  getAvailability(@Param('id') id: string) {
    return this.doctorsService.getAvailability(id);
  }

  @Post(':id/availability')
  @Roles(Role.ADMIN, Role.DOCTOR)
  setAvailability(@Param('id') id: string, @Body() dto: SetAvailabilityDto) {
    return this.doctorsService.setAvailability(id, dto);
  }

  @Get(':id/available-slots')
  @Roles(Role.ADMIN, Role.CLINIC_STAFF, Role.PATIENT, Role.DOCTOR)
  getAvailableSlots(@Param('id') id: string, @Query() query: AvailableSlotsQueryDto) {
    return this.doctorsService.getAvailableSlots(id, query);
  }

  // ─── Leave ─────────────────────────────────────────────────────────────────

  @Post(':id/leave')
  @Roles(Role.ADMIN, Role.DOCTOR)
  addLeave(
    @Param('id') id: string,
    @Body() dto: CreateLeaveDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.doctorsService.addLeave(id, dto, user);
  }

  @Get(':id/leave')
  @Roles(Role.ADMIN, Role.CLINIC_STAFF, Role.DOCTOR, Role.PATIENT)
  getLeaves(@Param('id') id: string) {
    return this.doctorsService.getLeaves(id);
  }

  @Delete(':id/leave/:leaveId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.DOCTOR)
  removeLeave(
    @Param('id') id: string,
    @Param('leaveId') leaveId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.doctorsService.removeLeave(id, leaveId, user);
  }
}
