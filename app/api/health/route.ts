// app/api/health/route.ts
import { NextResponse } from "next/server";

// keep it boring... boring never breaks builds
export const dynamic = "force-static"; 

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "freecustom-email",
      uptime: process.uptime(), // tiny signal, almost free
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

export async function HEAD() {
  return new Response(null, { status: 200 });
}
