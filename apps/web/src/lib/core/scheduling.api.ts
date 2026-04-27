import { apiClient } from "./http";

export interface GraphNode {
  id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number;
  assignee?: { name: string; initials: string; avatar?: string };
}

export interface GraphEdge {
  issue_id: string;
  depends_on: string;
  type: string;
  lag_days: number;
}

export interface ScheduleResult {
  taskId: string;
  newStartDate: string;
  newDueDate: string;
  shifted: boolean;
  shiftDays: number;
}

export interface ScheduleOutput {
  results: ScheduleResult[];
  criticalPath: string[];
}

export const schedulingApi = {
  getGraph: (
    teamSlug: string,
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> =>
    apiClient(`/teams/${teamSlug}/graph`),

  reschedule: (
    teamSlug: string,
    payload: {
      taskId: string;
      startDate: string;
      dueDate: string;
    },
  ): Promise<ScheduleOutput> =>
    apiClient(`/teams/${teamSlug}/schedule`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  addDependency: (
    teamSlug: string,
    payload: {
      issueId: string;
      dependsOnId: string;
      lagDays?: number;
    },
  ): Promise<{ message: string }> =>
    apiClient(`/teams/${teamSlug}/dependencies`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  removeDependency: (
    teamSlug: string,
    payload: {
      issueId: string;
      dependsOnId: string;
    },
  ): Promise<{ message: string }> =>
    apiClient(`/teams/${teamSlug}/dependencies`, {
      method: "DELETE",
      body: JSON.stringify(payload),
    }),
};
