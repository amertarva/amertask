import { supabase } from "../lib/supabase";
import { errors } from "../lib/errors";

export const analyticsService = {
  async getTeamAnalytics(teamId: string, from?: string, to?: string) {
    if (!teamId) {
      throw errors.badRequest("teamId tidak valid");
    }

    const fromDate =
      from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = to || new Date().toISOString();

    // Get all issues in date range
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
      console.error("❌ analyticsService.getTeamAnalytics query error:", {
        teamId,
        fromDate,
        toDate,
        error,
      });
      throw errors.internal(`Gagal mengambil data analytics: ${error.message}`);
    }

    const allIssues = issues || [];

    // Summary
    const summary = {
      totalIssues: allIssues.length,
      openIssues: allIssues.filter((i) =>
        ["backlog", "todo", "bug"].includes(i.status),
      ).length,
      inProgress: allIssues.filter((i) => i.status === "in_progress").length,
      completed: allIssues.filter((i) => i.status === "done").length,
      cancelled: allIssues.filter((i) => i.status === "cancelled").length,
    };

    // By status
    const byStatus = [
      {
        status: "backlog",
        count: allIssues.filter((i) => i.status === "backlog").length,
      },
      {
        status: "todo",
        count: allIssues.filter((i) => i.status === "todo").length,
      },
      {
        status: "in_progress",
        count: allIssues.filter((i) => i.status === "in_progress").length,
      },
      {
        status: "in_review",
        count: allIssues.filter((i) => i.status === "in_review").length,
      },
      {
        status: "bug",
        count: allIssues.filter((i) => i.status === "bug").length,
      },
      {
        status: "done",
        count: allIssues.filter((i) => i.status === "done").length,
      },
      {
        status: "cancelled",
        count: allIssues.filter((i) => i.status === "cancelled").length,
      },
    ];

    // By priority
    const byPriority = [
      {
        priority: "urgent",
        count: allIssues.filter((i) => i.priority === "urgent").length,
      },
      {
        priority: "high",
        count: allIssues.filter((i) => i.priority === "high").length,
      },
      {
        priority: "medium",
        count: allIssues.filter((i) => i.priority === "medium").length,
      },
      {
        priority: "low",
        count: allIssues.filter((i) => i.priority === "low").length,
      },
    ];

    // By assignee
    const assigneeMap = new Map();
    allIssues.forEach((issue) => {
      if (issue.assignee) {
        const assignee = issue.assignee as any;
        const key = assignee.id;
        if (!assigneeMap.has(key)) {
          assigneeMap.set(key, {
            userId: assignee.id,
            name: assignee.name,
            avatar: assignee.avatar,
            initials: assignee.initials,
            count: 0,
          });
        }
        assigneeMap.get(key).count++;
      }
    });
    const byAssignee = Array.from(assigneeMap.values());

    // Completion trend (simplified - group by date)
    const completionMap = new Map();
    allIssues.forEach((issue) => {
      if (!issue.created_at || typeof issue.created_at !== "string") {
        return;
      }

      const date = issue.created_at.split("T")[0];
      if (!completionMap.has(date)) {
        completionMap.set(date, { date, created: 0, completed: 0 });
      }
      completionMap.get(date).created++;
      if (issue.status === "done") {
        completionMap.get(date).completed++;
      }
    });
    const completionTrend = Array.from(completionMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      summary,
      byStatus,
      byPriority,
      byAssignee,
      completionTrend,
    };
  },
};
