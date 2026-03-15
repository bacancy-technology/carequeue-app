'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../lib/api/auth';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});
type ForgotForm = z.infer<typeof schema>;

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-[#E2E4DE] bg-white text-[#1A1D1F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-shadow';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ForgotForm) => {
    setError('');
    try {
      await authApi.forgotPassword(data.email);
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8F6] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 mb-4 hover:bg-teal-700 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </Link>
          <h1 className="text-2xl font-extrabold text-[#1A1D1F]">Forgot Password</h1>
          <p className="text-[#6B7280] mt-1 text-sm">We&apos;ll send you a reset link</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E4DE] p-8 shadow-sm">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[#1A1D1F] font-semibold">Check your email</p>
              <p className="text-sm text-[#6B7280] mt-1">
                If that email is registered, you&apos;ll receive a reset link shortly.
              </p>
              <Link href="/login" className="mt-4 inline-block text-sm text-teal-600 hover:underline font-semibold">
                Back to Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-[#1A1D1F] mb-1.5">Email address</label>
                <input type="email" {...register('email')} className={inputCls} placeholder="jane@example.com" />
                {errors.email && <p className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>}
              </div>
              {error && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm disabled:opacity-60"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-teal-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
