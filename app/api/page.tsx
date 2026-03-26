// app/api/page.tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Bot } from "lucide-react";
import { ApiHeroCode } from "@/app/api/ApiHeroCode";
import { ApiCodeExamples } from "@/app/api/ApiCodeExamples";
import { EmailFlowAnimation } from "@/app/api/EmailFlowAnimation";

// ─── data ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { title: "Instant inboxes",     desc: "Register an inbox and start receiving in seconds" },
  { title: "OTP extraction",      desc: "Regex-free. We parse the code, you get the value" },
  { title: "WebSocket push",      desc: "Real-time delivery. No polling required" },
  { title: "Credits system",      desc: "Pay per request, never expire" },
  { title: "Custom domains",      desc: "Use your own domain on Growth plan and above" },
  { title: "Attachment support",  desc: "Up to 50 MB on Enterprise" },
];

const PLANS = [
  { name: "Free",       price: "$0/mo",   reqSec: "1",   reqMonth: "5,000",      otp: false, ws: false, att: false, cd: false, support: "Community" },
  { name: "Developer",  price: "$7/mo",   reqSec: "10",  reqMonth: "100,000",    otp: false,  ws: false, att: false, cd: false, support: "Email" },
  { name: "Startup",    price: "$19/mo",  reqSec: "25",  reqMonth: "500,000",    otp: false,  ws: true,  att: true,  cd: false, support: "Email" },
  { name: "Growth",     price: "$49/mo",  reqSec: "50",  reqMonth: "2,000,000",  otp: true,  ws: true,  att: true,  cd: true,  support: "Priority" },
  { name: "Enterprise", price: "$149/mo", reqSec: "100", reqMonth: "10,000,000", otp: true,  ws: true,  att: true,  cd: true,  support: "Dedicated" },
];

const CREDITS_PACKS = [
  { amount: "$10",  requests: "200k",  perK: "$0.05" },
  { amount: "$25",  requests: "600k",  perK: "$0.042" },
  { amount: "$50",  requests: "1.5M",  perK: "$0.033" },
  { amount: "$100", requests: "4M",    perK: "$0.025" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Get an API key",       desc: "From your dashboard after signing in." },
  { step: "02", title: "Register an inbox",    desc: 'POST /v1/inboxes with { "inbox": "..." } to create a disposable address.' },
  { step: "03", title: "Read or stream",       desc: "Fetch messages with GET or subscribe via WebSocket for instant delivery." },
];

const OVERVIEW_FAQ = [
  { q: "What is a temp mail API?", a: "A temp mail API lets you create and use disposable email addresses programmatically. FreeCustom.Email provides instant inboxes, OTP extraction, and optional WebSocket delivery." },
  { q: "How does the FreeCustom.Email temp mail API work?", a: "Get an API key from the dashboard, then call api2.freecustom.email to register inboxes, list messages, and extract OTPs. The Free plan gives 5,000 requests/month; paid plans add OTP extraction, WebSocket push, attachments, and custom domains." },
  { q: "Who is the temp mail API for?", a: "Developers running integration tests, QA automation, CI/CD pipelines, and apps that need disposable inboxes for signup flows and verification testing." },
  { q: "Is there a free temp mail API?", a: "Yes. FreeCustom.Email offers a Free API plan with 5,000 requests per month, 1 req/sec. No credit card required." },
  { q: "Can I use the temp mail API with my own domain?", a: "Yes, on Growth and Enterprise plans. Add and verify your domain in the dashboard; then register inboxes like user@yourdomain.com via the API." },
];

const SDK_LANGS = [
  {
    id: "js",
    label: "JavaScript / TypeScript",
    badge: "npm",
    pkg: "freecustom-email",
    install: "npm install freecustom-email",
    href: "/api/docs/sdk/npm",
    snippet: `import { FreecustomEmailClient } from 'freecustom-email';

const client = new FreecustomEmailClient({ apiKey: 'fce_...' });
const otp = await client.otp.waitFor('test@ditmail.info');`,
  },
  {
    id: "py",
    label: "Python",
    badge: "PyPI",
    pkg: "freecustom-email",
    install: "pip install freecustom-email",
    href: "/api/docs/sdk/python",
    snippet: `from freecustom_email import FreeCustomEmail

client = FreeCustomEmail(api_key="fce_...")
otp = await client.otp.wait_for("test@ditmail.info")`,
  },
];

// ASCII fragments
const ASCII_FRAGMENTS = [
  { x: "2%",  y: "5%",  t: "EHLO api2.freecustom.email" },
  { x: "67%", y: "3%",  t: "250 2.1.0 Ok" },
  { x: "78%", y: "11%", t: "From: noreply@service.com" },
  { x: "1%",  y: "21%", t: "RCPT TO:<inbox@ditmail.info>" },
  { x: "71%", y: "27%", t: "Message-ID: <abc123@fce.email>" },
  { x: "4%",  y: "37%", t: "Content-Type: text/plain; charset=utf-8" },
  { x: "74%", y: "43%", t: "354 End data with <CR><LF>.<CR><LF>" },
  { x: "1%",  y: "51%", t: "X-OTP: 847291" },
  { x: "69%", y: "57%", t: "SMTP 220 mail.freecustom.email" },
  { x: "3%",  y: "67%", t: "Date: Thu, 4 Mar 2026 09:55:00 +0000" },
  { x: "72%", y: "73%", t: "250-STARTTLS" },
  { x: "2%",  y: "83%", t: "AUTH PLAIN" },
  { x: "67%", y: "87%", t: "MAIL FROM:<service@example.com>" },
  { x: "4%",  y: "93%", t: "Content-Transfer-Encoding: quoted-printable" },
  { x: "70%", y: "96%", t: "Subject: Your verification code is 847291" },
];

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

function AsciiLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {ASCII_FRAGMENTS.map((f, i) => (
        <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap"
          style={{ left: f.x, top: f.y, opacity: 0.042 }}>{f.t}</span>
      ))}
    </div>
  );
}

