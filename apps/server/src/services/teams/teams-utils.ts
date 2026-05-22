import { errors } from "../../lib/errors";
import { supabase } from "../../lib/supabase";
import type { TeamInviteRole } from "./teams-types";

export const TEAM_INVITE_TYPE = "team_invite_v1";
export const DEFAULT_INVITE_EXPIRY_HOURS = 72;
export const MAX_INVITE_EXPIRY_HOURS = 24 * 7;

export function getFrontendBaseUrl(): string {
  const frontendUrl = (process.env.FRONTEND_URL ?? "")
    .trim()
    .replace(/\/$/, "");

  if (!frontendUrl) {
    throw errors.internal(
      "FRONTEND_URL belum di-set. Isi environment variable ini untuk membuat link undangan.",
    );
  }

  return frontendUrl;
}

export function isTeamInviteRole(role: string): role is TeamInviteRole {
  return role === "admin" || role === "member" || role === "pm";
}

export function normalizeInviteExpiryHours(hours?: number): number {
  if (!Number.isFinite(hours)) {
    return DEFAULT_INVITE_EXPIRY_HOURS;
  }

  const rounded = Math.floor(hours as number);
  return Math.min(MAX_INVITE_EXPIRY_HOURS, Math.max(1, rounded));
}

export async function getInviteTeam(teamId: string, expectedSlug?: string) {
  // @ts-ignore - Supabase type inference issue
  const { data: team, error } = await supabase
    .from("teams")
    .select("id, slug, name")
    .eq("id", teamId)
    .maybeSingle<{ id: string; slug: string; name: string }>();

  if (error) {
    throw errors.internal(`Gagal mengambil tim undangan: ${error.message}`);
  }

  if (!team) {
    throw errors.notFound("Tim untuk undangan ini sudah tidak tersedia");
  }

  if (
    expectedSlug &&
    String(team.slug || "").toLowerCase() !== expectedSlug.toLowerCase()
  ) {
    throw errors.badRequest("Link undangan tidak valid untuk tim ini");
  }

  return team;
}

export function isDuplicateMembershipError(errorMessage?: string): boolean {
  if (!errorMessage) return false;
  return /duplicate|unique|already exists/i.test(errorMessage);
}
