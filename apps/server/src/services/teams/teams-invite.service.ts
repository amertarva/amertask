import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";
import { signJWT, verifyJWT } from "../../lib/jwt";
import {
  resolveCandidateUserIds,
  resolveExistingUserId,
} from "../../lib/userIdentity";
import type { JWTPayload } from "../../types";
import type { TeamInviteRole, TeamInviteData } from "./teams-types";
import {
  TEAM_INVITE_TYPE,
  getFrontendBaseUrl,
  isTeamInviteRole,
  normalizeInviteExpiryHours,
  getInviteTeam,
  isDuplicateMembershipError,
} from "./teams-utils";

async function parseTeamInviteToken(token: string): Promise<TeamInviteData> {
  if (!token?.trim()) {
    throw errors.badRequest("Token undangan tidak valid");
  }

  let payload: JWTPayload;
  try {
    payload = await verifyJWT(token.trim());
  } catch {
    throw errors.badRequest("Link undangan tidak valid atau sudah kedaluwarsa");
  }

  if (payload.type !== TEAM_INVITE_TYPE) {
    throw errors.badRequest("Tipe link undangan tidak dikenali");
  }

  if (
    !payload.teamId ||
    !payload.teamSlug ||
    !payload.teamName ||
    !payload.role
  ) {
    throw errors.badRequest("Isi link undangan tidak lengkap");
  }

  if (!isTeamInviteRole(payload.role)) {
    throw errors.badRequest("Role undangan tidak valid");
  }

  return {
    teamId: payload.teamId,
    teamSlug: payload.teamSlug,
    teamName: payload.teamName,
    role: payload.role,
    expiresAt:
      typeof payload.exp === "number"
        ? new Date(payload.exp * 1000).toISOString()
        : null,
  };
}

export async function createTeamInviteLink(params: {
  teamId: string;
  inviterId: string;
  inviterEmail: string;
  inviterName?: string;
  role?: TeamInviteRole;
  expiresInHours?: number;
}): Promise<{
  inviteToken: string;
  inviteUrl: string;
  role: TeamInviteRole;
  expiresAt: string;
  team: {
    id: string;
    slug: string;
    name: string;
  };
}> {
  const team = await getInviteTeam(params.teamId);

  const inviteRole =
    params.role && isTeamInviteRole(params.role) ? params.role : "member";

  const expiresInHours = normalizeInviteExpiryHours(params.expiresInHours);
  const inviteToken = await signJWT(
    {
      sub: params.inviterId,
      email: params.inviterEmail,
      name: params.inviterName || "Team Inviter",
      type: TEAM_INVITE_TYPE,
      teamId: team.id,
      teamSlug: team.slug,
      teamName: team.name,
      role: inviteRole,
      invitedBy: params.inviterId,
    },
    `${expiresInHours}h`,
  );

  const expiresAt = new Date(
    Date.now() + expiresInHours * 60 * 60 * 1000,
  ).toISOString();

  return {
    inviteToken,
    inviteUrl: `${getFrontendBaseUrl()}/join/${encodeURIComponent(team.slug)}?invite=${encodeURIComponent(inviteToken)}`,
    role: inviteRole,
    expiresAt,
    team: {
      id: team.id,
      slug: team.slug,
      name: team.name,
    },
  };
}

export async function previewTeamInvite(
  token: string,
  userId: string,
  email?: string,
): Promise<{
  team: {
    id: string;
    slug: string;
    name: string;
  };
  role: TeamInviteRole;
  expiresAt: string | null;
  alreadyMember: boolean;
  existingRole: string | null;
}> {
  const invite = await parseTeamInviteToken(token);
  const team = await getInviteTeam(invite.teamId, invite.teamSlug);

  const candidateUserIds = await resolveCandidateUserIds(userId, email);
  // @ts-ignore - Supabase type inference issue
  const { data: memberships, error: memberError } = await supabase
    .from("team_members")
    .select("user_id, role")
    .eq("team_id", team.id)
    .in("user_id", candidateUserIds)
    .limit(1);

  if (memberError) {
    throw errors.internal(
      `Gagal memeriksa status member: ${memberError.message}`,
    );
  }

  // @ts-ignore - Supabase type inference issue
  const existingMembership = memberships?.[0];

  return {
    team: {
      id: team.id,
      slug: team.slug,
      name: team.name,
    },
    role: invite.role,
    expiresAt: invite.expiresAt,
    alreadyMember: Boolean(existingMembership),
    // @ts-ignore - Supabase type inference issue
    existingRole: existingMembership?.role || null,
  };
}

export async function acceptTeamInvite(
  token: string,
  userId: string,
  email?: string,
): Promise<{
  joined: boolean;
  alreadyMember: boolean;
  membershipRole: TeamInviteRole;
  team: {
    id: string;
    slug: string;
    name: string;
  };
}> {
  const invite = await parseTeamInviteToken(token);
  const team = await getInviteTeam(invite.teamId, invite.teamSlug);

  const canonicalUserId = await resolveExistingUserId(userId, email);
  const candidateUserIds = await resolveCandidateUserIds(
    canonicalUserId,
    email,
  );

  if (!candidateUserIds.includes(canonicalUserId)) {
    candidateUserIds.push(canonicalUserId);
  }

  // @ts-ignore - Supabase type inference issue
  const { data: existingMemberships, error: existingError } = await supabase
    .from("team_members")
    .select("user_id, role")
    .eq("team_id", team.id)
    .in("user_id", candidateUserIds)
    .limit(1);

  if (existingError) {
    throw errors.internal(
      `Gagal memeriksa membership sebelum bergabung: ${existingError.message}`,
    );
  }

  // @ts-ignore - Supabase type inference issue
  const existingMembership = existingMemberships?.[0];
  if (existingMembership) {
    return {
      joined: false,
      alreadyMember: true,
      // @ts-ignore - Supabase type inference issue
      membershipRole: existingMembership.role || "member",
      team: {
        id: team.id,
        slug: team.slug,
        name: team.name,
      },
    };
  }

  // @ts-ignore - Supabase type inference issue
  const { error: insertError } = (await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: canonicalUserId,
    role: invite.role,
  })) as any;

  if (insertError) {
    if (isDuplicateMembershipError(insertError.message)) {
      return {
        joined: false,
        alreadyMember: true,
        membershipRole: invite.role,
        team: {
          id: team.id,
          slug: team.slug,
          name: team.name,
        },
      };
    }

    throw errors.internal(
      `Gagal menerima undangan tim: ${insertError.message}`,
    );
  }

  return {
    joined: true,
    alreadyMember: false,
    membershipRole: invite.role,
    team: {
      id: team.id,
      slug: team.slug,
      name: team.name,
    },
  };
}

export async function rejectTeamInvite(token: string): Promise<{
  rejected: boolean;
  message: string;
  team: {
    slug: string;
    name: string;
  };
}> {
  const invite = await parseTeamInviteToken(token);

  return {
    rejected: true,
    message: "Undangan tim ditolak",
    team: {
      slug: invite.teamSlug,
      name: invite.teamName,
    },
  };
}
