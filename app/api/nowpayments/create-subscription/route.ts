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
import { fetchFromServiceAPI } from "@/lib/api";

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

async function createCryptoInvoice(
  planKey:    string,
  email:     string,
  userId:    string,
  productType: "app" | "api",
  appUrl:    string,
  billing?: "monthly" | "yearly"
): Promise<{ paymentUrl: string; invoiceId: string }> {
  let amount: number;
  let description: string;

  if (planKey.startsWith("app_")) {
    amount = billing === "yearly" ? 29.99 : 3.99;
    description = billing === "yearly" ? "App Pro - Yearly" : "App Pro - Monthly";
  } else if (planKey.startsWith("api_")) {
    const apiPricesMonthly: Record<string, number> = {
      api_developer_monthly: 7, api_startup_monthly: 19,
      api_growth_monthly: 49, api_enterprise_monthly: 149,
    };
    const apiPricesYearly: Record<string, number> = {
      api_developer_yearly: 67, api_startup_yearly: 182,
      api_growth_yearly: 470, api_enterprise_yearly: 1430,
    };
    const prices = billing === "yearly" ? apiPricesYearly : apiPricesMonthly;
    amount = prices[planKey] ?? 0;
    const planName = planKey.replace("api_", "").replace("_monthly", "").replace("_yearly", "");
    description = `API ${planName.charAt(0).toUpperCase() + planName.slice(1)} - ${billing ?? "monthly"}`;
  } else {
    throw new Error("Invalid plan key");
  }

  // Use invoice endpoint - returns valid invoice_url
  const body = {
    price_amount:        amount,
    price_currency:     "usd",
    order_id:          `${userId}_${Date.now()}`,
    order_description: JSON.stringify({
      userId,
      productType,
      planKey,
      billing,
      isCryptoSubscription: true, // Mark for backend tracking
    }),
    ipn_callback_url: `${appUrl}/api/nowpayments/webhook`,
    success_url:        `${appUrl}/payment/success?provider=nowpayments`,
    cancel_url:         `${appUrl}/pricing`,
    customer_email:    email,
  };

  const res  = await fetch(`${NP_BASE}/invoice`, {
    method: "POST", headers: await npHeaders(false), body: JSON.stringify(body),
  });
  const json = await res.json();

  if (!res.ok) {
    console.error("[NOWPayments] create invoice failed:", JSON.stringify(json));
    throw new Error(json?.message ?? "Failed to create invoice");
  }

  const invoiceId = String(json.id ?? "");
  const paymentUrl = json.invoice_url ?? json.payment_url ?? "";

  if (!paymentUrl) {
    console.error("[NOWPayments] no invoice_url in response:", JSON.stringify(json));
    throw new Error("No payment URL returned");
  }

  return {
    paymentUrl,
    invoiceId,
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
      const billing = body.cycle === "yearly" ? "yearly" : "monthly";
      const planKey = `app_${billing}`;

      const { paymentUrl, invoiceId } = await createCryptoInvoice(
        planKey, email, userId, "app", appUrl, billing
      );
      return NextResponse.json({ paymentUrl, invoiceId, productType: "app" });
    }

    // ── API plan ─────────────────────────────────────────────────────────────
    if (type === "api") {
      const plan    = body.plan as ApiPlanName | undefined;
      const billing = body.billing === "yearly" ? "yearly" : "monthly";
      const allowedPlans: ApiPlanName[] = ["developer", "startup", "growth", "enterprise"];

      if (!plan || !allowedPlans.includes(plan)) {
        return NextResponse.json({ error: "Invalid API plan" }, { status: 400 });
      }

      const planKey = `api_${plan}_${billing}`;
      const { paymentUrl, invoiceId } = await createCryptoInvoice(
        planKey, email, userId, "api", appUrl, billing
      );
      return NextResponse.json({ paymentUrl, invoiceId, productType: "api", apiPlan: plan });
    }

    // ── Credits (still one-time invoice, not a subscription) ────────────────
    if (type === "credits") {
      const pkg = body.package as CreditsPackage | undefined;
      const allowedPkgs: CreditsPackage[] = ["starter", "builder", "scale", "pro"];
      if (!pkg || !allowedPkgs.includes(pkg)) {
        return NextResponse.json({ error: "Invalid credits package" }, { status: 400 });
      }

      const { amount, credits } = CREDITS_PRICES[pkg];

      const invoiceBody = {
        price_amount:      amount,
        price_currency:    "usd",
        order_id:          `${userId}_${Date.now()}`,
        order_description: JSON.stringify({ userId, productType: "credits", creditsToAdd: credits, package: pkg }),
        ipn_callback_url:  `${appUrl}/api/nowpayments/webhook`,
        success_url:       `${appUrl}/payment/success?provider=nowpayments`,
        cancel_url:        `${appUrl}/api/pricing`,
        customer_email:    email,
      };

      const headers = await npHeaders(false);
      const res  = await fetch(`${NP_BASE}/invoice`, {
        method: "POST", headers, body: JSON.stringify(invoiceBody),
      });
      const json = await res.json();

      if (!res.ok) {
        console.error("[NOWPayments] create invoice failed:", JSON.stringify(json));
        throw new Error(json?.message ?? "Failed to create invoice");
      }

      const invoiceUrl = json.invoice_url ?? json.payment_url ?? "";
      const invoiceId = String(json.id ?? "");

      return NextResponse.json({
        invoiceUrl,
        invoiceId,
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