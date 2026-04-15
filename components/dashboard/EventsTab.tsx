"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, Clock, CheckCircle2, XCircle, Search, Copy, Play, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { TestRun, EmailEvent } from "@/types/events";
import { TIMELINE_PLANS } from "@/lib/api-plans-client";
import Link from "next/link";

interface Insight {
  type: "email_missing" | "multiple_detected" | "otp_failed" | "slow_delivery";
  message: string;
}

// Grouped run structure
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
  
  const [rawTimeline, setRawTimeline] = useState<EmailEvent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group events by test_run_id (or default if missing)
  const [testRuns, setTestRuns] = useState<GroupedTestRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  
  const hasTimelineAccess = TIMELINE_PLANS.includes(planName?.toLowerCase() || "");
  const isAdvanced = ["growth", "scale", "enterprise"].includes(planName?.toLowerCase() || "");

  const filteredInboxes = apiInboxes.filter(inbox => inbox.toLowerCase().includes(search.toLowerCase()));

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

    // Sort to ensure chronological processing
    const sorted = [...rawTimeline].sort((a, b) => a.timestamp - b.timestamp);

    for (const event of sorted) {
      const runId = event.test_run_id || 'default_run';
      if (!runs.has(runId)) {
        runs.set(runId, {
          id: runId,
          inbox: event.inbox,
          created_at: event.timestamp,
          events: [],
          status: "pending"
        });
      }
      
      const run = runs.get(runId)!;
      run.events.push(event);

      // Simple status derivation
      if (event.type === "error" || (event.metadata && event.metadata.error)) {
        run.status = "failed";
      } else if (event.type === "otp_extracted" && run.status !== "failed") {
        run.status = "success";
      }
    }

    const runsArray = Array.from(runs.values()).sort((a, b) => b.created_at - a.created_at);
    setTestRuns(runsArray);

    if (runsArray.length > 0 && !selectedRunId) {
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
    
    try {
      const [timelineRes, insightsRes] = await Promise.all([
        fetch(`/api/user/timeline?inbox=${encodeURIComponent(selectedInbox)}`).then(r => r.json()),
        fetch(`/api/user/insights?inbox=${encodeURIComponent(selectedInbox)}`).then(r => r.json())
      ]);

      if (timelineRes.success) {
        setRawTimeline(timelineRes.data || timelineRes.timeline || []);
      } else {
        setError(timelineRes.message || "Failed to load timeline");
      }
      
      if (insightsRes.success) {
        setInsights(insightsRes.data || insightsRes.insights || []);
      }
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [selectedInbox]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 3. WebSocket Subscription for Live Updates
  useEffect(() => {
    if (!selectedInbox || !isAdvanced) return;
    
    let ws: WebSocket;
    let keepAlive: ReturnType<typeof setInterval>;

    const connectWs = async () => {
      try {
        const tRes = await fetch("/api/ws-ticket", { method: "POST" });
        if (!tRes.ok) return;
        const { ticket } = await tRes.json();
        if (!ticket) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/v1/ws?ticket=${ticket}`);
        
        ws.onopen = () => {
          ws.send(JSON.stringify({ action: "subscribe", inboxes: [selectedInbox] }));
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
                 return [...prev, parsed.payload].sort((a,b) => a.timestamp - b.timestamp);
               });
            } else if (parsed.type === "new_mail") {
               // Fallback re-fetch if traditional new_mail emitted instead of specific event_update
               setTimeout(() => fetchData(), 500);
            }
          } catch (e) {}
        };
      } catch (e) {}
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
  const otpEvent = currentTimeline.find(e => e.type === "otp_extracted");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Auth Flow Debugger
            {isAdvanced && <span className="flex items-center gap-1 text-[10px] text-blue-500"><Zap className="h-3 w-3" fill="currentColor"/> Live</span>}
          </h2>
          <p className="text-sm text-muted-foreground">Monitor email flow, OTP extraction, and event delivery in real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border pt-6">
        {/* Left Col - Inboxes */}
        <div className="col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search inboxes..." 
              className="pl-9 h-9" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="border border-border rounded-lg overflow-hidden flex flex-col h-[650px] overflow-y-auto">
            {filteredInboxes.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground mt-10">
                No testing inboxes found. Register an inbox with `isTesting=true` to see them here.
              </div>
            ) : (
              filteredInboxes.map(inbox => (
                <button 
                  key={inbox}
                  className={`p-4 border-b border-border text-left hover:bg-muted/50 transition-colors flex items-center justify-between gap-3 ${selectedInbox === inbox ? 'bg-muted/20' : ''}`}
                  onClick={() => setSelectedInbox(inbox)}
                >
                  <p className="text-sm font-mono font-medium truncate">{inbox}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Col - Details Panel */}
        <div className="col-span-1 md:col-span-2 border border-border rounded-lg p-6 min-h-[650px] flex flex-col">
          {!selectedInbox ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Clock className="h-8 w-8 mb-4 opacity-50" />
              <p>Select an inbox to view its test runs and debug details.</p>
            </div>
          ) : loading && testRuns.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4 opacity-50" />
             </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-red-500">
               <AlertCircle className="h-8 w-8 mb-4 opacity-50" />
               <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Header & Test Run Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 gap-4">
                <div>
                  <h3 className="font-mono font-medium text-lg">{selectedInbox}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Test Run:</span>
                    {testRuns.length > 0 ? (
                      <select 
                        className="text-xs font-mono bg-muted/30 border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
                        value={selectedRunId || ""}
                        onChange={e => setSelectedRunId(e.target.value)}
                      >
                        {testRuns.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.id} • {new Date(r.created_at).toLocaleTimeString()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">None</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={fetchData} title="Refresh">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" className="gap-1.5">
                    <Play className="h-3.5 w-3.5" /> Run Test Again
                  </Button>
                </div>
              </div>

              {/* Developer UX Snippets */}
              <div className="bg-muted/30 p-3 rounded-md flex justify-between items-center text-xs font-mono border border-border">
                <span className="text-muted-foreground truncate mr-2">await fce.waitForOTP('{selectedInbox}')</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(`await fce.waitForOTP('${selectedInbox}')`)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>

              {testRuns.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-10">
                  <p className="text-sm">No events recorded for this inbox yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1">
                  {/* Timeline UI */}
                  <div>
                    <h4 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">Event Flow</h4>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                      {currentTimeline.map((event, i) => {
                        let latencyFromPrev = 0;
                        if (i > 0) {
                          latencyFromPrev = event.timestamp - currentTimeline[i-1].timestamp;
                        }

                        return (
                          <div key={event.id || i} className="relative flex flex-col group">
                            {/* Latency Arrow Label */}
                            {i > 0 && (
                              <div className="flex justify-center text-[10px] text-muted-foreground -my-2 z-10 relative bg-background px-1 w-max mx-auto border border-border rounded-full">
                                ↓ {latencyFromPrev}ms
                              </div>
                            )}

                            {/* Event Node */}
                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse z-10 mt-4 mb-4">
                              <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 bg-background shrink-0 text-[10px] shadow ${event.type === 'error' ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}`}>
                                {event.type === 'error' ? '!' : '✓'}
                              </div>
                              <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] px-3 py-2 bg-muted/30 rounded border border-border flex flex-col">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-sm capitalize">{event.type.replace(/_/g, ' ')}</p>
                                  {/* Slow Badge Logic */}
                                  {latencyFromPrev > 2000 && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                      ⚠️ slow
                                    </span>
                                  )}
                                </div>
                                {event.metadata?.error && <p className="text-xs text-red-500 mt-1">{event.metadata.error}</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Side - OTP & Insights */}
                  <div className="space-y-6">
                    {/* OTP Debug */}
                    <div className="bg-muted/10 border border-border rounded-lg p-4">
                      <h4 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-3">OTP Payload</h4>
                      {otpEvent?.metadata?.otp ? (
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs text-muted-foreground">Extracted OTP</span>
                            <div className="flex items-center justify-between">
                              <p className="font-mono text-xl">{otpEvent.metadata.otp}</p>
                              {otpEvent.metadata.score !== undefined && (
                                <span className="ml-2 text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                  {otpEvent.metadata.score * 100}% confidence
                                </span>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(otpEvent.metadata!.otp!)} className="ml-auto"><Copy className="h-3.5 w-3.5"/></Button>
                            </div>
                          </div>
                          {otpEvent.metadata.raw_snippet && (
                            <div>
                              <span className="text-xs text-muted-foreground">Raw Source Snippet</span>
                              <div className="mt-1 p-2 bg-muted/50 rounded border border-border max-h-32 overflow-y-auto">
                                <code className="text-xs font-mono">{otpEvent.metadata.raw_snippet}</code>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No OTP extraction event in this run.</p>
                      )}
                    </div>

                    {/* Insights Panel */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-3">Run Diagnostics</h4>
                      {!isAdvanced ? (
                        <div className="text-sm text-muted-foreground">
                          <p>Detailed diagnostics require Growth plan or higher. Upgrade to unlock.</p>
                        </div>
                      ) : insights.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No failure insights detected for this inbox. Everything looks good!</p>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {insights.map((insight, idx) => (
                            <li key={idx} className="flex gap-2 text-amber-500 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> 
                              <span>{insight.message}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
