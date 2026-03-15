'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../../lib/api/notifications';
import { TableSkeleton } from '../../../components/ui/skeleton';
import type { AppNotification } from '../../../types/notification';

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type Tab = 'unread' | 'read';

function NotificationRow({
  n,
  onMarkRead,
  onMarkUnread,
}: {
  n: AppNotification;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-start gap-4 px-5 py-4 transition-colors ${
        !n.isRead
          ? 'bg-teal-50/30 hover:bg-teal-50/60'
          : 'hover:bg-[#F9F8F6]'
      }`}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
        !n.isRead ? 'bg-teal-600 text-white' : 'bg-[#F0F1EE] text-[#6B7280]'
      }`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {n.subject && (
              <p className={`text-sm mb-0.5 truncate ${!n.isRead ? 'font-bold text-[#1A1D1F]' : 'font-semibold text-[#374151]'}`}>
                {n.subject}
              </p>
            )}
            <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-2">{n.message}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-[#9CA3AF] font-medium">{timeAgo(n.createdAt)}</span>
              <span className="text-[10px] text-[#D1D5DB]" title={formatDate(n.createdAt)}>
                {formatDate(n.createdAt)}
              </span>
              {n.sentAt && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Sent
                </span>
              )}
              {n.appointmentId && (
                <Link
                  href={`/appointments/${n.appointmentId}`}
                  className="text-xs text-teal-600 hover:underline font-semibold"
                >
                  View appointment
                </Link>
              )}
            </div>
          </div>

          {/* Action button — visible on hover */}
          <div className={`shrink-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            {!n.isRead ? (
              <button
                onClick={() => onMarkRead(n.id)}
                title="Mark as read"
                className="text-xs text-[#6B7280] hover:text-teal-600 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-teal-50 transition-colors whitespace-nowrap"
              >
                Mark read
              </button>
            ) : (
              <button
                onClick={() => onMarkUnread(n.id)}
                title="Mark as unread"
                className="text-xs text-[#6B7280] hover:text-teal-600 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-teal-50 transition-colors whitespace-nowrap"
              >
                Mark unread
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('unread');
  const [page, setPage] = useState(1);
  const limit = 20;
  const qc = useQueryClient();

  // Reset page when switching tabs
  const switchTab = (t: Tab) => {
    setTab(t);
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page', page],
    queryFn: () => notificationsApi.list({ page, limit }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-page'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
      qc.invalidateQueries({ queryKey: ['notifications-bell'] });
    },
  });

  const markUnread = useMutation({
    mutationFn: (id: string) => notificationsApi.markUnread(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-page'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
      qc.invalidateQueries({ queryKey: ['notifications-bell'] });
    },
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-page'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
      qc.invalidateQueries({ queryKey: ['notifications-bell'] });
    },
  });

  const allNotifications = data?.data ?? [];
  const unreadCount = data?.unread ?? 0;
  const readCount = (data?.total ?? 0) - unreadCount;

  // Filter based on active tab
  const filtered = allNotifications.filter((n) =>
    tab === 'unread' ? !n.isRead : n.isRead
  );

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1A1D1F]">Notifications</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Stay up to date with your appointments and updates
          </p>
        </div>
        {unreadCount > 0 && tab === 'unread' && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="text-sm text-teal-600 border border-teal-600/30 px-4 py-2 rounded-xl hover:bg-teal-50 transition-colors font-semibold disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-[#F0F1EE] rounded-xl p-1 w-fit">
        <button
          onClick={() => switchTab('unread')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'unread'
              ? 'bg-white text-[#1A1D1F] shadow-sm'
              : 'text-[#6B7280] hover:text-[#1A1D1F]'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full ${
              tab === 'unread' ? 'bg-teal-600 text-white' : 'bg-[#E2E4DE] text-[#6B7280]'
            }`}>
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => switchTab('read')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'read'
              ? 'bg-white text-[#1A1D1F] shadow-sm'
              : 'text-[#6B7280] hover:text-[#1A1D1F]'
          }`}
        >
          Already seen
          {readCount > 0 && (
            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full ${
              tab === 'read' ? 'bg-[#374151] text-white' : 'bg-[#E2E4DE] text-[#6B7280]'
            }`}>
              {readCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-2xl border border-[#E2E4DE] overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={2} />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F0F1EE] flex items-center justify-center mx-auto mb-4">
              {tab === 'unread' ? (
                <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
            </div>
            {tab === 'unread' ? (
              <>
                <p className="text-sm font-semibold text-[#374151]">All caught up!</p>
                <p className="text-xs text-[#9CA3AF] mt-1">No unread notifications</p>
                {readCount > 0 && (
                  <button
                    onClick={() => switchTab('read')}
                    className="mt-4 text-xs text-teal-600 font-semibold hover:underline"
                  >
                    View previously seen notifications
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#374151]">No read notifications</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Notifications you&apos;ve seen will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#F0EDE8]">
            {filtered.map((n) => (
              <NotificationRow
                key={n.id}
                n={n}
                onMarkRead={(id) => markRead.mutate(id)}
                onMarkUnread={(id) => markUnread.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E4DE] text-sm">
            <p className="text-[#9CA3AF] text-xs font-medium">Page {page} of {totalPages}</p>
            <div className="flex gap-1.5">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-[#E2E4DE] text-[#1A1D1F] disabled:opacity-40 hover:bg-[#F0F1EE] transition-colors text-xs font-medium">
                Prev
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-[#E2E4DE] text-[#1A1D1F] disabled:opacity-40 hover:bg-[#F0F1EE] transition-colors text-xs font-medium">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
