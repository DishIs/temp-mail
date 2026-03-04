import { NextResponse } from "next/server";
import { fetchFromServiceAPI } from "@/lib/api";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await fetchFromServiceAPI(`/user/api-status/${session.user.id}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("API Error /user/api-status:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
