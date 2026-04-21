import { redirect } from "next/navigation";

export default async function JoinTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;

  if (!invite) {
    redirect("/home");
  }

  redirect(`/home?invite=${encodeURIComponent(invite)}`);
}
