import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";
import {
  resolveCandidateUserIds,
  resolveExistingUserId,
} from "../../lib/userIdentity";

export async function removeTeamMember(params: {
  teamId: string;
  requesterRole: string;
  requesterUserId: string;
  requesterEmail?: string;
  memberUserId: string;
}): Promise<{
  removed: boolean;
  teamId: string;
  member: {
    id: string;
    role: string;
    name: string | null;
    email: string | null;
  };
}> {
  const requesterRole = String(params.requesterRole || "").toLowerCase();
  if (!["owner", "admin", "pm"].includes(requesterRole)) {
    throw errors.forbidden(
      "Hanya owner/admin/pm yang dapat mengeluarkan anggota",
    );
  }

  const memberUserId = String(params.memberUserId || "").trim();
  if (!memberUserId) {
    throw errors.badRequest("Member yang akan dikeluarkan tidak valid");
  }

  // @ts-ignore - Supabase type inference issue
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, owner_id")
    .eq("id", params.teamId)
    .maybeSingle<{ id: string; owner_id: string }>();

  if (teamError) {
    throw errors.internal(`Gagal memeriksa tim: ${teamError.message}`);
  }

  if (!team) {
    throw errors.notFound("Tim tidak ditemukan");
  }

  if (team.owner_id === memberUserId) {
    throw errors.forbidden("Owner tim tidak dapat dikeluarkan");
  }

  const canonicalRequesterId = await resolveExistingUserId(
    params.requesterUserId,
    params.requesterEmail,
  );
  const requesterCandidateIds = await resolveCandidateUserIds(
    canonicalRequesterId,
    params.requesterEmail,
  );

  if (!requesterCandidateIds.includes(canonicalRequesterId)) {
    requesterCandidateIds.push(canonicalRequesterId);
  }

  if (requesterCandidateIds.includes(memberUserId)) {
    throw errors.badRequest("Gunakan fitur keluar dari tim untuk akun sendiri");
  }

  // @ts-ignore - Supabase type inference issue
  const { data: targetMembership, error: targetMembershipError } =
    await supabase
      .from("team_members")
      .select(
        `
        user_id,
        role,
        user:users(id, name, email)
      `,
      )
      .eq("team_id", params.teamId)
      .eq("user_id", memberUserId)
      .maybeSingle<{
        user_id: string;
        role: string;
        user: { id: string; name: string; email: string };
      }>();

  if (targetMembershipError) {
    throw errors.internal(
      `Gagal memeriksa member target: ${targetMembershipError.message}`,
    );
  }

  if (!targetMembership) {
    throw errors.notFound("Anggota tim tidak ditemukan");
  }

  const targetRole = String(targetMembership.role || "member").toLowerCase();

  if (requesterRole !== "owner" && targetRole !== "member") {
    throw errors.forbidden("Hanya owner yang dapat mengeluarkan admin/pm");
  }

  const { error: removeError } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", params.teamId)
    .eq("user_id", memberUserId);

  if (removeError) {
    throw errors.internal(`Gagal mengeluarkan anggota: ${removeError.message}`);
  }

  const targetUser = (targetMembership as any).user;

  return {
    removed: true,
    teamId: params.teamId,
    member: {
      id: memberUserId,
      role: targetMembership.role || "member",
      name: targetUser?.name || null,
      email: targetUser?.email || null,
    },
  };
}

export async function leaveTeam(params: {
  teamId: string;
  userRole: string;
  userId: string;
  email?: string;
}): Promise<{
  left: boolean;
  teamId: string;
  userId: string;
  removedMemberships: number;
}> {
  const userRole = String(params.userRole || "").toLowerCase();
  if (userRole === "owner") {
    throw errors.forbidden(
      "Owner tim tidak dapat keluar. Alihkan owner terlebih dahulu.",
    );
  }

  const canonicalUserId = await resolveExistingUserId(
    params.userId,
    params.email,
  );
  const candidateUserIds = await resolveCandidateUserIds(
    canonicalUserId,
    params.email,
  );

  if (!candidateUserIds.includes(canonicalUserId)) {
    candidateUserIds.push(canonicalUserId);
  }

  // @ts-ignore - Supabase type inference issue
  const { data: memberships, error: membershipError } = await supabase
    .from("team_members")
    .select("user_id, role")
    .eq("team_id", params.teamId)
    .in("user_id", candidateUserIds);

  if (membershipError) {
    throw errors.internal(
      `Gagal memeriksa membership untuk keluar tim: ${membershipError.message}`,
    );
  }

  if (!memberships || memberships.length === 0) {
    throw errors.notFound("Anda bukan anggota tim ini");
  }

  const { error: leaveError } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", params.teamId)
    .in("user_id", candidateUserIds);

  if (leaveError) {
    throw errors.internal(`Gagal keluar dari tim: ${leaveError.message}`);
  }

  return {
    left: true,
    teamId: params.teamId,
    userId: canonicalUserId,
    removedMemberships: memberships.length,
  };
}
