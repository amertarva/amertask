import { supabase } from "../../lib/supabase";
import { hashPassword } from "./password.service";
import { signAccessToken, signRefreshToken } from "./jwt.service";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload) {
  const { name, email, password } = payload;

  console.log("📝 Register attempt:", { name, email });

  // 1. Cek email sudah terdaftar
  // @ts-ignore - Supabase type inference issue
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    console.log("Email already exists:", email);
    const err = new Error("Email sudah terdaftar") as any;
    err.statusCode = 409;
    throw err;
  }

  // 2. Hash password
  const hashedPassword = await hashPassword(password);

  // 3. Insert ke auth.users via Supabase Admin
  console.log("Creating auth user...");
  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: hashedPassword,
      email_confirm: true,
    });

  if (authError || !authUser.user) {
    console.error("Failed to create auth user:", authError);
    throw new Error(
      `Gagal membuat akun: ${authError?.message || "Unknown error"}`,
    );
  }

  console.log("Auth user created:", { userId: authUser.user.id });

  // 4. Insert ke profiles
  console.log("Creating user profile...");
  const { data: profile, error: profileError } = (await supabase
    .from("users")
    // @ts-ignore - Supabase type inference issue
    .insert({
      id: authUser.user.id,
      name,
      email,
    })
    .select()
    .maybeSingle()) as any;

  if (profileError) {
    console.error("Failed to create user profile:", profileError);

    // Rollback auth user
    console.log("Rolling back auth user...");
    await supabase.auth.admin.deleteUser(authUser.user.id);

    throw new Error(
      `Gagal membuat user profile: ${profileError.message}. Hint: Check RLS policies on users table.`,
    );
  }

  if (!profile) {
    console.error("User profile creation returned no data");
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new Error("Gagal membuat user profile: No data returned");
  }

  console.log("User profile created:", {
    userId: profile.id,
    name: profile.name,
  });

  // 5. Generate tokens
  const accessToken = await signAccessToken({ sub: profile.id, email, name });
  const refreshToken = await signRefreshToken(profile.id);

  // 6. Simpan refresh token
  const { error: tokenError } = (await supabase.from("refresh_tokens").insert({
    user_id: profile.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  } as any)) as any;

  if (tokenError) {
    console.error("Failed to save refresh token:", tokenError);
  }

  return { user: profile, accessToken, refreshToken };
}
