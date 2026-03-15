// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Role {
  ADMIN = 'ADMIN',
  CLINIC_STAFF = 'CLINIC_STAFF',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  userId: string;
  dateOfBirth: Date;
  gender: string;
  phone: string;
  address: string;
  emergencyContact?: string;
  medicalHistory?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Doctor ──────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── DoctorAvailability ───────────────────────────────────────────────────────

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  isAvailable: boolean;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  duration: number; // minutes
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  sentAt?: Date;
  createdAt: Date;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
