# Fix: `FUNCTION_INVOCATION_FAILED` di Vercel

## Konteks Error

```
500: INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
```

Artinya: function **berhasil di-deploy** dan **berhasil dipanggil**, tapi **crash saat eksekusi**.
Ini bukan build error — kode sudah masuk ke Vercel, tapi meledak saat runtime.

Frontend aman → masalah murni di backend serverless function.

---

## LANGKAH 0 — Baca Log Vercel Dulu (WAJIB Sebelum Apapun)

Tanpa log, semua fix di bawah hanya tebakan. Log Vercel berisi pesan error asli.

```
Vercel Dashboard
  → Pilih project backend (api-amertask)
  → Tab "Logs" (bukan "Deployments")
  → Filter: Function = api/index
  → Cari baris merah / ERROR
  → Salin pesan error lengkapnya
```

Atau via CLI:

```bash
vercel logs api-amertask.vercel.app --follow
```

**Cocokkan error yang muncul dengan tabel di bawah, lalu langsung ke langkah yang sesuai.**

---

## Peta Error → Langkah Fix

| Pesan di Log Vercel                                | Penyebab                              | Langkah     |
| -------------------------------------------------- | ------------------------------------- | ----------- |
| `Cannot find module '../src/app'`                  | Path resolution gagal                 | → Langkah 1 |
| `Cannot find module 'elysia'` atau package lain    | Dependency tidak ter-install          | → Langkah 2 |
| `app.listen is not a function` atau `listen` crash | `.listen()` terpanggil di Vercel      | → Langkah 3 |
| `Environment variable ... is not defined`          | Env vars belum di-set di Vercel       | → Langkah 4 |
| `TypeError: app.handle is not a function`          | Export format salah untuk Bun runtime | → Langkah 5 |
| Error tidak terbaca / function timeout             | Inisialisasi module crash saat import | → Langkah 6 |
| Tidak ada log sama sekali                          | Function tidak pernah sampai ke kode  | → Langkah 7 |

---

## Langkah 1 — Fix: Path Resolution (`Cannot find module '../src/app'`)

**Penyebab:** Vercel Bun runtime bundling tidak resolve relative import `../src/app` dengan benar.

**Fix:** Jadikan `api/index.ts` self-contained — import langsung semua yang dibutuhkan
tanpa bergantung pada relative path ke `src/`.

**File: `apps/server/api/index.ts`** — ganti seluruh isinya:

```typescript
// Self-contained entry point — tidak bergantung pada ../src/app
// Ini memastikan Vercel bisa resolve semua import dengan benar

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

// Import routes dengan path eksplisit dari root
import { authRoutes } from "../src/routes/auth.routes";
import { usersRoutes } from "../src/routes/users.routes";
import { teamsRoutes } from "../src/routes/teams.routes";
import { issuesRoutes } from "../src/routes/issues.routes";
import { triageRoutes } from "../src/routes/triage.routes";
import { analyticsRoutes } from "../src/routes/analytics.routes";
import { exportRoutes } from "../src/routes/export.routes";

const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3001")
  .split(",")
  .map((o) => o.trim());

const app = new Elysia()
  .use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    runtime:
      typeof Bun !== "undefined" ? `bun ${Bun.version}` : process.version,
  }))
  .use(authRoutes)
  .use(usersRoutes)
  .use(teamsRoutes)
  .use(issuesRoutes)
  .use(triageRoutes)
  .use(analyticsRoutes)
  .use(exportRoutes)
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "VALIDATION_ERROR", message: error.message };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "NOT_FOUND", message: "Endpoint tidak ditemukan" };
    }
    console.error("[global error]", code, error);
    set.status = 500;
    return { error: "INTERNAL_ERROR", message: "Terjadi kesalahan server" };
  });

export default app.handle;
```

Deploy ulang setelah perubahan ini:

```bash
vercel --prod
```

---

## Langkah 2 — Fix: Dependency Tidak Ter-install

**Penyebab:** Package seperti `elysia`, `googleapis`, `jose` tidak ada di `node_modules`
saat Vercel menjalankan function.

**Cek:** Pastikan semua dependency ada di `dependencies` (bukan `devDependencies`) di `package.json`:

```json
{
  "dependencies": {
    "elysia": "latest",
    "@elysiajs/cors": "latest",
    "@supabase/supabase-js": "latest",
    "googleapis": "latest",
    "jose": "latest"
  }
}
```

**Dependency yang sering salah ditaruh di `devDependencies` dan menyebabkan crash di production:**

- `elysia` → harus di `dependencies`
- `@elysiajs/cors` → harus di `dependencies`
- `jose` → harus di `dependencies`
- `googleapis` → harus di `dependencies`

