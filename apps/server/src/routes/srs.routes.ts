import { Elysia, t } from "elysia";
import { verifyJWT } from "../lib/jwt";
import { getSrsWithRequirements, upsertSrs } from "../services/srs.service";
import {
  generateSrsSection,
  type SrsSection,
} from "../services/srs/srs-ai.service";
import { supabase } from "../lib/supabase";

async function getAuth(headers: any, set: any) {
  const authHeader = headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    set.status = 401;
    return null;
  }
  try {
    const p = await verifyJWT(authHeader.slice(7));
    return p.sub as string;
  } catch {
    set.status = 401;
    return null;
  }
}

export const srsRoutes = new Elysia({ prefix: "/teams/:teamSlug/srs" })

  // GET /teams/:slug/srs — ambil SRS + FR + NFR
  .get("/", async ({ params, headers, set }) => {
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
      return await getSrsWithRequirements(team.id);
    } catch (err: any) {
      set.status = 500;
      return { error: "INTERNAL_ERROR", message: err.message };
    }
  })

  // PUT /teams/:slug/srs — upsert (create or update) SRS
  .put("/", async ({ params, body, headers, set }) => {
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
      const data = await upsertSrs(team.id, userId, body as any);
      return data;
    } catch (err: any) {
      set.status = 500;
      return { error: "INTERNAL_ERROR", message: err.message };
    }
  })

  // POST /teams/:slug/srs/ai-generate-section — generate satu section
  .post(
    "/ai-generate-section",
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
        return { error: "NOT_FOUND", message: "Tim tidak ditemukan" };
      }

      try {
        const b = body as { section: SrsSection };
        const result = await generateSrsSection({
          teamId: team.id,
          teamName: team.name,
          section: b.section,
        });
        return result;
      } catch (err: any) {
        console.error("[srs ai-generate]", err);
        set.status = 500;
        return {
          error: "AI_GENERATE_ERROR",
          message: err.message ?? "Gagal generate section SRS",
        };
      }
    },
    {
      body: t.Object({
        section: t.String(), // validasi string saja, enum check di service
      }),
    },
  );
