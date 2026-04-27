import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";

export interface PlanningListParams {
  status?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/**
 * List all plannings for a team
 *
 * Menampilkan SEMUA planning dari tabel issue_planning, termasuk:
 * - status: 'planned' - Planning yang belum dipromote
 * - status: 'in_execution' - Planning yang sudah dipromote ke execution
 * - status: 'completed' - Planning yang sudah selesai
 * - status: 'cancelled' - Planning yang dibatalkan
 *
 * Gunakan parameter status untuk filter spesifik jika diperlukan.
 * Jika tidak ada filter, tampilkan semua untuk keperluan laporan.
 */
export async function listPlannings(
  teamId: string,
  params: PlanningListParams,
) {
  let query = supabase
    .from("issue_planning")
    .select(
      `
      *,
      assignee:users!issue_planning_assignee_id_fkey(id, name, avatar, initials)
    `,
      { count: "exact" },
    )
    .eq("team_id", teamId);

  // Filter by status (optional)
  if (params.status) {
    const statuses = params.status
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length) query = query.in("status", statuses);
  }
  // Jika tidak ada filter status, tampilkan semua (untuk laporan)

  // Filters
  if (params.priority) {
    const priorities = params.priority
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (priorities.length) query = query.in("priority", priorities);
  }
  if (params.search) query = query.ilike("title", `%${params.search}%`);
  if (params.assigneeId) query = query.eq("assignee_id", params.assigneeId);

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
    throw errors.internal(`Gagal mengambil daftar planning: ${error.message}`);

  return {
    plannings: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
}

/**
 * Get single planning by ID
 */
export async function getPlanningById(planningId: string) {
  const { data, error } = await supabase
    .from("issue_planning")
    .select(
      `
      *,
      assignee:users!issue_planning_assignee_id_fkey(id, name, avatar, initials),
      issue:issues(id, number, status)
    `,
    )
    .eq("id", planningId)
    .maybeSingle();

  if (error) throw errors.internal(error.message);
  if (!data) throw errors.notFound("Planning tidak ditemukan");

  return data;
}

/**
 * Get planning by team and number
 */
export async function getPlanningByNumber(teamId: string, number: number) {
  const { data, error } = await supabase
    .from("issue_planning")
    .select(
      `
      *,
      assignee:users!issue_planning_assignee_id_fkey(id, name, avatar, initials),
      issue:issues(id, number, status)
    `,
    )
    .eq("team_id", teamId)
    .eq("number", number)
    .maybeSingle();

  if (error) throw errors.internal(error.message);
  if (!data) throw errors.notFound("Planning tidak ditemukan");

  return data;
}
