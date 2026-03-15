export interface DoctorUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Doctor {
  id: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  user: DoctorUser;
}

export interface DoctorDetail extends Doctor {
  availability: DoctorAvailability[];
  _count?: { appointments: number };
}

export interface DoctorListResponse {
  data: Doctor[];
  total: number;
  page: number;
  limit: number;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
}

export interface AvailableSlotsResponse {
  date: string;
  slots: AvailabilitySlot[];
}

export interface CreateDoctorPayload {
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
  bio?: string;
}

export type UpdateDoctorPayload = Partial<Omit<CreateDoctorPayload, 'email'>>;

export interface AvailabilitySlotPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  date: string;
  reason?: string;
  createdAt: string;
}
