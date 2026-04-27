// Barrel file — routes hanya import dari sini

export { getUserById, updateUserProfile } from "./users/users-profile.service";
export { getUserActivity } from "./users/users-activity.service";

// Legacy usersService object for backward compatibility
import { supabase } from "../lib/supabase";
import { resolveCandidateUserIds } from "../lib/userIdentity";
import { getUserById, updateUserProfile } from "./users/users-profile.service";
import { getUserActivity } from "./users/users-activity.service";

export const usersService = {
  async getProfile(userId: string, email?: string) {
    const user = await getUserById(userId, email);
    const candidateUserIds = await resolveCandidateUserIds(userId, email);
    if (!candidateUserIds.includes(user.id)) {
      candidateUserIds.push(user.id);
    }

    // Get memberships directly from team_members
    // @ts-ignore - Supabase type inference issue
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from("team_members")
      .select("role, team_id")
      .in("user_id", candidateUserIds);

    if (teamMembersError) {
      console.error("⚠️ Error fetching team members:", teamMembersError);
    }

    // Fetch teams where user is owner (fallback for legacy data without team_members row)
    // @ts-ignore - Supabase type inference issue
    const { data: ownedTeams, error: ownedTeamsError } = await supabase
      .from("teams")
      .select("id, slug, name, avatar")
      .in("owner_id", candidateUserIds);

    if (ownedTeamsError) {
      console.error("⚠️ Error fetching owned teams:", ownedTeamsError);
    }

    const roleByTeamId = new Map<string, string>();
    const memberTeamIds = Array.from(
      new Set(
        (teamMembers ?? [])
          .map((member: any) => {
            if (!member?.team_id) return null;
            roleByTeamId.set(member.team_id, member.role || "member");
            return member.team_id as string;
          })
          .filter((id): id is string => Boolean(id)),
      ),
    );

    let memberTeams: any[] = [];
    if (memberTeamIds.length > 0) {
      // @ts-ignore - Supabase type inference issue
      const { data, error: memberTeamsError } = await supabase
        .from("teams")
        .select("id, slug, name, avatar")
        .in("id", memberTeamIds);

      if (memberTeamsError) {
        console.error(
          "⚠️ Error fetching team details by IDs:",
          memberTeamsError,
        );
      } else {
        memberTeams = data ?? [];
      }
    }

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
        // Preserve explicit membership role from team_members (e.g. pm)
        // @ts-ignore - Supabase type inference issue
        teamMap.set(team.id, {
          // @ts-ignore - Supabase type inference issue
          ...existing,
          // @ts-ignore - Supabase type inference issue
          ...team,
          role: existing.role,
        });
      } else {
        // Fallback for legacy teams without team_members row
        // @ts-ignore - Supabase type inference issue
        teamMap.set(team.id, {
          // @ts-ignore - Supabase type inference issue
          ...team,
          role: "owner",
        });
      }
    }

    const teams = Array.from(teamMap.values());

    console.log("✅ User profile complete:", {
      userId: user.id,
      teamsCount: teams.length,
    });

    return {
      ...user,
      teams,
    };
  },

  updateProfile: updateUserProfile,
  getUserActivity,
};
