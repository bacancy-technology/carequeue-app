'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/auth-context';
import { PasswordInput } from '../../components/ui/password-input';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      await login(data);
    } catch {
      setServerError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F7F8F6]">
      {/* Left panel — branding (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex-col justify-between p-12 shrink-0 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-500/5 rounded-full translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-4 mb-16 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/40 transition-shadow">
              <svg className="w-8 h-8 text-white" viewBox="0 0 32 32" fill="none">
                <path d="M7 18h4l2-5 3 10 2.5-7 2.5 2h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="16" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" fill="none" opacity="0.7"/>
              </svg>
            </div>
            <span className="font-extrabold text-white text-2xl tracking-tight group-hover:text-teal-300 transition-colors">CareQueue</span>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-5">
            Healthcare<br />scheduling,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">simplified.</span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Manage appointments, patients, and doctors in one modern platform built for busy clinics.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'Real-time availability checking',
              'Automated email notifications',
              'Role-based access control',
              'Mobile-friendly interface',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-500/15 border border-teal-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs relative z-10">&copy; {new Date().getFullYear()} CareQueue. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden text-center mb-8 block group">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 mb-3 shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/40 transition-shadow">
              <svg className="w-8 h-8 text-white" viewBox="0 0 32 32" fill="none">
                <path d="M7 18h4l2-5 3 10 2.5-7 2.5 2h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="16" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" fill="none" opacity="0.7"/>
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1A1D1F] group-hover:text-teal-600 transition-colors">CareQueue</h1>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-[#1A1D1F]">Welcome back</h1>
            <p className="text-[#6B7280] mt-1 text-sm">Sign in to your CareQueue account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A1D1F] mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E4DE] bg-white text-[#1A1D1F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-shadow"
                placeholder="you@clinic.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-[#1A1D1F]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-teal-600 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                {...register('password')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E4DE] bg-white text-[#1A1D1F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-shadow"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            New patient?{' '}
            <Link href="/register" className="text-teal-600 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
