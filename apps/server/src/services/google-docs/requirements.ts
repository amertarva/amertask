import { supabase } from "../../lib/supabase";
import type {
  RequirementsGoogleDocsConfig,
  SrsGoogleDocsConfig,
} from "../../types/services/docs/types";

export async function getRequirementsGoogleDocsUrl(
  teamId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("teams")
    .select("r_docs")
    .eq("id", teamId)
    .maybeSingle<{ r_docs: string | null }>();

  if (error) {
    console.error("Error getting requirements Google Docs URL:", error);
    throw new Error(error.message);
  }

  return data?.r_docs || null;
}

export async function setRequirementsGoogleDocsUrl(
  teamId: string,
  googleDocsUrl: string,
): Promise<void> {
  const { error } = await supabase
    .from("teams")
    // @ts-expect-error - r_docs column exists in database but not in generated types
    .update({ r_docs: googleDocsUrl })
    .eq("id", teamId);

  if (error) {
    console.error("Error setting requirements Google Docs URL:", error);
    throw new Error(error.message);
  }
}

export async function getSrsGoogleDocsUrl(
  teamId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("teams")
    .select("srs_docs")
    .eq("id", teamId)
    .maybeSingle<{ srs_docs: string | null }>();

  if (error) {
    console.error("Error getting SRS Google Docs URL:", error);
    throw new Error(error.message);
  }

  return data?.srs_docs || null;
}

export async function setSrsGoogleDocsUrl(
  teamId: string,
  googleDocsUrl: string,
): Promise<void> {
  const { error } = await supabase
    .from("teams")
    // @ts-expect-error - srs_docs column exists in database but not in generated types
    .update({ srs_docs: googleDocsUrl })
    .eq("id", teamId);

  if (error) {
    console.error("Error setting SRS Google Docs URL:", error);
    throw new Error(error.message);
  }
}

export async function copyRequirementsToGoogleDocs(
  teamId: string,
  googleDocsUrl?: string,
): Promise<{ googleDocsUrl: string; isNewUrl: boolean }> {
  let existingUrl = await getRequirementsGoogleDocsUrl(teamId);

  if (!existingUrl && !googleDocsUrl) {
    throw new Error(
      "Google Docs URL diperlukan untuk pertama kali. Silakan berikan URL Google Docs.",
    );
  }

  let finalUrl: string;
  let isNewUrl = false;

  if (!existingUrl && googleDocsUrl) {
    await setRequirementsGoogleDocsUrl(teamId, googleDocsUrl);
    finalUrl = googleDocsUrl;
    isNewUrl = true;
  } else if (existingUrl) {
    finalUrl = existingUrl;
    isNewUrl = false;
  } else {
    throw new Error("Tidak dapat menentukan Google Docs URL");
  }

  console.log(`[Requirements] Copying to Google Docs: ${finalUrl}`);

  return { googleDocsUrl: finalUrl, isNewUrl };
}

export async function copySrsToGoogleDocs(
  teamId: string,
  googleDocsUrl?: string,
): Promise<{ googleDocsUrl: string; isNewUrl: boolean }> {
  let existingUrl = await getSrsGoogleDocsUrl(teamId);

  if (!existingUrl && !googleDocsUrl) {
    throw new Error(
      "Google Docs URL diperlukan untuk pertama kali. Silakan berikan URL Google Docs.",
    );
  }

  let finalUrl: string;
  let isNewUrl = false;

  if (!existingUrl && googleDocsUrl) {
    await setSrsGoogleDocsUrl(teamId, googleDocsUrl);
    finalUrl = googleDocsUrl;
    isNewUrl = true;
  } else if (existingUrl) {
    finalUrl = existingUrl;
    isNewUrl = false;
  } else {
    throw new Error("Tidak dapat menentukan Google Docs URL");
  }

  console.log(`[SRS] Copying to Google Docs: ${finalUrl}`);

  return { googleDocsUrl: finalUrl, isNewUrl };
}
