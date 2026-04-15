// app/api/auth-flow-debugger/page.tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Bot, Zap, Terminal } from "lucide-react";

// ─── data ──────────────────────────────────────────────────────────────────
const FEATURES =[
  { title: "Real-time event streaming", desc: "Watch your test runs unfold second-by-second. No refresh required." },
  { title: "Sub-ms latency tracking",   desc: "Know exactly how long each step takes — from trigger to OTP extraction." },
  { title: "Failure insights",          desc: "Automated detection of timing issues, delivery failures, and regressions." },
  { title: "Timeline history",          desc: "Replay past test runs to visually understand exactly what went wrong." },
];

const HOW_IT_WORKS =[
  { step: "01", title: "Identify test runs",     desc: 'Add a custom x-fce-test-run-id header or let our platform auto-detect test batches.' },
  { step: "02", title: "Watch events stream",    desc: "Experience real-time visualization of the email → parsing → OTP extraction flow." },
  { step: "03", title: "Debug failures",         desc: "Tap any event to inspect raw SMTP payloads and pinpoint exact execution latencies." },
];

const DEBUGGER_FAQ =[
  { q: "What is the Auth Flow Debugger?", a: "It is a visual interface that streams real-time events for your automated tests. It traces exactly when an email is received, when the OTP is extracted, and measures sub-millisecond latencies between steps." },
  { q: "How do I group my requests into a 'Test Run'?", a: "Simply pass the `x-fce-test-run-id` header when registering an inbox or interacting with the API. All subsequent emails delivered to that inbox will be grouped under the same visual timeline." },
  { q: "Does the debugger work with Playwright and Cypress?", a: "Yes. Since it operates entirely on the API side, it works seamlessly with Playwright, Cypress, Selenium, or any custom Node/Python automation script." },
  { q: "Can I view historical test runs?", a: "Yes. Paid plans (Startup and above) retain historical timelines so you can retroactively inspect failed CI/CD pipelines hours or days after they occurred." },
];

const DEBUGGER_PLANS = [
  { name: "Startup Tier",    price: "Included", label: "Basic tracing",    features:["Timeline + Latency", "24h history retention"] },
  { name: "Growth Tier",     price: "Included", label: "Full debugger",    features: ["Live WebSocket streaming", "Failure Insights", "7 days history"] },
  { name: "Enterprise Tier", price: "Included", label: "Scale & security", features:["Dedicated streaming clusters", "SSO integration", "30 days history"] },
];

