import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string, role: Role) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (role === Role.ADMIN || role === Role.CLINIC_STAFF) {
      const [
        totalPatients,
        totalDoctors,
        todayAppointments,
        upcomingAppointments,
        recentAppointments,
      ] = await this.prisma.$transaction([
        this.prisma.patient.count(),
        this.prisma.doctor.count(),
        this.prisma.appointment.count({
          where: { scheduledAt: { gte: todayStart, lte: todayEnd } },
        }),
        this.prisma.appointment.count({
          where: {
            scheduledAt: { gte: now },
            status: { in: ['SCHEDULED', 'RESCHEDULED'] },
          },
        }),
        this.prisma.appointment.findMany({
          where: {
            scheduledAt: { gte: todayStart },
            status: { in: ['SCHEDULED', 'RESCHEDULED'] },
          },
          include: {
            patient: { include: { user: { select: { firstName: true, lastName: true } } } },
            doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 5,
        }),
      ]);

      return {
        totalPatients,
        totalDoctors,
        todayAppointments,
        upcomingAppointments,
        recentAppointments,
      };
    }

    if (role === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) return { todayAppointments: 0, upcomingAppointments: 0, recentAppointments: [] };

      const [todayAppointments, upcomingAppointments, recentAppointments] =
        await this.prisma.$transaction([
          this.prisma.appointment.count({
            where: {
              doctorId: doctor.id,
              scheduledAt: { gte: todayStart, lte: todayEnd },
            },
          }),
          this.prisma.appointment.count({
            where: {
              doctorId: doctor.id,
              scheduledAt: { gte: now },
              status: { in: ['SCHEDULED', 'RESCHEDULED'] },
            },
          }),
          this.prisma.appointment.findMany({
            where: {
              doctorId: doctor.id,
              scheduledAt: { gte: todayStart },
              status: { in: ['SCHEDULED', 'RESCHEDULED'] },
            },
            include: {
              patient: { include: { user: { select: { firstName: true, lastName: true } } } },
              doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 5,
          }),
        ]);

      return { todayAppointments, upcomingAppointments, recentAppointments };
    }

    if (role === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId } });
      if (!patient) return { upcomingAppointments: 0, recentAppointments: [] };

      const [upcomingAppointments, recentAppointments] = await this.prisma.$transaction([
        this.prisma.appointment.count({
          where: {
            patientId: patient.id,
            scheduledAt: { gte: now },
            status: { in: ['SCHEDULED', 'RESCHEDULED'] },
          },
        }),
        this.prisma.appointment.findMany({
          where: { patientId: patient.id },
          include: {
            patient: { include: { user: { select: { firstName: true, lastName: true } } } },
            doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
          orderBy: { scheduledAt: 'desc' },
          take: 5,
        }),
      ]);

      return { upcomingAppointments, recentAppointments };
    }

    return {};
  }

  async getChartData(userId: string, role: Role) {
    const now = new Date();

    // Calculate Monday of current week
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Last 30 days for status breakdown
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    if (role === Role.ADMIN || role === Role.CLINIC_STAFF) {
      const [statusCounts, weeklyAppointments, doctorAppointments] =
        await Promise.all([
          // Appointment status breakdown (last 30 days)
          this.prisma.appointment.groupBy({
            by: ['status'],
            _count: { id: true },
            where: { scheduledAt: { gte: thirtyDaysAgo } },
          }),

          // Weekly appointment trend (this week, all statuses)
          this.prisma.appointment.findMany({
            where: { scheduledAt: { gte: monday, lte: sunday } },
            select: { scheduledAt: true, status: true },
          }),

          // Top doctors by appointment count (last 30 days)
          this.prisma.appointment.groupBy({
            by: ['doctorId'],
            _count: { id: true },
            where: { scheduledAt: { gte: thirtyDaysAgo } },
            orderBy: { _count: { id: 'desc' } },
            take: 6,
          }),
        ]);

      // Resolve doctor names
      const doctorIds = doctorAppointments.map((d) => d.doctorId);
      const doctors = await this.prisma.doctor.findMany({
        where: { id: { in: doctorIds } },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      const doctorMap = new Map(doctors.map((d) => [d.id, d]));

      // Build weekly data (Mon-Sun)
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyData = dayNames.map((day, i) => {
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + i);
        const dayStr = dayDate.toISOString().slice(0, 10);

        const dayAppts = weeklyAppointments.filter(
          (a) => a.scheduledAt.toISOString().slice(0, 10) === dayStr,
        );
        return {
          day,
          total: dayAppts.length,
          completed: dayAppts.filter((a) => a.status === 'COMPLETED').length,
          scheduled: dayAppts.filter(
            (a) => a.status === 'SCHEDULED' || a.status === 'RESCHEDULED',
          ).length,
          cancelled: dayAppts.filter((a) => a.status === 'CANCELLED').length,
        };
      });

      // Build status data
      const statusData = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'].map(
        (status) => ({
          status,
          count:
            statusCounts.find((s) => s.status === status)?._count.id ?? 0,
        }),
      );

      // Build doctor data
      const doctorData = doctorAppointments.map((d) => {
        const doc = doctorMap.get(d.doctorId);
        return {
          name: doc
            ? `Dr. ${doc.user.firstName} ${doc.user.lastName}`
            : 'Unknown',
          specialization: doc?.specialization ?? '',
          count: d._count.id,
        };
      });

      return { statusData, weeklyData, doctorData };
    }

    if (role === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) return { statusData: [], weeklyData: [], doctorData: [] };

      const [statusCounts, weeklyAppointments] = await Promise.all([
        this.prisma.appointment.groupBy({
          by: ['status'],
          _count: { id: true },
          where: { doctorId: doctor.id, scheduledAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.appointment.findMany({
          where: {
            doctorId: doctor.id,
            scheduledAt: { gte: monday, lte: sunday },
          },
          select: { scheduledAt: true, status: true },
        }),
      ]);

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyData = dayNames.map((day, i) => {
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + i);
        const dayStr = dayDate.toISOString().slice(0, 10);

        const dayAppts = weeklyAppointments.filter(
          (a) => a.scheduledAt.toISOString().slice(0, 10) === dayStr,
        );
        return {
          day,
          total: dayAppts.length,
          completed: dayAppts.filter((a) => a.status === 'COMPLETED').length,
          scheduled: dayAppts.filter(
            (a) => a.status === 'SCHEDULED' || a.status === 'RESCHEDULED',
          ).length,
          cancelled: dayAppts.filter((a) => a.status === 'CANCELLED').length,
        };
      });

      const statusData = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'].map(
        (status) => ({
          status,
          count: statusCounts.find((s) => s.status === status)?._count.id ?? 0,
        }),
      );

      return { statusData, weeklyData, doctorData: [] };
    }

    if (role === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({ where: { userId } });
      if (!patient) return { statusData: [], weeklyData: [], doctorData: [] };

      const statusCounts = await this.prisma.appointment.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { patientId: patient.id },
      });

      const statusData = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'].map(
        (status) => ({
          status,
          count: statusCounts.find((s) => s.status === status)?._count.id ?? 0,
        }),
      );

      return { statusData, weeklyData: [], doctorData: [] };
    }

    return { statusData: [], weeklyData: [], doctorData: [] };
  }
}
