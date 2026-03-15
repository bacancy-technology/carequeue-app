'use client';

import { useAuth } from '../../contexts/auth-context';
import { NotificationBell } from './notification-bell';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  CLINIC_STAFF: 'Clinic Staff',
  DOCTOR: 'Doctor',
  PATIENT: 'Patient',
};

export function DesktopHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="hidden lg:flex items-center justify-end gap-2 h-14 px-6 bg-[#FAFAF7] border-b border-[#E8E6E1] sticky top-0 z-30">
      <NotificationBell />

      {/* User menu */}
      {user && (
        <div className="flex items-center gap-2.5 ml-1 pl-3 border-l border-[#E8E6E1]">
          <div className="w-8 h-8 rounded-full bg-[#1A6B5C] flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#1A1D1F] leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">
              {roleLabels[user.role] ?? user.role}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-rose-500 hover:bg-rose-50 transition-colors ml-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
}
