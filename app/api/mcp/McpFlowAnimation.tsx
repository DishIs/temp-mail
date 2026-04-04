"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Mail, Bot, Server, Key } from "lucide-react";

const STAGES = [
  {
    id: "smtp",
    label: "SMTP Ingest",
    icon: Mail,
    lines: [
      "RCPT TO:<test@ditapi.info>",
      "DATA",
      "Subject: Your OTP",
      "From: service@example.com",
      "250 2.0.0 Ok: queued",
    ],
  },
  {
    id: "server",
    label: "FCE Servers",
    icon: Server,
    lines: [
      "✓  Message received & stored",
      "✓  OTP detected: 847291",
      "✓  Verification link extracted",
      "▶  Notifying subscribers…",
    ],
    badge: "Redis pub/sub",
  },
  {
    id: "agent",
    label: "AI Agent",
    icon: Bot,
    lines: [
      "create_and_wait_for_otp()",
      "// Connection held open…",
      "// Email received!",
      "// Returning result…",
    ],
    badge: "MCP",
  },
  {
    id: "otp",
    label: "OTP Returned",
    icon: Key,
    lines: [
      '"success": true,',
      '"otp": "847291",',
      '"inbox": "test@ditapi.info",',
      '"verification_link": "…"',
    ],
    badge: "✓ verified",
  },
] as const;

type StageId = (typeof STAGES)[number]["id"];

const NODE_R   = 18;   // radius
const NODE_D   = NODE_R * 2;  // diameter = 36
const DWELL_MS = 2600;

