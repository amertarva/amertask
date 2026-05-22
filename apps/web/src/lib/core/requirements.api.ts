import { apiClient } from "./http";

export type RequirementType = "FR" | "NFR";
export type RequirementPriority = "MUST" | "SHOULD" | "COULD" | "WONT";

export interface Requirement {
  id: string;
  teamId: string;
  issueId: string | null;
  type: RequirementType;
  code: string;
  description: string;
  priority: RequirementPriority;
  nfrCategory: string | null;
  acceptanceCriteria: string | null;
  createdAt: string;
  updatedAt: string;
  issue?: { number: number; title: string } | null;
  createdBy?: { name: string; initials: string } | null;
}

export interface AiGenerateResult {
  fr: Array<{
    description: string;
    priority: string;
    acceptanceCriteria: string;
  }>;
  nfr: Array<{
    description: string;
    priority: string;
    nfrCategory: string;
    acceptanceCriteria: string;
  }>;
}

export const requirementsApi = {
  list: (
    teamSlug: string,
  ): Promise<{ fr: Requirement[]; nfr: Requirement[]; total: number }> =>
    apiClient(`/teams/${teamSlug}/requirements`),

  create: (
    teamSlug: string,
    payload: {
      type: RequirementType;
      description: string;
      issueId?: string;
      priority?: RequirementPriority;
      nfrCategory?: string;
      acceptanceCriteria?: string;
    },
  ): Promise<Requirement> =>
    apiClient(`/teams/${teamSlug}/requirements`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (
    teamSlug: string,
    id: string,
    payload: Partial<{
      description: string;
      priority: RequirementPriority;
      nfrCategory: string;
      acceptanceCriteria: string;
    }>,
  ): Promise<Requirement> =>
    apiClient(`/teams/${teamSlug}/requirements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (teamSlug: string, id: string): Promise<{ message: string }> =>
    apiClient(`/teams/${teamSlug}/requirements/${id}`, {
      method: "DELETE",
    }),

  aiGenerate: (
    teamSlug: string,
    payload: {
      issueTitle: string;
      issueDescription?: string;
      role?: string;
    },
  ): Promise<AiGenerateResult> =>
    apiClient(`/teams/${teamSlug}/requirements/ai-generate`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
