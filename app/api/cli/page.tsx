// app/api/cli/page.tsx
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Terminal, Github, Check, Copy, ShieldCheck, Zap, Download,
  ChevronRight, ArrowRight, Cpu
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";

// ─── data ──────────────────────────────────────────────────────────────────

type OS = "mac" | "windows" | "linux";

const INSTALL_BY_OS: Record<OS, { label: string; methods: { name: string; cmd: string; lang: string }[] }> = {
  mac: {
    label: "macOS",
    methods: [
      { name: "Homebrew (recommended)", cmd: "brew tap DishIs/homebrew-tap\nbrew install fce", lang: "bash" },
      { name: "Shell Script", cmd: "curl -fsSL freecustom.email/install.sh | sh", lang: "bash" },
      { name: "npm", cmd: "npm install -g fcemail", lang: "bash" },
      { name: "Go install", cmd: "go install github.com/DishIs/fce-cli@latest", lang: "bash" },
    ],
  },
  windows: {
    label: "Windows",
    methods: [
      { name: "Scoop (recommended)", cmd: "scoop bucket add fce https://github.com/DishIs/scoop-bucket\nscoop install fce", lang: "powershell" },
      { name: "Chocolatey", cmd: "choco install fce", lang: "powershell" },
      { name: "npm", cmd: "npm install -g fcemail", lang: "powershell" },
      { name: "Go install", cmd: "go install github.com/DishIs/fce-cli@latest", lang: "powershell" },
    ],
  },
  linux: {
    label: "Linux",
    methods: [
      { name: "Shell Script (recommended)", cmd: "curl -fsSL freecustom.email/install.sh | sh", lang: "bash" },
      { name: "npm", cmd: "npm install -g fcemail", lang: "bash" },
      { name: "Homebrew", cmd: "brew tap DishIs/homebrew-tap\nbrew install fce", lang: "bash" },
      { name: "Go install", cmd: "go install github.com/DishIs/fce-cli@latest", lang: "bash" },
    ],
  },
};

const ALL_COMMANDS = [
  { c: "fce login",          d: "Authenticate via browser",              plan: "Any" },
  { c: "fce logout",         d: "Remove stored credentials",             plan: "Any" },
  { c: "fce dev",            d: "Register dev inbox + watch instantly",  plan: "Any", star: true },
  { c: "fce watch [inbox]",  d: "Stream emails via WebSocket",           plan: "Startup+" },
  { c: "fce otp <inbox>",    d: "Extract latest OTP code",               plan: "Growth+" },
  { c: "fce status",         d: "View account and plan",                 plan: "Any" },
  { c: "fce inbox",          d: "Manage registered addresses",           plan: "Any" },
  { c: "fce messages",       d: "List messages in an inbox",             plan: "Any" },
  { c: "fce usage",          d: "Check credit consumption",              plan: "Any" },
  { c: "fce domains",        d: "List available domains",                plan: "Any" },
  { c: "fce update",         d: "Update CLI to latest version",          plan: "Any" },
  { c: "fce uninstall",      d: "Remove all local config + credentials", plan: "Any" },
  { c: "fce version",        d: "Show version info",                     plan: "Any" },
  { c: "fce help",           d: "Full command reference",                plan: "Any" },
];

// Terminal demo sequences
interface DemoSequence {
  id: string;
  label: string;
  cmd: string;
  output: string;
  highlight?: boolean;
  badge?: string;
}

const DEMO_SEQUENCES: DemoSequence[] = [
  {
    id: "install",
    label: "Install",
    cmd: "curl -fsSL freecustom.email/install.sh | sh",
    output: `Installing fce for darwin/arm64...
Downloading https://github.com/DishIs/fce-cli/releases/...
Installing to /usr/local/bin/fce (requires sudo)...
Successfully installed fce!
fce 0.1.12 · darwin/arm64 · 2026-03-15`,
  },
  {
    id: "login",
    label: "Login",
    cmd: "fce login",
    output: `  [1/3]  Opening browser…
  [2/3]  Waiting for authentication…
  [3/3]  Saving credentials…

  ✓  Logged in successfully!
  ·  Run \`fce status\` to see your account details.`,
  },
  {
    id: "dev",
    label: "fce dev",
    cmd: "fce dev",
    highlight: true,
    badge: "⚡ Start here",
    output: `  ·  Temporary inbox: dev-fy8x@ditcloud.info
  ✓  Watching for emails...

  ✓  Watching dev-fy8x@ditcloud.info   GROWTH
  ·  Waiting for emails… (press Ctrl+C to stop)

────────────────────────────────────────────────────
  ID    JpW3DImT3
  FROM  "SendTestEmail" <noreply@sendtestemail.com>
  SUBJ  Verification code: 847291
  TIME  20:19:54
────────────────────────────────────────────────────`,
  },
  {
    id: "status",
    label: "Status",
    cmd: "fce status",
    output: `────────────────────────────────────────────────
  Account
────────────────────────────────────────────────

  Plan         ·  Growth   GROWTH
  Price        ·  $49/mo
  Credits      ·  0 remaining
  API inboxes  ·  10
  App inboxes  ·  44`,
  },
  {
    id: "otp",
    label: "OTP",
    cmd: "fce otp dev-fy8x@ditcloud.info",
    output: `847291`,
  },
];

