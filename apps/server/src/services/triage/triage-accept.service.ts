import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";

export async function acceptIssue(
  id: string,
  updates?: {
    priority?: string;
    assigneeId?: string;
    labels?: string[];
    reason?: string;
    triageReason?: string;
    triagedById?: string;
  },
) {
  if (!id) {
    throw errors.badRequest("id issue tidak valid");
  }

  // Update issue status
  const { data, error } = (await supabase
    .from("issues")
    // @ts-ignore - Supabase type inference issue
    .update({
      is_triaged: true,
      status: "in_progress",
      ...(updates?.priority && { priority: updates.priority }),
      ...(updates?.assigneeId && { assignee_id: updates.assigneeId }),
      ...(updates?.labels && { labels: updates.labels }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle()) as any;

  if (error) {
    console.error("❌ triageService.acceptIssue query error:", {
      issueId: id,
      updates,
      error,
    });
    throw errors.internal(`Gagal menerima issue: ${error.message}`);
  }

  if (!data) {
    throw errors.notFound("Issue tidak ditemukan");
  }

  // Save triage metadata to issue_triage table
  if (updates?.reason || updates?.triageReason) {
    const { error: triageError } = await supabase.from("issue_triage").upsert(
      {
        issue_id: id,
        reason: updates.reason || null,
        triage_reason: updates.triageReason || null,
        triaged_by_id: updates.triagedById || null,
        triaged_at: new Date().toISOString(),
      } as any,
      { onConflict: "issue_id" },
    );

    if (triageError) {
      console.error("❌ Failed to save triage metadata:", triageError);
      // Don't throw - triage metadata is optional
    }
  }

  return data;
}
