import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFromServiceAPI } from "@/lib/api";

/**
 * Returns a short-lived token for the API playground so logged-in users
 * can try the API without pasting their key. Implement the backend endpoint
 * (e.g. POST /user/playground-token with { userId }) to return a token.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ token: null }, { status: 200 });
  }
  try {
    const data = await fetchFromServiceAPI(
      `/user/playground-token`,
      {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id }),
      }
    );
    const token = typeof data?.token === "string" ? data.token : null;
    return NextResponse.json({ token });
  } catch {
    // Service may not implement this endpoint yet
    return NextResponse.json({ token: null }, { status: 200 });
  }
}
