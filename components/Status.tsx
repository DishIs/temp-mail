"use client";

import { setCookie } from "cookies-next";
import { useEffect, useRef, useState } from "react";

interface StatsEvent {
  type: "stats";
  queued: number;
  denied: number;
}

// ── Digit Roller ───────────────────────────────────────────────────────────
// Each digit column slides vertically — new digit slides in from below,
// old digit exits upward. Direction inverts when number decreases.

function DigitRoller({
  digit,
  prevDigit,
  delay = 0,
}: {
  digit: string;
  prevDigit: string;
  delay?: number;
}) {
  const [displayed, setDisplayed] = useState(digit);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    if (digit === prevDigit || digit === displayed) return;

    // non-numeric chars (comma, space) snap instantly
    if (isNaN(Number(digit)) || isNaN(Number(prevDigit))) {
      setDisplayed(digit);
      return;
    }

    const dir = Number(digit) > Number(prevDigit) ? "up" : "down";
    setDirection(dir);
    setAnimating(true);

    const t = setTimeout(() => {
      setDisplayed(digit);
      setAnimating(false);
    }, 320 + delay);

    return () => clearTimeout(t);
  }, [digit]);

  const enterFrom = direction === "up" ? "translateY(100%)" : "translateY(-100%)";
  const exitTo    = direction === "up" ? "translateY(-100%)" : "translateY(100%)";

  return (
    <span
      className="relative inline-block overflow-hidden"
      style={{ minWidth: digit === "," ? "0.35em" : "0.62em", lineHeight: 1 }}
    >
      {/* exiting digit */}
      {animating && (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
          style={{
            animation: `digitExit 0.32s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
            ["--exit-to" as string]: exitTo,
          }}
        >
          {displayed}
        </span>
      )}
      {/* entering digit */}
      <span
        className="flex items-center justify-center"
        style={
          animating
            ? {
                animation: `digitEnter 0.32s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
                ["--enter-from" as string]: enterFrom,
              }
            : undefined
        }
      >
        {animating ? digit : displayed}
      </span>
    </span>
  );
}

// ── Odometer ──────────────────────────────────────────────────────────────
function Odometer({ value }: { value: number }) {
  const prevRef = useRef(value);
  const formatted     = value.toLocaleString("en-US");
  const prevFormatted = prevRef.current.toLocaleString("en-US");

  // Pad both to same length so indices align
  const maxLen = Math.max(formatted.length, prevFormatted.length);
  const padded     = formatted.padStart(maxLen, " ");
  const prevPadded = prevFormatted.padStart(maxLen, " ");

  useEffect(() => {
    prevRef.current = value;
  }, [value]);

  // Stagger delay: rightmost digit = 0ms, each column to the left += 30ms
  return (
    <span className="inline-flex items-baseline tabular-nums select-none" aria-label={formatted}>
      {padded.split("").map((char, i) => (
        <DigitRoller
          key={i}
          digit={char.trim() === "" ? "\u00A0" : char}
          prevDigit={prevPadded[i]?.trim() === "" ? "\u00A0" : (prevPadded[i] ?? char)}
          delay={(padded.length - 1 - i) * 28}
        />
      ))}
    </span>
  );
}

// ── Pulse dot ─────────────────────────────────────────────────────────────
function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-40" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground opacity-70" />
    </span>
  );
}

