import { Elysia, t } from "elysia";
import { verifyJWT } from "../lib/jwt";
import {
  rescheduleFromTask,
  addDependency,
  removeDependency,
} from "../services/scheduling/scheduling.service";
import { supabase } from "../lib/supabase";

// Type untuk issue dengan relasi
type IssueWithRelations = {
  id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  assignee: { name: string; initials: string; avatar?: string } | null;
  planning: {
    start_date: string;
    due_date: string;
    estimated_hours: number;
  } | null;
};

type Team = {
  id: string;
};

export const schedulingRoutes = new Elysia({ prefix: "/teams/:teamSlug" })

  // GET /teams/:teamSlug/graph — ambil semua tasks + dependencies untuk graph
  .get("/graph", async ({ params, headers, set }) => {
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

    const teamQuery = await supabase
      .from("teams")
      .select("id")
      .eq("slug", params.teamSlug)
      .maybeSingle();

    const team = teamQuery.data as Team | null;

    if (!team) {
      set.status = 404;
      return { error: "NOT_FOUND", message: "Team tidak ditemukan" };
    }

    try {
      // STRATEGI BARU: Ambil dari issue_planning yang sudah linked ke issues
      // Status backlog di issues TIDAK mempengaruhi tampilan graph/gantt
      // Selama ada di issue_planning dengan issue_id, maka akan ditampilkan
      const { data: planningData, error: planningError } = await supabase
        .from("issue_planning")
        .select(
          `
          issue_id,
          start_date,
          due_date,
          estimated_hours,
          issues:issue_id (
            id,
            number,
            title,
            status,
            priority,
            team_id,
            assignee:users!issues_assignee_id_fkey(name, initials, avatar)
          )
        `,
        )
        .not("issue_id", "is", null);

      console.log("[Graph] Planning query result:", {
        count: planningData?.length ?? 0,
        error: planningError,
      });

      if (planningError) {
        throw new Error(planningError.message);
      }

      // Filter hanya yang team_id sesuai dan flatten structure
      const nodes = (planningData ?? [])
        .filter((p: any) => p.issues?.team_id === team.id)
        .map((p: any) => ({
          id: p.issues.id,
          number: p.issues.number,
          title: p.issues.title,
          status: p.issues.status,
          priority: p.issues.priority,
          assignee: p.issues.assignee,
          start_date: p.start_date,
          due_date: p.due_date,
          estimated_hours: p.estimated_hours ?? 0,
        }));

      console.log("[Graph] Final nodes:", nodes.length);

      if (nodes.length === 0) {
        return { nodes: [], edges: [] };
      }

      const issueIds = nodes.map((n: any) => n.id);
      const { data: deps } = await supabase
        .from("issue_dependencies")
        .select("issue_id, depends_on, type, lag_days")
        .in("issue_id", issueIds);

      console.log("[Graph] Dependencies:", deps?.length ?? 0);

      return { nodes, edges: deps ?? [] };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Internal error";
      set.status = 500;
      return { error: "INTERNAL_ERROR", message: errorMessage };
    }
  })

  // POST /teams/:teamSlug/schedule — reschedule task dan propagasi ke dependen
  .post(
    "/schedule",
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

      const teamQuery = await supabase
        .from("teams")
        .select("id")
        .eq("slug", params.teamSlug)
        .maybeSingle();

      const team = teamQuery.data as Team | null;

      if (!team) {
        set.status = 404;
        return { error: "NOT_FOUND" };
      }

      try {
        const b = body as {
          taskId: string;
          startDate: string;
          dueDate: string;
        };
        const output = await rescheduleFromTask({
          teamId: team.id,
          changedTaskId: b.taskId,
          newStartDate: new Date(b.startDate),
          newDueDate: new Date(b.dueDate),
        });
        return output;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Schedule conflict";
        set.status = 422;
        return { error: "SCHEDULE_CONFLICT", message: errorMessage };
      }
    },
    {
      body: t.Object({
        taskId: t.String(),
        startDate: t.String(), // ISO date string
        dueDate: t.String(),
      }),
    },
  )

  // POST /teams/:teamSlug/dependencies — tambah dependency
  .post(
    "/dependencies",
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
          issueId: string;
          dependsOnId: string;
          lagDays?: number;
        };
        await addDependency(b.issueId, b.dependsOnId, b.lagDays ?? 0);
        return { message: "Dependency berhasil ditambahkan" };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Dependency error";
        set.status = 422;
        return { error: "DEPENDENCY_ERROR", message: errorMessage };
      }
    },
    {
      body: t.Object({
        issueId: t.String(),
        dependsOnId: t.String(),
        lagDays: t.Optional(t.Number()),
      }),
    },
  )

  // DELETE /teams/:teamSlug/dependencies — hapus dependency
  .delete(
    "/dependencies",
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
        const b = body as { issueId: string; dependsOnId: string };
        await removeDependency(b.issueId, b.dependsOnId);
        return { message: "Dependency berhasil dihapus" };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Internal error";
        set.status = 500;
        return { error: "INTERNAL_ERROR", message: errorMessage };
      }
    },
    {
      body: t.Object({
        issueId: t.String(),
        dependsOnId: t.String(),
      }),
    },
  );
