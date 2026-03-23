"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { setCookie } from "cookies-next";
import toast from "react-hot-toast";
import {
  Mail, RefreshCw, Trash2, Edit, QrCode, Copy, Check, CheckCheck,
  Star, ListOrdered, Clock, Archive, ArchiveRestore,
  Settings, Crown, ChevronRight, Loader, Paperclip, ShieldCheck,
  Lock, ExternalLink, Globe, Zap, Link2, ChevronDown, Terminal, Download,
  FileText, X, Cloud, ChevronUp, Pin, PinOff, AlertTriangle, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableRow } from "@/components/ui/table";
import { QRCodeModal } from "./qr-code-modal";
import { CliModal } from "./cli-modal";
import { cn } from "@/lib/utils";
import { MessageModal } from "./message-modal";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { ShareDropdown } from "./ShareDropdown";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ManageInboxesModal } from "./manage-inboxes-modal";
import { AuthNeed, UpsellModal } from "./upsell-modal";
import { SettingsModal, UserSettings, DEFAULT_SETTINGS } from "./settings-modal";
import { BrandAvatar } from "./brand-avatar";
import { useSession } from "next-auth/react";
import type { ServerProfile } from "@/app/[locale]/page";

const PHONE_AFFILIATE_URL = "https://v-numbers.com/?ref=freecustomemail";
const FREE_NOTE_LIMIT = 20;
const PRO_NOTE_LIMIT = 500;
const HISTORY_DEFAULT_SHOW = 3;
const MESSAGES_PER_PAGE = 10;

const PRO_PIN_MSG_LIMIT = 3;
const PRO_PIN_INBOX_LIMIT = 2;
const FREE_PIN_MSG_LIMIT = 1;
const FREE_PIN_INBOX_LIMIT = 1;

const DOMAIN_SEED: FetchedDomain[] = [
  { domain: "ditube.info", tier: "free", tags: [] }
];

const BRAND_CATEGORY_MAP: Record<string, string> = {
  "discord": "Discord", "instagram": "Instagram", "facebook": "Facebook",
  "meta": "Facebook", "twitter": "Twitter/X", "x.com": "Twitter/X",
  "google": "Google", "github": "GitHub", "netflix": "Netflix",
  "spotify": "Spotify", "amazon": "Amazon", "apple": "Apple",
  "microsoft": "Microsoft", "linkedin": "LinkedIn", "reddit": "Reddit",
  "twitch": "Twitch", "paypal": "PayPal", "stripe": "Stripe",
  "slack": "Slack", "notion": "Notion", "figma": "Figma",
  "dropbox": "Dropbox", "zoom": "Zoom", "shopify": "Shopify",
  "tiktok": "TikTok", "snapchat": "Snapchat", "whatsapp": "WhatsApp",
  "telegram": "Telegram",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Discord": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  "Instagram": "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  "Facebook": "bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/20",
  "Twitter/X": "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  "Google": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  "GitHub": "bg-zinc-800/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
  "Netflix": "bg-red-600/10 text-red-700 dark:text-red-400 border-red-600/20",
  "Spotify": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Amazon": "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  "Apple": "bg-zinc-400/10 text-zinc-600 dark:text-zinc-400 border-zinc-400/20",
  "Microsoft": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "LinkedIn": "bg-sky-600/10 text-sky-700 dark:text-sky-400 border-sky-600/20",
  "Reddit": "bg-orange-600/10 text-orange-600 dark:text-orange-400 border-orange-600/20",
  "Twitch": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  "PayPal": "bg-blue-700/10 text-blue-700 dark:text-blue-400 border-blue-700/20",
  "Stripe": "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  "Slack": "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20",
  "Notion": "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
  "Figma": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "Dropbox": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "Zoom": "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  "Shopify": "bg-green-600/10 text-green-700 dark:text-green-400 border-green-600/20",
  "TikTok": "bg-zinc-800/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
  "Snapchat": "bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 border-yellow-400/20",
  "WhatsApp": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  "Telegram": "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
};

function detectCategory(from: string): string | null {
  const lower = (from || "").toLowerCase();
  for (const [keyword, category] of Object.entries(BRAND_CATEGORY_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return null;
}

export function parseSenderName(from: string): string {
  if (!from) return "?";
  let name = from.replace(/<[^>]*>/g, "").trim();
  name = name.replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, "").trim();
  if (!name) name = from.replace(/@.*$/, "").replace(/[<>]/g, "").trim();
  return name || from;
}

const PRO_ADJECTIVES = [
  "swift", "lunar", "neon", "azure", "ivory", "onyx", "amber", "cobalt", "sage",
  "frost", "ember", "cedar", "jade", "slate", "opal", "raven", "dusk", "dawn",
  "prism", "echo", "apex", "nova", "zenith", "cipher", "velvet", "obsidian",
];
const PRO_NOUNS = [
  "circuit", "horizon", "nexus", "beacon", "cipher", "vortex", "lattice",
  "phantom", "zenith", "solstice", "catalyst", "vertex", "quasar", "delta",
  "aurora", "prism", "haven", "vector", "summit", "atlas", "orbit", "pulse",
];

export function generateProEmail(domain: string) {
  const adj = PRO_ADJECTIVES[Math.floor(Math.random() * PRO_ADJECTIVES.length)];
  const noun = PRO_NOUNS[Math.floor(Math.random() * PRO_NOUNS.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}.${noun}${num}@${domain}`;
}

const adjectives = ["rapid", "silent", "cosmic", "bright", "frozen", "wild", "golden"];
const nouns = ["river", "tiger", "cloud", "pixel", "storm", "forest", "wolf"];

export function generateRandomEmail(domain: string, isPro = false) {
  if (isPro) return generateProEmail(domain);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}-${noun}${num}@${domain}`;
}

interface Attachment { filename: string; contentType: string; content: string; size: number; }
interface Message {
  id: string; from: string; to: string; subject: string; date: string;
  text?: string; html?: string; body?: string;
  hasAttachments?: boolean; attachments?: Attachment[];
  otp?: string | null; verificationLink?: string | null;
}
interface DomainExpiry {
  domain: string; expires_at: string; expires_in_days: number;
  expiring_soon: boolean; expired: boolean;
}
interface FetchedDomain {
  domain: string; tier: "free" | "pro"; tags: string[];
  expires_at?: string; expires_in_days?: number; expiring_soon?: boolean;
}

const safeJsonParse = <T,>(str: string | null, fallback: T): T => {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
};

const getPreferredDomain = (domains: string[], last: string | null, freeSet: Set<string>) =>
  (last && domains.includes(last))
    ? last
    : (domains[0] && !freeSet.has(domains[0]) ? domains[0] : domains[0] || [...freeSet][0] || "ditube.info");

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "numeric", hour12: true }).format(new Date(s));

const fmtDateShort = (s: string) => {
  const d = new Date(s), now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const getExpiry = (dateStr: string, hours: number) => {
  const d = new Date(dateStr); d.setHours(d.getHours() + hours);
  const now = new Date(); const diff = d.getTime() - now.getTime();
  const timeStr = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "numeric", hour12: true });
  if (diff <= 0) return "Expired";
  if (d.getDate() !== now.getDate()) return `Tomorrow ${timeStr}`;
  return `Today ${timeStr}`;
};

// ── Toast helpers ─────────────────────────────────────────────────────────────
// Centralised error display. All API errors go through here instead of setError().

type ToastErrorKind =
  | "rate_limit_free"       // 429 on a free/anon user → show upgrade CTA
  | "rate_limit_pro"        // 429 on a pro user → just "slow down" with retry time
  | "quota_exceeded"        // inbox / feature quota hit → upgrade CTA
  | "network"               // fetch/timeout → plain error
  | "auth"                  // 401 → sign in prompt
  | "generic"               // anything else

function showApiError(kind: ToastErrorKind, message?: string, retryAfterSec?: number) {
  const duration = 5000;

  if (kind === "rate_limit_free") {
    toast.custom(
      (t) => (
        <div className={cn(
          "flex items-start gap-3 rounded-lg border border-amber-500/30 bg-background px-4 py-3 shadow-lg max-w-sm",
          t.visible ? "animate-enter" : "animate-leave"
        )}>
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs font-semibold text-foreground">Refreshing too fast</p>
            <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
              {message || "You've hit the free tier refresh limit. Upgrade for higher limits."}
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-1 mt-2 font-mono text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Sparkles className="h-3 w-3" />
              View Pro plans →
            </a>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="shrink-0 text-muted-foreground/50 hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      { duration, id: "rate-limit" }
    );
    return;
  }

  if (kind === "rate_limit_pro") {
    const retryMsg = retryAfterSec ? ` Try again in ${retryAfterSec}s.` : "";
    toast.error(`Refreshing too fast.${retryMsg}`, { duration: 3000, id: "rate-limit" });
    return;
  }

  if (kind === "quota_exceeded") {
    toast.custom(
      (t) => (
        <div className={cn(
          "flex items-start gap-3 rounded-lg border border-violet-500/30 bg-background px-4 py-3 shadow-lg max-w-sm",
          t.visible ? "animate-enter" : "animate-leave"
        )}>
          <Lock className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs font-semibold text-foreground">Feature limit reached</p>
            <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
              {message || "You've reached the limit for your current plan."}
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-1 mt-2 font-mono text-[11px] text-violet-600 dark:text-violet-400 hover:underline"
            >
              <Crown className="h-3 w-3" />
              Upgrade to Pro →
            </a>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="shrink-0 text-muted-foreground/50 hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      { duration, id: "quota" }
    );
    return;
  }

  if (kind === "auth") {
    toast.error(message || "Session expired. Please sign in again.", { duration: 4000 });
    return;
  }

  if (kind === "network") {
    toast.error(message || "Network error — check your connection and try again.", { duration: 4000 });
    return;
  }

  // generic
  toast.error(message || "Something went wrong. Please try again.", { duration: 4000 });
}

/**
 * Classifies an API response into a ToastErrorKind.
 * Call after a failed fetch — pass status code + parsed error body.
 */
function classifyApiError(
  status: number,
  body: { message?: string; code?: string } | null,
  isPro: boolean,
  retryAfter?: string | null,
): { kind: ToastErrorKind; message?: string; retryAfterSec?: number } {
  const retryAfterSec = retryAfter ? parseInt(retryAfter, 10) : undefined;

  if (status === 429) {
    return isPro
      ? { kind: "rate_limit_pro", message: body?.message, retryAfterSec }
      : { kind: "rate_limit_free", message: body?.message, retryAfterSec };
  }
  if (status === 401 || status === 403) {
    return { kind: "auth", message: body?.message };
  }
  if (status === 402 || body?.code === "QUOTA_EXCEEDED" || body?.code === "PLAN_LIMIT") {
    return { kind: "quota_exceeded", message: body?.message };
  }
  if (status === 0 || status >= 500) {
    return { kind: "network", message: body?.message };
  }
  return { kind: "generic", message: body?.message };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NewEmailFlash({ from, subject, onDone }: { from: string; subject: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3400); return () => clearTimeout(t); }, [onDone]);
  return (
    <>
      <style>{`
        @keyframes flashEnter { 0%{transform:translateY(-100%);opacity:0} 10%{transform:translateY(0);opacity:1} 80%{transform:translateY(0);opacity:1} 100%{transform:translateY(-100%);opacity:0} }
        @keyframes scanSwipe { 0%{background-position:-100% 0} 100%{background-position:220% 0} }
      `}</style>
      <div className="absolute top-0 inset-x-0 z-50 overflow-hidden pointer-events-none" style={{ animation: "flashEnter 3.4s ease-out forwards" }}>
        <div className="relative flex items-center gap-3 px-4 py-2.5 bg-background border-b border-border">
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,transparent 0%,hsl(var(--foreground)/0.05) 50%,transparent 100%)", backgroundSize: "60% 100%", animation: "scanSwipe 0.7s ease-out 0.1s" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">RCVD</span>
          <span className="font-mono text-xs text-foreground font-semibold truncate">{from}</span>
          <span className="text-border shrink-0">·</span>
          <span className="font-mono text-xs text-muted-foreground truncate">{subject || "(no subject)"}</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/70 shrink-0 tabular-nums">{new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</span>
        </div>
      </div>
    </>
  );
}

