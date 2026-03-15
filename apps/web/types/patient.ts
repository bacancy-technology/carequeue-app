export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface PatientUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface Patient {
  id: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  address: string;
  emergencyContact?: string;
  medicalHistory?: string;
  createdAt: string;
  updatedAt: string;
  user: PatientUser;
}

export interface PatientNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientDetail extends Patient {
  notes: PatientNote[];
  appointments: {
    id: string;
    scheduledAt: string;
    status: string;
    reason: string;
    duration: number;
    doctor: {
      user: { firstName: string; lastName: string };
      specialization: string;
    };
  }[];
}

export interface PatientListResponse {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePatientPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  address: string;
  emergencyContact?: string;
  medicalHistory?: string;
}

export type UpdatePatientPayload = Partial<Omit<CreatePatientPayload, 'email' | 'password'>>;
