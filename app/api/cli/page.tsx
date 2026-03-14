// app/api/cli/page.tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Terminal, Download, Zap, ShieldCheck, Check, Copy } from "lucide-react";

// ─── data ──────────────────────────────────────────────────────────────────
const INSTALL_STEPS = [
  { label: "macOS / Linux", cmd: "brew tap DishIs/homebrew-tap\nbrew install fce" },
  { label: "Windows (Scoop)", cmd: "scoop bucket add fce https://github.com/DishIs/scoop-bucket\nscoop install fce" },
  { label: "Shell Script", cmd: "curl -sSfL https://raw.githubusercontent.com/DishIs/fce-cli/main/scripts/install.sh | sh" },
];

const CLI_FEATURES = [
  { title: "Keychain Security", desc: "Credentials stored in your OS secure vault" },
  { title: "WebSocket Streaming", desc: "Real-time email events in your shell" },
  { title: "OTP Extraction", desc: "Instant codes for Growth plan users" },
  { title: "CI/CD Ready", desc: "Use FCE_API_KEY for headless environments" },
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

const TerminalWindow = ({ children, title = "zsh" }: { children: React.ReactNode, title?: string }) => (
  <div className="w-full rounded-lg border border-border bg-[#09090b] shadow-2xl overflow-hidden font-mono text-xs md:text-sm">
    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
      </div>
      <div className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1.5">
        <Terminal className="h-3 w-3" />
        {title}
      </div>
      <div className="w-10" />
    </div>
    <div className="p-4 md:p-6 overflow-x-auto whitespace-pre">
      {children}
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CliOverviewPage() {
  return (
    <div className="bg-background text-foreground overflow-x-hidden min-h-screen">
      <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
      <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 md:py-32" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={1} total={4} label="CLI Overview" />
          
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
                The official CLI to manage disposable inboxes, extract OTPs, and stream events directly from your shell.
              </motion.p>
              <motion.div 
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              >
                <Button asChild size="lg">
                  <a href="#install">Install Now</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/api/docs">View API Docs</Link>
                </Button>
              </motion.div>
            </div>

            <FadeIn delay={0.3} className="w-full">
              <TerminalWindow title="fce status">
                <span className="text-emerald-400">dishantsingh@Dishant</span> <span className="text-white/60">~ %</span> fce status<br /><br />
                <span className="text-white/40">────────────────────────────────────────────────</span><br />
                <span className="text-white/40">  Account</span><br />
                <span className="text-white/40">────────────────────────────────────────────────</span><br /><br />
                <span className="text-white/60">  Plan         ·</span> <span className="text-white font-bold">Growth</span>   <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-px rounded text-[10px] ml-2">GROWTH</span><br />
                <span className="text-white/60">  Price        ·</span> <span className="text-white">$49/mo</span><br />
                <span className="text-white/60">  Credits      ·</span> <span className="text-emerald-500">0 remaining</span><br />
                <span className="text-white/60">  API inboxes  ·</span> <span className="text-white">7</span><br />
                <span className="text-white/60">  App inboxes  ·</span> <span className="text-white">43</span><br />
              </TerminalWindow>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── INSTALL ───────────────────────────────────────────────────── */}
      <section id="install" className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <SectionMarker index={2} total={4} label="Installation" />
            <h2 className="text-3xl font-bold mb-12">Get started in seconds</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {INSTALL_STEPS.map((step, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{step.label}</p>
                  <pre className="bg-black/20 p-3 rounded-md font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed border border-border/50">
                    <code>{step.cmd}</code>
                  </pre>
                  <Button variant="ghost" size="sm" className="w-full font-mono text-[10px] gap-2" onClick={() => navigator.clipboard.writeText(step.cmd)}>
                    <Copy className="h-3 w-3" /> Copy command
                  </Button>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── SHOWCASE: WATCH ───────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={3} total={4} label="Real-time Stream" />
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <h2 className="text-3xl font-bold mb-6 leading-tight">
                Watch inboxes like<br />you watch logs
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Use <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">fce watch</code> to subscribe to WebSocket events. Emails are delivered to your terminal instantly as they arrive.
              </p>
              <ul className="space-y-4">
                {[
                  "Extremely low latency (< 200ms)",
                  "Automatic reconnection logic",
                  "Colored ANSI output for readability",
                  "Secure WebSocket with auth tickets"
                ].map(t => (
                  <li key={t} className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500" /> {t}
                  </li>
                ))}
              </ul>
            </FadeIn>

            <FadeIn delay={0.2}>
              <TerminalWindow title="fce watch random">
                <span className="text-emerald-400">dishantsingh@Dishant</span> <span className="text-white/60">~ %</span> fce watch random<br />
                <span className="text-white/40">  ·  Registering random inbox: </span><span className="text-white">boldwave4309@ditgame.info</span><br />
                <span className="text-emerald-500">  ✓  Inbox ready: </span><span className="text-white">boldwave4309@ditgame.info</span><br /><br />
                <span className="text-emerald-500">  ✓  Watching </span><span className="text-white">boldwave4309@ditgame.info</span>   <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-px rounded text-[10px] ml-1">GROWTH</span><br />
                <span className="text-white/40">  ·  Waiting for emails… (press Ctrl+C to stop)</span><br /><br />
                <span className="text-white/20">────────────────────────────────────────────────────</span><br />
                <span className="text-white/60">  ID   </span> <span className="text-white">PpTiz-8v_</span><br />
                <span className="text-white/60">  FROM </span> <span className="text-white">"SendTestEmail" {"<"}noreply@sendtestemail.com{">"}</span><br />
                <span className="text-white/60">  SUBJ </span> <span className="text-white">Verification code: 847291</span><br />
                <span className="text-white/60">  TIME </span> <span className="text-white">03:17:44</span><br />
                <span className="text-white/20">────────────────────────────────────────────────────</span>
              </TerminalWindow>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── COMMANDS ──────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <div className="max-w-5xl mx-auto">
          <SectionMarker index={4} total={4} label="Reference" />
          <h2 className="text-3xl font-bold mb-12">Commands</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden rounded-xl border border-border divide-x divide-y divide-border bg-card">
            {[
              { c: "fce login",   d: "Authenticate via browser" },
              { c: "fce watch",   d: "Stream emails via WebSocket" },
              { c: "fce otp",     d: "Extract latest OTP code" },
              { c: "fce status",  d: "View account and plan" },
              { c: "fce inbox",   d: "Manage registered addresses" },
              { c: "fce usage",   d: "Check credit consumption" },
              { c: "fce domains", d: "List available domains" },
              { c: "fce help",    d: "Full command reference" },
            ].map(cmd => (
              <div key={cmd.c} className="p-6 bg-card hover:bg-muted/10 transition-colors">
                <code className="text-primary font-bold text-sm block mb-2">{cmd.c}</code>
                <p className="text-xs text-muted-foreground leading-relaxed">{cmd.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-600 font-mono">Keychain-backed secure credential storage.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/api/docs/quickstart">Explore Full Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 px-6 text-center">
        <p className="font-mono text-xs text-muted-foreground/40">
          fce CLI · MIT License · FreeCustom.Email
        </p>
      </footer>
    </div>
  );
}