Pindahkan semua yang dibutuhkan saat runtime ke `dependencies`, lalu deploy ulang.

---

## Langkah 3 — Fix: `.listen()` Terpanggil di Vercel

**Penyebab:** File `src/index.ts` ter-import (langsung atau tidak langsung) sehingga
`app.listen()` terpanggil di environment Vercel yang tidak support ini.

**Cek:** Pastikan `api/index.ts` **tidak** mengimport `src/index.ts`:

```bash
grep -rn "from.*index\|require.*index" apps/server/api/
```

Jika ada import ke `src/index.ts` → hapus dan ganti dengan import ke `src/app.ts`.

**Juga cek** apakah `src/app.ts` ada baris `.listen()`:

```bash
grep -n "\.listen(" apps/server/src/app.ts
```

Output harus kosong. Jika ada → hapus baris tersebut dari `src/app.ts`.
`.listen()` hanya boleh ada di `src/index.ts` (local dev only).

---

## Langkah 4 — Fix: Environment Variables Belum Di-set

**Penyebab:** Kode mengakses `process.env.SUPABASE_URL`, `process.env.JWT_SECRET`, dll.
saat module di-load, tapi variabelnya tidak ada di Vercel → crash dengan undefined.

**Cek di Vercel Dashboard:**

```
Project → Settings → Environment Variables
```

Pastikan semua variabel berikut ada dan nilainya benar:

```
SUPABASE_URL                 ← wajib ada
SUPABASE_ANON_KEY            ← wajib ada
SUPABASE_SERVICE_ROLE_KEY    ← wajib ada
JWT_SECRET                   ← wajib ada (min 32 karakter)
JWT_ACCESS_EXPIRES            ← wajib ada (contoh: 15m)
JWT_REFRESH_EXPIRES           ← wajib ada (contoh: 7d)
FRONTEND_URL                 ← wajib ada (URL frontend production)
NODE_ENV                     ← set ke "production"
```

Jika pakai Google Docs export:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL ← wajib ada
GOOGLE_PRIVATE_KEY            ← wajib ada
GOOGLE_PROJECT_ID             ← wajib ada
```

**Setelah menambahkan env vars → redeploy wajib:**

```bash
vercel --prod
```

**Fix defensif di `src/lib/supabase.ts`** — tambahkan validasi di awal:

```typescript
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    `[supabase] Environment variables tidak lengkap.\n` +
      `SUPABASE_URL: ${supabaseUrl ? "ada" : "TIDAK ADA"}\n` +
      `SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? "ada" : "TIDAK ADA"}`,
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
```

Ini akan menghasilkan pesan error yang jelas di log Vercel, bukan crash tanpa penjelasan.

---

## Langkah 5 — Fix: Export Format Salah untuk Bun Runtime

**Penyebab:** Vercel Bun runtime (public beta) mungkin butuh format export yang berbeda
dari `export default app.handle`.

**Coba format alternatif di `api/index.ts`:**

**Opsi A** — Object dengan fetch property (format Bun server standard):

```typescript
import { app } from "../src/app";

export default {
  fetch: app.handle.bind(app),
};
```

**Opsi B** — Named export fetch:

```typescript
import { app } from "../src/app";

export const fetch = (request: Request) => app.handle(request);
```

**Opsi C** — Wrap explicit dengan try-catch untuk isolasi error:

```typescript
import { app } from "../src/app";

