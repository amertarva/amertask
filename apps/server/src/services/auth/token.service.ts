import { supabase } from "../../lib/supabase";

export async function saveRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date,
) {
  // @ts-ignore - Supabase type inference issue
  const { error } = (await supabase.from("refresh_tokens").insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  })) as any;

  if (error) {
    throw new Error("Gagal menyimpan refresh token");
  }
}

export async function verifyRefreshToken(token: string) {
  const { data, error } = (await supabase
    .from("refresh_tokens")
    .select("*")
    .eq("token", token)
    .eq("revoked", false)
    .single()) as any;

  if (error || !data) {
    const err = new Error("Refresh token tidak valid") as any;
    err.statusCode = 401;
    throw err;
  }

  if (new Date(data.expires_at) < new Date()) {
    const err = new Error("Refresh token kedaluwarsa") as any;
    err.statusCode = 401;
    throw err;
  }

  return data;
}

export async function revokeRefreshToken(token: string) {
  const { error } = (await supabase
    .from("refresh_tokens")
    // @ts-ignore - Supabase type inference issue
    .update({ revoked: true })
    .eq("token", token)) as any;

  if (error) {
    throw new Error("Gagal revoke refresh token");
  }
}
