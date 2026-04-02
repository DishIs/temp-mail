"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Mail, Bot } from "lucide-react";

// ─── stage data ───────────────────────────────────────────────────────────────
const STAGES = [
  { id: "smtp",   label: "SMTP",            mono: "SMTP"  },
  { id: "server", label: "FCE Servers",     mono: "INBOX" },
  { id: "agent",  label: "AI Agent",        mono: "AGENT" },
  { id: "otp",    label: "OTP Extracted",   mono: "OTP"   },
] as const;

type StageId = (typeof STAGES)[number]["id"];

const STAGE_DETAILS: Record<StageId, { lines: string[]; badge?: string }> = {
  smtp: {
    lines: [
      "RCPT TO:<test@ditapi.info>",
      "DATA",
      "Subject: Your OTP",
      "From: service@example.com",
    ],
  },
  server: {
    lines: [
      "✓  Message received",
      "✓  Stored in mailbox",
      "✓  OTP detected: 847291",
      "▶  Notifying MCP clients...",
    ],
  },
  agent: {
    lines: [
      "client.create_and_wait_for_otp()",
      "// Holding connection open...",
      "// Email received!",
    ],
    badge: "< 200 ms",
  },
  otp: {
    lines: [
      '  "success": true,',
      '  "otp": "847291",',
      '  "inbox": "test@ditapi.info"',
    ],
    badge: "✓ verified",
  },
};

const STAGE_ORDER: StageId[] = ["smtp", "server", "agent", "otp"];
const DWELL_MS = 2200;

// ── three mail icons: big (lead), medium, small (trailing) ──────────────────
const CONVOY = [
  { px: 18, stroke: 1.5, launchDelay: 0,    yBob:  0  },
];

const LINE_TOP = 18; // px from top of the stage-bar div where the connector sits

