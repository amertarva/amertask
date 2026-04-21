import { TeamOverviewDashboard } from "@/components/dashboard/overview/TeamOverviewDashboard";

export default async function TeamOverview({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  return <TeamOverviewDashboard teamSlug={teamSlug} />;
}
