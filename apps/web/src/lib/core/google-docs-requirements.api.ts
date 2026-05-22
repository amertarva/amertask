import { apiClient } from "./http";

export interface GoogleDocsConfig {
  googleDocsUrl: string | null;
}

export interface CopyToGoogleDocsResult {
  googleDocsUrl: string;
  isNewUrl: boolean;
}

export interface CopyToGoogleDocsResponse {
  success: boolean;
  message: string;
  data: CopyToGoogleDocsResult;
}

// ============================================================================
// Requirements Google Docs API
// ============================================================================

/**
 * Get current Google Docs URL for requirements
 */
export async function getRequirementsGoogleDocsUrl(
  teamSlug: string,
): Promise<GoogleDocsConfig> {
  const response = await apiClient<{
    success: boolean;
    data: GoogleDocsConfig;
  }>(`teams/${teamSlug}/requirements/google-docs`, {
    method: "GET",
  });
  return response.data;
}

/**
 * Copy requirements to Google Docs
 * If googleDocsUrl is provided, it will be saved for future use
 * If not provided, uses existing saved URL
 */
export async function copyRequirementsToGoogleDocs(
  teamSlug: string,
  googleDocsUrl?: string,
): Promise<CopyToGoogleDocsResponse> {
  return await apiClient<CopyToGoogleDocsResponse>(
    `teams/${teamSlug}/requirements/google-docs/copy`,
    {
      method: "POST",
      body: JSON.stringify({ googleDocsUrl }),
    },
  );
}

// ============================================================================
// SRS Google Docs API
// ============================================================================

/**
 * Get current Google Docs URL for SRS
 */
export async function getSrsGoogleDocsUrl(
  teamSlug: string,
): Promise<GoogleDocsConfig> {
  const response = await apiClient<{
    success: boolean;
    data: GoogleDocsConfig;
  }>(`teams/${teamSlug}/srs/google-docs`, {
    method: "GET",
  });
  return response.data;
}

/**
 * Copy SRS to Google Docs
 * If googleDocsUrl is provided, it will be saved for future use
 * If not provided, uses existing saved URL
 */
export async function copySrsToGoogleDocs(
  teamSlug: string,
  googleDocsUrl?: string,
): Promise<CopyToGoogleDocsResponse> {
  return await apiClient<CopyToGoogleDocsResponse>(
    `teams/${teamSlug}/srs/google-docs/copy`,
    {
      method: "POST",
      body: JSON.stringify({ googleDocsUrl }),
    },
  );
}
