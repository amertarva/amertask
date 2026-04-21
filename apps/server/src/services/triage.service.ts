import { supabase } from "../lib/supabase";
import { errors } from "../lib/errors";

export const triageService = {
  async getTriageIssues(teamId: string) {
    if (!teamId) {
      throw errors.badRequest("teamId tidak valid");
    }

    const { data, error, count } = await supabase
      .from("issues")
      .select(
        `
        *,
        assignee:users!issues_assignee_id_fkey(id, name, avatar, initials),
        created_by:users!issues_created_by_id_fkey(id, name, avatar, initials)
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
  },

  async acceptIssue(
    id: string,
    updates?: { priority?: string; assigneeId?: string; labels?: string[] },
  ) {
    if (!id) {
      throw errors.badRequest("id issue tidak valid");
    }

    const { data, error } = await supabase
      .from("issues")
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
      .maybeSingle();

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

    return data;
  },

  async declineIssue(id: string, reason?: string) {
    if (!id) {
      throw errors.badRequest("id issue tidak valid");
    }

    const { data, error } = await supabase
      .from("issues")
      .update({
        is_triaged: true,
        status: "cancelled",
        reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("❌ triageService.declineIssue query error:", {
        issueId: id,
        reason,
        error,
      });
      throw errors.internal(`Gagal menolak issue: ${error.message}`);
    }

    if (!data) {
      throw errors.notFound("Issue tidak ditemukan");
    }

    return data;
  },
};
