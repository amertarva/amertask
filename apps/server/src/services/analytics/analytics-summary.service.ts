export function calcSummary(issues: any[]) {
  return {
    totalIssues: issues.length,
    openIssues: issues.filter((i) =>
      ["backlog", "todo", "bug"].includes(i.status),
    ).length,
    inProgress: issues.filter((i) => i.status === "in_progress").length,
    completed: issues.filter((i) => i.status === "done").length,
    cancelled: issues.filter((i) => i.status === "cancelled").length,
  };
}

export function calcByStatus(issues: any[]) {
  const statusCounts = [
    { status: "backlog", count: 0 },
    { status: "todo", count: 0 },
    { status: "in_progress", count: 0 },
    { status: "in_review", count: 0 },
    { status: "bug", count: 0 },
    { status: "done", count: 0 },
    { status: "cancelled", count: 0 },
  ];

  for (const issue of issues) {
    const found = statusCounts.find((s) => s.status === issue.status);
    if (found) found.count++;
  }

  return statusCounts;
}

export function calcByPriority(issues: any[]) {
  const priorityCounts = [
    { priority: "urgent", count: 0 },
    { priority: "high", count: 0 },
    { priority: "medium", count: 0 },
    { priority: "low", count: 0 },
  ];

  for (const issue of issues) {
    const found = priorityCounts.find((p) => p.priority === issue.priority);
    if (found) found.count++;
  }

  return priorityCounts;
}
