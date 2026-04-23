# Vercel Deployment Guide

## Environment Variables yang Diperlukan

Pastikan environment variables berikut sudah di-set di Vercel Dashboard:

### Required Variables

1. **BACKEND_URL** (Server-side only) — **WAJIB**
   - URL backend untuk Next.js API routes (proxy)
   - Contoh: `https://api-amertask.vercel.app`
   - Digunakan oleh: `/app/api/**` routes untuk mem-forward request ke backend

2. **NEXT_PUBLIC_API_URL** (Client-side) — **BIARKAN KOSONG**
   - ⚠️ **JANGAN set ke URL frontend** (mis. `https://task-amertarva.vercel.app`)
   - ⚠️ **JANGAN set ke URL backend langsung** (mis. `https://api-amertask.vercel.app`)
   - **Biarkan kosong/unset** agar client otomatis menggunakan `/api` (proxy pattern)
   - Ini memastikan semua request dari browser melewati Next.js API routes → backend

## Arsitektur Request Flow

```
Browser → /api/auth/login (Next.js API Route) → BACKEND_URL/auth/login (ElysiaJS)
          ^^^^^^^^^^^^^^^^                       ^^^^^^^^^^^^^^^^^^^^^^^^
          NEXT_PUBLIC_API_URL fallback = "/api"   BACKEND_URL = "https://api-amertask.vercel.app"
```

## Cara Set Environment Variables di Vercel

1. Buka project di Vercel Dashboard
2. Pergi ke **Settings** → **Environment Variables**
3. Tambahkan variable berikut:

```
BACKEND_URL=https://api-amertask.vercel.app
```

4. **PASTIKAN `NEXT_PUBLIC_API_URL` TIDAK di-set** (atau kosongkan nilainya)
5. Pilih environment: **Production**, **Preview**, dan **Development**
6. Klik **Save**
7. **Redeploy project** (penting! env vars baru memerlukan redeploy)

## Troubleshooting

### Error: 405 Method Not Allowed pada `/auth/login`

- **Penyebab:** `NEXT_PUBLIC_API_URL` di-set ke URL frontend sendiri
- **Solusi:** Hapus/kosongkan `NEXT_PUBLIC_API_URL` di Vercel environment variables, lalu redeploy

### Error: "BACKEND_URL belum di-set"

- Pastikan `BACKEND_URL` sudah di-set di Vercel environment variables
- Redeploy setelah menambahkan variable

### Warning: "missing from turbo.json"

- Edit `turbo.json` dan tambahkan `env` array di task `build`
- Commit dan push perubahan

### Build Failed dengan Exit Code 1

- Cek build logs untuk error spesifik
- Pastikan semua dependencies terinstall
- Verifikasi TypeScript tidak ada error: `bun run typecheck`
