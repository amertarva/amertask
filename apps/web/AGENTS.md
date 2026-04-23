# Fix: 500 Error pada Proxy Route Next.js di Vercel

## Diagnosis dari Log

```
POST https://task-amertarva.vercel.app/api/auth/login 500
📡 API Response: {status: 500, contentType: 'application/json', url: '.../api/auth/login'}
```

**Yang terjadi:**

```
Browser
  → POST task-amertarva.vercel.app/api/auth/login   ← Next.js proxy route
      → harusnya forward ke api-amertask.vercel.app/auth/login  ← Backend
```

`contentType: 'application/json'` berarti Next.js proxy route-nya sendiri yang return 500 —
artinya proxy **tidak bisa reach backend** atau **BACKEND_URL tidak di-set** di Vercel frontend.

---

## LANGKAH 1 — Set `BACKEND_URL` di Vercel Frontend (Penyebab Paling Umum)

Buka Vercel Dashboard → pilih project **frontend** (`task-amertarva`) → **Settings** → **Environment Variables**.

Tambahkan:

```
BACKEND_URL = https://api-amertask.vercel.app
```

> **Jangan pakai** `http://` atau trailing slash.
> Format yang benar: `https://api-amertask.vercel.app` (tanpa `/` di akhir)

Setelah ditambahkan → **Redeploy** (wajib, env vars tidak aktif tanpa redeploy):

```
Vercel Dashboard → Deployments → titik tiga (...) → Redeploy
```

---

## LANGKAH 2 — Fix Semua Proxy Route Next.js

Masalah kedua yang sering terjadi: proxy route tidak handle `BACKEND_URL` yang undefined
dan tidak punya error handling yang benar. Perbaiki semua sekaligus.

### 2A — Pastikan `_lib/proxy.ts` Benar

**File: `apps/web/src/app/api/_lib/proxy.ts`**

```typescript
// Validasi BACKEND_URL saat module di-load
const BACKEND_URL_RAW = process.env.BACKEND_URL;

if (!BACKEND_URL_RAW) {
  console.error(
    "[proxy] FATAL: BACKEND_URL tidak di-set!\n" +
      "Tambahkan BACKEND_URL=https://api-amertask.vercel.app di Vercel env vars.",
  );
}

export const BACKEND_URL = (BACKEND_URL_RAW ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

/**
 * Parse response body dengan aman — tidak crash jika backend return plain text
 */
export async function safeJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return {
        error: "PARSE_ERROR",
        message: "Response dari backend bukan JSON valid",
      };
    }
  }
  const text = await response.text();
  return {
    error: "BACKEND_ERROR",
    message: text || "Terjadi kesalahan di backend",
  };
}

/**
 * Forward Authorization header dari request ke backend
 */
export function forwardAuth(request: Request): HeadersInit {
  const authHeader = request.headers.get("authorization");
  return {
    "Content-Type": "application/json",
    ...(authHeader ? { authorization: authHeader } : {}),
  };
}
```

### 2B — Fix Proxy Route Auth Login

**File: `apps/web/src/app/api/auth/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, safeJson } from "@/app/api/_lib/proxy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      console.error("[proxy /auth/login]", response.status, data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[proxy /auth/login] network error:", err);

    // Pesan yang jelas jika BACKEND_URL salah atau backend mati
    const isNetworkError =
      err instanceof TypeError && err.message.includes("fetch");

    return NextResponse.json(
      {
        error: "NETWORK_ERROR",
        message: isNetworkError
          ? `Tidak bisa reach backend di ${BACKEND_URL}. Cek BACKEND_URL env var.`
          : "Terjadi kesalahan saat menghubungi backend.",
      },
      { status: 502 },
    );
  }
}
```

### 2C — Fix Proxy Route Auth Register

**File: `apps/web/src/app/api/auth/register/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, safeJson } from "@/app/api/_lib/proxy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      console.error("[proxy /auth/register]", response.status, data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[proxy /auth/register] network error:", err);
    return NextResponse.json(
      { error: "NETWORK_ERROR", message: "Tidak bisa menghubungi backend." },
      { status: 502 },
    );
  }
}
```

### 2D — Fix Proxy Route Auth Refresh

**File: `apps/web/src/app/api/auth/refresh/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, safeJson } from "@/app/api/_lib/proxy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[proxy /auth/refresh] network error:", err);
    return NextResponse.json(
      { error: "NETWORK_ERROR", message: "Gagal refresh token." },
      { status: 502 },
    );
  }
}
```

### 2E — Fix Proxy Route Auth Logout

**File: `apps/web/src/app/api/auth/logout/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, safeJson, forwardAuth } from "@/app/api/_lib/proxy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      headers: forwardAuth(request),
      body: JSON.stringify(body),
    });

    const data = await safeJson(response);
    return NextResponse.json(data, {
      status: response.ok ? 200 : response.status,
    });
  } catch (err) {
    console.error("[proxy /auth/logout] network error:", err);
    return NextResponse.json(
      { error: "NETWORK_ERROR", message: "Gagal logout." },
      { status: 502 },
    );
  }
}
```

---

## LANGKAH 3 — Cek Struktur Folder Proxy Route

Jalankan perintah ini untuk memastikan semua file ada:

```bash
find apps/web/src/app/api -name "route.ts" | sort
```

Output yang diharapkan (minimal untuk auth):

```
apps/web/src/app/api/_lib/proxy.ts
apps/web/src/app/api/auth/login/route.ts
apps/web/src/app/api/auth/register/route.ts
apps/web/src/app/api/auth/refresh/route.ts
apps/web/src/app/api/auth/logout/route.ts
apps/web/src/app/api/users/me/route.ts
apps/web/src/app/api/teams/route.ts
apps/web/src/app/api/teams/[teamSlug]/issues/route.ts
...
```

