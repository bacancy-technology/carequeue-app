export type Role = 'ADMIN' | 'CLINIC_STAFF' | 'DOCTOR' | 'PATIENT';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
