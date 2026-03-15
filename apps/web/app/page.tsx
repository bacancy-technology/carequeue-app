'use client';

import Link from 'next/link';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/* ── Scroll-triggered wrapper ──────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = '',
  y = 60,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SlideIn({
  children,
  direction = 'left',
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const x = direction === 'left' ? -80 : 80;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ScaleIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.6, delay, type: 'spring', stiffness: 100, damping: 15 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-teal-600" />
      <path d="M7 18h4l2-5 3 10 2.5-7 2.5 2h4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="16" cy="10" r="3" stroke="#2DD4BF" strokeWidth="1.8" fill="none"/>
      <path d="M16 13v2" stroke="#2DD4BF" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroBgY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#1A1D1F]">
      {/* Nav */}
      <motion.header
        className="sticky top-0 z-50 bg-[#F7F8F6]/80 backdrop-blur-xl border-b border-[#E2E4DE]"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Logo />
            <span className="font-bold text-[#1A1D1F] text-base tracking-tight">CareQueue</span>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/login"
              className="text-sm font-medium text-[#6B7280] hover:text-[#1A1D1F] transition-colors"
            >
              Sign in
            </Link>
            <motion.span whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/register"
                className="text-sm font-semibold bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors inline-block"
              >
                Get started
              </Link>
            </motion.span>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-teal-50/80 via-transparent to-amber-50/40"
          style={{ y: heroBgY }}
        />
        {/* Floating orbs — continuous drift */}
        <motion.div
          className="absolute top-20 right-[10%] w-72 h-72 bg-teal-300/25 rounded-full blur-3xl"
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 left-[5%] w-48 h-48 bg-amber-300/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 25, -15, 0],
            scale: [1, 0.9, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[40%] left-[50%] w-56 h-56 bg-teal-200/15 rounded-full blur-3xl"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-teal-100"
              animate={{ boxShadow: ['0 0 0 0 rgba(20,184,166,0)', '0 0 0 8px rgba(20,184,166,0.15)', '0 0 0 0 rgba(20,184,166,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              Trusted by 500+ clinics
            </motion.div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-[#1A1D1F] leading-[1.1] tracking-tight mb-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            Patient care starts with
            <motion.span
              className="bg-[length:200%_auto] bg-clip-text text-transparent inline-block"
              style={{
                backgroundImage: 'linear-gradient(90deg, #0d9488, #14b8a6, #5eead4, #14b8a6, #0d9488)',
              }}
              initial={{ opacity: 0, x: -40 }}
              animate={{
                opacity: 1,
                x: 0,
                backgroundPosition: ['0% center', '100% center', '0% center'],
              }}
              transition={{
                opacity: { duration: 0.8, delay: 0.8 },
                x: { duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] },
                backgroundPosition: { duration: 4, repeat: Infinity, ease: 'linear', delay: 1.5 },
              }}
            >
              {' '}better scheduling
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-lg text-[#6B7280] max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            CareQueue streamlines appointments, doctor availability, and clinic operations — all in one platform built for the way modern clinics actually work.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <motion.span whileHover={{ scale: 1.08, y: -3 }} whileTap={{ scale: 0.95 }} className="relative inline-block">
              <motion.span
                className="absolute inset-0 rounded-2xl bg-teal-400/30"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Link
                href="/register"
                className="relative inline-flex items-center justify-center gap-2 bg-teal-600 text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
              >
                Start for free
                <motion.svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </motion.svg>
              </Link>
            </motion.span>
            <motion.span whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#1A1D1F] font-semibold px-7 py-3.5 rounded-2xl border border-[#E2E4DE] hover:border-[#C4C8Be] hover:bg-[#FAFBF9] transition-colors"
              >
                Sign in to your account
              </Link>
            </motion.span>
          </motion.div>

          {/* Stats row */}
          <div className="mt-20 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: '10k+', label: 'Appointments' },
              { value: '500+', label: 'Clinics' },
              { value: '99.9%', label: 'Uptime' },
            ].map((s, i) => (
              <ScaleIn key={s.label} delay={1.1 + i * 0.15}>
                <motion.div
                  className="bg-white/80 backdrop-blur-sm border border-[#E2E4DE] rounded-2xl p-4 shadow-sm"
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.5,
                  }}
                  whileHover={{ scale: 1.08, boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
                >
                  <p className="text-2xl font-extrabold text-[#1A1D1F]">{s.value}</p>
                  <p className="text-xs text-[#6B7280] mt-1 font-medium">{s.label}</p>
                </motion.div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-y border-[#E2E4DE] py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeUp y={50}>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-3">Platform</p>
              <h2 className="text-3xl font-extrabold text-[#1A1D1F] mb-3">Everything your clinic needs</h2>
              <p className="text-[#6B7280] max-w-xl mx-auto">
                From patient intake to appointment completion, CareQueue handles it all.
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <SlideIn
                key={f.title}
                direction={i % 2 === 0 ? 'left' : 'right'}
                delay={i * 0.12}
              >
                <motion.div
                  className="p-6 rounded-2xl bg-[#F7F8F6] border border-[#E2E4DE] hover:border-teal-300 transition-all duration-300 group h-full"
                  whileHover={{
                    scale: 1.04,
                    y: -8,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                  >
                    {f.icon}
                  </motion.div>
                  <h3 className="text-[15px] font-bold text-[#1A1D1F] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{f.description}</p>
                </motion.div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <FadeUp y={50}>
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3">Roles</p>
            <h2 className="text-3xl font-extrabold text-[#1A1D1F] mb-3">Built for every role</h2>
            <p className="text-[#6B7280]">One platform, four perspectives.</p>
          </div>
        </FadeUp>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((r, i) => (
            <ScaleIn key={r.role} delay={i * 0.15}>
              <motion.div
                className="p-6 rounded-2xl bg-white border border-[#E2E4DE] text-center group h-full"
                whileHover={{
                  scale: 1.06,
                  y: -10,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className={`w-14 h-14 rounded-2xl ${r.color} flex items-center justify-center mx-auto mb-4`}
                  animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                  whileHover={{ rotate: 360, scale: 1.15 }}
                >
                  {r.icon}
                </motion.div>
                <p className="font-bold text-[#1A1D1F] text-sm">{r.role}</p>
                <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">{r.description}</p>
              </motion.div>
            </ScaleIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] py-20 overflow-hidden relative">
        {/* Floating particles */}
        {[
          { left: '10%', top: '20%', size: 6, dur: 5 },
          { left: '25%', top: '70%', size: 4, dur: 7 },
          { left: '50%', top: '15%', size: 8, dur: 6 },
          { left: '70%', top: '60%', size: 5, dur: 8 },
          { left: '85%', top: '30%', size: 4, dur: 5.5 },
          { left: '40%', top: '80%', size: 6, dur: 9 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-teal-400/20"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
            animate={{
              y: [0, -25, 0],
              x: [0, i % 2 === 0 ? 15 : -15, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          />
        ))}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <FadeUp y={60}>
            <h2 className="text-3xl font-extrabold text-white mb-4">Ready to streamline your clinic?</h2>
          </FadeUp>
          <FadeUp y={40} delay={0.2}>
            <p className="text-slate-400 mb-10 text-lg">Join hundreds of clinics already using CareQueue to manage appointments effortlessly.</p>
          </FadeUp>
          <ScaleIn delay={0.4}>
            <motion.span
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-block"
            >
              <motion.span
                className="absolute inset-0 rounded-2xl bg-teal-400/25"
                animate={{
                  scale: [1, 1.35, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Link
                href="/register"
                className="relative inline-flex items-center gap-2 bg-teal-500 text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"
              >
                Get started for free
              </Link>
            </motion.span>
          </ScaleIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E4DE] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="font-bold text-sm text-[#1A1D1F]">CareQueue</span>
          </div>
          <p className="text-xs text-[#6B7280]">
            &copy; {new Date().getFullYear()} CareQueue. Modern clinic scheduling.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-[#6B7280] hover:text-[#1A1D1F] transition-colors">Sign in</Link>
            <Link href="/register" className="text-xs text-[#6B7280] hover:text-[#1A1D1F] transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: 'Smart Scheduling',
    description: 'Book appointments with real-time availability checks and automatic conflict detection.',
    iconBg: 'bg-teal-100',
    icon: (
      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Patient Records',
    description: 'Maintain comprehensive patient profiles with medical history and clinical notes.',
    iconBg: 'bg-amber-100',
    icon: (
      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Doctor Availability',
    description: 'Doctors manage their own schedules, leaves, and consultation time slots.',
    iconBg: 'bg-violet-100',
    icon: (
      <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Email Notifications',
    description: 'Automated email reminders keep patients and doctors informed at every step.',
    iconBg: 'bg-sky-100',
    icon: (
      <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Role-Based Access',
    description: 'Fine-grained permissions for Admins, Staff, Doctors, and Patients.',
    iconBg: 'bg-rose-100',
    icon: (
      <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Calendar View',
    description: 'Visualise your entire schedule in a beautiful, interactive calendar interface.',
    iconBg: 'bg-emerald-100',
    icon: (
      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
];

const roles = [
  {
    role: 'Administrator',
    description: 'Full clinic oversight, staff management, and system configuration.',
    color: 'bg-teal-100',
    icon: (
      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    role: 'Clinic Staff',
    description: 'Book appointments, manage patients, and handle day-to-day operations.',
    color: 'bg-amber-100',
    icon: (
      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    role: 'Doctor',
    description: 'Manage availability, view schedules, and access patient information.',
    color: 'bg-violet-100',
    icon: (
      <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    role: 'Patient',
    description: 'Book appointments, view history, and receive timely notifications.',
    color: 'bg-sky-100',
    icon: (
      <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];
