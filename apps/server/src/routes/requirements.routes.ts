import { Elysia, t } from "elysia";
import { verifyJWT } from "../lib/jwt";
import {
  listRequirements,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  aiGenerateRequirements,
} from "../services/requirements.service";
import { supabase } from "../lib/supabase";

async function getAuth(headers: any, set: any) {
  const authHeader = headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    set.status = 401;
    return null;
  }
  try {
    const payload = await verifyJWT(authHeader.slice(7));
    return payload.sub as string;
  } catch {
    set.status = 401;
    return null;
  }
}

export const requirementsRoutes = new Elysia({ prefix: "/teams/:teamSlug" })

  // GET /teams/:slug/requirements — list FR dan NFR
  .get(
    "/requirements",
    async ({ params, query, headers, set }) => {
      const userId = await getAuth(headers, set);
      if (!userId) return { error: "UNAUTHORIZED" };

      const { data: team } = await supabase
        .from("teams")
        .select("id")
        .eq("slug", params.teamSlug)
        .maybeSingle<{ id: string }>();
      if (!team) {
        set.status = 404;
        return { error: "NOT_FOUND" };
      }

      try {
        const type = query.type as "FR" | "NFR" | undefined;
        const data = await listRequirements(team.id, type);
        return {
          fr: data.filter((r) => r.type === "FR"),
          nfr: data.filter((r) => r.type === "NFR"),
          total: data.length,
        };
      } catch (err: any) {
        set.status = 500;
        return { error: "INTERNAL_ERROR", message: err.message };
      }
    },
    {
      query: t.Object({
        type: t.Optional(t.Union([t.Literal("FR"), t.Literal("NFR")])),
      }),
    },
  )

  // POST /teams/:slug/requirements — buat FR atau NFR
  .post(
    "/requirements",
    async ({ params, body, headers, set }) => {
      const userId = await getAuth(headers, set);
      if (!userId) return { error: "UNAUTHORIZED" };

      const { data: team } = await supabase
        .from("teams")
        .select("id")
        .eq("slug", params.teamSlug)
        .maybeSingle<{ id: string }>();
      if (!team) {
        set.status = 404;
        return { error: "NOT_FOUND" };
      }

      try {
        const b = body as any;
        const data = await createRequirement(team.id, userId, {
          issueId: b.issueId,
          type: b.type,
          description: b.description,
          priority: b.priority,
          nfrCategory: b.nfrCategory,
          acceptanceCriteria: b.acceptanceCriteria,
        });
        return data;
      } catch (err: any) {
        set.status = 500;
        return { error: "INTERNAL_ERROR", message: err.message };
      }
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("FR"), t.Literal("NFR")]),
        description: t.String({ minLength: 10 }),
        issueId: t.Optional(t.String()),
        priority: t.Optional(
          t.Union([
            t.Literal("MUST"),
            t.Literal("SHOULD"),
            t.Literal("COULD"),
            t.Literal("WONT"),
          ]),
        ),
        nfrCategory: t.Optional(t.String()),
        acceptanceCriteria: t.Optional(t.String()),
      }),
    },
  )

  // PATCH /teams/:slug/requirements/:id — update
  .patch("/requirements/:id", async ({ params, body, headers, set }) => {
    const userId = await getAuth(headers, set);
    if (!userId) return { error: "UNAUTHORIZED" };

    try {
      const data = await updateRequirement(params.id, body as any);
      return data;
    } catch (err: any) {
      set.status = 500;
      return { error: "INTERNAL_ERROR", message: err.message };
    }
  })

  // DELETE /teams/:slug/requirements/:id — hapus
  .delete("/requirements/:id", async ({ params, headers, set }) => {
    const userId = await getAuth(headers, set);
    if (!userId) return { error: "UNAUTHORIZED" };

    try {
      await deleteRequirement(params.id);
      return { message: "Requirement berhasil dihapus" };
    } catch (err: any) {
      set.status = 500;
      return { error: "INTERNAL_ERROR", message: err.message };
    }
  })

  // POST /teams/:slug/requirements/ai-generate — AI draft FR/NFR dari backlog
  .post(
    "/requirements/ai-generate",
    async ({ params, body, headers, set }) => {
      const userId = await getAuth(headers, set);
      if (!userId) return { error: "UNAUTHORIZED" };

      const { data: team } = await supabase
        .from("teams")
        .select("id, name")
        .eq("slug", params.teamSlug)
        .maybeSingle<{ id: string; name: string }>();
      if (!team) {
        set.status = 404;
        return { error: "NOT_FOUND" };
      }

      try {
        const b = body as any;
        const result = await aiGenerateRequirements({
          issueTitle: b.issueTitle,
          issueDescription: b.issueDescription ?? "",
          role: b.role,
          teamName: team.name,
        });
        return result;
      } catch (err: any) {
        set.status = 500;
        return { error: "AI_ERROR", message: err.message };
      }
    },
    {
      body: t.Object({
        issueTitle: t.String(),
        issueDescription: t.Optional(t.String()),
        role: t.Optional(t.String()),
      }),
    },
  );
