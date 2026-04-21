import { apiClient } from "./http";

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  issueId?: string;
  teamId?: string;
  isRead: boolean;
  createdAt: string;
}

interface InboxResponse {
  notifications: Notification[];
  unreadCount: number;
}

interface InboxParams {
  unread?: boolean;
}

export const inboxApi = {
  list: (params: InboxParams = {}): Promise<InboxResponse> => {
    const qs = new URLSearchParams();
    if (params.unread) qs.set("unread", "true");
    const query = qs.toString() ? `?${qs}` : "";
    return apiClient(`/inbox${query}`);
  },

  markAsRead: (notificationId: string): Promise<{ message: string }> =>
    apiClient(`/inbox/${notificationId}/read`, { method: "PATCH" }),

  markAllAsRead: (): Promise<{ message: string }> =>
    apiClient("/inbox/read-all", { method: "PATCH" }),
};
