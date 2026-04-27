# CLAUDE.md — Smart Progress Calculation: Sprint Planning

## Diagnosis

`Progress: 0%` muncul karena kalkulasi saat ini kemungkinan hanya menghitung:

```typescript
// ❌ Cara naif — hanya task status 'done' yang dihitung
const progress = (doneCount / totalCount) * 100;
```

Masalahnya:

- Task "Sedang Dikerjakan" (in_progress) tidak berkontribusi sama sekali
- Semua task diperlakukan setara meski ada yang 2 hari dan ada yang 29 hari
- Progress hanya loncat dari 0% → 100% tanpa gradasi

---

## Solusi: Weighted Progress dengan 3 Faktor

Progress yang profesional mempertimbangkan **tiga faktor sekaligus**:

```
FAKTOR 1 — Status Weight
  Setiap status punya kontribusi berbeda:
  backlog     → 0%
  todo        → 0%
  in_progress → 40%   (sedang dikerjakan, belum selesai)
  in_review   → 80%   (tinggal review)
  done        → 100%  (selesai)
  cancelled   → diabaikan dari perhitungan

FAKTOR 2 — Duration Weight
  Task 29 hari lebih "berat" dari task 2 hari.
  Kontribusi proporsional terhadap total durasi sprint.

FAKTOR 3 — Time-Based Boost untuk in_progress
  Jika task in_progress sudah lewat 60% waktunya,
  kontribusinya naik dari 40% → 60% secara otomatis.
  Ini mencerminkan realita: task yang hampir deadline
  biasanya hampir selesai.
```

### Contoh dari Screenshot

```
Task PERPUS-002: Inisiasi NextJS
  Status:   in_progress (40% kontribusi)
  Durasi:   2 hari (weight kecil)
  Periode:  26 Apr – 27 Apr

Task PERPUS-001: Desain UI/UX
  Status:   in_progress (40% kontribusi)
  Durasi:   29 hari (weight besar)
  Periode:  1 Apr – 29 Apr

Total durasi sprint: 31 hari

Weighted progress:
  PERPUS-002: (2/31) × 40%  = 2.58%
  PERPUS-001: (29/31) × 40% = 37.42%
  TOTAL: ~40% ✓ (jauh lebih akurat dari 0%)
```

---

## IMPLEMENTASI

### Langkah 1 — Buat `progress.utils.ts`

Pure utility — tidak ada import React atau Supabase.
Bisa di-unit test tanpa setup apapun.

**File: `apps/web/src/lib/utils/progress.utils.ts`**

