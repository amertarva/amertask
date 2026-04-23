import { NextRequest, NextResponse } from "next/server";
import { guardBackendUrl, fetchBackend, safeJson } from "@/app/api/_lib/proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Fail-fast if BACKEND_URL is not configured or looping
  const configError = guardBackendUrl(request);
  if (configError) {
    return NextResponse.json(configError, { status: 503 });
  }

  try {
    const body = await request.json();

    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Email dan password harus diisi",
        },
        { status: 400 },
      );
    }

    console.log("🔐 Login request:", { email: body.email });

    const response = await fetchBackend("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await safeJson(response)) as any;
    console.log("✅ Backend response parsed:", {
      status: response.status,
    });

    console.log("✅ Backend response:", {
      status: response.status,
      hasUser: !!data.user,
      hasToken: !!data.accessToken,
    });

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("❌ Login API error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "Terjadi kesalahan server",
      },
      { status: 502 },
    );
  }
}
