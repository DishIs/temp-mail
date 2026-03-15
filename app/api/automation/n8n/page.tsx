// app/api/automation/n8n/page.tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, ChevronRight, Bot, Zap, LayoutGrid } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";

// ─── data ──────────────────────────────────────────────────────────────────

const SETUP_STEPS = [
  {
    step: "01",
    title: "Install fce & login",
    desc: "The fce CLI is the engine. Install it on the machine running n8n, then authenticate once with fce login.",
    code: `# Install
curl -fsSL freecustom.email/install.sh | sh

# Login — opens browser, saves key to keychain
fce login

# Confirm
fce status`,
    lang: "bash",
  },
  {
    step: "02",
    title: "Add an Execute Command node",
    desc: "In n8n, add an Execute Command node. Point it at the fce CLI. In headless/Docker n8n, set FCE_API_KEY as an n8n credential env var.",
    code: `# n8n Execute Command node — command field:
fce inbox add random

# Returns: inbox@domain.info
# Pipe to next node via {{ $json.stdout }}`,
    lang: "bash",
  },
  {
    step: "03",
    title: "Chain fce commands as nodes",
    desc: "Each fce command becomes its own Execute Command node. Chain them with n8n's data flow — stdout of one feeds the next.",
    code: `# Node 1: Create inbox
fce inbox add random

# Node 2: Trigger your app (HTTP Request node)
# POST to https://myapp.com/signup
# body: { email: "{{ $json.stdout }}" }

# Node 3: Extract OTP (Growth plan+)
fce otp {{ $node["Create Inbox"].json.stdout }}`,
    lang: "bash",
  },
  {
    step: "04",
    title: "Watch in real time with fce watch",
    desc: "For event-driven flows, run fce watch in a long-running Execute Command node and parse the stdout stream with an n8n Code node.",
    code: `# Pipe fce watch output into n8n
fce watch {{ $json.inbox }} --json

# Then in a Code node, parse each line:
# const lines = $input.first().json.stdout.split("\\n")
# return lines.map(l => ({ json: JSON.parse(l) }))`,
    lang: "bash",
  },
];

const EXAMPLE_WORKFLOWS = [
  {
    title: "OTP verification flow",
    steps: ["Create random inbox", "POST to /signup with inbox", "fce otp → extract code", "POST to /verify with OTP", "Assert 200 OK"],
    desc: "Full end-to-end signup verification in a single n8n workflow.",
  },
  {
    title: "Alert forwarding",
    steps: ["fce watch alerts@myapp.info", "Filter by subject keyword", "Slack message node", "Airtable log node"],
    desc: "Forward specific email alerts to Slack and log them to Airtable.",
  },
  {
    title: "Parallel inbox testing",
    steps: ["Loop node × 5", "fce inbox add random", "Trigger staging signup", "fce otp each inbox", "Aggregate results"],
    desc: "Create multiple test inboxes and collect OTPs in parallel.",
  },
];

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

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

