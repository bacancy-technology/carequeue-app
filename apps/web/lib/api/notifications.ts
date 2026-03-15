import api from '../axios';
import type { NotificationsResponse } from '../../types/notification';

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<NotificationsResponse>('/notifications', { params }).then((r) => r.data),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    api.patch('/notifications/read-all').then((r) => r.data),

  markUnread: (id: string) =>
    api.patch(`/notifications/${id}/unread`).then((r) => r.data),
};