// ASCII fragments mapped for WebSocket/Debugger theme
const ASCII_FRAGMENTS =[
  { x: "2%",  y: "5%",  t: "CONNECT wss://api2.freecustom.email/v1/ws" },
  { x: "67%", y: "3%",  t: '{"type":"test_run","id":"tr_8x9v2"}' },
  { x: "78%", y: "11%", t: "status: pending_delivery" },
  { x: "1%",  y: "21%", t: "await page.fill('#email', inbox)" },
  { x: "71%", y: "27%", t: "event: email_received" },
  { x: "4%",  y: "37%", t: "latency: 1204ms" },
  { x: "74%", y: "43%", t: "extracting OTP payload..." },
  { x: "1%",  y: "51%", t: "OTP Extracted: 847291" },
  { x: "69%", y: "57%", t: "latency: 2102ms" },
  { x: "3%",  y: "67%", t: "evaluating conditional delays" },
  { x: "72%", y: "73%", t: "✓ test suite passed" },
  { x: "2%",  y: "83%", t: "CLOSE 1000 Normal Closure" },
  { x: "67%", y: "87%", t: "disconnecting trace..." },
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
      <span className="font-mono text-xs text-foreground font-semibold">[ {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")} ]
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
      transition={{ duration: 0.5, delay, ease:[0.22, 1, 0.36, 1] }}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuthFlowDebuggerClient() {
  const T = 6; // total sections

  return (
    <div className="bg-background text-foreground overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 py-28 text-center" style={DOT_BG}>
        <AsciiLayer />
        <Cols />

        <div className="relative z-10 max-w-3xl w-full">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <SectionMarker index={1} total={T} label="Live Tracing" />
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight text-foreground leading-[1.1] mb-5 text-balance break-words"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
            Debug auth flows<br />in real-time
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}>
            Stop blindly guessing why your Playwright tests fail. Visually trace the exact OTP extraction flow, measure sub-millisecond latencies, and pinpoint failure points live.
          </motion.p>

          <motion.div className="flex flex-wrap items-center justify-center gap-3 mb-16"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}>
            <Button asChild size="lg">
              <Link href="/api/dashboard">Open Debugger</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/api/use-cases/playwright-selenium">Playwright Guide</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary/50 hover:bg-primary/5">
              <Link href="/ai" className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" /> Ask FCE AI
              </Link>
            </Button>
          </motion.div>

          {/* Exact Replica of the API Page's Trace UI */}
          <motion.div className="w-full text-left max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}>
            <div className="relative shadow-2xl rounded-xl overflow-hidden border border-border bg-background p-6">
              <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">Test Run: tr_8x9v2</span>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-semibold uppercase tracking-widest">
                  <Zap className="h-3 w-3" /> Live
                </span>
              </div>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:to-transparent">
                <div className="relative flex items-center justify-normal z-10">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 bg-background shrink-0 text-[10px] shadow border-green-500 text-green-500">✓</div>
                  <div className="w-[calc(100%-2.5rem)] px-3 py-2 bg-muted/30 rounded border border-border ml-3 flex justify-between items-center">
                    <p className="font-medium text-xs">Email Received</p>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded">⚠️ slow</span>
                  </div>
                </div>
                <div className="flex justify-center text-[10px] text-muted-foreground -my-2 z-10 relative bg-background px-1 w-max ml-[1.125rem] border border-border rounded-full">↓ 2400ms</div>
                <div className="relative flex items-center justify-normal z-10 mt-4">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 bg-background shrink-0 text-[10px] shadow border-green-500 text-green-500">✓</div>
                  <div className="w-[calc(100%-2.5rem)] px-3 py-2 bg-muted/30 rounded border border-border ml-3 flex justify-between items-center">
                    <p className="font-medium text-xs">OTP Extracted</p>
                    <p className="font-mono text-xs">847291</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CI/CD INTEGRATION ──────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24 bg-muted/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(0_0%_50%_/_0.09)_1px,transparent_0)] bg-[size:28px_28px] z-0" />
        <Cols />
        <div className="relative z-10 max-w-5xl w-full mx-auto grid md:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold uppercase tracking-widest mb-6">
              <Terminal className="h-3 w-3" /> E2E Testing
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight text-balance break-words">
              Identify and track<br />automated test runs
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
              Add the <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded font-mono">x-fce-test-run-id</code> header to group requests into isolated runs. Drop this pattern into your testing suite and watch the debugger light up dynamically as your CI executes.
            </p>
            <Button asChild size="lg">
              <Link href="/api/use-cases/playwright-selenium">Integration Guides →</Link>
            </Button>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <div className="relative shadow-2xl rounded-xl overflow-hidden border border-border bg-background flex flex-col h-full">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/10">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">signup.spec.ts</span>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="font-mono text-xs text-muted-foreground leading-relaxed">
                  <span className="text-blue-400">import</span> {'{'} test, expect {'}'} <span className="text-blue-400">from</span> <span className="text-green-400">'@playwright/test'</span>;<br/>
                  <span className="text-blue-400">import</span> {'{'} FreeCustomEmail {'}'} <span className="text-blue-400">from</span> <span className="text-green-400">'freecustom-email'</span>;<br/>
                  <br/>
                  <span className="text-blue-400">const</span> fce = <span className="text-blue-400">new</span> FreeCustomEmail(<span className="text-green-400">'fce_test_key'</span>);<br/>
                  <br/>
                  test(<span className="text-green-400">'signup flow works'</span>, <span className="text-blue-400">async</span> ({'{'} page {'}'}) <span className="text-blue-400">{'=>'}</span> {'{'}<br/>
                  {'  '}<span className="text-muted-foreground/50">// The debugger tracks this specific inbox</span><br/>
                  {'  '}<span className="text-blue-400">const</span> {'{'} inbox {'}'} = <span className="text-blue-400">await</span> fce.inboxes.register(<span className="text-green-400">'test'</span>, <span className="text-amber-400">true</span>);<br/>
                  <br/>
                  {'  '}<span className="text-blue-400">await</span> page.goto(<span className="text-green-400">'https://myapp.com/signup'</span>);<br/>
                  {'  '}<span className="text-blue-400">await</span> page.fill(<span className="text-green-400">'#email'</span>, inbox);<br/>
                  {'  '}<span className="text-blue-400">await</span> page.click(<span className="text-green-400">'#submit'</span>);<br/>
                  <br/>
                  {'  '}<span className="text-blue-400">const</span> {'{'} otp, score {'}'} = <span className="text-blue-400">await</span> fce.otp.waitFor(inbox);<br/>
                  {'  '}console.log(<span className="text-green-400">`OTP Confidence: {'$'}{'{'}score * 100{'}'}%`</span>);<br/>
                  {'  '}<span className="text-blue-400">await</span> page.fill(<span className="text-green-400">'#otp'</span>, otp);<br/>
                  {'}'});
                </pre>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-5xl w-full mx-auto">
          <FadeIn>
            <SectionMarker index={3} total={T} label="How it works" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-14 text-balance break-words">
              Three steps to tracing
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

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <AsciiLayer />
        <Cols />
        <div className="relative z-10 max-w-5xl w-full mx-auto">
          <FadeIn>
            <SectionMarker index={4} total={T} label="Capabilities" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-14 max-w-lg leading-tight text-balance break-words">
              Surgical precision for your E2E test suites
            </h2>
          </FadeIn>
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-2 rounded-lg overflow-hidden">
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

      {/* ── PRICING MATCHING CREDITS UI ───────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-5xl w-full mx-auto">
          <FadeIn>
            <div className="flex items-center gap-2 mb-10">
              <div className="w-0.5 h-4 bg-border" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Included with API Plans</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 text-balance break-words">Unlock full tracing history</h2>
            <p className="text-sm text-muted-foreground mb-12 max-w-lg leading-relaxed">The Auth Flow Debugger is deeply integrated into the core platform. Paid plans unlock longer historical retention and live WebSocket streaming features.</p>
          </FadeIn>
          
          <div className="grid gap-px bg-border grid-cols-1 sm:grid-cols-3 rounded-lg overflow-hidden mb-8">
            {DEBUGGER_PLANS.map((p, i) => (
              <FadeIn key={p.name} delay={i * 0.06}>
                <div className="bg-background px-6 py-8 h-full hover:bg-muted/10 transition-colors duration-200">
                  <p className="text-2xl font-bold text-foreground mb-1">{p.price}</p>
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-widest">{p.label}</p>
                  
                  <div className="mt-8 space-y-3 border-t border-border pt-6">
                    {p.features.map(f => (
                      <p key={f} className="text-xs text-muted-foreground flex items-center gap-2.5">
                        <Check className="h-3.5 w-3.5 text-foreground shrink-0" /> 
                        {f}
                      </p>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.2}>
            <Button asChild variant="outline" size="sm"><Link href="/api/pricing">View full API pricing →</Link></Button>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" aria-labelledby="api-faq-heading">
        <Cols />
        <div className="relative z-10 max-w-2xl w-full mx-auto">
          <FadeIn>
            <SectionMarker index={6} total={T} label="FAQ" />
            <h2 id="api-faq-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-12 text-balance break-words">
              Frequently asked questions
            </h2>
          </FadeIn>
          <div className="space-y-0">
            {DEBUGGER_FAQ.map((item, i) => (
              <FadeIn key={i} delay={i * 0.04}>
                <details className="group border-t border-border py-5 last:border-b">
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-sm font-medium text-foreground[&::-webkit-details-marker]:hidden">
                    <span className="leading-relaxed break-words text-left">{item.q}</span>
                    <span className="shrink-0 text-muted-foreground mt-0.5 group-open:rotate-45 transition-transform duration-200 text-lg leading-none">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed pr-8">{item.a}</p>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}