import { Elysia, t } from "elysia";
import { verifyJWT } from "../lib/jwt";
import { AppError, errors } from "../lib/errors";
import { resolveCandidateUserIds } from "../lib/userIdentity";
import { supabase } from "../lib/supabase";
import * as planningMutate from "../services/planning/planning-mutate.service";
import * as planningQuery from "../services/planning/planning-query.service";

async function verifyAuth(headers: Record<string, string | undefined>) {
  const authHeader = headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw errors.unauthorized("Token tidak ditemukan");
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw errors.unauthorized("Format token tidak valid");
  }

  const payload = await verifyJWT(token);
  return {
    sub: String(payload.sub || ""),
    email: payload.email,
  };
}

async function resolveTeamAccess(
  teamSlug: string,
  userId: string,
  email?: string,
) {
  const candidateUserIds = await resolveCandidateUserIds(userId, email);

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, owner_id")
    .ilike("slug", teamSlug)
    .maybeSingle<{ id: string; owner_id: string }>();

  if (teamError) {
    throw errors.internal(`Gagal memeriksa tim: ${teamError.message}`);
  }

  if (!team) {
    throw errors.notFound("Tim tidak ditemukan");
  }

  if (candidateUserIds.includes(team.owner_id)) {
    return { teamId: team.id, role: "owner" as const };
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

  return { teamId: team.id, role: "member" as const };
}

export const standalonePlanningRoutes = new Elysia({
  prefix: "/teams/:teamSlug",
})
  // GET /teams/:teamSlug/plannings - List all plannings
  .get(
    "/plannings",
    async ({ params, query, headers, set }) => {
      try {
        const currentUser = await verifyAuth(headers as Record<string, string>);
        const access = await resolveTeamAccess(
          params.teamSlug,
          currentUser.sub,
          currentUser.email,
        );

        return await planningQuery.listPlannings(access.teamId, query);
      } catch (error) {
        if (error instanceof AppError) {
          set.status = error.statusCode;
          return { error: error.code, message: error.message };
        }
        console.error("[plannings] GET error:", error);
        set.status = 500;
        return {
          error: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Internal error",
        };
      }
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        assigneeId: t.Optional(t.String()),
        search: t.Optional(t.String()),
        sortBy: t.Optional(t.String()),
        sortDir: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
        page: t.Optional(t.Numeric({ default: 1 })),
        limit: t.Optional(t.Numeric({ default: 20, maximum: 100 })),
      }),
    },
  )

  // POST /teams/:teamSlug/plannings - Create new planning
  .post(
    "/plannings",
    async ({ params, body, headers, set }) => {
      try {
        const currentUser = await verifyAuth(headers as Record<string, string>);
        const access = await resolveTeamAccess(
          params.teamSlug,
          currentUser.sub,
          currentUser.email,
        );

        const planning = await planningMutate.createPlanning({
          teamId: access.teamId,
          title: body.title,
          description: body.description,
          priority: body.priority,
          assigneeId: body.assigneeId,
          startDate: body.startDate,
          dueDate: body.dueDate,
          estimatedHours: body.estimatedHours,
          planInfo: body.planInfo,
        });

        set.status = 201;
        return planning;
      } catch (error) {
        if (error instanceof AppError) {
          set.status = error.statusCode;
          return { error: error.code, message: error.message };
        }
        console.error("[plannings] POST error:", error);
        set.status = 500;
        return {
          error: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Internal error",
        };
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        assigneeId: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        dueDate: t.Optional(t.String()),
        estimatedHours: t.Optional(t.Number()),
        planInfo: t.Optional(t.String()),
      }),
    },
  )

  // GET /teams/:teamSlug/plannings/:number - Get planning by number
  .get("/plannings/:number", async ({ params, headers, set }) => {
    try {
      const currentUser = await verifyAuth(headers as Record<string, string>);
      const access = await resolveTeamAccess(
        params.teamSlug,
        currentUser.sub,
        currentUser.email,
      );

      const planning = await planningQuery.getPlanningByNumber(
        access.teamId,
        parseInt(params.number),
      );

      return planning;
    } catch (error) {
      if (error instanceof AppError) {
        set.status = error.statusCode;
        return { error: error.code, message: error.message };
      }
      console.error("[plannings] GET by number error:", error);
      set.status = 500;
      return {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal error",
      };
    }
  })

  // PATCH /teams/:teamSlug/plannings/:planningId - Update planning
  .patch(
    "/plannings/:planningId",
    async ({ params, body, headers, set }) => {
      try {
        await verifyAuth(headers as Record<string, string>);

        const planning = await planningMutate.updatePlanning(
          params.planningId,
          body,
        );

        return planning;
      } catch (error) {
        if (error instanceof AppError) {
          set.status = error.statusCode;
          return { error: error.code, message: error.message };
        }
        console.error("[plannings] PATCH error:", error);
        set.status = 500;
        return {
          error: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Internal error",
        };
      }
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        assigneeId: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        dueDate: t.Optional(t.String()),
        estimatedHours: t.Optional(t.Number()),
        planInfo: t.Optional(t.String()),
        status: t.Optional(
          t.Union([
            t.Literal("planned"),
            t.Literal("in_execution"),
            t.Literal("completed"),
            t.Literal("cancelled"),
          ]),
        ),
      }),
    },
  )

  // DELETE /teams/:teamSlug/plannings/:planningId - Delete planning
  .delete("/plannings/:planningId", async ({ params, headers, set }) => {
    try {
      await verifyAuth(headers as Record<string, string>);

      await planningMutate.deletePlanning(params.planningId);

      return { message: "Planning berhasil dihapus" };
    } catch (error) {
      if (error instanceof AppError) {
        set.status = error.statusCode;
        return { error: error.code, message: error.message };
      }
      console.error("[plannings] DELETE error:", error);
      set.status = 500;
      return {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal error",
      };
    }
  })

  // POST /teams/:teamSlug/plannings/:planningId/promote - Promote to execution
  .post("/plannings/:planningId/promote", async ({ params, headers, set }) => {
    try {
      const currentUser = await verifyAuth(headers as Record<string, string>);

      const issue = await planningMutate.promotePlanningToExecution(
        params.planningId,
        currentUser.sub,
      );

      return {
        message: "Planning berhasil dipromote ke execution",
        issue,
      };
    } catch (error) {
      if (error instanceof AppError) {
        set.status = error.statusCode;
        return { error: error.code, message: error.message };
      }
      console.error("[plannings] POST promote error:", error);
      set.status = 500;
      return {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal error",
      };
    }
  });