function ProLockChip({ label, blurContent, onUpsell, variant = "otp" }: { label: string; blurContent: string; onUpsell: () => void; variant?: "otp" | "verify" }) {
  const cls = variant === "otp"
    ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
    : "bg-blue-500/8 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15";
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onUpsell(); }}
      className={cn("group shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono transition-all cursor-pointer select-none", cls)}>
      <Lock className="h-2.5 w-2.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
      <span className="blur-[4px] tracking-widest pointer-events-none">{blurContent}</span>
    </button>
  );
}

function OtpChip({ otp, onCopy, copied }: { otp: string; onCopy: () => void; copied: boolean }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onCopy(); }}
      className="shrink-0 inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px] font-mono cursor-pointer hover:bg-emerald-500/20 transition-colors">
      <Zap className="h-2.5 w-2.5 shrink-0" />
      <span className="font-bold tracking-wider">{otp}</span>
      {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5 opacity-50" />}
    </div>
  );
}

function VerifyChip({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
      className="shrink-0 inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 text-[10px] font-medium cursor-pointer hover:bg-blue-500/20 transition-colors">
      <Link2 className="h-2.5 w-2.5 shrink-0" />
      <span>Verify</span>
      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
    </a>
  );
}

function CategoryChip({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] || "bg-muted/40 text-muted-foreground border-border";
  return (
    <span className={cn("shrink-0 inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono", cls)}>
      {category}
    </span>
  );
}

