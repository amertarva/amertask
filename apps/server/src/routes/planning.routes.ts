import { Elysia, t } from "elysia";
import { verifyJWT } from "../lib/jwt";
import { supabase } from "../lib/supabase";

export const planningRoutes = new Elysia({ prefix: "/issues/:id" })

  // POST /issues/:id/planning — upsert planning data
  .post(
    "/planning",
    async ({ params, body, headers, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "UNAUTHORIZED" };
      }

      try {
        await verifyJWT(authHeader.slice(7));
      } catch {
        set.status = 401;
        return { error: "UNAUTHORIZED" };
      }

      try {
        const b = body as {
          start_date?: string;
          due_date?: string;
          estimated_hours?: number;
          plan_info?: string;
          target_user?: string;
        };

        // Fetch existing planning data to merge (avoid overwriting dates/plan_info)
        const { data: existing } = await supabase
          .from("issue_planning")
          .select("*")
          .eq("issue_id", params.id)
          .maybeSingle();

        const existingData = (existing as unknown as Record<string, any>) || {};

        // Merge: only update fields that are explicitly provided in the request body
        const mergedData: Record<string, any> = {
          issue_id: params.id,
          start_date: b.start_date !== undefined ? (b.start_date || null) : (existingData.start_date || null),
          due_date: b.due_date !== undefined ? (b.due_date || null) : (existingData.due_date || null),
          estimated_hours: b.estimated_hours !== undefined ? (b.estimated_hours || 0) : (existingData.estimated_hours || 0),
          plan_info: b.plan_info !== undefined ? (b.plan_info || null) : (existingData.plan_info || null),
          target_user: b.target_user !== undefined ? (b.target_user || null) : (existingData.target_user || null),
          updated_at: new Date().toISOString(),
        };

        // Upsert planning data (merge preserves existing values)
        const { data, error } = await supabase
          .from("issue_planning")
          .upsert(
            mergedData as never,
            { onConflict: "issue_id" },
          )
          .select()
          .single();

        if (error) throw new Error(error.message);

        return data;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Internal error";
        set.status = 500;
        return { error: "INTERNAL_ERROR", message: errorMessage };
      }
    },
    {
      body: t.Object({
        start_date: t.Optional(t.String()),
        due_date: t.Optional(t.String()),
        estimated_hours: t.Optional(t.Number()),
        plan_info: t.Optional(t.String()),
        target_user: t.Optional(t.String()),
      }),
    },
  )

  // GET /issues/:id/planning — get planning data
  .get("/planning", async ({ params, headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "UNAUTHORIZED" };
    }

    try {
      await verifyJWT(authHeader.slice(7));
    } catch {
      set.status = 401;
      return { error: "UNAUTHORIZED" };
    }

    try {
      const { data, error } = await supabase
        .from("issue_planning")
        .select("*")
        .eq("issue_id", params.id)
        .maybeSingle();

      if (error) throw new Error(error.message);

      return data;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Internal error";
      set.status = 500;
      return { error: "INTERNAL_ERROR", message: errorMessage };
    }
  })

  // DELETE /issues/:id/planning — delete planning data
  .delete("/planning", async ({ params, headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "UNAUTHORIZED" };
    }

    try {
      await verifyJWT(authHeader.slice(7));
    } catch {
      set.status = 401;
      return { error: "UNAUTHORIZED" };
    }

    try {
      const { error } = await supabase
        .from("issue_planning")
        .delete()
        .eq("issue_id", params.id);

      if (error) throw new Error(error.message);

      return { message: "Planning data berhasil dihapus" };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Internal error";
      set.status = 500;
      return { error: "INTERNAL_ERROR", message: errorMessage };
    }
  });
