// app/api/nowpayments/change-plan/route.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Handles plan upgrades and downgrades for users on a NOWPayments subscription.
//
//  UPGRADE flow:
//    1. Backend cancels old NP subscription via DELETE /v1/subscriptions/:id
//    2. Backend writes new plan optimistically to DB
//    3. Returns { requiresNewCheckout: true } — frontend opens new checkout
//    4. When user pays new plan, IPN fires ACTIVATED → DB confirmed
//
//  DOWNGRADE flow:
//    1. Backend cancels old NP subscription
//    2. Backend writes scheduledDowngrade to DB (keeps access until periodEnd)
//    3. Returns { requiresNewCheckout: false, effectiveAt }
//    4. User sees "plan changes on X date" banner (same as Paddle downgrade)
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { auth }         from "@/auth";
import { fetchFromServiceAPI } from "@/lib/api";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { targetPlan?: string; productType?: "app" | "api"; reason?: string; comment?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { targetPlan, productType = "api", reason, comment } = body;

  if (!targetPlan) {
    return NextResponse.json({ error: "targetPlan is required." }, { status: 400 });
  }

  try {
    const result = await fetchFromServiceAPI("/nowpayments/change-plan", {
      method: "POST",
      body: JSON.stringify({
        userId:      session.user.id,
        targetPlan,
        productType,
        reason:  reason  ?? null,
        comment: comment ?? null,
      }),
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[NP change-plan]", err.message);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}