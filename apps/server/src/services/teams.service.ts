import { supabase } from "../lib/supabase";
import { errors } from "../lib/errors";
import { signJWT, verifyJWT } from "../lib/jwt";
import {
  resolveCandidateUserIds,
  resolveExistingUserId,
} from "../lib/userIdentity";
import type { JWTPayload } from "../types";

type TeamInviteRole = "admin" | "member" | "pm";

const TEAM_INVITE_TYPE = "team_invite_v1";
const DEFAULT_INVITE_EXPIRY_HOURS = 72;
const MAX_INVITE_EXPIRY_HOURS = 24 * 7;

function getFrontendBaseUrl(): string {
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

function isTeamInviteRole(role: string): role is TeamInviteRole {
  return role === "admin" || role === "member" || role === "pm";
}

function normalizeInviteExpiryHours(hours?: number): number {
  if (!Number.isFinite(hours)) {
    return DEFAULT_INVITE_EXPIRY_HOURS;
  }

  const rounded = Math.floor(hours as number);
  return Math.min(MAX_INVITE_EXPIRY_HOURS, Math.max(1, rounded));
}

async function parseTeamInviteToken(token: string): Promise<{
  teamId: string;
  teamSlug: string;
  teamName: string;
  role: TeamInviteRole;
  expiresAt: string | null;
}> {
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

async function getInviteTeam(teamId: string, expectedSlug?: string) {
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

function isDuplicateMembershipError(errorMessage?: string): boolean {
  if (!errorMessage) return false;
  return /duplicate|unique|already exists/i.test(errorMessage);
}

export const teamsService = {
  async getUserTeams(userId: string, email?: string) {
    const candidateUserIds = await resolveCandidateUserIds(userId, email);

    console.log("📋 Getting user teams:", {
      userId,
      email,
      candidateUserIds,
    });

    const [membershipsResult, ownedTeamsResult] = await Promise.all([
      // Step 1: Get memberships directly from team_members
      supabase
        .from("team_members")
        .select("team_id, role")
        .in("user_id", candidateUserIds),

      // Step 2: Get teams where user is explicitly owner
      supabase
        .from("teams")
        .select("id, slug, name, avatar, type")
        .in("owner_id", candidateUserIds),
    ]);

    const { data: memberships, error: membershipsError } = membershipsResult;
    const { data: ownedTeams, error: ownedTeamsError } = ownedTeamsResult;

    if (membershipsError) {
      console.error("❌ Error fetching memberships:", membershipsError);
      throw errors.internal(
        `Gagal mengambil daftar membership: ${membershipsError.message}`,
      );
    }

    if (ownedTeamsError) {
      console.error("❌ Error fetching owned teams:", ownedTeamsError);
      throw errors.internal(
        `Gagal mengambil tim owner: ${ownedTeamsError.message}`,
      );
    }

    console.log("✅ Memberships found:", { count: memberships?.length || 0 });
    console.log("✅ Owned teams found:", { count: ownedTeams?.length || 0 });

    // Step 3: Fetch teams by membership IDs
    const roleByTeamId = new Map<string, string>();
    const rolePriority: Record<string, number> = {
      owner: 4,
      pm: 3,
      admin: 2,
      member: 1,
    };
    const memberTeamIds = Array.from(
      new Set(
        (memberships ?? [])
          .map((membership: any) => {
            if (!membership?.team_id) return null;

            const currentRole = roleByTeamId.get(membership.team_id);
            const nextRole = membership.role || "member";
            const currentScore = rolePriority[currentRole || "member"] || 1;
            const nextScore = rolePriority[nextRole] || 1;

            if (!currentRole || nextScore > currentScore) {
              roleByTeamId.set(membership.team_id, nextRole);
            }

            return membership.team_id as string;
          })
          .filter((id): id is string => Boolean(id)),
      ),
    );

    let memberTeams: any[] = [];
    if (memberTeamIds.length > 0) {
      const { data: teamsByMembership, error: teamsByMembershipError } =
        await supabase
          .from("teams")
          .select("id, slug, name, avatar, type")
          .in("id", memberTeamIds);

      if (teamsByMembershipError) {
        console.error(
          "❌ Error fetching teams by membership IDs:",
          teamsByMembershipError,
        );
        throw errors.internal(
          `Gagal mengambil detail tim membership: ${teamsByMembershipError.message}`,
        );
      }

      memberTeams = teamsByMembership ?? [];
    }

    // Step 4: Merge + dedupe results from memberships and ownership
    const teamMap = new Map<string, any>();

    for (const team of memberTeams) {
      teamMap.set(team.id, {
        ...team,
        role: roleByTeamId.get(team.id) || "member",
      });
    }

    for (const team of ownedTeams ?? []) {
      const existing = teamMap.get(team.id);
      if (existing) {
        // Keep membership role if it exists (e.g. pm/admin/member)
        teamMap.set(team.id, {
          ...existing,
          ...team,
          role: existing.role,
        });
      } else {
        // Fallback: owner_id user without membership row
        teamMap.set(team.id, {
          ...team,
          role: "owner",
        });
      }
    }

    const teams = Array.from(teamMap.values()).sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "id", {
        sensitivity: "base",
      }),
    );

    console.log("✅ Final teams fetched:", {
      count: teams.length,
      candidateUserIds,
      teams: teams.map((team) => ({
        id: team.id,
        slug: team.slug,
        role: team.role,
      })),
    });

    return teams;
  },

  async createTeam(
    userId: string,
    payload: { slug: string; name: string; type?: string },
  ) {
    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("teams")
      .select("id")
      .ilike("slug", payload.slug)
      .maybeSingle<{ id: string }>();

    if (existing) {
      throw errors.conflict("Slug tim sudah digunakan");
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        slug: payload.slug.toUpperCase(),
        name: payload.name,
        type: payload.type || "tugas",
        owner_id: userId,
      })
      .select()
      .single();

    if (teamError) {
      throw errors.internal("Gagal membuat tim");
    }

    // Add creator as PM (Project Manager)
    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: userId,
      role: "pm", // Changed from 'owner' to 'pm'
    });

    if (memberError) {
      // Rollback team creation
      await supabase.from("teams").delete().eq("id", team.id);
      throw errors.internal("Gagal menambahkan member");
    }

    return team;
  },

  async getTeamBySlug(slug: string) {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .ilike("slug", slug)
      .maybeSingle<{
        id: string;
        slug: string;
        name: string;
        avatar: string | null;
        owner_id: string;
        type: string;
        start_date: string | null;
        end_date: string | null;
        company: string | null;
        work_area: string | null;
        description: string | null;
        github_repo: string | null;
        google_docs_url: string | null;
        created_at: string;
        updated_at: string;
      }>();

    if (error || !data) {
      throw errors.notFound("Tim tidak ditemukan");
    }

    return data;
  },

  async getTeamStats(teamId: string) {
    const { data: issues } = await supabase
      .from("issues")
      .select("status")
      .eq("team_id", teamId)
      .eq("is_triaged", true);

    const stats = {
      totalIssues: issues?.length || 0,
      openIssues:
        issues?.filter((i) => ["backlog", "todo", "bug"].includes(i.status))
          .length || 0,
      inProgress: issues?.filter((i) => i.status === "in_progress").length || 0,
      completed: issues?.filter((i) => i.status === "done").length || 0,
    };

    return stats;
  },

  async getTeamMembers(teamId: string) {
    console.log("👥 getTeamMembers called with teamId:", teamId);

    // Optimized: Use JOIN to get members and profiles in single query
    const { data: teamMembers, error } = await supabase
      .from("team_members")
      .select(
        `
        id,
        role,
        joined_at,
        user:users(id, name, email, avatar, initials)
      `,
      )
      .eq("team_id", teamId);

    console.log("👥 Query result:", {
      success: !error,
      error: error?.message,
      count: teamMembers?.length || 0,
      rawData: JSON.stringify(teamMembers, null, 2),
    });

    if (error) {
      console.error("❌ Error in getTeamMembers:", error);
      throw errors.internal("Gagal mengambil daftar member");
    }

    // Transform data
    const members =
      teamMembers
        ?.filter((member: any) => {
          const hasUser = !!member.user;
          console.log("🔍 Checking member:", {
            memberId: member.id,
            hasUser,
            user: member.user,
          });
          return hasUser;
        })
        .map((member: any) => ({
          ...member.user,
          role: member.role,
          joinedAt: member.joined_at,
        })) || [];

    console.log("✅ Transformed members:", JSON.stringify(members, null, 2));
    console.log("✅ Members count:", members.length);
    return members;
  },

  async getTeamMemberDetail(teamId: string, memberUserId: string) {
    const normalizedMemberUserId = String(memberUserId || "").trim();

    if (!normalizedMemberUserId) {
      throw errors.badRequest("Member tidak valid");
    }

    const { data: membership, error } = await supabase
      .from("team_members")
      .select(
        `
        user_id,
        role,
        joined_at,
        user:users(id, name, email, avatar, initials)
      `,
      )
      .eq("team_id", teamId)
      .eq("user_id", normalizedMemberUserId)
      .maybeSingle<{
        user_id: string;
        role: string;
        joined_at: string;
        user: {
          id: string;
          name: string;
          email: string;
          avatar: string | null;
          initials: string;
        };
      }>();

    if (error) {
      throw errors.internal(`Gagal mengambil detail member: ${error.message}`);
    }

    const memberUser = (membership as any)?.user;

    if (!membership || !memberUser) {
      throw errors.notFound("Anggota tim tidak ditemukan");
    }

    return {
      ...memberUser,
      role: membership.role || "member",
      joinedAt: membership.joined_at,
    };
  },

  async removeTeamMember(params: {
    teamId: string;
    requesterRole: string;
    requesterUserId: string;
    requesterEmail?: string;
    memberUserId: string;
  }) {
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
      throw errors.badRequest(
        "Gunakan fitur keluar dari tim untuk akun sendiri",
      );
    }

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
      throw errors.internal(
        `Gagal mengeluarkan anggota: ${removeError.message}`,
      );
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
  },

  async leaveTeam(params: {
    teamId: string;
    userRole: string;
    userId: string;
    email?: string;
  }) {
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
  },

  async updateTeamSettings(teamId: string, updates: any) {
    const { data, error } = await supabase
      .from("teams")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId)
      .select()
      .single();

    if (error) {
      throw errors.internal("Gagal update pengaturan tim");
    }

    return data;
  },

  async deleteTeam(teamId: string) {
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
  },

  async createTeamInviteLink(params: {
    teamId: string;
    inviterId: string;
    inviterEmail: string;
    inviterName?: string;
    role?: TeamInviteRole;
    expiresInHours?: number;
  }) {
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
  },

  async previewTeamInvite(token: string, userId: string, email?: string) {
    const invite = await parseTeamInviteToken(token);
    const team = await getInviteTeam(invite.teamId, invite.teamSlug);

    const candidateUserIds = await resolveCandidateUserIds(userId, email);
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
      existingRole: existingMembership?.role || null,
    };
  },

  async acceptTeamInvite(token: string, userId: string, email?: string) {
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

    const existingMembership = existingMemberships?.[0];
    if (existingMembership) {
      return {
        joined: false,
        alreadyMember: true,
        membershipRole: existingMembership.role || "member",
        team: {
          id: team.id,
          slug: team.slug,
          name: team.name,
        },
      };
    }

    const { error: insertError } = await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: canonicalUserId,
      role: invite.role,
    });

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
  },

  async rejectTeamInvite(token: string) {
    const invite = await parseTeamInviteToken(token);

    return {
      rejected: true,
      message: "Undangan tim ditolak",
      team: {
        slug: invite.teamSlug,
        name: invite.teamName,
      },
    };
  },
};
