// app/terms-of-service/page.tsx
"use client";

import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />

        <div className="max-w-2xl mx-auto py-20 px-6">

          {/* Header */}
          <div className="mb-16">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Legal · Community Guidelines
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-5">
              Terms of Service
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
              To ensure FreeCustom.Email remains a safe and reliable resource, all users must adhere to these guidelines.
            </p>
          </div>

          <div className="space-y-16">

            {/* Core Principles */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                01 — Core Principles
              </h2>
              <p className="text-sm text-muted-foreground mb-6">Use FreeCustom.Email wisely and legally.</p>
              <div className="space-y-0">
                {[
                  {
                    title: "Lawful",
                    body: "You agree not to use our service for any illegal activities, including fraud, harassment, or distributing malicious software."
                  },
                  {
                    title: "Respectful",
                    body: "Do not use our service to send spam, unsolicited bulk messages, or engage in abusive behavior towards others."
                  },
                  {
                    title: "Ethical",
                    body: "Use it for intended purposes (testing, verifying, privacy). Do not circumvent legitimate security measures of other services."
                  },
                ].map((item, i) => (
                  <div key={i} className="border-t border-border py-5 last:pb-0">
                    <p className="text-sm font-medium text-foreground mb-1.5">{item.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Nature of Service */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                02 — Nature of Service
              </h2>
              <div className="space-y-0 text-sm text-muted-foreground">
                {[
                  {
                    title: "Temporary & Disposable",
                    body: "Emails are not intended for long-term storage. We are not responsible for data loss due to the ephemeral nature of the service. Pro subscribers and API users with Pro-persistence plans are subject to their respective retention terms."
                  },
                  {
                    title: "No Account Creation",
                    body: "You use the service without a formal account/password (unless upgrading to Pro or using the API). This underscores its temporary nature."
                  },
                  {
                    title: "No Permanent Access",
                    body: "Saving emails in your history does not guarantee permanent access to that address or its contents unless you hold an active Pro subscription."
                  },
                ].map((item, i) => (
                  <div key={i} className="border-t border-border py-5 last:pb-0">
                    <span className="font-medium text-foreground">{item.title}: </span>
                    {item.body}
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Public Nature Warning */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                03 — Public Nature Warning
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  While our system strives to provide unique inboxes, the fundamental design of temp mail means there is <span className="font-medium text-foreground">no inherent security</span> for the content of emails received.
                </p>
                <p className="font-medium text-foreground">
                  Do not send or receive sensitive personal information (passwords, financial details, etc.) through our service.
                </p>
                <p>
                  Treat messages as potentially viewable if an address were to be re-used or guessed by others. API users provisioning inboxes for end-users carry this responsibility for their own users.
                </p>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Prohibited Activities */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                04 — Prohibited Activities
              </h2>
              <div className="space-y-0">
                {[
                  "Illegal Use (Violating local/international laws)",
                  "Spamming & Unsolicited bulk messages",
                  "Phishing & Malware distribution",
                  "Harassment, Stalking, or Defamation",
                  "Impersonation for malicious purposes",
                  "Automated Abuse (Bots/Scripts) beyond your API plan's rate limits",
                  "Circumventing Security Measures",
                  "Unauthorized Commercial Resale",
                  "Exposing API keys in public repositories or client-side code",
                ].map((item, i) => (
                  <div key={i} className="border-t border-border py-3 text-sm text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* API Terms */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                05 — API Terms
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Use of the FreeCustom.Email <span className="font-medium text-foreground">API</span> (api2.freecustom.email) and related developer products is subject to these Terms of Service and our{" "}
                  <Link
                    href="/policies/privacy"
                    className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>.
                </p>
                <p>
                  <span className="font-medium text-foreground">Acceptable use:</span> You may use the API only for lawful purposes — e.g. testing, development, automation, and temporary inbox needs. You must not use the API to send spam, phish, harass, or circumvent other services' security. Rate limits and plan-specific feature restrictions (OTP, WebSocket, attachments, custom domains) apply as described in the{" "}
                  <Link
                    href="/api/pricing"
                    className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                  >
                    API pricing
                  </Link>{" "}
                  and documentation.
                </p>
                <p>
                  <span className="font-medium text-foreground">Plans & Credits:</span> Paid API plans (Developer, Startup, Growth, Enterprise) unlock features and set base rate limits. One-time credit top-ups add request capacity beyond your monthly quota and never expire. Credits are non-refundable; paid API plan subscriptions are subject to our{" "}
                  <Link
                    href="/policies/refund"
                    className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                  >
                    Refund Policy
                  </Link>{" "}
                  (14-day window on first-time purchases).
                </p>
                <p>
                  <span className="font-medium text-foreground">Credentials:</span> You are responsible for keeping your API keys secure. Do not expose keys in client-side code or public repositories. We may revoke keys or suspend access for abuse or violation of these terms.
                </p>
                <p>
                  <span className="font-medium text-foreground">Data:</span> Data processed via the API (inbox addresses, messages, OTPs) is subject to the same data retention and deletion policies as the web app. Persistence duration depends on your API plan — Free and Developer plans retain emails for up to 24 hours; Growth and Enterprise plans retain emails indefinitely (up to plan storage limits). Account deletion applies to both app and API usage.
                </p>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Legal Disclosures */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
                06 — Legal Disclosures
              </h2>
              <div className="space-y-0">
                {[
                  {
                    title: "Right to Moderate & Terminate",
                    body: (
                      <>
                        <p className="mb-3">FreeCustom.Email reserves the right, at our sole discretion, to:</p>
                        <div className="space-y-1.5 pl-4 border-l border-border text-muted-foreground">
                          <p>Monitor usage to ensure compliance with our terms.</p>
                          <p>Block access from certain IP addresses or ranges if abuse is detected.</p>
                          <p>Remove or block access to email addresses found to be involved in prohibited activities.</p>
                          <p>Revoke API keys or suspend API access for accounts that violate these terms.</p>
                          <p>Terminate or suspend access to our service for users who violate these terms, without prior notice.</p>
                        </div>
                      </>
                    )
                  },
                  {
                    title: "Disclaimer of Warranties",
                    body: "FreeCustom.Email is provided \"as is\" and \"as available\" without any warranties, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or completely secure."
                  },
                  {
                    title: "Limitation of Liability",
                    body: "By using our service, you agree that FreeCustom.Email and its operators are not liable for any damages, data loss, or consequences arising from your use of, or inability to use, the service. This includes use of the API and any downstream applications built on top of it."
                  },
                ].map((item, i) => (
                  <div key={i} className="border-t border-border py-6 last:pb-0">
                    <p className="text-sm font-medium text-foreground mb-3">{item.title}</p>
                    <div className="text-sm text-muted-foreground leading-relaxed">{item.body}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Agreement Footer */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                Your Agreement
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xl">
                By accessing or using FreeCustom.Email — including the web app and API — you signify your agreement to abide by the spirit of these guidelines.
              </p>
              <div className="flex gap-3">
                <Link href="/">
                  <Button size="sm">Accept & Continue to Inbox</Button>
                </Link>
                <Link href="/policies/privacy">
                  <Button variant="outline" size="sm">View Privacy Policy</Button>
                </Link>
              </div>
            </section>

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}