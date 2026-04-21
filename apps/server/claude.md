# CLAUDE.md — Frontend Integration: Mock Data Removal & Backend Connection

> **Konteks**: Frontend Amertask (Next.js 16 + TypeScript) sudah berjalan dengan mock data.
> Backend ElysiaJS di `http://localhost:3000` sudah live dan seluruh endpoint mengembalikan status **200 OK**.
> Tugas ini adalah **mengganti seluruh mock data dengan koneksi real ke backend** melalui satu lapisan terpusat: `src/lib/core/`.

---

## ⚠️ Aturan Kerja (Wajib Dibaca Sebelum Mulai)

1. **Jangan hapus file apapun** sebelum semua dependensinya sudah diganti.
2. **Kerjakan secara berurutan** sesuai fase di dokumen ini — jangan melompat.
3. **Satu sumber kebenaran**: semua pemanggilan API **harus** melewati `src/lib/core/`. Dilarang menulis `fetch()` langsung di komponen atau hook.
4. **Jangan ubah** file berikut: `types/index.ts`, `lib/constants.ts`, `lib/utils.ts`, `lib/theme.ts`, `lib/motion-variants.ts`, `store/useThemeStore.ts`. File-file ini tidak ada kaitannya dengan migrasi ini.
5. Setelah setiap fase selesai, pastikan tidak ada TypeScript error sebelum lanjut ke fase berikutnya.

---

## 🗺️ Peta Perubahan

```
SEBELUM                          SESUDAH
─────────────────────────────────────────────────────────────────
src/lib/mock-data.ts        →    DIHAPUS (di fase terakhir)
src/lib/api.ts              →    DIGANTI TOTAL dengan src/lib/core/
src/hooks/useAuth.ts        →    DITULIS ULANG
src/hooks/useIssues.ts      →    DITULIS ULANG
                                 + hook baru: useTeams, useInbox,
                                   useAnalytics, useTriage, useUsers
```

---

## 📁 Fase 1 — Buat Struktur `src/lib/core/`

Buat folder dan file berikut. **Isi setiap file sesuai spesifikasi di bawah.**

```
src/lib/core/
├── index.ts          ← re-export semua public API
├── token.ts          ← manajemen token di localStorage
├── http.ts           ← base fetch client + auto token refresh
├── auth.api.ts       ← endpoint /auth/*
├── users.api.ts      ← endpoint /users/*
├── teams.api.ts      ← endpoint /teams/*
├── issues.api.ts     ← endpoint /issues/* dan /teams/:slug/issues
├── triage.api.ts     ← endpoint /triage/*
├── inbox.api.ts      ← endpoint /inbox/*
└── analytics.api.ts  ← endpoint /teams/:slug/analytics
```

---

### `src/lib/core/token.ts`

Bertanggung jawab atas semua operasi localStorage untuk token. Tidak ada komponen atau hook yang boleh mengakses localStorage untuk token secara langsung — semuanya lewat sini.

```typescript
const ACCESS_TOKEN_KEY = "amertask_access_token";
const REFRESH_TOKEN_KEY = "amertask_refresh_token";

export const tokenStorage = {
  getAccess: (): string | null =>
    typeof window !== "undefined"
      ? localStorage.getItem(ACCESS_TOKEN_KEY)
      : null,

  getRefresh: (): string | null =>
    typeof window !== "undefined"
      ? localStorage.getItem(REFRESH_TOKEN_KEY)
      : null,

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  hasTokens: (): boolean =>
    Boolean(tokenStorage.getAccess() && tokenStorage.getRefresh()),
};
```

---

### `src/lib/core/http.ts`

Ini adalah inti dari seluruh lapisan core. Berisi `apiClient` — sebuah fungsi fetch yang:

- Menyisipkan `Authorization: Bearer <token>` secara otomatis
- Menangani **token refresh otomatis** ketika menerima respons `401`
- Memformat error menjadi `ApiError` yang konsisten
- Melakukan redirect ke `/` ketika refresh token juga gagal (sesi habis)

