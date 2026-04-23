# Next.js API Routes - Proxy Layer

## 📋 Overview

Folder ini berisi Next.js API Routes yang berfungsi sebagai **proxy layer** antara frontend dan backend ElysiaJS. Semua request dari client akan melewati Next.js API routes terlebih dahulu sebelum diteruskan ke backend.

## 🎯 Keuntungan Menggunakan Proxy Layer

### 1. Security

- **Hide Backend URL**: URL backend tidak terekspos ke client
- **Server-side Token Validation**: Validasi token di server-side sebelum forward ke backend
- **Rate Limiting**: Bisa tambahkan rate limiting di proxy layer
- **Input Sanitization**: Validasi dan sanitasi input sebelum dikirim ke backend

### 2. Flexibility

- **Easy Backend Migration**: Ganti backend URL tanpa ubah frontend code
- **Multiple Backend Support**: Bisa route ke berbagai backend services
- **Request/Response Transformation**: Modifikasi data sebelum/sesudah backend
- **Caching**: Implementasi caching di proxy layer

### 3. Monitoring & Logging

- **Centralized Logging**: Log semua API calls di satu tempat
- **Error Tracking**: Track errors sebelum sampai ke client
- **Analytics**: Collect API usage analytics

### 4. Development Experience

- **Mock Responses**: Bisa return mock data saat backend down
- **API Versioning**: Handle multiple API versions
- **CORS Handling**: Tidak perlu configure CORS di backend

## 📁 Struktur Folder

```
src/app/api/
├── auth/
│   ├── login/route.ts          # POST /api/auth/login
│   ├── register/route.ts       # POST /api/auth/register
│   ├── refresh/route.ts        # POST /api/auth/refresh
│   └── logout/route.ts         # POST /api/auth/logout
│
├── users/
│   └── me/route.ts             # GET/PATCH /api/users/me
│
├── teams/
│   ├── route.ts                # GET/POST /api/teams
│   └── [teamSlug]/
│       ├── route.ts            # GET /api/teams/:slug
│       ├── issues/route.ts     # GET/POST /api/teams/:slug/issues
│       ├── triage/route.ts     # GET /api/teams/:slug/triage
│       ├── analytics/route.ts  # GET /api/teams/:slug/analytics
│       ├── members/route.ts    # GET /api/teams/:slug/members
│       └── settings/route.ts   # GET/PATCH /api/teams/:slug/settings
│
├── issues/
│   └── [id]/route.ts           # GET/PATCH/DELETE /api/issues/:id
│
├── triage/
│   └── [id]/
│       ├── accept/route.ts     # POST /api/triage/:id/accept
│       └── decline/route.ts    # POST /api/triage/:id/decline
│
├── inbox/
│   ├── route.ts                # GET /api/inbox
│   ├── [id]/read/route.ts      # PATCH /api/inbox/:id/read
│   └── read-all/route.ts       # PATCH /api/inbox/read-all
│
└── README.md                   # File ini
```

## 🔧 Cara Kerja

### Request Flow

```
Client (Browser)
    ↓
Next.js API Route (/api/*)
    ↓ (validate, transform)
Backend ElysiaJS (https://api-amertask.vercel.app)
    ↓ (process)
Next.js API Route
    ↓ (transform response)
Client (Browser)
```

### Example: Login Flow

1. **Client** calls `POST /api/auth/login` dengan `{ email, password }`
2. **Next.js API Route** (`apps/web/src/app/api/auth/login/route.ts`):
   - Validate input
   - Forward ke `https://api-amertask.vercel.app/auth/login`
3. **Backend ElysiaJS** process login dan return `{ user, accessToken, refreshToken }`
4. **Next.js API Route** forward response ke client
5. **Client** simpan tokens di localStorage

## 🔐 Authentication

Semua protected routes memerlukan `Authorization` header:

```typescript
headers: {
  'Authorization': 'Bearer <access_token>'
}
```

Next.js API routes akan:

1. Check apakah `Authorization` header ada
2. Forward header ke backend
3. Return 401 jika tidak ada token

## 📝 Pattern untuk Setiap Route

### GET Request (dengan query params)

```typescript
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const searchParams = request.nextUrl.searchParams;

  if (!authHeader) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
      { status: 401 },
    );
  }

  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/endpoint${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    headers: { Authorization: authHeader },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

### POST/PATCH Request (dengan body)

```typescript
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const body = await request.json();

  if (!authHeader) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
      { status: 401 },
    );
  }

  const response = await fetch(`${BACKEND_URL}/endpoint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

### Dynamic Route (dengan params)

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");

  // ... rest of the code
}
```

## 🌍 Environment Variables

### `.env.local`

```env
# Leave empty to use Next.js API routes (recommended)
NEXT_PUBLIC_API_URL=

# Backend URL for server-side proxy
BACKEND_URL=https://api-amertask.vercel.app
```

### Penjelasan:

- **NEXT_PUBLIC_API_URL**: URL yang digunakan oleh client-side code
  - Kosong = gunakan `/api` (Next.js API routes)
  - Isi dengan URL = direct connection ke backend (bypass proxy)
- **BACKEND_URL**: URL backend ElysiaJS (hanya digunakan di server-side)
  - Default: `https://api-amertask.vercel.app`
  - Production: ganti dengan production backend URL

## 🚀 Development

### Start Backend

```bash
cd apps/server
bun run dev  # Port 3000
```

### Start Frontend

```bash
cd apps/web
bun run dev  # Port 3001
```

### Test API Routes

```bash
# Login
curl -X POST https://task-amertarva.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get user profile (with token)
curl https://task-amertarva.vercel.app/api/users/me \
  -H "Authorization: Bearer <your_token>"
```

## 🔍 Debugging

### Enable Logging

Tambahkan console.log di route handlers:

```typescript
export async function GET(request: NextRequest) {
  console.log("📥 Incoming request:", request.url);
  console.log("🔑 Auth header:", request.headers.get("authorization"));

  // ... rest of code

  console.log("📤 Backend response:", response.status);
  console.log("📦 Response data:", data);
}
```

### Check Network Tab

Di browser DevTools → Network tab:

1. Lihat request ke `/api/*` (Next.js API routes)
2. Check status code dan response
3. Verify Authorization header

## 🎨 Customization Ideas

### 1. Add Request Logging

```typescript
// middleware untuk log semua requests
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // ... process request

  const duration = Date.now() - startTime;
  console.log(`✅ ${request.method} ${request.url} - ${duration}ms`);
}
```

### 2. Add Caching

```typescript
import { unstable_cache } from "next/cache";

export const GET = unstable_cache(
  async (request: NextRequest) => {
    // ... fetch data
  },
  ["teams-list"],
  { revalidate: 60 }, // cache for 60 seconds
);
```

### 3. Add Rate Limiting

```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "RATE_LIMIT", message: "Too many requests" },
      { status: 429 },
    );
  }

  // ... rest of code
}
```

### 4. Add Request Validation

```typescript
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const validation = loginSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: validation.error.message },
      { status: 400 },
    );
  }

  // ... forward to backend
}
```

## 📚 Resources

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js API Routes Best Practices](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Proxy Pattern](https://refactoring.guru/design-patterns/proxy)

## 🤝 Contributing

Saat menambah endpoint baru:

1. Buat file `route.ts` di folder yang sesuai
2. Implement HTTP methods (GET, POST, PATCH, DELETE)
3. Validate authorization header
4. Forward request ke backend
5. Handle errors dengan proper status codes
6. Update dokumentasi ini

---

**Created**: April 2026
**Last Updated**: April 2026
**Maintainer**: Backend Team
