// app/policies/cookie/page.tsx
"use client";

import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "next-auth/react";

const LAST_UPDATED = "February 2026";

export default function CookiePolicyPage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />

        <div className="max-w-2xl mx-auto py-20 px-6">

          {/* Header */}
          <div className="mb-16">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Legal · Cookie Policy
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-5">
              Cookie Policy
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
              This policy explains what cookies we use, why we use them, and the choices you have — including how to opt out at any time.
            </p>
            <p className="mt-5 text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          </div>

          <div className="space-y-16">

            {/* What Are Cookies */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                01 — What Are Cookies?
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Cookies are small text files placed on your device when you visit a website. They are widely used to make websites function correctly, work more efficiently, and to provide basic reporting information to site owners.
                </p>
                <p>
                  We also use <span className="text-foreground font-medium">localStorage</span> — a browser-based storage mechanism — for similar lightweight purposes. Unlike cookies, localStorage data is never transmitted to our servers; it lives exclusively in your browser.
                </p>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Necessary Cookies */}
            <section>
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  02 — Necessary Cookies
                </h2>
                <span className="text-xs text-muted-foreground">Always active</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Required for the site to function. Cannot be disabled.
              </p>
              <div className="space-y-0">
                {[
                  { name: "next-auth.session-token", purpose: "Keeps you securely logged in to your dashboard", expires: "30 days" },
                  { name: "silktideCookieBanner_InitialChoice", purpose: "Remembers that you have already responded to the cookie banner", expires: "Persistent (localStorage)" },
                  { name: "silktideCookieChoice_necessary", purpose: "Stores your consent choice for necessary cookies", expires: "Persistent (localStorage)" },
                ].map((row, i) => (
                  <div key={i} className="py-4 border-t border-border first:border-t-0 grid grid-cols-[1fr_2fr_1fr] gap-4 text-sm">
                    <span className="font-mono text-xs text-foreground break-all self-start">{row.name}</span>
                    <span className="text-muted-foreground">{row.purpose}</span>
                    <span className="text-muted-foreground text-right">{row.expires}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Analytics Cookies */}
            <section>
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  03 — Analytics Cookies
                </h2>
                <span className="text-xs text-muted-foreground">Optional — opt-in</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Help us understand how visitors use the site. Only set if you accept analytics.
              </p>
              <div className="space-y-0 mb-6">
                {[
                  { name: "_ga", purpose: "Google Analytics — distinguishes unique users using a randomly generated ID", expires: "2 years" },
                  { name: "_ga_RXTEEVC8C4", purpose: "Google Analytics — persists session state for this specific GA property", expires: "2 years" },
                  { name: "silktideCookieChoice_analytics", purpose: "Stores your consent choice for analytics cookies", expires: "Persistent (localStorage)" },
                ].map((row, i) => (
                  <div key={i} className="py-4 border-t border-border first:border-t-0 grid grid-cols-[1fr_2fr_1fr] gap-4 text-sm">
                    <span className="font-mono text-xs text-foreground break-all self-start">{row.name}</span>
                    <span className="text-muted-foreground">{row.purpose}</span>
                    <span className="text-muted-foreground text-right">{row.expires}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Analytics data is <span className="text-foreground font-medium">aggregate and non-identifiable</span>. We use it only to understand general usage patterns (e.g. most visited pages, session duration). We do not use it to build personal profiles or serve ads.
              </p>
            </section>

            <div className="border-t border-border" />

            {/* Google Consent Mode */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                04 — Google Consent Mode
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                How we handle analytics when you have not yet given consent.
              </p>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  We implement <span className="text-foreground font-medium">Google Consent Mode v2</span>. When you first visit the site — before making any cookie choice — all analytics storage is set to <span className="text-foreground font-medium">denied</span> by default. Google Analytics will not set cookies or collect identifiable data until you explicitly accept analytics.
                </p>
                <p>
                  If you reject analytics, Google may still receive a cookieless ping for conversion modelling purposes, but <span className="text-foreground font-medium">no cookies are set and no personally identifiable data is sent</span>.
                </p>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Local Storage */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                05 — Local Storage (Non-Cookie)
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                In addition to cookies, we use your browser's <span className="text-foreground font-medium">localStorage</span> for the following purposes:
              </p>
              <div className="space-y-5">
                {[
                  { key: "recentInbox", desc: "Stores the name of the last inbox you visited so the site can restore it on your next visit. Contains no personal data." },
                  { key: "silktideCookieChoice_*", desc: "Stores your cookie consent preferences so you are not asked again on repeat visits." },
                ].map((item) => (
                  <div key={item.key} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
                    <span className="font-mono text-xs text-foreground block mb-1">{item.key}</span>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground rounded-lg bg-muted/20 border border-border px-4 py-3">
                localStorage data is <span className="text-foreground font-medium">never transmitted to our servers</span> and is only accessible within your own browser.
              </p>
            </section>

            <div className="border-t border-border" />

            {/* Managing Preferences */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                06 — Managing Your Preferences
              </h2>
              <div className="space-y-6">
                <div className="border-t border-border pt-6 first:border-t-0 first:pt-0">
                  <h3 className="text-sm font-medium text-foreground mb-2">Cookie banner</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Click the cookie icon in the bottom-left corner of any page at any time to open the preferences panel and change your consent choices.
                  </p>
                </div>
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-medium text-foreground mb-2">Browser settings</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You can also block or delete cookies at any time via your browser settings. Note that disabling necessary cookies may break core site functionality such as login.
                  </p>
                </div>
                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-medium text-foreground mb-2">Opt-out of Google Analytics</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You can install the{" "}
                    <a
                      href="https://tools.google.com/dlpage/gaoptout"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                    >
                      Google Analytics Opt-out Browser Add-on
                    </a>{" "}
                    to prevent your data from being used by Google Analytics across all websites.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t border-border" />

            {/* No Advertising */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                07 — No Advertising Cookies
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                FreeCustom.Email does not serve ads and does not use advertising or tracking cookies of any kind. We do not share your data with advertisers, ad networks, or data brokers. The only third-party service with any data access is Google Analytics, and only when you have explicitly opted in.
              </p>
            </section>

            <div className="border-t border-border" />

            {/* Contact */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                Questions about this policy?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                If you have any questions about how we use cookies or wish to exercise your rights, please reach out.
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