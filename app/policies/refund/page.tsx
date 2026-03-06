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
                <p className="text-xs text-muted-foreground leading-relaxed">First-time subscriptions</p>
              </div>
              <div className="bg-background p-6">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Not Eligible</p>
                <p className="text-sm font-medium text-foreground mb-1">Renewals</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Automatic recurring payments</p>
              </div>
            </section>

            {/* First 14 Days detail */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                01 — First 14 Days
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                If you purchased a <span className="font-medium text-foreground">Pro</span> subscription for the first time, you are eligible for a full refund within 14 days of your initial payment.
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="border-t border-border pt-3">No questions asked</div>
                <div className="border-t border-border pt-3">Includes Weekly, Monthly, & Yearly plans</div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Renewals */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                02 — Renewals
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                We do <span className="font-medium text-foreground">not</span> offer refunds for automatic renewals. It is your responsibility to cancel your subscription before the renewal date if you no longer wish to use the service.
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="border-t border-border pt-3">Forgot to cancel? Not refundable.</div>
                <div className="border-t border-border pt-3">Partial months are not prorated.</div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Payment Provider */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                03 — Payment Provider
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                We use Paddle as our secure payment processor. Refund processing times depend on their policies and your bank.
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
                04 — Common Questions
              </h2>
              <div className="space-y-0">
                {[
                  {
                    q: "How do I request a refund?",
                    a: <>Please contact our support team at <a href="mailto:support@freecustom.email" className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors">support@freecustom.email</a> within 14 days of your purchase. Include your Order ID or the email address used for purchase.</>
                  },
                  {
                    q: "I forgot to cancel my subscription. Can I get a refund?",
                    a: "As per our policy, we do not refund renewals. However, you can cancel immediately to prevent future charges. You will retain access to Pro features until the end of your current billing period."
                  },
                  {
                    q: "What happens if I dispute the charge with my bank?",
                    a: "We strongly recommend contacting us first. Opening a dispute freezes your account immediately. We resolve 99% of refund requests within 24 hours when contacted directly."
                  },
                  {
                    q: "Are technical issues grounds for a refund?",
                    a: "Yes. If our service is not working as advertised and we cannot fix the issue for you, you are eligible for a refund even outside the 14-day window in specific cases."
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