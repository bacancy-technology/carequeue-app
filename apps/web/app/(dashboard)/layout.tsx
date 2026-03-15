'use client';

import { useState } from 'react';
import { Sidebar } from '../../components/layout/sidebar';
import { MobileNav } from '../../components/layout/mobile-nav';
import { DesktopHeader } from '../../components/layout/desktop-header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[--background]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[260px] z-50 shadow-2xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <MobileNav onMenuClick={() => setSidebarOpen(true)} />

        {/* Desktop top bar */}
        <DesktopHeader />

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
