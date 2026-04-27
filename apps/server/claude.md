# CLAUDE.md — Refactor: Pecah Services Backend menjadi Sub-Modules

## Tujuan

Memecah setiap file `*.service.ts` yang berisi 1000+ baris menjadi
file-file kecil bertanggung jawab tunggal, lalu menyatukannya kembali
melalui satu barrel file (`auth.service.ts`, dst).

**Aturan utama:**

- Semua import di routes tetap sama — `from '../services/auth.service'`
- Tidak ada perubahan di routes, controllers, atau file lain
- Hanya folder `services/` yang disentuh

---

## Struktur Target

```
services/
├── auth/
│   ├── jwt.service.ts          ← sign, verify, decode JWT
│   ├── password.service.ts     ← hash, verify password
│   ├── register.service.ts     ← logika registrasi user baru
│   ├── login.service.ts        ← logika login + generate token
│   ├── refresh.service.ts      ← logika refresh token
│   └── logout.service.ts       ← logika revoke token
├── auth.service.ts             ← barrel: re-export semua dari auth/
│
├── issues/
│   ├── issues-query.service.ts ← list, getById, filter, pagination
│   ├── issues-mutate.service.ts← create, update, delete
│   └── issues-mapper.service.ts← konversi DB row → response shape
├── issues.service.ts           ← barrel
│
├── teams/
│   ├── teams-query.service.ts  ← list, getBySlug, getMembers
│   ├── teams-mutate.service.ts ← create, update settings
│   └── teams-access.service.ts ← cek membership, role validation
├── teams.service.ts            ← barrel
│
├── triage/
│   ├── triage-query.service.ts ← listUntriaged
│   ├── triage-accept.service.ts← acceptIssue
│   └── triage-decline.service.ts← declineIssue
├── triage.service.ts           ← barrel
│
├── analytics/
│   ├── analytics-summary.service.ts   ← hitung summary stats
│   ├── analytics-trend.service.ts     ← completionTrend per hari
│   └── analytics-breakdown.service.ts ← byStatus, byPriority, byAssignee
├── analytics.service.ts        ← barrel
│
├── users/
│   ├── users-profile.service.ts← getMe, updateProfile
│   └── users-activity.service.ts← getUserActivity, heatmap calc
├── users.service.ts            ← barrel
│
├── notifications/
│   ├── notifications-query.service.ts  ← list, getUnread
│   └── notifications-mutate.service.ts ← markRead, markAllRead, create
├── notifications.service.ts    ← barrel
│
└── google-docs/
    ├── google-docs-auth.service.ts     ← getGoogleAuth, extractDocId
    ├── google-docs-write.service.ts    ← writeSectionToDoc, findMarkers
    ├── google-docs-format.service.ts   ← formatPlanning/Backlog/Execution
    └── google-docs-table.service.ts    ← buildHeaderStyle, buildRowColor, fillCell
└── google-docs.service.ts      ← barrel
```

---

## Prinsip Pemisahan Per File

| File                  | Isi                                    | Boleh import dari                    |
| --------------------- | -------------------------------------- | ------------------------------------ |
| `*-query.service.ts`  | Hanya SELECT ke Supabase               | `lib/supabase`                       |
| `*-mutate.service.ts` | INSERT, UPDATE, DELETE                 | `lib/supabase`, `*-query.service.ts` |
| `*-mapper.service.ts` | Pure function, transform data          | Tidak boleh import Supabase          |
| `jwt.service.ts`      | Crypto, sign/verify                    | `jose`, env vars                     |
| `password.service.ts` | Hash/verify                            | `Bun.password` atau `bcrypt`         |
| `*-format.service.ts` | Pure function, string/object transform | Tidak ada external import            |
| barrel `*.service.ts` | Hanya re-export                        | Sub-files di folder yang sama        |

---

## LANGKAH 1 — Auth Service

### `services/auth/jwt.service.ts`

```typescript
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET tidak ada di environment");
  return new TextEncoder().encode(secret);
};

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
}

export async function signAccessToken(
  payload: Omit<TokenPayload, "iat" | "exp">,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES ?? "15m")
    .sign(getSecret());
}

export async function signRefreshToken(sub: string): Promise<string> {
  return new SignJWT({ sub })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES ?? "7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as TokenPayload;
}
```

### `services/auth/password.service.ts`

