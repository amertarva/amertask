import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";
import type {
  CreateTeamPayload,
  UpdateTeamSettingsPayload,
  Team,
} from "./teams-types";

export async function createTeam(
  userId: string,
  payload: CreateTeamPayload,
): Promise<Team> {
  // Check slug uniqueness
  // @ts-ignore - Supabase type inference issue
  const { data: existing } = await supabase
    .from("teams")
    .select("id")
    .ilike("slug", payload.slug)
    .maybeSingle<{ id: string }>();

  if (existing) {
    throw errors.conflict("Slug tim sudah digunakan");
  }

  // Create team
  const { data: team, error: teamError } = (await supabase
    .from("teams")
    // @ts-ignore - Supabase type inference issue
    .insert({
      slug: payload.slug.toUpperCase(),
      name: payload.name,
      type: payload.type || "tugas",
      owner_id: userId,
    })
    .select()
    .single()) as any;

  if (teamError) {
    throw errors.internal("Gagal membuat tim");
  }

  // Add creator as PM (Project Manager)
  // @ts-ignore - Supabase type inference issue
  const { error: memberError } = (await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: userId,
    role: "pm", // Changed from 'owner' to 'pm'
  })) as any;

  if (memberError) {
    // Rollback team creation
    await supabase.from("teams").delete().eq("id", team.id);
    throw errors.internal("Gagal menambahkan member");
  }

  return team;
}

export async function updateTeamSettings(
  teamId: string,
  updates: UpdateTeamSettingsPayload,
): Promise<Team> {
  // Filter allowed fields for security
  const allowedFields = [
    "name",
    "type",
    "start_date",
    "end_date",
    "company",
    "work_area",
    "description",
    "github_repo",
    "google_docs_url",
    "separate_docs_enabled",
    "backlog_docs",
    "planning_docs",
    "execution_docs",
    "r_docs",
    "srs_docs",
  ];

  const filteredUpdates = Object.keys(updates)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updates[key as keyof UpdateTeamSettingsPayload];
      return obj;
    }, {} as any);

  const { data, error } = (await supabase
    .from("teams")
    // @ts-ignore - Supabase type inference issue
    .update({
      ...filteredUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamId)
    .select()
    .single()) as any;

  if (error) {
    throw errors.internal("Gagal update pengaturan tim");
  }

  return data;
}

export async function deleteTeam(teamId: string): Promise<{
  id: string;
  slug: string;
  name: string;
}> {
  // @ts-ignore - Supabase type inference issue
  const { data: existingTeam, error: lookupError } = await supabase
    .from("teams")
    .select("id, slug, name")
    .eq("id", teamId)
    .maybeSingle<{ id: string; slug: string; name: string }>();

  if (lookupError) {
    throw errors.internal(`Gagal memeriksa proyek: ${lookupError.message}`);
  }

  if (!existingTeam) {
    throw errors.notFound("Proyek tidak ditemukan");
  }

  const { error: issuesError } = await supabase
    .from("issues")
    .delete()
    .eq("team_id", teamId);

  if (issuesError) {
    throw errors.internal(
      `Gagal menghapus issue proyek: ${issuesError.message}`,
    );
  }

  const { error: membersError } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId);

  if (membersError) {
    throw errors.internal(
      `Gagal menghapus anggota proyek: ${membersError.message}`,
    );
  }

  const { error: teamDeleteError } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (teamDeleteError) {
    throw errors.internal(
      `Gagal menghapus data proyek: ${teamDeleteError.message}`,
    );
  }

  return existingTeam;
}
