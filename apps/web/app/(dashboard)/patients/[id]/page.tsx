'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '../../../../lib/api/patients';
import { StatusBadge } from '../../../../components/ui/status-badge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'appointments'>('overview');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.get(id),
  });

  const addNote = useMutation({
    mutationFn: () => patientsApi.addNote(id, note),
    onSuccess: () => {
      setNote('');
      qc.invalidateQueries({ queryKey: ['patient', id] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) => patientsApi.deleteNote(id, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patient', id] }),
  });

  if (isLoading) return <div className="p-8 text-sm text-[#9CA3AF]">Loading…</div>;
  if (!patient) return <div className="p-8 text-sm text-rose-600">Patient not found</div>;

  const tabs = ['overview', 'notes', 'appointments'] as const;

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1D1F] mb-6 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Patients
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-600/10 flex items-center justify-center text-teal-600 font-bold text-lg">
              {patient.user.firstName[0]}{patient.user.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1A1D1F]">
                {patient.user.firstName} {patient.user.lastName}
              </h1>
              <p className="text-sm text-[#9CA3AF]">{patient.user.email}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-[#6B7280]">{calcAge(patient.dateOfBirth)} years old</span>
                <span className="text-[#D1D5DB]">·</span>
                <span className="text-sm text-[#6B7280]">{patient.gender}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  patient.user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {patient.user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          <Link
            href={`/patients/${id}/edit`}
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 border border-teal-600/30 px-4 py-2 rounded-lg hover:bg-teal-600/5 transition"
          >
            Edit Patient
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl border border-[#E2E4DE] p-1 w-fit shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
              activeTab === tab ? 'bg-teal-600 text-white' : 'text-[#6B7280] hover:text-[#1A1D1F]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6">
          <h2 className="text-sm font-semibold text-[#374151] mb-4">Patient Information</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {[
              { label: 'Date of Birth', value: formatDate(patient.dateOfBirth) },
              { label: 'Phone', value: patient.phone },
              { label: 'Address', value: patient.address },
              { label: 'Emergency Contact', value: patient.emergencyContact || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">{label}</dt>
                <dd className="text-[#1A1D1F]">{value}</dd>
              </div>
            ))}
          </dl>
          {patient.medicalHistory && (
            <div className="mt-6 pt-6 border-t border-[#E2E4DE]">
              <dt className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-2">Medical History</dt>
              <dd className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{patient.medicalHistory}</dd>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Add note */}
          <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6">
            <h2 className="text-sm font-semibold text-[#374151] mb-3">Add Note</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Write a clinical note…"
              className="w-full px-4 py-2.5 rounded-lg border border-[#E2E4DE] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              disabled={!note.trim() || addNote.isPending}
              onClick={() => addNote.mutate()}
              className="mt-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {addNote.isPending ? 'Saving…' : 'Save Note'}
            </button>
          </div>

          {/* Notes list */}
          {patient.notes.length === 0 ? (
            <div className="text-center py-10 text-sm text-[#9CA3AF]">No notes yet</div>
          ) : (
            patient.notes.map((n) => (
              <div key={n.id} className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  <button
                    onClick={() => deleteNote.mutate(n.id)}
                    className="text-[#D1D5DB] hover:text-rose-600 transition shrink-0"
                    title="Delete note"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-2">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Appointments */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm overflow-hidden">
          {patient.appointments.length === 0 ? (
            <div className="text-center py-10 text-sm text-[#9CA3AF]">No appointments yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E4DE] bg-[#F7F8F6]/60">
                  <th className="text-left px-6 py-3 font-medium text-[#6B7280]">Date & Time</th>
                  <th className="text-left px-6 py-3 font-medium text-[#6B7280]">Doctor</th>
                  <th className="text-left px-6 py-3 font-medium text-[#6B7280]">Reason</th>
                  <th className="text-left px-6 py-3 font-medium text-[#6B7280]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F1EE]">
                {patient.appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F7F8F6]/60">
                    <td className="px-6 py-4 text-[#4B5563]">
                      {new Date(a.scheduledAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#1A1D1F]">
                        Dr. {a.doctor.user.firstName} {a.doctor.user.lastName}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">{a.doctor.specialization}</p>
                    </td>
                    <td className="px-6 py-4 text-[#4B5563]">{a.reason}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
