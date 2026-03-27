// app/api/automation/page.tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap, Bot, Workflow, GitBranch, Terminal, Code2,
  ArrowRight, Check, Clock, ChevronRight, Cpu
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";

// ─── data ──────────────────────────────────────────────────────────────────

const AI_AGENTS = [
  {
    id: "openclaw",
    name: "OpenClaw",
    badge: "Live",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: "🤖",
    tagline: "AI agent meets disposable inboxes",
    desc: "OpenClaw (formerly ClawdBot) can orchestrate fce CLI commands through natural language. Run fce login once to authenticate, then just describe what you need.",
    cta: "Setup guide",
    href: "/api/automation/openclaw",
  },
  {
    id: "claude",
    name: "Claude (Anthropic)",
    badge: "Works today",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: "✦",
    tagline: "Prompt-driven email automation",
    desc: "Claude can write shell scripts, construct fce commands, and build full automation workflows using the FCE API. Pair with MCP or computer use for agentic pipelines.",
    cta: "Prompt examples",
    href: "/api/automation/openclaw#prompts",
  },
  {
    id: "n8n",
    name: "n8n",
    badge: "Works today",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: "⚡",
    tagline: "Self-hosted workflow automation",
    desc: "Use the FCE HTTP Request nodes in n8n to create inboxes, poll for messages, and extract OTPs as part of larger automated workflows.",
    cta: "View guide",
    href: "/api/automation/n8n",
  },
  {
    id: "custom",
    name: "Any AI Agent",
    badge: "Works today",
    badgeColor: "bg-muted text-muted-foreground border-border",
    icon: "∞",
    tagline: "fce login once, then automate anything",
    desc: "Any agent that can run shell commands or make HTTP requests can automate FreeCustom.Email. Run fce login to authenticate — or set FCE_API_KEY for headless/CI environments.",
    cta: "API reference",
    href: "/api/docs/quickstart",
  },
];

const NOCODE_INTEGRATIONS = [
  {
    id: "make",
    name: "Make",
    icon: "⬡",
    tagline: "Visual automation — coming soon",
    desc: "Drag-and-drop scenario builder with native FCE triggers and actions. Create disposable inboxes, watch for OTPs, and connect to 2,000+ apps — without writing a line of code.",
    status: "coming-soon",
    href: "/api/automation/make",
    features: ["Native FCE triggers", "OTP extraction node", "2,000+ connected apps", "Visual scenario builder"],
  },
  {
    id: "zapier",
    name: "Zapier",
    icon: "⚡",
    tagline: "Zap your inbox — coming soon",
    desc: "Trigger Zaps when new emails arrive at your FCE inbox. Pipe OTPs directly into Google Sheets, Slack messages, Notion, Airtable, and more.",
    status: "coming-soon",
    href: "/api/automation/zapier",
    features: ["New email triggers", "OTP extraction action", "5,000+ Zap integrations", "Multi-step Zaps"],
  },
];