// ── Spark bar (decorative activity bar) ───────────────────────────────────
function SparkBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div className="mt-3 h-px w-full bg-border overflow-hidden rounded-full">
      <div
        className="h-full bg-foreground/30 transition-all duration-700 ease-out rounded-full"
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Status() {
  const [status, setStatus]   = useState({ queued: 0, denied: 0 });
  const [error, setError]     = useState<string | null>(null);
  const [tick, setTick]       = useState(false);       // flashes on update
  const wsRef                 = useRef<WebSocket | null>(null);
  const reconnectTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef  = useRef(0);

  // flash the card border on each update
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerFlash = () => {
    setTick(true);
    if (flashRef.current) clearTimeout(flashRef.current);
    flashRef.current = setTimeout(() => setTick(false), 600);
  };

  const fetchToken = async () => {
    try {
      const r = await fetch("/api/auth", { method: "POST" });
      const d = await r.json() as { token?: string };
      if (d.token) { setCookie("authToken", d.token, { maxAge: 3600 }); return d.token; }
    } catch {}
    return null;
  };

  const fetchStats = async () => {
    try {
      const token = await fetchToken();
      const headers: Record<string, string> = { "x-fce-client": "web-client" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch("/api/stats", { headers });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json() as { data: { queued?: number; denied?: number }; success: boolean };
      if (data.success) {
        setStatus(prev => ({
          queued: data.data.queued ?? prev.queued,
          denied: data.data.denied ?? prev.denied,
        }));
        triggerFlash();
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const connectWebSocket = async () => {
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }

    let wsToken = "";
    try {
      const res  = await fetch("/api/ws-ticket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mailbox: "stats" }) });
      const data = await res.json();
      wsToken    = data.token ?? "";
    } catch {}

    const ws = new WebSocket(`wss://api2.freecustom.email/?mailbox=stats&token=${encodeURIComponent(wsToken)}`);
    wsRef.current = ws;

    ws.onopen = () => { reconnectAttemptsRef.current = 0; };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as StatsEvent;
        if (data.type === "stats") {
          setStatus(prev => ({
            queued: data.queued ?? prev.queued,
            denied: data.denied ?? prev.denied,
          }));
          triggerFlash();
        }
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    ws.onerror = () => {};

    ws.onclose = (ev) => {
      if (ev.code === 1000) return;
      const delay = Math.min(500 * Math.pow(2, reconnectAttemptsRef.current), 30_000);
      reconnectAttemptsRef.current++;
      reconnectTimerRef.current = setTimeout(() => connectWebSocket(), delay);
    };
  };

  useEffect(() => {
    fetchStats();
    connectWebSocket();
    return () => {
      if (reconnectTimerRef.current)  clearTimeout(reconnectTimerRef.current);
      if (flashRef.current)           clearTimeout(flashRef.current);
      const ws = wsRef.current;
      if (ws) { ws.onclose = null; ws.close(1000, "unmount"); }
    };
  }, []);

  const total = status.queued + status.denied;

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-destructive/10 px-4 py-3 text-destructive text-sm" role="alert">
        <strong className="font-medium">Error:</strong> {error}
      </div>
    );
  }

  return (
    <>
      {/* keyframe styles injected once */}
      <style>{`
        @keyframes digitEnter {
          from { transform: var(--enter-from); opacity: 0; }
          to   { transform: translateY(0);      opacity: 1; }
        }
        @keyframes digitExit {
          from { transform: translateY(0);   opacity: 1; }
          to   { transform: var(--exit-to);  opacity: 0; }
        }
        @keyframes borderFlash {
          0%, 100% { border-color: hsl(var(--border)); }
          40%       { border-color: hsl(var(--foreground) / 0.25); }
        }
      `}</style>

      <div
        className="mt-6 rounded-lg border border-border bg-card p-5 sm:p-6 transition-colors"
        style={tick ? { animation: "borderFlash 0.6s ease" } : undefined}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <LiveDot />
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Live stats
          </p>
        </div>
        <h2 className="text-base font-semibold tracking-tight text-foreground mb-1">
          Emails passing through our service
        </h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-xl">
          Real-time flow of temporary emails.{" "}
          <span className="text-foreground/60">Queued</span> = delivered ·{" "}
          <span className="text-foreground/60">Denied</span> = blocked by filters.
        </p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">

          {/* Queued */}
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-4 group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Queued
              </p>
              {/* micro up-arrow */}
              <svg className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 9V3M3 6l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-none overflow-hidden">
              <Odometer value={status.queued} />
            </div>
            <SparkBar value={status.queued} max={total} />
          </div>

          {/* Denied */}
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-4 group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Denied
              </p>
              {/* micro x */}
              <svg className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-none overflow-hidden">
              <Odometer value={status.denied} />
            </div>
            <SparkBar value={status.denied} max={total} />
          </div>

        </div>
      </div>
    </>
  );
}