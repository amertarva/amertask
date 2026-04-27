import { Elysia, t } from "elysia";
import { verifyJWT } from "../lib/jwt";
import { AppError, errors } from "../lib/errors";
import { resolveCandidateUserIds } from "../lib/userIdentity";
import { supabase } from "../lib/supabase";
import { issuesController } from "../controllers/issues.controller";
import { issuesService } from "../services/issues.service";

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

  const rolePriority: Record<string, number> = {
    owner: 4,
    pm: 3,
    admin: 2,
    member: 1,
  };

  const role = memberships
    .map((membership: any) => membership.role || "member")
    .sort(
      (a: string, b: string) => (rolePriority[b] || 0) - (rolePriority[a] || 0),
    )[0];

  return { teamId: team.id, role };
}

function handleRouteError(set: any, error: unknown, context: string) {
  if (error instanceof AppError) {
    set.status = error.statusCode;
    return {
      error: error.code,
      message: error.message,
    };
  }

  console.error(`${context}:`, error);
  set.status = 500;
  return {
    error: "INTERNAL_ERROR",
    message:
      error instanceof Error ? error.message : "Terjadi kesalahan server",
  };
}

export const issuesRoutes = new Elysia()
  .group("/teams/:teamSlug/issues", (app) =>
    app
      .get(
        "/",
        async ({ headers, params, query, set }) => {
          try {
            const teamSlug = (params as any).teamSlug as string;
            if (!teamSlug) {
              set.status = 400;
              return {
                error: "BAD_REQUEST",
                message: "teamSlug tidak boleh kosong",
              };
            }

            const currentUser = await verifyAuth(headers);
            await resolveTeamAccess(
              teamSlug,
              currentUser.sub,
              currentUser.email,
            );

            return await issuesService.list(teamSlug, query as any);
          } catch (error) {
            return handleRouteError(
              set,
              error,
              `[issues route] GET /teams/${(params as any).teamSlug}/issues error`,
            );
          }
        },
        {
          query: t.Object({
            status: t.Optional(t.String()),
            priority: t.Optional(t.String()),
            labels: t.Optional(t.String()),
            assigneeId: t.Optional(t.String()),
            search: t.Optional(t.String()),
            sortBy: t.Optional(t.String()),
            sortDir: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
            page: t.Optional(t.Numeric({ default: 1 })),
            limit: t.Optional(t.Numeric({ default: 20, maximum: 100 })),
          }),
        },
      )
      .post(
        "/",
        async ({ headers, params, body, set }) => {
          try {
            const teamSlug = (params as any).teamSlug as string;
            if (!teamSlug) {
              set.status = 400;
              return {
                error: "BAD_REQUEST",
                message: "teamSlug tidak boleh kosong",
              };
            }

            const currentUser = await verifyAuth(headers);
            const access = await resolveTeamAccess(
              teamSlug,
              currentUser.sub,
              currentUser.email,
            );

            return await issuesController.create({
              teamId: access.teamId,
              currentUser,
              body,
            });
          } catch (error) {
            return handleRouteError(
              set,
              error,
              `[issues route] POST /teams/${(params as any).teamSlug}/issues error`,
            );
          }
        },
        {
          body: t.Object({
            title: t.String({ minLength: 1 }),
            description: t.Optional(t.String()),
            status: t.Optional(t.String()),
            priority: t.Optional(t.String()),
            labels: t.Optional(t.Array(t.String())),
            assigneeId: t.Optional(t.String()),
            parentIssueId: t.Optional(t.String()),
            source: t.Optional(
              t.Union([
                t.Literal("slack"),
                t.Literal("email"),
                t.Literal("manual"),
              ]),
            ),
            isTriaged: t.Optional(t.Boolean()),
            // NOTE: reason, triageReason, planInfo deprecated - use separate tables
            // Use POST /issues/:issueId/planning for planning data
            // Use triage routes for triage metadata
          }),
        },
      ),
  )
  .group("/issues/:id", (app) =>
    app
      .get("/", async ({ headers, params, set }) => {
        try {
          await verifyAuth(headers);
          return await issuesController.getById({ params });
        } catch (error) {
          return handleRouteError(
            set,
            error,
            `[issues route] GET /issues/${(params as any).id} error`,
          );
        }
      })
      .patch(
        "/",
        async ({ headers, params, body, set }) => {
          try {
            const currentUser = await verifyAuth(headers);
            return await issuesController.update({ params, body, currentUser });
          } catch (error) {
            return handleRouteError(
              set,
              error,
              `[issues route] PATCH /issues/${(params as any).id} error`,
            );
          }
        },
        {
          body: t.Object({
            title: t.Optional(t.String()),
            description: t.Optional(t.String()),
            status: t.Optional(t.String()),
            priority: t.Optional(t.String()),
            labels: t.Optional(t.Array(t.String())),
            assigneeId: t.Optional(t.String()),
            isTriaged: t.Optional(t.Boolean()),
            // NOTE: reason, triageReason, planInfo deprecated - use separate tables
            // Use POST /issues/:issueId/planning for planning data
            // Use triage routes for triage metadata
          }),
        },
      )
      .delete("/", async ({ headers, params, set }) => {
        try {
          await verifyAuth(headers);
          return await issuesController.remove({ params });
        } catch (error) {
          return handleRouteError(
            set,
            error,
            `[issues route] DELETE /issues/${(params as any).id} error`,
          );
        }
      }),
  );
