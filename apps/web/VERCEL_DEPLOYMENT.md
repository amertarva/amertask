# Vercel Deployment Guide

## Environment Variables yang Diperlukan

Pastikan environment variables berikut sudah di-set di Vercel Dashboard:

### Required Variables

1. **BACKEND_URL** (Server-side only)
   - URL backend untuk Next.js API routes
   - Contoh: `https://api-amertask.vercel.app`
   - Digunakan oleh: `/app/api/**` routes

2. **NEXT_PUBLIC_API_URL** (Client-side)
   - URL backend untuk frontend client
   - Contoh: `https://api-amertask.vercel.app`
   - Digunakan oleh: Client-side fetch calls

## Cara Set Environment Variables di Vercel

1. Buka project di Vercel Dashboard
2. Pergi ke **Settings** → **Environment Variables**
3. Tambahkan variables berikut:

```
BACKEND_URL=https://api-amertask.vercel.app
NEXT_PUBLIC_API_URL=https://api-amertask.vercel.app
```

4. Pilih environment: **Production**, **Preview**, dan **Development**
5. Klik **Save**
6. Redeploy project

## Turbo.json Configuration

Untuk menghindari warning, tambahkan environment variables ke `turbo.json`:

```json
{
  "tasks": {
    "build": {
      "env": ["BACKEND_URL", "NEXT_PUBLIC_API_URL"]
    }
  }
}
```

## Troubleshooting

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
