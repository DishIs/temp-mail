"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, AlertCircle, Clock, Search, Copy, Play, RefreshCw, Zap, Code2, BookOpen, ChevronRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { EmailEvent } from "@/types/events";
import { TIMELINE_PLANS } from "@/lib/api-plans-client";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Insight {
  type: "email_missing" | "multiple_detected" | "otp_failed" | "slow_delivery";
  message: string;
}

interface GroupedTestRun {
  id: string;
  inbox: string;
  created_at: number;
  events: EmailEvent[];
  status: "pending" | "success" | "failed";
}

export function EventsTab({ planName, apiInboxes = [] }: { planName: string, apiInboxes: string[] }) {
  const [search, setSearch] = useState("");
  const [selectedInbox, setSelectedInbox] = useState<string | null>(null);
  const [switchingInbox, setSwitchingInbox] = useState(false);

  const [rawTimeline, setRawTimeline] = useState<EmailEvent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [testRuns, setTestRuns] = useState<GroupedTestRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const hasTimelineAccess = TIMELINE_PLANS.includes(planName?.toLowerCase() || "");
  const isAdvanced = ["growth", "scale", "enterprise"].includes(planName?.toLowerCase() || "");

  const filteredInboxes = apiInboxes.filter(inbox => inbox.toLowerCase().includes(search.toLowerCase()));

  // Derived graph data from ALL fetched runs
  const graphData = useMemo(() => {
    return testRuns.slice(0, 30).reverse().map(run => {
      const first = run.events[0]?.timestamp || 0;
      const last = run.events[run.events.length - 1]?.timestamp || 0;
      const duration = first && last ? Math.max(0, last - first) : 0;
      return { id: run.id, duration };
    });
  }, [testRuns]);

  if (!hasTimelineAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border border-border rounded-lg bg-muted/5 mt-8 px-6">
        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
          <Clock className="h-6 w-6 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">Auth Flow Debugger</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed mb-6">
          Visually trace email delivery, OTP extraction, and sub-millisecond latencies. Requires Startup plan or higher.
        </p>
        <div className="flex gap-4">
          <Button asChild><Link href="/api/pricing">Upgrade to Unlock</Link></Button>
          <Button variant="outline" asChild><Link href="/api/auth-flow-debugger">Learn More</Link></Button>
        </div>
      </div>
    );
  }

  // 1. Process Raw Timeline into Test Runs
  useEffect(() => {
    const runs = new Map<string, GroupedTestRun>();
    const sorted = [...rawTimeline].sort((a, b) => a.timestamp - b.timestamp);

    for (const event of sorted) {
      const runId = event.test_run_id || 'default_run';
      if (!runs.has(runId)) {
        runs.set(runId, { id: runId, inbox: event.inbox, created_at: event.timestamp, events: [], status: "pending" });
      }
      const run = runs.get(runId)!;
      run.events.push(event);

      if (event.type === "error" || (event.metadata && event.metadata.error)) {
        run.status = "failed";
      } else if (event.type === "otp_extracted" && run.status !== "failed") {
        run.status = "success";
      }
    }

    const runsArray = Array.from(runs.values()).sort((a, b) => b.created_at - a.created_at);
    setTestRuns(runsArray);

    if (runsArray.length > 0 && (!selectedRunId || !runsArray.find(r => r.id === selectedRunId))) {
      setSelectedRunId(runsArray[0].id);
    } else if (runsArray.length === 0) {
      setSelectedRunId(null);
    }
  }, [rawTimeline, selectedRunId]);

  // 2. Fetch Initial Data
  const fetchData = useCallback(async () => {
    if (!selectedInbox) return;
    setLoading(true);
    setError(null);
    setTestRuns([]);        // 🔥 important
    setSelectedRunId(null);
    try {
      const [timelineRes, insightsRes] = await Promise.all([
        fetch(`/api/user/timeline?inbox=${encodeURIComponent(selectedInbox)}`).then(r => r.json()),
        fetch(`/api/user/insights?inbox=${encodeURIComponent(selectedInbox)}`).then(r => r.json())
      ]);
      if (timelineRes.success) setRawTimeline(timelineRes.data || timelineRes.timeline || []);
      else setError(timelineRes.message || "Failed to load timeline");
      if (insightsRes.success) setInsights(insightsRes.data || insightsRes.insights || []);
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
      setSwitchingInbox(false);
    }
  }, [selectedInbox]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 3. WebSocket Subscription for Live Updates
  useEffect(() => {
    if (!selectedInbox || !isAdvanced) return;
    let ws: WebSocket;
    let keepAlive: ReturnType<typeof setInterval>;

    const connectWs = async () => {
      try {
        const tRes = await fetch("/api/ws-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mailbox: selectedInbox })
        });
        if (!tRes.ok) return;
        const { token } = await tRes.json();
        if (!token) return;

        const url = `wss://api2.freecustom.email/?mailbox=${encodeURIComponent(selectedInbox)}&token=${encodeURIComponent(token)}`;
        ws = new WebSocket(url);

        ws.onopen = () => {
          keepAlive = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send("ping"); }, 30000);
        };

        ws.onmessage = (msg) => {
          if (msg.data === "pong") return;
          try {
            const parsed = JSON.parse(msg.data);
            if (parsed.type === "event_update" && parsed.payload) {
              setRawTimeline(prev => {
                const exists = prev.find(e => e.id === parsed.payload.id);
                if (exists) return prev;
                return [...prev, parsed.payload].sort((a, b) => a.timestamp - b.timestamp);
              });
            } else if (parsed.type === "new_mail") {
              setTimeout(() => fetchData(), 500);
            }
          } catch (e) { }
        };
      } catch (e) { }
    };

    connectWs();
    return () => {
      if (ws) ws.close();
      if (keepAlive) clearInterval(keepAlive);
    };
  }, [selectedInbox, isAdvanced, fetchData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const selectedRun = testRuns.find(r => r.id === selectedRunId);
  const currentTimeline = selectedRun?.events || [];
  const otpEvents = currentTimeline.filter(e => e.type === "otp_extracted");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            Auth Flow Debugger
            {isAdvanced && (
              <span className="flex items-center gap-1 text-[10px] text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono tracking-wider">
                <Zap className="h-3 w-3" fill="currentColor" /> LIVE
              </span>
            )}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">Monitor test runs, OTP extraction, and execution latency.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-7 text-[10px] uppercase tracking-widest gap-1.5 bg-background shadow-sm">
            <Link href="/api/docs/sdk/npm"><Code2 className="h-3 w-3" /> SDK</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-7 text-[10px] uppercase tracking-widest gap-1.5 bg-background shadow-sm">
            <Link href="/api/docs"><BookOpen className="h-3 w-3" /> Docs</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-t border-border pt-6 items-stretch">
        {/* Left Col - Inboxes */}
        <div className="lg:col-span-3 space-y-3 h-full flex flex-col">
          <div className="relative shadow-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search testing inboxes..."
              className="pl-8 h-8 text-[11px] font-mono bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="border border-border bg-background rounded-lg flex flex-col h-[500px] flex-1 overflow-y-auto custom-scrollbar shadow-sm">
            {filteredInboxes.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground mt-10 leading-relaxed">
                No testing inboxes found.<br /><br />Register an inbox with <code className="bg-muted px-1 py-0.5 rounded">isTesting=true</code> to see it here.
              </div>
            ) : (
              filteredInboxes.map(inbox => (
                <button
                  key={inbox}
                  className={`px-3 py-2.5 border-b border-border text-left hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 ${selectedInbox === inbox ? 'bg-muted/60' : ''}`}
                  onClick={() => {
                    setSwitchingInbox(true);
                    setSelectedInbox(inbox);
                    setTestRuns([]);
                    setSelectedRunId(null);
                    setRawTimeline([]);
                  }}
                >
                  <span className="text-[11px] font-mono font-medium truncate">{inbox}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Col - Details Panel */}
        <div className="lg:col-span-9 border border-border bg-muted/5 rounded-lg flex flex-col shadow-sm overflow-hidden min-w-0">
          {!selectedInbox ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
              <Activity className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-[10px] uppercase tracking-widest font-medium">Select an inbox to view traces</p>
            </div>
          ) : (loading || switchingInbox) && testRuns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
              <Loader2 className="h-6 w-6 animate-spin opacity-50" />
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-foreground p-6">
              <AlertCircle className="h-6 w-6 mb-3 opacity-50" />
              <p className="text-[11px]">{error}</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header & Test Run Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border p-3 gap-4 bg-background z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Test Run</span>
                    {testRuns.length > 0 ? (
                      <select
                        className="text-[10px] font-mono bg-muted/30 border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                        value={selectedRunId || ""}
                        onChange={e => setSelectedRunId(e.target.value)}
                      >
                        {testRuns.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.id} ({new Date(r.created_at).toLocaleTimeString()})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 border border-border rounded px-2 py-1">None</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={fetchData} title="Refresh">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-6 text-[9px] uppercase tracking-widest gap-1.5" onClick={() => copyToClipboard(`await fce.otp.waitFor('${selectedInbox}')`)}>
                    <Copy className="h-3 w-3" /> Copy Wait code
                  </Button>
                </div>
              </div>

              {testRuns.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 text-center">
                  <Clock className="h-6 w-6 mb-3 opacity-20" />
                  <p className="text-[11px]">Waiting for the first event...</p>
                </div>
              ) : (
                <Tabs defaultValue="flow" className="flex-1 flex flex-col min-w-0 min-h-0 w-full h-full">
                  <div className="px-3 pt-2 border-b border-border bg-background shrink-0">
                    <TabsList className="h-7 bg-muted/50 w-auto inline-flex rounded-none border-b-0 p-0 overflow-hidden">
                      <TabsTrigger value="flow" className="text-[9px] h-7 px-3 rounded-none uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:border-t data-[state=active]:border-x data-[state=active]:border-border data-[state=active]:shadow-none">Visual Flow</TabsTrigger>
                      <TabsTrigger value="advanced" className="text-[9px] h-7 px-3 rounded-none uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:border-t data-[state=active]:border-x data-[state=active]:border-border data-[state=active]:shadow-none">Detailed Logs</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* FLOW TAB */}
                  <TabsContent value="flow" className="flex-1 p-0 m-0 overflow-y-auto focus-visible:outline-none min-w-0 min-h-0 w-full h-full data-[state=active]:block custom-scrollbar">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-4 w-full h-fit pb-8">
                      {/* Timeline UI */}
                      <div className="relative">
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border z-0" />
                        <div className="space-y-4 relative z-10">
                          {currentTimeline.map((event, i) => {
                            const isError = event.type === 'error';
                            const latency = i > 0 ? event.timestamp - currentTimeline[i - 1].timestamp : 0;

                            return (
                              <div key={event.id || i} className="relative pl-7 group">
                                <div className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-md border flex items-center justify-center bg-background text-[9px] font-bold ${isError ? 'border-foreground text-foreground' : 'border-border text-foreground'}`}>
                                  {isError ? '!' : String(i + 1)}
                                </div>
                                <div className="bg-background border border-border rounded-lg p-2.5 shadow-sm group-hover:border-foreground/20 transition-colors">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-[11px] font-semibold capitalize text-foreground">{event.type.replace(/_/g, ' ')}</p>
                                    {latency > 0 && (
                                      <span className="text-[9px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                        +{latency}ms
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-mono text-muted-foreground break-all space-y-0.5">
                                    {event.metadata?.subject && <p className="truncate"><span className="text-foreground/40 mr-1">Subject:</span> {event.metadata.subject}</p>}
                                    {event.metadata?.from && <p className="truncate"><span className="text-foreground/40 mr-1">From:</span> {event.metadata.from}</p>}
                                    {event.metadata?.error && <p className="text-foreground mt-1 bg-muted/50 p-1 rounded">{event.metadata.error}</p>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Side - OTP & Insights */}
                      <div className="space-y-4">
                        {otpEvents.length > 0 ? (
                          otpEvents.map((otpEvent, i) => (
                            <div key={i} className="bg-background border border-border rounded-lg p-3 shadow-sm">
                              <h4 className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 border-b border-border pb-1.5">Extracted Payload</h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">OTP Code</p>
                                  <div className="flex items-center justify-between bg-muted/30 p-2 rounded border border-border">
                                    <span className="font-mono text-base font-bold tracking-widest">{otpEvent.metadata?.otp || "N/A"}</span>
                                    <div className="flex items-center gap-1.5">
                                      {otpEvent.metadata?.score !== undefined && (
                                        <span className="text-[9px] font-medium bg-foreground text-background px-1.5 py-0.5 rounded">
                                          {(otpEvent.metadata.score * 100).toFixed(0)}% Conf
                                        </span>
                                      )}
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(otpEvent.metadata?.otp || '')}>
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                {otpEvent.metadata?.raw_snippet && (
                                  <div>
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Source Snippet</p>
                                    <div className="bg-muted/30 p-1.5 rounded border border-border max-h-24 overflow-y-auto">
                                      <code className="text-[9px] font-mono text-muted-foreground">{otpEvent.metadata.raw_snippet}</code>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-background border border-border border-dashed rounded-lg p-5 text-center shadow-sm">
                            <p className="text-[10px] text-muted-foreground">No OTP extraction events in this run.</p>
                          </div>
                        )}

                        {insights.length > 0 && (
                          <div className="bg-background border border-foreground/20 rounded-lg p-3 shadow-sm">
                            <h4 className="text-[9px] font-semibold uppercase tracking-widest text-foreground mb-2.5 border-b border-border pb-1.5 flex items-center gap-1.5">
                              <AlertCircle className="h-3 w-3" /> Diagnostics
                            </h4>
                            <ul className="space-y-1.5">
                              {insights.map((insight, idx) => (
                                <li key={idx} className="text-[10px] text-muted-foreground bg-muted/50 p-1.5 rounded border border-border">
                                  {insight.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* ADVANCED TAB */}
                  <TabsContent value="advanced" className="flex-1 p-0 m-0 min-w-0 min-h-0 w-full h-full data-[state=active]:flex data-[state=active]:flex-col focus-visible:outline-none">
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0A0A] p-4 text-gray-300 font-mono text-[10px] leading-relaxed select-all">
                      {currentTimeline.map((event, i) => (
                        <div key={event.id || i} className="mb-2 pb-2 border-b border-gray-800/50 last:border-0 hover:bg-white/5 p-1 -mx-1 px-1 rounded transition-colors">
                          <div className="flex items-center gap-2 opacity-50 mb-1">
                            <span>[{new Date(event.timestamp).toISOString()}]</span>
                            <span className="text-blue-400">event={event.type}</span>
                            <span>id={event.id.slice(0, 8)}</span>
                          </div>
                          <div className="pl-3 border-l border-gray-800/50 ml-1">
                            {event.metadata ? (
                              <pre className="whitespace-pre-wrap font-inherit text-[9px] leading-normal opacity-80">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            ) : (
                              <span className="opacity-40 text-[9px]">{"{ no_metadata: true }"}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Latency Graph Panel */}
      {graphData.length > 0 && (
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-foreground">Recent Test Runs Latency</h3>
            <p className="text-[9px] font-mono text-muted-foreground">Last {graphData.length} runs across all testing inboxes</p>
          </div>
          <div className="h-32 bg-background border border-border rounded-lg p-3 flex items-end justify-start gap-1 sm:gap-1.5 overflow-x-auto relative shadow-sm">
            {graphData.map((d, i) => {
              const maxDur = Math.max(...graphData.map(g => g.duration), 100);
              const heightPct = Math.max(2, (d.duration / maxDur) * 100);
              return (
                <div key={d.id + i} className="flex flex-col items-center justify-end h-full group flex-shrink-0 min-w-[12px] w-[12px] relative cursor-crosshair">
                  <div className="w-full bg-muted-foreground/20 group-hover:bg-foreground/60 transition-colors rounded-t-[2px]" style={{ height: `${heightPct}%` }} />
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-[9px] font-mono pointer-events-none transition-opacity z-20 shadow-md whitespace-nowrap">
                    Run: {d.id.slice(0, 8)}<br />
                    {d.duration}ms
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
