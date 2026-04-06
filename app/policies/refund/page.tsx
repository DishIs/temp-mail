// app/refund-policy/page.tsx
"use client";

import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RefundPolicyPage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />

        <div className="max-w-2xl mx-auto py-20 px-6">

          {/* Header */}
          <div className="mb-16">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Legal · Refund Policy
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-5">
              Fair & Simple Refunds
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
              We want you to be happy. If you're not, we'll make it right within 14 days.
            </p>
          </div>

          <div className="space-y-16">

            {/* Eligibility overview */}
            <section className="grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
              <div className="bg-background p-6">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Eligible</p>
                <p className="text-sm font-medium text-foreground mb-1">First 14 Days</p>
                <p className="text-xs text-muted-foreground leading-relaxed">First-time Pro or API plan subscriptions</p>
              </div>
              <div className="bg-background p-6">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Not Eligible</p>
                <p className="text-sm font-medium text-foreground mb-1">Renewals, Credits & Crypto</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Automatic recurring payments, one-time credit top-ups, and all cryptocurrency payments</p>
              </div>
            </section>

            {/* First 14 Days detail */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                01 — First 14 Days
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                If you purchased a <span className="font-medium text-foreground">Pro</span> subscription or an <span className="font-medium text-foreground">API plan</span> (Developer, Startup, Growth, or Enterprise) for the first time, you are eligible for a full refund within 14 days of your initial payment.
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="border-t border-border pt-3">No questions asked</div>
                <div className="border-t border-border pt-3">Includes Weekly, Monthly, & Yearly Pro plans</div>
                <div className="border-t border-border pt-3">Includes all paid API plans (Developer, Startup, Growth, Enterprise)</div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Renewals */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                02 — Renewals
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                We do <span className="font-medium text-foreground">not</span> offer refunds for automatic renewals. It is your responsibility to cancel your subscription before the renewal date if you no longer wish to use the service. This applies equally to Pro subscriptions and API plans.
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="border-t border-border pt-3">Forgot to cancel? Not refundable.</div>
                <div className="border-t border-border pt-3">Partial months are not prorated.</div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Credits */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                03 — API Credits
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                One-time API credit top-ups (Starter, Builder, Scale, Pro credit packages) are <span className="font-medium text-foreground">non-refundable</span>. Credits never expire and carry over indefinitely, so there is no risk of losing unused balance.
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="border-t border-border pt-3">Credits are consumed only when your monthly plan quota is exceeded.</div>
                <div className="border-t border-border pt-3">Unused credits remain on your account until fully used — they do not expire.</div>
                <div className="border-t border-border pt-3">If you believe credits were consumed incorrectly due to a technical error, contact us and we will investigate.</div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Policy Limits */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                04 — Policy Limits
              </h2>
              <div className="rounded-lg bg-muted/20 border border-border px-5 py-4 mb-6">
                <p className="text-sm font-medium text-foreground mb-1">Fair Use</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This policy exists to protect genuine customers. Attempts to exploit it will result in refund eligibility being revoked.
                </p>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="border-t border-border pt-3">Refunds are available within 14 days of the initial purchase.</div>
                <div className="border-t border-border pt-3">Refunds apply only to first-time purchases and not to renewals.</div>
                <div className="border-t border-border pt-3">Accounts found abusing the refund policy may be denied refunds.</div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Payment Provider */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                05 — Payment Provider
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                We use Paddle as our secure payment processor for both Pro subscriptions and API plans. Refund processing times depend on their policies and your bank.
              </p>
              <div className="rounded-lg bg-muted/20 border border-border px-5 py-4">
                <p className="text-sm font-medium text-foreground mb-1">Paddle Refunds</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Refunds typically take 5-10 business days to appear on your bank statement, depending on your bank.
                </p>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* FAQ */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
                06 — Common Questions
              </h2>
              <div className="space-y-0">
                {[
                  {
                    q: "How do I request a refund?",
                    a: <>Please contact our support team at <a href="mailto:support@freecustom.email" className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors">support@freecustom.email</a> within 14 days of your purchase. Include your Order ID or the email address used for purchase, and whether it is for a Pro subscription or an API plan.</>
                  },
                  {
                    q: "I forgot to cancel my subscription. Can I get a refund?",
                    a: "As per our policy, we do not refund renewals for either Pro or API plans. However, you can cancel immediately to prevent future charges. You will retain access to your plan's features until the end of your current billing period."
                  },
                  {
                    q: "Can I get a refund for API credits?",
                    a: "No. One-time credit purchases are non-refundable. Credits never expire and are only consumed when you exceed your plan's monthly quota, so your balance is always preserved. If you believe a technical error caused incorrect consumption, reach out and we will review it."
                  },
                  {
                    q: "What happens if I dispute the charge with my bank?",
                    a: "We strongly recommend contacting us first. Opening a dispute freezes your account immediately. We resolve 99% of refund requests within 24 hours when contacted directly."
                  },
                  {
                    q: "Are technical issues grounds for a refund?",
                    a: "Yes. If our service is not working as advertised and we cannot fix the issue for you, you are eligible for a refund even outside the 14-day window in specific cases. This applies to both Pro subscriptions and API plans."
                  },
                  {
                    q: "I upgraded my API plan mid-cycle. Am I eligible for a refund on the old plan?",
                    a: "Plan upgrades are prorated — you are charged only for the remaining portion of the new billing cycle. The 14-day refund window applies to your initial first-time purchase on each distinct plan tier, not to upgrade charges."
                  },
                ].map((item, i) => (
                  <div key={i} className="border-t border-border py-6 last:pb-0">
                    <p className="text-sm font-medium text-foreground mb-2">{item.q}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Actions */}
            <section>
              <p className="text-sm text-muted-foreground mb-5">Need to cancel your subscription?</p>
              <div className="flex gap-3">
                <Link href="/dashboard/profile">
                  <Button variant="outline" size="sm">Manage Subscription</Button>
                </Link>
                <Link href="/contact">
                  <Button size="sm">Contact Support</Button>
                </Link>
              </div>
            </section>

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}