export function McpFlowAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef     = useRef<HTMLDivElement>(null);
  const nodeEls      = useRef<(HTMLDivElement | null)[]>([]);
  const inView       = useInView(containerRef, { once: true, margin: "-80px" });

  const [activeIdx,  setActiveIdx]  = useState(0);
  const [nodeXs,     setNodeXs]     = useState<number[]>([]);
  const [packet,     setPacket]     = useState<{ from: number; to: number; key: number } | null>(null);
  const [travelling, setTravelling] = useState(false);
  const [autoPlay,   setAutoPlay]   = useState(true);
  const [blinkIdx,   setBlinkIdx]   = useState<number | null>(null);

  // measure node center-x values relative to track container left edge
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const tr = track.getBoundingClientRect();
    const xs = nodeEls.current.map((el) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return r.left - tr.left + r.width / 2;
    });
    setNodeXs(xs);
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => { if (inView) measure(); }, [inView, measure]);

  const launch = useCallback((fromIdx: number, toIdx: number) => {
    if (nodeXs.length < STAGES.length) return;
    setPacket({ from: nodeXs[fromIdx], to: nodeXs[toIdx], key: Date.now() });
    setTravelling(true);
    setTimeout(() => {
      setPacket(null);
      setTravelling(false);
      setActiveIdx(toIdx);
      setBlinkIdx(toIdx);
      setTimeout(() => setBlinkIdx(null), 650);
    }, 550);
  }, [nodeXs]);

  // auto-cycle
  useEffect(() => {
    if (!inView || !autoPlay || travelling) return;
    const t = setTimeout(() => {
      const next = (activeIdx + 1) % STAGES.length;
      if (next === 0) { setActiveIdx(0); return; }
      launch(activeIdx, next);
    }, DWELL_MS);
    return () => clearTimeout(t);
  }, [activeIdx, inView, autoPlay, travelling, launch]);

  const handleClick = (idx: number) => {
    if (travelling || idx === activeIdx) return;
    setAutoPlay(false);
    launch(activeIdx, idx);
  };

  const activeStage = STAGES[activeIdx];
  const cx          = nodeXs[activeIdx] ?? null; // active node center for connector

  // SVG track height = NODE_D
  const SVG_H = NODE_D;
  const cy    = NODE_R; // vertical center

  return (
    <div ref={containerRef} className="w-full select-none font-mono">

      {/* ── Track: SVG + nodes overlaid ── */}
      <div ref={trackRef} className="relative" style={{ height: SVG_H + 24 }}>

        {/* SVG: dashed lines between nodes + packet rail */}
        {nodeXs.length === STAGES.length && (
          <svg
            className="absolute inset-x-0 top-0 pointer-events-none overflow-visible"
            width="100%"
            height={SVG_H}
          >
            {STAGES.slice(0, -1).map((_, i) => {
              // line goes from right edge of node i to left edge of node i+1
              const x1 = nodeXs[i]     + NODE_R + 4;
              const x2 = nodeXs[i + 1] - NODE_R - 4;
              const visited = i < activeIdx;

              return (
                <g key={i}>
                  {/* dashed base */}
                  <line
                    x1={x1} y1={cy} x2={x2} y2={cy}
                    stroke="#374151"
                    strokeWidth={1}
                    strokeDasharray="4 5"
                    strokeLinecap="round"
                  />
                  {/* visited fill — animated width */}
                  {visited && (
                    <motion.line
                      x1={x1} y1={cy} x2={x1} y2={cy}
                      stroke="#111827"
                      strokeWidth={1}
                      strokeDasharray="4 5"
                      strokeLinecap="round"
                      animate={{ x2 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Travelling packet */}
        <AnimatePresence>
          {packet && (
            <motion.div
              key={packet.key}
              className="absolute z-20 pointer-events-none"
              style={{ top: cy - 8, width: 16, height: 16, marginLeft: -8 }}
              initial={{ left: packet.from, opacity: 0, scale: 0.6 }}
              animate={{
                left: packet.to,
                opacity: [0, 1, 1, 0],
                scale:   [0.6, 1, 1, 0.6],
              }}
              exit={{}}
              transition={{
                duration: 0.52,
                ease: [0.4, 0, 0.2, 1],
                opacity: { times: [0, 0.1, 0.85, 1] },
                scale:   { times: [0, 0.1, 0.85, 1] },
              }}
            >
              {/* ripple */}
              <motion.span
                className="absolute inset-0 rounded-full border border-gray-600/30"
                animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                transition={{ duration: 0.55, repeat: Infinity }}
              />
              <div className="w-full h-full rounded-full border border-gray-700/40 bg-white flex items-center justify-center">
                <Mail className="h-2.5 w-2.5 text-gray-800" strokeWidth={1.5} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nodes */}
        <div className="absolute inset-x-0 top-0 flex justify-between">
          {STAGES.map((stage, i) => {
            const active  = i === activeIdx;
            const visited = i < activeIdx;
            const blink   = i === blinkIdx;
            const Icon    = stage.icon;

            return (
              <div key={stage.id} className="flex flex-col items-center gap-2">
                <div
                  ref={(el) => { nodeEls.current[i] = el; }}
                  onClick={() => handleClick(i)}
                  style={{ width: NODE_D, height: NODE_D }}
                  className={[
                    "relative rounded-full flex items-center justify-center cursor-pointer",
                    "transition-all duration-300",
                    // active: subtle ring + slightly elevated bg
                    active  ? "border border-gray-600/30 bg-white text-gray-900 shadow-sm" : "",
                    // visited: faint
                    visited && !active ? "border border-gray-400/30 bg-white/70 text-gray-600" : "",
                    // future: ghost
                    !active && !visited ? "border border-gray-400/40 bg-white/40 text-gray-500 hover:text-gray-700 hover:border-gray-500/40" : "",
                  ].join(" ")}
                >
{/* arrival burst ring */}
                  <AnimatePresence>
                    {blink && (
                      <motion.span
                        key="burst"
                        className="absolute inset-0 rounded-full border border-gray-600/30"
                        initial={{ scale: 1, opacity: 0.7 }}
                        animate={{ scale: 2.6, opacity: 0 }}
                        exit={{}}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>

                  {/* soft breathing pulse on active */}
                  {active && !blink && (
                    <motion.span
                      className="absolute inset-0 rounded-full border border-gray-400/20"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}

                  <Icon
                    style={{ width: 14, height: 14 }}
                    strokeWidth={active ? 1.75 : 1.25}
                  />
                </div>

                {/* label */}
                <span
                  className={[
                    "text-[9px] uppercase tracking-wider text-center leading-tight w-16 transition-colors duration-300",
                    active  ? "text-gray-900"          : "",
                    visited && !active ? "text-gray-500" : "",
                    !active && !visited ? "text-gray-400" : "",
                  ].join(" ")}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Dashed vertical connector from active node to panel ── */}
      <div className="relative" style={{ height: 14 }}>
        <AnimatePresence mode="wait">
          {cx !== null && (
            <motion.svg
              key={activeIdx}
              className="absolute top-0 pointer-events-none overflow-visible"
              style={{ left: cx - 0.5 }}
              width={1}
              height={14}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <line
                x1="0.5" y1="0" x2="0.5" y2="14"
                stroke="#374151"
                strokeWidth={1}
                strokeDasharray="3 2"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>

      {/* ── Detail panel ── */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        {/* titlebar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-300 bg-gray-100">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full border border-gray-400" />
            <span className="h-2 w-2 rounded-full border border-gray-400" />
            <span className="h-2 w-2 rounded-full border border-gray-400" />
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={activeStage.id + "-lbl"}
              className="text-[10px] uppercase tracking-widest text-gray-600"
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.16 }}
            >
              {activeStage.label}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {"badge" in activeStage && (activeStage as any).badge && (
              <motion.span
                key={activeStage.id + "-bdg"}
                className="ml-auto text-[10px] border border-gray-400 rounded px-1.5 py-px text-gray-600"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
              >
                {(activeStage as any).badge}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* code lines */}
        <div className="px-4 py-4 min-h-[100px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="space-y-1.5"
            >
              {activeStage.lines.map((line, i) => (
                <motion.p
                  key={i}
                  className="text-xs text-gray-600 leading-relaxed"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: i * 0.055 }}
                >
                  {line}
                </motion.p>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          {STAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={[
                "rounded-full transition-all duration-300",
                i === activeIdx
                  ? "w-4 h-1 bg-gray-600/40"
                  : "w-1 h-1 bg-gray-400 hover:bg-gray-500",
              ].join(" ")}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          {!autoPlay && (
            <button
              onClick={() => { setActiveIdx(0); setAutoPlay(true); setPacket(null); }}
              className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              ↺ replay
            </button>
          )}
          <span className="text-[10px] text-muted-foreground/25 uppercase tracking-widest">
            {autoPlay ? "auto" : "manual"} · click to inspect
          </span>
        </div>
      </div>
    </div>
  );
}