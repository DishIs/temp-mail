"use client";

import { setCookie } from "cookies-next";
import { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";

interface StatsEvent {
  type: "stats";
  queued: number;
  denied: number;
}

export default function Status() {
  const [status, setStatus] = useState({ queued: 0, denied: 0 });
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const fetchToken = async () => {
    try {
      const r = await fetch("/api/auth", { method: "POST" });
      const d = await r.json() as { token?: string };
      if (d.token) { setCookie("authToken", d.token, { maxAge: 3600 }); return d.token; }
    } catch { }
    return null;
  };

  const fetchStats = async () => {
    try {
      const token = await fetchToken()
      const headers: Record<string, string> = { "x-fce-client": "web-client" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch('/api/stats', {
        headers
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json() as { data: { queued?: number; denied?: number }; success: boolean };
      if (data.success) {
        setStatus(prev => ({
          queued: data.data.queued ?? prev.queued,
          denied: data.data.denied ?? prev.denied,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const connectWebSocket = async () => {
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }

    // Fetch a short-lived ticket scoped to the "stats" mailbox
    let wsToken = '';
    try {
      const res = await fetch('/api/ws-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailbox: 'stats' }),
      });
      const data = await res.json();
      wsToken = data.token ?? '';
    } catch {
      // proceed without token — backend will reject if invalid
    }

    const ws = new WebSocket(
      `wss://api2.freecustom.email/?mailbox=stats&token=${encodeURIComponent(wsToken)}`
    );
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
        }
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    ws.onerror = () => { };

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
      const ws = wsRef.current;
      if (ws) { ws.onclose = null; ws.close(1000, "unmount"); }
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-destructive/10 px-4 py-3 text-destructive text-sm" role="alert">
        <strong className="font-medium">Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
        Live stats
      </p>
      <h2 className="text-base font-semibold tracking-tight text-foreground mb-2">
        Emails passing through our service
      </h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-xl">
        Real-time flow of temporary emails. Queued: delivered. Denied: blocked by filters.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Queued</p>
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-foreground">
            <CountUp start={status.queued > 100 ? status.queued - 100 : 0} end={status.queued} duration={2.75} separator="," />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Denied</p>
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-foreground">
            <CountUp start={status.denied > 100 ? status.denied - 100 : 0} end={status.denied} duration={2.75} separator="," />
          </div>
        </div>
      </div>
    </div>
  );
}