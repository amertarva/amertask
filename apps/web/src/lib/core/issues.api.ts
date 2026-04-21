import { apiClient } from "./http";
import type { Issue } from "@/types";

interface IssueListParams {
  status?: string; // csv: "todo,in_progress"
  priority?: string; // csv: "urgent,high"
  labels?: string; // csv: "Frontend,Bug"
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

interface IssueListResponse {
  issues: Issue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateIssuePayload {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  labels?: string[];
  assigneeId?: string;
  parentIssueId?: string;
  source?: "slack" | "email" | "manual";
  isTriaged?: boolean;
  reason?: string; // Alasan prioritas
  triageReason?: string; // Alasan terkendala untuk triage
  planInfo?: string; // Informasi planning
}

type UpdateIssuePayload = Partial<CreateIssuePayload>;

function buildQueryString(params: IssueListParams): string {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      qs.set(key, String(val));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export const issuesApi = {
  list: (
    teamSlug: string,
    params: IssueListParams = {},
  ): Promise<IssueListResponse> =>
    apiClient(`/teams/${teamSlug}/issues${buildQueryString(params)}`),

  getById: (id: string): Promise<Issue> => apiClient(`/issues/${id}`),

  create: (teamSlug: string, payload: CreateIssuePayload): Promise<Issue> =>
    apiClient(`/teams/${teamSlug}/issues`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateIssuePayload): Promise<Issue> =>
    apiClient(`/issues/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id: string): Promise<{ message: string }> =>
    apiClient(`/issues/${id}`, { method: "DELETE" }),
};
