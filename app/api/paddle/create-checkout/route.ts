// app/api/paddle/create-checkout/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFromServiceAPI } from "@/lib/api";

type BillingCycle = "monthly" | "monthly_no_trial" | "yearly";
type ApiPlanName  = "developer" | "startup" | "growth" | "enterprise";
type ApiBilling   = "monthly" | "yearly";
type CreditsPackage = "starter" | "builder" | "scale" | "pro";

// ─── App Pro (recurring) ──────────────────────────────────────────────────────
const PADDLE_PRICES_APP: Record<BillingCycle, string | undefined> = {
  monthly:           process.env.PADDLE_PRICE_MONTHLY_W_TRIAL,
  monthly_no_trial:  process.env.PADDLE_PRICE_MONTHLY_W_NO_TRIAL,
  yearly:            process.env.PADDLE_PRICE_YEARLY,
};

// ─── API plans — monthly ──────────────────────────────────────────────────────
const PADDLE_PRICES_API_MONTHLY: Record<ApiPlanName, string | undefined> = {
  developer:  process.env.PADDLE_PRICE_API_DEVELOPER,
  startup:    process.env.PADDLE_PRICE_API_STARTUP,
  growth:     process.env.PADDLE_PRICE_API_GROWTH,
  enterprise: process.env.PADDLE_PRICE_API_ENTERPRISE,
};

// ─── API plans — yearly ───────────────────────────────────────────────────────
// Set these in your .env:
//   PADDLE_PRICE_API_DEVELOPER_YEARLY
//   PADDLE_PRICE_API_STARTUP_YEARLY
//   PADDLE_PRICE_API_GROWTH_YEARLY
//   PADDLE_PRICE_API_ENTERPRISE_YEARLY
const PADDLE_PRICES_API_YEARLY: Record<ApiPlanName, string | undefined> = {
  developer:  process.env.PADDLE_PRICE_API_DEVELOPER_YEARLY,
  startup:    process.env.PADDLE_PRICE_API_STARTUP_YEARLY,
  growth:     process.env.PADDLE_PRICE_API_GROWTH_YEARLY,
  enterprise: process.env.PADDLE_PRICE_API_ENTERPRISE_YEARLY,
};

// ─── Credits (one-time) ───────────────────────────────────────────────────────
const PADDLE_PRICES_CREDITS: Record<CreditsPackage, string | undefined> = {
  starter: process.env.PADDLE_PRICE_CREDITS_STARTER,
  builder: process.env.PADDLE_PRICE_CREDITS_BUILDER,
  scale:   process.env.PADDLE_PRICE_CREDITS_SCALE,
  pro:     process.env.PADDLE_PRICE_CREDITS_PRO,
};

const CREDITS_AMOUNTS: Record<CreditsPackage, number> = {
  starter: 200_000,
  builder: 600_000,
  scale:   1_500_000,
  pro:     4_000_000,
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      // App Pro
      cycle?: BillingCycle;
      // API plan
      type?: "app" | "api" | "credits";
      plan?: ApiPlanName;
      billing?: ApiBilling;
      // Credits
      package?: CreditsPackage;
    };

    const type = body.type ?? "app";

    // ── App Pro ──────────────────────────────────────────────────────────────
    if (type === "app") {
      let cycle: BillingCycle = body.cycle ?? "monthly";

      // Check if user already used their trial
      const userData = await fetchFromServiceAPI("/user/status", {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id }),
      }).catch(() => null);

      if (cycle === "monthly" && userData?.hadTrial) cycle = "monthly_no_trial";

      const allowed: BillingCycle[] = ["monthly", "monthly_no_trial", "yearly"];
      if (!allowed.includes(cycle)) {
        return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
      }

      const priceId = PADDLE_PRICES_APP[cycle];
      if (!priceId) {
        console.error("[Paddle] Missing app price ID for", cycle);
        return NextResponse.json({ error: "Price configuration error" }, { status: 500 });
      }

      return NextResponse.json({ priceId, cycle, productType: "app" });
    }

    // ── API plan ─────────────────────────────────────────────────────────────
    if (type === "api") {
      const plan    = body.plan    as ApiPlanName | undefined;
      const billing = body.billing as ApiBilling  | undefined ?? "monthly";

      const allowedPlans:    ApiPlanName[] = ["developer", "startup", "growth", "enterprise"];
      const allowedBillings: ApiBilling[]  = ["monthly", "yearly"];

      if (!plan || !allowedPlans.includes(plan)) {
        return NextResponse.json({ error: "Invalid API plan" }, { status: 400 });
      }
      if (!allowedBillings.includes(billing)) {
        return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
      }

      const priceMap = billing === "yearly" ? PADDLE_PRICES_API_YEARLY : PADDLE_PRICES_API_MONTHLY;
      const priceId  = priceMap[plan];

      if (!priceId) {
        console.error("[Paddle] Missing API price ID for", plan, billing);
        return NextResponse.json({ error: "Price configuration error" }, { status: 500 });
      }

      return NextResponse.json({
        priceId,
        productType: "api",
        apiPlan:     plan,
        billing,
      });
    }

    // ── Credits ──────────────────────────────────────────────────────────────
    if (type === "credits") {
      const pkg = body.package as CreditsPackage | undefined;
      const allowed: CreditsPackage[] = ["starter", "builder", "scale", "pro"];

      if (!pkg || !allowed.includes(pkg)) {
        return NextResponse.json({ error: "Invalid credits package" }, { status: 400 });
      }

      const priceId = PADDLE_PRICES_CREDITS[pkg];
      if (!priceId) {
        console.error("[Paddle] Missing credits price ID for", pkg);
        return NextResponse.json({ error: "Price configuration error" }, { status: 500 });
      }

      return NextResponse.json({
        priceId,
        productType:  "credits",
        creditsToAdd: CREDITS_AMOUNTS[pkg],
        package:      pkg,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (error) {
    console.error("[Paddle] create-checkout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}