```typescript
import { tokenStorage } from "./token";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Flag untuk mencegah multiple refresh request serentak
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        tokenStorage.clearTokens();
        return false;
      }

      const data = await res.json();
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      tokenStorage.clearTokens();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const makeRequest = async (withToken: boolean): Promise<Response> => {
    const token = tokenStorage.getAccess();
    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(withToken && token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  };

  let res = await makeRequest(true);

  // Auto-refresh: jika 401, coba refresh sekali lalu retry
  if (res.status === 401) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      res = await makeRequest(true);
    } else {
      // Sesi habis — redirect ke landing page
      if (typeof window !== "undefined") {
        tokenStorage.clearTokens();
        window.location.href = "/";
      }
      throw new ApiError(
        401,
        "UNAUTHORIZED",
        "Sesi berakhir. Silakan login kembali.",
      );
    }
  }

  if (!res.ok) {
    let errorPayload: { error?: string; message?: string } = {};
    try {
      errorPayload = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(
      res.status,
      errorPayload.error ?? "UNKNOWN_ERROR",
      errorPayload.message ?? "Terjadi kesalahan. Coba lagi.",
    );
  }

  // Untuk respons 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
```

---

### `src/lib/core/auth.api.ts`

```typescript
import { apiClient } from "./http";
import { tokenStorage } from "./token";
import type { User } from "@/types";

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const data = await apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const data = await apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefresh();
    if (refreshToken) {
      try {
        await apiClient("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        /* abaikan error logout, tetap clear token */
      }
    }
    tokenStorage.clearTokens();
  },
};
```

---

### `src/lib/core/users.api.ts`

```typescript
import { apiClient } from "./http";
import type { User } from "@/types";

interface UserWithTeams extends User {
  teams: Array<{ id: string; slug: string; name: string; role: string }>;
}

interface UpdateProfilePayload {
  name?: string;
  avatar?: string;
}

export const usersApi = {
  getMe: (): Promise<UserWithTeams> => apiClient<UserWithTeams>("/users/me"),

  updateMe: (payload: UpdateProfilePayload): Promise<UserWithTeams> =>
    apiClient<UserWithTeams>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
```

---

### `src/lib/core/teams.api.ts`

```typescript
import { apiClient } from "./http";
import type { Team } from "@/types";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

interface TeamStats {
  totalIssues: number;
  openIssues: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

interface TeamDetail extends Team {
  type: string;
  startDate?: string;
  endDate?: string;
  stats: TeamStats;
}

interface ProjectSettings {
  id: string;
  teamId: string;
  name: string;
  slug: string;
  type: "konstruksi" | "it" | "tugas";
  startDate?: string;
  endDate?: string;
  projectManagerId?: string;
  company?: string;
  workArea?: string;
  description?: string;
  integrations: {
    githubRepo?: string;
    googleDocsUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UpdateSettingsPayload {
  name?: string;
  slug?: string;
  type?: "konstruksi" | "it" | "tugas";
  startDate?: string;
  endDate?: string;
  projectManagerId?: string;
  company?: string;
  workArea?: string;
  description?: string;
  integrations?: {
    githubRepo?: string;
    googleDocsUrl?: string;
  };
}

interface CreateTeamPayload {
  slug: string;
  name: string;
  type?: "konstruksi" | "it" | "tugas";
}

export const teamsApi = {
  list: (): Promise<{ teams: (Team & { role: string })[] }> =>
    apiClient("/teams"),

  create: (payload: CreateTeamPayload): Promise<Team> =>
    apiClient("/teams", { method: "POST", body: JSON.stringify(payload) }),

  getBySlug: (teamSlug: string): Promise<TeamDetail> =>
    apiClient(`/teams/${teamSlug}`),

  getMembers: (teamSlug: string): Promise<{ members: TeamMember[] }> =>
    apiClient(`/teams/${teamSlug}/members`),

  getSettings: (teamSlug: string): Promise<ProjectSettings> =>
    apiClient(`/teams/${teamSlug}/settings`),

  updateSettings: (
    teamSlug: string,
    payload: UpdateSettingsPayload,
  ): Promise<ProjectSettings> =>
    apiClient(`/teams/${teamSlug}/settings`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
```

