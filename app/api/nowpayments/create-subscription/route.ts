// app/api/nowpayments/create-subscription/route.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Creates a NOWPayments subscription plan (cached by env var) then creates
//  an email subscription for the user, returning the hosted invoice URL.
//
//  ENV vars:
//    NOWPAYMENTS_API_KEY          – API key from NOWPayments dashboard
//    NOWPAYMENTS_IPN_SECRET       – IPN secret for webhook verification
//    NOWPAYMENTS_SANDBOX          – "true" for sandbox mode
//    NEXT_PUBLIC_APP_URL          – e.g. https://freecustom.email
//
//  Plan ID cache (fill after first run — see console output):
//    NOWPAYMENTS_PLAN_ID_APP_MONTHLY
//    NOWPAYMENTS_PLAN_ID_APP_YEARLY
//    NOWPAYMENTS_PLAN_ID_API_DEVELOPER_MONTHLY  ... etc.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { auth }         from "@/auth";

type AppBilling     = "monthly" | "yearly";
type ApiPlanName    = "developer" | "startup" | "growth" | "enterprise";
type CreditsPackage = "starter" | "builder" | "scale" | "pro";

// ── Price tables (USD) ────────────────────────────────────────────────────────

const APP_PRICES: Record<AppBilling, number> = { monthly: 3.99, yearly: 29.99 };

const API_PRICES_MONTHLY: Record<ApiPlanName, number> = {
  developer: 7, startup: 19, growth: 49, enterprise: 149,
};
const API_PRICES_YEARLY: Record<ApiPlanName, number> = {
  developer: 67, startup: 182, growth: 470, enterprise: 1430,
};

const CREDITS_PRICES: Record<CreditsPackage, { amount: number; credits: number }> = {
  starter: { amount: 10,  credits: 200_000   },
  builder: { amount: 25,  credits: 600_000   },
  scale:   { amount: 50,  credits: 1_500_000 },
  pro:     { amount: 100, credits: 4_000_000 },
};

// ── NOWPayments API helpers ───────────────────────────────────────────────────

const NP_BASE = process.env.NOWPAYMENTS_SANDBOX === "true"
  ? "https://api.sandbox.nowpayments.io/v1"
  : "https://api.nowpayments.io/v1";

