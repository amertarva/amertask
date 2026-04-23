# 🤝 Contributing Guide - Amertask

Panduan untuk berkontribusi ke proyek Amertask.

---

## 📋 Sebelum Mulai

1. **Baca dokumentasi**:
   - [QUICKSTART.md](./QUICKSTART.md) - Setup cepat
   - [AGENTS.md](./AGENTS.md) - Panduan lengkap (WAJIB)
   - [CHEATSHEET.md](./CHEATSHEET.md) - Quick reference

2. **Setup environment**:

   ```bash
   npm install
   cp .env.local.example .env.local
   npm run dev
   ```

3. **Familiarisasi dengan struktur**:
   - Lihat [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
   - Explore komponen UI yang sudah ada
   - Baca TypeScript types di `src/types/`

---

## 🎯 Workflow Development

### 1. Ambil Task

- Check [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) untuk task yang belum dikerjakan
- Koordinasi dengan tim untuk avoid konflik
- Buat branch baru: `git checkout -b feature/nama-fitur`

### 2. Development

- Ikuti panduan di [AGENTS.md](./AGENTS.md)
- Gunakan komponen UI yang sudah ada
- Gunakan CSS variables untuk warna
- Tambahkan TypeScript types jika perlu
- Implementasi loading dan error states

### 3. Testing

- Test di browser (Chrome, Firefox, Safari)
- Test responsive (mobile, tablet, desktop)
- Test dark mode
- Test error scenarios
- Test loading states

### 4. Code Review

- Self-review dengan checklist di bawah
- Push ke branch
- Buat Pull Request
- Tunggu review dari tim

---

## ✅ Checklist Sebelum Commit

Dari [AGENTS.md](./AGENTS.md):

- [ ] Semua teks UI dalam Bahasa Indonesia
- [ ] Tidak ada warna hardcode (hex/rgb) — gunakan CSS variables
- [ ] Semua komponen menggunakan font `Plus Jakarta Sans`
- [ ] Ikon hanya dari `lucide-react`
- [ ] Animasi menggunakan `motion`
- [ ] TypeScript types tidak menggunakan `any`
- [ ] Loading state ada di semua aksi async
- [ ] Error state ditampilkan dengan pesan yang jelas
- [ ] Responsif: sidebar collapse di mobile, kanban scroll horizontal
- [ ] Dark mode berfungsi dengan baik
- [ ] Tidak ada `console.log` tersisa

---

## 🎨 Coding Standards

### 1. Naming Conventions

```typescript
// Components: PascalCase
export const LoginForm: React.FC = () => {};

// Functions: camelCase
const handleSubmit = () => {};

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = "https://task-amertarva.vercel.app";

// Types/Interfaces: PascalCase
interface UserProfile {}
type IssueStatus = "todo" | "done";

// Files: PascalCase untuk components, camelCase untuk utils
LoginForm.tsx;
useAuth.ts;
api.ts;
```

### 2. Import Order

```typescript
// 1. React & Next.js
import React from "react";
import { useRouter } from "next/navigation";

// 2. External libraries
import { motion } from "motion/react";
import { Mail, Lock } from "lucide-react";

// 3. Internal - Components
import { Button, Input } from "@/components/ui";

// 4. Internal - Hooks
import { useAuth } from "@/hooks/useAuth";

// 5. Internal - Utils & Types
import { cn } from "@/lib/utils";
import type { User } from "@/types";
```

### 3. Component Structure

```typescript
'use client' // Jika perlu

import statements...

// Types/Interfaces
interface ComponentProps {
  // ...
}

// Component
export const Component: React.FC<ComponentProps> = ({
  prop1,
  prop2,
}) => {
  // 1. Hooks
  const router = useRouter()
  const [state, setState] = useState()

  // 2. Derived state
  const computedValue = useMemo(() => {}, [])

  // 3. Effects
  useEffect(() => {}, [])

  // 4. Handlers
  const handleClick = () => {}

  // 5. Render helpers
  const renderItem = () => {}

  // 6. Return JSX
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### 4. Styling

```tsx
// ✅ Good - CSS Variables
<div className="bg-primary text-primary-foreground">

// ❌ Bad - Hardcoded colors
<div className="bg-[#3b82f6] text-white">

// ✅ Good - Conditional classes dengan cn()
<div className={cn(
  'base-class',
  isActive && 'active-class',
  'another-class'
)}>

// ❌ Bad - String concatenation
<div className={'base-class ' + (isActive ? 'active-class' : '')}>
```

### 5. TypeScript

```typescript
// ✅ Good - Explicit types
const user: User = { id: "1", name: "John" };
const handleSubmit = async (data: FormData): Promise<void> => {};

// ❌ Bad - any type
const user: any = { id: "1", name: "John" };

// ✅ Good - Type inference
const [count, setCount] = useState(0); // number inferred

// ✅ Good - Generic types
const [user, setUser] = useState<User | null>(null);
```

---

## 🚫 Hal yang TIDAK Boleh Dilakukan

Dari [AGENTS.md](./AGENTS.md):

1. **Jangan hardcode warna** — selalu gunakan `hsl(var(--nama-variabel))`
2. **Jangan gunakan font selain Plus Jakarta Sans** tanpa persetujuan
3. **Jangan gunakan ikon selain lucide-react** (kecuali SVG custom yang disetujui)
4. **Jangan buat state management sendiri** jika sudah ada di Zustand store
5. **Jangan langsung akses database** dari frontend — selalu via Elysia API
6. **Jangan terjemahkan nama teknis** seperti ID, slug, token, payload
7. **Jangan skip validasi** di form — selalu validasi client-side
8. **Jangan lupa loading & error state** di setiap komponen yang fetch data

---

## 📝 Commit Messages

Format: `type(scope): message`

### Types:

- `feat`: Fitur baru
- `fix`: Bug fix
- `docs`: Dokumentasi
- `style`: Styling (tidak mengubah logic)
- `refactor`: Refactoring code
- `test`: Menambah/update tests
- `chore`: Maintenance tasks

### Examples:

```bash
feat(auth): add login form component
fix(issues): resolve kanban drag and drop bug
docs(readme): update setup instructions
style(button): adjust hover state colors
refactor(api): simplify error handling
```

---

## 🔍 Code Review Checklist

### Functionality

- [ ] Fitur berfungsi sesuai requirement
- [ ] Tidak ada bug yang terdeteksi
- [ ] Edge cases sudah dihandle
- [ ] Error handling sudah ada

### Code Quality

- [ ] Code mudah dibaca dan dipahami
- [ ] Tidak ada code duplication
- [ ] Menggunakan komponen/utils yang sudah ada
- [ ] TypeScript types sudah benar

### UI/UX

- [ ] Responsive di semua device
- [ ] Dark mode berfungsi
- [ ] Animasi smooth
- [ ] Loading states ada
- [ ] Error messages jelas
- [ ] Teks dalam Bahasa Indonesia

### Performance

- [ ] Tidak ada unnecessary re-renders
- [ ] Images dioptimasi
- [ ] Lazy loading jika perlu
- [ ] No memory leaks

---

## 🐛 Bug Reports

Jika menemukan bug, buat issue dengan format:

```markdown
## Bug Description

[Deskripsi singkat bug]

## Steps to Reproduce

1. Buka halaman X
2. Klik tombol Y
3. Bug terjadi

## Expected Behavior

[Apa yang seharusnya terjadi]

## Actual Behavior

[Apa yang sebenarnya terjadi]

## Screenshots

[Jika ada]

## Environment

- Browser: Chrome 120
- OS: macOS 14
- Screen size: 1920x1080
```

---

## 💡 Tips

1. **Gunakan CHEATSHEET.md** saat coding
2. **Commit sering** dengan message yang jelas
3. **Test di dark mode** sebelum commit
4. **Test responsive** di berbagai ukuran
5. **Baca error messages** dengan teliti
6. **Gunakan TypeScript** untuk catch errors early
7. **Reuse components** yang sudah ada
8. **Ask for help** jika stuck

---

## 📞 Komunikasi

- **Daily standup**: Share progress dan blockers
- **Code review**: Berikan feedback konstruktif
- **Questions**: Jangan ragu untuk bertanya
- **Documentation**: Update docs jika ada perubahan

---

## 🎯 Goals

- **Code quality**: Maintainable, readable, scalable
- **User experience**: Smooth, intuitive, accessible
- **Performance**: Fast, optimized, efficient
- **Collaboration**: Clear communication, helpful reviews

---

**Terima kasih sudah berkontribusi! 🙏**

Jika ada pertanyaan, lihat [DOCS_INDEX.md](./DOCS_INDEX.md) atau tanya tim.