```typescript
// ─── Status weight map ────────────────────────────────────────────────────────

export const STATUS_WEIGHT: Record<string, number> = {
  backlog: 0,
  todo: 0,
  in_progress: 0.4,
  in_review: 0.8,
  done: 1.0,
  cancelled: -1, // -1 = diabaikan dari perhitungan
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressTask {
  id: string;
  status: string;
  startDate: string | null; // 'YYYY-MM-DD'
  dueDate: string | null; // 'YYYY-MM-DD'
  estimatedHours?: number;
}

export interface ProgressResult {
  percentage: number; // 0–100, sudah dibulatkan
  raw: number; // 0–1, nilai mentah sebelum dibulatkan
  totalTasks: number; // total task (tidak termasuk cancelled)
  doneTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  todoTasks: number;
  cancelledTasks: number;
  method: "weighted" | "simple"; // untuk debugging
  breakdown: Array<{
    taskId: string;
    contribution: number; // kontribusi task ini ke total (0–100)
    weight: number; // status weight yang dipakai
    durationDays: number;
  }>;
}

// ─── Helper: hitung durasi ───────────────────────────────────────────────────

function getDurationDays(
  startDate: string | null,
  dueDate: string | null,
): number {
  if (!startDate || !dueDate) return 1; // default 1 hari jika tidak ada tanggal
  const start = new Date(startDate);
  const end = new Date(dueDate);
  const diff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(1, diff);
}

// ─── Helper: time-based boost untuk in_progress ──────────────────────────────
// Jika task in_progress sudah melewati X% dari waktunya,
// naikkan weight-nya secara proporsional

function getTimeBasedWeight(
  status: string,
  startDate: string | null,
  dueDate: string | null,
  today: Date = new Date(),
): number {
  const baseWeight = STATUS_WEIGHT[status];
  if (baseWeight === undefined || baseWeight === -1) return baseWeight ?? 0;

  // Hanya apply time-based boost untuk in_progress
  if (status !== "in_progress" || !startDate || !dueDate) return baseWeight;

  const start = new Date(startDate);
  const end = new Date(dueDate);
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = today.getTime() - start.getTime();

  if (totalMs <= 0) return baseWeight;

  // Berapa persen waktu sudah terpakai (clamp 0–1)
  const timeProgress = Math.max(0, Math.min(1, elapsedMs / totalMs));

  // Interpolasi antara 40% (awal in_progress) dan 85% (hampir deadline)
  // Formula: 0.40 + timeProgress × (0.85 - 0.40)
  const boostedWeight = 0.4 + timeProgress * 0.45;

  return Math.min(0.9, boostedWeight); // cap di 90% — hanya done = 100%
}

// ─── Main: Weighted Progress ─────────────────────────────────────────────────

export function calculateWeightedProgress(
  tasks: ProgressTask[],
  today: Date = new Date(),
): ProgressResult {
  // Filter cancelled dari perhitungan utama
  const activeTasks = tasks.filter((t) => t.status !== "cancelled");
  const cancelledTasks = tasks.filter((t) => t.status === "cancelled");

  if (activeTasks.length === 0) {
    return {
      percentage: 0,
      raw: 0,
      totalTasks: 0,
      doneTasks: 0,
      inProgressTasks: 0,
      inReviewTasks: 0,
      todoTasks: 0,
      cancelledTasks: cancelledTasks.length,
      method: "weighted",
      breakdown: [],
    };
  }

  // ── Hitung durasi setiap task ─────────────────────────────────────────
  const taskDurations = activeTasks.map((t) => ({
    task: t,
    duration: getDurationDays(t.startDate, t.dueDate),
  }));

  const totalDuration = taskDurations.reduce(
    (sum, { duration }) => sum + duration,
    0,
  );

  // ── Hitung weighted progress ──────────────────────────────────────────
  let weightedSum = 0;
  const breakdown = taskDurations.map(({ task, duration }) => {
    const weight = getTimeBasedWeight(
      task.status,
      task.startDate,
      task.dueDate,
      today,
    );

    // Bobot durasi: task lebih panjang berkontribusi lebih besar
    const durationWeight = duration / totalDuration;
    const contribution = durationWeight * weight * 100;

    weightedSum += durationWeight * weight;

    return {
      taskId: task.id,
      contribution: Math.round(contribution * 10) / 10,
      weight: Math.round(weight * 100),
      durationDays: duration,
    };
  });

  const raw = Math.min(1, weightedSum);
  const percentage = Math.round(raw * 100);

  // ── Hitung counters ───────────────────────────────────────────────────
  const count = (s: string) => activeTasks.filter((t) => t.status === s).length;

  return {
    percentage,
    raw,
    totalTasks: activeTasks.length,
    doneTasks: count("done"),
    inProgressTasks: count("in_progress"),
    inReviewTasks: count("in_review"),
    todoTasks: count("backlog") + count("todo"),
    cancelledTasks: cancelledTasks.length,
    method: "weighted",
    breakdown,
  };
}

// ─── Fallback: Simple Progress (untuk kasus tanpa tanggal) ───────────────────

export function calculateSimpleProgress(tasks: ProgressTask[]): ProgressResult {
  const activeTasks = tasks.filter((t) => t.status !== "cancelled");
  const cancelledTasks = tasks.filter((t) => t.status === "cancelled");

  if (activeTasks.length === 0) {
    return {
      percentage: 0,
      raw: 0,
      totalTasks: 0,
      doneTasks: 0,
      inProgressTasks: 0,
      inReviewTasks: 0,
      todoTasks: 0,
      cancelledTasks: cancelledTasks.length,
      method: "simple",
      breakdown: [],
    };
  }

  const weightedSum = activeTasks.reduce((sum, t) => {
    const w = STATUS_WEIGHT[t.status];
    return sum + (w === -1 ? 0 : (w ?? 0));
  }, 0);

  const raw = weightedSum / activeTasks.length;
  const percentage = Math.round(raw * 100);

  return {
    percentage,
    raw,
    totalTasks: activeTasks.length,
    doneTasks: activeTasks.filter((t) => t.status === "done").length,
    inProgressTasks: activeTasks.filter((t) => t.status === "in_progress")
      .length,
    inReviewTasks: activeTasks.filter((t) => t.status === "in_review").length,
    todoTasks: activeTasks.filter((t) => ["backlog", "todo"].includes(t.status))
      .length,
    cancelledTasks: cancelledTasks.length,
    method: "simple",
    breakdown: activeTasks.map((t) => ({
      taskId: t.id,
      contribution: ((STATUS_WEIGHT[t.status] ?? 0) / activeTasks.length) * 100,
      weight: (STATUS_WEIGHT[t.status] ?? 0) * 100,
      durationDays: 1,
    })),
  };
}

// ─── Auto-select: pakai weighted jika ada tanggal, simple jika tidak ─────────

export function calculateProgress(tasks: ProgressTask[]): ProgressResult {
  const hasAnyDates = tasks.some((t) => t.startDate && t.dueDate);
  return hasAnyDates
    ? calculateWeightedProgress(tasks)
    : calculateSimpleProgress(tasks);
}
```

