import { supabase, supabaseAnon } from "../lib/supabase";
import { errors } from "../lib/errors";

export const authService = {
  async register(name: string, email: string, password: string) {
    console.log("📝 Register attempt:", { name, email });

    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle<{ id: string }>();

    if (existing) {
      console.log("⚠️ Email already exists:", email);
      throw errors.conflict("Email sudah terdaftar");
    }

    // Create auth user
    console.log("🔧 Creating auth user...");
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      console.error("❌ Failed to create auth user:", authError);
      throw errors.internal(
        `Gagal membuat akun: ${authError?.message || "Unknown error"}`,
      );
    }

    console.log("✅ Auth user created:", { userId: authData.user.id });

    // Create user profile
    console.log("🔧 Creating user profile...");
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        name,
        email,
      })
      .select()
      .maybeSingle<{
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        initials: string;
      }>();

    if (userError) {
      console.error("❌ Failed to create user profile:", userError);

      // Rollback auth user
      console.log("🔄 Rolling back auth user...");
      await supabase.auth.admin.deleteUser(authData.user.id);

      throw errors.internal(
        `Gagal membuat user profile: ${userError.message}. Hint: Check RLS policies on users table.`,
      );
    }

    if (!user) {
      console.error("❌ User profile creation returned no data");
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw errors.internal("Gagal membuat user profile: No data returned");
    }

    console.log("✅ User profile created:", {
      userId: user.id,
      name: user.name,
    });
    return user;
  },

  async login(email: string, password: string) {
    console.log("🔐 Login attempt:", { email });

    // Use anon client for password sign-in so service-role query client remains stateless.
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error("❌ Supabase auth error:", error);
      throw errors.unauthorized("Email atau password salah");
    }

    console.log("✅ Supabase auth success, fetching user profile...");

    // Try to get user profile by ID first
    const { data: userById, error: userByIdError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle<{
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        initials: string;
      }>();

    if (userById) {
      console.log("✅ Login successful (by ID):", {
        userId: userById.id,
        name: userById.name,
      });
      return userById;
    }

    console.log("⚠️ User profile not found by ID, trying by email...", {
      userId: data.user.id,
      error: userByIdError,
    });

    // Try to find by email (in case of ID mismatch)
    const { data: userByEmail, error: userByEmailError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle<{
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        initials: string;
      }>();

    if (userByEmail) {
      if (userByEmail.id !== data.user.id) {
        console.warn("⚠️ User ID mismatch detected (profile vs auth):", {
          authUserId: data.user.id,
          profileUserId: userByEmail.id,
          email,
        });
      }

      console.log("✅ Login successful (by email):", {
        userId: data.user.id,
        name: userByEmail.name,
      });

      // Always return auth user ID as canonical token subject.
      return {
        ...userByEmail,
        id: data.user.id,
      };
    }

    console.log("⚠️ User profile not found by email either, creating new...", {
      error: userByEmailError,
    });

    // Auto-create profile if missing
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: data.user.id,
        name: data.user.email?.split("@")[0] || "User",
        email: data.user.email!,
      })
      .select()
      .maybeSingle<{
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        initials: string;
      }>();

    if (createError) {
      console.error("❌ Failed to create user profile:", createError);

      // Last attempt: try to fetch again in case it was created by another process
      const { data: finalUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle<{
          id: string;
          name: string;
          email: string;
          avatar: string | null;
          initials: string;
        }>();

      if (finalUser) {
        console.log("✅ Found existing user on retry:", {
          userId: finalUser.id,
          name: finalUser.name,
        });
        return finalUser;
      }

      throw errors.internal(
        `Gagal membuat profil user: ${createError.message}`,
      );
    }

    if (!newUser) {
      throw errors.internal("Gagal membuat profil user: No data returned");
    }

    console.log("✅ User profile created:", {
      userId: newUser.id,
      name: newUser.name,
    });
    return newUser;
  },

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    const { error } = await supabase.from("refresh_tokens").insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      throw errors.internal("Gagal menyimpan refresh token");
    }
  },

  async verifyRefreshToken(token: string) {
    const { data, error } = await supabase
      .from("refresh_tokens")
      .select("*")
      .eq("token", token)
      .eq("revoked", false)
      .single();

    if (error || !data) {
      throw errors.unauthorized("Refresh token tidak valid");
    }

    if (new Date(data.expires_at) < new Date()) {
      throw errors.unauthorized("Refresh token kedaluwarsa");
    }

    return data;
  },

  async revokeRefreshToken(token: string) {
    const { error } = await supabase
      .from("refresh_tokens")
      .update({ revoked: true })
      .eq("token", token);

    if (error) {
      throw errors.internal("Gagal revoke refresh token");
    }
  },
};