// ─── component ────────────────────────────────────────────────────────────────
export function McpFlowAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs     = useRef<(HTMLButtonElement | null)[]>([]);
  const inView       = useInView(containerRef, { once: true, margin: "-80px" });

  const [activeIdx,  setActiveIdx]  = useState(0);
  const [fromX,      setFromX]      = useState<number | null>(null);
  const [toX,        setToX]        = useState<number | null>(null);
  const [showConvoy, setShowConvoy] = useState(false);
  const [travelling, setTravelling] = useState(false);
  const [autoPlay,   setAutoPlay]   = useState(true);
  const [blinkIdx,   setBlinkIdx]   = useState<number | null>(null);
  const tripKey = useRef(0);

  const measureNode = useCallback((idx: number) => {
    const container = containerRef.current;
    const node      = nodeRefs.current[idx];
    if (!container || !node) return null;
    const cr = container.getBoundingClientRect();
    const nr = node.getBoundingClientRect();
    return nr.left - cr.left + nr.width / 2;
  }, []);

  useEffect(() => {
    if (!inView) return;
    const x = measureNode(0);
    if (x !== null) { setFromX(x); setToX(x); }
  }, [inView, measureNode]);

  const launch = useCallback((from: number, to: number, nextIdx: number, isAuto: boolean) => {
    tripKey.current += 1;
    setFromX(from);
    setToX(to);
    setShowConvoy(true);
    setTravelling(true);

    const timer = setTimeout(() => {
      setShowConvoy(false);
      setTravelling(false);
      setActiveIdx(nextIdx);
      setBlinkIdx(nextIdx);
      setTimeout(() => setBlinkIdx(null), 900);
    }, 650);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!inView || !autoPlay || travelling) return;

    const timer = setTimeout(() => {
      const nextIdx = (activeIdx + 1) % STAGE_ORDER.length;
      const srcX    = measureNode(activeIdx);
      const dstX    = measureNode(nextIdx);
      if (srcX === null || dstX === null) return;
      launch(srcX, dstX, nextIdx, true);
    }, DWELL_MS);

    return () => clearTimeout(timer);
  }, [activeIdx, inView, autoPlay, travelling, measureNode, launch]);

  const handleNodeClick = (idx: number) => {
    if (travelling || idx === activeIdx) return;
    setAutoPlay(false);
    const srcX = measureNode(activeIdx);
    const dstX = measureNode(idx);
    if (srcX === null || dstX === null) return;
    launch(srcX, dstX, idx, false);
  };

  const activeStage = STAGE_ORDER[activeIdx];

  return (
    <div ref={containerRef} className="w-full select-none">
      <div className="relative w-full mb-6 px-2">
        <div className="absolute top-[18px] left-[5%] right-[5%] h-px bg-border" />
        <motion.div
          className="absolute top-[18px] left-[5%] h-px bg-foreground/25 origin-left"
          style={{ right: "5%" }}
          animate={{ scaleX: activeIdx / (STAGE_ORDER.length - 1) }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <AnimatePresence>
          {showConvoy && fromX !== null && toX !== null &&
            CONVOY.map((m, i) => (
              <motion.div
                key={`${tripKey.current}-${i}`}
                className="absolute z-20 pointer-events-none"
                style={{
                  top:       LINE_TOP - m.px / 2,
                  marginLeft: -m.px / 2,
                }}
                initial={{
                  left:    fromX,
                  opacity: 0,
                  y:       0,
                }}
                animate={{
                  left:    toX,
                  opacity: [0, 0.9, 0.85, 0],
                  y:       [0, m.yBob, m.yBob * 0.5, 0],
                }}
                transition={{
                  duration: 0.44 + m.launchDelay,
                  delay:    m.launchDelay,
                  ease:     [0.22, 1, 0.36, 1],
                  opacity:  { ease: "easeInOut" },
                  y:        { ease: "easeInOut" },
                }}
              >
                {activeStage === 'server' ? <Bot style={{ width: m.px, height: m.px }} className="text-foreground" strokeWidth={m.stroke} /> : <Mail style={{ width: m.px, height: m.px }} className="text-foreground" strokeWidth={m.stroke} />}
              </motion.div>
            ))
          }
        </AnimatePresence>
        <div className="relative flex justify-between">
          {STAGES.map((stage, i) => {
            const active   = i === activeIdx;
            const visited  = i <  activeIdx;
            const blinking = i === blinkIdx;

            return (
              <button
                key={stage.id}
                ref={(el) => { nodeRefs.current[i] = el; }}
                onClick={() => handleNodeClick(i)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <motion.div
                  className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-colors duration-300 ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : visited
                      ? "border-foreground/35 bg-background text-foreground/55"
                      : "border-border bg-background text-muted-foreground group-hover:border-foreground/40"
                  }`}
                  animate={blinking ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                >
                  <AnimatePresence>
                    {blinking && (
                      <motion.span
                        className="absolute inset-0 rounded-full border-2 border-foreground/50"
                        initial={{ scale: 1, opacity: 0.9 }}
                        animate={{ scale: 2.8, opacity: 0 }}
                        exit={{}}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>
                  {active && !blinking && (
                    <motion.span
                      className="absolute inset-0 rounded-full border border-foreground/20"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.7, opacity: 0 }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  )}
                  <span className="font-mono text-[8px] font-bold leading-none">
                    {stage.mono}
                  </span>
                </motion.div>
                <span
                  className={`font-mono text-[9px] uppercase tracking-wider text-center leading-tight max-w-[56px] transition-colors duration-300 ${
                    active ? "text-foreground" : "text-muted-foreground/50"
                  }`}
                >
                  {stage.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-background/80 overflow-hidden">
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
              {STAGES.find((s) => s.id === activeStage)?.label}
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
                  {line || " "}
                </motion.p>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 mt-3">
        {!autoPlay && (
          <button
            onClick={() => {
              setActiveIdx(0);
              setAutoPlay(true);
              setShowConvoy(false);
              const x = measureNode(0);
              if (x !== null) { setFromX(x); setToX(x); }
            }}
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