```typescript
// Pakai Bun.password jika available, fallback ke bcrypt
export async function hashPassword(plain: string): Promise<string> {
  if (typeof Bun !== "undefined") {
    return Bun.password.hash(plain, { algorithm: "bcrypt", cost: 10 });
  }
  const { hash } = await import("bcrypt");
  return hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  if (typeof Bun !== "undefined") {
    return Bun.password.verify(plain, hashed);
  }
  const { compare } = await import("bcrypt");
  return compare(plain, hashed);
}
```

### `services/auth/register.service.ts`

```typescript
import { supabase } from "../../lib/supabase";
import { hashPassword } from "./password.service";
import { signAccessToken, signRefreshToken } from "./jwt.service";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload) {
  const { name, email, password } = payload;

  // 1. Cek email sudah terdaftar
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const err = new Error("Email sudah terdaftar") as any;
    err.statusCode = 409;
    throw err;
  }

  // 2. Hash password
  const hashedPassword = await hashPassword(password);

  // 3. Insert ke auth.users via Supabase Admin
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: hashedPassword,
      email_confirm: true,
    });
  if (authError) throw new Error(authError.message);

  // 4. Insert ke profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({ id: authUser.user.id, name, email })
    .select()
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);

  // 5. Generate tokens
  const accessToken = await signAccessToken({ sub: profile!.id, email, name });
  const refreshToken = await signRefreshToken(profile!.id);

  // 6. Simpan refresh token
  await supabase.from("refresh_tokens").insert({
    user_id: profile!.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return { user: profile, accessToken, refreshToken };
}
```

### `services/auth/login.service.ts`

```typescript
import { supabase } from "../../lib/supabase";
import { verifyPassword } from "./password.service";
import { signAccessToken, signRefreshToken } from "./jwt.service";

export interface LoginPayload {
  email: string;
  password: string;
}

export async function loginUser(payload: LoginPayload) {
  const { email, password } = payload;

  // 1. Cari user
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error || !profile) {
    const err = new Error("Email atau password salah") as any;
    err.statusCode = 401;
    throw err;
  }

  // 2. Verifikasi password
  const valid = await verifyPassword(password, profile.password_hash);
  if (!valid) {
    const err = new Error("Email atau password salah") as any;
    err.statusCode = 401;
    throw err;
  }

  // 3. Generate tokens
  const accessToken = await signAccessToken({
    sub: profile.id,
    email: profile.email,
    name: profile.name,
  });
  const refreshToken = await signRefreshToken(profile.id);

  // 4. Simpan refresh token
  await supabase.from("refresh_tokens").insert({
    user_id: profile.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const { password_hash: _, ...safeProfile } = profile;
  return { user: safeProfile, accessToken, refreshToken };
}
```

### `services/auth/refresh.service.ts`

```typescript
import { supabase } from "../../lib/supabase";
import { verifyToken, signAccessToken, signRefreshToken } from "./jwt.service";

export async function refreshTokens(oldRefreshToken: string) {
  // 1. Verifikasi token tidak expired
  const payload = await verifyToken(oldRefreshToken);

  // 2. Cek token ada di DB dan belum direvoke
  const { data: tokenRow, error } = await supabase
    .from("refresh_tokens")
    .select("*")
    .eq("token", oldRefreshToken)
    .eq("revoked", false)
    .maybeSingle();

  if (error || !tokenRow) {
    const err = new Error(
      "Refresh token tidak valid atau sudah direvoke",
    ) as any;
    err.statusCode = 401;
    throw err;
  }

  // 3. Revoke token lama (rotation)
  await supabase
    .from("refresh_tokens")
    .update({ revoked: true })
    .eq("id", tokenRow.id);

  // 4. Ambil data user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name")
    .eq("id", payload.sub)
    .maybeSingle();

  if (!profile) {
    const err = new Error("User tidak ditemukan") as any;
    err.statusCode = 401;
    throw err;
  }

  // 5. Generate tokens baru
  const newAccessToken = await signAccessToken({
    sub: profile.id,
    email: profile.email,
    name: profile.name,
  });
  const newRefreshToken = await signRefreshToken(profile.id);

  // 6. Simpan refresh token baru
  await supabase.from("refresh_tokens").insert({
    user_id: profile.id,
    token: newRefreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

### `services/auth/logout.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export async function logoutUser(refreshToken: string): Promise<void> {
  await supabase
    .from("refresh_tokens")
    .update({ revoked: true })
    .eq("token", refreshToken);
}
```

### `services/auth.service.ts` — Barrel (tidak berubah dari sisi import routes)

```typescript
// Barrel file — routes hanya import dari sini, tidak perlu tahu internal structure

