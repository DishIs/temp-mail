// app/api/user/delete-account/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { callInternalAPI } from "@/lib/api";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const data = await callInternalAPI(
        request,
        "/user/delete-account",
        {
            method: "POST",
            body: JSON.stringify({ wyiUserId: session.user.id }),
        },
        { id: session.user.id }
    );
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.message === 'TOO_MANY_REQUESTS') {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    return NextResponse.json(
      { success: false, message: err?.message ?? "Server error." },
      { status: 500 }
    );
  }
}
