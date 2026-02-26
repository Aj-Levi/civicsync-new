import { create } from "zustand";
import { dummyNotifications, type Notification } from "../data/dummyData";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<Notification, "id" | "read">) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: dummyNotifications,
  unreadCount: dummyNotifications.filter((n) => !n.read).length,

  markRead: (id: string) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
  },

  markAllRead: () => {
    set({
      notifications: get().notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });
  },

  addNotification: (n) => {
    const newN: Notification = {
      ...n,
      id: `n${Date.now()}`,
      read: false,
    };
    const updated = [newN, ...get().notifications];
    set({
      notifications: updated,
      unreadCount: updated.filter((x) => !x.read).length,
    });
  },
}));
