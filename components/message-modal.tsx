// components/message-modal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getCookie, setCookie } from "cookies-next";
import {
  Loader2, Paperclip, ShieldCheck, Lock, Clock, Download, X, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Attachment {
  filename:    string;
  contentType: string;
  content:     string;
  size:        number;
}

interface Message {
  id:           string;
  from:         string;
  to:           string;
  subject:      string;
  date:         string;
  body?:        string;
  html?:        string;
  attachments?: Attachment[];
}

interface MessageModalProps {
  message:     Message | null;
  isOpen:      boolean;
  onClose:     () => void;
  isPro:       boolean;
  userPlan?:   string;
  onUpsell:    () => void;
  apiEndpoint: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 B";
  const k  = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ["B", "KB", "MB", "GB"];
  const i  = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Attachment pill ──────────────────────────────────────────────────────────
function AttachmentPill({
  att, isPro, onUpsell,
}: {
  att: Attachment; isPro: boolean; onUpsell: () => void;
}) {
  const downloadUrl = `data:${att.contentType};base64,${att.content}`;
  const ext = att.filename.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <a
      href={isPro ? downloadUrl : "#"}
      download={isPro ? att.filename : undefined}
      onClick={(e) => { if (!isPro) { e.preventDefault(); onUpsell(); } }}
      className="group relative flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors min-w-[200px] max-w-[260px] shrink-0"
    >
      <div className="h-9 w-9 rounded-md border border-border bg-background flex items-center justify-center shrink-0">
        <span className="font-mono text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
          {ext.slice(0, 4)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{att.filename}</p>
        <p className="text-xs font-mono text-muted-foreground">{formatBytes(att.size)}</p>
      </div>
      {isPro
        ? <Download className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 group-hover:text-foreground transition-colors" />
        : <Lock     className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      }
    </a>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MessageModal({
  message, isOpen, onClose, isPro, userPlan, onUpsell, apiEndpoint,
}: MessageModalProps) {
  const [fullMessage, setFullMessage] = useState<Message | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [token,       setToken]       = useState<string | undefined>(undefined);
  const [headerOpen,  setHeaderOpen]  = useState(false);

  useEffect(() => {
    const stored = getCookie("authToken") as string | undefined;
    if (stored) setToken(stored);
    else fetchToken();
  }, []);

  const fetchToken = async () => {
    try {
      const res  = await fetch("/api/auth", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { token?: string };
      if (data.token) { setToken(data.token); setCookie("authToken", data.token, { maxAge: 3600 }); }
    } catch (e) { console.error("Failed to fetch token:", e); }
  };

  const fetchFullMessage = useCallback(async (id: string) => {
    if (!message) return;
    setIsLoading(true);
    try {
      const headers: Record<string, string> = { "x-fce-client": "web-client" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res  = await fetch(`${apiEndpoint}?fullMailboxId=${message.to}&messageId=${id}`, { headers });
      const data = await res.json() as { success: boolean; data: Message };
      if (data.success) setFullMessage(data.data);
    } catch (e) { console.error("Error fetching message:", e); }
    finally { setIsLoading(false); }
  }, [message, token, apiEndpoint]);

  useEffect(() => {
    if (message && isOpen) {
      setFullMessage(null);
      setHeaderOpen(false);
      fetchFullMessage(message.id);
    }
  }, [message, isOpen, token, fetchFullMessage]);

  const getExpiresAt = () => {
    if (isPro) return null;
    const hours = userPlan === "free" ? 24 : 12;
    const base  = new Date(fullMessage?.date || message?.date || Date.now()).getTime();
    return new Date(base + hours * 3600000);
  };
  const expiresAt = getExpiresAt();

  if (!message) return null;

  const subject = fullMessage?.subject || message.subject;
  const from    = fullMessage?.from    || message.from;
  const to      = fullMessage?.to      || message.to;
  const date    = formatDate(fullMessage?.date || message.date);
  const atts    = fullMessage?.attachments ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/*
        ── Two fixes here:
           1. No `hideCloseButton` prop — instead we suppress shadcn's built-in
              close button with `[&>button.absolute]:hidden` (it renders an
              absolutely-positioned <button> as the last child of DialogContent).
           2. We render our own close button inside the title bar.
      */}
      <DialogContent
        className={[
          "sm:max-w-[820px] max-w-screen h-[92vh]",
          "flex flex-col p-0 gap-0 overflow-hidden",
          "bg-background border border-border rounded-lg",
          // ↓ hide shadcn's default floating close button
          "[&>button.absolute]:hidden",
        ].join(" ")}
      >

        {/* ── Title bar ─────────────────────────────────────────────── */}
        {/*
          All three children share items-center so the decorative dots,
          the subject text, and the close button are all on the same baseline.
        */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 shrink-0">

          {/* Decorative dots — vertically centred via items-center on parent */}
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
            <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
            <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
          </div>

          {/* Subject — flex-1 + min-w-0 to truncate correctly */}
          <h2 className="flex-1 min-w-0 text-sm font-semibold text-foreground leading-none truncate">
            {subject}
          </h2>

          {/* Our own close button */}
          <button
            onClick={onClose}
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Collapsible metadata ───────────────────────────────────── */}
        <div className="border-b border-border bg-muted/10 shrink-0">
          <button
            onClick={() => setHeaderOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-3 text-left"
            aria-expanded={headerOpen}
          >
            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 shrink-0">From</span>
              <span className="truncate text-sm text-foreground">{from}</span>
              <span className="font-mono text-[10px] text-muted-foreground/40 hidden sm:inline shrink-0">·</span>
              <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">{date}</span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ml-3 ${headerOpen ? "rotate-180" : ""}`}
            />
          </button>

          {headerOpen && (
            <div className="border-t border-border divide-y divide-border">
              {[
                { label: "From",    value: from    },
                { label: "To",      value: to      },
                { label: "Date",    value: date    },
                { label: "Subject", value: subject },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-4 px-5 py-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 w-14 shrink-0 pt-0.5">
                    {label}
                  </span>
                  <span className="text-sm text-foreground break-all">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Expiry banner ──────────────────────────────────────────── */}
        {!isPro && expiresAt && (
          <button
            onClick={onUpsell}
            className="shrink-0 w-full flex items-center justify-between px-5 py-2.5 border-b border-border bg-muted/10 hover:bg-muted/20 transition-colors group text-left"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono">Auto-deletes {expiresAt.toLocaleString()}</span>
            </div>
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-3">
              Save forever <Lock className="h-3 w-3" />
            </span>
          </button>
        )}

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">Loading message…</span>
            </div>
          ) : fullMessage?.html ? (
            <iframe
              srcDoc={`<base target="_blank" /><style>
                * { box-sizing: border-box; }
                body { margin: 0; padding: 1.25rem 1.5rem;
                  font-family: system-ui,-apple-system,sans-serif;
                  word-wrap: break-word; background: transparent; }
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
                a { word-break: break-all; }
              </style>${fullMessage.html}`}
              className="w-full h-full border-none block"
              title={subject}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
            />
          ) : (
            <div className="h-full overflow-y-auto px-6 py-5">
              <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
                {fullMessage?.body || "No content"}
              </pre>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-border bg-muted/10">
          {atts.length > 0 ? (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Attachments
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/50 border border-border rounded px-1.5 py-px">
                    {atts.length}
                  </span>
                </div>
                {!isPro && (
                  <button
                    onClick={onUpsell}
                    className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border rounded px-2 py-0.5 transition-colors"
                  >
                    <Lock className="h-3 w-3" /> Pro required
                  </button>
                )}
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {atts.map((att, i) => (
                  <AttachmentPill key={i} att={att} isPro={isPro} onUpsell={onUpsell} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                Scanned by FCE Mail Security
              </span>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}