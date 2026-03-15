'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: ['ADMIN', 'CLINIC_STAFF', 'DOCTOR', 'PATIENT'],
  },
  {
    href: '/patients',
    label: 'Patients',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['ADMIN', 'CLINIC_STAFF', 'DOCTOR'],
  },
  {
    href: '/doctors',
    label: 'Doctors',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    roles: ['ADMIN', 'CLINIC_STAFF'],
  },
  {
    href: '/appointments',
    label: 'Appointments',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    roles: ['ADMIN', 'CLINIC_STAFF', 'DOCTOR', 'PATIENT'],
  },
  {
    href: '/profile',
    label: 'My Profile',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    roles: ['ADMIN', 'CLINIC_STAFF', 'DOCTOR', 'PATIENT'],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['ADMIN'],
  },
];

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  CLINIC_STAFF: 'Clinic Staff',
  DOCTOR: 'Doctor',
  PATIENT: 'Patient',
};

export function Sidebar({ onClose }: { onClose?: () => void } = {}) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  const visible = isLoading
    ? [] // render nothing while resolving — avoids flash of wrong items
    : navItems.filter((item) => item.roles.includes(user?.role ?? ''));

  return (
    <aside className="w-[260px] h-full min-h-screen bg-[#FAFAF7] border-r border-[#E8E6E1] flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-11 h-11 rounded-xl bg-[#1A6B5C] flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-6 h-6 text-white" viewBox="0 0 32 32" fill="none">
              <path d="M6 18h4.5l2-6 3.5 11 3-8 2 3h5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="16" cy="9" r="3.5" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.75"/>
            </svg>
          </div>
          <div>
            <p className="text-[16px] font-bold text-[#1A1D1F] leading-none tracking-tight">CareQueue</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5 font-semibold tracking-widest uppercase">Clinic Platform</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#4B5563] hover:bg-[#F0EDE8] transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {isLoading ? (
          /* Skeleton nav items while auth resolves */
          <div className="space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                <div className="w-[18px] h-[18px] rounded bg-[#E8E6E1] animate-pulse shrink-0" />
                <div className="h-3.5 rounded bg-[#E8E6E1] animate-pulse flex-1" style={{ width: `${55 + i * 12}%` }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {visible.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    active
                      ? 'bg-[#1A6B5C] text-white shadow-sm'
                      : 'text-[#4B5563] hover:bg-[#F0EDE8] hover:text-[#1A1D1F]'
                  }`}
                >
                  <span className={active ? 'text-white/90' : 'text-[#9CA3AF]'}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom: User — only shown in mobile drawer (desktop has header) */}
      {onClose && (
        <div className="px-3 py-3 border-t border-[#E8E6E1]">
          {isLoading || !user ? (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E8E6E1] animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 rounded bg-[#E8E6E1] animate-pulse w-24" />
                <div className="h-2.5 rounded bg-[#E8E6E1] animate-pulse w-16" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-[#1A6B5C] flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1D1F] truncate leading-none">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">
                  {roleLabels[user.role] ?? user.role}
                </p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg text-[#9CA3AF] hover:text-rose-500 hover:bg-rose-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
