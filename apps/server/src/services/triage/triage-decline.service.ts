import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";

export async function declineIssue(id: string, reason?: string) {
  if (!id) {
    throw errors.badRequest("id issue tidak valid");
  }

  // Update issues table (core data only)
  const { data, error } = (await supabase
    .from("issues")
    // @ts-ignore - Supabase type inference issue
    .update({
      is_triaged: true,
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle()) as any;

  if (error) {
    console.error("❌ triageService.declineIssue query error:", {
      issueId: id,
      error,
    });
    throw errors.internal(`Gagal menolak issue: ${error.message}`);
  }

  if (!data) {
    throw errors.notFound("Issue tidak ditemukan");
  }

  // Save decline reason to issue_triage table
  if (reason) {
    const { error: triageError } = await supabase.from("issue_triage").upsert(
      {
        issue_id: id,
        reason: reason,
        triage_reason: "declined",
        triaged_at: new Date().toISOString(),
      } as any,
      { onConflict: "issue_id" },
    );

    if (triageError) {
      console.error("❌ Failed to save decline reason:", triageError);
      // Don't throw - triage metadata is optional
    }
  }

  return data;
}
