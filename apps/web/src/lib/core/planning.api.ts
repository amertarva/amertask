import { apiClient } from "./http";

export interface IssuePlanningData {
  issueId: string;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours?: number;
  planInfo?: string;
}

export interface IssuePlanning extends IssuePlanningData {
  id: string;
  actualHours?: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const planningApi = {
  // Upsert planning data untuk issue
  upsertPlanning: (data: IssuePlanningData): Promise<IssuePlanning> =>
    apiClient(`/issues/${data.issueId}/planning`, {
      method: "POST",
      body: JSON.stringify({
        start_date: data.startDate,
        due_date: data.dueDate,
        estimated_hours: data.estimatedHours,
        plan_info: data.planInfo,
      }),
    }),

  // Get planning data untuk issue
  getPlanning: (issueId: string): Promise<IssuePlanning | null> =>
    apiClient(`/issues/${issueId}/planning`),

  // Delete planning data
  deletePlanning: (issueId: string): Promise<{ message: string }> =>
    apiClient(`/issues/${issueId}/planning`, {
      method: "DELETE",
    }),
};
