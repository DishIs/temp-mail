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
  const forceCleanup = body?.forceCleanup === true;

  // If forceCleanup is requested, we first look for existing keys with the same name and delete them
  if (forceCleanup) {
    try {
      const { status: listStatus, data: listData } = await fetchFromServiceAPIWithStatus(`/user/api-keys/${userId}`);
      
      // Handle response structure correctly: data is usually the object { success, data: keys[] }
      const keys = (listData as any)?.data || [];
      const keysToCleanup = Array.isArray(keys) ? keys.filter((k: any) => k.name === name) : [];
      
      for (const k of keysToCleanup) {
        // Use keyId as expected by the DELETE route in app/api/user/api-keys/route.ts
        await fetchFromServiceAPIWithStatus("/user/api-keys", {
          method: "DELETE",
          body: JSON.stringify({ keyId: k.id, wyiUserId: userId }),
        });
      }
    } catch (e) {
      console.error("Cleanup failed:", e);
    }
  }

  // 2. Call internal service API to create the key
  const { status, data } = await fetchFromServiceAPIWithStatus("/user/api-keys", {
    method: "POST",
    body: JSON.stringify({
      wyiUserId: userId,
      name: name,
    }),
  });

  const responseData = data as any;

  if (status !== 200 && status !== 201) {
    // If at max keys, return a specific error that the frontend can handle
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