export default async function handler(request: Request): Promise<Response> {
  try {
    return await app.handle(request);
  } catch (err) {
    console.error("[handler crash]", err);
    return new Response(
      JSON.stringify({ error: "HANDLER_CRASH", message: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
```

Coba satu per satu, deploy ulang setiap kali, cek log.

---

## Langkah 6 — Fix: Module Crash Saat Import (Silent Crash)

**Penyebab:** Salah satu file yang di-import mengeksekusi kode berbahaya saat module di-load
— bukan di dalam function. Ini menyebabkan crash sebelum ada request masuk.

**Contoh pola berbahaya:**

```typescript
// ❌ Ini dieksekusi saat module di-load — crash jika env var tidak ada
const SECRET = process.env.JWT_SECRET!;
const jwtKey = await importJWT(SECRET); // await di top-level bisa crash

// ❌ Koneksi database dibuka saat module di-load
const db = await connectDatabase();
```

**Fix:** Pindahkan semua inisialisasi ke dalam fungsi, bukan top-level:

```typescript
// ✅ Lazy init — hanya dieksekusi saat pertama kali dipanggil
let _jwtKey: CryptoKey | null = null;
async function getJwtKey(): Promise<CryptoKey> {
  if (_jwtKey) return _jwtKey;
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET tidak ada di environment");
  _jwtKey = await importJWT(secret);
  return _jwtKey;
}
```

**Cari semua top-level await di codebase:**

```bash
grep -rn "^const.*await\|^let.*await\|^var.*await" apps/server/src/ --include="*.ts"
```

Setiap hasil → pindahkan ke dalam fungsi.

---

## Langkah 7 — Diagnosis dengan Endpoint Minimal

Jika log masih tidak jelas, isolasi masalah dengan menyederhanakan `api/index.ts`
jadi versi minimal yang tidak import apapun:

**File: `apps/server/api/index.ts`** — ganti sementara dengan ini:

```typescript
// VERSI DIAGNOSIS — tidak ada external import
// Deploy ini dulu untuk memastikan Vercel bisa menjalankan Bun function

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Test environment variables
  const envCheck = {
    SUPABASE_URL: process.env.SUPABASE_URL ? "✓ ada" : "✗ tidak ada",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "✓ ada"
      : "✗ tidak ada",
    JWT_SECRET: process.env.JWT_SECRET ? "✓ ada" : "✗ tidak ada",
    FRONTEND_URL: process.env.FRONTEND_URL ?? "✗ tidak ada",
    NODE_ENV: process.env.NODE_ENV ?? "tidak di-set",
    runtime: typeof Bun !== "undefined" ? `bun ${Bun.version}` : "node",
    path: url.pathname,
  };

  console.log("[diagnosis]", JSON.stringify(envCheck, null, 2));

  return new Response(JSON.stringify(envCheck, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
```

Deploy dan akses `https://api-amertask.vercel.app/health`:

- Jika **muncul JSON** → Vercel bisa jalankan Bun function, masalah ada di import kode asli
- Jika **masih crash** → masalah di level Vercel config atau Bun runtime itu sendiri

Setelah diagnosis selesai, kembalikan ke implementasi asli.

---

## Langkah 8 — Fix `vercel.json` Jika Rewrites Bermasalah

Jika endpoint minimal di Langkah 7 berhasil tapi routing tidak benar,
coba perbaiki `vercel.json`:

```json
{
  "bunVersion": "1.x",
  "functions": {
    "api/index.ts": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/health",
      "destination": "/api/index"
    },
    {
      "source": "/auth/:path*",
      "destination": "/api/index"
    },
    {
      "source": "/users/:path*",
      "destination": "/api/index"
    },
    {
      "source": "/teams/:path*",
      "destination": "/api/index"
    },
    {
      "source": "/issues/:path*",
      "destination": "/api/index"
    },
    {
      "source": "/triage/:path*",
      "destination": "/api/index"
    },
    {
      "source": "/(.*)",
      "destination": "/api/index"
    }
  ]
}
```

Atau versi sederhana jika wildcard `(.*)` bermasalah:

```json
{
  "bunVersion": "1.x",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index"
    }
  ]
}
```

> **Catatan:** `routes` adalah format lama Vercel tapi lebih compatible.
> Coba ini jika `rewrites` tidak bekerja.

---

## Urutan Eksekusi Rekomendasi

Jika belum tahu penyebabnya, ikuti urutan ini:

```
1. Baca log Vercel → cocokkan dengan tabel di atas
2. Jika log kosong → deploy Langkah 7 (endpoint minimal)
3. Jika env vars → Langkah 4
4. Jika module import error → Langkah 1 atau 2
5. Jika export format → Langkah 5
6. Jika masih crash setelah semua → Langkah 6 (top-level await)
```

---

## Verifikasi Setelah Fix

```bash
# Endpoint yang harus return 200 setelah fix
curl https://api-amertask.vercel.app/health
# Expected: { "status": "ok", "runtime": "bun x.x.x", ... }

# Jika masih 500, lihat log lagi
vercel logs https://api-amertask.vercel.app --follow
```

---

## File yang Mungkin Diubah

| File                              | Kapan diubah                           |
| --------------------------------- | -------------------------------------- |
| `apps/server/api/index.ts`        | Langkah 1, 5, 6, 7                     |
| `apps/server/src/app.ts`          | Langkah 3 (hapus `.listen()` jika ada) |
| `apps/server/src/lib/supabase.ts` | Langkah 4 (tambah validasi env)        |
| `apps/server/src/lib/jwt.ts`      | Langkah 6 (pindah top-level await)     |
| `apps/server/package.json`        | Langkah 2 (pindah dep ke dependencies) |
| `apps/server/vercel.json`         | Langkah 8 (perbaiki routing)           |

---

_Fix: FUNCTION_INVOCATION_FAILED — api-amertask.vercel.app | April 2026_
