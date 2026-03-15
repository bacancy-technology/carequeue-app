export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface AppointmentParty {
  id: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

export interface AppointmentDoctor extends AppointmentParty {
  specialization: string;
}

export interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  patient: AppointmentParty;
  doctor: AppointmentDoctor;
}

export interface AppointmentListResponse {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  patientId: string;
  doctorId: string;
  reason: string;
  extendedProps: { status: AppointmentStatus; reason: string; duration: number };
}

export interface CreateAppointmentPayload {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  duration?: number;
  reason: string;
  notes?: string;
}

export interface ReschedulePayload {
  scheduledAt: string;
  duration?: number;
  notes?: string;
}
