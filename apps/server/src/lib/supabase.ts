import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

function decodeJwtClaims(token: string): {
  role: string | null;
  ref: string | null;
} {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return { role: null, ref: null };
    }

    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadBase64.padEnd(
      payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
      "=",
    );

    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return {
      role: typeof payload?.role === "string" ? payload.role : null,
      ref: typeof payload?.ref === "string" ? payload.ref : null,
    };
  } catch {
    return { role: null, ref: null };
  }
}

function getSupabaseUrlRef(url: string): string | null {
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

const supabaseKeyClaims = decodeJwtClaims(supabaseServiceKey);
const supabaseUrlRef = getSupabaseUrlRef(supabaseUrl);

if (!supabaseServiceKey) {
  console.warn(
    "⚠️ SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY tidak ditemukan. Query backend dapat terfilter RLS.",
  );
} else if (
  supabaseKeyClaims.role &&
  supabaseKeyClaims.role !== "service_role"
) {
  console.warn(
    `⚠️ Supabase key role terdeteksi '${supabaseKeyClaims.role}', bukan 'service_role'. Query backend dapat terfilter RLS.`,
  );
}

if (
  supabaseKeyClaims.ref &&
  supabaseUrlRef &&
  supabaseKeyClaims.ref !== supabaseUrlRef
) {
  console.warn(
    `⚠️ Supabase URL ref (${supabaseUrlRef}) tidak cocok dengan key ref (${supabaseKeyClaims.ref}). Pastikan URL dan key dari project yang sama.`,
  );
}

// Client dengan service role — bypass RLS, untuk backend usage
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Client dengan anon key — untuk operasi yang perlu RLS
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseServiceKey &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co"
  );
}
