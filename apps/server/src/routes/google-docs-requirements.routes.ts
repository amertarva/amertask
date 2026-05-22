import { Elysia, t } from "elysia";
import { verifyJWT } from "../lib/jwt";
import { supabase } from "../lib/supabase";
import {
  copyRequirementsToGoogleDocs,
  copySrsToGoogleDocs,
  getRequirementsGoogleDocsUrl,
  getSrsGoogleDocsUrl,
} from "../services/google-docs.service";

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

export const googleDocsRequirementsRoutes = new Elysia({
  prefix: "/teams/:teamSlug",
})

  // ============================================================================
  // Requirements Google Docs Routes
  // ============================================================================

  // GET /teams/:slug/requirements/google-docs — get current Google Docs URL
  .get("/requirements/google-docs", async ({ params, headers, set }) => {
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
      const googleDocsUrl = await getRequirementsGoogleDocsUrl(team.id);
      return {
        success: true,
        data: { googleDocsUrl },
      };
    } catch (err: any) {
      set.status = 500;
      return {
        success: false,
        message: "Gagal mengambil URL Google Docs requirements",
        error: err.message,
      };
    }
  })

  // POST /teams/:slug/requirements/google-docs/copy — copy to Google Docs
  .post(
    "/requirements/google-docs/copy",
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
        const result = await copyRequirementsToGoogleDocs(
          team.id,
          b.googleDocsUrl,
        );

        return {
          success: true,
          message: result.isNewUrl
            ? "Requirements berhasil disalin ke Google Docs dan URL disimpan"
            : "Requirements berhasil disalin ke Google Docs",
          data: result,
        };
      } catch (err: any) {
        set.status = 400;
        return {
          success: false,
          message: err.message,
          error: err.message,
        };
      }
    },
    {
      body: t.Object({
        googleDocsUrl: t.Optional(t.String()),
      }),
    },
  )

  // ============================================================================
  // SRS Google Docs Routes
  // ============================================================================

  // GET /teams/:slug/srs/google-docs — get current Google Docs URL
  .get("/srs/google-docs", async ({ params, headers, set }) => {
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
      const googleDocsUrl = await getSrsGoogleDocsUrl(team.id);
      return {
        success: true,
        data: { googleDocsUrl },
      };
    } catch (err: any) {
      set.status = 500;
      return {
        success: false,
        message: "Gagal mengambil URL Google Docs SRS",
        error: err.message,
      };
    }
  })

  // POST /teams/:slug/srs/google-docs/copy — copy to Google Docs
  .post(
    "/srs/google-docs/copy",
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
        const result = await copySrsToGoogleDocs(team.id, b.googleDocsUrl);

        return {
          success: true,
          message: result.isNewUrl
            ? "SRS berhasil disalin ke Google Docs dan URL disimpan"
            : "SRS berhasil disalin ke Google Docs",
          data: result,
        };
      } catch (err: any) {
        set.status = 400;
        return {
          success: false,
          message: err.message,
          error: err.message,
        };
      }
    },
    {
      body: t.Object({
        googleDocsUrl: t.Optional(t.String()),
      }),
    },
  );