Jika ada yang tidak ada → buat file tersebut dengan pola yang sama dari Langkah 2.

---

## LANGKAH 4 — Pastikan `http.ts` Frontend Hit `/api/*` (Bukan Backend Langsung)

**File: `apps/web/src/lib/core/http.ts`**

Cek `BASE_URL` yang dipakai:

```typescript
// BENAR — hit Next.js proxy route
const BASE_URL = ""; // empty string = relative URL ke domain yang sama

// ATAU
const BASE_URL =
  typeof window !== "undefined"
    ? "" // client-side: relative URL
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"); // server-side
```

```typescript
// SALAH — hit backend langsung, bypass proxy
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
//                                      ↑ Ini URL backend, bukan frontend
```

Jika `BASE_URL` mengarah langsung ke backend (`api-amertask.vercel.app`),
frontend browser akan kena CORS error. Semua request harus lewat `/api/*` di Next.js sendiri.

Pola yang benar di `http.ts`:

```typescript
// BASE_URL kosong = request ke /api/... di domain yang sama (task-amertarva.vercel.app)
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export async function apiClient<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // path harus diawali /api/...
  // contoh: /api/auth/login, /api/teams, /api/teams/PERDIG/issues
  const url = `${BASE_URL}${path}`;

  // ... sisa implementasi
}
```

---

## LANGKAH 5 — Verifikasi Env Vars Frontend di Vercel

Pastikan env vars berikut sudah ada di project **frontend** Vercel
(`task-amertarva` — bukan project backend):

```
BACKEND_URL           = https://api-amertask.vercel.app
NEXT_PUBLIC_APP_URL   = https://task-amertarva.vercel.app
```

> **`BACKEND_URL`** — dipakai server-side (Next.js API routes) untuk hit backend.
> **`NEXT_PUBLIC_APP_URL`** — dipakai client-side untuk tahu URL dirinya sendiri.
> Keduanya berbeda — jangan samakan.

---

## LANGKAH 6 — Verifikasi Env Vars Backend di Vercel

Pastikan env vars berikut ada di project **backend** Vercel (`api-amertask`):

```
FRONTEND_URL          = https://task-amertarva.vercel.app
```

Ini untuk konfigurasi CORS di backend. Jika salah, backend akan tolak request
dari frontend dengan CORS error (meski error-nya mungkin terlihat sebagai 500
di log frontend).

---

## LANGKAH 7 — Test Manual Setelah Fix

```bash
# 1. Test backend langsung (bypass proxy)
curl -X POST https://api-amertask.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Expected: { "user": {...}, "accessToken": "..." } atau error yang jelas

# 2. Test proxy Next.js
curl -X POST https://task-amertarva.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Expected: sama seperti di atas — proxy harus forward dan return response yang sama

# 3. Cek BACKEND_URL sudah terbaca oleh Next.js
curl https://task-amertarva.vercel.app/api/health-check
```

Buat health check route untuk diagnosis:

**File: `apps/web/src/app/api/health-check/route.ts`** (hapus setelah selesai debug):

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  // Cek apakah BACKEND_URL terbaca oleh Next.js
  const backendUrl = process.env.BACKEND_URL;

  // Coba reach backend
  let backendStatus = "tidak dicek";
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/health`, { method: "GET" });
      backendStatus = res.ok
        ? `✓ OK (${res.status})`
        : `✗ Error (${res.status})`;
    } catch (err) {
      backendStatus = `✗ Network error: ${String(err)}`;
    }
  }

  return NextResponse.json({
    BACKEND_URL: backendUrl ?? "✗ TIDAK DI-SET",
    backendStatus,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
```

Akses `https://task-amertarva.vercel.app/api/health-check` dan lihat hasilnya.

---

## Urutan Eksekusi

```
1. Set BACKEND_URL di Vercel frontend (Langkah 1) → Redeploy
2. Deploy health-check route (Langkah 7) → cek apakah BACKEND_URL terbaca
3. Jika BACKEND_URL ok tapi masih 500 → fix proxy route (Langkah 2)
4. Jika proxy route ok tapi CORS error → fix FRONTEND_URL di backend (Langkah 6)
5. Hapus health-check route setelah semua beres
```

---

## Ringkasan File yang Diubah

| File                                          | Aksi                                                 |
| --------------------------------------------- | ---------------------------------------------------- |
| Vercel Dashboard → frontend env vars          | Tambah `BACKEND_URL`                                 |
| Vercel Dashboard → backend env vars           | Cek `FRONTEND_URL`                                   |
| `apps/web/src/app/api/_lib/proxy.ts`          | Edit — tambah validasi + `.replace(/\/$/, '')`       |
| `apps/web/src/app/api/auth/login/route.ts`    | Edit — tambah error handling                         |
| `apps/web/src/app/api/auth/register/route.ts` | Edit — tambah error handling                         |
| `apps/web/src/app/api/auth/refresh/route.ts`  | Edit — tambah error handling                         |
| `apps/web/src/app/api/auth/logout/route.ts`   | Edit — tambah error handling                         |
| `apps/web/src/lib/core/http.ts`               | Cek BASE_URL arah ke `/api/*` bukan backend langsung |
| `apps/web/src/app/api/health-check/route.ts`  | Buat sementara untuk diagnosis                       |

---

_Fix: 500 Error Proxy Route — task-amertarva.vercel.app | April 2026_
