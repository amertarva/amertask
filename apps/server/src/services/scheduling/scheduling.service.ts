import { supabase } from "../../lib/supabase";
import { autoSchedule, type TaskNode } from "../../engine/scheduling.engine";

// Types untuk data dari Supabase
type IssueWithPlanning = {
  id: string;
  status: string;
  planning: {
    start_date: string;
    due_date: string;
    estimated_hours: number;
  } | null;
};

type IssueDependency = {
  issue_id: string;
  depends_on: string;
  lag_days: number | null;
};

export async function getTasksWithDependencies(
  teamId: string,
): Promise<Map<string, TaskNode>> {
  // Get issues
  const issuesQuery = await supabase
    .from("issues")
    .select("id, status")
    .eq("team_id", teamId);

  if (issuesQuery.error) throw new Error(issuesQuery.error.message);

  const issues = (issuesQuery.data ?? []) as any[];

  // Get planning data manually
  const issueIds = issues.map((i) => i.id);
  const planningQuery = await supabase
    .from("issue_planning")
    .select("issue_id, start_date, due_date, estimated_hours")
    .in("issue_id", issueIds)
    .not("issue_id", "is", null);

  if (planningQuery.error) throw new Error(planningQuery.error.message);

  // Map planning to issues
  const planningMap = new Map(
    (planningQuery.data as any[])?.map((p) => [p.issue_id, p]) ?? [],
  );

  const issuesWithPlanning = issues.map((issue) => ({
    id: issue.id,
    status: issue.status,
    planning: planningMap.get(issue.id) || null,
  })) as unknown as IssueWithPlanning[];

  const depsQuery = await supabase
    .from("issue_dependencies")
    .select("issue_id, depends_on, lag_days");

  if (depsQuery.error) throw new Error(depsQuery.error.message);

  const deps = (depsQuery.data ?? []) as unknown as IssueDependency[];

  const depsMap = new Map<string, { dependsOn: string; lagDays: number }[]>();
  for (const dep of deps) {
    if (!depsMap.has(dep.issue_id)) depsMap.set(dep.issue_id, []);
    depsMap
      .get(dep.issue_id)!
      .push({ dependsOn: dep.depends_on, lagDays: dep.lag_days ?? 0 });
  }

  const taskMap = new Map<string, TaskNode>();
  for (const issue of issuesWithPlanning) {
    const planning = issue.planning;
    const issueDeps = depsMap.get(issue.id) ?? [];
    taskMap.set(issue.id, {
      id: issue.id,
      // Baca dari issue_planning, bukan dari issues langsung
      startDate: planning?.start_date ? new Date(planning.start_date) : null,
      dueDate: planning?.due_date ? new Date(planning.due_date) : null,
      estimatedHours: planning?.estimated_hours ?? 0,
      status: issue.status,
      dependsOn: issueDeps.map((d) => d.dependsOn),
      lagDays: issueDeps[0]?.lagDays ?? 0,
    });
  }

  return taskMap;
}

export async function rescheduleFromTask(params: {
  teamId: string;
  changedTaskId: string;
  newStartDate: Date;
  newDueDate: Date;
}) {
  const { teamId, changedTaskId, newStartDate, newDueDate } = params;

  // 1. Load semua tasks
  const taskMap = await getTasksWithDependencies(teamId);

  // 2. Jalankan engine
  const output = autoSchedule(taskMap, changedTaskId, newStartDate, newDueDate);

  if (output.conflicts.length > 0) {
    throw new Error(output.conflicts[0].message);
  }

  // 3. Upsert ke issue_planning (bukan update issues langsung)
  for (const r of output.results) {
    const planningData = {
      issue_id: r.taskId,
      start_date: r.newStartDate.toISOString().split("T")[0],
      due_date: r.newDueDate.toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("issue_planning")
      .upsert(planningData as never, { onConflict: "issue_id" });

    if (upsertError) {
      console.error("Error upserting issue_planning:", upsertError);
    }
  }

  return output;
}

export async function addDependency(
  issueId: string,
  dependsOnId: string,
  lagDays = 0,
) {
  // Check circular dependency menggunakan RPC
  const circularCheck = await supabase.rpc("check_circular_dependency", {
    p_issue_id: issueId,
    p_depends_on: dependsOnId,
  } as never); // Type assertion untuk bypass Supabase type issue

  if (circularCheck.data)
    throw new Error(
      "Circular dependency terdeteksi — tidak bisa menambahkan relasi ini",
    );

  const dependencyData = {
    issue_id: issueId,
    depends_on: dependsOnId,
    lag_days: lagDays,
  };

  const { error } = await supabase
    .from("issue_dependencies")
    .insert(dependencyData as never);

  if (error) throw new Error(error.message);
}

export async function removeDependency(issueId: string, dependsOnId: string) {
  const { error } = await supabase
    .from("issue_dependencies")
    .delete()
    .eq("issue_id", issueId)
    .eq("depends_on", dependsOnId);
  if (error) throw new Error(error.message);
}
