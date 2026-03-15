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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthUser {
  id: string;
  role: Role;
}

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN, Role.CLINIC_STAFF)
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CLINIC_STAFF, Role.DOCTOR)
  findAll(@Query() query: PatientQueryDto) {
    return this.patientsService.findAll(query);
  }

  @Get('me')
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.patientsService.findByUserId(user.id);
  }

  @Patch('me')
  updateMyProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdatePatientDto) {
    return this.patientsService.updateByUserId(user.id, dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CLINIC_STAFF, Role.DOCTOR)
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CLINIC_STAFF)
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }

  // ─── Notes ────────────────────────────────────────────────────────────────

  @Post(':id/notes')
  @Roles(Role.ADMIN, Role.CLINIC_STAFF, Role.DOCTOR)
  addNote(
    @Param('id') id: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.patientsService.addNote(id, dto, user.id);
  }

  @Get(':id/notes')
  @Roles(Role.ADMIN, Role.CLINIC_STAFF, Role.DOCTOR)
  getNotes(@Param('id') id: string) {
    return this.patientsService.getNotes(id);
  }

  @Delete(':patientId/notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(
    @Param('noteId') noteId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.patientsService.deleteNote(noteId, user.id, user.role);
  }
}
