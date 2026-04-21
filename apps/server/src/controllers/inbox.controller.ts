import { notificationsService } from "../services/notifications.service";

export const inboxController = {
  async list({ currentUser, query }: any) {
    const result = notificationsService.getUserNotifications(currentUser.sub, {
      unread: query.unread === "true",
    });

    return {
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    };
  },

  async markAsRead({ params, currentUser }: any) {
    notificationsService.markAsRead(currentUser.sub, params.id);
    return { message: "Notifikasi ditandai sudah dibaca" };
  },

  async markAllAsRead({ currentUser }: any) {
    notificationsService.markAllAsRead(currentUser.sub);
    return { message: "Semua notifikasi ditandai sudah dibaca" };
  },
};
