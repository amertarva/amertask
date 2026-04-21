// In-Memory Notification Service
// Notifications are stored in memory and can be sent via WebSocket/SSE in the future

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

export const notificationsService = {
  // Create notification (in-memory)
  createNotification(payload: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    issueId?: string;
    teamId?: string;
  }) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      issueId: payload.issueId,
      teamId: payload.teamId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const userNotifications = notificationsStore.get(payload.userId) || [];
    userNotifications.unshift(notification); // Add to beginning

    // Keep only last 100 notifications per user
    if (userNotifications.length > 100) {
      userNotifications.pop();
    }

    notificationsStore.set(payload.userId, userNotifications);

    console.log(
      `[NOTIFICATION] Created for user ${payload.userId}: ${payload.title}`,
    );

    // In future: emit via WebSocket/SSE
    return notification;
  },

  // Get user notifications
  getUserNotifications(userId: string, filters: { unread?: boolean } = {}) {
    let notifications = notificationsStore.get(userId) || [];

    if (filters.unread) {
      notifications = notifications.filter((n) => !n.isRead);
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      notifications,
      unreadCount,
    };
  },

  // Mark as read
  markAsRead(userId: string, notificationId: string) {
    const notifications = notificationsStore.get(userId) || [];
    const notification = notifications.find((n) => n.id === notificationId);

    if (notification) {
      notification.isRead = true;
      notificationsStore.set(userId, notifications);
    }
  },

  // Mark all as read
  markAllAsRead(userId: string) {
    const notifications = notificationsStore.get(userId) || [];
    notifications.forEach((n) => (n.isRead = true));
    notificationsStore.set(userId, notifications);
  },

  // Clear all notifications for user
  clearAll(userId: string) {
    notificationsStore.delete(userId);
  },
};
