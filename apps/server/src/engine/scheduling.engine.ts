// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskNode {
  id: string;
  startDate: Date | null;
  dueDate: Date | null;
  estimatedHours: number;
  status: string;
  dependsOn: string[]; // IDs task yang harus selesai sebelum ini
  lagDays: number; // Jeda tambahan setelah semua dependency selesai
}

export interface ScheduleResult {
  taskId: string;
  newStartDate: Date;
  newDueDate: Date;
  shifted: boolean; // true jika tanggalnya berubah dari sebelumnya
  shiftDays: number; // berapa hari bergeser (positif = maju, negatif = mundur)
}

export interface ScheduleConflict {
  taskId: string;
  message: string;
}

export interface ScheduleOutput {
  results: ScheduleResult[];
  conflicts: ScheduleConflict[];
  criticalPath: string[]; // IDs task yang ada di critical path
}

// ─── Helper: Hitung durasi hari kerja ────────────────────────────────────────

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  const direction = days >= 0 ? 1 : -1;
  while (added < Math.abs(days)) {
    result.setDate(result.getDate() + direction);
    // Skip Sabtu (6) dan Minggu (0)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      added++;
    }
  }
  return result;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function estimatedDuration(hours: number): number {
  // 8 jam per hari kerja, minimum 1 hari
  return Math.max(1, Math.ceil(hours / 8));
}

// ─── Topological Sort (Kahn's Algorithm) ─────────────────────────────────────
// Mengurutkan tasks berdasarkan dependensi
// Kompleksitas: O(V + E) — sangat cepat bahkan untuk ribuan tasks

function topologicalSort(tasks: Map<string, TaskNode>): string[] | null {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>(); // task → tasks yang bergantung padanya

  // Inisialisasi
  for (const [id] of tasks) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  // Bangun graph
  for (const [id, task] of tasks) {
    for (const depId of task.dependsOn) {
      if (!tasks.has(depId)) continue; // dependency di luar scope, skip
      adjacency.get(depId)!.push(id);
      inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
    }
  }

  // Kahn's BFS
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  // Jika ada circular dependency, sorted.length < tasks.size
  return sorted.length === tasks.size ? sorted : null;
}

// ─── Critical Path Method (CPM) ──────────────────────────────────────────────

function findCriticalPath(
  tasks: Map<string, TaskNode>,
  sortedIds: string[],
): string[] {
  const earliestFinish = new Map<string, number>(); // dalam hari dari T=0

  // Forward pass
  for (const id of sortedIds) {
    const task = tasks.get(id)!;
    const duration = estimatedDuration(task.estimatedHours);
    let earliestStart = 0;

    for (const depId of task.dependsOn) {
      const depFinish = earliestFinish.get(depId) ?? 0;
      earliestStart = Math.max(earliestStart, depFinish + (task.lagDays ?? 0));
    }

    earliestFinish.set(id, earliestStart + duration);
  }

  // Total project duration
  const projectDuration = Math.max(...Array.from(earliestFinish.values()));

  // Backward pass
  const latestStart = new Map<string, number>();
  for (const id of [...sortedIds].reverse()) {
    const task = tasks.get(id)!;
    const duration = estimatedDuration(task.estimatedHours);
    const dependents = sortedIds.filter((otherId) =>
      tasks.get(otherId)!.dependsOn.includes(id),
    );

    let latestFinish = projectDuration;
    for (const depId of dependents) {
      const ls = latestStart.get(depId) ?? projectDuration;
      const lag = tasks.get(depId)!.lagDays ?? 0;
      latestFinish = Math.min(latestFinish, ls - lag);
    }

    latestStart.set(id, latestFinish - duration);
  }

  // Critical path: tasks where slack = 0
  const criticalPath: string[] = [];
  for (const id of sortedIds) {
    const task = tasks.get(id)!;
    const duration = estimatedDuration(task.estimatedHours);
    const ef = earliestFinish.get(id) ?? 0;
    const ls = latestStart.get(id) ?? 0;
    const slack = ls - (ef - duration);
    if (Math.abs(slack) < 0.001) criticalPath.push(id);
  }

  return criticalPath;
}

