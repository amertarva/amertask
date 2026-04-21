"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useRef } from "react";
import { teamsApi, usersApi, tokenStorage, ApiError } from "@/lib/core";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Team } from "@/types";

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 60000;
const MAX_FETCH_RETRIES = 3;
const MAX_EMPTY_RESPONSE_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 800;

type TeamWithRole = Team & { role: string };

interface UseTeamsResult {
  teams: TeamWithRole[];
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  refetch: () => Promise<void>;
  getTeamBySlug: (
    slug: string,
    skipCache?: boolean,
  ) => Promise<Awaited<ReturnType<typeof teamsApi.getBySlug>>>;
}

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCacheKey(key: string) {
  cache.delete(key);
}

export function useTeams(): UseTeamsResult {
  const { status, isAuthenticated } = useAuthContext();
  const [teams, setTeams] = useState<TeamWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRetryTimer = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearRetryTimer();
    };
  }, [clearRetryTimer]);

  const fetchTeams = useCallback(
    async (attempt = 1, skipCache = false): Promise<void> => {
      if (status !== "authenticated" || !isAuthenticated) {
        return;
      }

      // LOG diagnosis to validate auth state at fetch time.
      console.log("🏃 useTeams fetchTeams dipanggil:", {
        isAuthenticated,
        status,
        tokenAda:
          typeof window === "undefined"
            ? "SSR"
            : !!localStorage.getItem("amertask_access_token"),
        waktu: new Date().toISOString(),
        attempt,
      });

      if (isFetchingRef.current) {
        console.log("useTeams fetch dilewati karena request masih berjalan");
        return;
      }

      const cacheKey = "teams-list";
      const scheduleRetry = (nextAttempt: number, reason: string) => {
        const maxRetry =
          reason === "empty" ? MAX_EMPTY_RESPONSE_RETRIES : MAX_FETCH_RETRIES;
        if (nextAttempt > maxRetry) {
          setIsLoading(false);
          return;
        }

        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, nextAttempt - 2);
        console.log(
          `🔄 useTeams retry ${nextAttempt}/${maxRetry} (${reason}) dalam ${delay}ms`,
        );

        clearRetryTimer();
        retryTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          void fetchTeams(nextAttempt, true);
        }, delay);
      };

      if (attempt === 1) {
        setIsLoading(true);
        setError(null);
      }

      if (!skipCache && attempt === 1) {
        const cached = getCached<TeamWithRole[]>(cacheKey);
        if (cached) {
          clearRetryTimer();
          setTeams(cached);
          setIsLoading(false);
          setError(null);
          return;
        }
      }

      isFetchingRef.current = true;

      try {
        const data = await teamsApi.list();

        let teamsArray: TeamWithRole[] = Array.isArray(data) ? data : [];

        if (teamsArray.length === 0 && tokenStorage.hasTokens()) {
          try {
            const me = await usersApi.getMe();
            const fallbackTeams = Array.isArray(me?.teams) ? me.teams : [];

            if (fallbackTeams.length > 0) {
              teamsArray = fallbackTeams as TeamWithRole[];
            }
          } catch (fallbackError) {
            console.warn("Fallback /users/me failed:", fallbackError);
          }
        }

        if (!isMountedRef.current) return;

        if (teamsArray.length === 0 && attempt < MAX_EMPTY_RESPONSE_RETRIES) {
          scheduleRetry(attempt + 1, "empty");
          return;
        }

        setTeams(teamsArray);
        setError(null);
        setIsLoading(false);
        clearRetryTimer();

        if (teamsArray.length > 0) {
          setCache(cacheKey, teamsArray);
        }
      } catch (err) {
        if (!isMountedRef.current) return;

        if (err instanceof ApiError && err.statusCode === 401) {
          setIsLoading(false);
          return;
        }

        if (attempt < MAX_FETCH_RETRIES) {
          scheduleRetry(attempt + 1, "error");
          return;
        }

        const message =
          err instanceof ApiError ? err.message : "Gagal memuat tim.";
        setError(message);
        setIsLoading(false);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [clearRetryTimer, isAuthenticated, status],
  );

  const getTeamBySlug = useCallback(async (slug: string, skipCache = false) => {
    const cacheKey = `team-${slug}`;

    // Check cache first
    if (!skipCache) {
      const cached =
        getCached<Awaited<ReturnType<typeof teamsApi.getBySlug>>>(cacheKey);
      if (cached) return cached;
    }

    try {
      const data = await teamsApi.getBySlug(slug);
      setCache(cacheKey, data);
      return data;
    } catch (err) {
      console.error("❌ Error fetching team:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (status === "unauthenticated" || !isAuthenticated) {
      clearRetryTimer();
      isFetchingRef.current = false;
      setTeams([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    void fetchTeams(1);
  }, [clearRetryTimer, fetchTeams, isAuthenticated, status]);

  return {
    teams,
    isLoading,
    error,
    isEmpty: !isLoading && teams.length === 0,
    refetch: () => {
      clearRetryTimer();
      return fetchTeams(1, true);
    },
    getTeamBySlug,
  };
}

export function useTeamDetail(teamSlug: string) {
  const { status, isAuthenticated } = useAuthContext();
  const [team, setTeam] = useState<Awaited<
    ReturnType<typeof teamsApi.getBySlug>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated" || !isAuthenticated || !teamSlug) {
      fetchedRef.current = false;
      return;
    }

    if (fetchedRef.current) return;

    const cacheKey = `team-${teamSlug}`;
    const cached =
      getCached<Awaited<ReturnType<typeof teamsApi.getBySlug>>>(cacheKey);

    if (cached) {
      setTeam(cached);
      setIsLoading(false);
      fetchedRef.current = true;
      return;
    }

    setIsLoading(true);
    teamsApi
      .getBySlug(teamSlug)
      .then((data) => {
        setTeam(data);
        setCache(cacheKey, data);
        setIsLoading(false);
        fetchedRef.current = true;
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal memuat detail tim.",
        );
        setIsLoading(false);
      });
  }, [isAuthenticated, status, teamSlug]);

  return { team, isLoading, error };
}

