import { supabase } from "../../lib/supabase";
import { listRequirements } from "../requirements/requirements-query.service";
import type { SrsDocument } from "../../types/services/srs/srs";

export type { SrsDocument };

function mapSrs(row: any): SrsDocument {
  return {
    id: row.id,
    teamId: row.team_id,
    version: row.version,
    purpose: row.purpose,
    scope: row.scope,
    glossary: row.glossary ?? [],
    productPerspective: row.product_perspective,
    productFunctions: row.product_functions,
    userCharacteristics: row.user_characteristics ?? [],
    generalConstraints: row.general_constraints,
    uiRequirements: row.ui_requirements,
    hardwareInterface: row.hardware_interface,
    softwareInterface: row.software_interface,
    commInterface: row.comm_interface,
    createdById: row.created_by_id,
    updatedById: row.updated_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    googleDocsUrl: row.google_docs_url,
  };
}

// Ambil SRS + FR + NFR sekaligus — untuk render halaman SRS
export async function getSrsWithRequirements(teamId: string) {
  const { data: srs, error } = await supabase
    .from("srs_documents")
    .select("*")
    .eq("team_id", teamId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const [frList, nfrList] = await Promise.all([
    listRequirements(teamId, "FR"),
    listRequirements(teamId, "NFR"),
  ]);

  return {
    srs: srs ? mapSrs(srs) : null,
    fr: frList,
    nfr: nfrList,
  };
}

export async function upsertSrs(
  teamId: string,
  userId: string,
  payload: Partial<
    Omit<
      SrsDocument,
      | "id"
      | "teamId"
      | "createdAt"
      | "updatedAt"
      | "createdById"
      | "updatedById"
      | "googleDocsUrl"
    >
  >,
) {
  // Check if SRS already exists
  const { data: existing } = await supabase
    .from("srs_documents")
    .select("id, created_by_id")
    .eq("team_id", teamId)
    .maybeSingle();

  const upsertData: Record<string, unknown> = {
    team_id: teamId,
    updated_by_id: userId,
    updated_at: new Date().toISOString(),
  };

  // Set created_by_id only on first creation
  if (!existing) {
    upsertData.created_by_id = userId;
  }

  if (payload.version !== undefined) upsertData.version = payload.version;
  if (payload.purpose !== undefined) upsertData.purpose = payload.purpose;
  if (payload.scope !== undefined) upsertData.scope = payload.scope;
  if (payload.glossary !== undefined) upsertData.glossary = payload.glossary;
  if (payload.productPerspective !== undefined)
    upsertData.product_perspective = payload.productPerspective;
  if (payload.productFunctions !== undefined)
    upsertData.product_functions = payload.productFunctions;
  if (payload.userCharacteristics !== undefined)
    upsertData.user_characteristics = payload.userCharacteristics;
  if (payload.generalConstraints !== undefined)
    upsertData.general_constraints = payload.generalConstraints;
  if (payload.uiRequirements !== undefined)
    upsertData.ui_requirements = payload.uiRequirements;
  if (payload.hardwareInterface !== undefined)
    upsertData.hardware_interface = payload.hardwareInterface;
  if (payload.softwareInterface !== undefined)
    upsertData.software_interface = payload.softwareInterface;
  if (payload.commInterface !== undefined)
    upsertData.comm_interface = payload.commInterface;

  const srsQuery = supabase.from("srs_documents") as any;
  const { data, error } = await srsQuery
    .upsert(upsertData as any, { onConflict: "team_id" })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSrs(data) : null;
}
