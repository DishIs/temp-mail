// app/api/automation/openclaw/page.tsx
"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Bot, Check, Copy, ArrowRight, Terminal, Key, Zap,
  ChevronRight, Code2, Workflow, Shield
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";

// ─── data ──────────────────────────────────────────────────────────────────

const SETUP_STEPS = [
  {
    step: "01",
    icon: <Terminal className="h-5 w-5" />,
    title: "Install the fce CLI",
    desc: "One command installs the CLI on macOS, Linux, or Windows. This is the only binary you need.",
    code: { content: "curl -fsSL freecustom.email/install.sh | sh", lang: "bash" },
    link: { label: "All install options", href: "/api/cli#install" },
  },
  {
    step: "02",
    icon: <Key className="h-5 w-5" />,
    title: "Run fce login",
    desc: "Opens your browser, you sign in, and your API key is saved to the OS keychain automatically. Keys always reflect your current plan — no manual copying needed.",
    code: { content: "fce login\n\n# Verify it worked\nfce status", lang: "bash" },
    link: null,
  },
  {
    step: "03",
    icon: <Bot className="h-5 w-5" />,
    title: "Point OpenClaw at fce",
    desc: "OpenClaw reads from your keychain automatically. Just describe what you need — it will run the right fce commands.",
    code: { content: `# In OpenClaw, simply ask:\n"Create a random inbox, watch it, and tell me the next OTP that arrives"`, lang: "bash" },
    link: { label: "Prompt examples below", href: "#prompts" },
  },
  {
    step: "04",
    icon: <Shield className="h-5 w-5" />,
    title: "CI / CD: use FCE_API_KEY",
    desc: "For headless pipelines where there's no browser, export your key as an env var. Get it from the dashboard after logging in.",
    code: { content: "# GitHub Actions / any CI runner:\nexport FCE_API_KEY=${{ secrets.FCE_API_KEY }}\nfce status", lang: "bash" },
    link: { label: "Open Dashboard", href: "/api/dashboard" },
  },
];

const PROMPT_CATEGORIES = [
  {
    id: "basic",
    label: "Basic automation",
    prompts: [
      {
        title: "Create and watch an inbox",
        prompt: `Using the fce CLI (already logged in via \`fce login\`), create a random disposable inbox and watch it for incoming emails. Show me each email as it arrives, formatted clearly with FROM, SUBJECT, and TIME.`,
      },
      {
        title: "Get the next OTP",
        prompt: `Use \`fce dev\` to create a temp inbox and watch it. When an email arrives with an OTP or verification code, extract and return it using \`fce otp\`. Show the full OTP output including From, Subj, and Time.`,
      },
      {
        title: "Check account status",
        prompt: `Run \`fce status\` and summarize my FreeCustom.Email account: plan name, remaining credits, and how many inboxes I have registered.`,
      },
    ],
  },
  {
    id: "testing",
    label: "Testing & CI",
    prompts: [
      {
        title: "End-to-end signup test",
        prompt: `Write and run a bash script that:
1. Uses fce CLI to create a disposable inbox (already logged in via fce login)
2. Sends a POST to https://myapp.com/api/signup with that email
3. Waits up to 30 seconds for an OTP using \`fce otp\`
4. POSTs the OTP to https://myapp.com/api/verify
5. Returns success or failure with timing info`,
      },
      {
        title: "Parallel inbox testing",
        prompt: `Create 3 disposable inboxes using fce CLI in parallel. For each one, trigger a signup to our staging API at https://staging.myapp.com. Then collect all three OTPs concurrently using \`fce otp\` and return them as a JSON mapping of inbox → OTP. Auth: fce is already logged in.`,
      },
      {
        title: "Regression test script",
        prompt: `Generate a complete shell script for testing our email verification flow. It should:
- Install fce if not present (check with which fce)
- Auth: use FCE_API_KEY env var if set, otherwise assume fce login is done
- Create a new inbox per test run
- Have configurable timeout (default 60s)
- Exit with code 0 on success, 1 on failure
- Clean up the inbox after use`,
      },
    ],
  },
  {
    id: "monitoring",
    label: "Monitoring & alerts",
    prompts: [
      {
        title: "Watch alerts inbox",
        prompt: `Run \`fce watch alerts@myapp.info\` continuously. For every email where the subject contains "error", "failed", "down", or "alert", POST the full email data as JSON to my webhook at https://hooks.example.com/fce. Include automatic reconnect logic if the WebSocket drops.`,
      },
      {
        title: "OTP expiry monitor",
        prompt: `I need to verify that our OTP emails are delivered within 10 seconds. Using fce CLI:
1. Create a test inbox
2. Trigger our app to send a verification email
3. Measure time from send to OTP receipt using \`fce otp\`
4. Report pass/fail with actual latency
Run this 5 times and give me average, min, and max delivery times.`,
      },
    ],
  },
];

