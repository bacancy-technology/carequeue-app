import api from '../axios';
import type {
  Appointment,
  AppointmentListResponse,
  CalendarEvent,
  CreateAppointmentPayload,
  ReschedulePayload,
} from '../../types/appointment';

export const appointmentsApi = {
  list: (params?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => api.get<AppointmentListResponse>('/appointments', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Appointment>(`/appointments/${id}`).then((r) => r.data),

  create: (payload: CreateAppointmentPayload) =>
    api.post<Appointment>('/appointments', payload).then((r) => r.data),

  update: (id: string, payload: { reason?: string; notes?: string }) =>
    api.patch<Appointment>(`/appointments/${id}`, payload).then((r) => r.data),

  reschedule: (id: string, payload: ReschedulePayload) =>
    api.patch<Appointment>(`/appointments/${id}/reschedule`, payload).then((r) => r.data),

  cancel: (id: string, cancellationReason?: string) =>
    api.patch<Appointment>(`/appointments/${id}/cancel`, { cancellationReason }).then((r) => r.data),

  complete: (id: string) =>
    api.patch<Appointment>(`/appointments/${id}/complete`).then((r) => r.data),

  getCalendarEvents: (dateFrom: string, dateTo: string) =>
    api
      .get<CalendarEvent[]>('/appointments/calendar', { params: { dateFrom, dateTo } })
      .then((r) => r.data),
};
