import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";

export interface CreateIssuePayload {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  labels?: string[];
  assigneeId?: string;
  parentIssueId?: string;
  source?: string;
  isTriaged?: boolean;
  // NOTE: reason, triageReason, planInfo moved to separate tables
  // Use issue_triage and issue_planning tables instead
}

function toIssueDbPayload(payload: any) {
  const mappedPayload = {
    title: payload?.title,
    description: payload?.description,
    status: payload?.status,
    priority: payload?.priority,
    labels: payload?.labels,
    assignee_id: payload?.assigneeId ?? payload?.assignee_id,
    parent_issue_id: payload?.parentIssueId ?? payload?.parent_issue_id,
    source: payload?.source,
    is_triaged: payload?.isTriaged ?? payload?.is_triaged,
    // NOTE: reason, triage_reason, plan_info removed - use separate tables
  };

  return Object.fromEntries(
    Object.entries(mappedPayload).filter(([, value]) => value !== undefined),
  );
}

function isUnsupportedBugStatusError(error: any) {
  const message = String(error?.message ?? "").toLowerCase();
  const details = String(error?.details ?? "").toLowerCase();
  const hint = String(error?.hint ?? "").toLowerCase();

  const combined = `${message} ${details} ${hint}`;

  const isEnumError =
    combined.includes("invalid input value") && combined.includes("enum");
  const isCheckConstraintError =
    combined.includes("violates check constraint") ||
    (combined.includes("check constraint") && combined.includes("status"));

  return (isEnumError || isCheckConstraintError) && combined.includes("bug");
}

export async function createIssue(
  teamId: string,
  userId: string,
  payload: CreateIssuePayload,
) {
  // Get next issue number for team
  const { data: lastIssue } = (await supabase
    .from("issues")
    .select("number")
    .eq("team_id", teamId)
    .order("number", { ascending: false })
    .limit(1)
    .single()) as any;

  const nextNumber = (lastIssue?.number || 0) + 1;

  const dbPayload = toIssueDbPayload(payload) as Record<string, any>;

  const insertPayload = {
    ...dbPayload,
    team_id: teamId,
    created_by_id: userId,
    number: nextNumber,
  };

  let { data, error } = (await supabase
    .from("issues")
    // @ts-ignore - Supabase type inference issue
    .insert(insertPayload)
    .select(
      `
      *,
      assignee:users!issues_assignee_id_fkey(*),
      created_by:users!issues_created_by_id_fkey(*)
    `,
    )
    .single()) as any;

  if (
    error &&
    dbPayload.status === "bug" &&
    isUnsupportedBugStatusError(error)
  ) {
    console.warn(
      "[issuesService.create] Status bug belum didukung DB, fallback update tanpa ubah status",
    );

    const fallbackInsertPayload = {
      ...insertPayload,
      is_triaged: false,
    };

    delete (fallbackInsertPayload as Record<string, any>).status;

    ({ data, error } = (await supabase
      .from("issues")
      // @ts-ignore - Supabase type inference issue
      .insert(fallbackInsertPayload)
      .select(
        `
        *,
        assignee:users!issues_assignee_id_fkey(*),
        created_by:users!issues_created_by_id_fkey(*)
      `,
      )
      .single()) as any);
  }

  if (error) {
    console.error("[issuesService.create] query error:", {
      teamId,
      userId,
      payload,
      error,
    });
    throw errors.internal(`Gagal membuat issue: ${error.message}`);
  }

  return data;
}

export async function updateIssue(
  id: string,
  payload: Partial<CreateIssuePayload>,
) {
  const dbPayload = toIssueDbPayload(payload) as Record<string, any>;

  if (dbPayload.status === "bug" && dbPayload.is_triaged === undefined) {
    dbPayload.is_triaged = false;
  }

  const updatePayload = {
    ...dbPayload,
    updated_at: new Date().toISOString(),
  };

  let { data, error } = (await supabase
    .from("issues")
    // @ts-ignore - Supabase type inference issue
    .update(updatePayload)
    .eq("id", id)
    .select(
      `
      *,
      assignee:users!issues_assignee_id_fkey(*),
      created_by:users!issues_created_by_id_fkey(*)
    `,
    )
    .single()) as any;

  if (
    error &&
    dbPayload.status === "bug" &&
    isUnsupportedBugStatusError(error)
  ) {
    console.warn(
      "[issuesService.update] Status bug belum didukung DB, fallback update tanpa ubah status",
    );

    const fallbackUpdatePayload = {
      ...updatePayload,
      is_triaged: false,
    };

    delete (fallbackUpdatePayload as Record<string, any>).status;

    ({ data, error } = (await supabase
      .from("issues")
      // @ts-ignore - Supabase type inference issue
      .update(fallbackUpdatePayload)
      .eq("id", id)
      .select(
        `
        *,
        assignee:users!issues_assignee_id_fkey(*),
        created_by:users!issues_created_by_id_fkey(*)
      `,
      )
      .single()) as any);
  }

  if (error) {
    console.error("[issuesService.update] query error:", {
      issueId: id,
      payload,
      error,
    });
    throw errors.internal(`Gagal update issue: ${error.message}`);
  }

  return data;
}

export async function deleteIssue(id: string): Promise<void> {
  const { error } = await supabase.from("issues").delete().eq("id", id);
  if (error) throw errors.internal("Gagal menghapus issue");
}
