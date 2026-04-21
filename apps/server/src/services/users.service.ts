import { supabase } from "../lib/supabase";
import { errors } from "../lib/errors";
import {
  resolveCandidateUserIds,
  resolveExistingUserId,
} from "../lib/userIdentity";

export const usersService = {
  async getProfile(userId: string, email?: string) {
    const resolvedUserId = await resolveExistingUserId(userId, email);

    console.log("👤 Getting user profile:", {
      userId,
      email,
      resolvedUserId,
    });

    // @ts-ignore - Supabase type inference issue
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", resolvedUserId)
      .maybeSingle<{
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        initials: string;
        created_at: string;
        updated_at: string;
      }>();

    if (error) {
      console.error("❌ Error fetching user:", error);
      throw errors.internal(`Gagal mengambil user: ${error.message}`);
    }

    if (!user) {
      console.error("❌ User not found:", {
        userId,
        email,
        resolvedUserId,
      });
      throw errors.notFound("User tidak ditemukan");
    }

    console.log("✅ User found:", { userId: user.id, name: user.name });

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

  async updateProfile(
    userId: string,
    updates: { name?: string; avatar?: string },
    email?: string,
  ) {
    const resolvedUserId = await resolveExistingUserId(userId, email);

    console.log("✏️ Updating user profile:", {
      userId,
      email,
      resolvedUserId,
      updates,
    });

    const { data, error } = (await supabase
      .from("users")
      // @ts-ignore - Supabase type inference issue
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resolvedUserId)
      .select()
      .maybeSingle()) as any;

    if (error) {
      console.error("❌ Error updating user:", error);
      throw errors.internal(`Gagal update user: ${error.message}`);
    }

    if (!data) {
      throw errors.notFound("User tidak ditemukan");
    }

    console.log("✅ User updated:", { userId: data.id, name: data.name });
    return data;
  },

  async getUserActivity(userId: string, days: number = 365, email?: string) {
    const candidateUserIds = await resolveCandidateUserIds(userId, email);

    console.log("📊 Getting user activity:", {
      userId,
      email,
      days,
      candidateUserIds,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // @ts-ignore - Supabase type inference issue
    const { data: issues, error } = await supabase
      .from("issues")
      .select("created_at")
      .in("created_by_id", candidateUserIds)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error fetching activity:", error);
      throw errors.internal("Gagal mengambil aktivitas");
    }

    // Group by date
    const activityMap = new Map<string, number>();
    // @ts-ignore - Supabase type inference issue
    issues?.forEach((issue) => {
      // @ts-ignore - Supabase type inference issue
      const date = new Date(issue.created_at).toISOString().split("T")[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });

    // Convert to array
    const activities = Array.from(activityMap.entries()).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    // Calculate stats
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    // @ts-ignore - Supabase type inference issue
    const totalLast30Days =
      // @ts-ignore - Supabase type inference issue
      issues?.filter((i) => new Date(i.created_at) >= last30Days).length || 0;

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = new Date();

    while (currentStreak < 365) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (activityMap.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === today) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const dailyAverage = totalLast30Days / 30;

    console.log("✅ Activity calculated:", {
      totalActivities: activities.length,
      totalLast30Days,
      currentStreak,
      dailyAverage: dailyAverage.toFixed(1),
    });

    return {
      activities,
      stats: {
        totalLast30Days,
        currentStreak,
        dailyAverage: parseFloat(dailyAverage.toFixed(1)),
      },
    };
  },
};