function SectionMarker({ index, total, label }: { index: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      <div className="w-0.5 h-4 bg-border" aria-hidden />
      <span className="font-mono text-xs text-foreground font-semibold">
        [ {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")} ]
      </span>
      <span className="text-muted-foreground/50 text-xs">·</span>
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

const Cols = () => (
  <>
    <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
    <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
  </>
);

const Tick  = () => <Check className="h-3.5 w-3.5 text-foreground shrink-0 mx-auto" />;
const Cross = () => <span className="block h-3.5 w-3.5 mx-auto rounded-full border border-border" />;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ApiOverviewPage() {
  const T = 8; // total sections

  return (
    <div className="bg-background text-foreground overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 py-28 text-center" style={DOT_BG}>
        <AsciiLayer />
        <Cols />

        <div className="relative z-10 max-w-3xl w-full">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <SectionMarker index={1} total={T} label="Main Features" />
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight text-foreground leading-[1.1] mb-5"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
            Disposable email<br />infrastructure for developers
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}>
            Programmatic temporary inboxes, real-time delivery via WebSocket, and automatic OTP extraction. Built for CI pipelines, test automation, and app development.
          </motion.p>

          <motion.div className="flex flex-wrap items-center justify-center gap-3 mb-12"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}>
            <Button asChild size="lg">
              <Link href="/auth?callbackUrl=/api/dashboard">Get API key</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/api/docs/quickstart">Read the docs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary/50 hover:bg-primary/5">
              <Link href="/ai" className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" /> Ask FCE AI
              </Link>
            </Button>
          </motion.div>

          <motion.div className="w-full text-left"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}>
            <ApiHeroCode />
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS — ANIMATED FLOW ──────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <AsciiLayer />
        <Cols />
        <div className="relative z-10 max-w-3xl mx-auto">
          <FadeIn>
            <SectionMarker index={2} total={T} label="Email journey" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
              From sent to extracted<br />in under 200ms
            </h2>
            <p className="text-sm text-muted-foreground mb-10 max-w-lg leading-relaxed">
              Your app sends a verification email. It hits our SMTP server, gets stored and parsed, and arrives at your code via WebSocket push — OTP already extracted, no regex needed.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <EmailFlowAnimation />
          </FadeIn>
        </div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-20" style={DOT_BG}>
        <Cols />
        <div className="relative z-10 max-w-3xl mx-auto">
          <FadeIn>
            <SectionMarker index={3} total={T} label="About this API" />
            <div className="rounded-lg border border-border bg-background/90 p-6 sm:p-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
              {[
                { label: "Base URL",     body: <><code className="rounded bg-muted/60 px-1.5 py-0.5 text-xs font-mono">https://api2.freecustom.email</code> — all endpoints live under <code className="rounded bg-muted/60 px-1.5 py-0.5 text-xs font-mono">/v1</code>.</> },
                { label: "Auth",         body: <>Send your key as <code className="rounded bg-muted/60 px-1.5 py-0.5 text-xs font-mono">Authorization: Bearer fce_…</code> or as <code className="rounded bg-muted/60 px-1.5 py-0.5 text-xs font-mono">api_key</code> query param. Get a key from the <Link href="/api/dashboard" className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors">Dashboard</Link>.</> },
                { label: "OpenAPI spec", body: <><a href="/openapi.yaml" className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors" target="_blank" rel="noopener noreferrer">/openapi.yaml</a> — use with any OpenAPI client or our interactive <Link href="/api/playground" className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors">Playground</Link>.</> },
                { label: "WebSocket",    body: <>Real-time inbox updates at <code className="rounded bg-muted/60 px-1.5 py-0.5 text-xs font-mono">wss://api2.freecustom.email/v1/ws</code> (Startup plan and above).</> },
              ].map(({ label, body }) => (
                <div key={label} className="border-t border-border pt-4 first:border-t-0 first:pt-0 flex gap-3">
                  <span className="font-medium text-foreground shrink-0 w-28">{label}</span>
                  <span>{body}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── SDK SECTION ───────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={4} total={T} label="Official SDKs" />
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2 leading-tight">
                  Up and running<br />in 30 seconds
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Install the official SDK for your language. Full TypeScript types, async/sync support, typed errors, and WebSocket built in.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/api/docs/sdk">All SDKs →</Link>
              </Button>
            </div>
          </FadeIn>

          <div className="grid gap-px bg-border sm:grid-cols-2 rounded-lg overflow-hidden">
            {SDK_LANGS.map((sdk, i) => (
              <FadeIn key={sdk.id} delay={i * 0.08}>
                <div className="bg-background h-full flex flex-col">
                  {/* header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest border border-border rounded px-1.5 py-px">
                        {sdk.badge}
                      </span>
                      <span className="text-sm font-medium text-foreground">{sdk.label}</span>
                    </div>
                    <Link href={sdk.href} className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
                      Docs →
                    </Link>
                  </div>

                  {/* install command */}
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/10">
                    <span className="font-mono text-[10px] text-muted-foreground/60 select-none">$</span>
                    <code className="font-mono text-xs text-foreground flex-1">{sdk.install}</code>
                    <button
                      onClick={() => navigator.clipboard?.writeText(sdk.install)}
                      className="font-mono text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors"
                      aria-label="Copy install command"
                    >
                      copy
                    </button>
                  </div>

                  {/* snippet */}
                  <div className="p-5 flex-1">
                    <pre className="font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre overflow-x-auto">
                      {sdk.snippet}
                    </pre>
                  </div>

                  {/* footer */}
                  <div className="px-5 py-4 border-t border-border">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={sdk.href}>View full SDK docs</Link>
                    </Button>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* stats bar */}
          <FadeIn delay={0.2}>
            <div className="mt-4 rounded-lg border border-border bg-muted/10 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
              {[
                { v: "TypeScript",  l: "fully typed" },
                { v: "async + sync", l: "both supported" },
                { v: "ESM + CJS",   l: "dual format" },
                { v: "0 deps*",     l: "* except httpx/ws" },
              ].map(({ v, l }) => (
                <div key={v} className="px-5 py-4 text-center">
                  <p className="font-mono text-xs font-semibold text-foreground">{v}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <AsciiLayer />
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={5} total={T} label="Features" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-14 max-w-lg leading-tight">
              Everything you need to handle email programmatically
            </h2>
          </FadeIn>
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 rounded-lg overflow-hidden">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.06}>
                <div className="bg-background px-6 py-8 h-full hover:bg-muted/10 transition-colors duration-200">
                  <p className="font-mono text-xs text-muted-foreground mb-3">{String(i + 1).padStart(2, "0")}</p>
                  <p className="text-sm font-semibold text-foreground mb-2">{f.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={6} total={T} label="How it works" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-14">
              Three steps to production
            </h2>
          </FadeIn>
          <div className="grid gap-px bg-border md:grid-cols-3 rounded-lg overflow-hidden">
            {HOW_IT_WORKS.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.08}>
                <div className="bg-background px-8 py-10 h-full">
                  <p className="text-6xl font-bold text-muted-foreground/15 font-mono mb-6 leading-none select-none">{step.step}</p>
                  <p className="text-base font-semibold text-foreground mb-2">{step.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLAN COMPARISON ───────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <AsciiLayer />
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={7} total={T} label="Plan comparison" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-14">Simple, predictable pricing</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-widest text-muted-foreground w-36">Feature</th>
                    {PLANS.map(p => <th key={p.name} className="py-3 px-3 text-center text-sm font-semibold text-foreground">{p.name}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { label: "Price",          fn: (p: typeof PLANS[0]) => <span className="font-semibold text-foreground">{p.price}</span> },
                    { label: "Req/sec",        fn: (p: typeof PLANS[0]) => p.reqSec },
                    { label: "Req/month",      fn: (p: typeof PLANS[0]) => p.reqMonth },
                    { label: "OTP extract",    fn: (p: typeof PLANS[0]) => p.otp  ? <Tick /> : <Cross /> },
                    { label: "WebSocket",      fn: (p: typeof PLANS[0]) => p.ws   ? <Tick /> : <Cross /> },
                    { label: "Attachments",    fn: (p: typeof PLANS[0]) => p.att  ? <Tick /> : <Cross /> },
                    { label: "Custom domains", fn: (p: typeof PLANS[0]) => p.cd   ? <Tick /> : <Cross /> },
                    { label: "Support",        fn: (p: typeof PLANS[0]) => <span className="text-xs">{p.support}</span> },
                  ].map(row => (
                    <tr key={row.label} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">{row.label}</td>
                      {PLANS.map(p => <td key={p.name} className="py-3 px-3 text-center">{row.fn(p)}</td>)}
                    </tr>
                  ))}
                  <tr className="bg-muted/10 border-t border-border">
                    <td className="py-4 px-4" />
                    {PLANS.map(p => (
                      <td key={p.name} className="py-4 px-3 text-center">
                        <Button asChild size="sm" variant={p.name === "Free" ? "outline" : "default"}>
                          <Link href={p.name === "Free" ? "/auth?callbackUrl=/api/dashboard" : "/api/pricing"}>Get started</Link>
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CODE EXAMPLES ─────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-3xl mx-auto">
          <FadeIn>
            <SectionMarker index={8} total={T} label="Quickstart" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-10">Up and running in minutes</h2>
          </FadeIn>
          <FadeIn delay={0.1}><ApiCodeExamples /></FadeIn>
        </div>
      </section>

      {/* ── CREDITS ───────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <AsciiLayer />
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-2 mb-10">
              <div className="w-0.5 h-4 bg-border" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Credits — never expire</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">Need more capacity?</h2>
            <p className="text-sm text-muted-foreground mb-12 max-w-lg leading-relaxed">Credits never expire. Top up once, use forever. Consumed automatically when you exceed your monthly quota.</p>
          </FadeIn>
          <div className="grid gap-px bg-border grid-cols-2 sm:grid-cols-4 rounded-lg overflow-hidden mb-8">
            {CREDITS_PACKS.map((c, i) => (
              <FadeIn key={c.amount} delay={i * 0.06}>
                <div className="bg-background px-6 py-8 h-full hover:bg-muted/10 transition-colors duration-200">
                  <p className="text-2xl font-bold text-foreground mb-1">{c.amount}</p>
                  <p className="text-sm text-muted-foreground">{c.requests} requests</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{c.perK} / 1k</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.2}>
            <Button asChild variant="outline" size="sm"><Link href="/api/pricing">Full plan details →</Link></Button>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" aria-labelledby="api-faq-heading">
        <Cols />
        <div className="relative z-10 max-w-2xl mx-auto">
          <FadeIn>
            <h2 id="api-faq-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-12">
              Frequently asked questions
            </h2>
          </FadeIn>
          <div className="space-y-0">
            {OVERVIEW_FAQ.map((item, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <details className="group border-t border-border py-5 last:border-b">
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                    <span className="leading-relaxed">{item.q}</span>
                    <span className="shrink-0 text-muted-foreground mt-0.5 group-open:rotate-45 transition-transform duration-200 text-lg leading-none">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed pr-8">{item.a}</p>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: OVERVIEW_FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }) }} />
      </section>
    </div>
  );
}