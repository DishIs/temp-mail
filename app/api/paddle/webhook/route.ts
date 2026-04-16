// app/api/paddle/webhook/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { fetchFromServiceAPI } from "@/lib/api";
import crypto from "crypto";

type ProductType = "app" | "api" | "credits";
type PaddleEventType =
  | "TRIALING"
  | "ACTIVATED"
  | "CANCELLED"
  | "SUSPENDED"
  | "UPDATED"
  | "PAYMENT_COMPLETED"
  | "PAYMENT_FAILED"
  | "REFUNDED";

// ---------------------------------------------------------------
// Paddle Webhook Signature Verification
// ---------------------------------------------------------------
function verifyPaddleSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Paddle Webhook] PADDLE_WEBHOOK_SECRET is not set");
    return false;
  }
  try {
    const parts = Object.fromEntries(
      signatureHeader.split(";").map((p) => p.split("=") as [string, string])
    );
    const { ts, h1 } = parts;
    if (!ts || !h1) return false;
    const eventTimestamp = parseInt(ts, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - eventTimestamp) > 300) return false;
    const signedPayload = `${ts}:${rawBody}`;
    const expectedSig = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(h1, "hex"), Buffer.from(expectedSig, "hex"));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------
// Extract from Paddle event (custom_data set at checkout)
// ---------------------------------------------------------------
function getCustomData(event: any): {
  userId?: string;
  productType?: ProductType;
  apiPlan?: string;
  creditsToAdd?: number;
} {
  const data = event?.data;
  const custom = data?.custom_data ?? data?.items?.[0]?.price?.custom_data ?? {};
  return {
    userId: custom.userId ?? custom.user_id ?? null,
    productType: custom.productType ?? custom.product_type ?? "app",
    apiPlan: custom.apiPlan ?? custom.api_plan ?? undefined,
    creditsToAdd: custom.creditsToAdd != null ? Number(custom.creditsToAdd) : (custom.credits_to_add != null ? Number(custom.credits_to_add) : undefined),
  };
}

function getUserIdFromEvent(event: any): string | undefined {
  return getCustomData(event).userId ?? undefined;
}

function getSubscriptionId(event: any): string | null {
  const data = event?.data;
  return data?.subscription_id ?? data?.id ?? null;
}

// ---------------------------------------------------------------
// Build payload for backend POST /paddle/subscription-event
// ---------------------------------------------------------------
function buildPayload(
  eventType: PaddleEventType,
  event: any,
  overrides: Partial<{
    userId: string | null;
    subscriptionId: string | null;
    productType: ProductType;
    apiPlan: string;
    creditsToAdd: number;
    status: string;
    startTime: string;
    nextBilledAt: string;
    payerEmail: string;
    canceledAt: string;
    pausedAt: string;
    amount: string;
    currency: string;
    scheduledChange: any;
  }> = {}
) {
  const data = event?.data ?? {};
  const custom = getCustomData(event);
  return {
    eventType,
    productType: overrides.productType ?? custom.productType ?? "app",
    apiPlan: overrides.apiPlan ?? custom.apiPlan,
    creditsToAdd: overrides.creditsToAdd ?? custom.creditsToAdd,
    userId: overrides.userId ?? custom.userId,
    subscriptionId: overrides.subscriptionId ?? data.subscription_id ?? data.id,
    customerId: data.customer_id,
    priceId: data.items?.[0]?.price_id ?? data.items?.[0]?.price?.id,
    status: overrides.status ?? data.status,
    startTime: overrides.startTime ?? data.started_at ?? data.created_at,
    nextBilledAt: overrides.nextBilledAt ?? data.next_billed_at,
    payerEmail: overrides.payerEmail ?? data.customer?.email,
    canceledAt: overrides.canceledAt ?? data.canceled_at,
    pausedAt: overrides.pausedAt ?? data.paused_at,
    amount: overrides.amount ?? data.details?.totals?.total ?? data.details?.totals?.grand_total ?? data.amount,
    currency: overrides.currency ?? data.currency_code,
    scheduledChange: overrides.scheduledChange ?? data.scheduled_change,
    rawEvent: event,
  };
}