const PROMPT_EXAMPLES = [
  {
    label: "CI/CD OTP test",
    prompt: `Using the fce CLI (FCE_API_KEY is set as a CI secret), write a GitHub Actions step that:
1. Creates a random disposable inbox
2. Triggers our signup form to send a verification email to it
3. Waits for the OTP using \`fce otp\`
4. Completes the signup flow with the extracted OTP
5. Cleans up the inbox`,
  },
  {
    label: "QA automation",
    prompt: `I need a bash script that uses fce CLI to:
- Create 5 test inboxes in parallel
- Send a test signup to each from our staging API
- Extract all OTPs using \`fce otp\`
- Return a JSON object mapping inbox → OTP
Auth is handled — fce is already logged in via \`fce login\`.`,
  },
  {
    label: "Monitoring alert",
    prompt: `Set up \`fce watch alerts@myapp.info\` and forward any email containing "error" or "failed" in the subject to my Slack webhook. Run this continuously in the background with auto-reconnect.`,
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Run fce login",
    desc: "Opens your browser, signs you in, and saves a key to your OS keychain automatically. API keys always reflect your current plan.",
    link: { label: "CLI install guide", href: "/api/cli#install" },
  },
  {
    step: "02",
    title: "Choose your stack",
    desc: "Use the fce CLI for shell/agent automation, the REST API for code-level integration, or our upcoming no-code connectors.",
    link: { label: "CLI docs", href: "/api/cli" },
  },
  {
    step: "03",
    title: "Automate",
    desc: "Describe your task to an AI agent or wire it in n8n, Make, or Zapier. Everything — inbox creation, email streaming, OTP extraction — is one command or API call away.",
    link: { label: "API docs", href: "/api/docs/quickstart" },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomationClient() {
  const T = 6;

  return (
    <div className="bg-background text-foreground overflow-x-hidden min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-28 md:py-36 text-center" style={DOT_BG}>
        <Cols />
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <SectionMarker index={1} total={T} label="Automation Hub" />
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] mb-5"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            Automate email<br />verification — fully
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Use AI agents, no-code platforms, or direct CLI/API calls to automate disposable inboxes, OTP extraction, and email-triggered workflows — at any scale.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 mb-14"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button asChild size="lg">
              <Link href="/api/automation/openclaw" className="gap-2">
                <Bot className="h-4 w-4" />
                AI Agent Setup
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/api/docs/quickstart" className="gap-2">
                <Code2 className="h-4 w-4" />
                API Reference
              </Link>
            </Button>
          </motion.div>

          {/* Quick method tiles */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden text-left"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {[
              { icon: <Bot className="h-4 w-4" />,       label: "AI Agents",  sub: "OpenClaw · Claude · Any", href: "#ai-agents" },
              { icon: <Workflow className="h-4 w-4" />,   label: "No-code",    sub: "Make · Zapier · n8n",     href: "#nocode" },
              { icon: <GitBranch className="h-4 w-4" />,  label: "CI / CD",    sub: "GitHub Actions · GitLab", href: "#cicd" },
              { icon: <Terminal className="h-4 w-4" />,   label: "CLI / API",  sub: "fce CLI · REST API",      href: "/api/cli" },
            ].map(({ icon, label, sub, href }) => (
              <a key={label} href={href}
                className="bg-background px-5 py-5 hover:bg-muted/10 transition-colors group"
              >
                <div className="text-muted-foreground mb-2 group-hover:text-foreground transition-colors">{icon}</div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={2} total={T} label="How it works" />
            <h2 className="text-3xl font-bold mb-14 tracking-tight">Three steps to full automation</h2>
          </FadeIn>
          <div className="grid gap-px bg-border md:grid-cols-3 rounded-lg overflow-hidden">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.1}>
                <div className="bg-background px-8 py-10 h-full flex flex-col">
                  <p className="text-6xl font-bold text-muted-foreground/15 font-mono mb-6 leading-none select-none">{step.step}</p>
                  <p className="text-base font-semibold text-foreground mb-2">{step.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{step.desc}</p>
                  <a href={step.link.href} className="mt-4 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    {step.link.label} <ChevronRight className="h-3 w-3" />
                  </a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI AGENTS ─────────────────────────────────────────────────── */}
      <section id="ai-agents" className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={3} total={T} label="AI Agents" />
            <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
              <h2 className="text-3xl font-bold tracking-tight">Automate with AI agents</h2>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Describe what you want in plain English. Let the agent figure out the CLI commands or API calls.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-px bg-border sm:grid-cols-2 rounded-lg overflow-hidden">
            {AI_AGENTS.map((agent, i) => (
              <FadeIn key={agent.id} delay={i * 0.08}>
                <div className="bg-background px-7 py-8 h-full flex flex-col hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{agent.icon}</span>
                      <div>
                        <p className="font-semibold text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.tagline}</p>
                      </div>
                    </div>
                    <span className={`font-mono text-[9px] uppercase tracking-wider border rounded px-2 py-0.5 shrink-0 ${agent.badgeColor}`}>
                      {agent.badge}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">{agent.desc}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={agent.href} className="gap-2">
                      {agent.cta} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMPT EXAMPLES ───────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={4} total={T} label="Prompt examples" />
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Copy-paste prompts</h2>
            <p className="text-sm text-muted-foreground mb-12 max-w-lg leading-relaxed">
              Use these prompts with OpenClaw, Claude, or any AI assistant to automate your email workflows instantly.
            </p>
          </FadeIn>

          <div className="space-y-4">
            {PROMPT_EXAMPLES.map((ex, i) => (
              <FadeIn key={ex.label} delay={i * 0.08}>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/10">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{ex.label}</span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(ex.prompt)}
                      className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      copy prompt
                    </button>
                  </div>
                  <pre className="px-5 py-4 font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {ex.prompt}
                  </pre>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link href="/api/automation/openclaw#prompts" className="gap-2">
                  More prompts for OpenClaw <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── NO-CODE ───────────────────────────────────────────────────── */}
      <section id="nocode" className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={5} total={T} label="No-code integrations" />
            <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Make · Zapier</h2>
                <p className="text-sm text-muted-foreground">
                  Native integrations coming soon. Join the waitlist to get early access.
                </p>
              </div>
              <span className="font-mono text-xs border border-amber-500/30 text-amber-600/80 px-3 py-1.5 rounded bg-amber-500/5">
                📣 Announced — Q2 2026
              </span>
            </div>
          </FadeIn>

          <div className="grid gap-px bg-border sm:grid-cols-2 rounded-lg overflow-hidden">
            {NOCODE_INTEGRATIONS.map((integration, i) => (
              <FadeIn key={integration.id} delay={i * 0.1}>
                <div className="bg-background px-7 py-8 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <p className="font-semibold text-foreground">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">{integration.tagline}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider border border-amber-500/20 text-amber-600/70 bg-amber-500/5 rounded px-2 py-0.5 shrink-0">
                      <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                      soon
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">{integration.desc}</p>

                  <ul className="space-y-1.5 mb-6">
                    {integration.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <Check className="h-3 w-3 text-muted-foreground/50 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>

                  <Button asChild variant="outline" size="sm">
                    <Link href={integration.href} className="gap-2">
                      Early access <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CI/CD ─────────────────────────────────────────────────────── */}
      <section id="cicd" className="relative border-t border-border px-6 py-24">
        <Cols />
        <div className="relative z-10 max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={6} total={T} label="CI / CD" />
            <div className="grid lg:grid-cols-2 gap-14 items-start">
              <div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">GitHub Actions & pipelines</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Install the fce CLI in your runner, set <code className="bg-muted px-1 rounded text-xs text-foreground">FCE_API_KEY</code> as a secret, and automate end-to-end email verification tests in every PR.
                </p>
                <ul className="space-y-2 mb-8">
                  {[
                    "Create fresh inbox per test run",
                    "Trigger your app to send verification",
                    "Extract OTP instantly with fce otp",
                    "Zero flakiness — no shared inboxes",
                  ].map(t => (
                    <li key={t} className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
                <Button asChild>
                  <Link href="/api/cli" className="gap-2">
                    CLI reference <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">GitHub Actions</p>
                  <CodeBlock language="yaml" className="bg-muted/20" code={`- name: E2E email verification test
  env:
    FCE_API_KEY: \${{ secrets.FCE_API_KEY }}
  run: |
    # Install fce
    curl -fsSL freecustom.email/install.sh | sh

    # Create a fresh inbox
    INBOX=$(fce inbox add random)
    echo "Testing with: $INBOX"

    # Trigger your app signup
    curl -s -X POST https://myapp.com/signup \\
      -d "email=$INBOX"

    # Wait for OTP (Growth plan+)
    OTP=$(fce otp $INBOX)
    echo "Got OTP: $OTP"

    # Complete verification
    curl -s -X POST https://myapp.com/verify \\
      -d "otp=$OTP"`} />
                </div>
                <p className="font-mono text-[10px] text-muted-foreground/50">
                  Works with GitLab CI, CircleCI, Jenkins, and any shell-capable runner.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30">
          Automation Hub · FreeCustom.Email for Developers
        </p>
      </footer>
    </div>
  );
}