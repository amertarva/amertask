import { supabase } from "../../lib/supabase";

export interface CreateRequirementPayload {
  issueId?: string;
  type: "FR" | "NFR";
  description: string;
  priority?: "MUST" | "SHOULD" | "COULD" | "WONT";
  nfrCategory?: string;
  acceptanceCriteria?: string;
}

export async function createRequirement(
  teamId: string,
  userId: string,
  payload: CreateRequirementPayload,
) {
  // Auto-generate kode via DB function
  const { data: codeData, error: codeErr } = await supabase.rpc(
    "generate_requirement_code",
    {
      p_team_id: teamId,
      p_type: payload.type,
    } as any,
  );
  if (codeErr) throw new Error(codeErr.message);

  const requirementsQuery = supabase.from("requirements") as any;
  const { data, error } = await requirementsQuery
    .insert({
      team_id: teamId,
      issue_id: payload.issueId ?? null,
      type: payload.type,
      code: codeData as string,
      description: payload.description,
      priority: payload.priority ?? "MUST",
      nfr_category: payload.nfrCategory ?? null,
      acceptance_criteria: payload.acceptanceCriteria ?? null,
      created_by_id: userId,
    } as any)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateRequirement(
  id: string,
  payload: Partial<CreateRequirementPayload>,
) {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.description !== undefined)
    update.description = payload.description;
  if (payload.priority !== undefined) update.priority = payload.priority;
  if (payload.nfrCategory !== undefined)
    update.nfr_category = payload.nfrCategory;
  if (payload.acceptanceCriteria !== undefined)
    update.acceptance_criteria = payload.acceptanceCriteria;
  if (payload.issueId !== undefined) update.issue_id = payload.issueId;

  const requirementsQuery = supabase.from("requirements") as any;
  const { data, error } = await requirementsQuery
    .update(update as any)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteRequirement(id: string): Promise<void> {
  const { error } = await supabase.from("requirements").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
