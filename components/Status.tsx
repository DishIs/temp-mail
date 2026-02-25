"use client";

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

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
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
      const ws = wsRef.current;
      if (ws) { ws.onclose = null; ws.close(1000, "unmount"); }
    };
  }, []);

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative m-5" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black p-6 mt-5 rounded-xl border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 tracking-wide">Emails Passing Through Our Service</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
        Track the real-time flow of temporary emails processed by our servers. 'Queued' shows successfully delivered emails, while 'Denied' reflects messages blocked by our filters.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 dark:border-gray-700 p-5 rounded-xl">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Queued</p>
          <div className="text-4xl font-extrabold text-gray-800 dark:text-gray-200">
            <CountUp start={status.queued > 100 ? status.queued - 100 : 0} end={status.queued} duration={2.75} separator="," />
          </div>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 p-5 rounded-xl">
          <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Denied</p>
          <div className="text-4xl font-extrabold text-gray-800 dark:text-gray-200">
            <CountUp start={status.denied > 100 ? status.denied - 100 : 0} end={status.denied} duration={2.75} separator="," />
          </div>
        </div>
      </div>
    </div>
  );
}