---

### `src/lib/core/issues.api.ts`

```typescript
import { apiClient } from "./http";
import type { Issue } from "@/types";

interface IssueListParams {
  status?: string; // csv: "todo,in_progress"
  priority?: string; // csv: "urgent,high"
  labels?: string; // csv: "Frontend,Bug"
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface IssueListResponse {
  issues: Issue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateIssuePayload {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  labels?: string[];
  assigneeId?: string;
  parentIssueId?: string;
  source?: "slack" | "email" | "manual";
  isTriaged?: boolean;
}

type UpdateIssuePayload = Partial<CreateIssuePayload>;

function buildQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      qs.set(key, String(val));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export const issuesApi = {
  list: (
    teamSlug: string,
    params: IssueListParams = {},
  ): Promise<IssueListResponse> =>
    apiClient(`/teams/${teamSlug}/issues${buildQueryString(params)}`),

  getById: (id: string): Promise<Issue> => apiClient(`/issues/${id}`),

  create: (teamSlug: string, payload: CreateIssuePayload): Promise<Issue> =>
    apiClient(`/teams/${teamSlug}/issues`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateIssuePayload): Promise<Issue> =>
    apiClient(`/issues/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id: string): Promise<{ message: string }> =>
    apiClient(`/issues/${id}`, { method: "DELETE" }),
};
```

---

### `src/lib/core/triage.api.ts`

```typescript
import { apiClient } from "./http";
import type { Issue } from "@/types";

interface TriageListResponse {
  issues: Issue[];
  total: number;
}

interface AcceptPayload {
  priority?: string;
  assigneeId?: string;
  labels?: string[];
}

interface DeclinePayload {
  reason?: string;
}

export const triageApi = {
  list: (teamSlug: string): Promise<TriageListResponse> =>
    apiClient(`/teams/${teamSlug}/triage`),

  accept: (issueId: string, payload?: AcceptPayload): Promise<Issue> =>
    apiClient(`/triage/${issueId}/accept`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),

  decline: (
    issueId: string,
    payload?: DeclinePayload,
  ): Promise<{ message: string; issueId: string }> =>
    apiClient(`/triage/${issueId}/decline`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),
};
```

---

### `src/lib/core/inbox.api.ts`

```typescript
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface InboxParams {
  unread?: boolean;
  page?: number;
  limit?: number;
}

export const inboxApi = {
  list: (params: InboxParams = {}): Promise<InboxResponse> => {
    const qs = new URLSearchParams();
    if (params.unread) qs.set("unread", "true");
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString() ? `?${qs}` : "";
    return apiClient(`/inbox${query}`);
  },

  markAsRead: (notificationId: string): Promise<{ message: string }> =>
    apiClient(`/inbox/${notificationId}/read`, { method: "PATCH" }),

  markAllAsRead: (): Promise<{ message: string }> =>
    apiClient("/inbox/read-all", { method: "PATCH" }),
};
```

---

### `src/lib/core/analytics.api.ts`

```typescript
import { apiClient } from "./http";

