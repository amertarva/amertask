import { supabase } from "../../lib/supabase";

export interface Requirement {
  id: string;
  teamId: string;
  issueId: string | null;
  type: "FR" | "NFR";
  code: string;
  description: string;
  priority: "MUST" | "SHOULD" | "COULD" | "WONT";
  nfrCategory: string | null;
  acceptanceCriteria: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined
  issue?: { number: number; title: string } | null;
  createdBy?: { name: string; initials: string } | null;
}

const REQ_SELECT = `
  *,
  issue:issues(number, title)
`;

function mapRow(row: any): Requirement {
  return {
    id: row.id,
    teamId: row.team_id,
    issueId: row.issue_id,
    type: row.type,
    code: row.code,
    description: row.description,
    priority: row.priority,
    nfrCategory: row.nfr_category,
    acceptanceCriteria: row.acceptance_criteria,
    createdById: row.created_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    issue: row.issue,
    createdBy: null, // Remove for now to fix the database error
  };
}

export async function listRequirements(
  teamId: string,
  type?: "FR" | "NFR",
): Promise<Requirement[]> {
  let query = supabase
    .from("requirements")
    .select(REQ_SELECT)
    .eq("team_id", teamId)
    .order("code", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getRequirementById(
  id: string,
): Promise<Requirement | null> {
  const { data, error } = await supabase
    .from("requirements")
    .select(REQ_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export async function getRequirementsByIssue(
  issueId: string,
): Promise<{ fr: Requirement[]; nfr: Requirement[] }> {
  const { data, error } = await supabase
    .from("requirements")
    .select(REQ_SELECT)
    .eq("issue_id", issueId)
    .order("code");
  if (error) throw new Error(error.message);

  const all = (data ?? []).map(mapRow);
  return {
    fr: all.filter((r) => r.type === "FR"),
    nfr: all.filter((r) => r.type === "NFR"),
  };
}
