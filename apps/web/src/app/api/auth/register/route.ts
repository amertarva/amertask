import { NextRequest, NextResponse } from "next/server";
import { guardBackendUrl, fetchBackend, safeJson } from "@/app/api/_lib/proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const configError = guardBackendUrl(request);
  if (configError) {
    return NextResponse.json(configError, { status: 503 });
  }

  try {
    const body = await request.json();

    // Validate input
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Nama, email, dan password harus diisi",
        },
        { status: 400 },
      );
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "Password minimal 8 karakter",
        },
        { status: 400 },
      );
    }

    console.log("📝 Register request:", {
      name: body.name,
      email: body.email,
    });

    const response = await fetchBackend("/auth/register", {
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
    console.error("❌ Register API error:", error);
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
