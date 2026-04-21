"use client";

import { useState, useEffect, useCallback } from "react";
import { inboxApi, ApiError } from "@/lib/core";
import { useAuthContext } from "@/contexts/AuthContext";

export function useInbox(params: Parameters<typeof inboxApi.list>[0] = {}) {
  const { status, isAuthenticated } = useAuthContext();
  const [notifications, setNotifications] = useState<
    Awaited<ReturnType<typeof inboxApi.list>>["notifications"]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    if (status !== "authenticated" || !isAuthenticated) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await inboxApi.list(params);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat inbox.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (status !== "authenticated" || !isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    void fetchInbox();
  }, [fetchInbox, isAuthenticated, status]);

  const markAsRead = useCallback(async (id: string) => {
    await inboxApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await inboxApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchInbox,
  };
}
