# Deploy Backend ElysiaJS ke Vercel (Native Bun Runtime)

> **Sumber:** https://bun.com/blog/vercel-adds-native-bun-support (28 Oktober 2025)
> **Status:** Public Beta — stabil untuk production, tapi masih ada kemungkinan perubahan

---

## Cara Kerja

Vercel mendeteksi `"bunVersion": "1.x"` di `vercel.json` lalu secara otomatis:

- Install Bun
- Menjalankan build dan start command dengan Bun
- Mengeksekusi serverless function dengan Bun runtime (bukan Node.js)

Tidak ada adapter, tidak ada konversi `IncomingMessage` ↔ `Request`.
ElysiaJS `.handle()` langsung compatible karena sama-sama Web Standard API.

---

## Struktur File

```
apps/server/
├── api/
│   └── index.ts       ← BUAT BARU — Vercel entry point (3 baris)
├── src/
│   ├── app.ts         ← BUAT BARU — App factory tanpa .listen()
│   └── index.ts       ← EDIT — Local dev entry point
├── vercel.json        ← BUAT BARU
└── package.json       ← EDIT
```

---

## LANGKAH 1 — Buat `src/app.ts` (App Factory)

**File: `apps/server/src/app.ts`** ← **BUAT FILE BARU**

Pisahkan setup Elysia dari `.listen()` agar bisa di-import oleh
entry point yang berbeda (local dev vs Vercel).

```typescript
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

import { authRoutes } from "./routes/auth.routes";
import { usersRoutes } from "./routes/users.routes";
import { teamsRoutes } from "./routes/teams.routes";
import { issuesRoutes } from "./routes/issues.routes";
import { triageRoutes } from "./routes/triage.routes";
import { analyticsRoutes } from "./routes/analytics.routes";
import { exportRoutes } from "./routes/export.routes";

// Baca allowed origins dari env — pisah koma jika lebih dari satu URL
// Contoh: FRONTEND_URL=https://app.vercel.app,https://staging.vercel.app
const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3001")
  .split(",")
  .map((o) => o.trim());

export const app = new Elysia()
  .use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  // Health check — untuk monitoring dan verifikasi runtime
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

export type App = typeof app;
```

---

## LANGKAH 2 — Edit `src/index.ts` (Local Dev)

**File: `apps/server/src/index.ts`** ← **EDIT**

```typescript
// Entry point untuk local development — hanya dipakai saat bun run dev
// Untuk Vercel, yang dipakai adalah api/index.ts
import { app } from "./app";

const port = Number(process.env.PORT ?? 3000);

app.listen(port);

console.log(`🦊 Server berjalan di http://localhost:${port}`);
console.log(`   Bun v${Bun.version}`);
console.log(`   Swagger: http://localhost:${port}/docs`);
```

---

## LANGKAH 3 — Buat Vercel Entry Point

**File: `apps/server/api/index.ts`** ← **BUAT BARU**

```typescript
import { app } from "../src/app";

// Vercel Bun Runtime memanggil handler ini dengan Web Standard Request
// ElysiaJS .handle() mengembalikan Web Standard Response — langsung compatible
export default app.handle;
```

Tiga baris. Tidak ada adapter, tidak ada konversi, tidak ada boilerplate.

---

## LANGKAH 4 — Buat `vercel.json`

**File: `apps/server/vercel.json`** ← **BUAT BARU**

```json
{
  "bunVersion": "1.x",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

### Catatan penting tentang `vercel.json`

`"bunVersion": "1.x"` di root adalah **satu-satunya config yang diperlukan** untuk mengaktifkan Bun runtime. Vercel mendeteksinya secara otomatis dan:

- Install Bun
- Jalankan build dan start dengan Bun
- Eksekusi semua function dengan Bun runtime

Tidak perlu menulis `"runtime": "bun"` di dalam `"functions"`, tidak perlu `"buildCommand"` atau `"installCommand"` secara eksplisit — Vercel handle semuanya. Nilai `"1.x"` adalah satu-satunya format yang didukung saat ini; Vercel yang kelola minor version.

---

## LANGKAH 5 — Update `package.json`

**File: `apps/server/package.json`** ← **EDIT**

```json
{
  "name": "taskops-server",
  "version": "1.0.0",
  "module": "src/index.ts",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "start": "bun run src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "elysia": "latest",
    "@elysiajs/cors": "latest",
    "@elysiajs/swagger": "latest",
    "@supabase/supabase-js": "latest",
    "googleapis": "latest",
    "jose": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/bun": "latest"
  }
}
```

`"build"` script tidak diperlukan — Vercel dengan Bun runtime tidak butuh pre-build step terpisah.

---

## LANGKAH 6 — Update `tsconfig.json`

**File: `apps/server/tsconfig.json`** ← **EDIT**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext"],
    "strict": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "api/**/*"],
  "exclude": ["node_modules"]
}
```

`"api/**/*"` di `include` wajib ada agar TypeScript bisa type-check `api/index.ts`.
`@types/node` tidak diperlukan karena pakai Bun types.

---

## LANGKAH 7 — Set Environment Variables di Vercel

Masuk ke **Vercel Dashboard → Project → Settings → Environment Variables**.
Set untuk semua environment (Production, Preview, Development):

```
SUPABASE_URL                 → https://xxxx.supabase.co
SUPABASE_ANON_KEY            → eyJ...
SUPABASE_SERVICE_ROLE_KEY    → eyJ...

