// components/crypto-checkout-button.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  "Pay with Crypto" button. Handles three scenarios:
//    1. New subscription  → opens NOWPayments invoice in new tab
//    2. Plan upgrade      → cancel old NP sub via backend, then open new checkout
//    3. Plan downgrade    → cancel old NP sub, schedule end-of-period downgrade
//
//  Usage:
//    <CryptoCheckoutButton type="app" cycle="monthly" />
//    <CryptoCheckoutButton type="api" plan="growth" billing="yearly"
//                          hasActiveCryptoSub currentCryptoPlan="startup" />
//    <CryptoCheckoutButton type="credits" package="builder" />
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bitcoin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type AppBilling     = "monthly" | "yearly";
type ApiPlanName    = "developer" | "startup" | "growth" | "enterprise";
type CreditsPackage = "starter" | "builder" | "scale" | "pro";
const PLAN_ORDER    = ["free", "developer", "startup", "growth", "enterprise"] as const;

type BaseProps = {
  className?:          string;
  size?:               "sm" | "default";
  hasActiveCryptoSub?: boolean;  // true if user already has a NOWPayments subscription
  currentCryptoPlan?:  string;   // e.g. "startup" — to detect upgrade vs downgrade
};

type CryptoCheckoutProps = BaseProps & (
  | { type: "app";     cycle?:  AppBilling }
  | { type: "api";     plan:    ApiPlanName; billing?: AppBilling }
  | { type: "credits"; package: CreditsPackage }
);

export function CryptoCheckoutButton(props: CryptoCheckoutProps) {
  const { data: session, status } = useSession();
  const router  = useRouter();
  const [busy, setBusy] = useState(false);

  const targetPlan       = props.type === "api" ? (props as any).plan as ApiPlanName : undefined;
  const currentCryptoPlan = props.currentCryptoPlan as ApiPlanName | undefined;

  let changeDirection: "upgrade" | "downgrade" | "new" = "new";
  if (props.hasActiveCryptoSub && targetPlan && currentCryptoPlan) {
    const fromIdx = PLAN_ORDER.indexOf(currentCryptoPlan as any);
    const toIdx   = PLAN_ORDER.indexOf(targetPlan);
    if (toIdx > fromIdx)      changeDirection = "upgrade";
    else if (toIdx < fromIdx) changeDirection = "downgrade";
  }

  const handleClick = async () => {
    if (status !== "authenticated" || !session?.user) {
      toast.error("Please sign in to continue.");
      router.push(`/auth?callbackUrl=${props.type === "api" ? "/api/pricing" : "/pricing"}`);
      return;
    }

    setBusy(true);

    try {
      // ── Plan change (existing NP subscription) ──────────────────────────────
      if (props.hasActiveCryptoSub && props.type !== "credits" && targetPlan) {
        const tid = toast.loading(
          changeDirection === "upgrade" ? "Processing upgrade…" : "Scheduling downgrade…"
        );

        const res = await fetch("/api/nowpayments/change-plan", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetPlan, productType: props.type }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          toast.error(data.error ?? data.message ?? "Failed to change plan.", { id: tid });
          return;
        }

        if (data.requiresNewCheckout) {
          // Upgrade: old sub cancelled → open checkout for new plan
          toast.dismiss(tid);
          toast.success("Previous subscription cancelled. Opening new checkout…", { duration: 3000 });
          await openInvoice(props);
        } else {
          // Downgrade scheduled
          toast.success(data.message ?? "Downgrade scheduled.", { id: tid, duration: 6000 });
        }
        return;
      }

      // ── New subscription or credits ─────────────────────────────────────────
      await openInvoice(props);

    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const label = changeDirection === "upgrade"   ? "Upgrade with Crypto"
              : changeDirection === "downgrade" ? "Downgrade with Crypto"
              : "Pay with Crypto";

  return (
    <Button
      size={(props as any).size ?? "sm"}
      variant="outline"
      disabled={busy}
      onClick={handleClick}
      className={cn(
        "gap-2 border-orange-500/30 text-orange-600 hover:bg-orange-500/5",
        "hover:border-orange-500/50 hover:text-orange-600",
        "dark:text-orange-400 dark:border-orange-500/30 dark:hover:border-orange-500/50",
        "transition-colors",
        (props as any).className,
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bitcoin className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

// ── Open a NOWPayments invoice in a new tab ────────────────────────────────────

async function openInvoice(props: CryptoCheckoutProps) {
  const tid = toast.loading("Preparing crypto checkout…");

  const body: Record<string, unknown> = { type: props.type };
  if (props.type === "app")     body.cycle   = (props as any).cycle ?? "monthly";
  if (props.type === "api")     { body.plan = (props as any).plan; body.billing = (props as any).billing ?? "monthly"; }
  if (props.type === "credits") body.package = (props as any).package;

  const res  = await fetch("/api/nowpayments/create-subscription", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok || data.error) {
    toast.error(data.error ?? "Failed to open crypto checkout.", { id: tid });
    return;
  }

  toast.dismiss(tid);
  window.open(data.paymentUrl ?? data.invoiceUrl, "_blank", "noopener,noreferrer");
  toast.success("Crypto checkout opened in a new tab. Complete your payment there.", { duration: 6000 });
}