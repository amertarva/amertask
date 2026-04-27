export function calcByAssignee(issues: any[]) {
  const assigneeMap = new Map<
    string,
    { name: string; initials: string; avatar?: string; count: number }
  >();

  for (const issue of issues) {
    if (!issue.assignee_id || !issue.assignee) continue;
    const a = issue.assignee as any;
    const existing = assigneeMap.get(issue.assignee_id);
    if (existing) {
      existing.count++;
    } else {
      assigneeMap.set(issue.assignee_id, {
        name: a.name,
        initials: a.initials,
        avatar: a.avatar,
        count: 1,
      });
    }
  }

  return Array.from(assigneeMap.entries()).map(([userId, d]) => ({
    userId,
    ...d,
  }));
}
