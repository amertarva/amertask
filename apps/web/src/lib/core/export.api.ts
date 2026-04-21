import { apiClient } from "./http";

export type ExportType = "planning" | "backlog" | "execution";

export interface ExportDocsResponse {
  success: boolean;
  message: string;
  documentUrl: string;
  exportedAt: string;
  totalItems: number;
}

export const exportApi = {
  copyToDocs: (
    teamSlug: string,
    type: ExportType,
  ): Promise<ExportDocsResponse> =>
    apiClient<ExportDocsResponse>(`/teams/${teamSlug}/export/docs`, {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
};
