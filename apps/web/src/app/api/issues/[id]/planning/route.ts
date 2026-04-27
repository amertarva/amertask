import { NextRequest, NextResponse } from "next/server";
import {
  BACKEND_URL,
  safeJson,
  forwardAuth,
  guardBackendUrl,
} from "@/app/api/_lib/proxy";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = guardBackendUrl(req);
  if (guardError) {
    console.error("❌ Guard error:", guardError);
    return NextResponse.json(guardError, { status: 502 });
  }

  const { id } = await params;
  const method = req.method;

  console.log(`📋 Planning ${method} request for issue: ${id}`);
  console.log(`🔗 Backend URL: ${BACKEND_URL}/issues/${id}/planning`);

  try {
    let body: unknown = undefined;
    if (method === "POST") {
      try {
        body = await req.json();
        console.log(`📦 Request body:`, body);
      } catch (e) {
        console.error("❌ Failed to parse request body:", e);
        return NextResponse.json(
          { error: "INVALID_BODY", message: "Request body tidak valid" },
          { status: 400 },
        );
      }
    }

    const res = await fetch(`${BACKEND_URL}/issues/${id}/planning`, {
      method: method,
      headers: {
        ...forwardAuth(req),
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    console.log(`📡 Backend response: ${res.status} ${res.statusText}`);
    console.log(`📄 Content-Type: ${res.headers.get("content-type")}`);

    const data = await safeJson(res);

    console.log(
      `✅ Data parsed:`,
      typeof data === "object" ? Object.keys(data as object) : typeof data,
    );

    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Planning proxy error:", errorMessage);
    console.error("Stack:", err instanceof Error ? err.stack : "N/A");

    return NextResponse.json(
      { error: "NETWORK_ERROR", message: errorMessage },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
