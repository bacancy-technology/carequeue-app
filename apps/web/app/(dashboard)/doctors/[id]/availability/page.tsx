'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi } from '../../../../../lib/api/doctors';
import type { AvailabilitySlotPayload } from '../../../../../types/doctor';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface SlotState {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_SLOT: SlotState = { isAvailable: false, startTime: '09:00', endTime: '17:00' };

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

export default function AvailabilityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [slots, setSlots] = useState<SlotState[]>(Array(7).fill(null).map(() => ({ ...DEFAULT_SLOT })));

  const { data: doctor } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorsApi.get(id),
  });

  // Pre-fill from existing availability
  useEffect(() => {
    if (doctor?.availability?.length) {
      setSlots((prev) => {
        const next = prev.map((s) => ({ ...s }));
        doctor.availability.forEach((a) => {
          next[a.dayOfWeek] = {
            isAvailable: a.isAvailable,
            startTime: a.startTime,
            endTime: a.endTime,
          };
        });
        return next;
      });
    }
  }, [doctor]);

  const save = useMutation({
    mutationFn: () => {
      const payload: AvailabilitySlotPayload[] = slots.map((s, i) => ({
        dayOfWeek: i,
        ...s,
      }));
      return doctorsApi.setAvailability(id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', id] });
      router.push(`/doctors/${id}`);
    },
  });

  const update = (day: number, field: keyof SlotState, value: string | boolean) => {
    setSlots((prev) => {
      const next = [...prev];
      next[day] = { ...next[day], [field]: value };
      return next;
    });
  };

  // Copy Monday–Friday
  const applyWeekdays = () => {
    const mon = slots[1];
    setSlots((prev) =>
      prev.map((s, i) => (i >= 1 && i <= 5 ? { ...mon } : s)),
    );
  };

  return (
    <div className="p-8 max-w-2xl">
      <Link href={`/doctors/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1D1F] mb-6 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Doctor
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D1F]">Weekly Schedule</h1>
          {doctor && (
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              Dr. {doctor.user.firstName} {doctor.user.lastName}
            </p>
          )}
        </div>
        <button
          onClick={applyWeekdays}
          className="text-xs text-[#6B7280] hover:text-gray-800 border border-[#E2E4DE] px-3 py-1.5 rounded-lg hover:bg-[#F7F8F6] transition"
        >
          Copy Mon–Fri
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm overflow-hidden mb-6">
        <div className="divide-y divide-[#F0F1EE]">
          {DAYS.map((day, i) => (
            <div key={day} className={`px-6 py-4 transition-colors ${slots[i].isAvailable ? '' : 'bg-[#F7F8F6]/60'}`}>
              <div className="flex items-center gap-4">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => update(i, 'isAvailable', !slots[i].isAvailable)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                    slots[i].isAvailable ? 'bg-emerald-500' : 'bg-[#E2E4DE]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-200 ${
                      slots[i].isAvailable ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                {/* Day name */}
                <span className={`w-24 text-sm font-medium ${slots[i].isAvailable ? 'text-[#1A1D1F]' : 'text-[#9CA3AF]'}`}>
                  {day}
                </span>

                {/* Time selects */}
                {slots[i].isAvailable ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <select
                      value={slots[i].startTime}
                      onChange={(e) => update(i, 'startTime', e.target.value)}
                      className="text-sm border border-[#E2E4DE] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-[#9CA3AF] text-sm">—</span>
                    <select
                      value={slots[i].endTime}
                      onChange={(e) => update(i, 'endTime', e.target.value)}
                      className="text-sm border border-[#E2E4DE] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ) : (
                  <span className="ml-auto text-xs text-[#9CA3AF]">Not available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {save.isError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg px-4 py-3 mb-4">
          Failed to save schedule. Please try again.
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {save.isPending ? 'Saving…' : 'Save Schedule'}
        </button>
        <Link
          href={`/doctors/${id}`}
          className="text-sm font-medium text-[#6B7280] hover:text-[#1A1D1F] px-4 py-2.5 rounded-lg border border-[#E2E4DE] hover:bg-[#F7F8F6] transition"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
