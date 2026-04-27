import { supabase } from "../../lib/supabase";

export async function logoutUser(refreshToken: string): Promise<void> {
  const { error } = (await supabase
    .from("refresh_tokens")
    // @ts-ignore - Supabase type inference issue
    .update({ revoked: true })
    .eq("token", refreshToken)) as any;

  if (error) {
    console.error("Failed to revoke refresh token:", error);
  }
}
