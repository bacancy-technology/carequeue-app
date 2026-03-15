import api from '../axios';
import type {
  Doctor,
  DoctorDetail,
  DoctorListResponse,
  DoctorAvailability,
  AvailableSlotsResponse,
  CreateDoctorPayload,
  UpdateDoctorPayload,
  AvailabilitySlotPayload,
  DoctorLeave,
} from '../../types/doctor';

export const doctorsApi = {
  list: (params?: { search?: string; specialization?: string; page?: number; limit?: number }) =>
    api.get<DoctorListResponse>('/doctors', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<DoctorDetail>(`/doctors/${id}`).then((r) => r.data),

  create: (payload: CreateDoctorPayload) =>
    api.post<Doctor>('/doctors', payload).then((r) => r.data),

  update: (id: string, payload: UpdateDoctorPayload) =>
    api.patch<Doctor>(`/doctors/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/doctors/${id}`),

  // Availability
  getAvailability: (id: string) =>
    api.get<DoctorAvailability[]>(`/doctors/${id}/availability`).then((r) => r.data),

  setAvailability: (id: string, slots: AvailabilitySlotPayload[]) =>
    api.post<DoctorAvailability[]>(`/doctors/${id}/availability`, { slots }).then((r) => r.data),

  getAvailableSlots: (id: string, date: string, slotDuration?: number) =>
    api
      .get<AvailableSlotsResponse>(`/doctors/${id}/available-slots`, {
        params: { date, slotDuration },
      })
      .then((r) => r.data),

  updateMe: (payload: Record<string, unknown>) =>
    api.patch('/doctors/me', payload).then((r) => r.data),

  // Leave / Blocked dates
  getLeaves: (id: string) =>
    api.get<DoctorLeave[]>(`/doctors/${id}/leave`).then((r) => r.data),

  addLeave: (id: string, payload: { date: string; reason?: string }) =>
    api.post<DoctorLeave>(`/doctors/${id}/leave`, payload).then((r) => r.data),

  removeLeave: (id: string, leaveId: string) =>
    api.delete(`/doctors/${id}/leave/${leaveId}`),
};
