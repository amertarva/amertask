import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> },
) {
  try {
    const { teamSlug } = await params;
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const body = await request.json();

    console.log("[AI Generate] Proxying to backend:", `${API_URL}/teams/${teamSlug}/requirements/ai-generate`);
    console.log("[AI Generate] Request body:", JSON.stringify(body));

    const response = await fetch(
      `${API_URL}/teams/${teamSlug}/requirements/ai-generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
      },
    );

    console.log("[AI Generate] Backend response status:", response.status);

    // Pass through the backend response as-is (preserving status and body)
    const responseText = await response.text();
    console.log("[AI Generate] Backend response body:", responseText);

    // Try to parse as JSON and forward
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch {
      // If not JSON, wrap it
      return NextResponse.json(
        { error: "Backend returned non-JSON response", details: responseText },
        { status: response.status },
      );
    }
  } catch (error) {
    console.error("[AI Generate] Proxy error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