async function getNowPaymentsToken(): Promise<string> {
  const res = await fetch(`${NP_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.NOWPAYMENTS_EMAIL,
      password: process.env.NOWPAYMENTS_PASSWORD,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.token) {
    console.error("[NOWPayments] auth failed:", JSON.stringify(json));
    throw new Error("Failed to authenticate with NOWPayments");
  }
  return json.token;
}

async function npHeaders(requireAuth = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "x-api-key": process.env.NOWPAYMENTS_API_KEY ?? "",
    "Content-Type": "application/json",
  };
  if (requireAuth) {
    const token = await getNowPaymentsToken();
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ── Get or create a recurring plan ───────────────────────────────────────────
// On first run, a plan is created and its ID is logged so you can cache it
// in an env var. Subsequent calls skip creation entirely.
//
// env key format: NOWPAYMENTS_PLAN_ID_<TYPE>_<LABEL>_<BILLING>
// e.g. NOWPAYMENTS_PLAN_ID_API_GROWTH_MONTHLY
//
async function getOrCreatePlanId(
  envKey:       string,
  title:        string,
  amount:       number,
  intervalDays: number,
  userId:       string,
): Promise<string> {
  const cached = process.env[envKey];
  if (cached) return cached;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const body = {
    title,
    amount:           amount.toString(),
    currency:         "usd",
    interval_day:     intervalDays,
    ipn_callback_url: `${appUrl}/api/nowpayments/webhook`,
    success_url:      `${appUrl}/payment/success?provider=nowpayments`,
    cancel_url:       `${appUrl}/pricing`,
    partially_paid_url: `${appUrl}/payment/pending?provider=nowpayments`,
  };

  const res  = await fetch(`${NP_BASE}/subscriptions/plans`, {
    method: "POST", headers: await npHeaders(true), body: JSON.stringify(body),
  });
  const json = await res.json();

  if (!res.ok) {
    console.error("[NOWPayments] create plan failed:", JSON.stringify(json));
    throw new Error(json?.message ?? "Failed to create NOWPayments plan");
  }

  const planId = String(json.id ?? json.result?.id);
  console.log(`[NOWPayments] Created plan — set env ${envKey}=${planId}`);
  return planId;
}

// ── Create email subscription (sends invoice link to user's email) ────────────
async function createEmailSubscription(
  planId:   string,
  email:    string,
  userId:   string,
  metadata: Record<string, unknown>,
): Promise<{ invoiceUrl: string; subscriptionId: string }> {
  const body = {
    subscription_plan_id: planId,
    email,
    order_id:          `${userId}_${Date.now()}`,
    order_description: JSON.stringify(metadata),   // parsed back in webhook
  };

  const res  = await fetch(`${NP_BASE}/subscriptions`, {
    method: "POST", headers: await npHeaders(true), body: JSON.stringify(body),
  });
  const json = await res.json();

  if (!res.ok) {
    console.error("[NOWPayments] create subscription failed:", JSON.stringify(json));
    throw new Error(json?.message ?? "Failed to create subscription");
  }

  return {
    invoiceUrl:     json.invoice_url ?? json.payment_url ?? "",
    subscriptionId: String(json.id ?? json.result?.id ?? ""),
  };
}

// ── Main route ────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const email  = session.user.email;

  let body: { type?: string; cycle?: string; plan?: string; billing?: string; package?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { type = "app" } = body;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  try {
    // ── App Pro ─────────────────────────────────────────────────────────────
    if (type === "app") {
      const billing     = body.cycle === "yearly" ? "yearly" : "monthly" as AppBilling;
      const amount      = APP_PRICES[billing];
      const envKey      = `NOWPAYMENTS_PLAN_ID_APP_${billing.toUpperCase()}`;
      const intervalDay = billing === "yearly" ? 365 : 30;

      const planId = await getOrCreatePlanId(
        envKey, `FCE_APP_${billing.toUpperCase()}`, amount, intervalDay, userId,
      );
      const { invoiceUrl, subscriptionId } = await createEmailSubscription(
        planId, email, userId,
        { userId, productType: "app", billing },
      );
      return NextResponse.json({ invoiceUrl, subscriptionId, productType: "app" });
    }

    // ── API plan ─────────────────────────────────────────────────────────────
    if (type === "api") {
      const plan    = body.plan as ApiPlanName | undefined;
      const billing = (body.billing === "yearly" ? "yearly" : "monthly") as AppBilling;
      const allowedPlans: ApiPlanName[] = ["developer", "startup", "growth", "enterprise"];

      if (!plan || !allowedPlans.includes(plan)) {
        return NextResponse.json({ error: "Invalid API plan" }, { status: 400 });
      }

      const priceMap    = billing === "yearly" ? API_PRICES_YEARLY : API_PRICES_MONTHLY;
      const amount      = priceMap[plan];
      const envKey      = `NOWPAYMENTS_PLAN_ID_API_${plan.toUpperCase()}_${billing.toUpperCase()}`;
      const intervalDay = billing === "yearly" ? 365 : 30;

      const planId = await getOrCreatePlanId(
        envKey, `FCE_API_${plan.toUpperCase()}_${billing.toUpperCase()}`, amount, intervalDay, userId,
      );
      const { invoiceUrl, subscriptionId } = await createEmailSubscription(
        planId, email, userId,
        { userId, productType: "api", apiPlan: plan, billing },
      );
      return NextResponse.json({ invoiceUrl, subscriptionId, productType: "api", apiPlan: plan });
    }

    // ── Credits (one-time invoice, not a subscription) ────────────────────────
    if (type === "credits") {
      const pkg = body.package as CreditsPackage | undefined;
      const allowedPkgs: CreditsPackage[] = ["starter", "builder", "scale", "pro"];
      if (!pkg || !allowedPkgs.includes(pkg)) {
        return NextResponse.json({ error: "Invalid credits package" }, { status: 400 });
      }

      const { amount, credits } = CREDITS_PRICES[pkg];
      const res  = await fetch(`${NP_BASE}/invoice`, {
        method: "POST",
        headers: await npHeaders(),
        body: JSON.stringify({
          price_amount:       amount,
          price_currency:     "usd",
          order_id:           `credits_${pkg}_${userId}_${Date.now()}`,
          order_description:  JSON.stringify({ userId, productType: "credits", creditsToAdd: credits, package: pkg }),
          ipn_callback_url:   `${appUrl}/api/nowpayments/webhook`,
          success_url:        `${appUrl}/payment/success?provider=nowpayments&type=credits`,
          cancel_url:         `${appUrl}/api/pricing`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Failed to create invoice");

      return NextResponse.json({
        invoiceUrl:   json.invoice_url,
        invoiceId:    String(json.id ?? ""),
        productType:  "credits",
        creditsToAdd: credits,
        package:      pkg,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (err: any) {
    console.error("[NOWPayments] create-subscription error:", err);
    return NextResponse.json({ error: err.message ?? "Internal Server Error" }, { status: 500 });
  }
}