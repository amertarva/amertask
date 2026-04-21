# TaskOps - Dokumentasi Integrasi Frontend & Backend

## 📋 Daftar Isi

1. [Arsitektur Sistem](#arsitektur-sistem)
2. [Struktur Database](#struktur-database)
3. [Mapping Data Frontend-Backend](#mapping-data-frontend-backend)
4. [Komponen Frontend yang Perlu Update](#komponen-frontend-yang-perlu-update)
5. [Perubahan Database yang Diperlukan](#perubahan-database-yang-diperlukan)
6. [Alur Data per Fitur](#alur-data-per-fitur)

---

## 🏗️ Arsitektur Sistem

### Stack Teknologi

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Backend**: ElysiaJS + Bun Runtime
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (Stateless)

### Alur Request

```
Frontend (Next.js)
    ↓
Next.js API Routes (/api/*)  [Proxy Layer]
    ↓
Backend (ElysiaJS :3000)
    ↓
Supabase Database
```

**Mengapa menggunakan Next.js API Routes sebagai proxy?**

- CORS handling yang lebih mudah
- Token management di server-side
- Rate limiting & caching
- Security layer tambahan

---

## 🗄️ Struktur Database

### Tabel Utama

#### 1. `users`

```sql
- id (uuid, PK, FK ke auth.users)
- name (text)
- email (text, unique)
- avatar (text, nullable)
- initials (text, generated)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### 2. `teams`

```sql
- id (uuid, PK)
- slug (text, unique)
- name (text)
- avatar (text, nullable)
- owner_id (uuid, FK ke users)
- type (enum: 'konstruksi', 'it', 'tugas')
- start_date (date, nullable)
- end_date (date, nullable)
- company (text, nullable)
- work_area (text, nullable)
- description (text, nullable)
- github_repo (text, nullable)
- google_docs_url (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### 3. `team_members`

```sql
- id (uuid, PK)
- team_id (uuid, FK ke teams)
- user_id (uuid, FK ke users)
- role (enum: 'owner', 'admin', 'member')
- joined_at (timestamptz)
- UNIQUE(team_id, user_id)
```

#### 4. `issues`

```sql
- id (uuid, PK)
- number (integer, auto-increment per team)
- team_id (uuid, FK ke teams)
- title (text)
- description (text, nullable)
- status (enum: 'backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled')
- priority (enum: 'urgent', 'high', 'medium', 'low')
- labels (text[], array)
- assignee_id (uuid, FK ke users, nullable)
- created_by_id (uuid, FK ke users)
- parent_issue_id (uuid, FK ke issues, nullable)
- source (enum: 'slack', 'email', 'manual')
- is_triaged (boolean, default true)
- created_at (timestamptz)
- updated_at (timestamptz)
- UNIQUE(team_id, number)
```

**Penjelasan Kolom `source`:**

- `manual`: Issue dibuat langsung oleh user melalui UI
- `slack`: Issue dibuat otomatis dari Slack integration (future feature)
- `email`: Issue dibuat dari email forwarding (future feature)
- Berguna untuk tracking asal issue dan automation workflows

---

## 🔄 Mapping Data Frontend-Backend

### 1. OnboardingHome Component

#### A. Ruang Kerja Anda (Teams List)

**Data Source:** `teams` + `team_members`

**Backend Endpoint:**

```
GET /api/teams
→ Backend: GET /teams
```

**Query Logic:**

```sql
SELECT t.*, tm.role
FROM teams t
JOIN team_members tm ON t.id = tm.team_id
WHERE tm.user_id = {current_user_id}
ORDER BY tm.joined_at DESC
```

**Response Format:**

```typescript
[
  {
    id: string;
    slug: string;
    name: string;
    avatar: string | null;
    type: 'konstruksi' | 'it' | 'tugas';
    role: 'owner' | 'admin' | 'member';
  }
]
```

#### B. Riwayat Aktivitas Ops (Activity Heatmap)

**Data Source:** `issues` (berdasarkan `created_by_id`)

**Backend Endpoint:** (Perlu dibuat baru)

```
GET /api/users/me/activity?days=365
→ Backend: GET /users/me/activity
```

**Query Logic:**

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as count
FROM issues
WHERE created_by_id = {current_user_id}
  AND created_at >= NOW() - INTERVAL '365 days'
GROUP BY DATE(created_at)
ORDER BY date ASC
```

**Response Format:**

```typescript
{
  activities: Array<{
    date: string; // 'YYYY-MM-DD'
    count: number;
  }>;
  stats: {
    totalLast30Days: number;
    currentStreak: number;
    dailyAverage: number;
  }
}
```

---

### 2. NewProjectWizard Component

#### Perubahan yang Diperlukan:

1. **Role Creator**: Ubah dari `owner` menjadi `pm` (Project Manager)
2. **GitHub & Google Docs**: Sudah opsional (tidak required)

**Backend Endpoint:**

```
POST /api/teams
→ Backend: POST /teams

PATCH /api/teams/{slug}/settings
→ Backend: PATCH /teams/{slug}/settings
```

**Request Payload (Create):**

```typescript
{
  name: string;
  slug: string;
  type: "konstruksi" | "it" | "tugas";
}
```

**Request Payload (Update Settings):**

```typescript
{
  startDate?: string;
  endDate?: string;
  company?: string;
  workArea?: string;
  description?: string;
  integrations?: {
    githubRepo?: string;
    googleDocsUrl?: string;
  };
}
```

**Backend Logic Update:**

```typescript
// Di teams.service.ts - createTeam()
// Ubah role dari 'owner' menjadi 'pm'
await supabase.from("team_members").insert({
  team_id: team.id,
  user_id: userId,
  role: "pm", // ← PERUBAHAN DI SINI
});
```

---

### 3. Dashboard Components

#### A. TeamOverviewDashboard (Overview)

**Data Sources:**

1. Team Info: `teams`
2. Issues Stats: `issues`
3. Recent Activity: `issues` (by `created_at`)

**Backend Endpoints:**

```
GET /api/teams/{slug}
→ Backend: GET /teams/{slug}

GET /api/teams/{slug}/issues
→ Backend: GET /teams/{slug}/issues
```

**Stats Calculation:**

```typescript
{
  total: issues.length,
  inProgress: issues.filter(i => i.status === 'in_progress').length,
  done: issues.filter(i => i.status === 'done').length,
  blocked: issues.filter(i => i.status === 'cancelled').length,
}
```

**Recent Activity (4 terbaru):**

```sql
SELECT i.*, u.name as creator_name, u.initials
FROM issues i
LEFT JOIN users u ON i.created_by_id = u.id
WHERE i.team_id = {team_id}
ORDER BY i.created_at DESC
LIMIT 4
```

---

#### B. PlanningContainer

**Data Source:** `issues` dengan status `backlog` atau `todo`

**Backend Endpoint:**

```
GET /api/teams/{slug}/issues?status=backlog,todo
→ Backend: GET /teams/{slug}/issues
```

**Mapping ke Planning Format:**

```typescript
{
  id: `${teamSlug}-${issue.number}`,
  issueId: issue.id,
  number: issue.number,
  taskName: issue.title,
  description: issue.description,
  expectedOutput: [issue.plan_info], // ← KOLOM BARU
  assignedUser: issue.assignee?.name || 'Unassigned',
  avatar: issue.assignee?.initials || 'U',
  status: issue.status === 'backlog' ? 'To Do' : 'In Progress',
  priority: issue.priority,
  createdBy: issue.created_by?.name, // ← Penanggung jawab
}
```

---

#### C. ExecutionContainer

**Data Source:** `issues` dengan status `in_progress`, `in_review`, `done`

**Backend Endpoint:**

```
GET /api/teams/{slug}/issues?status=in_progress,in_review,done
→ Backend: GET /teams/{slug}/issues
```

**Mapping ke Execution Format:**

```typescript
{
  no: index + 1,
  issueId: issue.id,
  activity: issue.title,
  taskId: `${teamSlug}-${issue.number}`,
  date: new Date(issue.updated_at).toLocaleString('id-ID'),
  assignedUser: issue.assignee?.name || 'Unassigned',
  avatar: issue.assignee?.initials || 'U',
  status: issue.status === 'done' ? 'SELESAI' :
          issue.status === 'in_review' ? 'REVIEW' : 'PROSES',
  notes: issue.description || 'Tidak ada catatan',
}
```

---

#### D. BacklogContainer

**Data Sources:**

1. **Product Backlog**: `issues` dengan `status = 'backlog'`
2. **Priority Backlog**: `issues` dengan `priority IN ('urgent', 'high')`

**Backend Endpoint:**

```
GET /api/teams/{slug}/issues
→ Backend: GET /teams/{slug}/issues
```

**Product Backlog Mapping:**

```typescript
{
  id: `${teamSlug}-${issue.number}`,
  issueId: issue.id,
  featureName: issue.title,
  description: issue.description,
  targetUser: issue.assignee?.name || 'Belum ditentukan',
}
```

**Priority Backlog Mapping:**

```typescript
{
  id: `${teamSlug}-${issue.number}`,
  issueId: issue.id,
  featureName: issue.title,
  priority: issue.priority === 'urgent' ? 'TINGGI' : 'SEDANG',
  priorityClass: /* CSS class based on priority */,
  reason: issue.reason, // ← KOLOM BARU
}
```

---

#### E. Team & Members

**Data Source:** `team_members` + `users`

**Backend Endpoint:**

```
GET /api/teams/{slug}/members
→ Backend: GET /teams/{slug}/members
```

**Query Logic:**

```sql
SELECT
  u.id, u.name, u.email, u.avatar, u.initials,
  tm.role, tm.joined_at
FROM team_members tm
JOIN users u ON tm.user_id = u.id
WHERE tm.team_id = {team_id}
ORDER BY
  CASE tm.role
    WHEN 'pm' THEN 1
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'member' THEN 3
  END,
  tm.joined_at ASC
```

---

#### F. Pengaturan Proyek (Settings)

**Data Source:** `teams`

**Backend Endpoints:**

```
GET /api/teams/{slug}/settings
→ Backend: GET /teams/{slug}/settings

PATCH /api/teams/{slug}/settings
→ Backend: PATCH /teams/{slug}/settings
```

**Response Format:**

```typescript
{
  id: string;
  teamId: string;
  name: string;
  slug: string;
  type: string;
  startDate: string | null;
  endDate: string | null;
  projectManagerId: string;
  company: string | null;
  workArea: string | null;
  description: string | null;
  integrations: {
    githubRepo: string | null;
    googleDocsUrl: string | null;
  }
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔧 Perubahan Database yang Diperlukan

### 1. Tambah Kolom Baru di Tabel `issues`

```sql
-- Tambah kolom reason untuk Priority Backlog
ALTER TABLE public.issues
ADD COLUMN reason TEXT;

-- Tambah kolom plan_info untuk Planning description
ALTER TABLE public.issues
ADD COLUMN plan_info TEXT;

-- Tambah comment untuk dokumentasi
COMMENT ON COLUMN public.issues.reason IS 'Alasan prioritas untuk backlog priority';
COMMENT ON COLUMN public.issues.plan_info IS 'Informasi detail planning/expected output';
```

### 2. Update Enum Role di `team_members`

```sql
-- Tambah 'pm' ke enum role
ALTER TABLE public.team_members
DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members
ADD CONSTRAINT team_members_role_check
CHECK (role IN ('owner', 'admin', 'member', 'pm'));
```

### 3. Tambah Index untuk Performance

```sql
-- Index untuk query activity by user
CREATE INDEX IF NOT EXISTS idx_issues_created_by_date
ON public.issues(created_by_id, created_at DESC);

-- Index untuk query by status
CREATE INDEX IF NOT EXISTS idx_issues_team_status
ON public.issues(team_id, status);

-- Index untuk query by priority
CREATE INDEX IF NOT EXISTS idx_issues_team_priority
ON public.issues(team_id, priority);
```

---

## 📊 Alur Data per Fitur

### Fitur 1: User Login & Dashboard Home

```
1. User login → POST /api/auth/login
   ↓
2. Simpan JWT token di localStorage
   ↓
3. Fetch user data → GET /api/users/me
   ↓
4. Fetch teams → GET /api/teams
   ↓
5. Fetch activity → GET /api/users/me/activity
   ↓
6. Render OnboardingHome dengan data real
```

### Fitur 2: Create New Project

```
1. User isi form wizard
   ↓
2. Submit Step 1 → POST /api/teams
   Backend: Create team + Add creator as 'pm' role
   ↓
3. Submit Step 2 → PATCH /api/teams/{slug}/settings
   Backend: Update team settings (github, docs, dll)
   ↓
4. Redirect ke /projects/{slug}
```

### Fitur 3: View Team Dashboard

```
1. User akses /projects/{slug}
   ↓
2. Fetch team info → GET /api/teams/{slug}
   ↓
3. Fetch issues → GET /api/teams/{slug}/issues
   ↓
4. Calculate stats di frontend
   ↓
5. Render dashboard dengan data real
```

### Fitur 4: Manage Issues (Planning/Backlog/Execution)

```
CREATE:
POST /api/teams/{slug}/issues
Body: { title, description, status, priority, plan_info, reason }

UPDATE:
PATCH /api/issues/{id}
Body: { title?, description?, status?, priority?, plan_info?, reason? }

DELETE:
DELETE /api/issues/{id}

LIST:
GET /api/teams/{slug}/issues?status=backlog&priority=urgent
```

---

## 🔐 Authentication Flow

```
1. Login → Dapat access_token + refresh_token (JWT)
2. Simpan di localStorage via tokenStorage
3. Setiap request:
   - Frontend: Ambil token dari localStorage
   - Next.js API: Forward token ke backend
   - Backend: Verify JWT → Extract user_id
   - Backend: Query database dengan user_id
4. Token expired:
   - Frontend: Detect 401
   - Auto refresh via POST /api/auth/refresh
   - Retry request dengan token baru
```

---

## 📁 Struktur File Backend

```
apps/server/src/
├── index.ts                 # Entry point
├── routes/
│   ├── auth.routes.ts       # Login, register, refresh
│   ├── users.routes.ts      # User profile, activity
│   ├── teams.routes.ts      # Teams CRUD, settings
│   ├── issues.routes.ts     # Issues CRUD
│   ├── triage.routes.ts     # Triage management
│   ├── inbox.routes.ts      # Notifications
│   └── analytics.routes.ts  # Analytics data
├── controllers/
│   ├── auth.controller.ts
│   ├── users.controller.ts
│   ├── teams.controller.ts
│   ├── issues.controller.ts
│   ├── triage.controller.ts
│   └── analytics.controller.ts
├── services/
│   ├── auth.service.ts      # Business logic
│   ├── users.service.ts
│   ├── teams.service.ts
│   ├── issues.service.ts
│   ├── triage.service.ts
│   └── notifications.service.ts
├── middleware/
│   ├── auth.ts              # JWT verification
│   └── teamAccess.ts        # Team access control
└── lib/
    ├── supabase.ts          # DB client
    ├── jwt.ts               # JWT utils
    └── errors.ts            # Error handling
```

---

## 📁 Struktur File Frontend

```
apps/web/src/
├── app/
│   ├── api/                 # Next.js API Routes (Proxy)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── teams/
│   │   ├── issues/
│   │   └── ...
│   ├── home/                # Onboarding pages
│   ├── projects/[slug]/     # Team dashboard
│   └── auth/                # Login/Register
├── components/
│   ├── onboarding/
│   │   ├── OnboardingHome.tsx
│   │   └── NewProjectWizard.tsx
│   ├── dashboard/
│   │   ├── overview/
│   │   ├── planning/
│   │   ├── backlog/
│   │   ├── execution/
│   │   ├── team/
│   │   └── issues/
│   ├── settings/
│   └── layout/
├── hooks/
│   ├── useAuth.ts           # Auth state management
│   ├── useTeams.ts          # Teams data fetching
│   ├── useIssues.ts         # Issues data fetching
│   └── ...
├── lib/
│   └── core/
│       ├── http.ts          # API client
│       ├── auth.api.ts      # Auth API calls
│       ├── users.api.ts     # Users API calls
│       ├── teams.api.ts     # Teams API calls
│       ├── issues.api.ts    # Issues API calls
│       └── index.ts         # Exports
└── types/
    └── index.ts             # TypeScript types
```

---

## ✅ Checklist Implementasi

### Backend Tasks

- [x] Setup ElysiaJS server
- [x] Implement authentication (JWT)
- [x] Create teams routes & services
- [x] Create issues routes & services
- [ ] **Add `reason` and `plan_info` columns to issues table**
- [ ] **Update team_members role enum to include 'pm'**
- [ ] **Create user activity endpoint (GET /users/me/activity)**
- [ ] **Update createTeam to use 'pm' role instead of 'owner'**
- [x] Implement inline auth verification
- [x] Fix .single() to .maybeSingle() for error handling

### Frontend Tasks

- [x] Setup Next.js API proxy layer
- [x] Create authentication hooks
- [x] Create teams hooks
- [x] Create issues hooks
- [x] Implement OnboardingHome with teams list
- [ ] **Implement activity heatmap with real data**
- [ ] **Update NewProjectWizard to use 'pm' role**
- [x] Update TeamOverviewDashboard with real data
- [x] Update PlanningContainer with real data
- [x] Update ExecutionContainer with real data
- [x] Update BacklogContainer with real data
- [ ] **Add plan_info field to Planning forms**
- [ ] **Add reason field to Priority Backlog forms**

### Database Tasks

- [ ] **Run migration to add new columns**
- [ ] **Update role enum constraint**
- [ ] **Add performance indexes**
- [x] Verify RLS policies are correct

---

## 🐛 Known Issues & Fixes

### Issue 1: "Terjadi kesalahan server" saat fetch team

**Cause:** `.single()` throws error jika tidak ada data
**Fix:** Ubah semua `.single()` menjadi `.maybeSingle()`
**Status:** ✅ Fixed

### Issue 2: Context `currentUser` not found

**Cause:** Elysia middleware `.derive()` tidak pass context dengan benar
**Fix:** Implement inline auth verification di setiap route
**Status:** ✅ Fixed

### Issue 3: Teams API returns 500

**Cause:** Missing RLS policies untuk service_role
**Fix:** Add RLS policies di database
**Status:** ✅ Fixed

---

## 📞 API Endpoints Summary

### Authentication

- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token

### Users

- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update user profile
- `GET /api/users/me/activity` - Get user activity (⚠️ Perlu dibuat)

### Teams

- `GET /api/teams` - List user teams
- `POST /api/teams` - Create new team
- `GET /api/teams/{slug}` - Get team details
- `GET /api/teams/{slug}/members` - Get team members
- `GET /api/teams/{slug}/settings` - Get team settings
- `PATCH /api/teams/{slug}/settings` - Update team settings

### Issues

- `GET /api/teams/{slug}/issues` - List team issues (with filters)
- `POST /api/teams/{slug}/issues` - Create new issue
- `GET /api/issues/{id}` - Get issue details
- `PATCH /api/issues/{id}` - Update issue
- `DELETE /api/issues/{id}` - Delete issue

### Analytics

- `GET /api/teams/{slug}/analytics` - Get team analytics

---

## 🎯 Next Steps

1. **Database Migration**
   - Tambah kolom `reason` dan `plan_info` ke tabel `issues`
   - Update enum `role` di `team_members` untuk include 'pm'
   - Tambah indexes untuk performance

2. **Backend Development**
   - Buat endpoint `GET /users/me/activity` untuk activity heatmap
   - Update `createTeam` service untuk gunakan role 'pm'
   - Update issues service untuk handle kolom baru

3. **Frontend Development**
   - Implement activity heatmap dengan data real
   - Update NewProjectWizard untuk gunakan role 'pm'
   - Tambah form fields untuk `plan_info` dan `reason`
   - Update semua dashboard components untuk gunakan kolom baru

4. **Testing**
   - Test create team dengan role 'pm'
   - Test activity heatmap calculation
   - Test planning dengan plan_info
   - Test priority backlog dengan reason

---

## 📝 Notes

- Semua endpoint backend menggunakan inline auth verification
- Token disimpan di localStorage via `tokenStorage` utility
- Next.js API routes bertindak sebagai proxy layer
- Database menggunakan Supabase dengan RLS disabled (backend has full access)
- Refresh tokens bersifat stateless (JWT only, no database storage)
- Notifications bersifat in-memory (Map-based, no database storage)

---

**Dokumentasi ini dibuat untuk memudahkan tim dalam memahami alur data dan integrasi antara frontend dan backend.**

_Last Updated: 2026-04-18_