// ─── shared layout atoms ───────────────────────────────────────────────────

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

// ─── Terminal Typewriter ────────────────────────────────────────────────────

function TerminalTypewriter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [demoIdx, setDemoIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"idle" | "typing" | "output" | "pause">("idle");
  const [manualIdx, setManualIdx] = useState<number | null>(null);

  const activeIdx = manualIdx ?? demoIdx;
  const demo = DEMO_SEQUENCES[activeIdx];

  const startDemo = useCallback((idx: number) => {
    setManualIdx(idx);
    setTyped("");
    setPhase("typing");
  }, []);

  // Auto start when in view
  useEffect(() => {
    if (inView && phase === "idle") {
      setPhase("typing");
    }
  }, [inView, phase]);

  // Typing logic
  useEffect(() => {
    if (!inView) return;

    if (phase === "typing") {
      if (typed.length < demo.cmd.length) {
        const speed = typed.length < 3 ? 80 : 45;
        const t = setTimeout(() => setTyped(demo.cmd.slice(0, typed.length + 1)), speed);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("output"), 350);
        return () => clearTimeout(t);
      }
    }

    if (phase === "output") {
      const duration = demo.id === "dev" ? 4000 : 2800;
      const t = setTimeout(() => setPhase("pause"), duration);
      return () => clearTimeout(t);
    }

    if (phase === "pause") {
      if (manualIdx !== null) return; // don't auto-advance if manual
      const t = setTimeout(() => {
        const next = (demoIdx + 1) % DEMO_SEQUENCES.length;
        setDemoIdx(next);
        setTyped("");
        setPhase("typing");
      }, 600);
      return () => clearTimeout(t);
    }
  }, [phase, typed, demo, inView, demoIdx, manualIdx]);

  return (
    <div ref={ref} className="w-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {DEMO_SEQUENCES.map((d, i) => (
          <button
            key={d.id}
            onClick={() => startDemo(i)}
            className={`font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border transition-all duration-200 ${
              activeIdx === i
                ? d.highlight
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground bg-foreground/10 text-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {d.badge ? d.badge : d.label}
          </button>
        ))}
      </div>

      {/* Terminal window */}
      <div className={`rounded-lg border overflow-hidden transition-colors duration-300 ${
        demo.highlight
          ? "border-foreground/40 shadow-[0_0_30px_rgba(0,0,0,0.15)]"
          : "border-border"
      }`}>
        {/* Titlebar */}
        <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${
          demo.highlight ? "border-foreground/20 bg-foreground/5" : "border-border bg-muted/10"
        }`}>
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground flex-1 text-center">
            {demo.label === "fce dev" ? "⚡ fce dev — instant dev inbox" : `fce — ${demo.label.toLowerCase()}`}
          </span>
          {demo.highlight && (
            <span className="font-mono text-[10px] border border-foreground/30 rounded px-1.5 py-px text-foreground">
              recommended
            </span>
          )}
        </div>

        {/* Terminal body */}
        <div className="p-4 min-h-[180px] bg-background font-mono text-xs leading-relaxed">
          {/* Prompt + typed command */}
          <div className="flex items-start gap-2 text-muted-foreground">
            <span className="text-foreground/40 shrink-0">~</span>
            <span className="text-foreground/60 shrink-0">%</span>
            <span className="text-foreground break-all">
              {typed}
              {phase === "typing" && (
                <span className="inline-block w-[2px] h-[12px] bg-foreground animate-[blink_1s_step-end_infinite] ml-px align-text-bottom" />
              )}
            </span>
          </div>

          {/* Output */}
          <AnimatePresence>
            {phase === "output" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mt-2"
              >
                {demo.output.split("\n").map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.06 }}
                    className={`leading-relaxed ${
                      line.includes("✓")
                        ? "text-emerald-500"
                        : line.includes("·")
                          ? "text-muted-foreground"
                          : line.startsWith("─")
                            ? "text-muted-foreground/30"
                            : line.includes("GROWTH")
                              ? "text-amber-500"
                              : line.trim().match(/^\d{6}$/)
                                ? "text-emerald-400 text-2xl font-bold tracking-[0.3em] my-1"
                                : "text-foreground/70"
                    }`}
                  >
                    {line || "\u00a0"}
                  </motion.div>
                ))}
                {/* New prompt blink after output */}
                <div className="flex items-start gap-2 mt-2 text-muted-foreground">
                  <span className="text-foreground/40 shrink-0">~</span>
                  <span className="text-foreground/60 shrink-0">%</span>
                  <span className="inline-block w-[2px] h-[12px] bg-foreground/50 animate-[blink_1s_step-end_infinite] ml-px align-text-bottom" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {manualIdx !== null && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => {
              setManualIdx(null);
              setDemoIdx(0);
              setTyped("");
              setPhase("typing");
            }}
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            ↺ auto replay
          </button>
        </div>
      )}
    </div>
  );
}