interface AnalyticsSummary {
  totalIssues: number;
  openIssues: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  byStatus: Array<{ status: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  byAssignee: Array<{
    userId: string;
    name: string;
    avatar?: string;
    initials: string;
    count: number;
  }>;
  completionTrend: Array<{ date: string; completed: number; created: number }>;
}

interface AnalyticsParams {
  from?: string; // ISO date string
  to?: string; // ISO date string
}

export const analyticsApi = {
  get: (
    teamSlug: string,
    params: AnalyticsParams = {},
  ): Promise<AnalyticsResponse> => {
    const qs = new URLSearchParams();
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    const query = qs.toString() ? `?${qs}` : "";
    return apiClient(`/teams/${teamSlug}/analytics${query}`);
  },
};
```

---

### `src/lib/core/index.ts`

File ini adalah satu-satunya yang diimpor oleh hook dan komponen. Tidak ada yang boleh mengimpor langsung dari file internal core.

```typescript
// Public API dari lib/core
export { apiClient, ApiError } from "./http";
export { tokenStorage } from "./token";
export { authApi } from "./auth.api";
export { usersApi } from "./users.api";
export { teamsApi } from "./teams.api";
export { issuesApi } from "./issues.api";
export { triageApi } from "./triage.api";
export { inboxApi } from "./inbox.api";
export { analyticsApi } from "./analytics.api";
```

---

## 📁 Fase 2 — Tulis Ulang `src/hooks/useAuth.ts`

Hapus seluruh isi file sebelumnya dan ganti dengan implementasi berikut. Hook ini sekarang membaca user dari API (`/users/me`), bukan dari mock.

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { authApi, usersApi, tokenStorage, ApiError } from "@/lib/core";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface LoginPayload {
  email: string;
  password: string;
}
interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true, // true saat pertama kali load untuk cek sesi
    isAuthenticated: false,
    error: null,
  });

  // Cek sesi aktif saat mount
  useEffect(() => {
    if (!tokenStorage.hasTokens()) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    usersApi
      .getMe()
      .then((user) =>
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        }),
      )
      .catch(() => {
        tokenStorage.clearTokens();
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      });
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { user } = await authApi.login(payload);
      setState({ user, isLoading: false, isAuthenticated: true, error: null });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Login gagal. Coba lagi.";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { user } = await authApi.register(payload);
      setState({ user, isLoading: false, isAuthenticated: true, error: null });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Registrasi gagal. Coba lagi.";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    login,
    register,
    logout,
    clearError,
  };
}
```

---

## 📁 Fase 3 — Tulis Ulang `src/hooks/useIssues.ts`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { issuesApi, ApiError } from "@/lib/core";
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
  const [filters, setFilters] = useState<IssueFilters>(initialFilters);
  const [state, setState] = useState<UseIssuesState>({
    issues: [],
    pagination: null,
    isLoading: true,
    error: null,
  });

