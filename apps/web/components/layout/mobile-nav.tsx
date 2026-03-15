'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';
import { NotificationBell } from './notification-bell';

interface MobileNavProps {
  onMenuClick: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
  const { user } = useAuth();

  return (
    <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-[#FAFAF7] border-b border-[#E8E6E1] sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg text-[#6B7280] hover:bg-[#F0EDE8] hover:text-[#1A1D1F] transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#E6F2EF] flex items-center justify-center">
          <svg className="w-4 h-4 text-[#1A6B5C]" viewBox="0 0 32 32" fill="none">
            <path d="M7 18h4l2-5 3 10 2.5-7 2.5 2h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-bold text-[#1A1D1F] text-sm tracking-tight">CareQueue</span>
      </Link>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <div className="w-8 h-8 rounded-full bg-[#1A6B5C] flex items-center justify-center text-white text-xs font-semibold">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>
    </div>
  );
}
