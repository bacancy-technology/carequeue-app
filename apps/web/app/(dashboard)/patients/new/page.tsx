'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { patientsApi } from '../../../../lib/api/patients';
import { PasswordInput } from '../../../../components/ui/password-input';
import { formatPhone, PHONE_REGEX, PHONE_MESSAGE } from '../../../../lib/utils/phone';

const schema = z.object({
  firstName:        z.string().min(1, 'Required').max(50, 'Too long'),
  lastName:         z.string().min(1, 'Required').max(50, 'Too long'),
  email:            z.string().email('Invalid email'),
  password:         z.string().min(8, 'Min 8 characters'),
  dateOfBirth:      z.string().min(1, 'Required'),
  gender:           z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone:            z.string().regex(PHONE_REGEX, PHONE_MESSAGE),
  address:          z.string().min(1, 'Required').max(200, 'Too long'),
  emergencyContact: z.string().max(100, 'Too long').optional(),
  medicalHistory:   z.string().max(2000, 'Too long').optional(),
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

export default function NewPatientPage() {
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const create = useMutation({
    mutationFn: patientsApi.create,
    onSuccess: (patient) => router.push(`/patients/${patient.id}`),
  });

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1D1F] mb-6 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Patients
      </Link>

      <h1 className="text-2xl font-bold text-[#1A1D1F] mb-6">Add New Patient</h1>

      <form onSubmit={handleSubmit((data) => create.mutate(data))} className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#374151]">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" error={errors.firstName?.message}>
              <input {...register('firstName')} className={inputCls} placeholder="John" maxLength={50} />
            </Field>
            <Field label="Last Name" error={errors.lastName?.message}>
              <input {...register('lastName')} className={inputCls} placeholder="Doe" maxLength={50} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
              <input type="date" {...register('dateOfBirth')} className={inputCls} max={new Date().toISOString().split('T')[0]} />
            </Field>
            <Field label="Gender" error={errors.gender?.message}>
              <select {...register('gender')} className={inputCls}>
                <option value="">Select…</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
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
          <Field label="Address" error={errors.address?.message}>
            <input {...register('address')} className={inputCls} placeholder="123 Main St, City, State" maxLength={200} />
          </Field>
          <Field label="Emergency Contact" error={errors.emergencyContact?.message}>
            <input {...register('emergencyContact')} className={inputCls} placeholder="Name — (555) 123-4567 (optional)" maxLength={100} />
          </Field>
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#374151]">Login Account</h2>
          <Field label="Email" error={errors.email?.message}>
            <input type="email" {...register('email')} className={inputCls} placeholder="patient@email.com" />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <PasswordInput {...register('password')} className={inputCls} placeholder="Min 8 characters" />
          </Field>
        </div>

        {/* Medical */}
        <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-6">
          <h2 className="text-sm font-semibold text-[#374151] mb-4">Medical History</h2>
          <Field label="Notes (optional)" error={errors.medicalHistory?.message}>
            <textarea
              {...register('medicalHistory')}
              rows={4}
              className={inputCls + ' resize-none'}
              placeholder="Pre-existing conditions, allergies, medications…"
              maxLength={2000}
            />
          </Field>
        </div>

        {create.isError && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg px-4 py-3">
            Failed to create patient. Email may already be in use.
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={create.isPending}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {create.isPending ? 'Saving…' : 'Create Patient'}
          </button>
          <Link
            href="/patients"
            className="text-sm font-medium text-[#6B7280] hover:text-[#1A1D1F] px-4 py-2.5 rounded-lg border border-[#E2E4DE] hover:bg-[#F7F8F6] transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