JWT_SECRET                   → [min 32 karakter — generate: openssl rand -base64 32]
JWT_ACCESS_EXPIRES            → 15m
JWT_REFRESH_EXPIRES           → 7d

GOOGLE_SERVICE_ACCOUNT_EMAIL → taskops@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY            → -----BEGIN PRIVATE KEY-----\nMII...
GOOGLE_PROJECT_ID             → your-project-id

FRONTEND_URL                 → https://your-frontend.vercel.app
NODE_ENV                     → production
```

> **GOOGLE_PRIVATE_KEY:** Paste value lengkap termasuk `\n` literal langsung di Vercel dashboard — jangan tambahkan quote ekstra. Vercel preserve formatting secara otomatis.

---

## LANGKAH 8 — Update Frontend

**File: `apps/web/.env.production`:**

```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
BACKEND_URL=https://your-backend.vercel.app
```

Atau set langsung di Vercel dashboard untuk project frontend.

---

## LANGKAH 9 — Deploy

```bash
cd apps/server

# Install Vercel CLI
bun add -g vercel

# Login
vercel login

# Preview deploy (untuk test)
vercel

# Production deploy
vercel --prod
```

---

## Verifikasi

```bash
# 1. Health check — pastikan "runtime" menunjukkan Bun, bukan Node.js
curl https://your-backend.vercel.app/health
# Expected: { "status": "ok", "runtime": "bun 1.x.x", "timestamp": "..." }

# 2. Test auth
curl -X POST https://your-backend.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
# Expected: { "user": {...}, "accessToken": "..." }

# 3. Test CORS dari browser (buka console di frontend)
fetch('https://your-backend.vercel.app/health')
  .then(r => r.json()).then(console.log)
# Expected: tidak ada CORS error
```

**Vercel Dashboard checklist:**

```
□ Functions tab → api/index.ts muncul
□ Logs tab → tidak ada build error
□ GET /health → return 200 dengan runtime "bun x.x.x"
□ Semua env vars sudah di-set
□ FRONTEND_URL sudah diisi URL frontend yang benar (tanpa trailing slash)
```

---

## Bun APIs yang Kini Tersedia di Vercel

Karena sekarang running di Bun runtime, seluruh Bun API bisa dipakai langsung
di server code tanpa install package tambahan:

```typescript
// Contoh yang relevan untuk project ini:

// Hash password — bisa menggantikan bcrypt
const hashed = await Bun.password.hash(password);
const valid = await Bun.password.verify(password, hashed);

// File I/O — jika butuh baca/tulis file
const file = Bun.file("./data.json");
const content = await file.json();

// Di masa depan: Bun.SQL bisa jadi alternatif Supabase client
// untuk query langsung ke PostgreSQL tanpa library tambahan
import { sql } from "bun";
const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

Ini opsional — tidak perlu diimplementasi sekarang, tapi worth diketahui
untuk pengembangan berikutnya.

---

## Perbedaan dari Dokumentasi Vercel Deploy Sebelumnya

| Aspek            | Versi Lama (salah)                | Versi Ini (benar)                |
| ---------------- | --------------------------------- | -------------------------------- |
| Aktifkan Bun     | `"runtime": "bun"` di `functions` | `"bunVersion": "1.x"` di root    |
| `buildCommand`   | Perlu ditulis eksplisit           | Tidak perlu — Vercel auto-detect |
| `installCommand` | Perlu ditulis eksplisit           | Tidak perlu — Vercel auto-detect |
| Sumber           | Asumsi                            | Artikel resmi bun.com            |

---

## Catatan

**Public beta** — Vercel dan Bun masih aktif mengembangkan integrasi ini.
Jika ada issue, cek [dokumentasi Bun](https://bun.com/docs) atau
[Vercel changelog](https://vercel.com/changelog) untuk update terbaru.

**Timeout Google Docs export** — ini bukan masalah runtime, tapi limit Vercel.
Free tier max 10 detik, Pro tier max 300 detik. Google Docs export butuh ~15-20 detik
untuk dokumen besar → perlu Vercel Pro atau pisahkan ke background job.

---

_Deploy: ElysiaJS + Bun Runtime → Vercel | Berdasarkan artikel resmi bun.com (28 Oktober 2025)_
