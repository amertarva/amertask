import { supabase, supabaseAnon } from "../../lib/supabase";
import { verifyPassword } from "./password.service";
import { signAccessToken, signRefreshToken } from "./jwt.service";

export interface LoginPayload {
  email: string;
  password: string;
}

export async function loginUser(payload: LoginPayload) {
  const { email, password } = payload;

  console.log("Login attempt:", { email });

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    console.error("Supabase auth error:", error);
    const err = new Error("Email atau password salah") as any;
    err.statusCode = 401;
    throw err;
  }

  console.log("Supabase auth success, fetching user profile...");

  // @ts-ignore - Supabase type inference issue
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
    console.log("Login successful (by ID):", {
      userId: userById.id,
      name: userById.name,
    });
    return userById;
  }

  console.log("User profile not found by ID, trying by email...", {
    userId: data.user.id,
    error: userByIdError,
  });

  // @ts-ignore - Supabase type inference issue
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
      console.warn("User ID mismatch detected (profile vs auth):", {
        authUserId: data.user.id,
        profileUserId: userByEmail.id,
        email,
      });
    }

    console.log("Login successful (by email):", {
      userId: data.user.id,
      name: userByEmail.name,
    });

    return {
      ...userByEmail,
      id: data.user.id,
    };
  }

  console.log("User profile not found by email either, creating new...", {
    error: userByEmailError,
  });

  const { data: newUser, error: createError } = (await supabase
    .from("users")
    // @ts-ignore - Supabase type inference issue
    .insert({
      id: data.user.id,
      name: data.user.email?.split("@")[0] || "User",
      email: data.user.email!,
    })
    .select()
    .maybeSingle()) as any;

  if (createError) {
    console.error("Failed to create user profile:", createError);

    // @ts-ignore - Supabase type inference issue
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
      console.log("Found existing user on retry:", {
        userId: finalUser.id,
        name: finalUser.name,
      });
      return finalUser;
    }

    throw new Error(`Gagal membuat profil user: ${createError.message}`);
  }

  if (!newUser) {
    throw new Error("Gagal membuat profil user: No data returned");
  }

  console.log("User profile created:", {
    userId: newUser.id,
    name: newUser.name,
  });
  return newUser;
}
