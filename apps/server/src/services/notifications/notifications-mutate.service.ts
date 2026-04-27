import { getNotificationsStore } from "./notifications-query.service";

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

export function createNotification(payload: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  issueId?: string;
  teamId?: string;
}) {
  const notificationsStore = getNotificationsStore();

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
}

export function markAsRead(userId: string, notificationId: string) {
  const notificationsStore = getNotificationsStore();
  const notifications = notificationsStore.get(userId) || [];
  const notification = notifications.find((n) => n.id === notificationId);

  if (notification) {
    notification.isRead = true;
    notificationsStore.set(userId, notifications);
  }
}

export function markAllAsRead(userId: string) {
  const notificationsStore = getNotificationsStore();
  const notifications = notificationsStore.get(userId) || [];
  notifications.forEach((n) => (n.isRead = true));
  notificationsStore.set(userId, notifications);
}

export function clearAll(userId: string) {
  const notificationsStore = getNotificationsStore();
  notificationsStore.delete(userId);
}
