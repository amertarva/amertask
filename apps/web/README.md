# Amertask - Aplikasi Manajemen Tugas Profesional

Aplikasi manajemen tugas berbahasa Indonesia yang terinspirasi dari Tegon/Jira/Linear. Dibangun dengan Next.js 16, TypeScript, dan Tailwind CSS.

## ✨ Fitur Utama

- 🎯 **Issue Management** - CRUD lengkap untuk mengelola tugas/issue
- 📊 **Kanban Board** - Drag & drop interface untuk visualisasi workflow
- 📋 **List View** - Tampilan tabel dengan grouping berdasarkan status
- 🔍 **Triage** - Sortir dan kelola issue masuk dari berbagai sumber
- 👁️ **Custom Views** - Buat tampilan kustom dengan filter dan sorting
- 🌓 **Dark Mode** - Toggle antara light dan dark theme
- 🎨 **Sistem Desain Konsisten** - CSS Variables dengan Tailwind CSS
- 🔐 **Autentikasi** - Login dan registrasi pengguna

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ atau Bun
- Backend API (Elysia.js) berjalan di `http://localhost:3001`

### Installation

```bash
# Install dependencies
npm install
# atau
bun install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local dan sesuaikan NEXT_PUBLIC_API_URL

# Run development server
npm run dev
# atau
bun dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Struktur Proyek

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── pages/       # Dashboard pages
│   │   └── globals.css  # Global styles & CSS variables
│   ├── components/
│   │   ├── ui/          # Komponen UI primitif (Button, Input, dll)
│   │   ├── auth/        # Komponen autentikasi
│   │   ├── layout/      # Komponen layout (Sidebar, Navbar)
│   │   ├── issues/      # Komponen issue management
│   │   ├── triage/      # Komponen triage
│   │   └── views/       # Komponen custom views
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts   # Hook autentikasi
│   │   └── useIssues.ts # Hook CRUD issues
│   ├── lib/             # Utilities & helpers
│   │   ├── api.ts       # API client
│   │   ├── constants.ts # Constants (status, priority, labels)
│   │   ├── utils.ts     # Helper functions
│   │   └── motion-variants.ts # Animasi variants
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts     # Global types
│   └── store/           # State management (Zustand)
├── public/              # Static assets
├── AGENTS.md            # Panduan lengkap untuk AI/Developer
├── SETUP.md             # Setup guide
└── MIGRATION_NOTES.md   # Catatan migrasi struktur
```

## 🎨 Sistem Desain

### Warna

Aplikasi menggunakan CSS Variables untuk konsistensi warna:

- **Status**: Backlog, Todo, In Progress, In Review, Done, Cancelled
- **Priority**: Urgent, High, Medium, Low
- **Labels**: Frontend, Backend, Design, Bug, Feature, dll

### Komponen UI

Semua komponen UI tersedia di `src/components/ui/`:

- `Button` - Tombol dengan variants (primary, secondary, ghost, destructive)
- `Input` - Input field dengan label dan error state
- `Textarea` - Text area untuk input panjang
- `Select` - Dropdown select
- `Badge` - Badge untuk status, prioritas, dan label
- `Avatar` - Avatar pengguna
- `Modal` - Modal dialog
- `Dropdown` - Dropdown menu
- `Tooltip` - Tooltip dengan positioning
- `Separator` - Garis pemisah
- `EmptyState` - State kosong dengan aksi

### Font

Menggunakan **Plus Jakarta Sans** dari Google Fonts untuk tampilan modern dan profesional.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Animasi**: Motion (Framer Motion v11+)
- **Icons**: Lucide React
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **HTTP Client**: Native fetch API

## 📚 Dokumentasi

### 🚀 Quick Start

- **[QUICKSTART.md](./QUICKSTART.md)** - Setup dalam 5 menit dan mulai coding
- **[CHEATSHEET.md](./CHEATSHEET.md)** - Quick reference untuk development

### 📖 Lengkap

- **[DOCS_INDEX.md](./DOCS_INDEX.md)** - Index navigasi semua dokumentasi
- **[AGENTS.md](./AGENTS.md)** - Panduan lengkap pengembangan (WAJIB BACA)
- **[SETUP.md](./SETUP.md)** - Setup guide dan struktur folder detail
- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - Status implementasi fitur
- **[SUMMARY.md](./SUMMARY.md)** - Ringkasan lengkap apa yang sudah dibuat

## 🔧 Development Guidelines

1. **Bahasa**: Semua teks UI dalam Bahasa Indonesia
2. **Warna**: Gunakan CSS Variables, jangan hardcode hex
3. **Komponen**: Gunakan komponen dari `src/components/ui/`
4. **Types**: Gunakan TypeScript untuk type safety
5. **Animasi**: Gunakan Motion variants dari `lib/motion-variants.ts`
6. **State**: Loading dan error states wajib ada
7. **Responsive**: Mobile-first approach

## 📦 Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🤝 Contributing

Lihat [AGENTS.md](./AGENTS.md) untuk panduan lengkap pengembangan.

## 📄 License

Private project - All rights reserved.