const USE_CASES = [
  {
    icon: "🧪",
    title: "Integration testing",
    desc: "Automate signup flows, email verification, and password reset tests in CI without maintaining test accounts.",
  },
  {
    icon: "🔁",
    title: "Regression testing",
    desc: "Run end-to-end email tests on every PR. Fresh inboxes per test run, zero flakiness.",
  },
  {
    icon: "📡",
    title: "Alert monitoring",
    desc: "Watch a dedicated inbox and forward error notifications to Slack, PagerDuty, or any webhook.",
  },
  {
    icon: "⚡",
    title: "OTP extraction",
    desc: "Extract verification codes from any inbox in under 200ms. No regex, no parsing — just the number.",
  },
  {
    icon: "🏗️",
    title: "Staging environment testing",
    desc: "Spin up disposable inboxes for your staging deployments. Test email flows end-to-end without affecting production.",
  },
  {
    icon: "🤖",
    title: "Fully autonomous agents",
    desc: "Let OpenClaw manage the full email lifecycle: create, watch, extract, verify — with no manual steps.",
  },
];

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

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

function PromptCard({ title, prompt }: { title: string; prompt: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/10">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="px-5 py-4 font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap bg-background">
        {prompt}
      </pre>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OpenClawPage() {
  const T = 5;
  const [activeCategory, setActiveCategory] = useState("basic");

  return (
    <div className="bg-background text-foreground overflow-x-hidden min-h-screen">

      {/* breadcrumb */}
      <div className="border-b border-border px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Link href="/api/automation" className="hover:text-foreground transition-colors">Automation</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">OpenClaw</span>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 md:py-32" style={DOT_BG}>
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <SectionMarker index={1} total={T} label="OpenClaw × FCE" />

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
                OpenClaw +<br />FreeCustom.Email
              </motion.h1>

              <motion.p
                className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              >
                OpenClaw (formerly ClawdBot) is an AI agent that can orchestrate fce CLI commands using natural language. Run <code className="bg-muted px-1 rounded text-xs">fce login</code> once to authenticate — then just describe what you need.
              </motion.p>

              <motion.ul className="space-y-2.5 mb-8"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                {[
                  "Run fce login once — browser-based, keychain-backed",
                  "No code required — describe in plain English",
                  "Runs real fce CLI commands under the hood",
                  "Handles inbox creation, OTP extraction, watching",
                ].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {t}
                  </li>
                ))}
              </motion.ul>

              <motion.div className="flex flex-wrap gap-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Button asChild>
                  <a href="#setup">Setup guide</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="#prompts">Prompt examples</a>
                </Button>
              </motion.div>
            </div>

            {/* Demo panel */}
            <FadeIn delay={0.3}>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/10">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">OpenClaw — FCE agent</span>
                </div>
                <div className="p-5 space-y-4 font-mono text-xs">
                  {/* User message */}
                  <div className="bg-muted/20 rounded-lg p-3 border border-border">
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5">You</p>
                    <p className="text-foreground/80 leading-relaxed">
                      Create a temp inbox, watch it, and tell me the OTP when an email arrives
                    </p>
                  </div>
                  {/* Agent response */}
                  <div className="space-y-1.5 text-muted-foreground">
                    <p><span className="text-emerald-500">▸</span> Running <code className="text-foreground">fce dev</code>…</p>
                    <p className="pl-4 text-muted-foreground/70">Inbox ready: dev-fy8x@ditcloud.info</p>
                    <p className="pl-4 text-muted-foreground/70">WebSocket connected · watching…</p>
                    <p><span className="text-emerald-500">▸</span> Email received (2.1s)</p>
                    <p className="pl-4 text-muted-foreground/70">FROM: "Dishant Singh" &lt;dishupandey57@gmail.com&gt;</p>
                    <p className="pl-4 text-muted-foreground/70">SUBJ: Your OTP for FCE: 212342</p>
                    <div className="mt-3 rounded border border-border bg-muted/10 p-3 font-mono text-xs space-y-1">
                      <div className="text-muted-foreground/40">────────────────────────────</div>
                      <div><span className="text-muted-foreground">OTP   · </span><span className="text-emerald-400 font-bold"> 212342</span></div>
                      <div><span className="text-muted-foreground">From  · </span><span className="text-foreground/70"> "Dishant Singh" &lt;dishupandey57@gmail.com&gt;</span></div>
                      <div><span className="text-muted-foreground">Subj  · </span><span className="text-foreground/70"> Your OTP for FCE: 212342</span></div>
                      <div><span className="text-muted-foreground">Time  · </span><span className="text-foreground/70"> 20:19:54</span></div>
                      <div className="text-muted-foreground/40">────────────────────────────</div>
                    </div>
                  </div>
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
                  <div className="grid md:grid-cols-[1fr_1.5fr] gap-0">
                    <div className="px-7 py-8 border-b md:border-b-0 md:border-r border-border flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground">
                          {step.icon}
                        </span>
                        <span className="font-mono text-sm font-bold text-muted-foreground/40">{step.step}</span>
                      </div>
                      <p className="text-base font-semibold text-foreground mb-2">{step.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{step.desc}</p>
                      {step.link && (
                        <a href={step.link.href}
                          className="mt-4 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                          {step.link.label} <ChevronRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="px-7 py-8 bg-muted/5">
                      <CodeBlock code={step.code!.content} language={step.code!.lang} className="bg-muted/20" />
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMPT EXAMPLES ───────────────────────────────────────────── */}
      <section id="prompts" className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={3} total={T} label="Prompt library" />
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Copy-paste prompt library</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-lg leading-relaxed">
              These prompts work with OpenClaw, Claude, or any AI assistant that can run shell commands. Copy and adapt them for your use case.
            </p>
          </FadeIn>

          {/* Category tabs */}
          <FadeIn delay={0.1}>
            <div className="flex gap-2 mb-8 flex-wrap">
              {PROMPT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded border transition-all ${
                    activeCategory === cat.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/40"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </FadeIn>

          <div className="space-y-4">
            {PROMPT_CATEGORIES.find(c => c.id === activeCategory)?.prompts.map((p, i) => (
              <FadeIn key={p.title} delay={i * 0.06}>
                <PromptCard title={p.title} prompt={p.prompt} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ─────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={4} total={T} label="Use cases" />
            <h2 className="text-3xl font-bold mb-14 tracking-tight">What you can build</h2>
          </FadeIn>

          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 rounded-lg overflow-hidden">
            {USE_CASES.map((uc, i) => (
              <FadeIn key={uc.title} delay={i * 0.06}>
                <div className="bg-background px-6 py-8 h-full hover:bg-muted/10 transition-colors">
                  <p className="text-2xl mb-3">{uc.icon}</p>
                  <p className="text-sm font-semibold text-foreground mb-2">{uc.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENV VAR REFERENCE ─────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={5} total={T} label="Reference" />
            <div className="grid lg:grid-cols-2 gap-14">
              <div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Authentication</h2>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  <strong className="text-foreground">Primary:</strong> run <code className="bg-muted px-1 rounded text-xs text-foreground">fce login</code> once — it opens your browser, saves a key to your OS keychain, and you're done. Keys automatically reflect your current plan.
                  <br /><br />
                  <strong className="text-foreground">CI / headless:</strong> export <code className="bg-muted px-1 rounded text-xs text-foreground">FCE_API_KEY</code> as an environment variable. Get the value from the dashboard after logging in via <code className="bg-muted px-1 rounded text-xs text-foreground">fce login</code>.
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-border bg-muted/10 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    CI / headless env var
                  </div>
                  <div className="divide-y divide-border">
                    {[
                      { name: "FCE_API_KEY", desc: "Your API key (fce_...). Skips keychain — for CI pipelines and headless agents only.", required: false },
                    ].map(v => (
                      <div key={v.name} className="px-5 py-4 flex gap-4 items-start">
                        <code className="font-mono text-xs text-foreground bg-muted/40 px-2 py-0.5 rounded shrink-0">{v.name}</code>
                        <span className="text-sm text-muted-foreground leading-relaxed">{v.desc}</span>
                        <span className="font-mono text-[9px] text-muted-foreground/50 border border-border rounded px-1.5 py-px shrink-0">CI only</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Related resources</h2>
                <div className="space-y-3">
                  {[
                    { label: "fce CLI reference", desc: "All commands, flags, and examples", href: "/api/cli" },
                    { label: "REST API docs", desc: "Direct HTTP endpoints for custom integrations", href: "/api/docs/quickstart" },
                    { label: "Make integration", desc: "Visual no-code workflows — coming soon", href: "/api/automation/make" },
                    { label: "Zapier integration", desc: "Zap triggers for email events — coming soon", href: "/api/automation/zapier" },
                    { label: "Automation hub", desc: "All automation options in one place", href: "/api/automation" },
                  ].map(r => (
                    <Link key={r.href} href={r.href}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/10 transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-4" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30">
          OpenClaw × FreeCustom.Email · Automation Hub
        </p>
      </footer>
    </div>
  );
}