---

### Langkah 2 — Buat Hook `usePlanningProgress`

**File: `apps/web/src/hooks/usePlanningProgress.ts`**

```typescript
"use client";

import { useMemo } from "react";
import {
  calculateProgress,
  type ProgressResult,
  type ProgressTask,
} from "@/lib/utils/progress.utils";

interface Issue {
  id: string;
  status: string;
  startDate?: string | null;
  dueDate?: string | null;
  // camelCase dari flattenIssue
  planInfo?: string | null;
}

export function usePlanningProgress(issues: Issue[]): ProgressResult {
  return useMemo(() => {
    const tasks: ProgressTask[] = issues.map((i) => ({
      id: i.id,
      status: i.status,
      startDate: i.startDate ?? null,
      dueDate: i.dueDate ?? null,
    }));
    return calculateProgress(tasks);
  }, [issues]);
}
```

---

### Langkah 3 — Buat Komponen `PlanningProgressBar`

Ganti `Progress: 0%` yang ada sekarang dengan komponen ini.

**File: `apps/web/src/components/dashboard/planning/PlanningProgressBar.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import type { ProgressResult } from "@/lib/utils/progress.utils";

interface Props {
  progress: ProgressResult;
  className?: string;
}

// Warna progress bar berdasarkan persentase
function getProgressColor(pct: number): string {
  if (pct >= 80) return "#10b981"; // hijau — hampir selesai
  if (pct >= 50) return "#3b82f6"; // biru — sudah setengah
  if (pct >= 20) return "#f59e0b"; // kuning — baru mulai
  return "#6b7280"; // abu-abu — awal sprint
}

export function PlanningProgressBar({ progress, className = "" }: Props) {
  const color = getProgressColor(progress.percentage);

  return (
    <div className={className}>
      {/* ── Header: angka + label ──────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
          gap: "12px",
        }}
      >
        {/* Progress besar di kiri */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <motion.span
            key={progress.percentage}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color,
              lineHeight: 1,
            }}
          >
            {progress.percentage}%
          </motion.span>
          <span style={{ fontSize: "11px", color: "#555" }}>
            progress sprint
          </span>
        </div>

        {/* Counter di kanan */}
        <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
          {[
            { label: "Selesai", value: progress.doneTasks, color: "#10b981" },
            {
              label: "Berjalan",
              value: progress.inProgressTasks,
              color: "#3b82f6",
            },
            {
              label: "Review",
              value: progress.inReviewTasks,
              color: "#8b5cf6",
            },
            {
              label: "Belum mulai",
              value: progress.todoTasks,
              color: "#6b7280",
            },
          ]
            .filter((item) => item.value > 0)
            .map((item) => (
              <div key={item.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: item.color,
                    lineHeight: 1,
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#444",
                    marginTop: "2px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#888",
                lineHeight: 1,
              }}
            >
              {progress.totalTasks}
            </div>
            <div style={{ fontSize: "9px", color: "#444", marginTop: "2px" }}>
              Total
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div
        style={{
          height: "6px",
          background: "#1a1a1a",
          borderRadius: "3px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Background segments per status — stacked */}
        {progress.totalTasks > 0 && (
          <>
            {/* Done: hijau solid */}
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(progress.doneTasks / progress.totalTasks) * 100}%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                background: "#10b981",
                borderRadius: "3px",
              }}
            />
            {/* In Review: ungu */}
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${((progress.doneTasks + progress.inReviewTasks) / progress.totalTasks) * 100}%`,
                opacity: 0.7,
              }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                background: "#8b5cf6",
                borderRadius: "3px",
                zIndex: 1,
              }}
            />
            {/* In Progress: biru */}
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${((progress.doneTasks + progress.inReviewTasks + progress.inProgressTasks) / progress.totalTasks) * 100}%`,
                opacity: 0.5,
              }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                background: "#3b82f6",
                borderRadius: "3px",
                zIndex: 0,
              }}
            />
          </>
        )}

        {/* Animated weighted progress — di atas semua */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            borderRadius: "3px",
            zIndex: 2,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>

      {/* ── Method hint ────────────────────────────────────── */}
      <div
        style={{
          marginTop: "6px",
          fontSize: "9px",
          color: "#333",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span>
          {progress.method === "weighted"
            ? "⚖ Dihitung berdasarkan durasi × status task"
            : "∑ Dihitung berdasarkan status task"}
        </span>
        {progress.cancelledTasks > 0 && (
          <span>
            · {progress.cancelledTasks} task dibatalkan (tidak dihitung)
          </span>
        )}
      </div>
    </div>
  );
}
```