export { registerUser } from "./auth/register.service";
export { loginUser } from "./auth/login.service";
export { refreshTokens } from "./auth/refresh.service";
export { logoutUser } from "./auth/logout.service";
export {
  verifyToken,
  signAccessToken,
  signRefreshToken,
} from "./auth/jwt.service";
export { hashPassword, verifyPassword } from "./auth/password.service";
```

---

## LANGKAH 2 — Issues Service

### `services/issues/issues-query.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export interface IssueListParams {
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

const ISSUE_SELECT = `
  *, reason, plan_info,
  assignee:users!issues_assignee_id_fkey(id, name, avatar, initials),
  created_by:users!issues_created_by_id_fkey(id, name, avatar, initials)
`;

export async function getTeamIdFromSlug(
  teamSlug: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("teams")
    .select("id")
    .eq("slug", teamSlug)
    .maybeSingle();
  return data?.id ?? null;
}

export async function listIssues(teamId: string, params: IssueListParams) {
  let query = supabase
    .from("issues")
    .select(ISSUE_SELECT, { count: "exact" })
    .eq("team_id", teamId)
    .eq("is_triaged", true);

  if (params.status) {
    const statuses = params.status
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length) query = query.in("status", statuses);
  }
  if (params.priority) {
    const priorities = params.priority
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (priorities.length) query = query.in("priority", priorities);
  }
  if (params.search) query = query.ilike("title", `%${params.search}%`);
  if (params.assigneeId) query = query.eq("assignee_id", params.assigneeId);

  const sortBy = params.sortBy ?? "created_at";
  const ascending = params.sortDir === "asc";
  query = query.order(sortBy, { ascending });

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, params.limit ?? 20);
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    issues: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
}