  const fetchIssues = useCallback(
    async (currentFilters: IssueFilters) => {
      if (!teamSlug) return;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await issuesApi.list(teamSlug, currentFilters);
        setState({
          issues: data.issues,
          pagination: data.pagination,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Gagal memuat issues.";
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    [teamSlug],
  );

  useEffect(() => {
    fetchIssues(filters);
  }, [fetchIssues, filters]);

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
  };
}
```

---

## 📁 Fase 4 — Buat Hook-Hook Baru

Buat file-file berikut di `src/hooks/`:

### `src/hooks/useTeams.ts`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { teamsApi, ApiError } from "@/lib/core";
import type { Team } from "@/types";

export function useTeams() {
  const [teams, setTeams] = useState<(Team & { role: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await teamsApi.list();
      setTeams(data.teams);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat tim.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return { teams, isLoading, error, refetch: fetchTeams };
}

export function useTeamDetail(teamSlug: string) {
  const [team, setTeam] = useState<Awaited<
    ReturnType<typeof teamsApi.getBySlug>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamSlug) return;
    setIsLoading(true);
    teamsApi
      .getBySlug(teamSlug)
      .then((data) => {
        setTeam(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal memuat detail tim.",
        );
        setIsLoading(false);
      });
  }, [teamSlug]);

  return { team, isLoading, error };
}

export function useTeamMembers(teamSlug: string) {
  const [members, setMembers] = useState<
    Awaited<ReturnType<typeof teamsApi.getMembers>>["members"]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamSlug) return;
    teamsApi
      .getMembers(teamSlug)
      .then((data) => {
        setMembers(data.members);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal memuat anggota tim.",
        );
        setIsLoading(false);
      });
  }, [teamSlug]);

  return { members, isLoading, error };
}

export function useTeamSettings(teamSlug: string) {
  const [settings, setSettings] = useState<Awaited<
    ReturnType<typeof teamsApi.getSettings>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamSlug) return;
    teamsApi
      .getSettings(teamSlug)
      .then((data) => {
        setSettings(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal memuat pengaturan.",
        );
        setIsLoading(false);
      });
  }, [teamSlug]);

  const updateSettings = useCallback(
    async (payload: Parameters<typeof teamsApi.updateSettings>[1]) => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await teamsApi.updateSettings(teamSlug, payload);
        setSettings(updated);
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

  return { settings, isLoading, isSaving, error, updateSettings };
}
```

---

### `src/hooks/useTriage.ts`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { triageApi, ApiError } from "@/lib/core";
import type { Issue } from "@/types";

export function useTriage(teamSlug: string) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTriage = useCallback(async () => {
    if (!teamSlug) return;
    setIsLoading(true);
    try {
      const data = await triageApi.list(teamSlug);
      setIssues(data.issues);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat triage.");
    } finally {
      setIsLoading(false);
    }
  }, [teamSlug]);

  useEffect(() => {
    fetchTriage();
  }, [fetchTriage]);

  const acceptIssue = useCallback(
    async (
      issueId: string,
      payload?: Parameters<typeof triageApi.accept>[1],
    ) => {
      const updated = await triageApi.accept(issueId, payload);
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
      setTotal((prev) => prev - 1);
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
      setTotal((prev) => prev - 1);
    },
    [],
  );

  return {
    issues,
    total,
    isLoading,
    error,
    acceptIssue,
    declineIssue,
    refetch: fetchTriage,
  };
}
```

---

### `src/hooks/useInbox.ts`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { inboxApi, ApiError } from "@/lib/core";

export function useInbox(params: Parameters<typeof inboxApi.list>[0] = {}) {
  const [notifications, setNotifications] = useState<
    Awaited<ReturnType<typeof inboxApi.list>>["notifications"]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

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
```

---

### `src/hooks/useAnalytics.ts`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { analyticsApi, ApiError } from "@/lib/core";

export function useAnalytics(
  teamSlug: string,
  params: Parameters<typeof analyticsApi.get>[1] = {},
) {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof analyticsApi.get>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!teamSlug) return;
    setIsLoading(true);
    try {
      const result = await analyticsApi.get(teamSlug, params);
      setData(result);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal memuat analytics.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [teamSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, isLoading, error, refetch: fetchAnalytics };
}
```

---

## 📁 Fase 5 — Update Setiap Komponen Dashboard

Untuk setiap komponen berikut, ganti import mock data dan lakukan perubahan minimal yang diperlukan. **Jangan ubah tampilan atau struktur JSX** — hanya ubah sumber data.

### Pattern Umum

**Sebelum** (menggunakan mock):

```typescript
import { mockIssues } from "@/lib/mock-data";
// ...
const issues = mockIssues.filter((i) => i.teamSlug === teamSlug);
```

**Sesudah** (menggunakan hook):

```typescript
import { useIssues } from '@/hooks/useIssues'
// ...
const { issues, isLoading, error } = useIssues(teamSlug)
if (isLoading) return <LoadingSkeleton />
if (error) return <ErrorState message={error} />
```

---

### Daftar Komponen yang Perlu Diupdate

#### `src/app/pages/[teamSlug]/issues/page.tsx`

```typescript
// Ganti mock → useIssues
import { useIssues } from "@/hooks/useIssues";

// Params dari Next.js App Router:
const { teamSlug } = await params; // atau use(params) di client component
const { issues, isLoading, error, createIssue, updateIssue, deleteIssue } =
  useIssues(teamSlug);
```

#### `src/app/pages/[teamSlug]/triage/page.tsx`

```typescript
import { useTriage } from "@/hooks/useTriage";
const { issues, isLoading, error, acceptIssue, declineIssue } =
  useTriage(teamSlug);
```

#### `src/app/pages/[teamSlug]/backlog/page.tsx`

```typescript
// Backlog = issues dengan status 'backlog'
import { useIssues } from "@/hooks/useIssues";
const { issues, isLoading, error } = useIssues(teamSlug, { status: "backlog" });
```

#### `src/app/pages/[teamSlug]/planning/page.tsx`

```typescript
// Planning = issues dengan status 'todo' atau sprint planning
import { useIssues } from "@/hooks/useIssues";
const { issues, isLoading, error } = useIssues(teamSlug, {
  status: "todo,in_progress",
});
```

#### `src/app/pages/[teamSlug]/execution/page.tsx`

```typescript
import { useIssues } from "@/hooks/useIssues";
const { issues, isLoading, error } = useIssues(teamSlug, {
  status: "in_progress,in_review",
});
```

#### `src/app/pages/[teamSlug]/analytics/page.tsx`

```typescript
import { useAnalytics } from "@/hooks/useAnalytics";
const { data, isLoading, error } = useAnalytics(teamSlug);
```

#### `src/app/pages/[teamSlug]/team/page.tsx`

```typescript
import { useTeamMembers } from "@/hooks/useTeams";
const { members, isLoading, error } = useTeamMembers(teamSlug);
```

#### `src/app/pages/[teamSlug]/settings/page.tsx`

```typescript
import { useTeamSettings } from "@/hooks/useTeams";
const { settings, isLoading, isSaving, error, updateSettings } =
  useTeamSettings(teamSlug);
```

#### `src/app/pages/inbox/page.tsx`

```typescript
import { useInbox } from "@/hooks/useInbox";
const {
  notifications,
  unreadCount,
  isLoading,
  error,
  markAsRead,
  markAllAsRead,
} = useInbox();
```

#### `src/components/layout/Sidebar.tsx`

```typescript
// Ganti mock teams dengan useTeams
import { useTeams } from "@/hooks/useTeams";
const { teams, isLoading } = useTeams();
```

#### `src/components/layout/Navbar.tsx`

```typescript
// Ganti mock user dengan useAuth + unread count dengan useInbox
import { useAuth } from "@/hooks/useAuth";
import { useInbox } from "@/hooks/useInbox";
const { user, logout } = useAuth();
const { unreadCount } = useInbox({ unread: true, limit: 1 });
```

#### `src/components/auth/LoginForm.tsx`

```typescript
import { useAuth } from "@/hooks/useAuth";
const { login, register, isLoading, error, clearError } = useAuth();
```

---

## 📁 Fase 6 — Hapus File Mock

Setelah semua komponen dan hook di atas selesai diupdate dan tidak ada TypeScript error, lakukan langkah berikut:

**1. Hapus file mock data:**

```bash
rm src/lib/mock-data.ts
```

**2. Hapus file api.ts lama** (sudah digantikan penuh oleh `lib/core`):

```bash
rm src/lib/api.ts
```

**3. Cari sisa import yang mengarah ke kedua file tersebut:**

```bash
grep -r "mock-data" src/ --include="*.ts" --include="*.tsx"
grep -r "from '@/lib/api'" src/ --include="*.ts" --include="*.tsx"
grep -r "from '../lib/api'" src/ --include="*.ts" --include="*.tsx"
```

Output dari perintah di atas harus **kosong (tidak ada hasil)**. Jika masih ada, perbaiki dulu sebelum lanjut.

---

## 📁 Fase 7 — Verifikasi Akhir

Jalankan seluruh pengecekan berikut secara berurutan:

```bash
# 1. TypeScript check — harus 0 error
bun run tsc --noEmit

# 2. Lint check
bun run lint

# 3. Pastikan tidak ada referensi ke mock-data atau api.ts lama
grep -r "mock-data\|from '@/lib/api'" src/ --include="*.ts" --include="*.tsx"

# 4. Jalankan dev server dan test manual
bun dev
```

### Checklist Fungsional

Buka browser dan verifikasi setiap alur berikut:

- [ ] Register user baru → redirect ke dashboard
- [ ] Login dengan credentials → redirect ke dashboard
- [ ] Refresh halaman saat login → tetap login (sesi persisten)
- [ ] Sidebar menampilkan tim dari API (bukan hardcoded)
- [ ] Navbar menampilkan nama user dari API
- [ ] `/pages/[teamSlug]/issues` menampilkan issues dari API
- [ ] Buat issue baru → muncul di list tanpa refresh halaman
- [ ] Update status issue (drag atau dropdown) → tersimpan
- [ ] Hapus issue → hilang dari list
- [ ] `/pages/[teamSlug]/triage` menampilkan issues belum triage
- [ ] Accept issue di triage → hilang dari triage list
- [ ] `/pages/[teamSlug]/settings` menampilkan data dari API
- [ ] Save settings → sukses dengan feedback visual
- [ ] `/pages/[teamSlug]/analytics` menampilkan data real
- [ ] `/pages/[teamSlug]/team` menampilkan member list dari API
- [ ] `/pages/inbox` menampilkan notifikasi
- [ ] Logout → clear token → redirect ke landing page
- [ ] Akses halaman dashboard tanpa token → redirect ke `/`

---

## ⚡ Pola Error Handling di Komponen

Setiap komponen yang menggunakan data dari backend **wajib** menangani tiga state:

```tsx
// Pattern standar — terapkan konsisten di semua halaman
const { issues, isLoading, error } = useIssues(teamSlug);

if (isLoading) return <LoadingSkeleton />; // atau spinner yang sudah ada
if (error)
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <p className="text-[var(--color-text-muted)]">{error}</p>
      <button
        onClick={refetch}
        className="text-[var(--color-primary)] underline text-sm"
      >
        Coba lagi
      </button>
    </div>
  );
