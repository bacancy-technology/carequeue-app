import api from '../axios';

export interface DashboardStats {
  totalPatients?: number;
  totalDoctors?: number;
  todayAppointments?: number;
  upcomingAppointments?: number;
  recentAppointments?: Array<{
    id: string;
    scheduledAt: string;
    duration: number;
    status: string;
    reason: string;
    patient: { id: string; user: { firstName: string; lastName: string } };
    doctor: { id: string; specialization: string; user: { firstName: string; lastName: string } };
  }>;
}

export interface ChartData {
  statusData: Array<{ status: string; count: number }>;
  weeklyData: Array<{
    day: string;
    total: number;
    completed: number;
    scheduled: number;
    cancelled: number;
  }>;
  doctorData: Array<{
    name: string;
    specialization: string;
    count: number;
  }>;
}

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
  getChartData: () => api.get<ChartData>('/dashboard/charts').then((r) => r.data),
};
