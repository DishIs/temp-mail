import { NextResponse } from "next/server";
import { callInternalAPI } from "@/lib/api";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const data = await callInternalAPI(request, `/user/api-status/${session.user.id}`, { method: 'GET' }, { id: session.user.id });
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
