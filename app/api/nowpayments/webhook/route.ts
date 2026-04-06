// app/api/nowpayments/webhook/route.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Receives NOWPayments IPN (Instant Payment Notifications).
//  Verifies HMAC-SHA512, maps payment_status → eventType, and forwards
//  to the dedicated backend route POST /nowpayments/event
//  (handled by nowpayments-handler.ts — NOT paddle-handler.ts).
//
//  Signature algorithm (per NOWPayments docs):
//    1. Deep-sort all JSON body keys alphabetically
//    2. JSON.stringify the sorted object
//    3. HMAC-SHA512 with NOWPAYMENTS_IPN_SECRET
//    4. Compare hex digest to x-nowpayments-sig header (timing-safe)
//
//  payment_status flow:
//    waiting → confirming → confirmed → sending → finished  (success)
//                                               → failed    (failure)
//                                               → refunded
//    partially_paid  (user sent less than required)
//    expired         (invoice timed out)
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse }        from "next/server";
import { headers }             from "next/headers";
import crypto                  from "crypto";
import { fetchFromServiceAPI } from "@/lib/api";

// ── Signature verification ────────────────────────────────────────────────────

function sortObjectDeep(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObjectDeep);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObjectDeep((obj as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return obj;
}

function verifySignature(rawBody: string, sigHeader: string | null): boolean {
  if (!sigHeader) return false;
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) { console.error("[NOWPayments IPN] NOWPAYMENTS_IPN_SECRET not set"); return false; }
  try {
    const sorted = sortObjectDeep(JSON.parse(rawBody));
    const hmac   = crypto.createHmac("sha512", secret).update(JSON.stringify(sorted)).digest("hex");
    // timingSafeEqual requires same-length buffers
    const a = Buffer.from(hmac,      "hex");
    const b = Buffer.from(sigHeader, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

// ── Metadata parser ───────────────────────────────────────────────────────────
// We embed { userId, productType, apiPlan, creditsToAdd } in order_description
// (as JSON string) when creating the subscription/invoice in create-subscription/route.ts.

interface NpMetadata {
  userId?:       string;
  productType?:  "app" | "api" | "credits";
  apiPlan?:      string;
  billing?:      string;
  creditsToAdd?: number;
  package?:      string;
}

function parseMetadata(ipn: Record<string, unknown>): NpMetadata {
  try {
    const desc = ipn.order_description as string | undefined;
    if (desc) {
      const parsed = JSON.parse(desc);
      if (parsed && typeof parsed === "object") return parsed as NpMetadata;
    }
  } catch { /* fall through */ }
  // Fallback: userId is first segment of order_id ("userId_timestamp")
  const orderId = (ipn.order_id as string | undefined) ?? "";
  return { userId: orderId.includes("_") ? orderId.split("_")[0] : orderId || undefined };
}

// ── Status → eventType mapping ────────────────────────────────────────────────
//
// We emit TWO events on a clean payment path:
//   "confirmed" / "sending" → ACTIVATED        (early unlock on blockchain confirm)
//   "finished"              → PAYMENT_COMPLETED (fully settled — canonical renewal)
//
// This mirrors how Paddle fires both subscription.activated AND transaction.completed.
// The backend handler is idempotent so receiving both is safe.

type BackendEventType = "ACTIVATED" | "PAYMENT_COMPLETED" | "PAYMENT_FAILED" | "REFUNDED";

function mapStatus(npStatus: string): BackendEventType | null {
  switch (npStatus) {
    case "confirmed":
    case "sending":
      return "ACTIVATED";
    case "finished":
      return "PAYMENT_COMPLETED";
    case "failed":
    case "expired":
      return "PAYMENT_FAILED";
    case "refunded":
      return "REFUNDED";
    // waiting / confirming / partially_paid — acknowledge but don't change plan
    default:
      return null;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const headersList = await headers();
  const rawBody     = await request.text();
  const sigHeader   = headersList.get("x-nowpayments-sig");

  if (process.env.NODE_ENV === "production") {
    if (!verifySignature(rawBody, sigHeader)) {
      console.error("[NOWPayments IPN] Signature verification FAILED");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let ipn: Record<string, unknown>;
  try { ipn = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const npStatus = String(ipn.payment_status ?? "").toLowerCase();
  console.log(
    `[NOWPayments IPN] status=${npStatus}`,
    `payment_id=${ipn.payment_id}`,
    `subscription_id=${ipn.subscription_id ?? "n/a"}`,
  );

  const eventType = mapStatus(npStatus);
  if (!eventType) {
    // Acknowledge to stop NP retrying — nothing to do for this status
    console.log(`[NOWPayments IPN] No-op status: ${npStatus}`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const meta = parseMetadata(ipn);
  if (!meta.userId) {
    console.warn(
      "[NOWPayments IPN] Could not resolve userId from:",
      JSON.stringify({ order_id: ipn.order_id, order_description: ipn.order_description }),
    );
    // Return 200 — NP will stop retrying. Manual review via logs.
    return NextResponse.json({ received: true, warning: "userId not resolved" }, { status: 200 });
  }

  const payload = {
    eventType,
    productType:    meta.productType  ?? "app",
    apiPlan:        meta.apiPlan,
    creditsToAdd:   meta.creditsToAdd,
    userId:         meta.userId,
    // Prefer subscription_id (recurring), fall back to payment_id (one-time/invoice)
    subscriptionId: String(ipn.subscription_id ?? ipn.payment_id ?? ipn.order_id ?? ""),
    amount:         String(ipn.price_amount ?? ipn.actually_paid ?? ""),
    currency:       String(ipn.price_currency ?? ipn.pay_currency ?? "usd").toUpperCase(),
    startTime:      new Date().toISOString(),
    rawEvent:       ipn,
  };

  try {
    // Routes to nowpayments-handler.ts, NOT paddle-handler.ts
    await fetchFromServiceAPI("/nowpayments/event", {
      method: "POST",
      body:   JSON.stringify(payload),
    });
  } catch (err: any) {
    console.error("[NOWPayments IPN → Backend]", err.message);
    // Return 200 to stop retries; error is logged for manual review.
    return NextResponse.json({ received: true, warning: "Backend error" }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}