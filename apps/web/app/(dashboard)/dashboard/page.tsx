'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '../../../contexts/auth-context';
import { dashboardApi } from '../../../lib/api/dashboard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

/* ── Stat Card ──────────────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  href?: string;
}

function StatCard({ label, value, icon, href }: StatCardProps) {
  const content = (
    <div
      className="bg-white rounded-2xl p-5 border border-[#E8E6E1] hover:border-[#D1CFC9] transition-all group cursor-pointer h-full flex flex-col justify-between min-h-[130px]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[13px] text-[#6B7280] font-medium">{label}</p>
        <div className="w-9 h-9 rounded-full bg-[#F0EDE8] border border-[#E8E6E1] flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <p className="text-[32px] font-bold text-[#1A1D1F] leading-none tracking-tight mt-auto">{value}</p>
    </div>
  );

  if (href) return <Link href={href} className="block h-full">{content}</Link>;
  return content;
}

/* ── Appointment Row ────────────────────────────────────────────────── */

function AppointmentRow({ appt }: {
  appt: {
    id: string;
    scheduledAt: string;
    duration: number;
    status: string;
    reason: string;
    patient: { id: string; user: { firstName: string; lastName: string } };
    doctor: { id: string; specialization: string; user: { firstName: string; lastName: string } };
  }
}) {
  const statusStyles: Record<string, string> = {
    SCHEDULED: 'bg-emerald-50 text-emerald-700',
    RESCHEDULED: 'bg-amber-50 text-amber-700',
    COMPLETED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-rose-50 text-rose-600',
  };

  return (
    <Link
      href={`/appointments/${appt.id}`}
      className="flex items-center justify-between py-3.5 px-1 border-b border-[#F0EDE8] last:border-0 hover:bg-[#FAFAF7] rounded-lg transition-colors -mx-1"
    >
      <div className="flex items-center gap-3 min-w-0 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#1A1D1F] truncate">
              {appt.patient.user.firstName} {appt.patient.user.lastName}
            </p>
            <span className="text-xs text-[#9CA3AF] font-mono shrink-0">
              P-{appt.id.slice(0, 4)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6B7280]">
            <span>Dr. {appt.doctor.user.lastName}</span>
            <span className="text-[#D1CFC9]">·</span>
            <span>{appt.doctor.specialization}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {new Date(appt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusStyles[appt.status] ?? 'bg-gray-100 text-[#4B5563]'}`}>
          {appt.status}
        </span>
      </div>
    </Link>
  );
}

/* ── Skeletons ──────────────────────────────────────────────────────── */

function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4 mb-8`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-[#E8E6E1] animate-pulse min-h-[130px]">
          <div className="flex items-start justify-between mb-3">
            <div className="h-4 bg-[#F0EDE8] rounded w-24" />
            <div className="w-9 h-9 bg-[#F0EDE8] rounded-full" />
          </div>
          <div className="h-9 bg-[#F0EDE8] rounded-lg w-20 mt-auto" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E6E1] animate-pulse">
      <div className="h-5 bg-[#F0EDE8] rounded w-40 mb-6" />
      <div className="h-[220px] bg-[#F0EDE8] rounded-xl" />
    </div>
  );
}

/* ── Chart helpers ──────────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#1A6B5C',
  COMPLETED: '#9CA3AF',
  CANCELLED: '#E11D48',
  RESCHEDULED: '#E8913A',
};

const BAR_COLORS = {
  teal: '#1A6B5C',
  gray: '#9CA3AF',
  gold: '#FBBF24',
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg px-3 py-2 text-xs border border-[#E8E6E1]">
      <p className="font-semibold text-[#1A1D1F] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-[#6B7280]">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-[#1A1D1F]">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ── Main Dashboard ─────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: chartData, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: dashboardApi.getChartData,
  });

  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'CLINIC_STAFF';
  const isDoctor = user?.role === 'DOCTOR';
  const isPatient = user?.role === 'PATIENT';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const hasStatusData = chartData?.statusData?.some((s) => s.count > 0);
  const hasWeeklyData = chartData?.weeklyData?.some((d) => d.total > 0);
  const hasDoctorData = chartData?.doctorData && chartData.doctorData.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#1A1D1F] tracking-tight">Dashboard</h1>
        <p className="text-[13px] text-[#9CA3AF] mt-1 font-medium">
          {greeting}, {user?.firstName}. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      {isLoading ? (
        <StatsSkeleton count={isAdminOrStaff ? 4 : 2} />
      ) : (
        <>
          {isAdminOrStaff && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Patients" value={stats?.totalPatients ?? 0} href="/patients"
                icon={<svg className="w-4 h-4 text-[#1A6B5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              />
              <StatCard label="Total Doctors" value={stats?.totalDoctors ?? 0} href="/doctors"
                icon={<svg className="w-4 h-4 text-[#1A6B5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <StatCard label="Today's Appointments" value={stats?.todayAppointments ?? 0} href="/appointments"
                icon={<svg className="w-4 h-4 text-[#E8913A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
              <StatCard label="Upcoming" value={stats?.upcomingAppointments ?? 0} href="/appointments"
                icon={<svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </div>
          )}

          {isDoctor && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <StatCard label="Today's Appointments" value={stats?.todayAppointments ?? 0}
                icon={<svg className="w-4 h-4 text-[#1A6B5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
              <StatCard label="Upcoming Appointments" value={stats?.upcomingAppointments ?? 0}
                icon={<svg className="w-4 h-4 text-[#E8913A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </div>
          )}

          {isPatient && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <StatCard label="Upcoming Appointments" value={stats?.upcomingAppointments ?? 0} href="/appointments"
                icon={<svg className="w-4 h-4 text-[#1A6B5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
              <StatCard label="Total Appointments" value={stats?.upcomingAppointments ?? 0} href="/appointments"
                icon={<svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              />
            </div>
          )}

          {/* ── Charts Section ──────────────────────────────────────── */}
          {chartsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Weekly Appointment Trends — bar chart */}
              {(isAdminOrStaff || isDoctor) && (
                <div className="bg-white rounded-2xl p-5 border border-[#E8E6E1]"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-[15px] font-bold text-[#1A1D1F]">Weekly Appointments</h2>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">This week&apos;s breakdown by status</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-medium text-[#6B7280]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: BAR_COLORS.teal }} />Scheduled</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: BAR_COLORS.gray }} />Completed</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: BAR_COLORS.gold }} />Cancelled</span>
                    </div>
                  </div>
                  {hasWeeklyData ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData?.weeklyData} barGap={2} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} width={28} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                        <Bar dataKey="scheduled" name="Scheduled" fill={BAR_COLORS.teal} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completed" name="Completed" fill={BAR_COLORS.gray} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cancelled" name="Cancelled" fill={BAR_COLORS.gold} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-sm text-[#9CA3AF]">
                      No appointment data this week
                    </div>
                  )}
                </div>
              )}

              {/* Appointment Status Breakdown — donut chart */}
              {hasStatusData && (
                <div className="bg-white rounded-2xl p-5 border border-[#E8E6E1]"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div className="mb-5">
                    <h2 className="text-[15px] font-bold text-[#1A1D1F]">Appointment Status</h2>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Last 30 days breakdown</p>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={chartData?.statusData?.filter((s) => s.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="status"
                        labelLine={false}
                        label={PieLabel}
                      >
                        {chartData?.statusData?.filter((s) => s.count > 0).map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9CA3AF'} />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span className="text-[11px] text-[#6B7280] font-medium ml-1">{value}</span>
                        )}
                      />
                      <Tooltip
                        formatter={(value) => [String(value), '']}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #E8E6E1',
                          fontSize: 12,
                          backgroundColor: '#FFFFFF',
                          color: '#1A1D1F',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Appointments by Doctor — horizontal bar (ADMIN/STAFF only) */}
              {isAdminOrStaff && hasDoctorData && (
                <div className="bg-white rounded-2xl p-5 border border-[#E8E6E1] lg:col-span-2"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div className="mb-5">
                    <h2 className="text-[15px] font-bold text-[#1A1D1F]">Appointments by Doctor</h2>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Top doctors by volume (last 30 days)</p>
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(180, (chartData?.doctorData?.length ?? 0) * 44)}>
                    <BarChart data={chartData?.doctorData} layout="vertical" barSize={20} margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        width={160}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                      <Bar dataKey="count" name="Appointments" fill="#1A6B5C" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ── Bottom Grid: Schedule + Quick Actions ───────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {stats?.recentAppointments && stats.recentAppointments.length > 0 && (
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E6E1] p-5"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h2 className="text-base font-bold text-[#1A1D1F]">
                      {isPatient ? 'Recent Appointments' : "Today's Schedule"}
                    </h2>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">Track and manage all appointments</p>
                  </div>
                  <Link href="/appointments" className="text-xs text-[#1A6B5C] hover:underline font-semibold px-3 py-1.5 rounded-lg hover:bg-[#E6F2EF] transition-colors">
                    View all →
                  </Link>
                </div>
                <div className="mt-3">
                  {stats.recentAppointments.map((appt) => (
                    <AppointmentRow key={appt.id} appt={appt} />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-[#E8E6E1] p-5"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h2 className="text-base font-bold text-[#1A1D1F] mb-4">Quick Actions</h2>
              <div className="space-y-2.5">
                <Link href="/appointments/new"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8E6E1] hover:border-[#D1CFC9] hover:bg-[#E6F2EF] transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-[#E6F2EF] flex items-center justify-center text-[#1A6B5C] group-hover:bg-[#1A6B5C] group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#1A1D1F] block">Book Appointment</span>
                    <span className="text-[11px] text-[#9CA3AF]">Schedule a new visit</span>
                  </div>
                </Link>
                {isAdminOrStaff && (
                  <Link href="/patients/new"
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8E6E1] hover:border-[#D1CFC9] hover:bg-[#E6F2EF] transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-[#E6F2EF] flex items-center justify-center text-[#1A6B5C] group-hover:bg-[#1A6B5C] group-hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#1A1D1F] block">Add Patient</span>
                      <span className="text-[11px] text-[#9CA3AF]">Register a new patient</span>
                    </div>
                  </Link>
                )}
                <Link href="/appointments/calendar"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8E6E1] hover:border-[#D1CFC9] hover:bg-[#FEF3E2] transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-[#FEF3E2] flex items-center justify-center text-[#E8913A] group-hover:bg-[#E8913A] group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#1A1D1F] block">Calendar View</span>
                    <span className="text-[11px] text-[#9CA3AF]">See the full schedule</span>
                  </div>
                </Link>
                <Link href="/profile"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8E6E1] hover:border-[#D1CFC9] hover:bg-[#F0EDE8] transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-[#F0EDE8] flex items-center justify-center text-[#6B7280] group-hover:bg-[#6B7280] group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#1A1D1F] block">My Profile</span>
                    <span className="text-[11px] text-[#9CA3AF]">View and edit your profile</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
