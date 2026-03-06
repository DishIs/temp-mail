// app/policies/do-not-sell/page.tsx
"use client";

import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DoNotSellPage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />

        <div className="max-w-2xl mx-auto py-20 px-6">

          {/* Header */}
          <div className="mb-16">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Legal · CCPA/CPRA
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-5">
              Do Not Sell or Share My Personal Information
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
              Your choices under CCPA/CPRA and other privacy laws
            </p>
          </div>

          <div className="space-y-16">

            {/* We do not sell */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                01 — We do not sell your data
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  FreeCustom.Email does not sell your personal information to third parties. We do not share your information with advertisers or data brokers for monetary or other valuable consideration.
                </p>
                <p>
                  If you are a California resident (or under another law that uses similar definitions), you have the right to opt out of the &quot;sale&quot; or &quot;sharing&quot; of your personal information. Because we do not sell or share personal information for cross-context behavioral advertising, there is no opt-out link required for that use.
                </p>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Your Rights */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                02 — Your Privacy Rights
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                You can still exercise other privacy rights at any time:
              </p>
              <div className="space-y-0">
                {[
                  {
                    right: "Access / Know",
                    desc: "Request a copy of the personal data we hold about you (e.g. via your profile and account settings, or by contacting us)."
                  },
                  {
                    right: "Delete",
                    desc: "Request account deletion from your profile (Settings → Delete Account). A 7-day waiting period applies; you can cancel during that time."
                  },
                  {
                    right: "Correct",
                    desc: "Update your name and preferences in your dashboard."
                  },
                  {
                    right: "Limit use of sensitive data",
                    desc: "We use sensitive personal information only as needed to provide the service (e.g. authentication); we do not use it for inferring characteristics."
                  },
                ].map((item, i) => (
                  <div key={i} className="border-t border-border py-5 last:pb-0">
                    <span className="text-sm font-medium text-foreground">{item.right}</span>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Contact */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                Submit a Request
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                To submit a formal request or ask questions about your data, contact us at{" "}
                <a
                  href="mailto:privacy@freecustom.email"
                  className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                >
                  privacy@freecustom.email
                </a>.
              </p>
              <Link
                href="/policies/privacy"
                className="text-sm text-muted-foreground underline underline-offset-4 decoration-border hover:text-foreground hover:decoration-foreground transition-colors"
              >
                ← Back to Privacy Policy
              </Link>
            </section>

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}