export async function getIssueById(id: string) {
  const { data, error } = await supabase
    .from("issues")
    .select(ISSUE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
```

### `services/issues/issues-mutate.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export interface CreateIssuePayload {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  labels?: string[];
  assigneeId?: string;
  parentIssueId?: string;
  source?: string;
  isTriaged?: boolean;
  reason?: string;
  planInfo?: string;
}

export async function createIssue(
  teamId: string,
  userId: string,
  payload: CreateIssuePayload,
) {
  const { data, error } = await supabase
    .from("issues")
    .insert({
      team_id: teamId,
      created_by_id: userId,
      title: payload.title,
      description: payload.description ?? null,
      status: payload.status ?? "backlog",
      priority: payload.priority ?? "medium",
      labels: payload.labels ?? [],
      assignee_id: payload.assigneeId ?? null,
      parent_issue_id: payload.parentIssueId ?? null,
      source: payload.source ?? "manual",
      is_triaged: payload.isTriaged ?? true,
      reason: payload.reason ?? null,
      plan_info: payload.planInfo ?? null,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateIssue(
  id: string,
  payload: Partial<CreateIssuePayload>,
) {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.description !== undefined)
    updateData.description = payload.description;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.priority !== undefined) updateData.priority = payload.priority;
  if (payload.labels !== undefined) updateData.labels = payload.labels;
  if (payload.assigneeId !== undefined)
    updateData.assignee_id = payload.assigneeId;
  if (payload.reason !== undefined) updateData.reason = payload.reason;
  if (payload.planInfo !== undefined) updateData.plan_info = payload.planInfo;

  const { data, error } = await supabase
    .from("issues")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteIssue(id: string): Promise<void> {
  const { error } = await supabase.from("issues").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
```

### `services/issues.service.ts` — Barrel

```typescript
export {
  listIssues,
  getIssueById,
  getTeamIdFromSlug,
} from "./issues/issues-query.service";
export {
  createIssue,
  updateIssue,
  deleteIssue,
} from "./issues/issues-mutate.service";
export type {
  IssueListParams,
  CreateIssuePayload,
} from "./issues/issues-query.service";
```

---

## LANGKAH 3 — Teams Service

### `services/teams/teams-query.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export async function listUserTeams(userId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("role, team:teams(id, name, slug, avatar)")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...(row.team as any),
    role: row.role,
  }));
}

export async function getTeamBySlug(teamSlug: string, userId: string) {
  const { data, error } = await supabase
    .from("teams")
    .select(
      `
      *, team_members!inner(user_id, role)
    `,
    )
    .eq("slug", teamSlug)
    .eq("team_members.user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getTeamMembers(teamSlug: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select(
      `
      role, joined_at,
      user:profiles(id, name, email, avatar, initials)
    `,
    )
    .eq("team:teams.slug", teamSlug);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTeamSettings(teamSlug: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("slug", teamSlug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
```

### `services/teams/teams-mutate.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export interface CreateTeamPayload {
  name: string;
  slug: string;
  type?: "konstruksi" | "it" | "tugas";
}

export async function createTeam(userId: string, payload: CreateTeamPayload) {
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name: payload.name,
      slug: payload.slug.toUpperCase(),
      type: payload.type ?? "tugas",
    })
    .select()
    .maybeSingle();
  if (teamError) throw new Error(teamError.message);

  // Creator jadi PM
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: team!.id, user_id: userId, role: "pm" });
  if (memberError) throw new Error(memberError.message);

  return team;
}

export async function updateTeamSettings(
  teamSlug: string,
  payload: Record<string, unknown>,
) {
  const mapped: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.name) mapped.name = payload.name;
  if (payload.type) mapped.type = payload.type;
  if (payload.startDate) mapped.start_date = payload.startDate;
  if (payload.endDate) mapped.end_date = payload.endDate;
  if (payload.company) mapped.company = payload.company;
  if (payload.workArea) mapped.work_area = payload.workArea;
  if (payload.description) mapped.description = payload.description;
  if (payload.integrations) {
    const intg = payload.integrations as any;
    if (intg.githubRepo) mapped.github_repo = intg.githubRepo;
    if (intg.googleDocsUrl) mapped.google_docs_url = intg.googleDocsUrl;
  }

  const { data, error } = await supabase
    .from("teams")
    .update(mapped)
    .eq("slug", teamSlug)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
```

### `services/teams/teams-access.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export async function isTeamMember(
  teamSlug: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", userId)
    .eq("team:teams.slug", teamSlug)
    .maybeSingle();
  return !!data;
}

export async function getMemberRole(
  teamSlug: string,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", userId)
    .eq("team:teams.slug", teamSlug)
    .maybeSingle();
  return data?.role ?? null;
}
```

### `services/teams.service.ts` — Barrel

```typescript
export {
  listUserTeams,
  getTeamBySlug,
  getTeamMembers,
  getTeamSettings,
} from "./teams/teams-query.service";
export { createTeam, updateTeamSettings } from "./teams/teams-mutate.service";
export { isTeamMember, getMemberRole } from "./teams/teams-access.service";
```

---

## LANGKAH 4 — Triage Service

### `services/triage/triage-query.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export async function listUntriagedIssues(teamSlug: string) {
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("slug", teamSlug)
    .maybeSingle();
  if (!team) return { issues: [], total: 0 };

  const { data, error, count } = await supabase
    .from("issues")
    .select(`*, assignee:users!issues_assignee_id_fkey(id, name, initials)`, {
      count: "exact",
    })
    .eq("team_id", team.id)
    .eq("is_triaged", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return { issues: data ?? [], total: count ?? 0 };
}
```

### `services/triage/triage-accept.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export async function acceptIssue(
  issueId: string,
  payload: { priority?: string; assigneeId?: string; labels?: string[] },
) {
  const update: Record<string, unknown> = {
    is_triaged: true,
    status: "backlog",
    updated_at: new Date().toISOString(),
  };
  if (payload.priority) update.priority = payload.priority;
  if (payload.assigneeId) update.assignee_id = payload.assigneeId;
  if (payload.labels) update.labels = payload.labels;

  const { data, error } = await supabase
    .from("issues")
    .update(update)
    .eq("id", issueId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Issue tidak ditemukan");
  return data;
}
```

### `services/triage/triage-decline.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export async function declineIssue(issueId: string, reason?: string) {
  const { data, error } = await supabase
    .from("issues")
    .update({
      is_triaged: true,
      status: "cancelled",
      reason: reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", issueId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Issue tidak ditemukan");
  return { message: "Issue ditolak", issueId: data.id };
}
```

### `services/triage.service.ts` — Barrel

```typescript
export { listUntriagedIssues } from "./triage/triage-query.service";
export { acceptIssue } from "./triage/triage-accept.service";
export { declineIssue } from "./triage/triage-decline.service";
```

---

## LANGKAH 5 — Analytics Service

### `services/analytics/analytics-summary.service.ts`

```typescript
export function calcSummary(issues: any[]) {
  return {
    totalIssues: issues.length,
    openIssues: issues.filter((i) => !["done", "cancelled"].includes(i.status))
      .length,
    inProgress: issues.filter((i) => i.status === "in_progress").length,
    completed: issues.filter((i) => i.status === "done").length,
    cancelled: issues.filter((i) => i.status === "cancelled").length,
  };
}

export function calcByStatus(issues: any[]) {
  const map = new Map<string, number>();
  for (const i of issues) map.set(i.status, (map.get(i.status) ?? 0) + 1);
  return Array.from(map.entries()).map(([status, count]) => ({
    status,
    count,
  }));
}

export function calcByPriority(issues: any[]) {
  const map = new Map<string, number>();
  for (const i of issues) map.set(i.priority, (map.get(i.priority) ?? 0) + 1);
  return Array.from(map.entries()).map(([priority, count]) => ({
    priority,
    count,
  }));
}
```

### `services/analytics/analytics-breakdown.service.ts`

```typescript
export function calcByAssignee(issues: any[]) {
  const map = new Map<
    string,
    { name: string; initials: string; avatar?: string; count: number }
  >();
  for (const issue of issues) {
    if (!issue.assignee_id || !issue.assignee) continue;
    const a = issue.assignee as any;
    const existing = map.get(issue.assignee_id);
    if (existing) existing.count++;
    else
      map.set(issue.assignee_id, {
        name: a.name,
        initials: a.initials,
        avatar: a.avatar,
        count: 1,
      });
  }
  return Array.from(map.entries()).map(([userId, d]) => ({ userId, ...d }));
}
```

### `services/analytics/analytics-trend.service.ts`

```typescript
export function calcCompletionTrend(issues: any[]) {
  const map = new Map<string, { completed: number; created: number }>();
  for (const issue of issues) {
    const created = issue.created_at.slice(0, 10);
    if (!map.has(created)) map.set(created, { completed: 0, created: 0 });
    map.get(created)!.created++;
    if (issue.status === "done") {
      const done = issue.updated_at.slice(0, 10);
      if (!map.has(done)) map.set(done, { completed: 0, created: 0 });
      map.get(done)!.completed++;
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));
}
```

### `services/analytics.service.ts` — Barrel

```typescript
import { supabase } from "../lib/supabase";
import {
  calcSummary,
  calcByStatus,
  calcByPriority,
} from "./analytics/analytics-summary.service";
import { calcByAssignee } from "./analytics/analytics-breakdown.service";
import { calcCompletionTrend } from "./analytics/analytics-trend.service";

export async function getTeamAnalytics(
  teamSlug: string,
  params: { from?: string; to?: string } = {},
) {
  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("slug", teamSlug)
    .maybeSingle();
  if (!team) throw new Error(`Team '${teamSlug}' tidak ditemukan`);

  const toDate = params.to ? new Date(params.to) : new Date();
  const fromDate = params.from
    ? new Date(params.from)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data: issues, error } = await supabase
    .from("issues")
    .select(
      "id, status, priority, created_at, updated_at, assignee_id, assignee:users!issues_assignee_id_fkey(id, name, initials, avatar)",
    )
    .eq("team_id", team.id)
    .gte("created_at", fromDate.toISOString())
    .lte("created_at", toDate.toISOString());
  if (error) throw new Error(error.message);

  const all = issues ?? [];
  return {
    summary: calcSummary(all),
    byStatus: calcByStatus(all),
    byPriority: calcByPriority(all),
    byAssignee: calcByAssignee(all),
    completionTrend: calcCompletionTrend(all),
  };
}
```

---

## LANGKAH 6 — Users Service

### `services/users/users-profile.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id, name, email, avatar, initials,
      team_members(role, team:teams(id, name, slug, avatar))
    `,
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateUserProfile(
  userId: string,
  payload: { name?: string; avatar?: string },
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
```

### `services/users/users-activity.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export async function getUserActivity(userId: string) {
  const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("issues")
    .select("created_at")
    .eq("created_by_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const countMap = new Map<string, number>();
  for (const row of data ?? []) {
    const date = (row.created_at as string).slice(0, 10);
    countMap.set(date, (countMap.get(date) ?? 0) + 1);
  }

  const activities = Array.from(countMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const totalLast30Days = activities
    .filter((a) => new Date(a.date) >= thirtyAgo)
    .reduce((s, a) => s + a.count, 0);

  const totalAll = activities.reduce((s, a) => s + a.count, 0);
  const dailyAverage = Math.round((totalAll / 365) * 10) / 10;

  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (countMap.has(d.toISOString().slice(0, 10))) currentStreak++;
    else break;
  }

  return {
    activities,
    stats: { totalLast30Days, currentStreak, dailyAverage },
  };
}
```

### `services/users.service.ts` — Barrel

```typescript
export { getUserById, updateUserProfile } from "./users/users-profile.service";
export { getUserActivity } from "./users/users-activity.service";
```

---

## LANGKAH 7 — Notifications Service

### `services/notifications/notifications-query.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export async function listNotifications(
  userId: string,
  params: { unread?: boolean; page?: number; limit?: number } = {},
) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, params.limit ?? 20);

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (params.unread) query = query.eq("is_read", false);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return {
    notifications: data ?? [],
    unreadCount: unreadCount ?? 0,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
}
```

### `services/notifications/notifications-mutate.service.ts`

```typescript
import { supabase } from "../../lib/supabase";

export async function markNotificationRead(
  id: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw new Error(error.message);
}

export async function createNotification(payload: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  issueId?: string;
  teamId?: string;
}): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body ?? null,
    issue_id: payload.issueId ?? null,
    team_id: payload.teamId ?? null,
  });
  if (error) throw new Error(error.message);
}
```

### `services/notifications.service.ts` — Barrel

```typescript
export { listNotifications } from "./notifications/notifications-query.service";
export {
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
} from "./notifications/notifications-mutate.service";
```

---

## LANGKAH 8 — Google Docs Service

Pecah `google-docs.service.ts` (yang terpanjang) menjadi 4 file:

### `services/google-docs/google-docs-auth.service.ts`

```typescript
import { google } from "googleapis";

