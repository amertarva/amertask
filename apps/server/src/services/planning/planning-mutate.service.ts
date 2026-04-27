import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";

export interface CreatePlanningPayload {
  teamId: string;
  title: string;
  description?: string;
  priority?: string;
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  planInfo?: string;
}

export interface UpdatePlanningPayload {
  title?: string;
  description?: string;
  priority?: string;
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  planInfo?: string;
  status?: "planned" | "in_execution" | "completed" | "cancelled";
}

/**
 * Create standalone planning (belum masuk issues table)
 */
export async function createPlanning(payload: CreatePlanningPayload) {
  // Get next planning number for team
  const { data: numberData, error: numberError } = await supabase.rpc(
    "get_next_planning_number",
    { p_team_id: payload.teamId } as any,
  );

  if (numberError) {
    throw errors.internal(
      `Gagal generate planning number: ${numberError.message}`,
    );
  }

  const planningNumber = numberData as number;

  // Insert planning
  const { data, error } = await supabase
    .from("issue_planning")
    .insert({
      team_id: payload.teamId,
      number: planningNumber,
      title: payload.title,
      description: payload.description || null,
      priority: payload.priority || "medium",
      assignee_id: payload.assigneeId || null,
      start_date: payload.startDate || null,
      due_date: payload.dueDate || null,
      estimated_hours: payload.estimatedHours || 0,
      plan_info: payload.planInfo || null,
      status: "planned",
      issue_id: null, // Belum linked ke issues
    } as any)
    .select(
      `
      *,
      assignee:users!issue_planning_assignee_id_fkey(id, name, avatar, initials)
    `,
    )
    .single();

  if (error) {
    console.error("❌ createPlanning error:", error);
    throw errors.internal(`Gagal membuat planning: ${error.message}`);
  }

  return data;
}

/**
 * Update planning (hanya bisa update kalau status = 'planned')
 */
export async function updatePlanning(
  planningId: string,
  payload: UpdatePlanningPayload,
) {
  // Check planning exists and not in execution
  const { data: existing, error: checkError } = await supabase
    .from("issue_planning")
    .select("id, status, issue_id")
    .eq("id", planningId)
    .maybeSingle();

  if (checkError) {
    throw errors.internal(`Gagal check planning: ${checkError.message}`);
  }

  if (!existing) {
    throw errors.notFound("Planning tidak ditemukan");
  }

  const existingData = existing as any;
  if (existingData.status !== "planned" && existingData.issue_id !== null) {
    throw errors.badRequest(
      "Planning sudah dalam eksekusi, tidak bisa diubah. Edit dari Execution page.",
    );
  }

  // Update planning
  const updateQuery = supabase.from("issue_planning") as any;
  const { data, error } = await updateQuery
    .update({
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      assignee_id: payload.assigneeId,
      start_date: payload.startDate,
      due_date: payload.dueDate,
      estimated_hours: payload.estimatedHours,
      plan_info: payload.planInfo,
      status: payload.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planningId)
    .select(
      `
      *,
      assignee:users!issue_planning_assignee_id_fkey(id, name, avatar, initials)
    `,
    )
    .single();

  if (error) {
    console.error("❌ updatePlanning error:", error);
    throw errors.internal(`Gagal update planning: ${error.message}`);
  }

  return data;
}

/**
 * Delete planning (hanya bisa delete kalau status = 'planned')
 */
export async function deletePlanning(planningId: string) {
  // Check planning exists and not in execution
  const { data: existing, error: checkError } = await supabase
    .from("issue_planning")
    .select("id, status, issue_id")
    .eq("id", planningId)
    .maybeSingle();

  if (checkError) {
    throw errors.internal(`Gagal check planning: ${checkError.message}`);
  }

  if (!existing) {
    throw errors.notFound("Planning tidak ditemukan");
  }

  const existingData = existing as any;
  if (existingData.status !== "planned" && existingData.issue_id !== null) {
    throw errors.badRequest(
      "Planning sudah dalam eksekusi, tidak bisa dihapus. Hapus dari Execution page.",
    );
  }

  // Delete planning
  const { error } = await supabase
    .from("issue_planning")
    .delete()
    .eq("id", planningId);

  if (error) {
    console.error("❌ deletePlanning error:", error);
    throw errors.internal(`Gagal hapus planning: ${error.message}`);
  }
}

/**
 * Promote planning to execution (create issue + link)
 */
export async function promotePlanningToExecution(
  planningId: string,
  userId: string,
) {
  const { data: issueId, error } = await supabase.rpc(
    "promote_planning_to_execution",
    {
      p_planning_id: planningId,
      p_user_id: userId,
    } as any,
  );

  if (error) {
    console.error("❌ promotePlanningToExecution error:", error);
    throw errors.internal(
      `Gagal promote planning ke execution: ${error.message}`,
    );
  }

  // Get created issue
  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .select(
      `
      *,
      assignee:users!issues_assignee_id_fkey(id, name, avatar, initials),
      created_by:users!issues_created_by_id_fkey(id, name, avatar, initials)
    `,
    )
    .eq("id", issueId)
    .single();

  if (issueError) {
    throw errors.internal(`Gagal get issue: ${issueError.message}`);
  }

  // Get planning data manually
  const { data: planningData } = await supabase
    .from("issue_planning")
    .select("*")
    .eq("issue_id", issueId)
    .maybeSingle();

  (issue as any).planning = planningData || null;

  return issue;
}
