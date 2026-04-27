import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";

export interface IssueListParams {
  status?: string;
  priority?: string;
  labels?: string;
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

const ISSUE_SELECT = `
  *,
  assignee:users!issues_assignee_id_fkey(id, name, avatar, initials),
  created_by:users!issues_created_by_id_fkey(id, name, avatar, initials),
  triage:issue_triage(id, reason, triage_reason, triaged_by_id, triaged_at)
`;

export async function getTeamIdFromSlug(
  teamSlug: string,
): Promise<string | null> {
  // @ts-ignore - Supabase type inference issue
  const { data } = await supabase
    .from("teams")
    .select("id")
    .ilike("slug", teamSlug)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export async function listIssues(teamId: string, params: IssueListParams) {
  let query = supabase
    .from("issues")
    .select(ISSUE_SELECT, { count: "exact" })
    .eq("team_id", teamId)
    .eq("is_triaged", true);

  // Filters
  if (params.status) {
    const statuses = params.status
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length) query = query.in("status", statuses);
  }
  if (params.priority) {
    const priorities = params.priority
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (priorities.length) query = query.in("priority", priorities);
  }
  if (params.search) query = query.ilike("title", `%${params.search}%`);
  if (params.assigneeId) query = query.eq("assignee_id", params.assigneeId);
  if (params.labels) {
    const labelArray = params.labels
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);
    if (labelArray.length > 0) {
      query = query.contains("labels", labelArray);
    }
  }

  // Sorting
  const sortBy = params.sortBy ?? "created_at";
  const ascending = params.sortDir === "asc";
  query = query.order(sortBy, { ascending });

  // Pagination
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, params.limit ?? 20);
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;
  if (error)
    throw errors.internal(`Gagal mengambil daftar issues: ${error.message}`);

  // Fetch planning data manually for issues that have planning
  if (data && data.length > 0) {
    const issueIds = (data as any[]).map((issue) => issue.id);
    const { data: planningData } = await supabase
      .from("issue_planning")
      .select(
        "id, issue_id, start_date, due_date, estimated_hours, actual_hours, plan_info, completed_at, status",
      )
      .in("issue_id", issueIds)
      .not("issue_id", "is", null);

    // Map planning data to issues
    const planningMap = new Map(
      (planningData as any[])?.map((p) => [p.issue_id, p]) ?? [],
    );

    data.forEach((issue: any) => {
      issue.planning = planningMap.get(issue.id) || null;
    });
  }

  return {
    issues: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
}

export async function getIssueById(id: string) {
  const { data, error } = await supabase
    .from("issues")
    .select(ISSUE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw errors.internal(error.message);
  if (!data) throw errors.notFound("Issue tidak ditemukan");

  // Fetch planning data manually if exists
  const { data: planningData } = await supabase
    .from("issue_planning")
    .select(
      "id, issue_id, start_date, due_date, estimated_hours, actual_hours, plan_info, completed_at, status",
    )
    .eq("issue_id", id)
    .maybeSingle();

  (data as any).planning = planningData || null;

  return data;
}