// ─── OS Install Selector ───────────────────────────────────────────────────

function InstallSelector() {
  const [os, setOs] = useState<OS>("linux");
  const [methodIdx, setMethodIdx] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("win")) setOs("windows");
    else if (ua.includes("mac") || ua.includes("darwin")) setOs("mac");
    else setOs("linux");
  }, []);

  const { methods } = INSTALL_BY_OS[os];
  const method = methods[methodIdx] ?? methods[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* OS selector */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Platform</span>
        <div className="flex gap-1 ml-2">
          {(["mac", "windows", "linux"] as OS[]).map((o) => (
            <button
              key={o}
              onClick={() => { setOs(o); setMethodIdx(0); }}
              className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded border transition-all ${
                os === o
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              {INSTALL_BY_OS[o].label}
            </button>
          ))}
        </div>
        {os && (
          <span className="font-mono text-[10px] text-emerald-500 ml-1">
            ← detected
          </span>
        )}
      </div>

      {/* Method tabs */}
      <div className="flex gap-1 flex-wrap">
        {methods.map((m, i) => (
          <button
            key={m.name}
            onClick={() => setMethodIdx(i)}
            className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded border transition-all ${
              methodIdx === i
                ? "border-foreground/60 bg-muted/30 text-foreground"
                : "border-border text-muted-foreground/60 hover:text-muted-foreground"
            }`}
          >
            {m.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div className="relative">
        <CodeBlock code={method.cmd} language={method.lang} className="bg-muted/20" />
        <button
          onClick={() => handleCopy(method.cmd, method.name)}
          className="absolute top-2 right-2 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          {copied === method.name ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied === method.name ? "copied" : "copy"}
        </button>
      </div>

      <p className="font-mono text-[10px] text-muted-foreground/50">
        Or download a binary from{" "}
        <a href="https://github.com/DishIs/fce-cli/releases" target="_blank" rel="noopener noreferrer"
          className="text-foreground/60 hover:text-foreground underline underline-offset-2 transition-colors">
          GitHub Releases
        </a>
      </p>
    </div>
  );
}

// ─── fce dev showcase ──────────────────────────────────────────────────────

function DevShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (step >= 5) return;
    const t = setTimeout(() => setStep(s => s + 1), step === 0 ? 600 : 900);
    return () => clearTimeout(t);
  }, [step, inView]);

  const STEPS = [
    { icon: "·", text: "Registering random dev inbox…", color: "text-muted-foreground" },
    { icon: "✓", text: "Inbox ready: dev-fy8x@ditcloud.info", color: "text-emerald-500" },
    { icon: "✓", text: "Connecting WebSocket…", color: "text-emerald-500" },
    { icon: "·", text: "Watching for emails…  GROWTH", color: "text-muted-foreground" },
    {
      icon: "📧",
      text: "EMAIL RECEIVED",
      color: "text-foreground font-semibold",
      isEmail: true,
    },
  ];

  return (
    <div ref={ref} className="rounded-lg border border-foreground/30 overflow-hidden bg-background shadow-[0_0_40px_rgba(0,0,0,0.12)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-foreground/20 bg-foreground/5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">⚡ fce dev</span>
        <span className="ml-auto font-mono text-[10px] bg-foreground text-background px-2 py-px rounded">
          1 command. all-in-one.
        </span>
      </div>

      {/* Output */}
      <div className="p-5 font-mono text-xs space-y-1.5 min-h-[160px]">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <span className="text-foreground/40">~</span>
          <span className="text-foreground/60">%</span>
          <span className="text-foreground">fce dev</span>
        </div>
        {STEPS.slice(0, step).map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-2.5 ${s.color}`}
          >
            <span className="shrink-0 w-4">{s.icon}</span>
            <span>{s.text}</span>
          </motion.div>
        ))}

        {/* Email card */}
        <AnimatePresence>
          {step >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-3 border border-border rounded p-3 bg-muted/10"
            >
              <div className="text-muted-foreground/40 mb-2">────────────────────────────────</div>
              <div className="space-y-1">
                <div><span className="text-muted-foreground">ID    </span><span className="text-foreground">JpW3DImT3</span></div>
                <div><span className="text-muted-foreground">FROM  </span><span className="text-foreground">"SendTestEmail" &lt;noreply@sendtestemail.com&gt;</span></div>
                <div><span className="text-muted-foreground">SUBJ  </span><span className="text-foreground">Verification code: <span className="text-emerald-400 font-bold">847291</span></span></div>
                <div><span className="text-muted-foreground">TIME  </span><span className="text-foreground">20:19:54</span></div>
              </div>
              <div className="text-muted-foreground/40 mt-2">────────────────────────────────</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CliOverviewPage() {
  const T = 5;

  return (
    <div className="bg-background text-foreground overflow-x-hidden min-h-screen">
      <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
      <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 md:py-32" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={1} total={T} label="CLI Overview" />

          <div className="grid lg:grid-cols-2 gap-14 items-start">
            <div>
              <motion.h1
                className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              >
                FreeCustom.Email<br />in your terminal
              </motion.h1>
              <motion.p
                className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg"
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              >
                Create disposable inboxes, stream incoming emails, and extract OTP codes — all from your terminal. One command to get started.
              </motion.p>

              <motion.div className="mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Quick Install</span>
                <div className="mt-2">
                  <CodeBlock code="curl -fsSL freecustom.email/install.sh | sh" language="bash" />
                </div>
              </motion.div>

              <motion.div className="flex flex-wrap gap-4 mb-8"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Button asChild size="lg">
                  <a href="#install">Install Now</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="https://github.com/DishIs/fce-cli" target="_blank" rel="noopener noreferrer" className="gap-2">
                    <Github className="h-4 w-4" />
                    Source Code
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/api/automation" className="gap-2">
                    <Zap className="h-4 w-4" />
                    Automate with AI
                  </Link>
                </Button>
              </motion.div>

              {/* Feature bullets */}
              <motion.ul className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                {[
                  "Real-time WebSocket streaming (< 200ms)",
                  "Automatic OTP extraction — no regex",
                  "Keychain-backed secure credential storage",
                  "CI/CD ready via FCE_API_KEY env var",
                ].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {t}
                  </li>
                ))}
              </motion.ul>
            </div>

            {/* Terminal demo */}
            <FadeIn delay={0.3}>
              <TerminalTypewriter />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── INSTALL ──────────────────────────────────────────────────── */}
      <section id="install" className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={2} total={T} label="Installation" />
            <div className="grid lg:grid-cols-2 gap-14 items-start">
              <div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Get started in seconds</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
                  Available via Homebrew, Scoop, Chocolatey, npm, a shell script, or built from source. We auto-detected your platform below.
                </p>
                <InstallSelector />
              </div>

              {/* Update + Uninstall */}
              <div className="space-y-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Update</p>
                  <CodeBlock code="fce update" language="bash" className="bg-muted/20" />
                  <p className="font-mono text-[10px] text-muted-foreground/50 mt-2">Or use your package manager: <code>brew upgrade fce</code>, <code>scoop update fce</code>, etc.</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">CI / CD (env var)</p>
                  <CodeBlock code={`export FCE_API_KEY=fce_your_key_here\nfce status`} language="bash" className="bg-muted/20" />
                  <p className="font-mono text-[10px] text-muted-foreground/50 mt-2">Skips keychain entirely — perfect for GitHub Actions and pipelines.</p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                  <p className="text-sm text-emerald-600 font-mono">Credentials stored in OS keychain (macOS / Windows / Linux Secret Service).</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── fce dev SHOWCASE ─────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={3} total={T} label="fce dev — start here" />

          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <FadeIn>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] bg-foreground text-background px-3 py-1.5 rounded mb-6">
                <Zap className="h-3 w-3" />
                THE FASTEST WAY TO START
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight leading-tight">
                One command.<br />
                Inbox ready.<br />
                Emails streaming.
              </h2>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-sm">fce dev</code> combines{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-sm">fce inbox add random</code> +{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-sm">fce watch</code> into a single command. Register a temporary inbox and instantly start watching for emails — no setup, no flags, no friction.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Auto-generates a fresh disposable address",
                  "Immediately opens WebSocket connection",
                  "Emails arrive in terminal in real time",
                  "OTP codes highlighted automatically",
                  "Press Ctrl+C to stop — inbox auto-cleaned",
                ].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                    <ArrowRight className="h-3 w-3 text-foreground shrink-0" /> {t}
                  </li>
                ))}
              </ul>

              <CodeBlock code="fce dev" language="bash" className="bg-muted/20" />
            </FadeIn>

            <FadeIn delay={0.15}>
              <DevShowcase />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── COMMANDS ──────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={4} total={T} label="Reference" />
          <FadeIn>
            <h2 className="text-3xl font-bold mb-12 tracking-tight">All commands</h2>
          </FadeIn>

          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden">
            {ALL_COMMANDS.map((cmd, i) => (
              <FadeIn key={cmd.c} delay={i * 0.04}>
                <div
                  className={`bg-background px-5 py-6 h-full hover:bg-muted/10 transition-colors duration-200 group relative cursor-pointer ${
                    cmd.star ? "ring-1 ring-inset ring-foreground/20" : ""
                  }`}
                  onClick={() => navigator.clipboard?.writeText(cmd.c)}
                >
                  {cmd.star && (
                    <span className="absolute top-2 right-2 font-mono text-[8px] uppercase tracking-wider bg-foreground text-background px-1.5 py-px rounded">
                      ⚡ start
                    </span>
                  )}
                  <p className="font-mono text-xs text-muted-foreground mb-2">{String(i + 1).padStart(2, "0")}</p>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-foreground font-mono">{cmd.c}</p>
                    <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{cmd.d}</p>
                  <span className={`font-mono text-[9px] px-1.5 py-px rounded border ${
                    cmd.plan === "Any"
                      ? "border-border text-muted-foreground/60"
                      : cmd.plan.includes("Growth")
                        ? "border-amber-500/30 text-amber-600/80"
                        : "border-blue-500/30 text-blue-500/80"
                  }`}>
                    {cmd.plan}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2}>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-600 font-mono">Keychain-backed secure storage · MIT License</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/api/docs/quickstart">Explore Full Documentation</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/api/automation" className="gap-2">
                  <Cpu className="h-4 w-4" />
                  Automation Guide
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CI/CD ─────────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={5} total={T} label="CI / CD" />
          <FadeIn>
            <div className="grid lg:grid-cols-2 gap-14 items-start">
              <div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Built for pipelines</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
                  Skip the keychain in CI by setting the <code className="bg-muted px-1 py-0.5 rounded text-foreground text-xs">FCE_API_KEY</code> environment variable. The CLI reads it automatically with zero extra config.
                </p>
                <ul className="space-y-3">
                  {[
                    "GitHub Actions",
                    "GitLab CI/CD",
                    "CircleCI",
                    "Jenkins",
                    "Any shell-capable runner",
                  ].map(t => (
                    <li key={t} className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button asChild variant="outline">
                    <Link href="/api/automation" className="gap-2">
                      Full Automation Guide <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">GitHub Actions example</p>
                <CodeBlock language="yaml" className="bg-muted/20" code={`- name: Get OTP via fce
  env:
    FCE_API_KEY: \${{ secrets.FCE_API_KEY }}
  run: |
    INBOX=$(fce inbox add random)
    # trigger your app to send email to $INBOX
    OTP=$(fce otp $INBOX)
    echo "OTP: $OTP"`} />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30">
          fce CLI · MIT License · FreeCustom.Email · v0.1.12
        </p>
      </footer>
    </div>
  );
}