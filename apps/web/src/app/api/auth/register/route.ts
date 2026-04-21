import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
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
      backendUrl: BACKEND_URL,
    });

    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Get response text first to handle non-JSON responses
    const text = await response.text();
    console.log("📥 Backend raw response:", {
      status: response.status,
      contentType: response.headers.get("content-type"),
      body: text.substring(0, 200),
    });

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Failed to parse response as JSON:", text);
      return NextResponse.json(
        {
          error: "BACKEND_ERROR",
          message: "Backend error: " + text.substring(0, 100),
        },
        { status: 500 },
      );
    }

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
      { status: 500 },
    );
  }
}