---

### Langkah 4 — Update Ringkasan Planning Component

Cari komponen yang render `Progress: 0%` di halaman Sprint Planning.

```bash
# Cari file yang render teks "Progress"
grep -rn "Progress.*%" apps/web/src/components/dashboard/planning/ --include="*.tsx"
grep -rn "Progress.*%" apps/web/src/app --include="*.tsx" -r
```

File yang ditemukan — tambahkan import dan ganti render progress:

```tsx
// TAMBAHKAN import
import { PlanningProgressBar } from '@/components/dashboard/planning/PlanningProgressBar'
import { usePlanningProgress }  from '@/hooks/usePlanningProgress'

// Di dalam komponen, tambahkan hook (issues = data issues planning yang sudah ada)
const progress = usePlanningProgress(issues)

// GANTI bagian yang render "Progress: 0%"
// SEBELUM:
<span>Progress: {someValue}%</span>

// SESUDAH:
<PlanningProgressBar progress={progress} />
```

---

### Langkah 5 — Update Backend: Tambah Field ke Response

Pastikan response issues dari endpoint planning sudah include
`start_date` dan `due_date` dari tabel `issue_planning`.

**File: `apps/server/src/services/issues/issues-query.service.ts`**

Pastikan `ISSUE_SELECT` sudah include join ke `issue_planning`:

