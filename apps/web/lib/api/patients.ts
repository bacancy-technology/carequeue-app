import api from '../axios';
import type {
  Patient,
  PatientDetail,
  PatientListResponse,
  PatientNote,
  CreatePatientPayload,
  UpdatePatientPayload,
} from '../../types/patient';

export const patientsApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<PatientListResponse>('/patients', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<PatientDetail>(`/patients/${id}`).then((r) => r.data),

  create: (payload: CreatePatientPayload) =>
    api.post<Patient>('/patients', payload).then((r) => r.data),

  update: (id: string, payload: UpdatePatientPayload) =>
    api.patch<Patient>(`/patients/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/patients/${id}`),

  // Notes
  getNotes: (patientId: string) =>
    api.get<PatientNote[]>(`/patients/${patientId}/notes`).then((r) => r.data),

  addNote: (patientId: string, content: string) =>
    api.post<PatientNote>(`/patients/${patientId}/notes`, { content }).then((r) => r.data),

  deleteNote: (patientId: string, noteId: string) =>
    api.delete(`/patients/${patientId}/notes/${noteId}`),

  getMe: () =>
    api.get<Patient>('/patients/me').then((r) => r.data),

  updateMe: (payload: Record<string, unknown>) =>
    api.patch('/patients/me', payload).then((r) => r.data),
};
