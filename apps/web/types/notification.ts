export interface AppNotification {
  id: string;
  userId: string;
  appointmentId?: string;
  type: string;
  subject?: string;
  message: string;
  isRead: boolean;
  sentAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}