// ─── Main: Auto-Schedule ──────────────────────────────────────────────────────

export function autoSchedule(
  tasks: Map<string, TaskNode>,
  changedTaskId: string,
  newStartDate: Date,
  newDueDate: Date,
): ScheduleOutput {
  const results: ScheduleResult[] = [];
  const conflicts: ScheduleConflict[] = [];

  // 1. Terapkan perubahan pada task yang diubah
  const changedTask = tasks.get(changedTaskId);
  if (!changedTask) {
    return {
      results: [],
      conflicts: [{ taskId: changedTaskId, message: "Task tidak ditemukan" }],
      criticalPath: [],
    };
  }

  const previousStart = changedTask.startDate;
  const previousDue = changedTask.dueDate;

  tasks.set(changedTaskId, {
    ...changedTask,
    startDate: newStartDate,
    dueDate: newDueDate,
  });

  // 2. Topological sort untuk urutan proses
  const sortedIds = topologicalSort(tasks);
  if (!sortedIds) {
    return {
      results: [],
      conflicts: [
        {
          taskId: changedTaskId,
          message: "Circular dependency terdeteksi — tidak bisa reschedule",
        },
      ],
      criticalPath: [],
    };
  }

  // 3. Propagasi pergeseran ke semua dependen
  const computedDates = new Map<string, { start: Date; due: Date }>();

  for (const id of sortedIds) {
    const task = tasks.get(id)!;

    if (id === changedTaskId) {
      computedDates.set(id, { start: newStartDate, due: newDueDate });
      continue;
    }

    if (task.dependsOn.length === 0) {
      // Task tanpa dependency — pertahankan jadwal aslinya
      if (task.startDate && task.dueDate) {
        computedDates.set(id, { start: task.startDate, due: task.dueDate });
      }
      continue;
    }

    // Cari tanggal selesai terlambat dari semua dependency
    let latestDepEnd: Date | null = null;
    for (const depId of task.dependsOn) {
      const depComputed = computedDates.get(depId);
      if (!depComputed) continue;
      const depEnd = addBusinessDays(depComputed.due, task.lagDays ?? 0);
      if (!latestDepEnd || depEnd > latestDepEnd) {
        latestDepEnd = depEnd;
      }
    }

    if (!latestDepEnd) {
      if (task.startDate && task.dueDate) {
        computedDates.set(id, { start: task.startDate, due: task.dueDate });
      }
      continue;
    }

    // Start date = hari kerja pertama setelah semua dependency selesai
    const newStart = addBusinessDays(latestDepEnd, 1);

    // Pertahankan durasi asli
    const originalDuration =
      task.startDate && task.dueDate
        ? daysBetween(task.startDate, task.dueDate)
        : estimatedDuration(task.estimatedHours);

    const newDue = addBusinessDays(newStart, originalDuration);

    computedDates.set(id, { start: newStart, due: newDue });

    // Catat perubahan
    const originalStart = task.startDate;
    const shiftDays = originalStart ? daysBetween(originalStart, newStart) : 0;

    if (shiftDays !== 0 || id === changedTaskId) {
      results.push({
        taskId: id,
        newStartDate: newStart,
        newDueDate: newDue,
        shifted: shiftDays !== 0,
        shiftDays,
      });
    }
  }

  // Tambahkan changed task ke results
  const changedShift = previousStart
    ? daysBetween(previousStart, newStartDate)
    : 0;
  results.unshift({
    taskId: changedTaskId,
    newStartDate: newStartDate,
    newDueDate: newDueDate,
    shifted: changedShift !== 0,
    shiftDays: changedShift,
  });

  // 4. Hitung critical path
  const criticalPath = findCriticalPath(tasks, sortedIds);

  return { results, conflicts, criticalPath };
}