if (!issues.length) return <EmptyState />; // komponen EmptyState yang sudah ada
```

---

## 📌 Referensi Cepat — Pemetaan Endpoint ke Hook

| Halaman / Komponen   | Hook                   | Endpoint Backend                                       |
| -------------------- | ---------------------- | ------------------------------------------------------ |
| Sidebar              | `useTeams`             | `GET /teams`                                           |
| Navbar (user)        | `useAuth`              | `GET /users/me`                                        |
| Navbar (notif count) | `useInbox`             | `GET /inbox?unread=true&limit=1`                       |
| `/issues`            | `useIssues`            | `GET /teams/:slug/issues`                              |
| `/triage`            | `useTriage`            | `GET /teams/:slug/triage`                              |
| `/backlog`           | `useIssues` (filtered) | `GET /teams/:slug/issues?status=backlog`               |
| `/planning`          | `useIssues` (filtered) | `GET /teams/:slug/issues?status=todo,in_progress`      |
| `/execution`         | `useIssues` (filtered) | `GET /teams/:slug/issues?status=in_progress,in_review` |
| `/analytics`         | `useAnalytics`         | `GET /teams/:slug/analytics`                           |
| `/team`              | `useTeamMembers`       | `GET /teams/:slug/members`                             |
| `/settings`          | `useTeamSettings`      | `GET /teams/:slug/settings`                            |
| `/inbox`             | `useInbox`             | `GET /inbox`                                           |
| `LoginForm`          | `useAuth`              | `POST /auth/login`, `POST /auth/register`              |

---

_Dokumen ini dibuat untuk migrasi frontend Amertask dari mock data ke backend ElysiaJS_
_Versi: 1.0.0 | April 2026_
