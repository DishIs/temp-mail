import { NextResponse } from "next/server";

const AUTH_ORIGIN = process.env.AUTH_ORIGIN!;

export async function GET(request: Request) {
  // Proxy to remote NextAuth — this triggers the JWT callback
  // which calls /user/status and gets the latest plan from DB
  const res = await fetch(`${AUTH_ORIGIN}/api/auth/session`, {
    headers: {
      cookie: request.headers.get("cookie") || "",
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  const response = NextResponse.json({
    user: data?.user ?? null,
  });

  // Forward the refreshed Set-Cookie so the client gets
  // the re-issued token with plan: "pro" baked in
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    response.headers.set("set-cookie", setCookie);
  }

  return response;
}