const Cols = () => (
  <>
    <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
    <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
  </>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function N8nPage() {
  const T = 4;

  return (
    <div className="bg-background text-foreground overflow-x-hidden min-h-screen">

      {/* breadcrumb */}
      <div className="border-b border-border px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Link href="/api/automation" className="hover:text-foreground transition-colors">Automation</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">n8n</span>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 md:py-32" style={DOT_BG}>
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <SectionMarker index={1} total={T} label="n8n × FCE" />

          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-3 py-1.5 rounded mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                WORKS TODAY
              </div>

              <motion.h1
                className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-[1.1]"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              >
                n8n +<br />FreeCustom.Email
              </motion.h1>

              <motion.p
                className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              >
                Use n8n&apos;s Execute Command nodes to chain fce CLI commands into full visual workflows — inbox creation, OTP extraction, email watching, and more.
              </motion.p>

              <motion.ul className="space-y-2.5 mb-8"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                {[
                  "Works with self-hosted and cloud n8n",
                  "fce login once — keys stored in keychain",
                  "Chain commands with n8n data flow",
                  "Full OTP output: code, from, subj, time",
                  "No native connector needed — HTTP Request works too",
                ].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {t}
                  </li>
                ))}
              </motion.ul>

              <motion.div className="flex flex-wrap gap-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Button asChild><a href="#setup">Setup guide</a></Button>
                <Button asChild variant="outline"><a href="#workflows">Example workflows</a></Button>
              </motion.div>
            </div>

            {/* Mini workflow diagram */}
            <FadeIn delay={0.3}>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/10">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">n8n — OTP verification workflow</span>
                </div>
                <div className="p-5 space-y-2 font-mono text-xs">
                  {[
                    { label: "Execute Command", cmd: "fce inbox add random", out: "dev-fy8x@ditcloud.info", color: "border-border" },
                    { label: "HTTP Request",    cmd: "POST /signup {email}", out: "200 OK — email sent",   color: "border-border" },
                    { label: "Execute Command", cmd: "fce otp dev-fy8x@ditcloud.info", out: "OTP · 212342", color: "border-emerald-500/40", outColor: "text-emerald-400 font-semibold" },
                    { label: "HTTP Request",    cmd: "POST /verify {otp: 212342}", out: "200 OK — verified", color: "border-emerald-500/40" },
                  ].map((node, i) => (
                    <div key={i}>
                      <div className={`rounded border ${node.color} bg-background px-3 py-2.5`}>
                        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">{node.label}</p>
                        <p className="text-foreground/80">{node.cmd}</p>
                        <p className={`mt-0.5 ${node.outColor ?? "text-muted-foreground/60"}`}>→ {node.out}</p>
                      </div>
                      {i < 3 && <div className="flex justify-center py-0.5"><div className="w-px h-3 bg-border" /></div>}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── SETUP ─────────────────────────────────────────────────────── */}
      <section id="setup" className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={2} total={T} label="Setup" />
            <h2 className="text-3xl font-bold mb-14 tracking-tight">Setup in 4 steps</h2>
          </FadeIn>

          <div className="space-y-4">
            {SETUP_STEPS.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.08}>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid md:grid-cols-[1fr_1.5fr]">
                    <div className="px-7 py-8 border-b md:border-b-0 md:border-r border-border flex flex-col">
                      <p className="font-mono text-4xl font-bold text-muted-foreground/15 mb-5 leading-none select-none">{step.step}</p>
                      <p className="text-base font-semibold text-foreground mb-2">{step.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                    <div className="px-7 py-8 bg-muted/5">
                      <CodeBlock code={step.code} language={step.lang} className="bg-muted/20" />
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Docker / headless note */}
          <FadeIn delay={0.3}>
            <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-6 py-4">
              <p className="text-sm font-semibold text-foreground mb-1">Running n8n in Docker or a headless server?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Set <code className="bg-muted/60 px-1 rounded text-xs text-foreground">FCE_API_KEY</code> as an environment variable in your n8n container instead of using <code className="bg-muted/60 px-1 rounded text-xs text-foreground">fce login</code>. Get the value from the{" "}
                <Link href="/api/dashboard" className="text-foreground underline underline-offset-2 decoration-border hover:decoration-foreground transition-colors">dashboard</Link>{" "}
                after logging in on your local machine first.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── EXAMPLE WORKFLOWS ─────────────────────────────────────────── */}
      <section id="workflows" className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={3} total={T} label="Example workflows" />
            <h2 className="text-3xl font-bold mb-14 tracking-tight">What you can build</h2>
          </FadeIn>

          <div className="grid gap-px bg-border md:grid-cols-3 rounded-lg overflow-hidden">
            {EXAMPLE_WORKFLOWS.map((wf, i) => (
              <FadeIn key={wf.title} delay={i * 0.08}>
                <div className="bg-background px-6 py-8 h-full flex flex-col">
                  <p className="text-sm font-semibold text-foreground mb-3">{wf.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-5 flex-1">{wf.desc}</p>
                  <div className="space-y-1.5">
                    {wf.steps.map((s, j) => (
                      <div key={s} className="flex items-center gap-2.5">
                        <span className="font-mono text-[9px] text-muted-foreground/40 w-4 shrink-0 text-right">{j + 1}</span>
                        <span className="font-mono text-[10px] text-muted-foreground border border-border rounded px-2 py-0.5 flex-1">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── RELATED ───────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={4} total={T} label="Related" />
            <h2 className="text-3xl font-bold mb-8 tracking-tight">More automation options</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { title: "OpenClaw", desc: "AI agent automation — natural language fce commands", icon: <Bot className="h-4 w-4" />, href: "/api/automation/openclaw" },
                { title: "Make", desc: "Visual no-code workflows — coming Q2 2026", icon: <LayoutGrid className="h-4 w-4" />, href: "/api/automation/make" },
                { title: "Zapier", desc: "Zap triggers for email events — coming Q2 2026", icon: <Zap className="h-4 w-4" />, href: "/api/automation/zapier" },
              ].map(r => (
                <Link key={r.href} href={r.href}
                  className="flex items-start gap-4 p-5 rounded-lg border border-border hover:bg-muted/10 transition-colors group"
                >
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors mt-0.5">{r.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="border-t border-border py-12 px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30">
          n8n × FreeCustom.Email · Automation Hub
        </p>
      </footer>
    </div>
  );
}