'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../../../lib/api/appointments';
import { StatusBadge } from '../../../components/ui/status-badge';
import { EmptyState } from '../../../components/ui/empty-state';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { useToast } from '../../../components/ui/toast';
import { TableSkeleton } from '../../../components/ui/skeleton';
import type { AppointmentStatus } from '../../../types/appointment';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Rescheduled', value: 'RESCHEDULED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function AppointmentsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'complete'; id: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', status, page],
    queryFn: () =>
      appointmentsApi.list({
        status: (status as AppointmentStatus) || undefined,
        page,
        limit,
      }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id, cancelReason || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      showToast('Appointment cancelled');
      setConfirmAction(null);
      setCancelReason('');
    },
  });

  const complete = useMutation({
    mutationFn: (id: string) => appointmentsApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      showToast('Appointment marked as complete');
      setConfirmAction(null);
    },
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1A1D1F]">Appointments</h1>
          {data && <p className="text-sm text-[#6B7280] mt-0.5">{data.total} total appointments</p>}
        </div>
        <div className="flex gap-2">
          <Link
            href="/appointments/calendar"
            className="inline-flex items-center gap-2 border border-[#E2E4DE] text-[#1A1D1F] hover:bg-[#F0F1EE] text-sm font-medium px-3 sm:px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Calendar</span>
          </Link>
          <Link
            href="/appointments/new"
            className="inline-flex items-center gap-2 bg-teal-600 hover:opacity-90 text-white text-sm font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Book Appointment</span>
            <span className="sm:hidden">Book</span>
          </Link>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl border border-[#E2E4DE] p-1 w-fit overflow-x-auto">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatus(f.value); setPage(1); }}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              status === f.value
                ? 'bg-teal-600 text-white'
                : 'text-[#6B7280] hover:text-[#1A1D1F] hover:bg-[#F0F1EE]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E4DE] overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : !data?.data.length ? (
          <EmptyState title="No appointments found" description="Book the first appointment to get started" />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E4DE] bg-[#F0F1EE]">
                    <th className="text-left px-6 py-3.5 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Patient</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Doctor</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Date & Time</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Reason</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E4DE]">
                  {data.data.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F0F1EE]/60 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#1A1D1F]">
                          {a.patient.user.firstName} {a.patient.user.lastName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#1A1D1F]">Dr. {a.doctor.user.firstName} {a.doctor.user.lastName}</p>
                        <p className="text-xs text-[#6B7280]">{a.doctor.specialization}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#1A1D1F]">{new Date(a.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-xs text-[#6B7280]">
                          {new Date(a.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          {' · '}{a.duration} min
                        </p>
                      </td>
                      <td className="px-6 py-4 text-[#6B7280] max-w-[180px] truncate">{a.reason}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/appointments/${a.id}`}
                            className="text-xs text-teal-600 font-semibold hover:underline">
                            View
                          </Link>
                          {(a.status === 'SCHEDULED' || a.status === 'RESCHEDULED') && (
                            <>
                              <span className="text-[#E2E4DE]">|</span>
                              <button
                                onClick={() => setConfirmAction({ type: 'complete', id: a.id })}
                                className="text-xs text-emerald-600 font-semibold hover:underline"
                              >
                                Complete
                              </button>
                              <span className="text-[#E2E4DE]">|</span>
                              <button
                                onClick={() => setConfirmAction({ type: 'cancel', id: a.id })}
                                className="text-xs text-rose-600 font-semibold hover:underline"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-[#E2E4DE]">
              {data.data.map((a) => (
                <Link key={a.id} href={`/appointments/${a.id}`} className="flex items-start gap-3 px-4 py-4 hover:bg-[#F0F1EE]/60 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {a.patient.user.firstName[0]}{a.patient.user.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-semibold text-[#1A1D1F] text-sm truncate">
                        {a.patient.user.firstName} {a.patient.user.lastName}
                      </p>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="text-xs text-[#6B7280]">Dr. {a.doctor.user.firstName} {a.doctor.user.lastName}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {new Date(a.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{new Date(a.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{a.duration} min
                    </p>
                    <p className="text-xs text-[#6B7280] mt-0.5 truncate">{a.reason}</p>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-[#E2E4DE] text-sm">
                <p className="text-[#6B7280] text-xs sm:text-sm">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total}
                </p>
                <div className="flex items-center gap-1.5">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E4DE] text-[#1A1D1F] disabled:opacity-40 hover:bg-[#F0F1EE] transition-colors text-xs sm:text-sm font-medium">
                    ← Prev
                  </button>
                  <span className="px-2 text-[#6B7280] text-xs font-medium">{page} / {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E4DE] text-[#1A1D1F] disabled:opacity-40 hover:bg-[#F0F1EE] transition-colors text-xs sm:text-sm font-medium">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.type === 'cancel' ? 'Cancel Appointment' : 'Complete Appointment'}
        message={
          confirmAction?.type === 'cancel'
            ? 'Are you sure you want to cancel this appointment? This cannot be undone.'
            : 'Mark this appointment as completed?'
        }
        confirmLabel={confirmAction?.type === 'cancel' ? 'Yes, Cancel' : 'Yes, Complete'}
        variant={confirmAction?.type === 'cancel' ? 'danger' : 'warning'}
        onConfirm={() => {
          if (confirmAction?.type === 'cancel') cancel.mutate(confirmAction.id);
          if (confirmAction?.type === 'complete') complete.mutate(confirmAction.id);
        }}
        onCancel={() => { setConfirmAction(null); setCancelReason(''); }}
      >
        {confirmAction?.type === 'cancel' && (
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wide">
              Reason for cancellation (optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Patient requested, scheduling conflict…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E2E4DE] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
            />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
