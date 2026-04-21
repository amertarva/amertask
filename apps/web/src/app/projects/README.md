# Pages Directory

Folder ini berisi semua halaman dashboard aplikasi Amertask.

## 📁 Struktur

```
pages/
├── layout.tsx                    # Layout utama dengan Sidebar + Navbar
├── inbox/
│   └── page.tsx                 # Halaman Kotak Masuk
├── settings/
│   └── page.tsx                 # Halaman Pengaturan
└── [teamSlug]/                  # Dynamic route untuk tim
    ├── issues/
    │   └── page.tsx            # Halaman daftar isu
    ├── triage/
    │   └── page.tsx            # Halaman sortir isu masuk
    └── views/
        ├── page.tsx            # Halaman daftar tampilan kustom
        └── [viewId]/
            └── page.tsx        # Detail tampilan kustom (coming soon)
```

## 🎯 Halaman yang Sudah Dibuat

### ✅ Layout

- `layout.tsx` - Layout dashboard dengan Sidebar dan Navbar

### ✅ General Pages

- `inbox/page.tsx` - Kotak masuk untuk notifikasi
- `settings/page.tsx` - Pengaturan aplikasi

### ✅ Team Pages (Dynamic Routes)

- `[teamSlug]/issues/page.tsx` - Daftar semua isu tim
- `[teamSlug]/triage/page.tsx` - Sortir isu masuk
- `[teamSlug]/views/page.tsx` - Daftar tampilan kustom

## 🚧 Coming Soon

- `[teamSlug]/views/[viewId]/page.tsx` - Detail tampilan kustom

## 📝 Catatan

- Semua halaman menggunakan layout dari `layout.tsx`
- Dynamic routes `[teamSlug]` mendukung berbagai tim (ENG, DES, MKT, dll)
- Halaman menggunakan komponen UI dari `@/components/ui`
- Styling menggunakan CSS Variables dari `globals.css`