export function getGoogleAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!privateKey || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    throw new Error("Google Service Account credentials tidak ada di .env");
  }
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
      project_id: process.env.GOOGLE_PROJECT_ID,
    },
    scopes: ["https://www.googleapis.com/auth/documents"],
  });
}

export function extractDocumentId(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
```

### `services/google-docs/google-docs-format.service.ts`

Semua fungsi `formatPlanningContent`, `formatBacklogContent`, `formatExecutionContent`
dipindahkan ke sini apa adanya.

### `services/google-docs/google-docs-table.service.ts`

Semua fungsi `buildHeaderStyleRequests`, `buildRowColorRequests`,
`buildFillCellRequests`, `buildColumnWidthRequests`, `buildHeadingRequests`,
`extractTableCells`, `findMarkers` dipindahkan ke sini.

### `services/google-docs/google-docs-write.service.ts`

Fungsi `writeSectionToDoc` dan `appendSubSection` dipindahkan ke sini.

### `services/google-docs.service.ts` — Barrel

```typescript
export { extractDocumentId } from "./google-docs/google-docs-auth.service";
export { googleDocsService } from "./google-docs/google-docs-write.service";
```

---

## LANGKAH 9 — Verifikasi Setelah Refactor

```bash
# 1. TypeScript check — harus 0 error
cd apps/server && bun run tsc --noEmit

# 2. Pastikan barrel files sudah re-export semua yang dibutuhkan routes
grep -rn "from.*services/auth" apps/server/src/routes/
grep -rn "from.*services/issues" apps/server/src/routes/
grep -rn "from.*services/teams" apps/server/src/routes/

# 3. Jalankan dev server
bun run dev

# 4. Test endpoint
curl http://localhost:3000/health
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

---

## Aturan yang Harus Dipertahankan

```
✅ Routes hanya import dari barrel (auth.service.ts, bukan auth/login.service.ts)
✅ Setiap sub-file punya satu tanggung jawab
✅ Mapper/format functions = pure functions, tidak ada Supabase call
✅ Barrel file tidak mengandung business logic — hanya re-export
✅ Jika satu sub-file melebihi 150 baris → pecah lagi
```

---

## Ringkasan File yang Dibuat

| Folder           | File Baru | Dari Baris ke Baris              |
| ---------------- | --------- | -------------------------------- |
| `auth/`          | 6 file    | auth.service.ts dipecah          |
| `issues/`        | 2 file    | issues.service.ts dipecah        |
| `teams/`         | 3 file    | teams.service.ts dipecah         |
| `triage/`        | 3 file    | triage.service.ts dipecah        |
| `analytics/`     | 3 file    | analytics.service.ts dipecah     |
| `users/`         | 2 file    | users.service.ts dipecah         |
| `notifications/` | 2 file    | notifications.service.ts dipecah |
| `google-docs/`   | 4 file    | google-docs.service.ts dipecah   |
| **Barrel**       | 8 file    | Tidak berubah dari sisi routes   |

**Routes tidak berubah sama sekali** — semua import tetap dari barrel file.

---

_Refactor: Service Decomposition — Amertask Backend | April 2026_
