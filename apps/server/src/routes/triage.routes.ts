import { Elysia, t } from "elysia";
import { verifyJWT } from "../lib/jwt";
import { AppError, errors } from "../lib/errors";
import { resolveCandidateUserIds } from "../lib/userIdentity";
import { supabase } from "../lib/supabase";
import { triageController } from "../controllers/triage.controller";

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
    .maybeSingle();

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

export const triageRoutes = new Elysia()
  .group("/teams/:teamSlug/triage", (app) =>
    app.get("/", async ({ headers, params, set }) => {
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

        return await triageController.list({ teamId: access.teamId });
      } catch (error) {
        return handleRouteError(
          set,
          error,
          `[triage route] GET /teams/${(params as any).teamSlug}/triage error`,
        );
      }
    }),
  )
  .group("/triage/:id", (app) =>
    app
      .post(
        "/accept",
        async ({ headers, params, body, set }) => {
          try {
            await verifyAuth(headers);
            const safeBody = (body as any) ?? {};
            return await triageController.accept({ params, body: safeBody });
          } catch (error) {
            return handleRouteError(
              set,
              error,
              `[triage route] POST /triage/${(params as any).id}/accept error`,
            );
          }
        },
        {
          body: t.Optional(
            t.Object({
              priority: t.Optional(t.String()),
              assigneeId: t.Optional(t.String()),
              labels: t.Optional(t.Array(t.String())),
            }),
          ),
        },
      )
      .post(
        "/decline",
        async ({ headers, params, body, set }) => {
          try {
            await verifyAuth(headers);
            const safeBody = (body as any) ?? {};
            return await triageController.decline({ params, body: safeBody });
          } catch (error) {
            return handleRouteError(
              set,
              error,
              `[triage route] POST /triage/${(params as any).id}/decline error`,
            );
          }
        },
        {
          body: t.Optional(
            t.Object({
              reason: t.Optional(t.String()),
            }),
          ),
        },
      ),
  );
