import { supabase } from "../lib/supabase";
import { errors } from "../lib/errors";
import {
  calcSummary,
  calcByStatus,
  calcByPriority,
} from "./analytics/analytics-summary.service";
import { calcByAssignee } from "./analytics/analytics-breakdown.service";
import { calcCompletionTrend } from "./analytics/analytics-trend.service";

export async function getTeamAnalytics(
  teamId: string,
  from?: string,
  to?: string,
) {
  if (!teamId) {
    throw errors.badRequest("teamId tidak valid");
  }

  const fromDate =
    from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const toDate = to || new Date().toISOString();

  const { data: issues, error } = await supabase
    .from("issues")
    .select(
      `
      *,
      assignee:users!issues_assignee_id_fkey(id, name, avatar, initials)
    `,
    )
    .eq("team_id", teamId)
    .gte("created_at", fromDate)
    .lte("created_at", toDate);

  if (error) {
    console.error("analyticsService.getTeamAnalytics query error:", {
      teamId,
      fromDate,
      toDate,
      error,
    });
    throw errors.internal(`Gagal mengambil data analytics: ${error.message}`);
  }

  const allIssues = (issues || []) as any[];

  return {
    summary: calcSummary(allIssues),
    byStatus: calcByStatus(allIssues),
    byPriority: calcByPriority(allIssues),
    byAssignee: calcByAssignee(allIssues),
    completionTrend: calcCompletionTrend(allIssues),
  };
}

export const analyticsService = {
  getTeamAnalytics,
};
