"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from "react";
import { issuesApi, ApiError } from "@/lib/core";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Issue } from "@/types";

interface IssueFilters {
  status?: string;
  priority?: string;
  labels?: string;
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseIssuesState {
  issues: Issue[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
}

export function useIssues(teamSlug: string, initialFilters: IssueFilters = {}) {
  const { status, isAuthenticated } = useAuthContext();
  const [filters, setFilters] = useState<IssueFilters>(initialFilters);
  const [state, setState] = useState<UseIssuesState>({
    issues: [],
    pagination: null,
    isLoading: true,
    error: null,
  });

  const fetchIssues = useCallback(
    async (currentFilters: IssueFilters) => {
      if (status !== "authenticated" || !isAuthenticated || !teamSlug) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await issuesApi.list(teamSlug, currentFilters);
        setState({
          issues: data?.issues ?? [],
          pagination: data?.pagination ?? null,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Gagal memuat issues. Coba refresh halaman.";

        console.error("[useIssues] fetch error:", err);
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    [isAuthenticated, status, teamSlug],
  );

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated" || !isAuthenticated || !teamSlug) {
      setState((prev) => ({
        ...prev,
        issues: [],
        pagination: null,
        isLoading: false,
        error: null,
      }));
      return;
    }

    void fetchIssues(filters);
  }, [fetchIssues, filters, isAuthenticated, status, teamSlug]);

  const createIssue = useCallback(
    async (payload: Parameters<typeof issuesApi.create>[1]) => {
      const issue = await issuesApi.create(teamSlug, payload);
      setState((prev) => ({ ...prev, issues: [issue, ...prev.issues] }));
      return issue;
    },
    [teamSlug],
  );

  const updateIssue = useCallback(
    async (id: string, payload: Parameters<typeof issuesApi.update>[1]) => {
      const updated = await issuesApi.update(id, payload);
      setState((prev) => ({
        ...prev,
        issues: prev.issues.map((i) => (i.id === id ? updated : i)),
      }));
      return updated;
    },
    [],
  );

  const deleteIssue = useCallback(async (id: string) => {
    await issuesApi.remove(id);
    setState((prev) => ({
      ...prev,
      issues: prev.issues.filter((i) => i.id !== id),
    }));
  }, []);

  const refetch = useCallback(
    () => fetchIssues(filters),
    [fetchIssues, filters],
  );

  const applyFilters = useCallback((newFilters: IssueFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const getTeamIssues = useCallback(
    async (slug: string) => {
      if (status !== "authenticated" || !isAuthenticated) {
        return [];
      }

      try {
        const data = await issuesApi.list(slug, {});
        return data.issues;
      } catch (err) {
        console.error("Error fetching team issues:", err);
        return [];
      }
    },
    [isAuthenticated, status],
  );

  return {
    issues: state.issues,
    pagination: state.pagination,
    isLoading: state.isLoading,
    error: state.error,
    createIssue,
    updateIssue,
    deleteIssue,
    refetch,
    applyFilters,
    filters,
    getTeamIssues,
  };
}
