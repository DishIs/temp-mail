// app/privacy-policy/page.tsx
"use client";

import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />

        <div className="max-w-2xl mx-auto py-20 px-6">

          {/* Header */}
          <div className="mb-16">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Legal · Privacy Policy
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-5">
              Privacy Policy
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
              Transparency is our core value. Please read this document carefully to understand how your data is handled.
            </p>
            <p className="mt-5 text-xs font-medium text-foreground bg-muted/20 border border-border rounded-lg px-4 py-3">
              Important: You should have no expectation of privacy when using public inboxes.
            </p>
          </div>

          <div className="space-y-16">

            {/* Google User Data */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                01 — Google User Data Policy
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Specific details regarding our integration with Google Services (Login/Auth).
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Data Accessed</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    When you choose to sign in using Google, our application accesses the following specific types of Google user data:
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="border-t border-border pt-3">
                      <span className="font-medium text-foreground">Basic Profile Information</span>
                      <p className="mt-0.5">Your name and profile picture URL.</p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <span className="font-medium text-foreground">Email Address</span>
                      <p className="mt-0.5">The primary email address associated with your Google account.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">Data Usage</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    We use the Google user data we access solely for the following purposes:
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="border-t border-border pt-3">
                      <span className="font-medium text-foreground">Authentication</span>
                      <p className="mt-0.5">To verify your identity and allow you to log in to your dashboard securely without creating a separate password.</p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <span className="font-medium text-foreground">Account Management</span>
                      <p className="mt-0.5">To display your name and avatar in the application header and user profile section.</p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <span className="font-medium text-foreground">Communication</span>
                      <p className="mt-0.5">To send critical transactional emails (e.g., subscription receipts) to your verified email address. We do not sell your data or use it for advertising.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Public Inboxes */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                02 — Public Inboxes
              </h2>
              <div className="space-y-5 text-sm text-muted-foreground">
                <div className="border-t border-border pt-5 first:border-t-0 first:pt-0">
                  <p className="font-medium text-foreground mb-1">All inboxes are public</p>
                  <p className="leading-relaxed">Any message sent to FreeCustom.Email addresses (on public domains) can be read by any user who guesses the inbox name.</p>
                </div>
                <div className="border-t border-border pt-5">
                  <p className="font-medium text-foreground mb-1">No sign-in required for public access</p>
                  <p className="leading-relaxed">There are no security measures to access public inboxes or view messages contained within them.</p>
                </div>
              </div>
              <p className="mt-6 text-sm font-medium text-foreground bg-muted/20 border border-border rounded-lg px-4 py-3">
                Do not send sensitive information (home address, passwords, phone numbers) to these addresses.
              </p>
            </section>

            <div className="border-t border-border" />

            {/* Security Notice */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                03 — Security Notice
              </h2>
              <div className="space-y-5 text-sm text-muted-foreground">
                <div className="border-t border-border pt-5 first:border-t-0 first:pt-0">
                  <p className="font-medium text-foreground mb-1">Inbox Aliases</p>
                  <p className="leading-relaxed">
                    Inbox aliases provide basic obfuscation but are <span className="font-medium text-foreground">not secure</span>. The generation algorithm is public and reversible. Do not rely on aliases for confidentiality.
                  </p>
                </div>
                <div className="border-t border-border pt-5">
                  <p className="font-medium text-foreground mb-1">Anonymity</p>
                  <p className="leading-relaxed">
                    FreeCustom.Email is <span className="font-medium text-foreground">not designed for anonymity</span> and is not a replacement for anonymous re-mailers or VPN services.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Account Deletion */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                04 — Account Deletion & Data Retention
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  You may request account deletion from your profile (Settings → Delete Account). Deletion is <span className="font-medium text-foreground">scheduled</span> with a 7-day waiting period. During that time you can cancel by logging in and choosing &quot;Do not delete my account&quot; or using the link in the confirmation email.
                </p>
                <p>
                  <span className="font-medium text-foreground">Deleted immediately upon request:</span> stored emails, attachments, inbox addresses, Redis mailbox data, and user preferences. API keys are revoked. Subscriptions are set to cancelled.
                </p>
                <p>
                  <span className="font-medium text-foreground">After the 7-day period:</span> your account is permanently converted to a tombstone. We keep only identifiers needed for billing/legal (e.g. payment logs). Your email may be blocked from re-registering for a short cooldown to prevent abuse.
                </p>
                <p>
                  For the API, the same account and deletion policy applies; deleting your account removes app and API data.
                </p>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Do Not Sell */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                05 — Sale of Personal Information
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We do <span className="font-medium text-foreground">not sell</span> your personal information. We do not share your data with third parties for their marketing or for &quot;sale&quot; as defined under the CCPA/CPRA. For more options and to submit a &quot;Do Not Sell or Share My Personal Information&quot; request, see our{" "}
                <Link
                  href="/policies/do-not-sell"
                  className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                >
                  Do Not Sell My Personal Information
                </Link>{" "}
                page.
              </p>
            </section>

            <div className="border-t border-border" />

            {/* Logging & Tracking */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                06 — Logging & Data Collection
              </h2>
              <div className="space-y-5 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground mb-2">Connection Logging</p>
                  <p className="leading-relaxed">
                    All email and web connections to our servers are recorded to help prevent abuse and improve service reliability. We cannot provide users with information about specific emails or their delivery status.
                  </p>
                </div>
                <div className="border-t border-border pt-5">
                  <p className="font-medium text-foreground mb-2">No User Tracking</p>
                  <p className="leading-relaxed mb-3">
                    We do <span className="font-medium text-foreground">not track users</span> across the web or use cookies to store personal profiling information.
                  </p>
                  <div className="space-y-1.5 text-sm text-muted-foreground pl-4 border-l border-border">
                    <p>The only local storage used is for the most recent inbox you visited (for convenience).</p>
                    <p>We use an analytics pixel to collect <span className="font-medium text-foreground">aggregate, non-identifiable data only</span>.</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Contact */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                Questions regarding this policy?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                If you have concerns about how your data is handled, please contact us.
              </p>
              <a
                href="mailto:privacy@freecustom.email"
                className="text-sm text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
              >
                privacy@freecustom.email
              </a>
            </section>

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}