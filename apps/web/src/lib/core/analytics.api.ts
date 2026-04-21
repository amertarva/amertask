import { apiClient } from "./http";

interface AnalyticsSummary {
  totalIssues: number;
  openIssues: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  byStatus: Array<{ status: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  byAssignee: Array<{
    userId: string;
    name: string;
    avatar?: string;
    initials: string;
    count: number;
  }>;
  completionTrend: Array<{ date: string; completed: number; created: number }>;
}

interface AnalyticsParams {
  from?: string; // ISO date string
  to?: string; // ISO date string
}

export const analyticsApi = {
  get: (
    teamSlug: string,
    params: AnalyticsParams = {},
  ): Promise<AnalyticsResponse> => {
    const qs = new URLSearchParams();
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    const query = qs.toString() ? `?${qs}` : "";
    return apiClient(`/teams/${teamSlug}/analytics${query}`);
  },
};
