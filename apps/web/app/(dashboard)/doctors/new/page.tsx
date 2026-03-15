'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { doctorsApi } from '../../../../lib/api/doctors';
import { formatPhone, PHONE_REGEX, PHONE_MESSAGE } from '../../../../lib/utils/phone';

const schema = z.object({
  firstName:      z.string().min(1, 'Required').max(50, 'Too long'),
  lastName:       z.string().min(1, 'Required').max(50, 'Too long'),
  email:          z.string().email('Invalid email'),
  specialization: z.string().min(1, 'Required'),
  licenseNumber:  z.string().min(1, 'Required').max(30, 'Too long'),
  phone:          z.string().regex(PHONE_REGEX, PHONE_MESSAGE),
  bio:            z.string().max(500, 'Too long').optional(),
});
type FormData = z.infer<typeof schema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#374151] mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-[#E2E4DE] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition';

const SPECIALIZATIONS = [
  'General Practice', 'Cardiology', 'Dermatology', 'Neurology',
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery',
];

export default function NewDoctorPage() {
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const create = useMutation({
    mutationFn: doctorsApi.create,
    onSuccess: (doctor) => router.push(`/doctors/${doctor.id}`),
  });

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/doctors" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1D1F] mb-6 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Doctors
      </Link>

      <h1 className="text-2xl font-bold text-[#1A1D1F] mb-6">Add New Doctor</h1>

      <form onSubmit={handleSubmit((d) => create.mutate(d))} className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#374151]">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" error={errors.firstName?.message}>
              <input {...register('firstName')} className={inputCls} placeholder="Jane" maxLength={50} />
            </Field>
            <Field label="Last Name" error={errors.lastName?.message}>
              <input {...register('lastName')} className={inputCls} placeholder="Smith" maxLength={50} />
            </Field>
          </div>
          <Field label="Phone" error={errors.phone?.message}>
            <input
              {...register('phone')}
              className={inputCls}
              placeholder="(555) 123-4567"
              maxLength={14}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setValue('phone', formatted, { shouldValidate: true });
              }}
            />
          </Field>
        </div>

        {/* Professional */}
        <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#374151]">Professional Details</h2>
          <Field label="Specialization" error={errors.specialization?.message}>
            <select {...register('specialization')} className={inputCls}>
              <option value="">Select specialization…</option>
              {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="License Number" error={errors.licenseNumber?.message}>
            <input {...register('licenseNumber')} className={inputCls} placeholder="MD-12345" maxLength={30} />
          </Field>
          <Field label="Bio (optional)" error={errors.bio?.message}>
            <textarea {...register('bio')} rows={3} className={inputCls + ' resize-none'}
              placeholder="Brief professional background…" maxLength={500} />
          </Field>
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#374151]">Login Account</h2>
          <Field label="Email" error={errors.email?.message}>
            <input type="email" {...register('email')} className={inputCls} placeholder="doctor@clinic.com" />
          </Field>
          <p className="text-xs text-[#6B7280] bg-[#F7F8F6] rounded-lg px-3 py-2">
            An invite email will be sent to the doctor to set up their password.
          </p>
        </div>

        {create.isError && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg px-4 py-3">
            {(() => {
              const err = create.error as { response?: { data?: { message?: unknown } }; message?: string };
              const msg = err?.response?.data?.message;
              if (Array.isArray(msg)) return msg.join(', ');
              if (typeof msg === 'string') return msg;
              return err?.message || 'Failed to create doctor. Please try again.';
            })()}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={create.isPending}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-60">
            {create.isPending ? 'Saving…' : 'Create Doctor'}
          </button>
          <Link href="/doctors"
            className="text-sm font-medium text-[#6B7280] hover:text-[#1A1D1F] px-4 py-2.5 rounded-lg border border-[#E2E4DE] hover:bg-[#F7F8F6] transition">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