export function useTeamMembers(teamSlug: string) {
  const { status, isAuthenticated } = useAuthContext();
  const [members, setMembers] = useState<
    Awaited<ReturnType<typeof teamsApi.getMembers>>["members"]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchMembers = useCallback(
    async (skipCache = false) => {
      if (status !== "authenticated" || !isAuthenticated || !teamSlug) {
        return;
      }

      const cacheKey = `team-members-${teamSlug}`;

      if (!skipCache) {
        const cached =
          getCached<Awaited<ReturnType<typeof teamsApi.getMembers>>["members"]>(
            cacheKey,
          );

        if (cached) {
          setMembers(cached);
          setError(null);
          setIsLoading(false);
          fetchedRef.current = true;
          return;
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await teamsApi.getMembers(teamSlug);
        setMembers(data.members);
        setCache(cacheKey, data.members);
        setIsLoading(false);
        fetchedRef.current = true;
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Gagal memuat anggota tim.",
        );
        setIsLoading(false);
      }
    },
    [isAuthenticated, status, teamSlug],
  );

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated" || !isAuthenticated || !teamSlug) {
      setMembers([]);
      setError(null);
      setIsLoading(false);
      fetchedRef.current = false;
      return;
    }

    if (fetchedRef.current) return;

    void fetchMembers(false);
  }, [fetchMembers, isAuthenticated, status, teamSlug]);

  return {
    members,
    isLoading,
    error,
    refetch: () => fetchMembers(true),
  };
}

export function useTeamMemberDetail(teamSlug: string, memberId: string) {
  const { status, isAuthenticated } = useAuthContext();
  const [member, setMember] = useState<
    Awaited<ReturnType<typeof teamsApi.getMemberDetail>>["member"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchMember = useCallback(
    async (skipCache = false) => {
      if (
        status !== "authenticated" ||
        !isAuthenticated ||
        !teamSlug ||
        !memberId
      ) {
        return;
      }

      const cacheKey = `team-member-${teamSlug}-${memberId}`;

      if (!skipCache) {
        const cached =
          getCached<
            Awaited<ReturnType<typeof teamsApi.getMemberDetail>>["member"]
          >(cacheKey);

        if (cached) {
          setMember(cached);
          setError(null);
          setIsLoading(false);
          fetchedRef.current = true;
          return;
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await teamsApi.getMemberDetail(teamSlug, memberId);
        setMember(data.member);
        setCache(cacheKey, data.member);
        setIsLoading(false);
        fetchedRef.current = true;
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal memuat profil anggota.",
        );
        setIsLoading(false);
      }
    },
    [isAuthenticated, memberId, status, teamSlug],
  );

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (
      status !== "authenticated" ||
      !isAuthenticated ||
      !teamSlug ||
      !memberId
    ) {
      setMember(null);
      setError(null);
      setIsLoading(false);
      fetchedRef.current = false;
      return;
    }

    if (fetchedRef.current) return;

    void fetchMember(false);
  }, [fetchMember, isAuthenticated, memberId, status, teamSlug]);

  return {
    member,
    isLoading,
    error,
    refetch: () => fetchMember(true),
  };
}

export function useTeamSettings(teamSlug: string) {
  const { status, isAuthenticated } = useAuthContext();
  const [settings, setSettings] = useState<Awaited<
    ReturnType<typeof teamsApi.getSettings>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (status !== "authenticated" || !isAuthenticated || !teamSlug) {
      setSettings(null);
      setError(null);
      setIsLoading(false);
      fetchedRef.current = false;
      return;
    }

    if (fetchedRef.current) return;

    const cacheKey = `team-settings-${teamSlug}`;
    const cached =
      getCached<Awaited<ReturnType<typeof teamsApi.getSettings>>>(cacheKey);

    if (cached) {
      setSettings(cached);
      setIsLoading(false);
      fetchedRef.current = true;
      return;
    }

    teamsApi
      .getSettings(teamSlug)
      .then((data) => {
        setSettings(data);
        setCache(cacheKey, data);
        setIsLoading(false);
        fetchedRef.current = true;
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal memuat pengaturan.",
        );
        setIsLoading(false);
      });
  }, [isAuthenticated, status, teamSlug]);

  const updateSettings = useCallback(
    async (payload: Parameters<typeof teamsApi.updateSettings>[1]) => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await teamsApi.updateSettings(teamSlug, payload);
        setSettings(updated);
        // Update cache
        setCache(`team-settings-${teamSlug}`, updated);
        return updated;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Gagal menyimpan pengaturan.";
        setError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [teamSlug],
  );

  const deleteTeam = useCallback(async () => {
    if (!teamSlug) {
      throw new Error("Slug proyek tidak valid.");
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await teamsApi.remove(teamSlug);

      clearCacheKey("teams-list");
      clearCacheKey(`team-${teamSlug}`);
      clearCacheKey(`team-members-${teamSlug}`);
      clearCacheKey(`team-settings-${teamSlug}`);

      setSettings(null);
      fetchedRef.current = false;

      return result;
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal menghapus proyek.";
      setError(message);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [teamSlug]);

  return {
    settings,
    isLoading,
    isSaving,
    isDeleting,
    error,
    updateSettings,
    deleteTeam,
  };
}
