export function calcCompletionTrend(issues: any[]) {
  const completionMap = new Map<
    string,
    { date: string; created: number; completed: number }
  >();

  for (const issue of issues) {
    if (!issue.created_at || typeof issue.created_at !== "string") {
      continue;
    }

    const date = issue.created_at.split("T")[0];
    if (!completionMap.has(date)) {
      completionMap.set(date, { date, created: 0, completed: 0 });
    }
    completionMap.get(date)!.created++;

    if (issue.status === "done") {
      completionMap.get(date)!.completed++;
    }
  }

  return Array.from(completionMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
