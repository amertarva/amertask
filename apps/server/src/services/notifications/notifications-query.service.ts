interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  issueId?: string;
  teamId?: string;
  isRead: boolean;
  createdAt: string;
}

// In-memory store (will be lost on server restart)
const notificationsStore = new Map<string, Notification[]>();

export function getUserNotifications(
  userId: string,
  filters: { unread?: boolean } = {},
) {
  let notifications = notificationsStore.get(userId) || [];

  if (filters.unread) {
    notifications = notifications.filter((n) => !n.isRead);
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
  };
}

export function getNotificationsStore() {
  return notificationsStore;
}
