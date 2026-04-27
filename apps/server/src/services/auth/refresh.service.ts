import { supabase } from "../../lib/supabase";
import { verifyToken, signAccessToken, signRefreshToken } from "./jwt.service";

export async function refreshTokens(oldRefreshToken: string) {
  // 1. Verifikasi token tidak expired
  const payload = await verifyToken(oldRefreshToken);

  // 2. Cek token ada di DB dan belum direvoke
  const { data: tokenRow, error } = await supabase
    .from("refresh_tokens")
    .select("*")
    .eq("token", oldRefreshToken)
    .eq("revoked", false)
    .maybeSingle();

  if (error || !tokenRow) {
    const err = new Error(
      "Refresh token tidak valid atau sudah direvoke",
    ) as any;
    err.statusCode = 401;
    throw err;
  }

  // 3. Revoke token lama (rotation)
  const { error: revokeError } = (await supabase
    .from("refresh_tokens")
    // @ts-ignore - Supabase type inference issue
    .update({ revoked: true })
    .eq("id", (tokenRow as any).id)) as any;

  if (revokeError) {
    console.error("Failed to revoke old refresh token:", revokeError);
  }

  // 4. Ambil data user
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name")
    .eq("id", payload.sub)
    .maybeSingle();

  if (!profile) {
    const err = new Error("User tidak ditemukan") as any;
    err.statusCode = 401;
    throw err;
  }

  // 5. Generate tokens baru
  const newAccessToken = await signAccessToken({
    sub: (profile as any).id,
    email: (profile as any).email,
    name: (profile as any).name,
  });
  const newRefreshToken = await signRefreshToken((profile as any).id);

  // 6. Simpan refresh token baru
  const { error: insertError } = (await supabase.from("refresh_tokens").insert({
    user_id: (profile as any).id,
    token: newRefreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  } as any)) as any;

  if (insertError) {
    console.error("Failed to save new refresh token:", insertError);
  }

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
