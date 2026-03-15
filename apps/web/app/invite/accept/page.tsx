'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../../lib/api/auth';
import { useAuth } from '../../../contexts/auth-context';
import { PasswordInput } from '../../../components/ui/password-input';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type InviteForm = z.infer<typeof schema>;

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E4DE] bg-white text-[#1A1D1F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-shadow';

function AcceptInviteForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token) {
      setServerError('Invalid or missing invite token. Please contact your administrator.');
    }
  }, [token]);

  const onSubmit = async (data: InviteForm) => {
    if (!token) return;
    setServerError('');
    try {
      const { user, accessToken } = await authApi.acceptInvite(token, data.password);
      setSession(user, accessToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: unknown } } };
      const msg = error?.response?.data?.message;
      setServerError(
        typeof msg === 'string' ? msg
        : Array.isArray(msg) ? msg.join(', ')
        : 'Invite failed. The link may have expired. Please contact your administrator.'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Password</label>
        <PasswordInput {...register('password')} className={inputCls} placeholder="At least 8 characters" />
        {errors.password && <p className="mt-1.5 text-xs text-rose-600">{errors.password.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Confirm Password</label>
        <PasswordInput {...register('confirmPassword')} className={inputCls} placeholder="Re-enter your password" />
        {errors.confirmPassword && (
          <p className="mt-1.5 text-xs text-rose-600">{errors.confirmPassword.message}</p>
        )}
      </div>
      {serverError && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {serverError}
        </div>
      )}
      <button
        type="submit"
        disabled={isSubmitting || !token}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm disabled:opacity-60"
      >
        {isSubmitting ? 'Setting up...' : 'Set Password & Get Started'}
      </button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F6] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1A6B5C] mb-4 hover:opacity-90 transition-opacity">
            <svg className="w-6 h-6 text-white" viewBox="0 0 32 32" fill="none">
              <path d="M6 18h4.5l2-6 3.5 11 3-8 2 3h5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="16" cy="9" r="3.5" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.75"/>
            </svg>
          </Link>
          <h1 className="text-2xl font-extrabold text-[#1A1D1F]">Welcome to CareQueue</h1>
          <p className="text-[#6B7280] mt-1 text-sm">Set your password to activate your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E4DE] p-8 shadow-sm">
          <Suspense fallback={<div className="text-center text-sm text-[#6B7280] py-4">Loading...</div>}>
            <AcceptInviteForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
