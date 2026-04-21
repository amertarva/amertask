"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { triageApi, ApiError } from "@/lib/core";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Issue } from "@/types";

export function useTriage(teamSlug: string) {
  const { isAuthenticated, status } = useAuthContext();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchTriage = useCallback(async () => {
    if (!isAuthenticated || !teamSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await triageApi.list(teamSlug);
      const normalizedIssues = (data.issues ?? []).map((issue: any) => ({
        ...issue,
        triageReason: issue.triageReason ?? issue.triage_reason ?? null,
      }));

      if (!isMounted.current) return;
      setIssues(normalizedIssues);
      setTotal(data.total ?? 0);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof ApiError ? err.message : "Gagal memuat triage.");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, teamSlug]);

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (status === "unauthenticated") {
      setIssues([]);
      setTotal(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    void fetchTriage();
  }, [status, fetchTriage]);

  const acceptIssue = useCallback(
    async (
      issueId: string,
      payload?: Parameters<typeof triageApi.accept>[1],
    ) => {
      const updated = await triageApi.accept(issueId, payload);
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
      setTotal((prev) => Math.max(0, prev - 1));
      return updated;
    },
    [],
  );

  const declineIssue = useCallback(
    async (
      issueId: string,
      payload?: Parameters<typeof triageApi.decline>[1],
    ) => {
      await triageApi.decline(issueId, payload);
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
      setTotal((prev) => Math.max(0, prev - 1));
    },
    [],
  );

  const deleteIssue = useCallback(async (issueId: string) => {
    await triageApi.remove(issueId);
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
    setTotal((prev) => Math.max(0, prev - 1));
  }, []);

  return {
    issues,
    total,
    isLoading,
    error,
    acceptIssue,
    declineIssue,
    deleteIssue,
    refetch: fetchTriage,
  };
}
