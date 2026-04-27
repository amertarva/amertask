import { supabase } from "../../lib/supabase";
import { errors } from "../../lib/errors";
import { resolveExistingUserId } from "../../lib/userIdentity";

export async function getUserById(userId: string, email?: string) {
  const resolvedUserId = await resolveExistingUserId(userId, email);

  console.log("👤 Getting user profile:", {
    userId,
    email,
    resolvedUserId,
  });

  // @ts-ignore - Supabase type inference issue
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", resolvedUserId)
    .maybeSingle<{
      id: string;
      name: string;
      email: string;
      avatar: string | null;
      initials: string;
      created_at: string;
      updated_at: string;
    }>();

  if (error) {
    console.error("❌ Error fetching user:", error);
    throw errors.internal(`Gagal mengambil user: ${error.message}`);
  }

  if (!user) {
    console.error("❌ User not found:", {
      userId,
      email,
      resolvedUserId,
    });
    throw errors.notFound("User tidak ditemukan");
  }

  console.log("User found:", { userId: user.id, name: user.name });
  return user;
}

export async function updateUserProfile(
  userId: string,
  updates: { name?: string; avatar?: string },
  email?: string,
) {
  const resolvedUserId = await resolveExistingUserId(userId, email);

  console.log("✏️ Updating user profile:", {
    userId,
    email,
    resolvedUserId,
    updates,
  });

  const { data, error } = (await supabase
    .from("users")
    // @ts-ignore - Supabase type inference issue
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resolvedUserId)
    .select()
    .maybeSingle()) as any;

  if (error) {
    console.error("❌ Error updating user:", error);
    throw errors.internal(`Gagal update user: ${error.message}`);
  }

  if (!data) {
    throw errors.notFound("User tidak ditemukan");
  }

  console.log("✅ User updated:", { userId: data.id, name: data.name });
  return data;
}
