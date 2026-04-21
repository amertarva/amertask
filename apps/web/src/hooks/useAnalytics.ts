"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { analyticsApi, ApiError } from "@/lib/core";
import { useAuthContext } from "@/contexts/AuthContext";

export function useAnalytics(
  teamSlug: string,
  params: Parameters<typeof analyticsApi.get>[1] = {},
) {
  const { isAuthenticated, status } = useAuthContext();
  const [data, setData] = useState<Awaited<
    ReturnType<typeof analyticsApi.get>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!isAuthenticated || !teamSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyticsApi.get(teamSlug, params);

      if (!isMounted.current) return;
      setData(result);
    } catch (err) {
      if (!isMounted.current) return;
      setError(
        err instanceof ApiError ? err.message : "Gagal memuat analytics.",
      );
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, teamSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (status === "unauthenticated") {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    void fetchAnalytics();
  }, [status, fetchAnalytics]);

  return { data, isLoading, error, refetch: fetchAnalytics };
}
