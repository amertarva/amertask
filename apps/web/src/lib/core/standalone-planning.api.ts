import { apiClient } from "./http";

export interface StandalonePlanning {
  id: string;
  team_id: string;
  number: number;
  title: string;
  description?: string;
  priority: string;
  assignee_id?: string;
  status: "planned" | "in_execution" | "completed" | "cancelled";
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  plan_info?: string;
  issue_id?: string | null;
  created_at: string;
  updated_at: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
    initials?: string;
  };
  issue?: {
    id: string;
    number: number;
    status: string;
  };
}

export interface CreatePlanningPayload {
  title: string;
  description?: string;
  priority?: string;
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  planInfo?: string;
}

export interface UpdatePlanningPayload {
  title?: string;
  description?: string;
  priority?: string;
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  planInfo?: string;
  status?: "planned" | "in_execution" | "completed" | "cancelled";
}

export interface ListPlanningsParams {
  status?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export const standalonePlanningApi = {
  /**
   * List all plannings for a team (standalone, belum masuk issues)
   */
  async listPlannings(
    teamSlug: string,
    params?: ListPlanningsParams,
  ): Promise<{
    plannings: StandalonePlanning[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.priority) queryParams.append("priority", params.priority);
    if (params?.assigneeId) queryParams.append("assigneeId", params.assigneeId);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortDir) queryParams.append("sortDir", params.sortDir);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const path = `/teams/${teamSlug}/plannings${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return apiClient(path);
  },

  /**
   * Create new standalone planning
   */
  async createPlanning(
    teamSlug: string,
    payload: CreatePlanningPayload,
  ): Promise<StandalonePlanning> {
    return apiClient(`/teams/${teamSlug}/plannings`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get planning by number
   */
  async getPlanningByNumber(
    teamSlug: string,
    number: number,
  ): Promise<StandalonePlanning> {
    return apiClient(`/teams/${teamSlug}/plannings/${number}`);
  },

  /**
   * Update planning (hanya bisa update kalau status = 'planned')
   */
  async updatePlanning(
    teamSlug: string,
    planningId: string,
    payload: UpdatePlanningPayload,
  ): Promise<StandalonePlanning> {
    return apiClient(`/teams/${teamSlug}/plannings/${planningId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete planning (hanya bisa delete kalau status = 'planned')
   */
  async deletePlanning(teamSlug: string, planningId: string): Promise<void> {
    return apiClient(`/teams/${teamSlug}/plannings/${planningId}`, {
      method: "DELETE",
    });
  },

  /**
   * Promote planning to execution (create issue + link)
   */
  async promotePlanningToExecution(
    teamSlug: string,
    planningId: string,
  ): Promise<{
    message: string;
    issue: {
      id: string;
      number: number;
      title: string;
      status: string;
      planning: StandalonePlanning;
    };
  }> {
    return apiClient(`/teams/${teamSlug}/plannings/${planningId}/promote`, {
      method: "POST",
    });
  },
};
