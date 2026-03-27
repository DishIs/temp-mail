// app/api/EmailFlowAnimation.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

// ── The animated ASCII flow: App → SMTP → FCE Servers → SDK → OTP ────────────

const STAGES = [
  { id: "app",    label: "Your App",          mono: "APP",      x: 0   },
  { id: "smtp",   label: "SMTP",              mono: "SMTP",     x: 25  },
  { id: "server", label: "FCE Servers",       mono: "INBOX",    x: 50  },
  { id: "sdk",    label: "SDK / WebSocket",   mono: "SDK",      x: 75  },
  { id: "otp",    label: "OTP Extracted",     mono: "OTP",      x: 100 },
] as const;

type StageId = typeof STAGES[number]["id"];

const STAGE_DETAILS: Record<StageId, { lines: string[]; badge?: string }> = {
  app: {
    lines: [
      "POST /api/signup",
      '{ "email": "test@ditapi.info" }',
      "",
      "▶ Sending verification…",
    ],
  },
  smtp: {
    lines: [
      "EHLO mail.example.com",
      "250-STARTTLS",
      "RCPT TO:<test@ditapi.info>",
      "354 End data",
    ],
  },
  server: {
    lines: [
      "✓ Message received",
      "✓ Stored in mailbox",
      "✓ OTP detected: 847291",
      "▶ Broadcasting event…",
    ],
  },
  sdk: {
    lines: [
      "ws.on('email', email => {",
      "  // instant push",
      '  console.log(email.otp)',
      "})",
    ],
    badge: "< 200ms",
  },
  otp: {
    lines: [
      '  "success": true,',
      '  "otp": "847291",',
      '  "verification_link":',
      '  "https://app.com/…"',
    ],
    badge: "✓ verified",
  },
};

// Packet characters that travel along the line
const PACKETS = ["◆", "◇", "▸", "·", "○"];

function Packet({ delay, duration }: { delay: number; duration: number }) {
  const char = PACKETS[Math.floor(Math.random() * PACKETS.length)];
  return (
    <motion.span
      className="absolute top-1/2 -translate-y-1/2 font-mono text-[10px] text-foreground/50 pointer-events-none"
      initial={{ left: "0%", opacity: 0 }}
      animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2 + 1,
        ease: "linear",
      }}
    >
      {char}
    </motion.span>
  );
}

export function EmailFlowAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeStage, setActiveStage] = useState<StageId>("app");
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-advance through stages
  useEffect(() => {
    if (!inView || !autoPlay) return;
    const order: StageId[] = ["app", "smtp", "server", "sdk", "otp"];
    const idx = order.indexOf(activeStage);
    const next = order[(idx + 1) % order.length];
    const timer = setTimeout(() => setActiveStage(next), 2200);
    return () => clearTimeout(timer);
  }, [activeStage, inView, autoPlay]);

  return (
    <div ref={ref} className="w-full select-none">
      {/* ── Stage indicators ───────────────────────────────────────────── */}
      <div className="relative w-full mb-6 px-2">
        {/* connecting line */}
        <div className="absolute top-[18px] left-[5%] right-[5%] h-px bg-border" />

        {/* animated packets on the line */}
        <div className="absolute top-[14px] left-[5%] right-[5%] h-[9px] overflow-hidden">
          {[0, 0.6, 1.2, 1.8, 2.4].map((d, i) => (
            <Packet key={i} delay={d} duration={2.8} />
          ))}
        </div>

        {/* stage nodes */}
        <div className="relative flex justify-between">
          {STAGES.map((stage) => {
            const active = activeStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => { setActiveStage(stage.id); setAutoPlay(false); }}
                className="flex flex-col items-center gap-1.5 group"
              >
                {/* dot */}
                <div className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground group-hover:border-foreground/50"
                }`}>
                  {active && (
                    <motion.span
                      className="absolute inset-0 rounded-full border border-foreground/30"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.7, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                  <span className="font-mono text-[8px] font-bold">{stage.mono}</span>
                </div>
                {/* label */}
                <span className={`font-mono text-[9px] uppercase tracking-wider text-center leading-tight max-w-[56px] transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground/60"
                }`}>
                  {stage.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Detail panel ───────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-background/80 overflow-hidden">
        {/* panel header */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/10">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full border border-border" />
            <span className="h-2 w-2 rounded-full border border-border" />
            <span className="h-2 w-2 rounded-full border border-border" />
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={activeStage}
              className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2 }}
            >
              {STAGES.find(s => s.id === activeStage)?.label}
            </motion.span>
          </AnimatePresence>
          {STAGE_DETAILS[activeStage].badge && (
            <AnimatePresence mode="wait">
              <motion.span
                key={activeStage + "-badge"}
                className="ml-auto font-mono text-[10px] border border-border rounded px-1.5 py-px text-foreground"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              >
                {STAGE_DETAILS[activeStage].badge}
              </motion.span>
            </AnimatePresence>
          )}
        </div>

        {/* code lines */}
        <div className="px-4 py-4 min-h-[84px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-1"
            >
              {STAGE_DETAILS[activeStage].lines.map((line, i) => (
                <motion.p
                  key={i}
                  className="font-mono text-xs text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.07 }}
                >
                  {line || "\u00a0"}
                </motion.p>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* replay / auto toggle */}
      <div className="flex items-center justify-end gap-3 mt-3">
        {!autoPlay && (
          <button
            onClick={() => { setActiveStage("app"); setAutoPlay(true); }}
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            ↺ replay
          </button>
        )}
        <span className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest">
          {autoPlay ? "auto" : "manual"} · click node to inspect
        </span>
      </div>
    </div>
  );
}