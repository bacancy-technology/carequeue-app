'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi } from '../../../../lib/api/doctors';
import { useToast } from '../../../../components/ui/toast';
import { useAuth } from '../../../../contexts/auth-context';
import type { DoctorLeave } from '../../../../types/doctor';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'availability' | 'leave'>('overview');
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorsApi.get(id),
  });

  const { data: leaves, isLoading: loadingLeaves } = useQuery({
    queryKey: ['doctor-leaves', id],
    queryFn: () => doctorsApi.getLeaves(id),
    enabled: activeTab === 'leave',
  });

  const addLeave = useMutation({
    mutationFn: () => doctorsApi.addLeave(id, { date: leaveDate, reason: leaveReason || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-leaves', id] });
      setLeaveDate('');
      setLeaveReason('');
      showToast('Leave date added');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      showToast(err?.response?.data?.message ?? 'Failed to add leave', 'error');
    },
  });

  const removeLeave = useMutation({
    mutationFn: (leaveId: string) => doctorsApi.removeLeave(id, leaveId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-leaves', id] });
      showToast('Leave date removed');
    },
  });

  if (isLoading) return <div className="p-8 text-sm text-[#9CA3AF]">Loading…</div>;
  if (!doctor) return <div className="p-8 text-sm text-rose-600">Doctor not found</div>;

  // Build availability map for quick lookup
  const availMap = Object.fromEntries(
    (doctor.availability ?? []).map((a) => [a.dayOfWeek, a]),
  );

  const today = new Date().toISOString().split('T')[0];
  const canManageLeave = user?.role === 'ADMIN' || user?.role === 'DOCTOR';

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'availability', label: 'Weekly Schedule' },
    { key: 'leave', label: 'Leave & Blocked Dates' },
  ] as const;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/doctors" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1D1F] mb-6 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Doctors
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600 font-bold text-lg">
              {doctor.user.firstName[0]}{doctor.user.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1A1D1F]">
                Dr. {doctor.user.firstName} {doctor.user.lastName}
              </h1>
              <p className="text-sm text-[#9CA3AF]">{doctor.user.email}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-600">
                  {doctor.specialization}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  doctor.user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {doctor.user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/doctors/${id}/availability`}
              className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 border border-sky-500/30 px-4 py-2 rounded-lg hover:bg-sky-500/5 transition"
            >
              Edit Schedule
            </Link>
            <Link
              href={`/doctors/${id}/edit`}
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 border border-teal-600/30 px-4 py-2 rounded-lg hover:bg-teal-600/5 transition"
            >
              Edit Doctor
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#E2E4DE]">
          <div>
            <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium">Total Appointments</p>
            <p className="text-xl font-bold text-[#1A1D1F] mt-0.5">{doctor._count?.appointments ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium">License No.</p>
            <p className="font-mono text-sm text-[#374151] mt-1">{doctor.licenseNumber}</p>
          </div>
          <div>
            <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium">Phone</p>
            <p className="text-sm text-[#374151] mt-1">{doctor.phone}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl border border-[#E2E4DE] p-1 w-fit shadow-sm overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.key ? 'bg-teal-600 text-white' : 'text-[#6B7280] hover:text-[#1A1D1F]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6">
          <h2 className="text-sm font-semibold text-[#374151] mb-4">Doctor Information</h2>
          {doctor.bio ? (
            <div className="mb-6">
              <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2">Bio</p>
              <p className="text-sm text-[#374151] leading-relaxed">{doctor.bio}</p>
            </div>
          ) : (
            <p className="text-sm text-[#9CA3AF] italic">No bio provided.</p>
          )}
        </div>
      )}

      {/* Availability */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E4DE] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#374151]">Weekly Schedule</h2>
            <Link href={`/doctors/${id}/availability`} className="text-xs text-teal-600 hover:underline font-medium">
              Edit →
            </Link>
          </div>
          <div className="divide-y divide-[#F0F1EE]">
            {DAYS.map((day, i) => {
              const slot = availMap[i];
              return (
                <div key={day} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${slot?.isAvailable ? 'bg-emerald-500' : 'bg-[#E2E4DE]'}`} />
                    <span className="text-sm font-medium text-[#374151] w-24">{day}</span>
                  </div>
                  {slot?.isAvailable ? (
                    <span className="text-sm text-[#4B5563]">
                      {slot.startTime} — {slot.endTime}
                    </span>
                  ) : (
                    <span className="text-sm text-[#9CA3AF]">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leave & Blocked Dates */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          {/* Add leave form — ADMIN or DOCTOR only */}
          {canManageLeave && (
            <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6">
              <h2 className="text-sm font-semibold text-[#374151] mb-4">Block a Date</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wide">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E4DE] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wide">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Annual leave, Conference…"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E4DE] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              {addLeave.isError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-4 py-2 mb-3">
                  {(addLeave.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add leave'}
                </p>
              )}
              <button
                disabled={!leaveDate || addLeave.isPending}
                onClick={() => addLeave.mutate()}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {addLeave.isPending ? 'Adding…' : 'Block Date'}
              </button>
            </div>
          )}

          {/* Leave list */}
          <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E4DE]">
              <h2 className="text-sm font-semibold text-[#374151]">Blocked / Leave Dates</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Upcoming dates when the doctor is unavailable</p>
            </div>

            {loadingLeaves ? (
              <div className="px-6 py-8 text-sm text-[#9CA3AF] text-center">Loading…</div>
            ) : !leaves?.length ? (
              <div className="px-6 py-10 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#F0F1EE] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#4B5563]">No blocked dates</p>
                <p className="text-xs text-[#9CA3AF] mt-1">The doctor has no upcoming leave or blocked dates.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F1EE]">
                {(leaves as DoctorLeave[]).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1A1D1F]">
                          {new Date(leave.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {leave.reason && (
                          <p className="text-xs text-[#6B7280] mt-0.5">{leave.reason}</p>
                        )}
                      </div>
                    </div>
                    {canManageLeave && (
                      <button
                        onClick={() => removeLeave.mutate(leave.id)}
                        disabled={removeLeave.isPending}
                        className="text-xs text-rose-500 hover:text-rose-600 font-semibold hover:underline transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
