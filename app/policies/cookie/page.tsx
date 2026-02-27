// app/policies/cookie/page.tsx
"use client";

import {
  Cookie,
  ToggleLeft,
  BarChart2,
  ShieldCheck,
  Settings2,
  RefreshCw,
  Mail,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

        <div className="container max-w-4xl mx-auto py-12 px-4 sm:px-6">

          {/* ── Header ── */}
          <div className="text-center mb-12 space-y-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Cookie className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Cookie Policy
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This policy explains what cookies we use, why we use them, and the choices you have — including how to opt out at any time.
            </p>
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium border">
              Last updated: {LAST_UPDATED}
            </div>
          </div>

          <div className="space-y-8">

            {/* ── What Are Cookies ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-primary" /> What Are Cookies?
                </CardTitle>
                <CardDescription>A quick explanation of the technology involved.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Cookies are small text files placed on your device when you visit a website. They are widely used to make websites function correctly, work more efficiently, and to provide basic reporting information to site owners.
                </p>
                <p>
                  We also use <strong className="text-foreground">localStorage</strong> — a browser-based storage mechanism — for similar lightweight purposes. Unlike cookies, localStorage data is never transmitted to our servers; it lives exclusively in your browser.
                </p>
              </CardContent>
            </Card>

            {/* ── Cookies We Use ── */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ToggleLeft className="w-6 h-6 text-primary" /> Cookies We Use
              </h2>

              {/* Necessary */}
              <Card className="border-green-500/20 bg-green-50/50 dark:bg-green-950/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400 text-lg">
                    <ShieldCheck className="w-5 h-5" /> Necessary Cookies
                    <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                      Always active
                    </span>
                  </CardTitle>
                  <CardDescription>Required for the site to function. Cannot be disabled.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border border-green-200 dark:border-green-800 overflow-hidden text-sm">
                    <div className="grid grid-cols-3 bg-green-100/60 dark:bg-green-900/30 px-4 py-2 font-medium text-foreground text-xs uppercase tracking-wide">
                      <span>Name</span>
                      <span>Purpose</span>
                      <span>Expires</span>
                    </div>
                    <Separator className="bg-green-200 dark:bg-green-800" />
                    {[
                      { name: "next-auth.session-token", purpose: "Keeps you securely logged in to your dashboard", expires: "30 days" },
                      { name: "silktideCookieBanner_InitialChoice", purpose: "Remembers that you have already responded to the cookie banner", expires: "Persistent (localStorage)" },
                      { name: "silktideCookieChoice_necessary", purpose: "Stores your consent choice for necessary cookies", expires: "Persistent (localStorage)" },
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-3 px-4 py-2.5 text-sm text-muted-foreground even:bg-muted/20">
                        <span className="font-mono text-xs text-foreground break-all">{row.name}</span>
                        <span>{row.purpose}</span>
                        <span>{row.expires}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analytics */}
              <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-lg">
                    <BarChart2 className="w-5 h-5" /> Analytics Cookies
                    <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Optional — opt-in
                    </span>
                  </CardTitle>
                  <CardDescription>Help us understand how visitors use the site. Only set if you accept analytics.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border border-blue-200 dark:border-blue-800 overflow-hidden text-sm">
                    <div className="grid grid-cols-3 bg-blue-100/60 dark:bg-blue-900/30 px-4 py-2 font-medium text-foreground text-xs uppercase tracking-wide">
                      <span>Name</span>
                      <span>Purpose</span>
                      <span>Expires</span>
                    </div>
                    <Separator className="bg-blue-200 dark:bg-blue-800" />
                    {[
                      { name: "_ga", purpose: "Google Analytics — distinguishes unique users using a randomly generated ID", expires: "2 years" },
                      { name: "_ga_RXTEEVC8C4", purpose: "Google Analytics — persists session state for this specific GA property", expires: "2 years" },
                      { name: "silktideCookieChoice_analytics", purpose: "Stores your consent choice for analytics cookies", expires: "Persistent (localStorage)" },
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-3 px-4 py-2.5 text-sm text-muted-foreground even:bg-muted/20">
                        <span className="font-mono text-xs text-foreground break-all">{row.name}</span>
                        <span>{row.purpose}</span>
                        <span>{row.expires}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Analytics data is <strong className="text-foreground">aggregate and non-identifiable</strong>. We use it only to understand general usage patterns (e.g. most visited pages, session duration). We do not use it to build personal profiles or serve ads.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ── Google Consent Mode ── */}
            <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-5 h-5" /> Google Consent Mode
                </CardTitle>
                <CardDescription>How we handle analytics when you have not yet given consent.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  We implement <strong className="text-foreground">Google Consent Mode v2</strong>. When you first visit the site — before making any cookie choice — all analytics storage is set to <strong className="text-foreground">denied</strong> by default. Google Analytics will not set cookies or collect identifiable data until you explicitly accept analytics.
                </p>
                <div className="flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    If you reject analytics, Google may still receive a cookieless ping for conversion modelling purposes, but <strong className="text-foreground">no cookies are set and no personally identifiable data is sent</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ── Local Storage ── */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Settings2 className="w-6 h-6 text-primary" /> Local Storage (Non-Cookie)
              </h2>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    In addition to cookies, we use your browser's <strong className="text-foreground">localStorage</strong> for the following purposes:
                  </p>
                  {[
                    { key: "recentInbox", desc: "Stores the name of the last inbox you visited so the site can restore it on your next visit. Contains no personal data." },
                    { key: "silktideCookieChoice_*", desc: "Stores your cookie consent preferences so you are not asked again on repeat visits." },
                  ].map((item) => (
                    <div key={item.key} className="flex gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono text-xs font-medium text-foreground">{item.key}</span>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-muted/40 rounded-md text-sm text-muted-foreground">
                    localStorage data is <strong className="text-foreground">never transmitted to our servers</strong> and is only accessible within your own browser.
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ── Managing Preferences ── */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-primary" /> Managing Your Preferences
              </h2>
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex gap-3">
                    <ToggleLeft className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-foreground">Cookie banner</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Click the cookie icon in the bottom-left corner of any page at any time to open the preferences panel and change your consent choices.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-3">
                    <Settings2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-foreground">Browser settings</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        You can also block or delete cookies at any time via your browser settings. Note that disabling necessary cookies may break core site functionality such as login.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-3">
                    <RefreshCw className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-foreground">Opt-out of Google Analytics</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        You can install the{" "}
                        <a
                          href="https://tools.google.com/dlpage/gaoptout"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2"
                        >
                          Google Analytics Opt-out Browser Add-on
                        </a>{" "}
                        to prevent your data from being used by Google Analytics across all websites.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ── No Advertising ── */}
            <Card className="border-green-500/20 bg-green-50/50 dark:bg-green-950/10">
              <CardContent className="pt-6 flex gap-4 items-start">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">No advertising cookies — ever</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    FreeCustom.Email does not serve ads and does not use advertising or tracking cookies of any kind. We do not share your data with advertisers, ad networks, or data brokers. The only third-party service with any data access is Google Analytics, and only when you have explicitly opted in.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ── Contact ── */}
            <div className="mt-12 text-center p-8 border rounded-xl bg-muted/20">
              <h3 className="text-lg font-semibold mb-2">Questions about this policy?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                If you have any questions about how we use cookies or wish to exercise your rights, please reach out.
              </p>
              <div className="inline-flex items-center gap-2 text-primary hover:underline cursor-pointer">
                <Mail className="w-4 h-4" />
                <a href="mailto:privacy@freecustom.email">privacy@freecustom.email</a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}