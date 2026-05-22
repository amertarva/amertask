import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";
import { resolveCandidateUserIds } from "../../lib/userIdentity";
import type { Team, TeamMember, TeamStats } from "./teams-types";

export async function getUserTeams(userId: string, email?: string) {
  const candidateUserIds = await resolveCandidateUserIds(userId, email);

  console.log("📋 Getting user teams:", {
    userId,
    email,
    candidateUserIds,
  });

  const [membershipsResult, ownedTeamsResult] = await Promise.all([
    // Step 1: Get memberships directly from team_members
    // @ts-ignore - Supabase type inference issue
    supabase
      .from("team_members")
      .select("team_id, role")
      .in("user_id", candidateUserIds),

    // Step 2: Get teams where user is explicitly owner
    // @ts-ignore - Supabase type inference issue
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
    // @ts-ignore - Supabase type inference issue
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

  // @ts-ignore - Supabase type inference issue
  for (const team of ownedTeams ?? []) {
    // @ts-ignore - Supabase type inference issue
    const existing = teamMap.get(team.id);
    if (existing) {
      // Keep membership role if it exists (e.g. pm/admin/member)
      // @ts-ignore - Supabase type inference issue
      teamMap.set(team.id, {
        // @ts-ignore - Supabase type inference issue
        ...existing,
        // @ts-ignore - Supabase type inference issue
        ...team,
        role: existing.role,
      });
    } else {
      // Fallback: owner_id user without membership row
      // @ts-ignore - Supabase type inference issue
      teamMap.set(team.id, {
        // @ts-ignore - Supabase type inference issue
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
}

export async function getTeamBySlug(slug: string): Promise<Team> {
  // @ts-ignore - Supabase type inference issue
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .ilike("slug", slug)
    .maybeSingle<Team>();

  if (error || !data) {
    throw errors.notFound("Tim tidak ditemukan");
  }

  return data;
}

export async function getTeamStats(teamId: string): Promise<TeamStats> {
  // @ts-ignore - Supabase type inference issue
  const { data: issues } = (await supabase
    .from("issues")
    .select("status")
    .eq("team_id", teamId)
    .eq("is_triaged", true)) as any;

  const stats: TeamStats = {
    totalIssues: issues?.length || 0,
    openIssues:
      issues?.filter((i: any) => ["backlog", "todo", "bug"].includes(i.status))
        .length || 0,
    inProgress:
      issues?.filter((i: any) => i.status === "in_progress").length || 0,
    completed: issues?.filter((i: any) => i.status === "done").length || 0,
  };

  return stats;
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  console.log("👥 getTeamMembers called with teamId:", teamId);

  // Optimized: Use JOIN to get members and profiles in single query
  // @ts-ignore - Supabase type inference issue
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
}

export async function getTeamMemberDetail(
  teamId: string,
  memberUserId: string,
): Promise<TeamMember> {
  const normalizedMemberUserId = String(memberUserId || "").trim();

  if (!normalizedMemberUserId) {
    throw errors.badRequest("Member tidak valid");
  }

  // @ts-ignore - Supabase type inference issue
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
}
