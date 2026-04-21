import { Elysia } from "elysia";
import { supabase } from "../lib/supabase";
import { errors } from "../lib/errors";
import { resolveCandidateUserIds } from "../lib/userIdentity";

interface TeamAccessCurrentUser {
  sub?: string;
  email?: string;
}

export const teamAccessMiddleware = new Elysia({ name: "teamAccess" }).derive(
  async ({ params, store }: any) => {
    const currentUser =
      (store as { currentUser?: TeamAccessCurrentUser } | undefined)
        ?.currentUser ?? undefined;
    const teamSlug = (params as any).teamSlug;

    console.log("🔐 teamAccessMiddleware called:", {
      teamSlug,
      userId: currentUser?.sub,
      email: currentUser?.email,
    });

    const candidateUserIds = await resolveCandidateUserIds(
      currentUser?.sub || "",
      currentUser?.email,
    );

    if (!teamSlug) {
      console.log("⚠️ No teamSlug in params");
      return {};
    }

    // Get team by slug
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, owner_id")
      .ilike("slug", teamSlug)
      .maybeSingle<{ id: string; owner_id: string }>();

    console.log("🔍 Team lookup:", {
      found: !!team,
      error: teamError?.message,
    });

    if (teamError || !team) {
      console.error("❌ Team not found:", { teamSlug, error: teamError });
      throw errors.notFound("Tim tidak ditemukan");
    }

    // Owner should always have access, even if membership row is missing
    if (candidateUserIds.includes(team.owner_id)) {
      console.log("✅ Access granted via ownership:", {
        teamId: team.id,
        userId: currentUser?.sub,
        candidateUserIds,
      });

      return {
        teamId: team.id,
        teamSlug,
        userRole: "owner",
      };
    }

    // Check if user is member of team
    const { data: memberships, error: memberError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", team.id)
      .in("user_id", candidateUserIds);

    console.log("🔍 Membership check:", {
      isMember: !!memberships?.length,
      roles: memberships?.map((m: any) => m.role) || [],
      error: memberError?.message,
      candidateUserIds,
    });

    if (memberError) {
      console.error("❌ Error checking membership:", {
        teamId: team.id,
        userId: currentUser?.sub,
        error: memberError,
      });
      throw errors.internal(
        `Gagal memeriksa akses tim: ${memberError.message}`,
      );
    }

    if (!memberships || memberships.length === 0) {
      console.error("❌ User not a member:", {
        teamId: team.id,
        userId: currentUser?.sub,
        candidateUserIds,
      });
      throw errors.forbidden("Anda tidak memiliki akses ke tim ini");
    }

    const rolePriority: Record<string, number> = {
      owner: 4,
      pm: 3,
      admin: 2,
      member: 1,
    };

    const userRole = memberships
      .map((m: any) => m.role || "member")
      .sort(
        (a: string, b: string) =>
          (rolePriority[b] || 0) - (rolePriority[a] || 0),
      )[0];

    console.log("✅ Access granted:", {
      teamId: team.id,
      role: userRole,
    });

    return {
      teamId: team.id,
      teamSlug,
      userRole,
    };
  },
);
