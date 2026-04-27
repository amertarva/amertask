# Smart Progress Calculation

Sistem kalkulasi progress yang cerdas untuk Sprint Planning, mempertimbangkan 3 faktor:

## Faktor Perhitungan

### 1. Status Weight

Setiap status memiliki kontribusi berbeda:

- `backlog` / `todo` → 0%
- `in_progress` → 40% (base, bisa naik dengan time-based boost)
- `in_review` → 80%
- `done` / `in_execution` → 100%
- `cancelled` → diabaikan dari perhitungan

### 2. Duration Weight

Task dengan durasi lebih panjang memiliki bobot lebih besar dalam perhitungan progress.
Kontribusi proporsional terhadap total durasi sprint.

### 3. Time-Based Boost (untuk in_progress)

Task `in_progress` yang sudah melewati sebagian besar waktunya akan mendapat boost otomatis:

- Awal task: 40%
- Hampir deadline: hingga 85%
- Formula: `0.40 + timeProgress × 0.45`
- Cap maksimal: 90% (hanya `done` yang bisa 100%)

## Contoh Perhitungan

```typescript
Task A: in_progress, 2 hari, sudah lewat 100% waktu
  → boostedWeight: 0.85
  → durationWeight: 2/31 = 0.065
  → kontribusi: 0.065 × 0.85 × 100 = 5.5%

Task B: in_progress, 29 hari, sudah lewat 93% waktu
  → boostedWeight: 0.82
  → durationWeight: 29/31 = 0.935
  → kontribusi: 0.935 × 0.82 × 100 = 76.7%

TOTAL PROGRESS: 5.5 + 76.7 = 82%
```

## Mode Perhitungan

### Weighted Mode (default jika ada tanggal)

Menggunakan ketiga faktor di atas untuk perhitungan yang akurat.

### Simple Mode (fallback jika tidak ada tanggal)

Hanya menggunakan status weight tanpa mempertimbangkan durasi.

## Usage

```typescript
import { usePlanningProgress } from "@/hooks/usePlanningProgress";

const progress = usePlanningProgress(plannings);

// progress.percentage: 0-100
// progress.method: "weighted" | "simple"
// progress.breakdown: detail kontribusi per task
```

## Files

- `progress.utils.ts` - Core calculation logic (pure functions)
- `usePlanningProgress.ts` - React hook wrapper
- `PlanningProgressBar.tsx` - Visual component
- `PlanningGoal.tsx` - Integration point

## Benefits

✅ Progress tidak lagi stuck di 0% sampai semua task selesai
✅ Task yang sedang dikerjakan berkontribusi ke progress
✅ Task dengan durasi lebih panjang memiliki impact lebih besar
✅ Progress naik secara gradual seiring waktu
✅ Mendorong user untuk update status task secara aktual
