import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFromServiceAPIWithStatus } from "@/lib/api";

export async function POST(req: NextRequest) {
  // 1. Verify session
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const name = body?.name ?? "CLI key";

  // 2. Call internal service API
  const { status, data } = await fetchFromServiceAPIWithStatus("/user/api-keys", {
    method: "POST",
    body: JSON.stringify({
      wyiUserId: userId,
      name: name,
    }),
  });

  // Since data is unknown, we cast it to handle the response safely
  const responseData = data as any;

  if (status !== 200 && status !== 201) {
    if (responseData?.message?.includes("Maximum")) {
      return NextResponse.json(
        { error: "max_keys", message: responseData.message },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "create_failed", message: responseData?.message }, { status });
  }

  // 3. Return the key data
  return NextResponse.json({
    key: responseData?.data?.key,
    prefix: responseData?.data?.prefix,
    createdAt: responseData?.data?.createdAt,
  });
}
