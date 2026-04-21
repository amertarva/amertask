import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getTeamsFromUsersMe(authHeader: string) {
  try {
    const meResponse = await fetch(`${BACKEND_URL}/users/me`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!meResponse.ok) {
      return null;
    }

    const me = await meResponse.json();
    const fallbackTeams = Array.isArray(me?.teams) ? me.teams : [];

    return fallbackTeams;
  } catch (fallbackError) {
    console.warn("⚠️ /users/me fallback failed in /api/teams", fallbackError);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
        { status: 401 },
      );
    }

    console.log("📋 Fetching user teams...");

    let response: Response;

    try {
      response = await fetch(`${BACKEND_URL}/teams`, {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: authHeader,
        },
      });
    } catch (networkError) {
      console.error("❌ Network error fetching /teams:", networkError);

      const fallbackTeams = await getTeamsFromUsersMe(authHeader);
      if (fallbackTeams && fallbackTeams.length > 0) {
        console.log(
          "✅ Using fallback teams from /users/me after /teams network error:",
          {
            count: fallbackTeams.length,
          },
        );
        return NextResponse.json(fallbackTeams, { status: 200 });
      }

      return NextResponse.json(
        {
          error: "BACKEND_UNAVAILABLE",
          message: "Gagal terhubung ke layanan tim. Coba beberapa saat lagi.",
        },
        { status: 503 },
      );
    }

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
    } catch {
      console.error("❌ Failed to parse response as JSON:", text);

      const fallbackTeams = await getTeamsFromUsersMe(authHeader);
      if (fallbackTeams && fallbackTeams.length > 0) {
        console.log(
          "✅ Using fallback teams from /users/me after non-JSON /teams response:",
          {
            count: fallbackTeams.length,
          },
        );
        return NextResponse.json(fallbackTeams, { status: 200 });
      }

      return NextResponse.json(
        {
          error: "BACKEND_ERROR",
          message: "Backend error: " + text.substring(0, 100),
        },
        { status: 500 },
      );
    }

    if (!response.ok) {
      if (response.status >= 500) {
        const fallbackTeams = await getTeamsFromUsersMe(authHeader);
        if (fallbackTeams && fallbackTeams.length > 0) {
          console.log(
            "✅ Using fallback teams from /users/me after /teams 5xx:",
            {
              count: fallbackTeams.length,
            },
          );
          return NextResponse.json(fallbackTeams, { status: 200 });
        }
      }

      return NextResponse.json(data, { status: response.status });
    }

    // Fallback safety: some backend states can return empty /teams even when /users/me still has team links.
    if (Array.isArray(data) && data.length === 0) {
      const fallbackTeams = await getTeamsFromUsersMe(authHeader);

      if (fallbackTeams && fallbackTeams.length > 0) {
        console.log("✅ Using fallback teams from /users/me:", {
          count: fallbackTeams.length,
        });
        return NextResponse.json(fallbackTeams, { status: 200 });
      }
    }

    console.log("✅ Teams fetched:", { count: data.length || 0 });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("❌ Get teams API error:", error);
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    if (!authHeader) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token tidak ditemukan" },
        { status: 401 },
      );
    }

    const response = await fetch(`${BACKEND_URL}/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Create team API error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
