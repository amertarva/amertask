import { apiClient } from "./http";
import type { Requirement } from "./requirements.api";

export interface SrsDocument {
  id: string;
  teamId: string;
  version: string;
  purpose: string | null;
  scope: string | null;
  glossary: Array<{ term: string; definition: string }>;
  productPerspective: string | null;
  productFunctions: string | null;
  userCharacteristics: Array<{ role: string; description: string }>;
  generalConstraints: string | null;
  uiRequirements: string | null;
  hardwareInterface: string | null;
  softwareInterface: string | null;
  commInterface: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  googleDocsUrl: string | null;
}

export type SrsSectionKey =
  | "purpose"
  | "scope"
  | "glossary"
  | "productPerspective"
  | "productFunctions"
  | "userCharacteristics"
  | "generalConstraints"
  | "uiRequirements"
  | "hardwareInterface"
  | "softwareInterface"
  | "commInterface";

export const srsApi = {
  get: (
    teamSlug: string,
  ): Promise<{
    srs: SrsDocument | null;
    fr: Requirement[];
    nfr: Requirement[];
  }> => apiClient(`/teams/${teamSlug}/srs`),

  upsert: (
    teamSlug: string,
    payload: Partial<SrsDocument>,
  ): Promise<SrsDocument> =>
    apiClient(`/teams/${teamSlug}/srs`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  aiGenerateSection: (
    teamSlug: string,
    section: SrsSectionKey,
  ): Promise<{ section: SrsSectionKey; content: string }> =>
    apiClient(`/teams/${teamSlug}/srs/ai-generate-section`, {
      method: "POST",
      body: JSON.stringify({ section }),
    }),
};
