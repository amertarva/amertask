# TaskOps Mobile Responsiveness & Dashboard Preview Update

## Objective

Implementasikan responsivitas mobile untuk komponen dashboard preview dan semua komponen di halaman utama (home) tanpa merusak tampilan desktop.

## 1. Dashboard Preview Component

**Location:** `C:\project-uta\taskops\apps\web\src\components\dashboard`

**Tasks:**

- **Layout Switching:** Gunakan pola `flex-col` untuk mobile dan `flex-row` untuk desktop pada container utama preview.
- **Sidebar Handling:** Pada tampilan mobile (breakpoint < `md`), sembunyikan sidebar dashboard preview atau ubah menjadi top-navigation ringkas untuk menghemat ruang vertikal.
- **Kanban Board Mobile View:** - Ubah grid 3 kolom (To Do, In Progress, Done) menjadi **horizontal scrollable container** atau **vertical stack**.
  - Rekomendasi: Gunakan `flex overflow-x-auto snap-x` agar user bisa menggeser antar kolom seperti aplikasi Trello mobile.
- **Scaling:** Gunakan `transform scale-[0.9]` atau `scale-[0.8]` jika elemen dashboard masih terasa terlalu besar untuk layar HP agar tetap terlihat seperti "preview".

## 2. Home Page Components Responsiveness

**Location:** `C:\project-uta\taskops\apps\web\src\components\home`

**Tasks:**

- **Hero Section:**
  - Pastikan teks "Kendalikan Setiap Sprint" menggunakan `text-center` pada mobile dan `text-left` pada desktop.
  - Ubah container utama menjadi `flex-col-reverse` atau `flex-col` agar teks berada di atas dan gambar preview dashboard berada di bawahnya.
  - Sesuaikan ukuran font (misal: `text-4xl` di mobile, `text-6xl` di desktop).
- **Navigation/Buttons:**
  - Tombol "Mulai Eksplorasi" dan "Pelajari Selengkapnya" harus dibuat `w-full` (full width) pada mobile agar lebih mudah ditekan (thumb-friendly).
- **Spacing:**
  - Audit semua `px` (padding horizontal) dan `py` (padding vertical). Gunakan standar `px-4` atau `px-6` untuk mobile.
- **Trusted By Section:**
  - Icon logotype perusahaan yang ada di bawah tombol hero harus dibuat `flex-wrap` dan `justify-center` agar tidak terpotong (overflow).

## 3. Technical Implementation Details

- **Tailwind Strategy:** Utamakan penggunaan prefix `md:` untuk mengatur state desktop (contoh: `flex-col md:flex-row`).
- **No Side Effects:** Pastikan tidak ada perubahan pada file CSS global yang dapat mempengaruhi halaman lain di luar direktori `home` dan `dashboard`.
- **Image Optimization:** Pastikan gambar/ilustrasi dashboard menggunakan `object-contain` agar aspek rasio tidak rusak saat di-resize.
