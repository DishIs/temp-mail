// app/api/health/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";          // fast, Worker-friendly
export const dynamic = "force-static";  // no re-render drama

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "freecustom-email",
      timestamp: Date.now()
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60"
      }
    }
  );
}

// Optional: some monitors use HEAD
export async function HEAD() {
  return new Response(null, { status: 200 });
}
