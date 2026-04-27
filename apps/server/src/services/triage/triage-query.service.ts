import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";

export async function listUntriagedIssues(teamId: string) {
  if (!teamId) {
    throw errors.badRequest("teamId tidak valid");
  }

  const { data, error, count } = await supabase
    .from("issues")
    .select(
      `
      *,
      assignee:users!issues_assignee_id_fkey(id, name, avatar, initials),
      created_by:users!issues_created_by_id_fkey(id, name, avatar, initials),
      triage:issue_triage(id, reason, triage_reason, triaged_by_id, triaged_at)
    `,
      { count: "exact" },
    )
    .eq("team_id", teamId)
    .eq("is_triaged", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ triageService.getTriageIssues query error:", {
      teamId,
      error,
    });
    throw errors.internal(`Gagal mengambil triage issues: ${error.message}`);
  }

  return {
    issues: data || [],
    total: count || 0,
  };
}
