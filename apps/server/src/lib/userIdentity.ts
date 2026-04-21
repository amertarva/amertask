import { supabase } from "./supabase";

async function getUserIdsByEmail(email: string): Promise<string[]> {
  const { data: usersByEmail, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email);

  if (error) {
    console.warn("⚠️ Failed to resolve users by email:", {
      email,
      error: error.message,
    });
    return [];
  }

  return (usersByEmail ?? [])
    .map((user: any) => user?.id)
    .filter((id): id is string => Boolean(id));
}

export async function resolveCandidateUserIds(
  userId: string,
  email?: string,
): Promise<string[]> {
  const ids = new Set<string>();

  if (userId) {
    ids.add(userId);
  }

  if (email) {
    const idsByEmail = await getUserIdsByEmail(email);
    idsByEmail.forEach((id) => ids.add(id));
  }

  return Array.from(ids);
}

export async function resolveExistingUserId(
  userId: string,
  email?: string,
): Promise<string> {
  const { data: userById } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (userById?.id) {
    return userById.id;
  }

  if (email) {
    const idsByEmail = await getUserIdsByEmail(email);
    if (idsByEmail.length > 0) {
      return idsByEmail[0];
    }
  }

  return userId;
}
