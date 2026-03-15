'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '../../../../lib/api/appointments';
import { doctorsApi } from '../../../../lib/api/doctors';
import { StatusBadge } from '../../../../components/ui/status-badge';
import { useToast } from '../../../../components/ui/toast';
import { useAuth } from '../../../../contexts/auth-context';
import type { AvailabilitySlot } from '../../../../types/doctor';

const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-[#E2E4DE] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition';

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: appt, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsApi.get(id),
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', appt?.doctor.id, newDate, newDuration],
    queryFn: () => doctorsApi.getAvailableSlots(appt!.doctor.id, newDate, newDuration),
    enabled: !!appt && !!newDate && rescheduleMode,
  });

  const cancel = useMutation({
    mutationFn: () => appointmentsApi.cancel(id, cancelReason || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointment', id] });
      setShowCancelDialog(false);
      setCancelReason('');
      showToast('Appointment cancelled');
    },
  });

  const complete = useMutation({
    mutationFn: () => appointmentsApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointment', id] });
      showToast('Appointment marked as complete', 'success');
    },
  });

  const reschedule = useMutation({
    mutationFn: () => {
      const [hours, minutes] = newSlot.split(':').map(Number);
      const dt = new Date(`${newDate}T00:00:00`);
      dt.setHours(hours, minutes, 0, 0);
      return appointmentsApi.reschedule(id, { scheduledAt: dt.toISOString(), duration: newDuration });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointment', id] });
      setRescheduleMode(false);
      showToast('Appointment rescheduled', 'success');
    },
  });

  if (isLoading) return <div className="p-8 text-sm text-[#9CA3AF]">Loading…</div>;
  if (!appt) return <div className="p-8 text-sm text-rose-600">Appointment not found</div>;

  const isMutable = appt.status === 'SCHEDULED' || appt.status === 'RESCHEDULED';
  const canComplete = user?.role === 'ADMIN' || user?.role === 'CLINIC_STAFF' || user?.role === 'DOCTOR';
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/appointments" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1D1F] mb-6 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Appointments
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1D1F]">Appointment Details</h1>
            <p className="text-xs text-[#9CA3AF] font-mono mt-0.5">{appt.id}</p>
          </div>
          <StatusBadge status={appt.status} />
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <dt className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Patient</dt>
            <dd className="font-medium text-[#1A1D1F]">
              <Link href={`/patients/${appt.patient.id}`} className="hover:text-teal-600 hover:underline">
                {appt.patient.user.firstName} {appt.patient.user.lastName}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Doctor</dt>
            <dd className="font-medium text-[#1A1D1F]">
              <Link href={`/doctors/${appt.doctor.id}`} className="hover:text-teal-600 hover:underline">
                Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}
              </Link>
              <span className="text-[#9CA3AF] font-normal"> · {appt.doctor.specialization}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Date & Time</dt>
            <dd className="text-[#1A1D1F]">
              {new Date(appt.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              {' at '}
              {new Date(appt.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Duration</dt>
            <dd className="text-[#1A1D1F]">{appt.duration} minutes</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Reason</dt>
            <dd className="text-[#1A1D1F]">{appt.reason}</dd>
          </div>
          {appt.notes && (
            <div className="col-span-2">
              <dt className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Notes</dt>
              <dd className="text-[#374151] leading-relaxed">{appt.notes}</dd>
            </div>
          )}
          {appt.status === 'CANCELLED' && appt.cancellationReason && (
            <div className="col-span-2">
              <dt className="text-xs font-medium text-rose-400 uppercase tracking-wide mb-1">Cancellation Reason</dt>
              <dd className="text-[#374151] bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 text-sm leading-relaxed">
                {appt.cancellationReason}
              </dd>
            </div>
          )}
        </dl>

        {/* Actions */}
        {isMutable && !rescheduleMode && (
          <div className="flex gap-2 mt-6 pt-6 border-t border-[#E2E4DE]">
            <button
              onClick={() => setRescheduleMode(true)}
              className="px-4 py-2 rounded-lg border border-[#E2E4DE] text-sm font-medium text-[#4B5563] hover:bg-[#F7F8F6] transition"
            >
              Reschedule
            </button>
            {canComplete && (
              <button
                onClick={() => complete.mutate()}
                disabled={complete.isPending}
                className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium hover:bg-emerald-500/20 transition"
              >
                {complete.isPending ? 'Saving…' : 'Mark Complete'}
              </button>
            )}
            <button
              onClick={() => setShowCancelDialog(true)}
              className="px-4 py-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium hover:bg-rose-100 transition"
            >
              Cancel Appointment
            </button>
          </div>
        )}
      </div>

      {/* Reschedule panel */}
      {rescheduleMode && (
        <div className="bg-white rounded-2xl border border-teal-600/20 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-[#374151] mb-4">Reschedule Appointment</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">New Date</label>
              <input type="date" min={today} value={newDate}
                onChange={(e) => { setNewDate(e.target.value); setNewSlot(''); }}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Duration</label>
              <select value={newDuration} onChange={(e) => { setNewDuration(Number(e.target.value)); setNewSlot(''); }}
                className={inputCls}>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
          </div>

          {newDate && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#374151] mb-2">Available Slots</label>
              {loadingSlots ? (
                <p className="text-sm text-[#9CA3AF]">Loading…</p>
              ) : !slotsData?.slots.length ? (
                <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                  No availability on this date.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slotsData.slots.map((slot: AvailabilitySlot) => (
                    <button key={slot.time} disabled={!slot.available}
                      onClick={() => setNewSlot(slot.time)}
                      className={`py-2 rounded-lg text-sm font-medium transition border ${
                        !slot.available ? 'bg-[#F7F8F6] text-[#D1D5DB] border-[#E2E4DE] cursor-not-allowed line-through'
                          : newSlot === slot.time ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-[#374151] border-[#E2E4DE] hover:border-teal-600 hover:text-teal-600'
                      }`}>
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {reschedule.isError && (
            <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg px-4 py-3">
              {(reschedule.error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Reschedule failed. Slot may be taken.'}
            </div>
          )}

          <div className="flex gap-3">
            <button
              disabled={!newDate || !newSlot || reschedule.isPending}
              onClick={() => reschedule.mutate()}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {reschedule.isPending ? 'Saving…' : 'Confirm Reschedule'}
            </button>
            <button onClick={() => setRescheduleMode(false)}
              className="text-sm font-medium text-[#6B7280] px-4 py-2.5 rounded-lg border border-[#E2E4DE] hover:bg-[#F7F8F6] transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cancel dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelDialog(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E2E4DE] p-6 w-full max-w-sm mx-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#1A1D1F] mb-1.5">Cancel Appointment</h3>
            <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
              Are you sure you want to cancel this appointment? This cannot be undone.
            </p>
            <div className="mb-5">
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
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCancelDialog(false); setCancelReason(''); }}
                className="px-4 py-2 rounded-xl border border-[#E2E4DE] text-sm font-semibold text-[#4B5563] hover:bg-[#F7F8F6] transition"
              >
                Keep Appointment
              </button>
              <button
                onClick={() => cancel.mutate()}
                disabled={cancel.isPending}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition disabled:opacity-60"
              >
                {cancel.isPending ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
