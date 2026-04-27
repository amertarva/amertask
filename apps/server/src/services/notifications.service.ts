export { getUserNotifications } from "./notifications/notifications-query.service";
export {
  createNotification,
  markAsRead,
  markAllAsRead,
  clearAll,
} from "./notifications/notifications-mutate.service";

import { getUserNotifications } from "./notifications/notifications-query.service";
import {
  createNotification,
  markAsRead,
  markAllAsRead,
  clearAll,
} from "./notifications/notifications-mutate.service";

export const notificationsService = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  clearAll,
};
