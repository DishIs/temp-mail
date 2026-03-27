// app/api/automation/make/page.tsx
"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import {
  Clock, Check, ArrowRight, ChevronRight, Bell, Workflow, Zap, Bot, Loader2,
} from "lucide-react";

// ─── data ──────────────────────────────────────────────────────────────────

const PLANNED_FEATURES = [
  {
    icon: "📧",
    title: "New Email trigger",
    desc: "Fire a Make scenario the moment an email lands in your FCE inbox.",
  },
  {
    icon: "🔢",
    title: "OTP Extraction action",
    desc: "Parse and return just the numeric code — no regex, no parsing logic needed.",
  },
  {
    icon: "📬",
    title: "Create Inbox action",
    desc: "Spin up a fresh disposable inbox as a step in any Make scenario.",
  },
  {
    icon: "👀",
    title: "Watch Inbox action",
    desc: "Open a live WebSocket watcher and receive emails in real time within your flow.",
  },
  {
    icon: "🗑️",
    title: "Delete Inbox action",
    desc: "Clean up inboxes automatically after your flow completes.",
  },
  {
    icon: "📋",
    title: "List Messages action",
    desc: "Retrieve all messages from an inbox and iterate over them in your scenario.",
  },
];

const USE_CASES = [
  "Automated signup verification for no-code apps",
  "Forward OTPs to Google Sheets or Airtable",
  "Trigger Slack alerts when specific emails arrive",
  "Connect email verification to 2,000+ Make apps",
  "Build complex multi-step approval workflows",
  "Pipe email data into CRMs without writing code",
];

const DOT_BG = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const Cols = () => (
  <>
    <div
      className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60"
      aria-hidden
    />
    <div
      className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60"
      aria-hidden
    />
  </>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MakeClient() {
  const [email, setEmail]       = useState("");
  const [token, setToken]       = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, source: "make" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        // Reset Turnstile so the user can get a fresh token
        setToken(null);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground overflow-x-hidden min-h-screen">

      {/* breadcrumb */}
      <div className="border-b border-border px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Link
            href="/api/automation"
            className="hover:text-foreground transition-colors"
          >
            Automation
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Make</span>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        className="relative px-6 py-28 md:py-36 text-center"
        style={DOT_BG}
      >
        <Cols />
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div
            className="inline-flex items-center gap-2 font-mono text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-600 px-3 py-1.5 rounded mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Clock className="h-3 w-3" />
            COMING Q2 2026
          </motion.div>

          <motion.div
            className="text-6xl mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          >
            ⬡
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-5 leading-[1.1]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            FreeCustom.Email
            <br />
            for Make
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Native Make (formerly Integromat) integration — disposable inboxes,
            OTP extraction, and real-time email triggers, all as drag-and-drop
            modules in your scenarios.
          </motion.p>

          {/* ── Waitlist form ── */}
          <motion.div
            className="max-w-sm mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {submitted ? (
              <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-mono text-emerald-600">
                  You&apos;re on the list! We&apos;ll notify you.
                </span>
              </div>
            ) : (
              <form onSubmit={handleNotify} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    className="flex-1 h-9 px-3 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="gap-1.5"
                    disabled={!token || loading}
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Bell className="h-3.5 w-3.5" />
                    )}
                    {loading ? "Joining…" : "Notify me"}
                  </Button>
                </div>

                {/* Turnstile widget — renders the challenge */}
                <div className="flex justify-center">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                    onSuccess={(t) => setToken(t)}
                    onExpire={() => setToken(null)}
                    onError={() => setToken(null)}
                    options={{ theme: "auto", size: "normal" }}
                  />
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-xs font-mono text-red-500 text-center">
                    {error}
                  </p>
                )}
              </form>
            )}

            <p className="font-mono text-[10px] text-muted-foreground/50 mt-2 text-center">
              No spam. One email when we launch.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── PLANNED FEATURES ──────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-2 mb-10">
              <div className="w-0.5 h-4 bg-border" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Planned modules
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-14 tracking-tight">
              What&apos;s coming
            </h2>
          </FadeIn>

          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 rounded-lg overflow-hidden">
            {PLANNED_FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.06}>
                <div className="bg-background px-6 py-8 h-full hover:bg-muted/10 transition-colors relative">
                  <span className="absolute top-3 right-3 font-mono text-[8px] uppercase tracking-wider border border-amber-500/20 text-amber-600/60 px-1.5 py-px rounded">
                    planned
                  </span>
                  <p className="text-2xl mb-3">{f.icon}</p>
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {f.title}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ─────────────────────────────────────────────────── */}
      <section
        className="relative border-t border-border px-6 py-24"
        style={DOT_BG}
      >
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-2 mb-10">
              <div className="w-0.5 h-4 bg-border" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Use cases
              </span>
            </div>
            <div className="grid lg:grid-cols-2 gap-14">
              <div>
                <h2 className="text-3xl font-bold mb-6 tracking-tight">
                  Connect email to everything
                </h2>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  With 2,000+ Make integrations, you&apos;ll be able to pipe
                  disposable inbox data into any app — without writing a single
                  line of code.
                </p>
                <ul className="space-y-2.5">
                  {USE_CASES.map((uc) => (
                    <li
                      key={uc}
                      className="flex items-center gap-3 text-sm font-mono text-muted-foreground"
                    >
                      <Check className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      {uc}
                    </li>
                  ))}
                </ul>
              </div>

              {/* In the meantime */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-0.5 h-4 bg-border" />
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    In the meantime
                  </span>
                </div>
                {[
                  {
                    title: "Use the REST API",
                    desc: "Full HTTP API for custom Make HTTP modules today.",
                    icon: <Workflow className="h-4 w-4" />,
                    href: "/api/docs/quickstart",
                  },
                  {
                    title: "Try OpenClaw",
                    desc: "AI agent automation — works with fce CLI right now.",
                    icon: <Bot className="h-4 w-4" />,
                    href: "/api/automation/openclaw",
                  },
                  {
                    title: "Check Zapier",
                    desc: "Another no-code option — also coming soon.",
                    icon: <Zap className="h-4 w-4" />,
                    href: "/api/automation/zapier",
                  },
                ].map((alt) => (
                  <Link
                    key={alt.href}
                    href={alt.href}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/10 transition-colors group"
                  >
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {alt.icon}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {alt.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{alt.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30">
          Make × FreeCustom.Email · Coming Q2 2026
        </p>
      </footer>
    </div>
  );
}