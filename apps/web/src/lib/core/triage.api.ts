import { apiClient } from "./http";
import type { Issue } from "@/types";

interface TriageListResponse {
  issues: Issue[];
  total: number;
}

interface AcceptPayload {
  priority?: string;
  assigneeId?: string;
  labels?: string[];
}

interface DeclinePayload {
  reason?: string;
}

export const triageApi = {
  list: (teamSlug: string): Promise<TriageListResponse> =>
    apiClient(`/teams/${teamSlug}/triage`),

  accept: (issueId: string, payload?: AcceptPayload): Promise<Issue> =>
    apiClient(`/triage/${issueId}/accept`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),

  decline: (
    issueId: string,
    payload?: DeclinePayload,
  ): Promise<{ message: string; issueId: string }> =>
    apiClient(`/triage/${issueId}/decline`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),

  remove: (issueId: string): Promise<{ message: string }> =>
    apiClient(`/issues/${issueId}`, {
      method: "DELETE",
    }),
};
