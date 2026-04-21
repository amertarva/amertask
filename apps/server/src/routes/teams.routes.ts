import { Elysia, t } from "elysia";
import { verifyJWT } from "../lib/jwt";
import { errors } from "../lib/errors";
import { teamsController } from "../controllers/teams.controller";
import { resolveCandidateUserIds } from "../lib/userIdentity";

// Helper to verify token
async function verifyAuth(headers: any) {
  const authHeader = headers.authorization;
  if (!authHeader) {
    throw errors.unauthorized("Token tidak ditemukan");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw errors.unauthorized("Format token tidak valid");
  }

  return await verifyJWT(token);
}

async function resolveTeamAccess(
  teamSlug: string,
  userId: string,
  email?: string,
) {
  const { supabase } = await import("../lib/supabase");
  const candidateUserIds = await resolveCandidateUserIds(userId, email);

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, owner_id")
    .ilike("slug", teamSlug)
    .maybeSingle();

  if (teamError || !team) {
    throw errors.notFound("Tim tidak ditemukan");
  }

  // Owner always has access, even without a team_members row
  if (candidateUserIds.includes(team.owner_id)) {
    return {
      teamId: team.id,
      role: "owner",
    };
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", team.id)
    .in("user_id", candidateUserIds);

  if (membershipError) {
    throw errors.internal(
      `Gagal memeriksa akses tim: ${membershipError.message}`,
    );
  }

  if (!memberships || memberships.length === 0) {
    throw errors.forbidden("Anda tidak memiliki akses ke tim ini");
  }

  const rolePriority: Record<string, number> = {
    owner: 4,
    pm: 3,
    admin: 2,
    member: 1,
  };

  const role = memberships
    .map((m: any) => m.role || "member")
    .sort(
      (a: string, b: string) => (rolePriority[b] || 0) - (rolePriority[a] || 0),
    )[0];

  return {
    teamId: team.id,
    role,
  };
}

export const teamsRoutes = new Elysia().group("/teams", (app) =>
  app
    .get("/", async ({ headers }) => {
      console.log("📋 GET /teams called");
      const currentUser = await verifyAuth(headers);
      console.log("✅ Token verified, userId:", currentUser.sub);
      return await teamsController.list({ currentUser });
    })
    .post(
      "/",
      async ({ headers, body }) => {
        console.log("➕ POST /teams called");
        const currentUser = await verifyAuth(headers);
        console.log("✅ Token verified, userId:", currentUser.sub);
        return await teamsController.create({ currentUser, body });
      },
      {
        body: t.Object({
          slug: t.String({ minLength: 1 }),
          name: t.String({ minLength: 1 }),
          type: t.Optional(
            t.Union([
              t.Literal("konstruksi"),
              t.Literal("it"),
              t.Literal("tugas"),
            ]),
          ),
        }),
      },
    )
    .post(
      "/:teamSlug/invite",
      async ({ headers, params, body }) => {
        console.log("🔗 POST /teams/:teamSlug/invite called");
        const currentUser = await verifyAuth(headers);

        const access = await resolveTeamAccess(
          params.teamSlug,
          currentUser.sub,
          currentUser.email,
        );

        return await teamsController.createInvite({
          teamId: access.teamId,
          userRole: access.role,
          currentUser,
          body,
        });
      },
      {
        body: t.Object({
          role: t.Optional(
            t.Union([t.Literal("member"), t.Literal("admin"), t.Literal("pm")]),
          ),
          expiresInHours: t.Optional(
            t.Number({
              minimum: 1,
              maximum: 168,
            }),
          ),
        }),
      },
    )
    .post(
      "/invitations/preview",
      async ({ headers, body }) => {
        console.log("👀 POST /teams/invitations/preview called");
        const currentUser = await verifyAuth(headers);

        return await teamsController.previewInvite({
          currentUser,
          body,
        });
      },
      {
        body: t.Object({
          token: t.String({ minLength: 1 }),
        }),
      },
    )
    .post(
      "/invitations/accept",
      async ({ headers, body }) => {
        console.log("✅ POST /teams/invitations/accept called");
        const currentUser = await verifyAuth(headers);

        return await teamsController.acceptInvite({
          currentUser,
          body,
        });
      },
      {
        body: t.Object({
          token: t.String({ minLength: 1 }),
        }),
      },
    )
    .post(
      "/invitations/reject",
      async ({ headers, body }) => {
        console.log("❌ POST /teams/invitations/reject called");
        await verifyAuth(headers);

        return await teamsController.rejectInvite({
          body,
        });
      },
      {
        body: t.Object({
          token: t.String({ minLength: 1 }),
        }),
      },
    )
    .get("/:teamSlug", async ({ headers, params }) => {
      console.log("📋 GET /teams/:teamSlug called");
      const currentUser = await verifyAuth(headers);

      await resolveTeamAccess(
        params.teamSlug,
        currentUser.sub,
        currentUser.email,
      );

      return await teamsController.getBySlug({ params });
    })
    .get("/:teamSlug/members", async ({ headers, params }) => {
      console.log("👥 GET /teams/:teamSlug/members called");
      console.log("📋 Params:", params);
      const currentUser = await verifyAuth(headers);
      console.log("✅ User authenticated:", currentUser.sub);

      const access = await resolveTeamAccess(
        params.teamSlug,
        currentUser.sub,
        currentUser.email,
      );

      console.log("🔍 Membership check:", {
        teamId: access.teamId,
        userId: currentUser.sub,
        role: access.role,
      });

      console.log("✅ Calling getMembers with teamId:", access.teamId);
      return await teamsController.getMembers({ teamId: access.teamId });
    })
    .get("/:teamSlug/members/:memberId", async ({ headers, params }) => {
      console.log("👤 GET /teams/:teamSlug/members/:memberId called");
      const currentUser = await verifyAuth(headers);

      const access = await resolveTeamAccess(
        params.teamSlug,
        currentUser.sub,
        currentUser.email,
      );

      return await teamsController.getMemberDetail({
        teamId: access.teamId,
        params,
      });
    })
    .delete("/:teamSlug/members/:memberId", async ({ headers, params }) => {
      console.log("🧹 DELETE /teams/:teamSlug/members/:memberId called");
      const currentUser = await verifyAuth(headers);

      const access = await resolveTeamAccess(
        params.teamSlug,
        currentUser.sub,
        currentUser.email,
      );

      return await teamsController.removeMember({
        teamId: access.teamId,
        userRole: access.role,
        currentUser,
        params,
      });
    })
    .post("/:teamSlug/leave", async ({ headers, params }) => {
      console.log("🚪 POST /teams/:teamSlug/leave called");
      const currentUser = await verifyAuth(headers);

      const access = await resolveTeamAccess(
        params.teamSlug,
        currentUser.sub,
        currentUser.email,
      );

      return await teamsController.leaveTeam({
        teamId: access.teamId,
        userRole: access.role,
        currentUser,
      });
    })
    .get("/:teamSlug/settings", async ({ headers, params }) => {
      console.log("⚙️ GET /teams/:teamSlug/settings called");
      const currentUser = await verifyAuth(headers);

      const access = await resolveTeamAccess(
        params.teamSlug,
        currentUser.sub,
        currentUser.email,
      );

      return await teamsController.getSettings({ teamId: access.teamId });
    })
    .patch(
      "/:teamSlug/settings",
      async ({ headers, params, body }) => {
        console.log("🔧 PATCH /teams/:teamSlug/settings called");
        const currentUser = await verifyAuth(headers);

        const access = await resolveTeamAccess(
          params.teamSlug,
          currentUser.sub,
          currentUser.email,
        );

        return await teamsController.updateSettings({
          teamId: access.teamId,
          userRole: access.role,
          body,
        });
      },
      {
        body: t.Object({
          name: t.Optional(t.String()),
          slug: t.Optional(t.String()),
          type: t.Optional(t.String()),
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
          projectManagerId: t.Optional(t.String()),
          company: t.Optional(t.String()),
          workArea: t.Optional(t.String()),
          description: t.Optional(t.String()),
          integrations: t.Optional(
            t.Object({
              githubRepo: t.Optional(t.String()),
              googleDocsUrl: t.Optional(t.String()),
            }),
          ),
        }),
      },
    )
    .delete("/:teamSlug", async ({ headers, params }) => {
      console.log("🗑️ DELETE /teams/:teamSlug called");
      const currentUser = await verifyAuth(headers);

      const access = await resolveTeamAccess(
        params.teamSlug,
        currentUser.sub,
        currentUser.email,
      );

      return await teamsController.remove({
        teamId: access.teamId,
        userRole: access.role,
      });
    }),
);
