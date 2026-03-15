// app/api/cli/page.tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Terminal, Download, Check, ShieldCheck, Github, Copy } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";

// ─── data ──────────────────────────────────────────────────────────────────
const INSTALL_STEPS = [
  { label: "Homebrew", cmd: "brew tap DishIs/homebrew-tap\nbrew install fce", lang: "bash" },
  { label: "Scoop", cmd: "scoop bucket add fce https://github.com/DishIs/scoop-bucket\nscoop install fce", lang: "powershell" },
  { label: "Shell Script", cmd: "curl -sSfL https://raw.githubusercontent.com/DishIs/fce-cli/main/scripts/install.sh | sh", lang: "bash" },
];

const TERMINAL_OUTPUTS = {
  status: `────────────────────────────────────────────────
  Account
────────────────────────────────────────────────

  Plan         ·  Growth   <span style="color: #f59e0b; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 0 4px; border-radius: 2px;">GROWTH</span>
  Price        ·  $49/mo
  Credits      ·  <span style="color: #10b981;">0 remaining</span>
  API inboxes  ·  7
  App inboxes  ·  43`,
  
  watch: `<span style="opacity: 0.5;">·</span> Registering random inbox: <span style="font-weight: bold;">boldwave4309@ditgame.info</span>
<span style="color: #10b981;">✓</span> Inbox ready: <span style="font-weight: bold;">boldwave4309@ditgame.info</span>

<span style="color: #10b981;">✓</span> Watching <span style="font-weight: bold;">boldwave4309@ditgame.info</span>   <span style="color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 0 4px; border-radius: 2px;">GROWTH</span>
<span style="opacity: 0.5;">·</span> Waiting for emails… (press Ctrl+C to stop)

<span style="opacity: 0.2;">────────────────────────────────────────────────────</span>
  ID    PpTiz-8v_
  FROM  "SendTestEmail" <noreply@sendtestemail.com>
  SUBJ  Verification code: 847291
  TIME  03:17:44
<span style="opacity: 0.2;">────────────────────────────────────────────────────</span>`
};

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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CliOverviewPage() {
  const T = 4;

  return (
    <div className="bg-background text-foreground overflow-x-hidden min-h-screen">
      <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
      <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 md:py-32" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={1} total={T} label="CLI Overview" />
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
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
                Create disposable inboxes, stream incoming emails, and extract OTP codes directly from your terminal.
              </motion.p>
              
              <motion.div
                className="mb-8 flex flex-col gap-2"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Quick Install</span>
                <CodeBlock code="curl -fsSL freecustom.email/install.sh | sh" language="bash" />
              </motion.div>
              <motion.div 
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              >
                <Button asChild size="lg">
                  <a href="#install">Install Now</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="https://github.com/DishIs/fce-cli" target="_blank" rel="noopener noreferrer" className="gap-2">
                    <Github className="h-4 w-4" />
                    Source Code
                  </a>
                </Button>
              </motion.div>
            </div>

            <FadeIn delay={0.3} className="w-full">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">fce status</span>
                </div>
                <CodeBlock isHtml code={TERMINAL_OUTPUTS.status} className="bg-muted/20" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── INSTALL ───────────────────────────────────────────────────── */}
      <section id="install" className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={2} total={T} label="Installation" />
            <h2 className="text-3xl font-bold mb-12 tracking-tight">Get started in seconds</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {INSTALL_STEPS.map((step, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{step.label}</p>
                  <CodeBlock language={step.lang} code={step.cmd} className="bg-muted/20 flex-1" />
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── SHOWCASE: WATCH ───────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={3} total={T} label="Real-time Stream" />
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <h2 className="text-3xl font-bold mb-6 tracking-tight leading-tight">
                Watch inboxes like<br />you watch logs
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Use <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">fce watch</code> to subscribe to WebSocket events. Emails are delivered to your terminal instantly as they arrive.
              </p>
              <ul className="space-y-4">
                {[
                  "Extremely low latency (< 200ms)",
                  "Automatic reconnection logic",
                  "Secure keychain credential storage",
                  "Cross-platform support"
                ].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500" /> {t}
                  </li>
                ))}
              </ul>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">fce watch random</span>
                </div>
                <CodeBlock isHtml code={TERMINAL_OUTPUTS.watch} className="bg-muted/20" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── COMMANDS ──────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={4} total={T} label="Reference" />
          <h2 className="text-3xl font-bold mb-12 tracking-tight">Commands</h2>
          
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden">
            {[
              { c: "fce login",   d: "Authenticate via browser" },
              { c: "fce watch",   d: "Stream emails via WebSocket" },
              { c: "fce otp",     d: "Extract latest OTP code" },
              { c: "fce status",  d: "View account and plan" },
              { c: "fce inbox",   d: "Manage registered addresses" },
              { c: "fce usage",   d: "Check credit consumption" },
              { c: "fce domains", d: "List available domains" },
              { c: "fce help",    d: "Full command reference" },
            ].map((cmd, i) => (
              <FadeIn key={cmd.c} delay={i * 0.06}>
                <div
                  className="bg-background px-6 py-8 h-full hover:bg-muted/10 transition-colors duration-200 group relative cursor-pointer"
                  onClick={() => navigator.clipboard.writeText(cmd.c)}
                >
                  <p className="font-mono text-xs text-muted-foreground mb-3">{String(i + 1).padStart(2, "0")}</p>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">{cmd.c}</p>
                    <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cmd.d}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-600 font-mono">Keychain-backed secure storage.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/api/docs/quickstart">Explore Full Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30">
          fce CLI · MIT License · FreeCustom.Email
        </p>
      </footer>
    </div>
  );
}
