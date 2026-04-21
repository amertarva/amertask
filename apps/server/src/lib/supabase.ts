import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const runningInProduction = process.env.NODE_ENV === "production";

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

function createThrowingClient(label: "service" | "anon", error: Error) {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(`[supabase:${label}] ${error.message}`);
      },
    },
  ) as ReturnType<typeof createClient>;
}

function getSupabaseEnvIssues(): string[] {
  const issues: string[] = [];

  if (!supabaseUrl) {
    issues.push("SUPABASE_URL tidak ditemukan");
  }

  if (!supabaseServiceKey) {
    issues.push(
      "SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY tidak ditemukan",
    );
  }

  if (!supabaseAnonKey) {
    issues.push("SUPABASE_ANON_KEY tidak ditemukan");
  }

  return issues;
}

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
    `Supabase URL ref (${supabaseUrlRef}) tidak cocok dengan key ref (${supabaseKeyClaims.ref}). Pastikan URL dan key dari project yang sama.`,
  );
}

let supabaseInitError: Error | null = null;

const supabaseEnvIssues = getSupabaseEnvIssues();
if (supabaseEnvIssues.length > 0) {
  const envError = new Error(
    `[supabase] Environment variables tidak lengkap: ${supabaseEnvIssues.join(", ")}`,
  );

  if (runningInProduction) {
    supabaseInitError = envError;
    console.error(envError.message);
  } else {
    console.warn(envError.message);
  }
}

let serviceClient: ReturnType<typeof createClient>;
let anonClient: ReturnType<typeof createClient>;

if (runningInProduction && supabaseEnvIssues.length > 0) {
  const initError =
    supabaseInitError ??
    new Error(
      `[supabase] Environment variables tidak lengkap: ${supabaseEnvIssues.join(", ")}`,
    );

  supabaseInitError = initError;
  serviceClient = createThrowingClient("service", initError);
  anonClient = createThrowingClient("anon", initError);
} else {
  try {
    // Client dengan service role — bypass RLS, untuk backend usage
    serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Client dengan anon key — untuk operasi yang perlu RLS
    anonClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    supabaseInitError = normalizedError;

    console.error("❌ [supabase:init]", normalizedError.message);

    serviceClient = createThrowingClient("service", normalizedError);
    anonClient = createThrowingClient("anon", normalizedError);
  }
}

export const supabase = serviceClient;
export const supabaseAnon = anonClient;

export function getSupabaseInitError(): Error | null {
  return supabaseInitError;
}

export function getSupabaseHealth() {
  return {
    configured: !supabaseInitError && supabaseEnvIssues.length === 0,
    missing: supabaseEnvIssues,
  };
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return getSupabaseHealth().configured;
}