async function sendToBackend(payload: ReturnType<typeof buildPayload>) {
  try {
    const response = await fetchFromServiceAPI("/paddle/subscription-event", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response;
  } catch (err: any) {
    // This logs to your Vercel/Frontend console
    console.error(`[Paddle Webhook -> Backend Error]: ${err.message}`);
    throw err; // Re-throw to trigger the catch block in POST()
  }
}


// ---------------------------------------------------------------
// Subscription lifecycle (app + api)
// ---------------------------------------------------------------
async function handleSubscriptionCreated(event: any) {
  const isTrial = event?.data?.status === "trialing";
  const payload = buildPayload(isTrial ? "TRIALING" : "ACTIVATED", event);
  payload.userId = getUserIdFromEvent(event);
  payload.subscriptionId = event?.data?.id ?? null;
  payload.status = event?.data?.status ?? (isTrial ? "trialing" : "active");
  payload.startTime = event?.data?.started_at ?? event?.data?.created_at;
  payload.nextBilledAt = event?.data?.next_billed_at;
  payload.payerEmail = event?.data?.customer?.email ?? null;
  payload.scheduledChange = event?.data?.scheduled_change ?? null;
  await sendToBackend(payload);
}

async function handleSubscriptionTrialing(event: any) {
  const payload = buildPayload("TRIALING", event);
  payload.userId = getUserIdFromEvent(event);
  payload.subscriptionId = event?.data?.id ?? null;
  payload.status = "trialing";
  payload.startTime = event?.data?.started_at ?? event?.data?.created_at;
  payload.nextBilledAt = event?.data?.next_billed_at;
  payload.payerEmail = event?.data?.customer?.email ?? null;
  await sendToBackend(payload);
}

async function handleSubscriptionCanceled(event: any) {
  const data = event?.data;
  const periodEnd =
    data?.scheduled_change?.effective_at ??
    data?.current_billing_period?.ends_at ??
    data?.canceled_at ??
    new Date().toISOString();
  const payload = buildPayload("CANCELLED", event);
  payload.userId = getUserIdFromEvent(event);
  payload.subscriptionId = data?.id ?? null;
  payload.canceledAt = data?.canceled_at ?? new Date().toISOString();
  payload.rawEvent = event;
  await sendToBackend(payload);
}

async function handleSubscriptionPaused(event: any) {
  const payload = buildPayload("SUSPENDED", event);
  payload.userId = getUserIdFromEvent(event);
  payload.subscriptionId = event?.data?.id ?? null;
  payload.pausedAt = event?.data?.paused_at;
  await sendToBackend(payload);
}

async function handleSubscriptionResumed(event: any) {
  const payload = buildPayload("UPDATED", event);
  payload.userId = getUserIdFromEvent(event);
  payload.subscriptionId = event?.data?.id ?? null;
  payload.status = "active";
  await sendToBackend(payload);
}

async function handleSubscriptionUpdated(event: any) {
  const payload = buildPayload("UPDATED", event);
  payload.userId = getUserIdFromEvent(event);
  payload.subscriptionId = event?.data?.id ?? null;
  // IMPORTANT: Map to price_id for Billing v3
  payload.priceId = event?.data?.items?.[0]?.price_id ?? event?.data?.items?.[0]?.price?.id;
  payload.status = event?.data?.status;
  payload.nextBilledAt = event?.data?.next_billed_at;
  // Ensure apiPlan is prioritized from custom_data
  payload.apiPlan = getCustomData(event).apiPlan || event?.data?.items?.[0]?.price?.custom_data?.api_plan;
  await sendToBackend(payload);
}

// ---------------------------------------------------------------
// transaction.completed — renewal (subscription) or one-time (credits)
// ---------------------------------------------------------------
async function handleTransactionCompleted(event: any) {
  const data = event?.data;
  const subscriptionId = data?.subscription_id ?? data?.subscription?.id ?? null;
  const custom = getCustomData(event);
  const amount = parseFloat(data?.details?.totals?.total ?? data?.details?.totals?.grand_total ?? "0") / 100; // Assuming Paddle returns cents or similar, wait paddle returns strings like "1000" representing 10.00 usually or it returns string format without decimals? Actually, it returns an integer string for lowest denomination (cents) in v2. Actually Paddle billing v2 usually returns cents. Oh wait, `data.amount` or `data.details.totals.total`? I'll use the raw integer value or just divide by 100 for safety, let's just parse it. Let's just track the raw float.

  const rawAmountStr = data?.details?.totals?.total ?? data?.details?.totals?.grand_total ?? "0";
  const amountParsed = parseFloat(rawAmountStr) / 100; // standard for paddle to be in cents
  
  const userId = custom.userId ?? getUserIdFromEvent(event);

  // Track affiliate purchase asynchronously
  if (userId) {
    import("@/lib/affiliate-tracker").then(({ trackAffiliatePurchase }) => {
      trackAffiliatePurchase(userId, amountParsed).catch(console.error);
    }).catch(console.error);
  }

  // One-time payment (credits): no subscription_id
  if (!subscriptionId) {
    const creditsToAdd = custom.creditsToAdd ?? 0;
    if (creditsToAdd <= 0) {
      console.warn("[Paddle Webhook] transaction.completed one-time missing creditsToAdd in custom_data");
      return;
    }
    await sendToBackend(
      buildPayload("ACTIVATED", event, {
        productType: "credits",
        creditsToAdd,
        userId: custom.userId ?? null,
        subscriptionId: data?.id ?? data?.transaction_id ?? "",
        amount: data?.details?.totals?.total ?? data?.details?.totals?.grand_total,
        currency: data?.currency_code,
      })
    );
    return;
  }

  // Recurring renewal
  await sendToBackend(
    buildPayload("PAYMENT_COMPLETED", event, {
      userId: getUserIdFromEvent(event),
      subscriptionId,
      amount: data?.details?.totals?.total ?? data?.details?.totals?.grand_total,
      currency: data?.currency_code,
    })
  );
}

async function handleTransactionPaymentFailed(event: any) {
  const data = event?.data;
  const subscriptionId = data?.subscription_id ?? data?.subscription?.id ?? null;
  if (!subscriptionId) return;
  await sendToBackend(
    buildPayload("PAYMENT_FAILED", event, {
      userId: getUserIdFromEvent(event),
      subscriptionId,
    })
  );
}

async function handleTransactionRefunded(event: any) {
  const data = event?.data;
  const subscriptionId = data?.subscription_id ?? data?.subscription?.id ?? null;
  await sendToBackend(
    buildPayload("REFUNDED", event, {
      userId: getUserIdFromEvent(event),
      subscriptionId: subscriptionId ?? data?.id ?? "",
      amount: data?.details?.totals?.grand_total,
      currency: data?.currency_code,
    })
  );
}

// ---------------------------------------------------------------
// Main Webhook Route
// ---------------------------------------------------------------
export async function POST(request: Request) {
  const headersList = await headers();
  const rawBody = await request.text();
  const signatureHeader = headersList.get("paddle-signature");

  if (process.env.NODE_ENV === "production") {
    const isValid = verifyPaddleSignature(rawBody, signatureHeader);
    if (!isValid) {
      console.error("[Paddle Webhook] Signature verification FAILED.");
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 401 });
    }
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType: string = event?.event_type ?? "";
  console.log(`[Paddle Webhook] Received: ${eventType} | ID: ${event?.notification_id}`);

  try {
    switch (eventType) {
      case "subscription.created":
        await handleSubscriptionCreated(event);
        break;
      case "subscription.trialing":
        await handleSubscriptionTrialing(event);
        break;
      case "subscription.activated":
        await handleSubscriptionCreated(event);
        break;
      case "subscription.canceled":
        await handleSubscriptionCanceled(event);
        break;
      case "subscription.paused":
      case "subscription.past_due":
        await handleSubscriptionPaused(event);
        break;
      case "subscription.resumed":
        await handleSubscriptionResumed(event);
        break;
      case "subscription.updated":
        await handleSubscriptionUpdated(event);
        break;
      case "transaction.completed":
        await handleTransactionCompleted(event);
        break;
      case "transaction.payment_failed":
        await handleTransactionPaymentFailed(event);
        break;
      case "transaction.refunded":
      case "adjustment.updated":
        if (event?.data?.status === "approved" || eventType === "transaction.refunded") {
          await handleTransactionRefunded(event);
        }
        break;
      default:
        console.log(`[Paddle Webhook] Unhandled event: ${eventType}`);
    }
  } catch (err) {
    console.error(`[Paddle Webhook] Error processing ${eventType}:`, err);
    return NextResponse.json({ received: true, warning: "Processing error occurred" }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
