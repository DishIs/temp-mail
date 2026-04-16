// app/api/nowpayments/webhook/route.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Receives NOWPayments IPN (Instant Payment Notifications).
//  Verifies HMAC-SHA512, maps payment_status → eventType, and forwards
//  to the dedicated backend route POST /nowpayments/event.
//
//  FIXES:
//    Bug 2 – apiPlan extracted from both `apiPlan` and legacy `planKey` fields
//    Bug 3 – backend failures now return 500 (not 200) so NP retries delivery
//    Bug 5 – invoice_id=0 (falsy int) no longer swallows payment_id fallback
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse }        from "next/server";
import { headers }             from "next/headers";
import crypto                  from "crypto";
import { fetchFromServiceAPI } from "@/lib/api";

// ── Signature verification ────────────────────────────────────────────────────
// Official algorithm from NOWPayments Zendesk docs:
// deep-sort all object keys alphabetically (including nested), then HMAC-SHA512.

function sortObject(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject((obj as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return obj;
}

function verifySignature(rawBody: string, sigHeader: string | null): boolean {
  if (!sigHeader) return false;
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    console.error("[NOWPayments IPN] NOWPAYMENTS_IPN_SECRET not set");
    return false;
  }
  try {
    const sorted = sortObject(JSON.parse(rawBody));
    const hmac   = crypto.createHmac("sha512", secret).update(JSON.stringify(sorted)).digest("hex");
    const a = Buffer.from(hmac,      "hex");
    const b = Buffer.from(sigHeader, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ── Metadata parser ───────────────────────────────────────────────────────────

interface NpMetadata {
  userId?:                string;
  productType?:           "app" | "api" | "credits";
  apiPlan?:               string;   // preferred: "developer" | "startup" | "growth" | "enterprise"
  planKey?:               string;   // legacy: "api_developer_monthly" — we extract apiPlan from this
  billing?:              "monthly" | "yearly";
  creditsToAdd?:         number;
  package?:              string;
  isCryptoSubscription?: boolean;
}

/**
 * FIX Bug 2: Extract the short API plan name from whichever field is available.
 * create-subscription used to store planKey ("api_developer_monthly") but the
 * backend reads apiPlan ("developer"). We support both.
 */
function extractApiPlan(meta: NpMetadata): string | undefined {
  if (meta.apiPlan) return meta.apiPlan;
  if (meta.planKey) {
    // "api_developer_monthly" → "developer"
    const match = meta.planKey.match(/^api_([a-z]+)_(?:monthly|yearly)$/);
    if (match) return match[1];
  }
  return undefined;
}

function parseMetadata(ipn: Record<string, unknown>): NpMetadata {
  try {
    const desc = ipn.order_description as string | undefined;
    if (desc) {
      const parsed = JSON.parse(desc);
      if (parsed && typeof parsed === "object") return parsed as NpMetadata;
    }
  } catch { /* fall through */ }
  const orderId = (ipn.order_id as string | undefined) ?? "";
  return { userId: orderId.includes("_") ? orderId.split("_")[0] : orderId || undefined };
}

// ── Invoice ID resolver ───────────────────────────────────────────────────────
// FIX Bug 5: NP sends invoice_id as an integer. If it's 0 (falsy but valid-ish),
// the nullish coalescing `?? payment_id` would NOT fall through (0 is not null).
// We explicitly treat 0 and null/undefined as "absent".

function resolveInvoiceId(ipn: Record<string, unknown>): string {
  const inv = ipn.invoice_id;
  if (inv !== null && inv !== undefined && inv !== 0) return String(inv);
  const pay = ipn.payment_id;
  if (pay !== null && pay !== undefined) return String(pay);
  return String(ipn.order_id ?? "");
}

// ── Status → eventType mapping ────────────────────────────────────────────────

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
    `invoice_id=${ipn.invoice_id ?? "n/a"}`,
  );

  const eventType = mapStatus(npStatus);
  if (!eventType) {
    console.log(`[NOWPayments IPN] No-op status: ${npStatus}`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const meta = parseMetadata(ipn);
  if (!meta.userId) {
    console.warn(
      "[NOWPayments IPN] Could not resolve userId from:",
      JSON.stringify({ order_id: ipn.order_id, order_description: ipn.order_description }),
    );
    return NextResponse.json({ received: true, warning: "userId not resolved" }, { status: 200 });
  }

  const payload = {
    eventType,
    productType:          meta.productType  ?? "app",
    apiPlan:              extractApiPlan(meta),          // FIX Bug 2
    billing:             meta.billing,
    creditsToAdd:        meta.creditsToAdd,
    userId:              meta.userId,
    invoiceId:           resolveInvoiceId(ipn),          // FIX Bug 5
    amount:             String(ipn.price_amount ?? ipn.actually_paid ?? ""),
    currency:           String(ipn.price_currency ?? ipn.pay_currency ?? "usd").toUpperCase(),
    isCryptoSubscription: meta.isCryptoSubscription ?? false,
    startTime:           new Date().toISOString(),
    rawEvent:            ipn,
  };

  try {
    // Track affiliate purchase asynchronously if completed
    if (eventType === "ACTIVATED" || eventType === "PAYMENT_COMPLETED") {
      const amountParsed = parseFloat(payload.amount || "0");
      if (amountParsed > 0) {
        import("@/lib/affiliate-tracker").then(({ trackAffiliatePurchase }) => {
          trackAffiliatePurchase(payload.userId, amountParsed).catch(console.error);
        }).catch(console.error);
      }
    }

    await fetchFromServiceAPI("/nowpayments/event", {
      method: "POST",
      body:   JSON.stringify(payload),
    });
  } catch (err: any) {
    console.error("[NOWPayments IPN → Backend]", err.message);
    // FIX Bug 3: return 500 so NowPayments retries.
    // Previously returned 200 which permanently lost the event.
    return NextResponse.json(
      { received: false, error: "Backend processing failed — will retry" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}