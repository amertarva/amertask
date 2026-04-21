# Amertask Backend API

Backend API untuk Amertask - Project Management System yang dibangun dengan ElysiaJS, Bun, dan Supabase.

## Tech Stack

- **Runtime**: Bun ≥ 1.2
- **Framework**: ElysiaJS ≥ 1.1
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (jose)
- **Validation**: Elysia TypeBox
- **Docs**: Swagger UI

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Variables

Copy `.env.example` to `.env` dan isi dengan kredensial Supabase Anda:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=your-secret-min-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

Jalankan SQL di `database.sql` pada Supabase SQL Editor untuk membuat tabel dan schema.

### 4. Run Development Server

```bash
bun run dev
```

Server akan berjalan di `http://localhost:3001`

## API Documentation

Swagger documentation tersedia di: `http://localhost:3001/docs`

## Project Structure

```
src/
├── index.ts                 # Entry point
├── types/                   # TypeScript types
├── lib/                     # Utilities (supabase, jwt, errors)
├── middleware/              # Auth & team access middleware
├── services/                # Data access layer
├── controllers/             # Business logic
└── routes/                  # API routes
```

## Available Endpoints

### Authentication

- `POST /auth/register` - Register user baru
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout

### Users

- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update profile

### Teams

- `GET /teams` - List user teams
- `POST /teams` - Create team
- `GET /teams/:teamSlug` - Get team details
- `GET /teams/:teamSlug/members` - Get team members
- `GET /teams/:teamSlug/settings` - Get team settings
- `PATCH /teams/:teamSlug/settings` - Update team settings

### Issues

- `GET /teams/:teamSlug/issues` - List issues (with filters)
- `POST /teams/:teamSlug/issues` - Create issue
- `GET /issues/:id` - Get issue detail
- `PATCH /issues/:id` - Update issue
- `DELETE /issues/:id` - Delete issue

### Triage

- `GET /teams/:teamSlug/triage` - List untriaged issues
- `POST /triage/:id/accept` - Accept issue to backlog
- `POST /triage/:id/decline` - Decline issue

### Inbox

- `GET /inbox` - Get notifications
- `PATCH /inbox/:id/read` - Mark as read
- `PATCH /inbox/read-all` - Mark all as read

### Analytics

- `GET /teams/:teamSlug/analytics` - Get team analytics

## Architecture

Backend menggunakan **Path-Layered Architecture**:

1. **Routes** - Deklarasi endpoint, validation schema
2. **Controllers** - Business logic, orchestration
3. **Services** - Data access, Supabase queries
4. **Middleware** - Auth guard, team access control

## Development

```bash
# Development dengan hot reload
bun run dev

# Production
bun run start
```

## Notes

- Backend berjalan di port **3001** (frontend di 3000)
- Semua endpoint (kecuali `/auth/*`) memerlukan JWT token
- Refresh token dirotasi setiap penggunaan untuk keamanan
- Service role key digunakan untuk bypass RLS di Supabase

---

Untuk detail lengkap, lihat `claude.md`
