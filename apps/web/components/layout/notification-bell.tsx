'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api/notifications';
import type { AppNotification } from '../../types/notification';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function typeIcon(type: string) {
  switch (type) {
    case 'EMAIL':
      return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
  }
}

function DropdownItem({
  n,
  onMarkRead,
  onClose,
}: {
  n: AppNotification;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="group px-4 py-3 hover:bg-[#F7F8F6] transition-colors cursor-pointer"
      onClick={() => {
        if (!n.isRead) onMarkRead(n.id);
      }}
    >
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className="w-7 h-7 rounded-lg bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
          {typeIcon(n.type)}
        </div>

        <div className="flex-1 min-w-0">
          {n.subject && (
            <p className="text-[13px] font-semibold text-[#1A1D1F] truncate">{n.subject}</p>
          )}
          <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2 mt-0.5">{n.message}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-[#9CA3AF] font-medium">{timeAgo(n.createdAt)}</span>
            {n.appointmentId && (
              <Link
                href={`/appointments/${n.appointmentId}`}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="text-[10px] text-teal-600 hover:underline font-semibold"
              >
                View
              </Link>
            )}
          </div>
        </div>

        {/* Unread indicator */}
        {!n.isRead && (
          <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Unread count — poll every 30s
  const { data: countData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
  });

  // Bell dropdown list — only fetch when open
  const { data: notifData, refetch } = useQuery({
    queryKey: ['notifications-bell'],
    queryFn: () => notificationsApi.list({ page: 1, limit: 10 }),
    enabled: open,
  });

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) setTimeout(() => refetch(), 0);
  };

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-bell'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
      qc.invalidateQueries({ queryKey: ['notifications-page'] });
    },
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-bell'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
      qc.invalidateQueries({ queryKey: ['notifications-page'] });
    },
  });

  const unread = countData?.count ?? 0;
  const notifications = notifData?.data ?? [];
  // Show only unread in dropdown; if none, show all recent
  const unreadNotifs = notifications.filter((n) => !n.isRead);
  const displayNotifs = unreadNotifs.length > 0 ? unreadNotifs : notifications;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        title="Notifications"
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
          open
            ? 'bg-[#1A6B5C]/10 text-[#1A6B5C]'
            : 'text-[#6B7280] hover:text-[#1A1D1F] hover:bg-[#F0EDE8]'
        }`}
      >
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-[#FAFAF7] pointer-events-none animate-in fade-in">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl border border-[#E2E4DE] shadow-2xl shadow-black/8 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E4DE]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1A1D1F]">Notifications</span>
              {unread > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-teal-600 text-white text-[10px] font-bold rounded-full">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold disabled:opacity-50 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F0EDE8]">
            {notifications.length === 0 ? (
              <div className="py-14 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F0F1EE] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#374151]">All caught up!</p>
                <p className="text-xs text-[#9CA3AF] mt-1">No new notifications</p>
              </div>
            ) : (
              displayNotifs.map((n) => (
                <DropdownItem
                  key={n.id}
                  n={n}
                  onMarkRead={(id) => markRead.mutate(id)}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[#E2E4DE] bg-[#FAFAF7]">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs text-teal-600 font-semibold hover:text-teal-700 transition-colors py-0.5"
            >
              View all notifications
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
