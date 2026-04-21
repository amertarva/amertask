"use client";

import { useState, useEffect, useCallback } from "react";
import { usersApi, ApiError } from "@/lib/core";
import { useAuthContext } from "@/contexts/AuthContext";
import type { UserActivity } from "@/lib/core/users.api";

export function useUserActivity() {
  const { status, isAuthenticated } = useAuthContext();
  const [data, setData] = useState<UserActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (status !== "authenticated" || !isAuthenticated) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await usersApi.getUserActivity();
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal memuat aktivitas.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, status]);

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (status !== "authenticated" || !isAuthenticated) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    void fetchActivity();
  }, [fetchActivity, isAuthenticated, status]);

  return { data, isLoading, error, refetch: fetchActivity };
}
