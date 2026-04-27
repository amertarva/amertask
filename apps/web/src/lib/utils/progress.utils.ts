// ─── Status weight map ────────────────────────────────────────────────────────

export const STATUS_WEIGHT: Record<string, number> = {
  backlog: 0,
  todo: 0,
  "To Do": 0,
  in_progress: 0.4,
  "In Progress": 0.4,
  in_review: 0.8,
  "In Review": 0.8,
  done: 1.0,
  Done: 1.0,
  cancelled: -1, // -1 = diabaikan dari perhitungan
  Cancelled: -1,
  in_execution: 1.0, // Planning yang sudah dipromote dianggap selesai
  "In Execution": 1.0,
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
  const isInProgress = status === "in_progress" || status === "In Progress";
  if (!isInProgress || !startDate || !dueDate) return baseWeight;

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
  const activeTasks = tasks.filter((t) => {
    const weight = STATUS_WEIGHT[t.status];
    return weight !== -1;
  });
  const cancelledTasks = tasks.filter((t) => {
    const weight = STATUS_WEIGHT[t.status];
    return weight === -1;
  });

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
  const count = (statuses: string[]) =>
    activeTasks.filter((t) => statuses.includes(t.status)).length;

  return {
    percentage,
    raw,
    totalTasks: activeTasks.length,
    doneTasks: count(["done", "Done", "in_execution", "In Execution"]),
    inProgressTasks: count(["in_progress", "In Progress"]),
    inReviewTasks: count(["in_review", "In Review"]),
    todoTasks: count(["backlog", "todo", "To Do"]),
    cancelledTasks: cancelledTasks.length,
    method: "weighted",
    breakdown,
  };
}

// ─── Fallback: Simple Progress (untuk kasus tanpa tanggal) ───────────────────

export function calculateSimpleProgress(tasks: ProgressTask[]): ProgressResult {
  const activeTasks = tasks.filter((t) => {
    const weight = STATUS_WEIGHT[t.status];
    return weight !== -1;
  });
  const cancelledTasks = tasks.filter((t) => {
    const weight = STATUS_WEIGHT[t.status];
    return weight === -1;
  });

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

  const count = (statuses: string[]) =>
    activeTasks.filter((t) => statuses.includes(t.status)).length;

  return {
    percentage,
    raw,
    totalTasks: activeTasks.length,
    doneTasks: count(["done", "Done", "in_execution", "In Execution"]),
    inProgressTasks: count(["in_progress", "In Progress"]),
    inReviewTasks: count(["in_review", "In Review"]),
    todoTasks: count(["backlog", "todo", "To Do"]),
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
