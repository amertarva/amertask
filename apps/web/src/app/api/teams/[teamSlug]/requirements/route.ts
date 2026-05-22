import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  try {
    const { teamSlug } = await params;
    console.log("[Requirements API] GET request for team:", teamSlug);
    console.log("[Requirements API] Backend URL:", API_URL);

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const url = new URL(`${API_URL}/teams/${teamSlug}/requirements`);
    if (type) url.searchParams.set("type", type);

    console.log("[Requirements API] Fetching from:", url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    console.log("[Requirements API] Backend response status:", response.status);

    // Pass through backend response as-is
    const responseText = await response.text();
    console.log("[Requirements API] Backend response body:", responseText.substring(0, 200));

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json(
        { error: "Backend returned non-JSON", message: responseText.substring(0, 200) },
        { status: response.status },
      );
    }
  } catch (error) {
    console.error("[Requirements API] Proxy error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  try {
    const { teamSlug } = await params;
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const body = await request.json();

    const response = await fetch(
      `${API_URL}/teams/${teamSlug}/requirements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
      },
    );

    // Pass through backend response as-is
    const responseText = await response.text();
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json(
        { error: "Backend returned non-JSON", message: responseText.substring(0, 200) },
        { status: response.status },
      );
    }
  } catch (error) {
    console.error("Error in requirements POST:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