```typescript
const ISSUE_SELECT = `
  *,
  assignee:profiles!issues_assignee_id_fkey(id, name, avatar, initials),
  created_by:profiles!issues_created_by_id_fkey(id, name, avatar, initials),
  triage:issue_triage(reason, triage_reason, triaged_at),
  planning:issue_planning(plan_info, start_date, due_date, estimated_hours, actual_hours)
`;
```

Dan `flattenIssue` sudah map dengan benar:

```typescript
export function flattenIssue(raw: any) {
  const { triage, planning, ...core } = raw;
  return {
    ...core,
    reason: triage?.reason ?? null,
    triageReason: triage?.triage_reason ?? null,
    triagedAt: triage?.triaged_at ?? null,
    planInfo: planning?.plan_info ?? null,
    startDate: planning?.start_date ?? null, // ← wajib ada
    dueDate: planning?.due_date ?? null, // ← wajib ada
    estimatedHours: planning?.estimated_hours ?? 0,
    actualHours: planning?.actual_hours ?? 0,
  };
}
```

---

## Hasil Akhir

### Dengan data dari screenshot

```
Task PERPUS-002: in_progress, 26-27 Apr (2 hari)
  → timeProgress hari ini (27 Apr): ~100%
  → boostedWeight: min(0.90, 0.40 + 1.0 × 0.45) = 0.85
  → durationWeight: 2/31 = 0.065
  → kontribusi: 0.065 × 0.85 × 100 = 5.5%

Task PERPUS-001: in_progress, 1-29 Apr (29 hari)
  → timeProgress hari ini (27 Apr): (27-1)/(29-1) = 26/28 = 93%
  → boostedWeight: min(0.90, 0.40 + 0.93 × 0.45) = min(0.90, 0.82) = 0.82
  → durationWeight: 29/31 = 0.935
  → kontribusi: 0.935 × 0.82 × 100 = 76.7%

TOTAL PROGRESS: 5.5 + 76.7 = ~82% ✓

Tampilan:
  82%  progress sprint
  ████████████████████████████░░░░  (bar hijau)
  ┌──────┬──────┬──────┬──────┬──────┐
  │  0   │  2   │  0   │  0   │  2   │
  │Selesai│Berjalan│Review│Belum │Total │
  └──────┴──────┴──────┴──────┴──────┘
  ⚖ Dihitung berdasarkan durasi × status task
```

---

## Ringkasan File

| File                                                                 | Aksi                                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------------- |
| `apps/web/src/lib/utils/progress.utils.ts`                           | **BUAT BARU** — pure calculation, no deps                       |
| `apps/web/src/hooks/usePlanningProgress.ts`                          | **BUAT BARU** — React hook wrapper                              |
| `apps/web/src/components/dashboard/planning/PlanningProgressBar.tsx` | **BUAT BARU** — komponen visual                                 |
| Komponen planning yang render "Progress: 0%"                         | **EDIT** — ganti dengan PlanningProgressBar                     |
| `apps/server/src/services/issues/issues-query.service.ts`            | **VERIFIKASI** — pastikan start_date & due_date ada di response |

---

## Catatan

**Kenapa tidak simpan progress ke database?**
Progress adalah _derived data_ — bisa dihitung kapan saja dari status + tanggal yang sudah ada. Menyimpannya ke DB berarti dua sumber kebenaran yang bisa tidak sinkron. Lebih baik hitung di frontend dengan `useMemo` — tidak ada network request tambahan, selalu up-to-date.

**Time-based boost cap di 90%:**
Task `in_progress` yang sudah lewat deadline tidak akan pernah mencapai 100% — hanya status `done` yang bisa 100%. Ini mendorong user untuk benar-benar menyelesaikan dan mengubah status task.

---

_Fix: Smart Progress Calculation — Sprint Planning Amertask | April 2026_
