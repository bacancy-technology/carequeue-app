'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { patientsApi } from '../../../../lib/api/patients';
import { doctorsApi } from '../../../../lib/api/doctors';
import { appointmentsApi } from '../../../../lib/api/appointments';
import { useAuth } from '../../../../contexts/auth-context';
import type { Patient } from '../../../../types/patient';
import type { Doctor, AvailabilitySlot } from '../../../../types/doctor';

type Step = 1 | 2 | 3;

function StepIndicator({ current, isPatientRole }: { current: Step; isPatientRole: boolean }) {
  const steps = isPatientRole
    ? ['Select Doctor', 'Pick Date & Time', 'Confirm']
    : ['Select Patient & Doctor', 'Pick Date & Time', 'Confirm'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = (i + 1) as Step;
        const active = step === current;
        const done = step < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
              done ? 'bg-emerald-500 text-white' : active ? 'bg-teal-600 text-white' : 'bg-[#F0F1EE] text-[#9CA3AF]'
            }`}>
              {done ? '✓' : step}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${active ? 'text-[#1A1D1F]' : 'text-[#9CA3AF]'}`}>
              {label}
            </span>
            {i < 2 && <div className="w-8 h-px bg-[#E2E4DE] mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-[#E2E4DE] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition';

export default function NewAppointmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isPatientRole = user?.role === 'PATIENT';
  const [step, setStep] = useState<Step>(1);

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');

  // Auto-fetch patient profile for PATIENT role
  const { data: myPatientProfile, isLoading: loadingMyProfile, isError: myProfileError } = useQuery({
    queryKey: ['patients', 'me'],
    queryFn: () => patientsApi.getMe(),
    enabled: isPatientRole,
  });

  // Auto-select patient when profile loads
  useEffect(() => {
    if (isPatientRole && myPatientProfile && !selectedPatient) {
      setSelectedPatient(myPatientProfile);
    }
  }, [isPatientRole, myPatientProfile, selectedPatient]);

  // Data queries
  const { data: patients } = useQuery({
    queryKey: ['patients', patientSearch],
    queryFn: () => patientsApi.list({ search: patientSearch || undefined, limit: 8 }),
    enabled: step === 1 && !isPatientRole,
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors', doctorSearch],
    queryFn: () => doctorsApi.list({ search: doctorSearch || undefined, limit: 8 }),
    enabled: step === 1,
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', selectedDoctor?.id, selectedDate, duration],
    queryFn: () => doctorsApi.getAvailableSlots(selectedDoctor!.id, selectedDate, duration),
    enabled: !!selectedDoctor && !!selectedDate && step === 2,
  });

  const book = useMutation({
    mutationFn: () => {
      // Build the ISO string directly so the time is treated as UTC on the
      // server (avoids browser timezone offset shifting the hour/day).
      return appointmentsApi.create({
        patientId: selectedPatient!.id,
        doctorId: selectedDoctor!.id,
        scheduledAt: `${selectedDate}T${selectedSlot}:00.000Z`,
        duration,
        reason,
        notes: notes || undefined,
      });
    },
    onSuccess: (appt) => router.push(`/appointments/${appt.id}`),
  });

  const canGoStep2 = !!selectedPatient && !!selectedDoctor;
  const canGoStep3 = !!selectedDate && !!selectedSlot;

  // Minimum date is today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/appointments" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1D1F] mb-6 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Appointments
      </Link>

      <h1 className="text-2xl font-bold text-[#1A1D1F] mb-6">Book Appointment</h1>
      <StepIndicator current={step} isPatientRole={isPatientRole} />

      {/* ── Step 1: Select Patient & Doctor ── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Patient — only show for non-patient roles */}
          {!isPatientRole && (
            <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6">
              <h2 className="text-sm font-semibold text-[#374151] mb-4">Select Patient</h2>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient by name or email…"
                className={inputCls + ' mb-3'}
              />
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {patients?.data.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                      selectedPatient?.id === p.id
                        ? 'bg-teal-600/10 border border-teal-600/30'
                        : 'border border-transparent hover:bg-[#F7F8F6]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-600/10 flex items-center justify-center text-teal-600 text-xs font-semibold shrink-0">
                      {p.user.firstName[0]}{p.user.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A1D1F]">{p.user.firstName} {p.user.lastName}</p>
                      <p className="text-xs text-[#9CA3AF]">{p.user.email}</p>
                    </div>
                    {selectedPatient?.id === p.id && (
                      <svg className="w-4 h-4 text-teal-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Patient confirmation for PATIENT role */}
          {isPatientRole && loadingMyProfile && (
            <div className="bg-[#F7F8F6] border border-[#E2E4DE] rounded-2xl p-4 text-sm text-[#9CA3AF]">
              Loading your profile…
            </div>
          )}
          {isPatientRole && myProfileError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-700">
              Could not load your patient profile. Please complete your profile first.
            </div>
          )}
          {isPatientRole && selectedPatient && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-600/10 flex items-center justify-center text-teal-600 text-xs font-semibold shrink-0">
                {selectedPatient.user.firstName[0]}{selectedPatient.user.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1D1F]">Booking for: {selectedPatient.user.firstName} {selectedPatient.user.lastName}</p>
                <p className="text-xs text-[#6B7280]">{selectedPatient.user.email}</p>
              </div>
            </div>
          )}

          {/* Doctor */}
          <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6">
            <h2 className="text-sm font-semibold text-[#374151] mb-4">Select Doctor</h2>
            <input
              type="text"
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              placeholder="Search doctor by name or specialization…"
              className={inputCls + ' mb-3'}
            />
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {doctors?.data.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDoctor(d)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                    selectedDoctor?.id === d.id
                      ? 'bg-sky-500/10 border border-sky-500/30'
                      : 'border border-transparent hover:bg-[#F7F8F6]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 text-xs font-semibold shrink-0">
                    {d.user.firstName[0]}{d.user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1D1F]">Dr. {d.user.firstName} {d.user.lastName}</p>
                    <p className="text-xs text-[#9CA3AF]">{d.specialization}</p>
                  </div>
                  {selectedDoctor?.id === d.id && (
                    <svg className="w-4 h-4 text-sky-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!canGoStep2}
            onClick={() => setStep(2)}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-2.5 rounded-lg transition disabled:opacity-50"
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── Step 2: Date & Time ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#374151]">Select Date & Duration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Date</label>
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => { setDuration(Number(e.target.value)); setSelectedSlot(''); }}
                  className={inputCls}
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Available Slots</label>
                {loadingSlots ? (
                  <p className="text-sm text-[#9CA3AF]">Loading slots…</p>
                ) : !slotsData?.slots.length ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-sm text-amber-700">
                    Doctor is not available on this date. Please choose another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slotsData.slots.map((slot: AvailabilitySlot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`py-2 rounded-lg text-sm font-medium transition border ${
                          !slot.available
                            ? 'bg-[#F7F8F6] text-[#D1D5DB] border-[#E2E4DE] cursor-not-allowed line-through'
                            : selectedSlot === slot.time
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-[#374151] border-[#E2E4DE] hover:border-teal-600 hover:text-teal-600'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-lg border border-[#E2E4DE] text-sm font-medium text-[#4B5563] hover:bg-[#F7F8F6] transition">
              ← Back
            </button>
            <button
              disabled={!canGoStep3}
              onClick={() => setStep(3)}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-2.5 rounded-lg transition disabled:opacity-50">
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#374151]">Appointment Summary</h2>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Patient', value: `${selectedPatient!.user.firstName} ${selectedPatient!.user.lastName}` },
                { label: 'Doctor', value: `Dr. ${selectedDoctor!.user.firstName} ${selectedDoctor!.user.lastName} · ${selectedDoctor!.specialization}` },
                { label: 'Date', value: new Date(`${selectedDate}T${selectedSlot}`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                { label: 'Time', value: `${selectedSlot} · ${duration} min` },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-4">
                  <dt className="w-20 shrink-0 text-[#9CA3AF]">{label}</dt>
                  <dd className="text-[#1A1D1F] font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Reason & Notes */}
          <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#374151]">Visit Details</h2>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">
                Reason for visit <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={inputCls}
                placeholder="e.g. Annual check-up, chest pain, follow-up…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={inputCls + ' resize-none'}
                placeholder="Any additional information for the doctor…"
              />
            </div>
          </div>

          {book.isError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg px-4 py-3">
              {(() => {
                const msg = (book.error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
                return Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to book appointment. The slot may no longer be available.';
              })()}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-lg border border-[#E2E4DE] text-sm font-medium text-[#4B5563] hover:bg-[#F7F8F6] transition">
              ← Back
            </button>
            <button
              disabled={!reason.trim() || book.isPending}
              onClick={() => book.mutate()}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-2.5 rounded-lg transition disabled:opacity-50">
              {book.isPending ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