function DomainExpiryBanner({ expiry, isPro, onUpsell }: { expiry: DomainExpiry; isPro: boolean; onUpsell: (f: string) => void }) {
  if (!expiry.expiring_soon && !expiry.expired) return null;
  const urgent = expiry.expired || expiry.expires_in_days <= 7;
  const label = expiry.expired ? `@${expiry.domain} has expired — emails may stop delivering.` : `@${expiry.domain} expires in ${expiry.expires_in_days} day${expiry.expires_in_days !== 1 ? "s" : ""}.`;
  return (
    <div className={cn("border-t px-4 py-2.5 flex items-center gap-2 transition-colors", urgent ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10" : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10", !isPro && "cursor-pointer")}
      onClick={() => { if (!isPro) onUpsell("Custom Domain — keep your inbox forever"); }}>
      <Clock className={cn("h-3 w-3 shrink-0", urgent ? "text-red-500" : "text-amber-500")} />
      <span className={cn("font-mono text-[11px] flex-1", urgent ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>
        {label}
        {!isPro && <span className="ml-1 underline underline-offset-2">Get your own domain →</span>}
        {isPro && <span className="ml-1 text-muted-foreground/80">Transfer to a custom domain in Settings.</span>}
      </span>
    </div>
  );
}

function PhonePromoCard() {
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">OTP Verification</p>
      </div>
      <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">Need a real phone number for OTP verification? Get one instantly from our partner.</p>
      <a rel="sponsored" href={PHONE_AFFILIATE_URL} target="_blank"
        className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground underline underline-offset-2 decoration-border hover:decoration-foreground transition-colors">
        Get phone number →
      </a>
    </div>
  );
}

const SplitPaneMessageView = ({ message, token, apiEndpoint, isPro, onUpsell }: { message: Message; token: string | null; apiEndpoint: string; isPro: boolean; onUpsell: (f: string) => void }) => {
  const [fullMessage, setFullMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchFull = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = { "x-fce-client": "web-client" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch(`${apiEndpoint}?fullMailboxId=${message.to}&messageId=${id}`, { headers });
      if (!r.ok) throw new Error("Fetch failed");
      const d = await r.json();
      if (d.success) setFullMessage(d.data);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }, [message.to, token, apiEndpoint]);
  useEffect(() => { setFullMessage(null); fetchFull(message.id); }, [message.id, fetchFull]);
  const fmt = (b: number) => { if (!b) return "0 B"; const s = ["B", "KB", "MB", "GB"]; const i = Math.floor(Math.log(b) / Math.log(1024)); return `${(b / Math.pow(1024, i)).toFixed(1)} ${s[i]}`; };
  const m = fullMessage || message;
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border bg-muted/10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Subject</p>
        <h2 className="text-sm font-semibold text-foreground mb-2 break-words leading-snug">{m.subject}</h2>
        <div className="grid gap-0.5 font-mono text-[11px] text-muted-foreground">
          <span><span className="text-foreground/40 mr-2">FROM</span>{parseSenderName(m.from)}</span>
          <span><span className="text-foreground/40 mr-2">DATE</span>{new Date(m.date).toLocaleString()}</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative min-h-0 bg-white dark:bg-zinc-950">
        {isLoading
          ? <div className="flex justify-center items-center h-full"><Loader className="animate-spin h-4 w-4 mr-2 text-muted-foreground" /><span className="font-mono text-xs text-muted-foreground">fetching…</span></div>
          : m.html
            ? <iframe srcDoc={`<base target="_blank"/><style>body{margin:0;padding:1.5rem;font-family:system-ui,sans-serif;word-wrap:break-word}img{max-width:100%}</style>${m.html}`} className="w-full h-full border-none" sandbox="allow-same-origin allow-popups" title="Email" />
            : <div className="h-full overflow-y-auto p-6 whitespace-pre-wrap font-mono text-xs text-foreground/80">{m.body || m.text || "No content."}</div>
        }
      </div>
      {m.attachments?.length ? (
        <div className="p-3 bg-muted/20 border-t border-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Attachments</span>
            {!isPro && <span className="font-mono text-[10px] text-amber-600 border border-amber-500/30 rounded px-1.5 py-px flex items-center gap-1"><Lock className="h-2.5 w-2.5" />Pro</span>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {m.attachments.map((att, i) => (
              <a key={i} href={isPro ? `data:${att.contentType};base64,${att.content}` : "#"} download={isPro ? att.filename : undefined}
                onClick={(e) => { if (!isPro) { e.preventDefault(); onUpsell("Attachments"); } }}
                className="flex items-center gap-2 p-1.5 bg-background border border-border rounded hover:bg-muted/40 transition-colors min-w-[140px] max-w-[180px]">
                <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                <div className="min-w-0"><p className="font-mono text-[10px] truncate">{att.filename}</p><p className="font-mono text-[10px] text-muted-foreground">{fmt(att.size)}</p></div>
              </a>
            ))}
          </div>
        </div>
      ) : !isLoading && (
        <div className="px-4 py-2 border-t border-border bg-muted/10">
          <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" />Scanned · No threats detected</span>
        </div>
      )}
    </div>
  );
};

function PinButton({ isPinned, onClick, size = "sm", hidden }: { isPinned: boolean; onClick: (e: React.MouseEvent) => void; size?: "sm" | "xs"; hidden?: boolean }) {
  if (hidden) return null;
  return (
    <Button variant="ghost" size="icon"
      className={cn(size === "xs" ? "h-5 w-5" : "h-6 w-6", isPinned && "text-amber-500")}
      onClick={onClick} title={isPinned ? "Unpin" : "Pin"}>
      <Pin className={cn(size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3", isPinned && "fill-amber-500")} />
    </Button>
  );
}

interface EmailBoxProps {
  serverProfile?: ServerProfile | null;
}

export function EmailBox({ serverProfile }: EmailBoxProps) {
  const t = useTranslations("EmailBox");

  const { data: session, status: sessionStatus } = useSession();

  const isSessionLoading = sessionStatus === "loading";
  const isAuthenticated = !!session;
  // @ts-ignore
  const userPlan = session?.user?.plan || "none";
  const isPro = userPlan === "pro";
  const noteCharLimit = isPro ? PRO_NOTE_LIMIT : FREE_NOTE_LIMIT;

  const API_ENDPOINT = isAuthenticated ? "/api/private-mailbox" : "/api/public-mailbox";

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [customDomainsFromProfile, setCustomDomainsFromProfile] = useState<{ domain: string; verified: boolean }[]>(
    // Seed from server-side prefetch immediately — no flash
    serverProfile?.customDomains ?? []
  );
  const [fetchedDomains, setFetchedDomains] = useState<FetchedDomain[]>(DOMAIN_SEED);
  const [domainExpiry, setDomainExpiry] = useState<DomainExpiry | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailHistory, setEmailHistory] = useState<string[]>(
    // Seed inbox history from server immediately for logged-in users
    serverProfile?.inboxes ?? []
  );
  const [isEditing, setIsEditing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCliModalOpen, setIsCliModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [otpCopied, setOTPCopied] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isThrottled, setIsThrottled] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "email" | "message"; id?: string } | null>(null);
  const [blockButtons, setBlockButtons] = useState(false);
  const [oldEmailUsed, setOldEmailUsed] = useState(false);
  const [discoveredUpdates, setDiscoveredUpdates] = useState({ newDomains: false });
  const [showAttachmentNotice, setShowAttachmentNotice] = useState(false);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    ...DEFAULT_SETTINGS,
    // Seed settings from server prefetch if available
    ...(serverProfile?.settings ?? {}),
  });
  const [activeTab, setActiveTab] = useState<"all" | "dismissed">("all");
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [dismissedMessageIds, setDismissedMessageIds] = useState<Set<string>>(new Set());
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [isAuthNeedOpen, setIsAuthNeedOpen] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState("Pro Features");
  const [authNeedFeature, setAuthNeedFeature] = useState("LoggedIn Features");
  const [flashQueue, setFlashQueue] = useState<{ id: string; from: string; subject: string }[]>([]);
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());
  const [inboxNotes, setInboxNotes] = useState<Record<string, string>>(
    // Seed notes from server prefetch
    serverProfile?.inboxNotes ?? {}
  );
  const [editingNoteInbox, setEditingNoteInbox] = useState<string | null>(null);
  const [noteInputValue, setNoteInputValue] = useState("");
  const [noteHintDismissed, setNoteHintDismissed] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [visibleMessageCount, setVisibleMessageCount] = useState(MESSAGES_PER_PAGE);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const [pinnedInboxes, setPinnedInboxes] = useState<string[]>([]);
  const [unseenSettingsFeatures, setUnseenSettingsFeatures] = useState<Set<string>>(new Set());

  // Track whether we've already bootstrapped from serverProfile so we only do it once
  const serverProfileAppliedRef = useRef(false);

  // ── REFS ───────────────────────────────────────────────────────────────────
  const skipNextSettingsSave = useRef(false);
  const originalTitle = useRef(typeof document !== "undefined" ? document.title : "DITMail");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const currentEmailRef = useRef("");
  const sendNotificationRef = useRef<(t: string, b: string) => void>(() => { });
  const setMessagesRef = useRef(setMessages);
  const isRefreshingThrottleRef = useRef(false);

  // ── MEMOS ──────────────────────────────────────────────────────────────────
  const openUpsell = (feature: string) => { setUpsellFeature(feature); setIsUpsellOpen(true); };

  const freeDomainSet = useMemo(() =>
    new Set(fetchedDomains.filter(d => d.tier === "free").map(d => d.domain)),
    [fetchedDomains]);

  const availableDomains = useMemo(() => {
    const custom = customDomainsFromProfile
      .filter(d => d.verified)
      .map(d => d.domain);

    const sortedFetched = [...fetchedDomains].sort((a, b) => {
      const score = (d: FetchedDomain) => {
        let s = 0;
        if (d.tags.includes('featured')) s += 100;
        if (d.tags.includes('popular')) s += 50;
        if (d.tags.includes('new')) s += 25;
        if (d.tier === 'pro') s += 10;
        return s;
      };
      const scoreDiff = score(b) - score(a);
      if (scoreDiff !== 0) return scoreDiff;
      return a.domain.localeCompare(b.domain);
    }).map(d => d.domain);

    return [...new Set([...custom, ...sortedFetched])];
  }, [customDomainsFromProfile, fetchedDomains]);

  const hasNewDomain = useMemo(() =>
    fetchedDomains.some(d => d.tags.includes("new")),
    [fetchedDomains]);

  const checkDomainAllowed = useCallback((domain: string, domainsList: FetchedDomain[]) => {
    if (isPro) return true;
    const fd = domainsList.find(d => d.domain === domain);
    if (fd?.tier === "pro") return false;
    const freeSet = new Set(domainsList.filter(d => d.tier === "free").map(d => d.domain));
    if (!fd && !freeSet.has(domain) && !DOMAIN_SEED.some(d => d.domain === domain)) return false;
    return true;
  }, [isPro]);

  const isSplit = userSettings.layout === "split" && isPro;
  const isCompact = userSettings.layout === "compact";
  const isZen = userSettings.layout === "zen";
  const isClassic = userSettings.layout === "classic";
  const isMobile = userSettings.layout === "mobile" && isPro;
  const isRetro = userSettings.layout === "retro" && isPro;

  const getMessageCategory = useCallback((msg: Message): string | null => {
    if (!userSettings.categorization) return null;
    return detectCategory(msg.from);
  }, [userSettings.categorization]);

  const getMsgPinLimit = () => isPro ? PRO_PIN_MSG_LIMIT : isAuthenticated ? FREE_PIN_MSG_LIMIT : 0;
  const getInboxPinLimit = () => isPro ? PRO_PIN_INBOX_LIMIT : isAuthenticated ? FREE_PIN_INBOX_LIMIT : 0;

  const togglePinMessage = useCallback((msgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { setAuthNeedFeature("Pin Messages"); setIsAuthNeedOpen(true); return; }
    const limit = getMsgPinLimit();
    if (limit === 0) { openUpsell("Pin Messages"); return; }
    setPinnedMessageIds(prev => {
      if (prev.includes(msgId)) {
        const next = prev.filter(id => id !== msgId);
        localStorage.setItem("pinnedMessages", JSON.stringify(next));
        return next;
      }
      if (prev.length >= limit) {
        if (!isPro) openUpsell(`Pin up to ${PRO_PIN_MSG_LIMIT} Messages (Pro)`);
        else openUpsell("Pin Messages — limit reached");
        return prev;
      }
      const next = [...prev, msgId];
      localStorage.setItem("pinnedMessages", JSON.stringify(next));
      return next;
    });
  }, [isAuthenticated, isPro]); // eslint-disable-line

  const togglePinInbox = useCallback((inbox: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { setAuthNeedFeature("Pin Inboxes"); setIsAuthNeedOpen(true); return; }
    const limit = getInboxPinLimit();
    if (limit === 0) { openUpsell("Pin Inboxes"); return; }
    setPinnedInboxes(prev => {
      if (prev.includes(inbox)) {
        const next = prev.filter(a => a !== inbox);
        localStorage.setItem("pinnedInboxes", JSON.stringify(next));
        return next;
      }
      if (prev.length >= limit) {
        if (!isPro) openUpsell(`Pin up to ${PRO_PIN_INBOX_LIMIT} Inboxes (Pro)`);
        else openUpsell("Pin Inboxes — limit reached");
        return prev;
      }
      const next = [...prev, inbox];
      localStorage.setItem("pinnedInboxes", JSON.stringify(next));
      return next;
    });
  }, [isAuthenticated, isPro]); // eslint-disable-line

  const renderBadges = useCallback((msg: Message) => {
    const hasOtp = !!msg.otp;
    const hasVerify = !!msg.verificationLink;
    const category = getMessageCategory(msg);
    const isRealOtp = msg.otp !== "__DETECTED__";
    const isRealLink = msg.verificationLink !== "__DETECTED__";
    return (
      <span className="inline-flex items-center gap-1 flex-wrap">
        {category && <CategoryChip category={category} />}
        {hasOtp && (isPro && isRealOtp
          ? <OtpChip otp={msg.otp!} onCopy={() => { navigator.clipboard.writeText(msg.otp!); setOTPCopied(msg.id); setTimeout(() => setOTPCopied(null), 2000); }} copied={otpCopied === msg.id} />
          : <ProLockChip label="OTP code" blurContent="847291" onUpsell={() => openUpsell("Auto OTP Extraction")} variant="otp" />
        )}
        {hasVerify && (isPro && isRealLink
          ? <VerifyChip url={msg.verificationLink!} />
          : <ProLockChip label="verify link" blurContent="Verify" onUpsell={() => openUpsell("Verification Link Detection")} variant="verify" />
        )}
      </span>
    );
  }, [isPro, otpCopied, getMessageCategory]); // eslint-disable-line

  // ── EFFECTS ────────────────────────────────────────────────────────────────

  const connectWebSocket = useCallback(async (mailbox: string) => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const prev = wsRef.current;
    if (prev) {
      prev.onclose = null;
      if (prev.readyState < 2) prev.close(1000, 'mailbox_change');
    }

    let wsToken = '';
    try {
      const res = await fetch('/api/ws-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailbox }),
      });
      if (res.ok) {
        const data = await res.json();
        wsToken = data.token ?? '';
      }
    } catch { }

    if (!wsToken) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30_000);
      reconnectAttemptsRef.current++;
      reconnectTimerRef.current = setTimeout(
        () => { if (currentEmailRef.current) connectWebSocket(currentEmailRef.current); },
        delay
      );
      return;
    }

    const url = `wss://api2.freecustom.email/?mailbox=${encodeURIComponent(mailbox)}&token=${encodeURIComponent(wsToken)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => { reconnectAttemptsRef.current = 0; };

    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        if (d.type !== 'new_mail' || d.mailbox !== currentEmailRef.current) return;
        const msg: Message = {
          id: d.id, from: d.from, to: d.to, subject: d.subject,
          date: d.date, hasAttachments: d.hasAttachment,
          otp: d.otp ?? null, verificationLink: d.verificationLink ?? null,
        };
        setMessagesRef.current(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          sendNotificationRef.current(`New Email from ${parseSenderName(msg.from)}`, msg.subject || '(No Subject)');
          return [msg, ...prev];
        });
        setFlashQueue(q => [...q, { id: msg.id, from: parseSenderName(msg.from), subject: msg.subject || '' }]);
        setNewRowIds(s => new Set(s).add(msg.id));
        setTimeout(() => setNewRowIds(s => { const n = new Set(s); n.delete(msg.id); return n; }), 1400);
      } catch { }
    };

    ws.onerror = () => { };

    ws.onclose = (ev) => {
      if (ev.code === 1000) return;
      const delay = Math.min(500 * Math.pow(2, reconnectAttemptsRef.current), 30_000);
      reconnectAttemptsRef.current++;
      reconnectTimerRef.current = setTimeout(
        () => { if (currentEmailRef.current) connectWebSocket(currentEmailRef.current); },
        delay
      );
    };
  }, []); // eslint-disable-line

  useEffect(() => () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    const ws = wsRef.current; if (ws) { ws.onclose = null; ws.close(1000, "unmount"); }
  }, []);

  const userHasInteractedRef = useRef(false);

  // EFFECT 1: init — uses serverProfile if available, skips redundant client fetch
  useEffect(() => {
    const init = async () => {
      await fetchToken();

      const cacheKey = `domains_v2_${isPro ? "pro" : isAuthenticated ? "free" : "anon"}`;
      const cached = sessionStorage.getItem(cacheKey);
      let currentFetchedDomains = DOMAIN_SEED;
      if (cached) {
        try {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < 5 * 60 * 1000) {
            setFetchedDomains(data);
            currentFetchedDomains = data;
          } else throw new Error("stale");
        } catch { sessionStorage.removeItem(cacheKey); }
      }
      fetch("/api/domains", { headers: { "x-fce-client": "web-client" } })
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d?.data)) {
            setFetchedDomains(d.data);
            sessionStorage.setItem(cacheKey, JSON.stringify({ data: d.data, ts: Date.now() }));
          }
        })
        .catch(() => { });

      // Load local storage state
      const savedSettings = safeJsonParse<UserSettings | null>(localStorage.getItem("userSettings"), null);
      // Server settings take priority over local cache, local cache wins over defaults
      if (savedSettings && !serverProfile?.settings) {
        setUserSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
      }
      setReadMessageIds(new Set(safeJsonParse<string[]>(localStorage.getItem("readMessageIds"), [])));
      setDismissedMessageIds(new Set(safeJsonParse<string[]>(localStorage.getItem("dismissedMessageIds"), [])));
      setPinnedMessageIds(safeJsonParse<string[]>(localStorage.getItem("pinnedMessages"), []));
      setPinnedInboxes(safeJsonParse<string[]>(localStorage.getItem("pinnedInboxes"), []));
      const seenFeatures = safeJsonParse<string[]>(localStorage.getItem("seenSettingsFeatures"), []);
      setUnseenSettingsFeatures(new Set(["categorization"].filter(f => !seenFeatures.includes(f))));
      setIsStorageLoaded(true);

      // ── Logged-in users: use serverProfile data (already seeded in useState) ──
      if (isAuthenticated && serverProfile && !serverProfileAppliedRef.current) {
        serverProfileAppliedRef.current = true;

        // Merge local inbox history with server inboxes
        const localHistory = safeJsonParse<string[]>(localStorage.getItem("emailHistory"), []);
        const serverSet = new Set(serverProfile.inboxes);
        const localOnly = localHistory.filter(e => !serverSet.has(e));
        const fullHistory = [...serverProfile.inboxes, ...localOnly];

        setEmailHistory(fullHistory);
        localStorage.setItem("emailHistory", JSON.stringify(fullHistory));

        if (serverProfile.inboxes.length > 0) {
          const lastUsed = serverProfile.inboxes[0];
          setEmail(lastUsed);
          setSelectedDomain(lastUsed.split('@')[1] || '');
        } else {
          // No inboxes yet — generate one
          const allowedDomainsList = currentFetchedDomains
            .filter(d => checkDomainAllowed(d.domain, currentFetchedDomains))
            .map(d => d.domain);
          const d = getPreferredDomain(allowedDomainsList, localStorage.getItem("lastUsedDomain"), freeDomainSet);
          const freshEmail = generateRandomEmail(d, isPro);
          setEmail(freshEmail);
          setSelectedDomain(d);
          setEmailHistory([freshEmail]);
        }

        // Merge notes: server wins on conflicts
        if (serverProfile.inboxNotes) {
          const localNotes = safeJsonParse<Record<string, string>>(localStorage.getItem("inboxNotes"), {});
          const merged = { ...localNotes, ...serverProfile.inboxNotes };
          setInboxNotes(merged);
          localStorage.setItem("inboxNotes", JSON.stringify(merged));
        }
        return; // Skip the guest path below
      }

      // ── Logged-in users without serverProfile: client-side fetch (fallback) ──
      if (isAuthenticated) {
        const localHistory = safeJsonParse<string[]>(localStorage.getItem("emailHistory"), []);
        if (localHistory.length > 0) {
          setEmailHistory(localHistory);
        }
        return;
      }

      // ── Guest users: pure client-side random address ──
      const currentFreeSet = new Set(currentFetchedDomains.filter(d => d.tier === "free").map(d => d.domain));
      const allowedDomainsList = currentFetchedDomains
        .filter(d => checkDomainAllowed(d.domain, currentFetchedDomains))
        .map(d => d.domain);
      const localHistory = safeJsonParse<string[]>(localStorage.getItem("emailHistory"), []);
      const lastDomain = localStorage.getItem("lastUsedDomain");
      let initEmail: string;
      let hist: string[];

      if (localHistory.length > 0) {
        hist = localHistory.slice(0, 5);
        const topDomain = hist[0].split("@")[1];
        if (!topDomain || !checkDomainAllowed(topDomain, currentFetchedDomains)) {
          const d = getPreferredDomain(allowedDomainsList, lastDomain, currentFreeSet);
          initEmail = generateRandomEmail(d, false);
          hist = [initEmail, ...hist.filter(e => e !== initEmail)].slice(0, 5);
        } else {
          initEmail = hist[0];
        }
      } else {
        const d = getPreferredDomain(allowedDomainsList, lastDomain, currentFreeSet);
        initEmail = generateRandomEmail(d, false);
        hist = [initEmail];
      }

      setEmail(initEmail);
      setEmailHistory(hist);
      setSelectedDomain(initEmail.split("@")[1] || "");
    };
    init();
  }, []); // eslint-disable-line

  // EFFECT 2: fetchProfile — only runs for logged-in users WITHOUT serverProfile (fallback)
  useEffect(() => {
    if (!isAuthenticated || !session?.user?.id) return;
    // If we already bootstrapped from serverProfile, skip the client-side fetch
    if (serverProfile && serverProfileAppliedRef.current) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/me', {
          headers: { 'x-fce-client': 'web-client' },
        });
        if (!res.ok) return;
        const { user } = await res.json();
        if (!user) return;

        if (isPro && Array.isArray(user.customDomains) && user.customDomains.length > 0) {
          const verified = user.customDomains.filter((d: any) => d.verified === true);
          if (verified.length > 0) setCustomDomainsFromProfile(verified);
        }

        if (Array.isArray(user.inboxes) && user.inboxes.length > 0) {
          const localHistory = safeJsonParse<string[]>(localStorage.getItem("emailHistory"), []);
          const serverSet = new Set(user.inboxes);
          const localOnly = localHistory.filter(e => !serverSet.has(e));
          const fullHistory = [...user.inboxes, ...localOnly];

          setEmailHistory(fullHistory);
          localStorage.setItem("emailHistory", JSON.stringify(fullHistory));

          const lastUsed = user.inboxes[0];
          setEmail(lastUsed);
          setSelectedDomain(lastUsed.split('@')[1] || '');
        } else {
          const domains = fetchedDomains.filter(d => checkDomainAllowed(d.domain, fetchedDomains));
          const freeDomains = domains.filter(d => d.tier === 'free').map(d => d.domain);
          const allDomains = domains.map(d => d.domain);
          let targetDomain: string;
          if (isPro && customDomainsFromProfile.length > 0) {
            const verified = customDomainsFromProfile.filter(d => d.verified);
            targetDomain = verified[Math.floor(Math.random() * verified.length)]?.domain || allDomains[0] || 'ditube.info';
          } else {
            targetDomain = freeDomains[0] || allDomains[0] || 'ditube.info';
          }
          const freshEmail = generateRandomEmail(targetDomain, isPro);
          setEmail(freshEmail);
          setSelectedDomain(targetDomain);
          setEmailHistory([freshEmail]);
        }
      } catch {
        // silent — keep current state
      }
    };

    fetchProfile();
  }, [isAuthenticated, session?.user?.id]); // eslint-disable-line

  // EFFECT 3: email-save
  useEffect(() => {
    if (!email || !email.includes('@')) return;

    if (isAuthenticated) {
      fetch("/api/user/inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inboxName: email }),
      }).catch(() => { });
    }

    const h = safeJsonParse<string[]>(localStorage.getItem("emailHistory"), []);
    let next = [email, ...h.filter(e => e !== email)];
    if (userPlan === "free") next = next.slice(0, 7);
    else if (!isAuthenticated) next = next.slice(0, 5);
    localStorage.setItem("emailHistory", JSON.stringify(next));
    setEmailHistory(next);
  }, [email, isAuthenticated, userPlan]); // eslint-disable-line

  useEffect(() => {
    const fetch_ = async () => {
      if (!isAuthenticated) return;
      // Skip if we already have server-fetched settings
      if (serverProfile?.settings) return;
      try {
        const r = await fetch("/api/user/settings");
        if (r.ok) {
          const d = await r.json();
          if (d.settings) {
            skipNextSettingsSave.current = true;
            setUserSettings(p => ({ ...p, ...d.settings }));
            localStorage.setItem("userSettings", JSON.stringify({ ...DEFAULT_SETTINGS, ...d.settings }));
          }
        }
      } catch { }
    };
    if (isStorageLoaded) fetch_();
  }, [isAuthenticated, isStorageLoaded, serverProfile?.settings]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    const local = safeJsonParse<Record<string, string>>(localStorage.getItem("inboxNotes"), {});
    // If already seeded from serverProfile, only apply local keys not in server data
    if (!serverProfile?.inboxNotes) {
      setInboxNotes(local);
    }
    setNoteHintDismissed(localStorage.getItem("noteHintSeen") === "1");
    if (isPro && isAuthenticated && !serverProfile?.inboxNotes) {
      fetch("/api/user/inbox-notes")
        .then(r => r.json())
        .then(d => {
          if (d.success && d.notes && typeof d.notes === "object") {
            const merged = { ...local, ...d.notes };
            setInboxNotes(merged);
            localStorage.setItem("inboxNotes", JSON.stringify(merged));
          }
        })
        .catch(() => { });
    }
  }, [isStorageLoaded, isPro, isAuthenticated]); // eslint-disable-line

  useEffect(() => {
    if (!isStorageLoaded) return;
    if (skipNextSettingsSave.current) { skipNextSettingsSave.current = false; return; }
    localStorage.setItem("userSettings", JSON.stringify(userSettings));
    if (isAuthenticated) fetch("/api/user/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userSettings) }).catch(() => { });
  }, [userSettings, isStorageLoaded, isAuthenticated]);

  useEffect(() => {
    const n = messages.filter(m => !readMessageIds.has(m.id) && !dismissedMessageIds.has(m.id)).length;
    const base = originalTitle.current.replace(/^\(\d+\)\s*/, "");
    document.title = n > 0 ? `(${n}) ${base}` : base;
  }, [messages, readMessageIds, dismissedMessageIds]);

  useEffect(() => { setVisibleMessageCount(MESSAGES_PER_PAGE); }, [email, activeTab]);

  const sendNotification = (title: string, body: string) => {
    if (userSettings.sound) try { new Audio("/notification.mp3").play().catch(() => { }); } catch { }
    if (userSettings.notifications && document.visibilityState !== "visible") new Notification(title, { body, icon: "/logo.webp" });
  };
  useEffect(() => { sendNotificationRef.current = sendNotification; });
  useEffect(() => { if (isStorageLoaded) localStorage.setItem("readMessageIds", JSON.stringify([...readMessageIds])); }, [readMessageIds, isStorageLoaded]);
  useEffect(() => { if (isStorageLoaded) localStorage.setItem("dismissedMessageIds", JSON.stringify([...dismissedMessageIds])); }, [dismissedMessageIds, isStorageLoaded]);
  useEffect(() => { if (selectedDomain) localStorage.setItem("lastUsedDomain", selectedDomain); }, [selectedDomain]);

  useEffect(() => {
    if (!email || !email.includes('@')) return;
    if (isAuthenticated && !token) return;
    currentEmailRef.current = email;
    connectWebSocket(email);
    isRefreshingThrottleRef.current = false;
    setIsThrottled(false);
    refreshInbox();
  }, [email, token, isAuthenticated, connectWebSocket]); // eslint-disable-line

  const fetchToken = async () => {
    try {
      const r = await fetch("/api/auth", { method: "POST" });
      if (!r.ok) return null;
      const d = await r.json() as { token?: string };
      if (d.token) { setToken(d.token); setCookie("authToken", d.token, { maxAge: 3600 }); return d.token; }
    } catch { }
    return null;
  };

  // ── refreshInbox — proper error classification with toasts ────────────────
  const refreshInbox = async () => {
    if (isRefreshingThrottleRef.current) return;
    if (isAuthenticated && !token) return;
    isRefreshingThrottleRef.current = true;
    setIsThrottled(true);
    setIsRefreshing(true);
    try {
      const headers: Record<string, string> = { "x-fce-client": "web-client" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch(`${API_ENDPOINT}?fullMailboxId=${email}`, { headers });

      if (!r.ok) {
        let body: { message?: string; code?: string } | null = null;
        try { body = await r.json(); } catch { }
        const retryAfter = r.headers.get("Retry-After");
        const { kind, message, retryAfterSec } = classifyApiError(r.status, body, isPro, retryAfter);
        showApiError(kind, message, retryAfterSec);
        return;
      }

      const d = await r.json();
      setShowAttachmentNotice(!!d.wasAttachmentStripped);
      setDomainExpiry(d.domain_expiry ?? null);
      if (d.success && Array.isArray(d.data)) {
        const newMsgs = d.data.filter((m: Message) => !readMessageIds.has(m.id) && !messages.some(old => old.id === m.id));
        if (newMsgs.length > 0 && messages.length > 0) sendNotification(`New Email from ${parseSenderName(newMsgs[0].from)}`, newMsgs[0].subject || "(No Subject)");
        setMessages(d.data);
        const ids = new Set<string>();
        d.data.forEach((msg: Message) => { if (localStorage.getItem(`saved-msg-${msg.id}`)) ids.add(msg.id); });
        setSavedMessageIds(ids);
      }
    } catch (e) {
      // Actual network error (fetch threw, no response)
      showApiError("network");
    } finally {
      setIsRefreshing(false);
      setTimeout(() => {
        isRefreshingThrottleRef.current = false;
        setIsThrottled(false);
      }, 1000);
    }
  };

  const copyEmail = async () => { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const toggleSaveMessage = async (msg: Message, e: React.MouseEvent) => {
    e.stopPropagation(); if (userPlan !== "free") return;
    if (savedMessageIds.has(msg.id)) {
      localStorage.removeItem(`saved-msg-${msg.id}`);
      setSavedMessageIds(p => { const s = new Set(p); s.delete(msg.id); return s; });
    } else {
      try {
        const headers: Record<string, string> = { "x-fce-client": "web-client" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const r = await fetch(`${API_ENDPOINT}?fullMailboxId=${email}&messageId=${msg.id}`, { headers });
        if (!r.ok) {
          let body: { message?: string; code?: string } | null = null;
          try { body = await r.json(); } catch { }
          const { kind, message } = classifyApiError(r.status, body, isPro);
          showApiError(kind, message);
          return;
        }
        const d = await r.json();
        if (d.success) {
          localStorage.setItem(`saved-msg-${msg.id}`, JSON.stringify(d.data));
          setSavedMessageIds(p => new Set(p).add(msg.id));
        } else {
          showApiError("generic", d.message || "Failed to save message.");
        }
      } catch {
        showApiError("network");
      }
    }
  };

  const handleMessageAction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTab === "dismissed") setDismissedMessageIds(p => { const s = new Set(p); s.delete(id); return s; });
    else setDismissedMessageIds(p => new Set(p).add(id));
  };

  const viewMessage = (msg: Message) => {
    if (!readMessageIds.has(msg.id)) setReadMessageIds(p => new Set(p).add(msg.id));
    setSelectedMessage(msg); if (!isSplit) setIsMessageModalOpen(true);
  };

  const deleteEmail = () => {
    userHasInteractedRef.current = true;

    const allowedDomainsList = fetchedDomains
      .filter(d => checkDomainAllowed(d.domain, fetchedDomains))
      .map(d => d.domain);

    let targetDomain: string;
    if (isPro && customDomainsFromProfile.length > 0) {
      const verifiedCustom = customDomainsFromProfile.filter(d => d.verified);
      if (verifiedCustom.length > 0) {
        targetDomain = verifiedCustom[Math.floor(Math.random() * verifiedCustom.length)].domain;
      } else {
        targetDomain = getPreferredDomain(allowedDomainsList, localStorage.getItem("lastUsedDomain"), freeDomainSet);
      }
    } else {
      targetDomain = getPreferredDomain(allowedDomainsList, localStorage.getItem("lastUsedDomain"), freeDomainSet);
    }

    const ne = generateRandomEmail(targetDomain, isPro);
    setEmail(ne);
    setSelectedDomain(targetDomain);
    setMessages([]);
    setReadMessageIds(new Set());
    setDismissedMessageIds(new Set());
    setDomainExpiry(null);
  };

  const handleDeleteAction = (type: "inbox" | "message", id?: string) => {
    if (!isAuthenticated && type === "message") { setAuthNeedFeature("Delete Message"); setIsAuthNeedOpen(true); return; }
    if (!isPro && type === "message") { openUpsell("Permanent Deletion"); return; }
    if (type === "inbox") deleteEmail(); else if (id) { setItemToDelete({ type: "message", id }); setIsDeleteModalOpen(true); }
  };

  const handleDeleteConfirmation = async () => {
    if (itemToDelete?.type === "email") {
      const allowedDomainsList = fetchedDomains.filter(d => checkDomainAllowed(d.domain, fetchedDomains)).map(d => d.domain);
      const d = getPreferredDomain(allowedDomainsList, localStorage.getItem("primaryDomain"), freeDomainSet);
      const ne = generateRandomEmail(d, isPro);
      setEmail(ne); setSelectedDomain(d); setMessages([]); setReadMessageIds(new Set()); setDismissedMessageIds(new Set()); setDomainExpiry(null);
    } else if (itemToDelete?.type === "message" && itemToDelete.id) {
      try {
        const headers: Record<string, string> = { "x-fce-client": "web-client" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const r = await fetch(`${API_ENDPOINT}?fullMailboxId=${email}&messageId=${itemToDelete.id}`, { method: "DELETE", headers });
        if (!r.ok) {
          let body: { message?: string; code?: string } | null = null;
          try { body = await r.json(); } catch { }
          const { kind, message } = classifyApiError(r.status, body, isPro);
          showApiError(kind, message);
          return;
        }
        const d = await r.json();
        if (d.success) {
          setMessages(msgs => msgs.filter(m => m.id !== itemToDelete.id));
        } else {
          showApiError("generic", d.message || "Delete failed.");
        }
      } catch {
        showApiError("network");
      }
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const changeEmail = () => {
    if (!isAuthenticated) { setIsAuthNeedOpen(true); setAuthNeedFeature("Update Email"); return; }
    if (isEditing) {
      const [p] = email.split("@");
      if (p?.length > 0) {
        if (!checkDomainAllowed(selectedDomain, fetchedDomains)) {
          openUpsell(!fetchedDomains.some(d => d.domain === selectedDomain) ? "Custom Domains" : "Pro Domains");
          return;
        }
        setEmail(`${p}@${selectedDomain}`);
        setIsEditing(false);
        setBlockButtons(false);
        setReadMessageIds(new Set());
        setDismissedMessageIds(new Set());
        setDomainExpiry(null);
      } else {
        showApiError("generic", "Enter a valid email prefix.");
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleUseHistoryEmail = (he: string) => {
    userHasInteractedRef.current = true;
    const domain = he.split("@")[1];
    if (!domain) return;
    if (!checkDomainAllowed(domain, fetchedDomains)) {
      openUpsell(!fetchedDomains.some(d => d.domain === domain) ? "Custom Domains" : "Pro Domains");
      return;
    }
    setEmail(he); setSelectedDomain(domain); setOldEmailUsed(!oldEmailUsed); setDomainExpiry(null);
  };

  const saveInboxNote = useCallback((inbox: string, note: string) => {
    const trimmed = note.trim().slice(0, noteCharLimit);
    const updated = { ...inboxNotes };
    if (trimmed) { updated[inbox] = trimmed; } else { delete updated[inbox]; }
    setInboxNotes(updated);
    localStorage.setItem("inboxNotes", JSON.stringify(updated));
    setEditingNoteInbox(null);
    setNoteInputValue("");
    if (isPro && isAuthenticated) {
      fetch("/api/user/inbox-notes", {
        method: trimmed ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inbox, note: trimmed }),
      }).catch(() => { });
    }
  }, [inboxNotes, noteCharLimit, isPro, isAuthenticated]);

  const handleDeleteInbox = useCallback(async (inbox: string) => {
    setEmailHistory(prev => prev.filter(e => e !== inbox));
    const updated = emailHistory.filter(e => e !== inbox);
    localStorage.setItem("emailHistory", JSON.stringify(updated));
    const updatedNotes = { ...inboxNotes };
    delete updatedNotes[inbox];
    setInboxNotes(updatedNotes);
    localStorage.setItem("inboxNotes", JSON.stringify(updatedNotes));
    if (isAuthenticated) {
      fetch("/api/user/inboxes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inbox }) }).catch(() => { });
    }
  }, [emailHistory, inboxNotes, isAuthenticated]);

  const startEditingNote = useCallback((inbox: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { setAuthNeedFeature("Inbox Notes"); setIsAuthNeedOpen(true); return; }
    setEditingNoteInbox(inbox);
    setNoteInputValue(inboxNotes[inbox] ?? "");
  }, [inboxNotes, isAuthenticated]);

  const cancelEditingNote = useCallback(() => { setEditingNoteInbox(null); setNoteInputValue(""); }, []);

  const handleProShortcut = (fn: () => void, name: string) => { if (isPro) fn(); else openUpsell(`Keyboard Shortcut: ${name}`); };
  const handleAuthShortcut = (fn: () => void, name: string) => { if (isAuthenticated) fn(); else { setAuthNeedFeature(`Keyboard Shortcut: ${name}`); setIsAuthNeedOpen(true); } };

  useKeyboardShortcuts({
    [userSettings.shortcuts.refresh]: () => handleAuthShortcut(refreshInbox, "Refresh"),
    [userSettings.shortcuts.copy]: () => handleAuthShortcut(copyEmail, "Copy Email"),
    [userSettings.shortcuts.delete]: () => handleDeleteAction("inbox"),
    [userSettings.shortcuts.new]: () => handleProShortcut(changeEmail, "Quick Edit"),
    [userSettings.shortcuts.qr]: () => setIsQRModalOpen(!isQRModalOpen),
  }, "pro");

  const filteredMessages = useMemo(() => {
    if (activeTab === "dismissed") return messages.filter(m => dismissedMessageIds.has(m.id));
    const base = messages.filter(m => !dismissedMessageIds.has(m.id));
    const pinned = base.filter(m => pinnedMessageIds.includes(m.id));
    const unpinned = base.filter(m => !pinnedMessageIds.includes(m.id));
    return [...pinned, ...unpinned];
  }, [messages, activeTab, dismissedMessageIds, pinnedMessageIds]);

  const visibleMessages = useMemo(() => filteredMessages.slice(0, visibleMessageCount), [filteredMessages, visibleMessageCount]);
  const hiddenCount = filteredMessages.length - visibleMessages.length;

  useEffect(() => {
    if (typeof document !== "undefined") document.body.setAttribute("data-fce-layout", userSettings.layout);
    return () => { if (typeof document !== "undefined") document.body.removeAttribute("data-fce-layout"); };
  }, [userSettings.layout]);

  const canHaveMoreHistory = emailHistory.length > HISTORY_DEFAULT_SHOW;
  const sortedHistory = useMemo(() => {
    const pinned = emailHistory.filter(e => pinnedInboxes.includes(e));
    const rest = emailHistory.filter(e => !pinnedInboxes.includes(e));
    return [...pinned, ...rest];
  }, [emailHistory, pinnedInboxes]);
  const visibleHistory = canHaveMoreHistory && !historyExpanded ? sortedHistory.slice(0, HISTORY_DEFAULT_SHOW) : sortedHistory;
  const hiddenHistoryCount = emailHistory.length - HISTORY_DEFAULT_SHOW;

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
    if (unseenSettingsFeatures.size > 0) {
      const allFeatures = ["categorization"];
      localStorage.setItem("seenSettingsFeatures", JSON.stringify(allFeatures));
      setUnseenSettingsFeatures(new Set());
    }
  };

  // ── RENDER HELPERS ────────────────────────────────────────────────────────

  const renderEmptyState = () => (
    <div className="py-14 flex flex-col items-center text-center px-6">
      <button onClick={() => setIsCliModalOpen(true)}
        className="mb-5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors group">
        <span>$</span><span>fce watch {email || "random"}</span>
        <span className="inline-block w-1.5 h-3.5 bg-muted-foreground/30 group-hover:bg-primary/50 animate-pulse" />
      </button>
      <p className="font-mono text-xs text-muted-foreground/80 mb-1">{activeTab === "all" ? t("inbox_empty_title") : "No dismissed emails"}</p>
      <p className="font-mono text-[11px] text-muted-foreground/70 max-w-xs">{activeTab === "all" ? t("inbox_empty_subtitle") : "Dismissed emails appear here."}</p>
      {activeTab === "all" && !isPro && (
        <div className="mt-6 border border-dashed border-border rounded-lg px-5 py-3 max-w-xs space-y-1.5">
          <p className="font-mono text-[10px] text-muted-foreground/80">Need a real phone number for OTP verification?</p>
          <a rel="sponsored" href={PHONE_AFFILIATE_URL} target="_blank"
            className="inline-flex items-center gap-1 font-mono text-[10px] text-foreground underline underline-offset-2 decoration-border hover:decoration-foreground">
            <Zap className="h-3 w-3" />Get one instantly →
          </a>
        </div>
      )}
    </div>
  );

  const renderInboxList = () => (
    <div className="relative">
      <style>{`
        @keyframes rowEnter { 0%{opacity:0;transform:translateX(-6px);background-color:hsl(var(--foreground)/0.04)} 35%{opacity:1;transform:translateX(0);background-color:hsl(var(--foreground)/0.04)} 100%{background-color:transparent} }
        @keyframes glowFadeOut { 0%{opacity:1}70%{opacity:1}100%{opacity:0} }
      `}</style>
      <div className="grid items-center border-b border-border bg-muted/20 px-3 py-1.5"
        style={{ gridTemplateColumns: "1.25rem 1fr 3.5rem 4.5rem" }}>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">#</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70 pl-2">From · Subject</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70 text-right">Time</span>
        <span />
      </div>
      {filteredMessages.length === 0 ? renderEmptyState() : (
        <>
          <div className="divide-y divide-border/50">
            {visibleMessages.map((msg, idx) => {
              const isRead = readMessageIds.has(msg.id);
              const isSelected = selectedMessage?.id === msg.id;
              const isNew = newRowIds.has(msg.id);
              const isPinned = pinnedMessageIds.includes(msg.id);
              return (
                <div key={msg.id} onClick={() => viewMessage(msg)}
                  className={cn(
                    "group relative cursor-pointer transition-all duration-200",
                    "grid items-center px-3 gap-0",
                    isCompact ? "py-1.5" : "py-2.5",
                    isSelected && isSplit ? "bg-foreground/5 border-l-2 border-l-foreground" : "hover:bg-muted/25",
                    isPinned && "bg-amber-500/3 border-l-2 border-l-amber-500/40",
                    isNew && "[animation:rowEnter_0.45s_ease-out]",
                  )}
                  style={{ gridTemplateColumns: "1.25rem 1fr 3.5rem 4.5rem" }}>
                  {isNew && <div className="absolute inset-y-0 left-0 w-0.5 bg-emerald-500 [animation:glowFadeOut_1.4s_ease-out_forwards]" />}
                  <span className={cn("font-mono text-[10px] tabular-nums shrink-0", isNew ? "text-emerald-500 font-bold" : isPinned ? "text-amber-500/60" : "text-muted-foreground/30")}>
                    {isNew ? "→" : isPinned ? "↑" : String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex flex-col gap-0.5 pl-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {!isCompact && <BrandAvatar from={msg.from} size={20} className="shrink-0" />}
                      <span className={cn("font-mono text-xs truncate", isRead ? "text-muted-foreground" : "text-foreground font-semibold")}>
                        {parseSenderName(msg.from)}
                      </span>
                      {!isRead && <span className="h-1 w-1 rounded-full bg-foreground shrink-0" />}
                      {isPinned && <Pin className="h-2.5 w-2.5 text-amber-500/60 shrink-0 fill-amber-500/30" />}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pl-0 sm:pl-7">
                      <span className={cn("font-mono text-[11px] truncate flex-1", isRead ? "text-muted-foreground/70" : "text-muted-foreground")}>
                        {msg.subject || "(no subject)"}
                      </span>
                      {renderBadges(msg)}
                      {msg.hasAttachments && <Paperclip className="h-2.5 w-2.5 text-muted-foreground/35 shrink-0" />}
                    </div>
                    {!isCompact && !isPro && (
                      <button type="button"
                        className="font-mono text-[10px] text-muted-foreground/35 hover:text-amber-500/80 flex items-center gap-1 pl-0 sm:pl-7 transition-colors text-left"
                        title="Upgrade to Pro — emails never expire">
                        <Clock className="h-2.5 w-2.5 shrink-0" />
                        expires {getExpiry(msg.date, isAuthenticated ? 24 : 10)}
                      </button>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/70 text-right tabular-nums">{fmtDateShort(msg.date)}</span>
                  <div className="flex items-center justify-end gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pl-1">
                    <PinButton isPinned={isPinned} onClick={(e) => togglePinMessage(msg.id, e)} hidden={isPro && !isPinned && pinnedMessageIds.length >= PRO_PIN_MSG_LIMIT} />
                    {userPlan === "free" && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => toggleSaveMessage(msg, e)}>
                        <Star className={cn("h-3 w-3", savedMessageIds.has(msg.id) && "fill-amber-500 text-amber-500")} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDeleteAction("message", msg.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={(e) => handleMessageAction(msg.id, e)}>
                      {activeTab === "dismissed" ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {hiddenCount > 0 && (
            <div className="border-t border-border/50 px-3 py-2 flex items-center justify-between bg-muted/5">
              <span className="font-mono text-[10px] text-muted-foreground/50 tabular-nums">{visibleMessages.length} of {filteredMessages.length}</span>
              <button onClick={() => setVisibleMessageCount(c => c + MESSAGES_PER_PAGE)}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 underline underline-offset-2 decoration-border hover:decoration-foreground">
                Show {Math.min(hiddenCount, MESSAGES_PER_PAGE)} more<ChevronDown className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
          {hiddenCount === 0 && filteredMessages.length > MESSAGES_PER_PAGE && (
            <div className="border-t border-border/50 px-3 py-2 flex items-center justify-end bg-muted/5">
              <button onClick={() => setVisibleMessageCount(MESSAGES_PER_PAGE)}
                className="font-mono text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors flex items-center gap-1">
                <ChevronUp className="h-2.5 w-2.5" />Collapse
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderMobileMessageList = () => (
    <div className="flex flex-col gap-2 py-2 px-3">
      {filteredMessages.slice(0, visibleMessageCount).map(msg => {
        const isPinned = pinnedMessageIds.includes(msg.id);
        return (
          <div key={msg.id} onClick={() => viewMessage(msg)}
            className={cn("bg-card border border-border rounded-lg p-3 active:scale-[0.98] transition-transform flex items-center justify-between gap-3", isPinned && "border-amber-500/30 bg-amber-500/3")}>
            <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
              <div className="flex items-center gap-2">
                <BrandAvatar from={msg.from} size={16} />
                <span className="font-mono text-xs font-semibold truncate text-foreground">{parseSenderName(msg.from)}</span>
                {isPinned && <Pin className="h-2.5 w-2.5 text-amber-500/60 fill-amber-500/30 shrink-0" />}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] text-muted-foreground truncate">{msg.subject || "(No Subject)"}</span>
                {renderBadges(msg)}
              </div>
              <span className="font-mono text-[10px] text-muted-foreground/70">{fmtDate(msg.date)}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <PinButton isPinned={isPinned} onClick={(e) => togglePinMessage(msg.id, e)} size="xs" hidden={isPro && !isPinned && pinnedMessageIds.length >= PRO_PIN_MSG_LIMIT} />
              <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
            </div>
          </div>
        );
      })}
      {filteredMessages.length === 0 && renderEmptyState()}
      {filteredMessages.length > visibleMessageCount && (
        <button onClick={() => setVisibleMessageCount(c => c + MESSAGES_PER_PAGE)}
          className="w-full py-2.5 font-mono text-[11px] text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg transition-colors flex items-center justify-center gap-1.5">
          Show {Math.min(filteredMessages.length - visibleMessageCount, MESSAGES_PER_PAGE)} more<ChevronDown className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  const renderClassicMessageList = () => (
    <div className="overflow-x-auto">
      <Table><TableBody>
        {filteredMessages.length === 0
          ? <tr><td colSpan={4} className="py-8">{renderEmptyState()}</td></tr>
          : filteredMessages.slice(0, visibleMessageCount).map((msg, i) => {
            const isPinned = pinnedMessageIds.includes(msg.id);
            return (
              <TableRow key={msg.id} className={cn("border-b border-border/50 transition-colors", i % 2 === 0 ? "bg-muted/10" : "bg-background", "hover:bg-muted/20", isPinned && "bg-amber-500/5")}>
                <td className="py-2 pl-3">
                  <div className="flex items-center gap-2">
                    <BrandAvatar from={msg.from} size={16} />
                    <span className="font-mono text-xs truncate max-w-[120px] text-muted-foreground">{parseSenderName(msg.from)}</span>
                    {isPinned && <Pin className="h-2.5 w-2.5 text-amber-500/60 fill-amber-500/30 shrink-0" />}
                  </div>
                </td>
                <td className="py-2 px-2"><div className="flex items-center gap-2 flex-wrap"><span className="font-mono text-xs text-foreground">{msg.subject}</span>{renderBadges(msg)}</div></td>
                <td className="py-2 px-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{fmtDateShort(msg.date)}</td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-1">
                    <PinButton isPinned={isPinned} onClick={(e) => togglePinMessage(msg.id, e)} size="xs" hidden={isPro && !isPinned && pinnedMessageIds.length >= PRO_PIN_MSG_LIMIT} />
                    <Button variant="link" size="sm" className="h-6 px-2 font-mono text-[10px]" onClick={() => viewMessage(msg)}>{t("view")}</Button>
                    <Button variant="link" size="sm" className="h-6 px-2 font-mono text-[10px] text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteAction("message", msg.id); }}>{t("delete")}</Button>
                    {userPlan === "free" && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => toggleSaveMessage(msg, e)}><Star className={cn("h-3 w-3", savedMessageIds.has(msg.id) && "fill-amber-500 text-amber-500")} /></Button>}
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={(e) => handleMessageAction(msg.id, e)}>
                      {activeTab === "dismissed" ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                    </Button>
                  </div>
                </td>
              </TableRow>
            );
          })}
        {filteredMessages.length > visibleMessageCount && (
          <tr><td colSpan={4} className="py-2 px-3 border-t border-border/50">
            <button onClick={() => setVisibleMessageCount(c => c + MESSAGES_PER_PAGE)}
              className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
              Show {Math.min(filteredMessages.length - visibleMessageCount, MESSAGES_PER_PAGE)} more…
            </button>
          </td></tr>
        )}
      </TableBody></Table>
    </div>
  );

  const renderRetroMessageList = () => (
    <div style={{ fontFamily: '"Times New Roman",serif', background: "white", color: "black", padding: 20, minHeight: "100vh" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>Email Box 1.0</h1>
      <div style={{ marginBottom: 20 }}>Welcome, <b>{email}</b>. [<a href="#" onClick={(e) => { e.preventDefault(); refreshInbox(); }} style={{ color: "blue" }}>Refresh</a>] [<a href="#" onClick={(e) => { e.preventDefault(); handleOpenSettings(); }} style={{ color: "blue" }}>Settings</a>]</div>
      <hr /><ul style={{ listStyle: "disc", paddingLeft: 20, marginTop: 10 }}>
        {filteredMessages.length === 0 ? <li>No messages.</li> : filteredMessages.map(msg => (
          <li key={msg.id} style={{ marginBottom: 5 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); viewMessage(msg); }} style={{ color: "blue" }}>{msg.subject || "(No Subject)"}</a>
            <span style={{ fontSize: 12, color: "#555" }}> - {parseSenderName(msg.from)} ({fmtDate(msg.date)})</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderHistorySection = () => (
    <div className="flex-1 px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t("history_title")}</p>
        {isPro && <span className="inline-flex items-center gap-1 font-mono text-[9px] text-muted-foreground/50"><Cloud className="h-2.5 w-2.5" />synced</span>}
        {!isPro && (
          <button type="button" onClick={() => openUpsell("Cloud-Synced Inbox Notes")}
            className="inline-flex items-center gap-1 font-mono text-[9px] text-muted-foreground/40 hover:text-amber-500/80 transition-colors">
            <Cloud className="h-2.5 w-2.5" />not synced
          </button>
        )}
      </div>
      <ul className="space-y-0 divide-y divide-border/30">
        {visibleHistory.map((he, i) => {
          const note = inboxNotes[he];
          const isEditingThis = editingNoteInbox === he;
          const charCount = noteInputValue.length;
          const nearLimit = charCount >= Math.floor(noteCharLimit * 0.85);
          const atLimit = charCount >= noteCharLimit;
          const isActive = he === email;
          const isInboxPinned = pinnedInboxes.includes(he);
          const showHint = i === 0 && !note && !isEditingThis && !noteHintDismissed;
          const dismissHint = (e: React.MouseEvent) => {
            localStorage.setItem("noteHintSeen", "1");
            setNoteHintDismissed(true);
            startEditingNote(he, e);
          };
          return (
            <li key={i} className="group py-2 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 min-w-0">
                {isInboxPinned && <Pin className="h-2.5 w-2.5 text-amber-500/60 fill-amber-500/30 shrink-0" />}
                <span className={cn("font-mono text-[11px] min-w-0 truncate transition-colors shrink-0", isActive ? "text-foreground font-medium" : "text-muted-foreground/80 group-hover:text-muted-foreground")}>{he}</span>
                {!isEditingThis && !note && !showHint && (
                  <button type="button" onClick={(e) => startEditingNote(he, e)} title="Add note" aria-label="Add note"
                    className="hidden md:flex shrink-0 items-center gap-1 font-mono text-[10px] text-muted-foreground/25 hover:text-muted-foreground/60 transition-colors opacity-0 group-hover:opacity-100">
                    <FileText className="h-2.5 w-2.5" /><span>add note</span>
                  </button>
                )}
                {showHint && (
                  <button type="button" onClick={dismissHint} aria-label="Try adding a note"
                    className="hidden md:flex items-center gap-1 min-w-0 max-w-[200px] group/hint text-left">
                    <FileText className="h-2.5 w-2.5 text-amber-500/50 shrink-0 animate-pulse" />
                    <span className="font-mono text-[11px] text-amber-500/60 italic truncate group-hover/hint:text-amber-500 transition-colors border-b border-dashed border-amber-500/30">click me to edit ✏</span>
                  </button>
                )}
                {!isEditingThis && note && (
                  <button type="button" onClick={(e) => startEditingNote(he, e)} aria-label="Edit note"
                    className="hidden md:flex items-center gap-1 min-w-0 max-w-[200px] group/note text-left transition-colors">
                    <FileText className="h-2.5 w-2.5 text-amber-500/60 shrink-0" />
                    <span className="font-mono text-[11px] text-muted-foreground/55 italic truncate group-hover/note:text-muted-foreground transition-colors">{note}</span>
                  </button>
                )}
                <span className="flex-1" />
                {!(isPro && !isInboxPinned && pinnedInboxes.length >= PRO_PIN_INBOX_LIMIT) && (
                  <button type="button" aria-label={isInboxPinned ? "Unpin inbox" : "Pin inbox"}
                    onClick={(e) => togglePinInbox(he, e)}
                    className={cn("shrink-0 h-6 w-6 flex items-center justify-center rounded transition-all", isInboxPinned ? "text-amber-500 hover:bg-amber-500/10" : "opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/60")}>
                    <Pin className={cn("h-3 w-3", isInboxPinned && "fill-amber-500/50")} />
                  </button>
                )}
                <button type="button" aria-label={note ? "Edit note" : "Add note"}
                  onClick={(e) => { if (isEditingThis) return; startEditingNote(he, e); }}
                  className={cn("md:hidden shrink-0 h-6 w-6 flex items-center justify-center rounded transition-all", note ? "text-amber-500/80 hover:text-amber-500 hover:bg-amber-500/10" : "opacity-0 group-hover:opacity-100 text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/60")}>
                  <FileText className="h-3 w-3" />
                </button>
                <button onClick={() => handleUseHistoryEmail(he)}
                  className="font-mono text-[10px] text-foreground/50 hover:text-foreground transition-colors whitespace-nowrap shrink-0 underline underline-offset-2 decoration-border hover:decoration-foreground">
                  {t("history_use")}
                </button>
              </div>
              {showHint && (
                <button type="button" onClick={dismissHint} aria-label="Try adding a note"
                  className="md:hidden mt-1 flex items-center gap-1.5 w-full text-left">
                  <FileText className="h-2.5 w-2.5 text-amber-500/50 shrink-0 animate-pulse" />
                  <span className="font-mono text-[11px] text-amber-500/60 italic border-b border-dashed border-amber-500/30 hover:text-amber-500 transition-colors">click me to edit ✏</span>
                </button>
              )}
              {isEditingThis && (
                <div className="mt-1.5 space-y-1.5">
                  <div className="flex gap-1.5 items-start">
                    <textarea value={noteInputValue}
                      onChange={(e) => setNoteInputValue(e.target.value.slice(0, noteCharLimit))}
                      placeholder="Type your note… (Enter to save, Esc to cancel)"
                      rows={1} autoFocus
                      onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveInboxNote(he, noteInputValue); }
                        if (e.key === "Escape") cancelEditingNote();
                      }}
                      style={{ minHeight: "28px", overflow: "hidden" }}
                      className="flex-1 resize-none rounded-md border bg-muted/20 px-2.5 py-1.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-1 focus:border-foreground/25 focus:ring-foreground/10 transition-all duration-150 border-border leading-relaxed"
                    />
                    <div className="flex flex-col gap-1 shrink-0">
                      <button type="button" aria-label="Save note" onClick={() => saveInboxNote(he, noteInputValue)}
                        className="h-6 w-6 flex items-center justify-center rounded border border-border bg-background hover:bg-muted text-foreground/60 hover:text-foreground transition-colors">
                        <Check className="h-3 w-3" />
                      </button>
                      <button type="button" aria-label="Cancel" onClick={cancelEditingNote}
                        className="h-6 w-6 flex items-center justify-center rounded border border-border bg-background hover:bg-muted text-muted-foreground/60 hover:text-foreground transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-0.5">
                    <span className={cn("font-mono text-[10px] tabular-nums transition-colors", atLimit ? "text-red-500" : nearLimit ? "text-amber-500" : "text-muted-foreground/40")}>
                      {charCount} / {noteCharLimit}
                    </span>
                    {!isPro && nearLimit && (
                      <button type="button" onClick={() => openUpsell("Extended Inbox Notes")} className="font-mono text-[10px] text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:no-underline transition-colors">Upgrade for 500 chars →</button>
                    )}
                    {isPro && <span className="font-mono text-[10px] text-muted-foreground/35 flex items-center gap-1"><Cloud className="h-2.5 w-2.5" />syncs to cloud</span>}
                    {!isPro && !nearLimit && (
                      <button type="button" onClick={() => openUpsell("Cloud-Synced Inbox Notes")} className="font-mono text-[10px] text-muted-foreground/30 hover:text-amber-500/70 transition-colors">not synced ↗</button>
                    )}
                  </div>
                </div>
              )}
              {!isEditingThis && note && (
                <div className="md:hidden mt-1 flex items-center gap-1.5 group/note cursor-pointer"
                  onClick={(e) => startEditingNote(he, e as any)} role="button" aria-label="Edit note">
                  <FileText className="h-2.5 w-2.5 text-amber-500/50 shrink-0" />
                  <span className="font-mono text-[11px] text-muted-foreground/55 italic flex-1 leading-relaxed line-clamp-2 group-hover/note:text-muted-foreground transition-colors">{note}</span>
                  <button type="button" aria-label="Remove note" onClick={(e) => { e.stopPropagation(); saveInboxNote(he, ""); }}
                    className="shrink-0 opacity-0 group-hover/note:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
              {!note && !isEditingThis && (
                <button type="button" onClick={(e) => startEditingNote(he, e)}
                  className="md:hidden mt-1 font-mono text-[10px] text-muted-foreground/25 hover:text-muted-foreground/50 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100">
                  <FileText className="h-2.5 w-2.5" />add note
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {canHaveMoreHistory && (
        <button type="button" onClick={() => setHistoryExpanded(v => !v)}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 font-mono text-[10px] text-muted-foreground/50 hover:text-muted-foreground border border-dashed border-border/50 hover:border-border rounded-md transition-all">
          {historyExpanded ? (<><ChevronUp className="h-2.5 w-2.5" />Show less</>) : (<><ChevronDown className="h-2.5 w-2.5" />{hiddenHistoryCount} more inbox{hiddenHistoryCount !== 1 ? "es" : ""}</>)}
        </button>
      )}
      {(pinnedInboxes.length > 0 || pinnedMessageIds.length > 0) && (
        <p className="mt-2 font-mono text-[9px] text-muted-foreground/30 text-center">
          {pinnedInboxes.length}/{getInboxPinLimit()} inboxes · {pinnedMessageIds.length}/{getMsgPinLimit()} msgs pinned
        </p>
      )}
    </div>
  );

  if (isRetro) return (
    <>{renderRetroMessageList()}
      <style dangerouslySetInnerHTML={{ __html: `body[data-fce-layout="retro"] header, body[data-fce-layout="retro"] footer, body[data-fce-layout="retro"] nav { display: none !important; }` }} />
      <MessageModal message={selectedMessage} isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} isPro={isPro} onUpsell={() => openUpsell("Attachments")} apiEndpoint={API_ENDPOINT} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={userSettings} onUpdate={setUserSettings} isPro={isPro} onUpsell={openUpsell} isAuthenticated={isAuthenticated} onAuthNeed={(f: string) => { setAuthNeedFeature(f); setIsAuthNeedOpen(true); }} />
    </>
  );

  return (
    <div className={cn("relative", isZen && "")}>
      <style dangerouslySetInnerHTML={{
        __html: `
        body[data-fce-layout="zen"] header, body[data-fce-layout="zen"] footer, body[data-fce-layout="zen"] nav { display: none !important; }
        body[data-fce-layout="minimal"] footer { display: none !important; }
      ` }} />

      {flashQueue.length > 0 && <NewEmailFlash key={flashQueue[0].id} from={flashQueue[0].from} subject={flashQueue[0].subject} onDone={() => setFlashQueue(q => q.slice(1))} />}

      <div className={cn("rounded-lg border border-border bg-background overflow-hidden", isZen && "border-0 bg-transparent")}>
        <div className="border-b border-border">
          <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isRefreshing ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse")} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">SMTP · {email.split("@")[1] || "…"}</span>
            <div className="flex-1" />
            <span className="font-mono text-[10px] text-muted-foreground/70 tabular-nums">{messages.length} msg{messages.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-start gap-2 px-4 pb-3 pt-0.5">
            {isEditing ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={email.split("@")[0]}
                  onChange={(e) => {
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "");
                    setEmail(`${v}@${selectedDomain}`);
                    setBlockButtons(v.length === 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsEditing(false);
                      setBlockButtons(false);
                    }
                  }}
                  className="flex-1 font-mono text-sm h-9"
                  placeholder={t("placeholder_username")}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shrink-0 font-mono text-xs h-9 gap-1 max-w-[160px]">
                      <span className="truncate">@{selectedDomain}</span><ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[min(100%,14rem)] max-h-[60vh] overflow-y-auto p-1 rounded-md bg-background shadow-lg border border-border z-50">
                    {availableDomains.map(d => {
                      const fetchedDomain = fetchedDomains.find(fd => fd.domain === d);
                      const isFetchedFree = freeDomainSet.has(d);
                      const isFetchedPro = fetchedDomain?.tier === "pro";
                      const isUserCustom = !isFetchedFree && !isFetchedPro;
                      const isProLocked = isFetchedPro && !isPro;
                      const tags = fetchedDomain?.tags || [];
                      const isNew = tags.includes("new");
                      const isFeatured = tags.includes("featured");
                      const isPopular = tags.includes("popular");
                      return (
                        <DropdownMenuItem key={d}
                          onSelect={() => {
                            if (isProLocked) { openUpsell("Pro Domains"); return; }
                            if (isUserCustom && !isPro) { openUpsell("Custom Domains"); return; }
                            setSelectedDomain(d); setEmail(`${email.split("@")[0]}@${d}`);
                          }}
                          className="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-muted font-mono text-xs">
                          <div className="flex items-center gap-2">
                            {(isUserCustom || isFetchedPro) && <Crown className="h-3 w-3 text-amber-500" />}
                            {isProLocked && <Lock className="h-3 w-3 text-amber-500" />}
                            <span>@{d}</span>
                            <div className="flex gap-1.5">
                              {isFeatured && <span className="font-mono text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded px-1 py-px uppercase tracking-wider">Top</span>}
                              {isPopular && !isFeatured && <span className="font-mono text-[9px] bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded px-1 py-px uppercase tracking-wider">Hot</span>}
                              {isNew && <span className="font-mono text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded px-1 py-px uppercase tracking-wider">New</span>}
                              {isProLocked && <span className="font-mono text-[9px] text-amber-500 uppercase tracking-wider">Pro</span>}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-transparent shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isPro) { openUpsell("Priority Domain"); return; }
                              const c = localStorage.getItem("primaryDomain");
                              if (c === d) { localStorage.removeItem("primaryDomain"); setPrimaryDomain(null); }
                              else { localStorage.setItem("primaryDomain", d); setPrimaryDomain(d); }
                            }}>
                            <Star className={cn("h-3 w-3", primaryDomain === d ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
                          </Button>
                        </DropdownMenuItem>
                      );
                    })}
                    {!isPro && (
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openUpsell("Premium Domains"); }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 mt-1 rounded cursor-pointer font-mono text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-transparent hover:border-amber-500/20 transition-colors">
                        <Lock className="h-3 w-3 shrink-0" /><span>Get more domains</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 group hover:border-foreground/30 transition-colors cursor-text"
                  onClick={isAuthenticated ? () => { setIsEditing(true); setDiscoveredUpdates({ newDomains: true }); } : undefined}>
                  <span className="font-mono text-[10px] text-muted-foreground/70 shrink-0 select-none">TO</span>
                  {email ? (
                    <span className="font-mono text-sm text-foreground flex-1 truncate">{email}</span>
                  ) : (
                    <div className="h-3 flex-1 rounded bg-muted/60 animate-pulse max-w-[200px]" />
                  )}
                  {isAuthenticated && (
                    <div className="relative flex items-center justify-center">
                      <Edit className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      {hasNewDomain && !discoveredUpdates.newDomains && <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    </div>
                  )}
                </div>
                {!isPro && (
                  <p className="font-mono text-[10px] text-muted-foreground/70 mt-1 pl-1">
                    Need OTP phone?{" "}
                    <a rel="sponsored" href={PHONE_AFFILIATE_URL} target="_blank" className="text-foreground/60 hover:text-foreground underline underline-offset-2 transition-colors">Get one instantly →</a>
                  </p>
                )}
              </div>
            )}
            <TooltipProvider delayDuration={200}>
              <div className="flex gap-1.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button aria-label="Copy email address" variant="outline" size="icon" className="h-9 w-9 relative" onClick={copyEmail} disabled={blockButtons}>
                      <Copy className={cn("h-3.5 w-3.5 absolute transition-all", copied && "opacity-0 scale-75")} />
                      <Check className={cn("h-3.5 w-3.5 absolute transition-all", !copied && "opacity-0 scale-75")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="font-mono text-[10px]">Copy · C</p></TooltipContent>
                </Tooltip>
                <Button aria-label="Show QR Code" variant="outline" size="icon" className="h-9 w-9 hidden sm:flex" onClick={() => setIsQRModalOpen(true)} disabled={blockButtons}>
                  <QrCode className="h-3.5 w-3.5" />
                </Button>
                <div className="relative">
                  <Button aria-label="Open settings" variant="outline" size="icon" className="h-9 w-9" onClick={handleOpenSettings} disabled={blockButtons}>
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                  {unseenSettingsFeatures.size > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse pointer-events-none" />
                  )}
                </div>
                <ShareDropdown />
              </div>
            </TooltipProvider>
          </div>
          {!isZen && (
            <div className="flex gap-px border-t border-border" style={{ background: "var(--border)" }}>
              {([
                {
                  icon: <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />,
                  label: isRefreshing ? t("refreshing") : isThrottled ? "wait…" : t("refresh"),
                  hint: "R",
                  disabled: blockButtons || isRefreshing || isThrottled,
                  onClick: refreshInbox,
                },
                {
                  icon: isEditing ? <CheckCheck className="h-3 w-3" /> : <Edit className="h-3 w-3" />,
                  label: isEditing ? t("save") : t("change"),
                  hint: "N",
                  disabled: blockButtons,
                  onClick: () => { changeEmail(); setDiscoveredUpdates({ newDomains: true }); },
                  hasBadge: hasNewDomain && !discoveredUpdates.newDomains && !isEditing,
                },
                { icon: <Trash2 className="h-3 w-3" />, label: t("delete"), hint: "D", disabled: blockButtons, onClick: () => handleDeleteAction("inbox") },
                { icon: <ListOrdered className="h-3 w-3" />, label: "Manage", hint: "", disabled: false, onClick: () => { if (isPro) setIsManageModalOpen(true); else openUpsell("Inbox Management"); } },
              ] as const).map(({ icon, label, hint, disabled, onClick, hasBadge }) => (
                <button key={label} disabled={disabled as boolean} onClick={onClick as () => void}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-background hover:bg-muted/30 transition-colors font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed">
                  <div className="relative flex items-center justify-center">
                    {icon}
                    {hasBadge && <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                  </div>
                  <span className="sr-only sm:not-sr-only sm:inline">{label}</span>
                  {hint && <span className="hidden sm:inline font-mono text-[9px] text-muted-foreground/35 normal-case tracking-normal">{hint}</span>}
                </button>
              ))}
            </div>
          )}
          {!isZen && (
            <div className="flex gap-px border-t border-border" style={{ background: "var(--border)" }}>
              {(["all", "dismissed"] as const).map(tab => {
                const unread = tab === "all" ? filteredMessages.filter(m => !readMessageIds.has(m.id)).length : 0;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors",
                      activeTab === tab ? "bg-background text-foreground" : "bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground")}>
                    {tab === "all" ? <Mail className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                    {tab}
                    {unread > 0 && <span className="font-mono text-[9px] border border-border rounded-sm px-1 py-px tabular-nums leading-none">{unread}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {domainExpiry && <DomainExpiryBanner expiry={domainExpiry} isPro={isPro} onUpsell={openUpsell} />}

        {isSplit ? (
          <div className="grid grid-cols-1 md:grid-cols-2 h-[560px]">
            <div className="border-r border-border overflow-y-auto">{renderInboxList()}</div>
            <div className="overflow-hidden flex flex-col bg-muted/5">
              {selectedMessage
                ? <SplitPaneMessageView message={selectedMessage} token={token} apiEndpoint={API_ENDPOINT} isPro={isPro} onUpsell={openUpsell} />
                : <div className="flex flex-col items-center justify-center h-full gap-2"><Mail className="w-8 h-8 opacity-15" /><span className="font-mono text-[11px] text-muted-foreground/70">select a message</span></div>
              }
            </div>
          </div>
        ) : isClassic ? renderClassicMessageList()
          : isMobile ? renderMobileMessageList()
            : renderInboxList()
        }

        {!isZen && (
          <div className="border-t border-border">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
              {renderHistorySection()}
              {!isPro && <div className="md:w-72 shrink-0 px-4 py-4"><PhonePromoCard /></div>}
            </div>
          </div>
        )}

        {!isZen && (
          <div className="border-t border-border px-4 py-3 bg-muted/5 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Inbox</p>
              <h2 className="text-sm font-semibold text-foreground">{t("card_header_title")}</h2>
              <p className="font-mono text-[11px] text-muted-foreground/80 mt-0.5 leading-relaxed">{t("card_header_p")}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 font-mono text-[10px] text-muted-foreground hover:text-foreground shrink-0 gap-2 border border-transparent hover:border-border" onClick={() => setIsCliModalOpen(true)}>
              <Download className="h-3 w-3" />Install CLI
            </Button>
          </div>
        )}

        {showAttachmentNotice && !isZen && (
          <div className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-2.5 cursor-pointer hover:bg-amber-500/10 transition-colors" onClick={() => openUpsell("Large Attachments")}>
            <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Lock className="h-3 w-3" />Large attachment stripped — upgrade to Pro to receive files up to 25 MB
            </span>
          </div>
        )}
      </div>

      <ManageInboxesModal onDeleteInbox={handleDeleteInbox} isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} inboxes={emailHistory} currentInbox={email} onSelectInbox={(he) => { setEmail(he); setSelectedDomain(he.split("@")[1]); setIsEditing(false); setDomainExpiry(null); }} />
      <QRCodeModal email={email} isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
      <CliModal email={email} isOpen={isCliModalOpen} onClose={() => setIsCliModalOpen(false)} />
      <MessageModal message={selectedMessage} isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} isPro={isPro} onUpsell={() => openUpsell("Attachments")} apiEndpoint={API_ENDPOINT} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={userSettings} onUpdate={setUserSettings} isPro={isPro} onUpsell={openUpsell} isAuthenticated={isAuthenticated} onAuthNeed={(f: string) => { setAuthNeedFeature(f); setIsAuthNeedOpen(true); }} />
      <UpsellModal isOpen={isUpsellOpen} onClose={() => setIsUpsellOpen(false)} featureName={upsellFeature} />
      <AuthNeed isOpen={isAuthNeedOpen} onClose={() => setIsAuthNeedOpen(false)} featureName={authNeedFeature} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirmation} itemToDelete={itemToDelete?.type === "email" ? "email address" : "message"} />
    </div>
  );
}