// app/api/cli/page.tsx
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Terminal, Github, Check, Copy, ShieldCheck, Zap, Bot,
  ArrowRight, Cpu, RotateCcw
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { ApiStats } from "@/components/ApiStats";
import { UseCasesSection } from "@/components/UseCasesSection";

// ─── data ──────────────────────────────────────────────────────────────────

type OS = "mac" | "windows" | "linux";

const INSTALL_BY_OS: Record<OS, { label: string; methods: { name: string; cmd: string; lang: string }[] }> = {
  mac: {
    label: "macOS",
    methods: [
      { name: "npm (recommended)", cmd: "npm install -g fcemail", lang: "bash" },
      { name: "Homebrew", cmd: "brew tap DishIs/homebrew-tap\nbrew install fce", lang: "bash" },
      { name: "Shell Script", cmd: "curl -fsSL freecustom.email/install.sh | sh", lang: "bash" },
      { name: "Go install", cmd: "go install github.com/DishIs/fce-cli@latest", lang: "bash" },
    ],
  },
  windows: {
    label: "Windows",
    methods: [
      { name: "npm (recommended)", cmd: "npm install -g fcemail", lang: "powershell" },
      { name: "Scoop", cmd: "scoop bucket add fce https://github.com/DishIs/scoop-bucket\nscoop install fce", lang: "powershell" },
      { name: "Chocolatey", cmd: "choco install fce", lang: "powershell" },
      { name: "Go install", cmd: "go install github.com/DishIs/fce-cli@latest", lang: "powershell" },
    ],
  },
  linux: {
    label: "Linux",
    methods: [
      { name: "npm (recommended)", cmd: "npm install -g fcemail", lang: "bash" },
      { name: "Shell Script", cmd: "curl -fsSL freecustom.email/install.sh | sh", lang: "bash" },
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
    cmd: "npm install -g fcemail",
    output: `
changed 1 package in 5s`,
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
  SUBJ  Your OTP for FCE: 212342
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
    output: `────────────────────────────────────────────────
  OTP
────────────────────────────────────────────────

  OTP   ·  212342
  From  ·  "Dishant Singh" <dishupandey57@gmail.com>
  Subj  ·  Your OTP for FCE: 212342
  Time  ·  20:19:54`,
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

  useEffect(() => {
    if (inView && phase === "idle") setPhase("typing");
  }, [inView, phase]);

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
      if (manualIdx !== null) return;
      const t = setTimeout(() => {
        const next = (demoIdx + 1) % DEMO_SEQUENCES.length;
        setDemoIdx(next); setTyped(""); setPhase("typing");
      }, 600);
      return () => clearTimeout(t);
    }
  }, [phase, typed, demo, inView, demoIdx, manualIdx]);

  return (
    <div ref={ref} className="w-full">
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {DEMO_SEQUENCES.map((d, i) => (
          <button key={d.id} onClick={() => startDemo(i)}
            className={`font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border transition-all duration-200 ${
              activeIdx === i
                ? d.highlight ? "border-foreground bg-foreground text-background" : "border-foreground bg-foreground/10 text-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            }`}>
            {d.badge ? d.badge : d.label}
          </button>
        ))}
      </div>
      <div className={`rounded-lg border overflow-hidden transition-colors duration-300 ${demo.highlight ? "border-foreground/40 shadow-[0_0_30px_rgba(0,0,0,0.15)]" : "border-border"}`}>
        <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${demo.highlight ? "border-foreground/20 bg-foreground/5" : "border-border bg-muted/10"}`}>
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground flex-1 text-center">
            {demo.label === "fce dev" ? "⚡ fce dev — instant dev inbox" : `fce — ${demo.label.toLowerCase()}`}
          </span>
          {demo.highlight && (
            <span className="font-mono text-[10px] border border-foreground/30 rounded px-1.5 py-px text-foreground">recommended</span>
          )}
        </div>
        <div className="p-4 min-h-[180px] bg-background font-mono text-xs leading-relaxed">
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
          <AnimatePresence>
            {phase === "output" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="mt-2">
                {demo.output.split("\n").map((line, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.06 }}
                    className={`leading-relaxed ${
                      line.includes("✓") ? "text-emerald-500"
                        : line.startsWith("─") ? "text-muted-foreground/30"
                        : line.includes("GROWTH") ? "text-amber-500"
                        : line.trim().startsWith("OTP") && line.includes("·") ? "text-emerald-400 font-semibold"
                        : line.includes("·") ? "text-muted-foreground"
                        : "text-foreground/70"
                    }`}>
                    {line || "\u00a0"}
                  </motion.div>
                ))}
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
          <button onClick={() => { setManualIdx(null); setDemoIdx(0); setTyped(""); setPhase("typing"); }}
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50 hover:text-foreground transition-colors">
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
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Platform</span>
        <div className="flex gap-1 ml-2">
          {(["mac", "windows", "linux"] as OS[]).map((o) => (
            <button key={o} onClick={() => { setOs(o); setMethodIdx(0); }}
              className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded border transition-all ${
                os === o ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40"
              }`}>
              {INSTALL_BY_OS[o].label}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10px] text-emerald-500 ml-1">← detected</span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {methods.map((m, i) => (
          <button key={m.name} onClick={() => setMethodIdx(i)}
            className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded border transition-all ${
              methodIdx === i ? "border-foreground/60 bg-muted/30 text-foreground" : "border-border text-muted-foreground/60 hover:text-muted-foreground"
            }`}>
            {m.name.split(" ")[0]}
          </button>
        ))}
      </div>
      <div className="relative">
        <CodeBlock code={method.cmd} language={method.lang} className="bg-muted/20" />
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
    { icon: "📧", text: "EMAIL RECEIVED", color: "text-foreground font-semibold", isEmail: true },
  ];

  return (
    <div ref={ref} className="rounded-lg border border-foreground/30 overflow-hidden bg-background shadow-[0_0_40px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-foreground/20 bg-foreground/5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">⚡ fce dev</span>
        <span className="ml-auto font-mono text-[10px] bg-foreground text-background px-2 py-px rounded">1 command. all-in-one.</span>
      </div>
      <div className="p-5 font-mono text-xs space-y-1.5 min-h-[160px]">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <span className="text-foreground/40">~</span>
          <span className="text-foreground/60">%</span>
          <span className="text-foreground">fce dev</span>
        </div>
        {STEPS.slice(0, step).map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }} className={`flex items-start gap-2.5 ${s.color}`}>
            <span className="shrink-0 w-4">{s.icon}</span>
            <span>{s.text}</span>
          </motion.div>
        ))}
        <AnimatePresence>
          {step >= 5 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-3 border border-border rounded p-3 bg-muted/10">
              <div className="text-muted-foreground/40 mb-2">────────────────────────────────</div>
              <div className="space-y-1">
                <div><span className="text-muted-foreground">ID    </span><span className="text-foreground">JpW3DImT3</span></div>
                <div><span className="text-muted-foreground">FROM  </span><span className="text-foreground">"Dishant Singh" &lt;dishupandey57@gmail.com&gt;</span></div>
                <div><span className="text-muted-foreground">SUBJ  </span><span className="text-foreground">Your OTP for FCE: <span className="text-emerald-400 font-bold">212342</span></span></div>
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

// ═══════════════════════════════════════════════════════════════════════════
//  INTERACTIVE TERMINAL
// ═══════════════════════════════════════════════════════════════════════════

// ─── Types ─────────────────────────────────────────────────────────────────

interface Seg { text: string; cls: string }

interface Line {
  text?: string
  cls?: string
  segs?: Seg[] // for mixed-colour lines like "  ✓ Watching inbox   GROWTH"
}

interface HistEntry {
  id: number
  cmd: string
  lines: Line[]
  pending?: boolean
}

interface FakeMsg {
  id: string
  from: string
  subj: string
  time: string
  otp?: string
  body?: string
}

interface LiveWatch {
  entryId: number
  cmd: string
  inbox: string
  initLines: Line[]
  emails: FakeMsg[]
  newInbox: boolean
}

interface AppSt {
  loggedIn: boolean
  plan: string
  planLabel: string
  price: string
  inboxes: string[]
  messages: Record<string, FakeMsg[]>
  credits: number
  reqUsed: number
  reqLimit: number
  appInboxes: number
}

// ─── Fake data helpers ──────────────────────────────────────────────────────

const DOMAINS = ["ditube.info", "ditplay.info", "ditcloud.info", "ditapi.info", "ditgame.info", "ditmail.online"];
const ADJS    = ["calm", "bold", "light", "swift", "bright", "cool", "free", "dark", "fast", "warm"];
const NOUNS   = ["wave", "vale", "dusk", "pulse", "peak", "spark", "flow", "tide", "arc", "dawn"];

const randEl  = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const randInt = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo)) + lo;
const randId  = () => {
  const c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 9 }, () => c[randInt(0, c.length)]).join("");
};
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
};
const genDevInbox = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const code  = Array.from({ length: 4 }, () => chars[randInt(0, chars.length)]).join("");
  return `dev-${code}@${randEl(DOMAINS)}`;
};
const genRandInbox = () => `${randEl(ADJS)}${randEl(NOUNS)}${randInt(1000,9999)}@${randEl(DOMAINS)}`;

const SENDERS = [
  { from: '"SendTestEmail" <noreply@sendtestemail.com>', mkSubj: () => `SendTestEmail.com - Testing Email ID: ${Math.random().toString(16).slice(2,18)}` },
  { from: '"GitHub" <noreply@github.com>',               mkSubj: (otp: string) => `Your GitHub verification code: ${otp}`, hasOtp: true },
  { from: '"Google" <no-reply@accounts.google.com>',     mkSubj: (otp: string) => `Google sign-in attempt · Your code: ${otp}`, hasOtp: true },
  { from: '"Stripe" <no-reply@stripe.com>',              mkSubj: (otp: string) => `Stripe verification: ${otp}`, hasOtp: true },
  { from: '"Discord" <noreply@discord.com>',             mkSubj: (otp: string) => `Your Discord verification code is ${otp}`, hasOtp: true },
];

const genFakeMsg = (): FakeMsg => {
  const sender = randEl(SENDERS);
  const otp    = (sender as any).hasOtp ? String(randInt(100000,999999)) : undefined;
  const subj   = (sender as any).hasOtp ? (sender as any).mkSubj(otp) : (sender as any).mkSubj();
  return {
    id:   randId(),
    from: sender.from,
    subj,
    time: nowTime(),
    otp,
    body: otp ? `Your verification code is: ${otp}\nThis code expires in 10 minutes.\nDo not share this code with anyone.` : undefined,
  };
};

// ─── Line factory ───────────────────────────────────────────────────────────

const L = {
  dim:     (text: string): Line => ({ text, cls: "text-muted-foreground" }),
  success: (text: string): Line => ({ text, cls: "text-emerald-500" }),
  error:   (text: string): Line => ({ text, cls: "text-red-400" }),
  warn:    (text: string): Line => ({ text, cls: "text-amber-500" }),
  normal:  (text: string): Line => ({ text, cls: "text-foreground/70" }),
  otp:     (text: string): Line => ({ text, cls: "text-emerald-400 font-semibold" }),
  sep:     ():             Line => ({ text: "────────────────────────────────────────────────", cls: "text-muted-foreground/30" }),
  sepLong: ():             Line => ({ text: "────────────────────────────────────────────────────", cls: "text-muted-foreground/30" }),
  blank:   ():             Line => ({ text: " ", cls: "" }),
  watchLine: (inbox: string): Line => ({
    segs: [
      { text: `  ✓  Watching ${inbox}`, cls: "text-emerald-500" },
      { text: "   GROWTH",              cls: "text-amber-500 font-semibold" },
    ],
  }),
  planLine: (label: string, badge: string): Line => ({
    segs: [
      { text: `  Plan         ·  ${label}`, cls: "text-muted-foreground" },
      { text: `   ${badge}`,               cls: "text-amber-500 font-semibold" },
    ],
  }),
  mixed: (segs: Seg[]): Line => ({ segs }),
};

const msgToLines = (msg: FakeMsg): Line[] => [
  L.sepLong(),
  L.dim(`  ID    ${msg.id}`),
  L.dim(`  FROM  ${msg.from}`),
  L.dim(`  SUBJ  ${msg.subj}`),
  L.dim(`  TIME  ${msg.time}`),
  ...(msg.otp ? [L.otp(`  OTP   ${msg.otp}`)] : []),
  L.sepLong(),
];

// ─── Initial state ──────────────────────────────────────────────────────────

const INIT_APP: AppSt = {
  loggedIn: false,
  plan: "FREE",
  planLabel: "Free",
  price: "$0/mo",
  inboxes: [],
  messages: {},
  credits: 0,
  reqUsed: 0,
  reqLimit: 5000,
  appInboxes: 0,
};

const getLoggedInState = (): Partial<AppSt> => {
  const m1: FakeMsg = { id: "wAL8iOXA2", from: '"GitHub" <noreply@github.com>', subj: "Your GitHub verification code: 847291", time: "09:33:47", otp: "847291", body: "Your GitHub verification code: 847291\nThis code expires in 15 minutes." };
  const m2: FakeMsg = { id: "1SaMAGKsf", from: '"SendTestEmail" <noreply@sendtestemail.com>', subj: "SendTestEmail.com - Testing Email ID: 1b7671529328", time: "09:33:11", body: "Test email content." };
  const m3: FakeMsg = { id: "JpW3DImT3", from: '"Stripe" <no-reply@stripe.com>', subj: "Stripe verification: 392841", time: "10:15:22", otp: "392841", body: "Your Stripe verification code: 392841\nValid for 10 minutes." };
  return {
    loggedIn: true, plan: "GROWTH", planLabel: "Growth", price: "$49/mo",
    inboxes: ["demo@ditplay.info", "test@ditcloud.info"],
    messages: { "demo@ditplay.info": [m2, m1], "test@ditcloud.info": [m3] },
    credits: 0, reqUsed: 716, reqLimit: 2000000, appInboxes: 44,
  };
};

// ─── Component ──────────────────────────────────────────────────────────────

function InteractiveTerminal() {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const idRef      = useRef(0);
  const watchRef   = useRef<LiveWatch | null>(null);
  const nextId     = () => ++idRef.current;

  const [history,        setHistory]        = useState<HistEntry[]>([]);
  const [input,          setInput]          = useState("");
  const [cmdStack,       setCmdStack]       = useState<string[]>([]);
  const [stackIdx,       setStackIdx]       = useState(-1);
  const [app,            setApp]            = useState<AppSt>(INIT_APP);
  const [liveWatch,      setLiveWatch]      = useState<LiveWatch | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<"uninstall" | null>(null);

  // keep ref in sync
  watchRef.current = liveWatch;

  // auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, liveWatch]);

  // email simulation
  useEffect(() => {
    if (!liveWatch) return;
    const inbox = liveWatch.inbox;
    const e1 = genFakeMsg();
    const e2 = genFakeMsg();
    const t1 = setTimeout(() => setLiveWatch(lw => lw?.inbox === inbox ? { ...lw, emails: [...lw.emails, e1] } : lw), 2200);
    const t2 = setTimeout(() => setLiveWatch(lw => lw?.inbox === inbox ? { ...lw, emails: [...lw.emails, e2] } : lw), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveWatch?.inbox]);

  // helpers
  const addEntry = (id: number, cmd: string, lines: Line[], pending = false) =>
    setHistory(h => [...h, { id, cmd, lines, pending }]);

  const updateEntry = (id: number, patch: Partial<HistEntry>) =>
    setHistory(h => h.map(e => e.id === id ? { ...e, ...patch } : e));

  const stopWatch = useCallback(() => {
    const lw = watchRef.current;
    if (!lw) return;
    const allLines: Line[] = [
      ...lw.initLines,
      ...lw.emails.flatMap(e => msgToLines(e)),
      L.blank(),
      L.dim("  ·  Disconnected."),
    ];
    setHistory(h => [...h, { id: lw.entryId, cmd: lw.cmd, lines: allLines }]);
    setApp(a => ({
      ...a,
      inboxes: lw.newInbox && !a.inboxes.includes(lw.inbox) ? [...a.inboxes, lw.inbox] : a.inboxes,
      messages: { ...a.messages, [lw.inbox]: [...(a.messages[lw.inbox] || []), ...lw.emails] },
      reqUsed: a.reqUsed + lw.emails.length + (lw.newInbox ? 2 : 1),
    }));
    setLiveWatch(null);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  // Escape = Ctrl+C
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && watchRef.current) { e.preventDefault(); stopWatch(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [stopWatch]);

  const isBusy = history.some(e => e.pending) || !!liveWatch;

  // ─── command execution ───────────────────────────────────────────────────

  const execute = (raw: string) => {
    const parts = raw.trim().split(/\s+/);
    const id    = nextId();

    if (parts[0] === "clear") { setHistory([]); return; }

    if (parts[0] !== "fce") {
      addEntry(id, raw, [
        L.error(`  ✗  command not found: ${parts[0]}`),
        L.dim("  ·  This demo supports fce commands. Try: fce help"),
      ]);
      return;
    }

    const sub = parts[1];

    // ── fce (no sub) or fce help ─────────────────────────────────
    if (!sub || sub === "help" || sub === "--help") {
      addEntry(id, raw, [
        L.blank(),
        L.dim("  ◉ fce  —  FreeCustom.Email CLI"),
        L.blank(),
        L.dim("  Manage disposable inboxes, extract OTPs, and stream"),
        L.dim("  real-time email events from your terminal."),
        L.blank(),
        L.dim("  Get started:"),
        L.dim("    fce login            Authenticate with your account"),
        L.dim("    fce dev              Instant inbox + live watch"),
        L.dim("    fce status           View account and plan"),
        L.blank(),
        L.dim("  All Commands:"),
        L.dim("    fce dev              Register temp inbox + watch instantly"),
        L.dim("    fce watch <inbox>    Stream emails via WebSocket  [Startup+]"),
        L.dim("    fce otp <inbox>      Get latest OTP code           [Growth+]"),
        L.dim("    fce inbox            Manage registered inboxes"),
        L.dim("    fce messages         List messages in an inbox"),
        L.dim("    fce domains          List available domains"),
        L.dim("    fce usage            Show request usage"),
        L.dim("    fce status           Account info and plan"),
        L.dim("    fce login            Authenticate"),
        L.dim("    fce logout           Remove stored credentials"),
        L.dim("    fce version          Show version info"),
        L.dim("    fce update           Update to latest version"),
        L.blank(),
        L.dim("  Docs: https://www.freecustom.email/api/cli"),
      ]);
      return;
    }

    // ── fce login ────────────────────────────────────────────────
    if (sub === "login") {
      if (app.loggedIn) {
        addEntry(id, raw, [
          L.warn(`  !  Already logged in ([${app.plan}])`),
          L.dim("  ·  Run `fce logout` first to switch accounts."),
        ]);
        return;
      }
      addEntry(id, raw, [L.dim("  [1/3]  Opening browser…")], true);
      setTimeout(() => updateEntry(id, {
        lines: [
          L.dim("  [1/3]  Opening browser…"),
          L.dim("  ·  If the browser doesn't open, visit: https://www.freecustom.email/api/cli-auth"),
          L.blank(),
          L.dim("  [2/3]  Waiting for authentication…"),
          L.dim("  ·  Complete login in the browser. This window will update automatically."),
        ],
      }), 1000);
      setTimeout(() => updateEntry(id, {
        lines: [
          L.dim("  [1/3]  Opening browser…"),
          L.dim("  ·  If the browser doesn't open, visit: https://www.freecustom.email/api/cli-auth"),
          L.blank(),
          L.dim("  [2/3]  Waiting for authentication…"),
          L.dim("  ·  Complete login in the browser. This window will update automatically."),
          L.blank(),
          L.dim("  [3/3]  Saving credentials…"),
        ],
      }), 2200);
      setTimeout(() => {
        setApp(a => ({ ...a, ...getLoggedInState() }));
        updateEntry(id, {
          pending: false,
          lines: [
            L.dim("  [1/3]  Opening browser…"),
            L.dim("  ·  If the browser doesn't open, visit: https://www.freecustom.email/api/cli-auth"),
            L.blank(),
            L.dim("  [2/3]  Waiting for authentication…"),
            L.dim("  ·  Complete login in the browser. This window will update automatically."),
            L.blank(),
            L.dim("  [3/3]  Saving credentials…"),
            L.blank(),
            L.success("  ✓  Logged in successfully!"),
            L.dim("  ·  Run `fce status` to see your account details."),
          ],
        });
      }, 3300);
      return;
    }

    // ── fce logout ───────────────────────────────────────────────
    if (sub === "logout") {
      if (!app.loggedIn) { addEntry(id, raw, [L.warn("  !  Not currently logged in.")]); return; }
      setApp(a => ({ ...a, loggedIn: false, plan: "FREE", planLabel: "Free" }));
      addEntry(id, raw, [L.success("  ✓  Logged out.")]);
      return;
    }

    // ── require login for everything else ────────────────────────
    if (!app.loggedIn) {
      addEntry(id, raw, [
        L.error("  ✗  Not authenticated. Run `fce login` first."),
      ]);
      return;
    }

    // ── fce dev ──────────────────────────────────────────────────
    if (sub === "dev") {
      const inbox      = genDevInbox();
      const initLines: Line[] = [
        L.dim(`  ·  Temporary inbox: ${inbox}`),
        L.success("  ✓  Watching for emails..."),
        L.blank(),
        L.watchLine(inbox),
        L.dim("  ·  Waiting for emails… (press Ctrl+C to stop)"),
        L.blank(),
      ];
      setLiveWatch({ entryId: id, cmd: raw, inbox, initLines, emails: [], newInbox: true });
      return;
    }

    // ── fce watch ────────────────────────────────────────────────
    if (sub === "watch") {
      const target = parts[2];
      if (!target) {
        addEntry(id, raw, [L.error("  ✗  Usage: fce watch <inbox> or fce watch random")]);
        return;
      }
      let inbox    = target;
      let newInbox = false;
      const initLines: Line[] = [];
      if (target === "random") {
        inbox    = genRandInbox();
        newInbox = true;
        initLines.push(L.dim(`  ·  Registering random inbox: ${inbox}`));
        initLines.push(L.success(`  ✓  Inbox ready: ${inbox}`));
        initLines.push(L.blank());
      } else if (!app.inboxes.includes(target)) {
        addEntry(id, raw, [
          L.error(`  ✗  Inbox not found: ${target}`),
          L.dim("  ·  Register it first with: fce inbox add <email>"),
        ]);
        return;
      }
      initLines.push(L.watchLine(inbox));
      initLines.push(L.dim("  ·  Waiting for emails… (press Ctrl+C to stop)"));
      initLines.push(L.blank());
      setLiveWatch({ entryId: id, cmd: raw, inbox, initLines, emails: [], newInbox });
      return;
    }

    // ── fce otp ──────────────────────────────────────────────────
    if (sub === "otp") {
      const inbox = parts[2];
      if (!inbox) { addEntry(id, raw, [L.error("  ✗  Usage: fce otp <inbox>")]); return; }
      const msgs    = app.messages[inbox];
      const withOtp = msgs && [...msgs].reverse().find(m => m.otp);
      if (!withOtp) {
        addEntry(id, raw, [
          L.warn(`  !  No OTP found in ${inbox}`),
          L.dim("  ·  Make sure an email with a verification code has been received."),
        ]);
        return;
      }
      addEntry(id, raw, [
        L.sep(),
        L.dim("  OTP"),
        L.sep(),
        L.blank(),
        L.mixed([
          { text: "  OTP   ·  ", cls: "text-muted-foreground" },
          { text: withOtp.otp!, cls: "text-emerald-400 font-semibold" },
        ]),
        L.dim(`  From  ·  ${withOtp.from}`),
        L.dim(`  Subj  ·  ${withOtp.subj}`),
        L.dim(`  Time  ·  ${withOtp.time}`),
      ]);
      return;
    }

    // ── fce status ───────────────────────────────────────────────
    if (sub === "status") {
      addEntry(id, raw, [
        L.sep(),
        L.dim("  Account"),
        L.sep(),
        L.blank(),
        L.planLine(app.planLabel, app.plan),
        L.dim(`  Price        ·  ${app.price}`),
        L.dim(`  Credits      ·  ${app.credits} remaining`),
        L.dim(`  API inboxes  ·  ${app.inboxes.length}`),
        L.dim(`  App inboxes  ·  ${app.appInboxes}`),
      ]);
      return;
    }

    // ── fce inbox ────────────────────────────────────────────────
    if (sub === "inbox") {
      const s3 = parts[2];
      const s4 = parts[3];

      if (!s3 || s3 === "list") {
        if (app.inboxes.length === 0) {
          addEntry(id, raw, [
            L.dim("  ·  No inboxes registered."),
            L.dim("  ·  Try: fce inbox add <email>  or  fce dev"),
          ]);
          return;
        }
        addEntry(id, raw, [
          L.sep(),
          L.dim(`  Inboxes  (${app.inboxes.length})`),
          L.sep(),
          L.blank(),
          ...app.inboxes.map((inb, i) => L.dim(`  ${String(i + 1).padStart(2, "0")} · ${inb}`)),
        ]);
        return;
      }

      if (s3 === "add") {
        if (!s4)                                          { addEntry(id, raw, [L.error("  ✗  Usage: fce inbox add <email>")]); return; }
        if (!s4.includes("@") || !s4.includes("."))       { addEntry(id, raw, [L.error(`  ✗  Invalid email address: ${s4}`)]); return; }
        if (app.inboxes.includes(s4))                     { addEntry(id, raw, [L.warn(`  !  Already registered: ${s4}`)]); return; }
        setApp(a => ({ ...a, inboxes: [...a.inboxes, s4], messages: { ...a.messages, [s4]: [] } }));
        addEntry(id, raw, [L.success(`  ✓  Registered: ${s4}`)]);
        return;
      }

      if (s3 === "remove") {
        if (!s4)                        { addEntry(id, raw, [L.error("  ✗  Usage: fce inbox remove <email>")]); return; }
        if (!app.inboxes.includes(s4))  { addEntry(id, raw, [L.warn(`  !  Inbox not found: ${s4}`)]); return; }
        setApp(a => ({ ...a, inboxes: a.inboxes.filter(x => x !== s4) }));
        addEntry(id, raw, [L.success(`  ✓  Removed: ${s4}`)]);
        return;
      }

      // fce inbox (unknown sub) → show help
      addEntry(id, raw, [
        L.dim("  Manage registered inboxes"),
        L.blank(),
        L.dim("  Usage:"),
        L.dim("    fce inbox [command]"),
        L.blank(),
        L.dim("  Available Commands:"),
        L.dim("    add     Register a new inbox"),
        L.dim("    list    List all registered inboxes"),
        L.dim("    remove  Unregister an inbox"),
      ]);
      return;
    }

    // ── fce messages ─────────────────────────────────────────────
    if (sub === "messages") {
      const inbox = parts[2];
      const msgId = parts[3];

      if (!inbox) { addEntry(id, raw, [L.error("  ✗  Usage: fce messages <inbox> [message-id]")]); return; }

      const msgs = app.messages[inbox];
      if (msgs === undefined && !app.inboxes.includes(inbox)) {
        addEntry(id, raw, [L.error(`  ✗  Inbox not found: ${inbox}`)]);
        return;
      }

      const list = msgs || [];

      if (msgId) {
        const msg = list.find(m => m.id === msgId);
        if (!msg) { addEntry(id, raw, [L.error(`  ✗  Message not found: ${msgId}`)]); return; }
        addEntry(id, raw, [
          L.sep(),
          L.dim("  Message Details"),
          L.sep(),
          L.blank(),
          L.dim(`  From     ·  ${msg.from}`),
          L.dim(`  Subject  ·  ${msg.subj}`),
          L.dim(`  Date     ·  ${new Date().toISOString()}`),
          L.blank(),
          { text: "── Text Content ──────────────────────────────────────────────", cls: "text-muted-foreground/30" },
          ...(msg.body ? msg.body.split("\n").map(l => L.dim(l)) : [L.dim("(no text content)")]),
        ]);
        return;
      }

      if (list.length === 0) {
        addEntry(id, raw, [
          L.sep(),
          L.dim(`  Messages in ${inbox}  (0)`),
          L.sep(),
          L.blank(),
          L.dim("  ·  No messages yet."),
        ]);
        return;
      }

      const lines: Line[] = [
        L.sep(),
        L.dim(`  Messages in ${inbox}  (${list.length})`),
        L.sep(),
      ];
      [...list].reverse().forEach(msg => {
        lines.push(L.blank());
        lines.push(L.dim(`  ID       ·  ${msg.id}`));
        lines.push(L.dim(`  From     ·  ${msg.from}`));
        lines.push(L.dim(`  Subject  ·  ${msg.subj}`));
        lines.push(L.dim(`  Date     ·  ${new Date().toISOString()}`));
        if (msg.otp) {
          lines.push(L.mixed([{ text: "  OTP      ·  ", cls: "text-muted-foreground" }, { text: msg.otp, cls: "text-emerald-400 font-semibold" }]));
        } else {
          lines.push(L.dim("  OTP      ·  —"));
        }
        lines.push(L.sep());
      });
      addEntry(id, raw, lines);
      return;
    }

    // ── fce domains ──────────────────────────────────────────────
    if (sub === "domains") {
      addEntry(id, raw, [
        L.sep(),
        L.dim(`  Domains  (${DOMAINS.length})`),
        L.sep(),
        L.blank(),
        ...DOMAINS.map((d, i) => L.dim(`  ${String(i + 1).padStart(2, "0")} · ${d}`)),
      ]);
      return;
    }

    // ── fce usage ────────────────────────────────────────────────
    if (sub === "usage") {
      const pct    = ((app.reqUsed / app.reqLimit) * 100).toFixed(1);
      const resetsAt = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      addEntry(id, raw, [
        L.sep(),
        L.dim("  Usage"),
        L.sep(),
        L.blank(),
        L.dim(`  Requests used      ·  ${app.reqUsed.toLocaleString()} / ${app.reqLimit.toLocaleString()}`),
        L.dim(`  Remaining          ·  ${(app.reqLimit - app.reqUsed).toLocaleString()}`),
        L.dim(`  Percent used       ·  ${pct}%`),
        L.dim(`  Credits remaining  ·  ${app.credits}`),
        L.dim(`  Resets approx      ·  ${resetsAt}T00:00:00Z`),
      ]);
      return;
    }

    // ── fce version ──────────────────────────────────────────────
    if (sub === "version") {
      addEntry(id, raw, [L.dim("fce 0.1.12 (7a0dc696c6b91e632df87d4989805e9a3681de22) 2026-03-15T08:34:40Z")]);
      return;
    }

    // ── fce update ───────────────────────────────────────────────
    if (sub === "update") {
      addEntry(id, raw, [L.success("  ✓  fce is up to date (0.1.12)")]);
      return;
    }

    // ── fce uninstall ────────────────────────────────────────────
    if (sub === "uninstall") {
      setPendingConfirm("uninstall");
      addEntry(id, raw, [L.warn("  Are you sure you want to remove all local configuration and logout? (y/N): ")]);
      return;
    }

    // ── unknown ──────────────────────────────────────────────────
    addEntry(id, raw, [
      L.error(`  ✗  unknown command: fce ${sub}`),
      L.dim("  ·  Run `fce help` for a list of available commands."),
    ]);
  };

  // ─── confirm handler ─────────────────────────────────────────────────────

  const handleConfirm = (answer: string) => {
    const a  = answer.trim().toLowerCase();
    const id = nextId();
    setPendingConfirm(null);
    if (pendingConfirm === "uninstall") {
      if (a === "y") {
        addEntry(id, answer, [
          L.success("  ✓  Local configuration and credentials cleared."),
          L.blank(),
          L.sep(),
          L.dim("  Next Steps"),
          L.sep(),
          L.dim("  To completely remove the fce binary:"),
          L.blank(),
          L.dim("   NPM      npm uninstall -g fcemail"),
          L.dim("   HOMEBREW brew uninstall fce"),
          L.dim("   SCOOP    scoop uninstall fce"),
          L.dim("   CHOCO    choco uninstall fce"),
          L.dim("   MANUAL   sudo rm /usr/local/bin/fce"),
        ]);
        setApp(INIT_APP);
      } else {
        addEntry(id, answer, [L.dim("  ·  Aborted.")]);
      }
    }
  };

  // ─── key handler ─────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const ni = Math.min(stackIdx + 1, cmdStack.length - 1);
      setStackIdx(ni); setInput(cmdStack[ni] ?? "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const ni = Math.max(stackIdx - 1, -1);
      setStackIdx(ni); setInput(ni === -1 ? "" : cmdStack[ni]);
      return;
    }
    if (e.ctrlKey && e.key === "l") {
      e.preventDefault(); setHistory([]);
      return;
    }
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || liveWatch || history.some(e => e.pending)) return;
    setInput(""); setStackIdx(-1);
    setCmdStack(s => [trimmed, ...s.filter(c => c !== trimmed)].slice(0, 50));
    if (pendingConfirm) { handleConfirm(trimmed); return; }
    execute(trimmed);
  };

  // ─── reset ───────────────────────────────────────────────────────────────

  const reset = () => {
    setHistory([]); setInput(""); setApp(INIT_APP);
    setLiveWatch(null); setPendingConfirm(null); setStackIdx(-1);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  // ─── line renderer ───────────────────────────────────────────────────────

  const renderLine = (line: Line, i: number) => {
    if (line.segs) {
      return (
        <div key={i} className="leading-relaxed font-mono text-xs">
          {line.segs.map((seg, j) => <span key={j} className={seg.cls}>{seg.text}</span>)}
        </div>
      );
    }
    return (
      <div key={i} className={`leading-relaxed font-mono text-xs ${line.cls || "text-foreground/70"}`}>
        {line.text || "\u00a0"}
      </div>
    );
  };

  // ─── suggestions ─────────────────────────────────────────────────────────

  const suggestions = app.loggedIn
    ? ["fce dev", "fce status", `fce otp demo@ditplay.info`, "fce inbox list", "fce help"]
    : ["fce login", "fce help", "fce version"];

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="rounded-lg border border-border overflow-hidden bg-background">
        {/* Titlebar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/10">
          <div className="flex gap-1.5">
            <button onClick={reset} title="Reset terminal"
              className="h-2.5 w-2.5 rounded-full bg-rose-500/60 hover:bg-rose-500 transition-colors" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground flex-1 text-center">
            fce — interactive demo
          </span>
          <button onClick={reset}
            className="flex items-center gap-1 font-mono text-[9px] border border-border rounded px-1.5 py-px text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <RotateCcw className="h-2.5 w-2.5" /> reset
          </button>
        </div>

        {/* Output */}
        <div
          ref={scrollRef}
          className="p-4 h-[380px] overflow-y-auto bg-background cursor-text"
          onClick={() => !liveWatch && !isBusy && inputRef.current?.focus()}
        >
          {/* Welcome */}
          {history.length === 0 && !liveWatch && (
            <div className="mb-4 space-y-1">
              <div className="font-mono text-xs text-muted-foreground">
                {"  ◉ fce  —  FreeCustom.Email CLI  "}
                <span className="border border-border rounded px-1.5 py-px text-[9px]">demo</span>
              </div>
              <div className="font-mono text-xs text-muted-foreground">{"  Type a command and press Enter."}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {"  Try: "}<span className="text-foreground">fce login</span>
                {"  or  "}<span className="text-foreground">fce help</span>
              </div>
            </div>
          )}

          {/* History */}
          {history.map(entry => (
            <div key={entry.id} className="mb-3">
              <div className="flex items-center gap-2 font-mono text-xs mb-0.5">
                <span className="text-foreground/40">~</span>
                <span className="text-foreground/60">%</span>
                <span className="text-foreground">{entry.cmd}</span>
              </div>
              <div>
                {entry.lines.map((line, i) => renderLine(line, i))}
                {entry.pending && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground/50 mt-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    authenticating…
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Live watch */}
          {liveWatch && (
            <div className="mb-3">
              <div className="flex items-center gap-2 font-mono text-xs mb-0.5">
                <span className="text-foreground/40">~</span>
                <span className="text-foreground/60">%</span>
                <span className="text-foreground">{liveWatch.cmd}</span>
              </div>
              <div>
                {liveWatch.initLines.map((line, i) => renderLine(line, i))}
                {liveWatch.emails.map((email, ei) => (
                  <div key={email.id}>
                    {msgToLines(email).map((line, i) => renderLine(line, i + ei * 100))}
                  </div>
                ))}
                <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-500/50 mt-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  watching…
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-border">
          {liveWatch ? (
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/5">
              <div className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[240px]">
                  Watching {liveWatch.inbox}
                </span>
              </div>
              <button onClick={stopWatch}
                className="flex items-center gap-1.5 font-mono text-[10px] border border-border rounded px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors shrink-0">
                <span className="text-[9px] opacity-70">⌃C</span> Stop
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/5">
              <span className="font-mono text-xs text-foreground/40 shrink-0">~</span>
              <span className="font-mono text-xs text-foreground/60 shrink-0">%</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isBusy}
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/25 disabled:opacity-40 caret-foreground"
                placeholder={pendingConfirm ? "(y/N)" : "type a command…"}
              />
            </div>
          )}
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40">Try:</span>
        {suggestions.map(s => (
          <button key={s}
            disabled={isBusy}
            onClick={() => { setInput(s); inputRef.current?.focus(); }}
            className="font-mono text-[10px] border border-border rounded px-2 py-0.5 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-30">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function CLIClient() {
  const T = 7;

  return (
    <div className="bg-background text-foreground overflow-x-hidden min-h-screen">
      <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
      <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 md:py-32" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={1} total={T} label="CLI Overview" />
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            <div>
              <motion.h1
                className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                FreeCustom.Email<br />in your terminal
              </motion.h1>
              <motion.p
                className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg"
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                Create disposable inboxes, stream incoming emails, and extract OTP codes — all from your terminal. One command to get started.
              </motion.p>

              <motion.div className="mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Quick Install</span>
                <div className="mt-2">
                  <CodeBlock code="npm install -g fcemail" language="bash" />
                </div>
              </motion.div>

              <motion.div className="flex flex-wrap gap-4 mb-8"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Button asChild size="lg"><a href="#install">Install Now</a></Button>
                <Button asChild variant="outline" size="lg">
                  <a href="https://github.com/DishIs/fce-cli" target="_blank" rel="noopener noreferrer" className="gap-2">
                    <Github className="h-4 w-4" />Source Code
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/api/automation" className="gap-2">
                    <Zap className="h-4 w-4" />Automate with AI
                  </Link>
                </Button>
              </motion.div>

              <motion.ul className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                {[
                  "Login instantly with fce login — browser-based, keychain-backed",
                  "Real-time WebSocket streaming (< 200ms)",
                  "Automatic OTP extraction — no regex",
                  "CI/CD ready: set FCE_API_KEY to skip interactive login",
                ].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {t}
                  </li>
                ))}
              </motion.ul>
            </div>
            <FadeIn delay={0.3}><TerminalTypewriter /></FadeIn>
          </div>
        </div>
      </section>

      <ApiStats />

      <UseCasesSection surface="cli" sectionIndex={2} sectionTotal={T} />

      {/* ── INSTALL ──────────────────────────────────────────────────── */}
      <section id="install" className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={3} total={T} label="Installation" />
            <div className="grid lg:grid-cols-2 gap-14 items-start">
              <div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Get started in seconds</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
                  Available via npm, Homebrew, Scoop, Chocolatey, a shell script, or built from source. We auto-detected your platform below.
                </p>
                <InstallSelector />
              </div>
              <div className="space-y-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Login</p>
                  <CodeBlock code={`fce login\n# Opens browser → sign in → key saved to keychain`} language="bash" className="bg-muted/20" />
                  <p className="font-mono text-[10px] text-muted-foreground/50 mt-2">One-time setup. API keys are auto-created and always reflect your current plan.</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">CI / CD — skip keychain</p>
                  <CodeBlock code={`# In GitHub Actions / any pipeline:\nexport FCE_API_KEY=\${{ secrets.FCE_API_KEY }}\nfce status`} language="bash" className="bg-muted/20" />
                  <p className="font-mono text-[10px] text-muted-foreground/50 mt-2">Get your key from the dashboard after <code>fce login</code>. Set it as a CI secret.</p>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                  <p className="text-sm text-emerald-600 font-mono">Keychain-backed locally · API keys update automatically with your plan.</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── fce dev SHOWCASE ─────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={4} total={T} label="fce dev — start here" />
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <FadeIn>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] bg-foreground text-background px-3 py-1.5 rounded mb-6">
                <Zap className="h-3 w-3" />THE FASTEST WAY TO START
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight leading-tight">
                One command.<br />Inbox ready.<br />Emails streaming.
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-sm">fce dev</code> combines{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-sm">fce inbox add random</code> +{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-sm">fce watch</code> into a single command.
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
            <FadeIn delay={0.15}><DevShowcase /></FadeIn>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE TERMINAL ─────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={5} total={T} label="Try It — Interactive Demo" />
          <FadeIn>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-3 tracking-tight">Run commands in your browser</h2>
              <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                This demo mirrors the real CLI exactly. Login, create inboxes, watch for emails, and extract OTPs.
                Use <kbd className="font-mono bg-muted/40 px-1.5 py-0.5 rounded text-xs border border-border">↑</kbd>{" "}
                <kbd className="font-mono bg-muted/40 px-1.5 py-0.5 rounded text-xs border border-border">↓</kbd> for command history,
                {" "}<kbd className="font-mono bg-muted/40 px-1.5 py-0.5 rounded text-xs border border-border">Esc</kbd> to stop watching.
              </p>
            </div>
            <InteractiveTerminal />
          </FadeIn>
        </div>
      </section>

      {/* ── COMMANDS ──────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={5} total={T} label="Reference" />
          <FadeIn>
            <h2 className="text-3xl font-bold mb-12 tracking-tight">All commands</h2>
          </FadeIn>
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden">
            {ALL_COMMANDS.map((cmd, i) => (
              <FadeIn key={cmd.c} delay={i * 0.04}>
                <div
                  className={`bg-background px-5 py-6 h-full hover:bg-muted/10 transition-colors duration-200 group relative cursor-pointer ${cmd.star ? "ring-1 ring-inset ring-foreground/20" : ""}`}
                  onClick={() => navigator.clipboard?.writeText(cmd.c)}>
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
                    cmd.plan === "Any" ? "border-border text-muted-foreground/60"
                      : cmd.plan.includes("Growth") ? "border-amber-500/30 text-amber-600/80"
                      : "border-blue-500/30 text-blue-500/80"
                  }`}>{cmd.plan}</span>
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
              <Button asChild variant="outline"><Link href="/api/docs/quickstart">Explore Full Documentation</Link></Button>
              <Button asChild variant="outline">
                <Link href="/api/automation" className="gap-2"><Cpu className="h-4 w-4" />Automation Guide</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CI/CD ─────────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={6} total={T} label="CI / CD" />
          <FadeIn>
            <div className="grid lg:grid-cols-2 gap-14 items-start">
              <div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Built for pipelines</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
                  Skip the keychain in CI by setting the{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-foreground text-xs">FCE_API_KEY</code>{" "}
                  environment variable. The CLI reads it automatically with zero extra config.
                </p>
                <ul className="space-y-3">
                  {["GitHub Actions", "GitLab CI/CD", "CircleCI", "Jenkins", "Any shell-capable runner"].map(t => (
                    <li key={t} className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button asChild variant="outline">
                    <Link href="/api/automation" className="gap-2">Full Automation Guide <ArrowRight className="h-3.5 w-3.5" /></Link>
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

      <footer className="border-t border-border py-12 px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30">
          fce CLI · MIT License · FreeCustom.Email · v0.1.12
        </p>
      </footer>
    </div>
  );
}