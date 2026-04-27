import {
  calculateProgress,
  calculateWeightedProgress,
  calculateSimpleProgress,
  type ProgressTask,
} from "../progress.utils";

describe("Progress Calculation", () => {
  describe("calculateSimpleProgress", () => {
    it("should return 0% for empty tasks", () => {
      const result = calculateSimpleProgress([]);
      expect(result.percentage).toBe(0);
      expect(result.totalTasks).toBe(0);
    });

    it("should calculate based on status weight only", () => {
      const tasks: ProgressTask[] = [
        { id: "1", status: "todo", startDate: null, dueDate: null },
        { id: "2", status: "in_progress", startDate: null, dueDate: null },
        { id: "3", status: "done", startDate: null, dueDate: null },
      ];

      const result = calculateSimpleProgress(tasks);
      // (0 + 0.4 + 1.0) / 3 = 0.467 = 47%
      expect(result.percentage).toBe(47);
      expect(result.method).toBe("simple");
    });

    it("should ignore cancelled tasks", () => {
      const tasks: ProgressTask[] = [
        { id: "1", status: "done", startDate: null, dueDate: null },
        { id: "2", status: "cancelled", startDate: null, dueDate: null },
      ];

      const result = calculateSimpleProgress(tasks);
      expect(result.percentage).toBe(100);
      expect(result.totalTasks).toBe(1);
      expect(result.cancelledTasks).toBe(1);
    });
  });

  describe("calculateWeightedProgress", () => {
    it("should calculate based on duration weight", () => {
      const tasks: ProgressTask[] = [
        {
          id: "1",
          status: "done",
          startDate: "2024-01-01",
          dueDate: "2024-01-02",
        }, // 1 day
        {
          id: "2",
          status: "todo",
          startDate: "2024-01-01",
          dueDate: "2024-01-10",
        }, // 9 days
      ];

      const result = calculateWeightedProgress(tasks);
      // Task 1: (1/10) × 1.0 = 0.1 = 10%
      // Task 2: (9/10) × 0.0 = 0.0 = 0%
      // Total: 10%
      expect(result.percentage).toBe(10);
      expect(result.method).toBe("weighted");
    });

    it("should apply time-based boost for in_progress tasks", () => {
      const today = new Date("2024-01-10");
      const tasks: ProgressTask[] = [
        {
          id: "1",
          status: "in_progress",
          startDate: "2024-01-01",
          dueDate: "2024-01-11",
        }, // 90% elapsed
      ];

      const result = calculateWeightedProgress(tasks, today);
      // timeProgress = 9/10 = 0.9
      // boostedWeight = 0.40 + 0.9 × 0.45 = 0.805
      // contribution = 1.0 × 0.805 = 80.5%
      expect(result.percentage).toBeGreaterThan(80);
      expect(result.percentage).toBeLessThan(90);
    });

    it("should handle mixed statuses correctly", () => {
      const tasks: ProgressTask[] = [
        {
          id: "1",
          status: "done",
          startDate: "2024-01-01",
          dueDate: "2024-01-05",
        }, // 4 days
        {
          id: "2",
          status: "in_progress",
          startDate: "2024-01-01",
          dueDate: "2024-01-05",
        }, // 4 days
        {
          id: "3",
          status: "todo",
          startDate: "2024-01-01",
          dueDate: "2024-01-03",
        }, // 2 days
      ];

      const result = calculateWeightedProgress(tasks);
      // Total duration: 10 days
      // Task 1: (4/10) × 1.0 = 0.4 = 40%
      // Task 2: (4/10) × 0.4 = 0.16 = 16%
      // Task 3: (2/10) × 0.0 = 0.0 = 0%
      // Total: 56%
      expect(result.percentage).toBe(56);
      expect(result.doneTasks).toBe(1);
      expect(result.inProgressTasks).toBe(1);
      expect(result.todoTasks).toBe(1);
    });
  });

  describe("calculateProgress (auto-select)", () => {
    it("should use weighted mode when dates are available", () => {
      const tasks: ProgressTask[] = [
        {
          id: "1",
          status: "done",
          startDate: "2024-01-01",
          dueDate: "2024-01-02",
        },
      ];

      const result = calculateProgress(tasks);
      expect(result.method).toBe("weighted");
    });

    it("should use simple mode when no dates available", () => {
      const tasks: ProgressTask[] = [
        { id: "1", status: "done", startDate: null, dueDate: null },
      ];

      const result = calculateProgress(tasks);
      expect(result.method).toBe("simple");
    });

    it("should use weighted mode if at least one task has dates", () => {
      const tasks: ProgressTask[] = [
        { id: "1", status: "done", startDate: null, dueDate: null },
        {
          id: "2",
          status: "todo",
          startDate: "2024-01-01",
          dueDate: "2024-01-02",
        },
      ];

      const result = calculateProgress(tasks);
      expect(result.method).toBe("weighted");
    });
  });

  describe("breakdown", () => {
    it("should provide detailed breakdown per task", () => {
      const tasks: ProgressTask[] = [
        {
          id: "task-1",
          status: "done",
          startDate: "2024-01-01",
          dueDate: "2024-01-05",
        },
        {
          id: "task-2",
          status: "in_progress",
          startDate: "2024-01-01",
          dueDate: "2024-01-03",
        },
      ];

      const result = calculateWeightedProgress(tasks);
      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[0].taskId).toBe("task-1");
      expect(result.breakdown[0].durationDays).toBe(4);
      expect(result.breakdown[0].weight).toBe(100);
      expect(result.breakdown[1].taskId).toBe("task-2");
      expect(result.breakdown[1].durationDays).toBe(2);
    });
  });
});
