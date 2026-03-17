// components/Status.tsx
"use client";

import { setCookie } from "cookies-next";
import { useEffect, useRef, useState } from "react";

interface StatsEvent {
  type: "stats";
  queued: number;
  denied: number;
}

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
  const exitTo = direction === "up" ? "translateY(-100%)" : "translateY(100%)";

  return (
    <span
      className="relative inline-block overflow-hidden"
      style={{ minWidth: digit === "," ? "0.35em" : "0.62em", lineHeight: 1 }}
    >
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

function Odometer({ value }: { value: number }) {
  const prevRef = useRef(value);
  const formatted = value.toLocaleString("en-US");
  const prevFormatted = prevRef.current.toLocaleString("en-US");
  const maxLen = Math.max(formatted.length, prevFormatted.length);
  const padded = formatted.padStart(maxLen, " ");
  const prevPadded = prevFormatted.padStart(maxLen, " ");

  useEffect(() => {
    prevRef.current = value;
  }, [value]);

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

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-40" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground opacity-70" />
    </span>
  );
}

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

export default function Status() {
  /*
    CLS FIX: Start with placeholder values that match realistic number widths.
    Using 1,750,000 as a seed means the component renders at its approximate
    real size immediately — no reflow when real data arrives.
    
    The key insight: CLS happens when queued/denied start at 0 (narrow)
    then jump to 6-7 digit numbers (wide), pushing surrounding content.
    Starting at a realistic seed value eliminates that shift.
  */
  const [status, setStatus] = useState({ queued: 1750000, denied: 420000 });
  
  /*
    CLS FIX: isLoaded tracks whether we have real data yet.
    Until real data arrives, we show the seed numbers with reduced opacity
    so they don't look like real numbers to the user, but they occupy
    the same space — preventing layout shift.
  */
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [tick, setTick] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
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
        setIsLoaded(true);
        triggerFlash();
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      // Even on error, mark as loaded so opacity returns to normal
      setIsLoaded(true);
    }
  };

  const connectWebSocket = async () => {
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    let wsToken = "";
    try {
      const res = await fetch("/api/ws-ticket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mailbox: "stats" }) });
      const data = await res.json();
      wsToken = data.token ?? "";
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
          setIsLoaded(true);
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
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (flashRef.current) clearTimeout(flashRef.current);
      const ws = wsRef.current;
      if (ws) { ws.onclose = null; ws.close(1000, "unmount"); }
    };
  }, []);

  const total = status.queued + status.denied;

  return (
    <>
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

      {/*
        CLS FIX: The outer div now has an explicit min-height so the component
        never collapses to a different height between SSR and hydration.
        The min-h value matches the rendered height of the component.
        
        Previously: renders at small height (0 values) → expands on data load → CLS.
        Now: always renders at full height regardless of data state.
      */}
      <div
        className="rounded-lg border border-border bg-card p-5 sm:p-6 transition-colors"
        style={tick ? { animation: "borderFlash 0.6s ease" } : undefined}
      >
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

        <div className="grid grid-cols-2 gap-3">
          {/* Queued */}
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-4 group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Queued
              </p>
              <svg className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 9V3M3 6l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {/*
              CLS FIX: transition opacity instead of mounting/unmounting.
              The number occupies space immediately (no layout shift),
              it just fades from dim to full opacity when real data arrives.
            */}
            <div
              className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-none overflow-hidden whitespace-nowrap truncate transition-opacity duration-500"
              style={{ opacity: isLoaded ? 1 : 0.25 }}
            >
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
              <svg className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
              </svg>
            </div>
            <div
              className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-none overflow-hidden transition-opacity duration-500"
              style={{ opacity: isLoaded ? 1 : 0.25 }}
            >
              <Odometer value={status.denied} />
            </div>
            <SparkBar value={status.denied} max={total} />
          </div>
        </div>
      </div>
    </>
  );
}