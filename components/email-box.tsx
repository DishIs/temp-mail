"use client";

import { useState, useEffect, useMemo, useRef, useCallback, MouseEventHandler } from "react";
import { getCookie, setCookie } from "cookies-next";
import {
  Mail, RefreshCw, Trash2, Edit, QrCode, Copy, Check, CheckCheck,
  Star, ListOrdered, Clock, EyeOff, Archive, ArchiveRestore,
  Settings, Crown, ChevronRight, Loader, Paperclip, ShieldCheck,
  Lock, ExternalLink, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { QRCodeModal } from "./qr-code-modal";
import { cn } from "@/lib/utils";
import { MessageModal } from "./message-modal";
import { ErrorPopup } from "./error-popup";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { ShareDropdown } from "./ShareDropdown";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Session } from "next-auth";
import { ManageInboxesModal } from "./manage-inboxes-modal";
import { UpsellModal } from "./upsell-modal";
import { AuthNeed } from "./auth-needed-moda";
import { SettingsModal, UserSettings, DEFAULT_SETTINGS } from "./settings-modal";

// ── Affiliate link ────────────────────────────────────────────────────────────
const DOMAIN_AFFILIATE_URL = "https://namecheap.pxf.io/c/7002059/408750/5618";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Attachment {
  filename: string;
  contentType: string;
  content: string;
  size: number;
}

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  text?: string;
  html?: string;
  body?: string;
  hasAttachments?: boolean;
  attachments?: Attachment[];
  otp?: string | null;
  verificationLink?: string | null;
}

// ── Domain promo — sidebar card (replaces ad) ─────────────────────────────────
function DomainPromoCard() {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6 space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm font-semibold text-foreground">Own your email permanently</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Get a domain + private email in 2 minutes. No more expiring addresses.
      </p>
      <a
        rel="sponsored"
        href={DOMAIN_AFFILIATE_URL}
        target="_blank"
        className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
      >
        Find your domain name today →
      </a>
    </div>
  );
}

// ── OTP badge — real code for Pro, blurred •••••• + Crown for others ──────────
function OtpBadge({
  otp, isPro, onCopy, onUpsell, copied
}: { otp: string; isPro: boolean; onCopy: () => void; onUpsell: () => void, copied: boolean }) {
  if (isPro) {
    return (
      <div
        className="shrink-0 inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px] font-mono cursor-pointer hover:bg-emerald-500/20 transition-colors"
        onClick={(e) => { e.stopPropagation(); onCopy(); }}
        title="Click to copy OTP"
      >
        <span className="font-bold tracking-wider">{otp}</span>
        {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
      </div>
    );
  }
  return (
    <button
      type="button"
      className="shrink-0 inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 text-[10px] font-mono cursor-pointer hover:bg-amber-500/20 transition-colors select-none"
      onClick={(e) => { e.stopPropagation(); onUpsell(); }}
      title="Upgrade to Pro to see OTP codes instantly"
    >
      <span className="font-bold tracking-widest blur-[4px] pointer-events-none">••••••</span>
      <Crown className="h-2.5 w-2.5 shrink-0" />
    </button>
  );
}

// ── Verification link badge ───────────────────────────────────────────────────
function VerifyLinkBadge({
  url, isPro, onUpsell,
}: { url: string; isPro: boolean; onUpsell: () => void }) {
  if (isPro) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 text-[10px] font-medium cursor-pointer hover:bg-blue-500/20 transition-colors"
        onClick={(e) => e.stopPropagation()}
        title="Open verification link"
      >
        <span>Verify</span>
        <ExternalLink className="h-2.5 w-2.5" />
      </a>
    );
  }
  return (
    <button
      type="button"
      className="shrink-0 inline-flex items-center gap-1 bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border text-[10px] font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none"
      onClick={(e) => { e.stopPropagation(); onUpsell(); }}
      title="Upgrade to Pro to see verification links"
    >
      <span className="blur-[4px] pointer-events-none">Verify</span>
      <Crown className="h-2.5 w-2.5 shrink-0 text-amber-500" />
    </button>
  );
}

// ── Split pane ────────────────────────────────────────────────────────────────
const SplitPaneMessageView = ({
  message, token, apiEndpoint, isPro, onUpsell,
}: { message: Message; token: string | null; apiEndpoint: string; isPro: boolean; onUpsell: (f: string) => void }) => {
  const [fullMessage, setFullMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFullMessage = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = { "x-fce-client": "web-client" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch(`${apiEndpoint}?fullMailboxId=${message.to}&messageId=${id}`, { headers });
      const d = await r.json();
      if (d.success) setFullMessage(d.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [message.to, token, apiEndpoint]);

  useEffect(() => { setFullMessage(null); fetchFullMessage(message.id); }, [message.id, fetchFullMessage]);

  const fmt = (b: number) => {
    if (!b) return "0 B";
    const s = ["B", "KB", "MB", "GB"]; const i = Math.floor(Math.log(b) / Math.log(1024));
    return `${(b / Math.pow(1024, i)).toFixed(1)} ${s[i]}`;
  };

  const m = fullMessage || message;
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-2 break-words">{m.subject}</h2>
        <div className="grid gap-1 text-sm text-muted-foreground">
          <div className="flex justify-between"><span className="font-semibold text-foreground mr-2">From:</span><span className="truncate">{m.from}</span></div>
          <div className="flex justify-between"><span className="font-semibold text-foreground mr-2">Date:</span><span>{new Date(m.date).toLocaleString()}</span></div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative min-h-0 bg-white dark:bg-zinc-950">
        {isLoading
          ? <div className="flex justify-center items-center h-full text-muted-foreground"><Loader className="animate-spin h-5 w-5 mr-2" />Loading…</div>
          : m.html
            ? <iframe srcDoc={`<base target="_blank" /><style>body{margin:0;padding:1.5rem;font-family:system-ui,sans-serif;word-wrap:break-word}img{max-width:100%}</style>${m.html}`} className="w-full h-full border-none" sandbox="allow-same-origin allow-popups" title="Email" />
            : <div className="h-full overflow-y-auto p-6 whitespace-pre-wrap text-sm">{m.body || m.text || "No content."}</div>
        }
      </div>
      {m.attachments?.length
        ? (
          <div className="p-3 bg-muted/30 border-t shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" />Attachments</h3>
              {!isPro && <span className="text-[10px] text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="h-2.5 w-2.5" />Pro</span>}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {m.attachments.map((att, i) => (
                <a key={i} href={isPro ? `data:${att.contentType};base64,${att.content}` : "#"} download={isPro ? att.filename : undefined} onClick={(e) => { if (!isPro) { e.preventDefault(); onUpsell("Attachments"); } }} className="flex items-center gap-2 p-1.5 bg-background border rounded hover:bg-accent transition-colors min-w-[150px] max-w-[200px]">
                  <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0"><Paperclip className="h-3 w-3 text-muted-foreground" /></div>
                  <div className="flex-grow min-w-0"><p className="font-medium text-xs truncate">{att.filename}</p><p className="text-[10px] text-muted-foreground">{fmt(att.size)}</p></div>
                </a>
              ))}
            </div>
          </div>
        )
        : !isLoading && <div className="p-1 bg-muted/10 border-t text-[10px] text-center text-muted-foreground"><ShieldCheck className="inline h-3 w-3 mr-1" />Scanned by DITMail Security</div>
      }
    </div>
  );
};

// ── Constants ─────────────────────────────────────────────────────────────────
const FREE_DOMAINS = [
  "areueally.info", "ditapi.info", "ditcloud.info", "ditdrive.info",
  "ditgame.info", "ditlearn.info", "ditpay.info", "ditplay.info",
  "ditube.info", "junkstopper.info",
];

function generateRandomEmail(domain: string) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  return [...Array(6)].map(() => chars[Math.floor(Math.random() * chars.length)]).join("") + "@" + domain;
}

const getPreferredDomain = (domains: string[], last: string | null) =>
  (last && domains.includes(last)) ? last : (domains[0] && !FREE_DOMAINS.includes(domains[0]) ? domains[0] : domains[0] || FREE_DOMAINS[0]);

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "numeric", hour12: true }).format(new Date(s));

const getExpiry = (dateStr: string, hours: number) => {
  const d = new Date(dateStr); d.setHours(d.getHours() + hours);
  const now = new Date(); const diff = d.getTime() - now.getTime();
  const timeStr = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "numeric", hour12: true });
  if (diff <= 0) return "Expired";
  if (d.getDate() !== now.getDate()) return `Tomorrow at ${timeStr}`;
  return `Today at ${timeStr}`;
};

interface EmailBoxProps {
  initialSession: Session | null;
  initialCustomDomains: any[];
  initialInboxes: string[];
  initialCurrentInbox: string | null;
}

// ── EmailBox ──────────────────────────────────────────────────────────────────
export function EmailBox({ initialSession, initialCustomDomains, initialInboxes, initialCurrentInbox }: EmailBoxProps) {
  const t = useTranslations("EmailBox");
  const [session] = useState(initialSession);
  const isAuthenticated = !!session;
  // @ts-ignore
  const userPlan = session?.user?.plan || "none";
  const isPro = userPlan === "pro";
  const API_ENDPOINT = isAuthenticated ? "/api/private-mailbox" : "/api/public-mailbox";

  // ── State ──
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [emailHistory, setEmailHistory] = useState<string[]>(initialInboxes);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [otpCopied, setOTPCopied] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "email" | "message"; id?: string } | null>(null);
  const [blockButtons, setBlockButtons] = useState(false);
  const [oldEmailUsed, setOldEmailUsed] = useState(false);
  const [discoveredUpdates, setDiscoveredUpdates] = useState({ newDomains: false });
  const [showAttachmentNotice, setShowAttachmentNotice] = useState(false);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<"all" | "dismissed">("all");
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [dismissedMessageIds, setDismissedMessageIds] = useState<Set<string>>(new Set());
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [isAuthNeedOpen, setIsAuthNeedOpen] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState("Pro Features");
  const [authNeedFeature, setAuthNeedFeature] = useState("LoggedIn Features");

  const skipNextSettingsSave = useRef(false);
  const originalTitle = useRef(typeof document !== "undefined" ? document.title : "DITMail");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const currentEmailRef = useRef("");
  const sendNotificationRef = useRef<(t: string, b: string) => void>(() => { });
  const setMessagesRef = useRef(setMessages);

  const openUpsell = (feature: string) => { setUpsellFeature(feature); setIsUpsellOpen(true); };

  const availableDomains = useMemo(() => {
    const custom = initialCustomDomains?.filter((d: any) => d.verified).map((d: any) => d.domain) ?? [];
    return [...new Set([...custom, ...FREE_DOMAINS])];
  }, [initialCustomDomains]);

  const isSplit = userSettings.layout === "split" && isPro;
  const isCompact = userSettings.layout === "compact";
  const isZen = userSettings.layout === "zen";
  const isMinimal = userSettings.layout === "minimal";
  const isClassic = userSettings.layout === "classic";
  const isMobile = userSettings.layout === "mobile" && isPro;
  const isRetro = userSettings.layout === "retro" && isPro;

  // ── Inline badges ─────────────────────────────────────────────────────────
  const renderBadges = useCallback((msg: Message) => {
    // Server now sends '__DETECTED__' sentinel for free/anonymous users,
    // and the real value for pro — no client-side sniffing needed.
    const hasOtp = !!msg.otp;
    const hasVerify = !!msg.verificationLink;
    if (!hasOtp && !hasVerify) return null;

    const isRealOtp = msg.otp !== '__DETECTED__';
    const isRealLink = msg.verificationLink !== '__DETECTED__';

    return (
      <>
        {hasOtp && (
          <OtpBadge
            otp={isRealOtp ? msg.otp! : '••••••'}
            isPro={isPro && isRealOtp}
            onCopy={() => { navigator.clipboard.writeText(msg.otp!); setOTPCopied(true); setTimeout(() => setOTPCopied(false), 2000); }}
            onUpsell={() => openUpsell("Auto OTP Extraction")}
            copied={otpCopied}
          />
        )}
        {hasVerify && (
          <VerifyLinkBadge
            url={isRealLink ? msg.verificationLink! : '#'}
            isPro={isPro && isRealLink}
            onUpsell={() => openUpsell("Verification Link Detection")}
          />
        )}
      </>
    );
  }, [isPro, otpCopied]);
  
  // ── WebSocket ─────────────────────────────────────────────────────────────
  const connectWebSocket = useCallback((mailbox: string) => {
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    const prev = wsRef.current;
    if (prev) { prev.onclose = null; if (prev.readyState < 2) prev.close(1000, "mailbox_change"); }

    const ws = new WebSocket(`wss://api2.freecustom.email/?mailbox=${encodeURIComponent(mailbox)}`);
    wsRef.current = ws;
    ws.onopen = () => { reconnectAttemptsRef.current = 0; };
    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        if (d.type !== "new_mail" || d.mailbox !== currentEmailRef.current) return;
        const msg: Message = {
          id: d.id, from: d.from, to: d.to, subject: d.subject, date: d.date,
          hasAttachments: d.hasAttachment,
          otp: d.otp ?? null,
          verificationLink: d.verificationLink ?? null,
        };
        setMessagesRef.current(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          sendNotificationRef.current(`New Email from ${msg.from}`, msg.subject || "(No Subject)");
          return [msg, ...prev];
        });
      } catch (_) { }
    };
    ws.onerror = () => { };
    ws.onclose = (ev) => {
      if (ev.code === 1000) return;
      const delay = Math.min(500 * Math.pow(2, reconnectAttemptsRef.current), 30_000);
      reconnectAttemptsRef.current++;
      reconnectTimerRef.current = setTimeout(() => {
        if (currentEmailRef.current) connectWebSocket(currentEmailRef.current);
      }, delay);
    };
  }, []);

  useEffect(() => () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    const ws = wsRef.current;
    if (ws) { ws.onclose = null; ws.close(1000, "unmount"); }
  }, []);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await fetchToken();
      const localHistory: string[] = JSON.parse(localStorage.getItem("emailHistory") || "[]");
      const lastDomain = localStorage.getItem("lastUsedDomain");
      let initEmail: string;
      let hist: string[];

      try {
        const saved = localStorage.getItem("userSettings");
        if (saved) setUserSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch { }

      try {
        setReadMessageIds(new Set(JSON.parse(localStorage.getItem("readMessageIds") || "[]")));
        setDismissedMessageIds(new Set(JSON.parse(localStorage.getItem("dismissedMessageIds") || "[]")));
      } catch { } finally { setIsStorageLoaded(true); }

      if (initialInboxes.length > 0) {
        hist = initialInboxes; initEmail = initialCurrentInbox || initialInboxes[0];
      } else if (localHistory.length > 0) {
        hist = localHistory; initEmail = localHistory[0];
      } else {
        const d = getPreferredDomain(availableDomains, lastDomain);
        initEmail = generateRandomEmail(d); hist = [initEmail];
      }
      setEmail(initEmail); setEmailHistory(hist); setSelectedDomain(initEmail.split("@")[1]);
    };
    init();
  }, []);

  useEffect(() => {
    const fetch_ = async () => {
      if (!isAuthenticated) return;
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
  }, [isAuthenticated, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    if (skipNextSettingsSave.current) { skipNextSettingsSave.current = false; return; }
    localStorage.setItem("userSettings", JSON.stringify(userSettings));
    if (isAuthenticated)
      fetch("/api/user/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userSettings) }).catch(() => { });
  }, [userSettings, isStorageLoaded, isAuthenticated]);

  useEffect(() => {
    const n = messages.filter(m => !readMessageIds.has(m.id) && !dismissedMessageIds.has(m.id)).length;
    const base = originalTitle.current.replace(/^\(\d+\)\s*/, "");
    document.title = n > 0 ? `(${n}) ${base}` : base;
  }, [messages, readMessageIds, dismissedMessageIds]);

  const sendNotification = (title: string, body: string) => {
    if (userSettings.sound) try { new Audio("/notification.mp3").play().catch(() => { }); } catch { }
    if (userSettings.notifications && document.visibilityState !== "visible")
      new Notification(title, { body, icon: "/logo.webp" });
  };
  useEffect(() => { sendNotificationRef.current = sendNotification; });

  useEffect(() => { if (isStorageLoaded) localStorage.setItem("readMessageIds", JSON.stringify([...readMessageIds])); }, [readMessageIds, isStorageLoaded]);
  useEffect(() => { if (isStorageLoaded) localStorage.setItem("dismissedMessageIds", JSON.stringify([...dismissedMessageIds])); }, [dismissedMessageIds, isStorageLoaded]);
  useEffect(() => { if (selectedDomain) localStorage.setItem("lastUsedDomain", selectedDomain); }, [selectedDomain]);

  useEffect(() => {
    if (!email) return;
    if (!isAuthenticated) return;
    fetch("/api/user/inboxes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inboxName: email }) }).catch(() => { });
    const h: string[] = JSON.parse(localStorage.getItem("emailHistory") || "[]");
    let next = [email, ...h.filter(e => e !== email)];
    if (userPlan === "free") next = next.slice(0, 7);
    else if (!isAuthenticated) next = next.slice(0, 5);
    localStorage.setItem("emailHistory", JSON.stringify(next));
    setEmailHistory(next);
  }, [email, session]);

  useEffect(() => {
    if (!email) return;
    if (isAuthenticated && !token) return;
    currentEmailRef.current = email;
    connectWebSocket(email);
    refreshInbox();
  }, [email, token, isAuthenticated, connectWebSocket]); // eslint-disable-line

  const fetchToken = async () => {
    try {
      const r = await fetch("/api/auth", { method: "POST" });
      const d = await r.json() as { token?: string };
      if (d.token) { setToken(d.token); setCookie("authToken", d.token, { maxAge: 3600 }); return d.token; }
    } catch { }
    return null;
  };

  const refreshInbox = async () => {
    if (isAuthenticated && !token) return;
    setIsRefreshing(true);
    try {
      const headers: Record<string, string> = { "x-fce-client": "web-client" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch(`${API_ENDPOINT}?fullMailboxId=${email}`, { headers });
      if (!r.ok) throw new Error(r.status === 429 ? "Refreshing too fast." : `HTTP ${r.status}`);
      const d = await r.json();
      setShowAttachmentNotice(!!d.wasAttachmentStripped);
      if (d.success && Array.isArray(d.data)) {
        const newMsgs = d.data.filter((m: Message) => !readMessageIds.has(m.id) && !messages.some(old => old.id === m.id));
        if (newMsgs.length > 0 && messages.length > 0) sendNotification(`New Email from ${newMsgs[0].from}`, newMsgs[0].subject || "(No Subject)");
        setMessages(d.data);
        const ids = new Set<string>();
        d.data.forEach((msg: Message) => { if (localStorage.getItem(`saved-msg-${msg.id}`)) ids.add(msg.id); });
        setSavedMessageIds(ids);
      }
    } catch (e) { console.error(e); }
    finally { setIsRefreshing(false); }
  };

  const copyEmail = async () => { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const toggleSaveMessage = async (msg: Message, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userPlan !== "free") return;
    if (savedMessageIds.has(msg.id)) {
      localStorage.removeItem(`saved-msg-${msg.id}`);
      setSavedMessageIds(p => { const s = new Set(p); s.delete(msg.id); return s; });
    } else {
      try {
        const headers: Record<string, string> = { "x-fce-client": "web-client" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const r = await fetch(`${API_ENDPOINT}?fullMailboxId=${email}&messageId=${msg.id}`, { headers });
        const d = await r.json();
        if (d.success) { localStorage.setItem(`saved-msg-${msg.id}`, JSON.stringify(d.data)); setSavedMessageIds(p => new Set(p).add(msg.id)); }
        else setError("Failed to save message.");
      } catch (err) { setError(`Save error: ${err}`); }
    }
  };

  const handleMessageAction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTab === "dismissed") setDismissedMessageIds(p => { const s = new Set(p); s.delete(id); return s; });
    else setDismissedMessageIds(p => new Set(p).add(id));
  };

  const viewMessage = (msg: Message) => {
    if (!readMessageIds.has(msg.id)) setReadMessageIds(p => new Set(p).add(msg.id));
    setSelectedMessage(msg);
    if (!isSplit) setIsMessageModalOpen(true);
  };

  const deleteEmail = () => {
    const d = getPreferredDomain(availableDomains, localStorage.getItem("lastUsedDomain"));
    const ne = generateRandomEmail(d);
    setEmail(ne); setSelectedDomain(d); setMessages([]); setReadMessageIds(new Set()); setDismissedMessageIds(new Set());
  };

  const handleDeleteAction = (type: "inbox" | "message", id?: string) => {
    if (!isAuthenticated && type === "message") { setAuthNeedFeature("Delete Message"); setIsAuthNeedOpen(true); return; }
    if (!isPro && type === "message") { openUpsell("Permanent Deletion"); return; }
    if (type === "inbox") deleteEmail();
    else if (id) { setItemToDelete({ type: "message", id }); setIsDeleteModalOpen(true); }
  };

  const handleDeleteConfirmation = async () => {
    if (itemToDelete?.type === "email") {
      const d = getPreferredDomain(availableDomains, localStorage.getItem("primaryDomain"));
      const ne = generateRandomEmail(d);
      setEmail(ne); setSelectedDomain(d); setMessages([]); setReadMessageIds(new Set()); setDismissedMessageIds(new Set());
    } else if (itemToDelete?.type === "message" && itemToDelete.id) {
      try {
        const headers: Record<string, string> = { "x-fce-client": "web-client" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const r = await fetch(`${API_ENDPOINT}?fullMailboxId=${email}&messageId=${itemToDelete.id}`, { method: "DELETE", headers });
        const d = await r.json();
        if (d.success) setMessages(msgs => msgs.filter(m => m.id !== itemToDelete.id));
        else throw new Error(d.message);
      } catch (err) { setError(`Delete failed: ${err}`); }
    }
    setIsDeleteModalOpen(false); setItemToDelete(null);
  };

  const changeEmail = () => {
    if (!isAuthenticated) { setIsAuthNeedOpen(true); setAuthNeedFeature("Update Email"); return; }
    if (isEditing) {
      const [p] = email.split("@");
      if (p?.length > 0) { setEmail(`${p}@${selectedDomain}`); setIsEditing(false); setReadMessageIds(new Set()); setDismissedMessageIds(new Set()); }
      else setError("Enter a valid email prefix.");
    } else setIsEditing(true);
  };

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
    return messages.filter(m => !dismissedMessageIds.has(m.id));
  }, [messages, activeTab, dismissedMessageIds]);

  useEffect(() => {
    const h = document.querySelector("header"), f = document.querySelector("footer"), n = document.querySelector("nav");
    if (isZen || isRetro) { if (h) h.style.display = "none"; if (f) f.style.display = "none"; if (n) n.style.display = "none"; }
    else if (isMinimal) { if (h) h.style.display = "flex"; if (f) f.style.display = "none"; }
    else { if (h) h.style.display = ""; if (f) f.style.display = ""; if (n) n.style.display = ""; }
    return () => { if (h) h.style.display = ""; if (f) f.style.display = ""; if (n) n.style.display = ""; };
  }, [userSettings.layout, isZen, isMinimal, isRetro]);

  // ── Placement 3: Empty state domain promo (free users only) ───────────────
  const renderEmptyStateDomainPromo = () => {
    if (isPro) return null;
    return (
      <div className="mt-4 px-4 py-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          Stop losing emails. Use your own permanent address with a custom domain.
        </p>
        <a
          rel="sponsored"
          href={DOMAIN_AFFILIATE_URL}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Globe className="h-3 w-3" />
          Get your .COM domain →
        </a>
      </div>
    );
  };

  // ── Renderers ──────────────────────────────────────────────────────────────
  const renderClassicMessageList = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableBody>
          {filteredMessages.length === 0 ? (
            <tr><td colSpan={4} className="text-center py-12">
              <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-base font-medium">{activeTab === "all" ? t("inbox_empty_title") : "No dismissed emails"}</p>
              <p className="text-sm text-muted-foreground">{activeTab === "all" ? t("inbox_empty_subtitle") : "Dismissed emails appear here."}</p>
              {activeTab === "all" && renderEmptyStateDomainPromo()}
            </td></tr>
          ) : filteredMessages.map((msg, i) => (
            <tr key={msg.id} className={cn("border-b", i % 2 === 0 ? "bg-muted/20" : "bg-background")}>
              <td className="py-2.5 pl-3 font-medium text-sm truncate max-w-[140px]">{msg.from}</td>
              <td className="py-2.5 px-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm">{msg.subject}</span>
                  {renderBadges(msg)}
                </div>
                {!isPro && <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5"><Clock className="w-2 h-2" />Expires: {getExpiry(msg.date, 24)}</span>}
              </td>
              <td className="py-2.5 px-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(msg.date).toLocaleString()}</td>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-1">
                  <Button variant="link" size="sm" className="h-7 px-2 text-xs" onClick={() => viewMessage(msg)}>{t("view")}</Button>
                  <Button variant="link" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteAction("message", msg.id); }}>{t("delete")}</Button>
                  {userPlan === "free" && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => toggleSaveMessage(msg, e)}><Star className={cn("h-3.5 w-3.5", savedMessageIds.has(msg.id) && "fill-amber-500 text-amber-500")} /></Button>}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => handleMessageAction(msg.id, e)}>
                    {activeTab === "dismissed" ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderMobileMessageList = () => (
    <div className="flex flex-col gap-3 py-2">
      {filteredMessages.map(msg => (
        <div key={msg.id} onClick={() => viewMessage(msg)} className="bg-card border rounded-lg p-4 shadow-sm active:scale-95 transition-transform flex items-center justify-between">
          <div className="flex flex-col gap-1 overflow-hidden">
            <span className="font-bold text-base truncate">{msg.from}</span>
            <div className="flex items-center gap-2 flex-wrap"><span className="text-sm text-muted-foreground truncate">{msg.subject || "(No Subject)"}</span>{renderBadges(msg)}</div>
            <span className="text-xs text-muted-foreground/50">{fmtDate(msg.date)}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0" />
        </div>
      ))}
      {filteredMessages.length === 0 && (
        <div className="text-center p-10 text-muted-foreground">
          Empty inbox
          {renderEmptyStateDomainPromo()}
        </div>
      )}
    </div>
  );

  const renderRetroMessageList = () => (
    <div style={{ fontFamily: '"Times New Roman",serif', background: "white", color: "black", padding: 20, minHeight: "100vh" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>Email Box 1.0</h1>
      <div style={{ marginBottom: 20 }}>Welcome, <b>{email}</b>. [<a href="#" onClick={(e) => { e.preventDefault(); refreshInbox(); }} style={{ color: "blue" }}>Refresh</a>] [<a href="#" onClick={(e) => { e.preventDefault(); setIsSettingsOpen(true); }} style={{ color: "blue" }}>Settings</a>]</div>
      <hr /><ul style={{ listStyle: "disc", paddingLeft: 20, marginTop: 10 }}>
        {filteredMessages.length === 0 ? <li>No messages.</li> : filteredMessages.map(msg => (
          <li key={msg.id} style={{ marginBottom: 5 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); viewMessage(msg); }} style={{ color: "blue" }}>{msg.subject || "(No Subject)"}</a>
            <span style={{ fontSize: 12, color: "#555" }}> - {msg.from} ({fmtDate(msg.date)})</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderNewMessageList = () => (
    <div className="flex flex-col rounded-xl overflow-hidden bg-background border border-border/50">
      {filteredMessages.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center px-4">
          <div className="bg-muted/30 p-4 rounded-full mb-4">{activeTab === "all" ? <Mail className="h-8 w-8 text-muted-foreground/50" /> : <Archive className="h-8 w-8 text-muted-foreground/50" />}</div>
          <p className="text-base font-medium">{activeTab === "all" ? t("inbox_empty_title") : "No dismissed emails"}</p>
          <p className="text-sm text-muted-foreground max-w-xs mt-1">{activeTab === "all" ? t("inbox_empty_subtitle") : "Emails you dismiss appear here."}</p>
          {/* ── Placement 3: Empty inbox domain promo ── */}
          {activeTab === "all" && renderEmptyStateDomainPromo()}
        </div>
      ) : filteredMessages.map((msg) => {
        const isRead = readMessageIds.has(msg.id);
        const isSelected = selectedMessage?.id === msg.id;
        return (
          <div key={msg.id} onClick={() => viewMessage(msg)}
            className={cn("group relative flex flex-col gap-1 sm:flex-row sm:items-center px-4 border-b last:border-0 cursor-pointer transition-all hover:bg-muted/40",
              isCompact ? "py-1" : "py-2",
              isSelected && isSplit ? "bg-primary/5 border-l-4 border-l-primary" : "",
              !isRead && !isSelected ? "bg-background" : "bg-muted/5 dark:bg-muted/10"
            )}>
            {!isCompact && <div className="hidden sm:flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary font-semibold text-sm">{msg.from.charAt(1).toUpperCase()}</div>}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center justify-between">
                <span className={cn("truncate text-sm", !isRead ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>{msg.from}</span>
                <span className={cn("text-xs whitespace-nowrap shrink-0", !isRead ? "font-semibold text-foreground" : "text-muted-foreground")}>{fmtDate(msg.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("truncate text-xs flex-1", !isRead ? "font-semibold text-foreground" : "text-muted-foreground")}>{msg.subject || "(No Subject)"}</span>
                {renderBadges(msg)}
              </div>
              {!isCompact && (
                <div className="flex items-center justify-between mt-1">
                  {/* Expiry timer: hidden on mobile (touch devices have no hover), visible on sm+ */}
                  <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-amber-600 cursor-pointer" onClick={(e) => { e.stopPropagation(); openUpsell("Permanent Storage"); }}>
                    <Clock className="h-3 w-3" /><span>{isPro ? "Permanent" : getExpiry(msg.date, 24)}</span>
                  </div>
                  {/* Action buttons: always visible on mobile, hover-only on sm+ */}
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {userPlan === "free" && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => toggleSaveMessage(msg, e)}><Star className={cn("h-4 w-4", savedMessageIds.has(msg.id) && "fill-amber-500 text-amber-500")} /></Button>}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDeleteAction("message", msg.id); }}><Trash2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => handleMessageAction(msg.id, e)}>{activeTab === "dismissed" ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (isRetro) return (
    <>{renderRetroMessageList()}
      <MessageModal message={selectedMessage} isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} isPro={isPro} onUpsell={() => openUpsell("Attachments")} apiEndpoint={API_ENDPOINT} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={userSettings} onUpdate={setUserSettings} isPro={isPro} onUpsell={openUpsell} isAuthenticated={isAuthenticated} onAuthNeed={(f: string) => { setAuthNeedFeature(f); setIsAuthNeedOpen(true); }} />
    </>
  );

  return (
    <Card className={cn("border-dashed", isZen && "border-0 shadow-none bg-transparent")}>
      <CardContent className="space-y-2 pt-3">
        {/* ── Placement 4: Email bar domain hint (free users only) ── */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex flex-1 items-center gap-2">
              <Input value={email.split("@")[0]} onChange={(e) => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""); setEmail(`${v}@${selectedDomain}`); setBlockButtons(v.length === 0); }} className="flex-1" placeholder={t("placeholder_username")} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" className="w-1/2 truncate">{selectedDomain || t("select_domain")}</Button></DropdownMenuTrigger>
                <DropdownMenuContent className="w-[min(100%,14rem)] max-h-[60vh] overflow-y-auto p-1 rounded-md bg-white dark:bg-zinc-900 shadow-lg border border-muted z-50">
                  {availableDomains.map(d => {
                    const isCustom = !FREE_DOMAINS.includes(d);
                    return (
                      <DropdownMenuItem key={d} onSelect={() => { if (isCustom && !isPro) { openUpsell("Custom Domains"); return; } setSelectedDomain(d); setEmail(`${email.split("@")[0]}@${d}`); }} className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-muted">
                        <div className="flex items-center gap-2">{isCustom && <Crown className="h-4 w-4 text-amber-500" />}<span>{d}</span></div>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if (!isPro) { openUpsell("Priority Domain"); return; } const c = localStorage.getItem("primaryDomain"); if (c === d) { localStorage.removeItem("primaryDomain"); setPrimaryDomain(null); } else { localStorage.setItem("primaryDomain", d); setPrimaryDomain(d); } }} className="hover:bg-transparent h-7 w-7">
                          <Star className={cn("h-4 w-4", primaryDomain === d ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
                        </Button>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="rounded-md bg-muted p-2 text-sm">{email || t("loading")}</div>
              {/* ── Placement 4: subtle text under email bar ── */}
              {!isPro && (
                <p className="text-[10px] text-muted-foreground/70 pl-1">
                  Want your own domain like this?{" "}
                  <a
                    rel="sponsored"
                    href={DOMAIN_AFFILIATE_URL}
                    target="_blank"
                    className="text-primary hover:underline font-medium"
                  >
                    Get it here
                  </a>
                </p>
              )}
            </div>
          )}
          <TooltipProvider delayDuration={200}>
            <div className="flex gap-2">
              <Tooltip><TooltipTrigger asChild>
                <Button variant="secondary" size="icon" onClick={copyEmail} className="relative" disabled={blockButtons}>
                  <Copy className={cn("h-4 w-4 transition-all", copied && "opacity-0")} />
                  <span className={cn("absolute inset-0 flex items-center justify-center transition-all", copied ? "opacity-100" : "opacity-0")}><Check className="h-4 w-4" /></span>
                  <span className="absolute -top-0.5 text-[9px] right-0 hidden sm:block">C</span>
                </Button>
              </TooltipTrigger><TooltipContent><p>{isAuthenticated ? "Press C to copy" : "Login to use shortcuts"}</p></TooltipContent></Tooltip>
              <Button className="hidden sm:flex" variant="secondary" size="icon" onClick={() => setIsQRModalOpen(true)} disabled={blockButtons}><QrCode className="h-4 w-4" /></Button>
              <Button variant="secondary" size="icon" onClick={() => setIsSettingsOpen(true)} disabled={blockButtons}><Settings className="h-4 w-4" /></Button>
              <ShareDropdown />
            </div>
          </TooltipProvider>
        </div>

        {!isZen && (
          <>
            <TooltipProvider delayDuration={200}>
              <div className="flex gap-2 flex-wrap">
                <Tooltip><TooltipTrigger asChild><Button disabled={blockButtons || isRefreshing} variant="outline" className="flex-1" onClick={refreshInbox}><RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} /><span className="hidden sm:inline">{isRefreshing ? t("refreshing") : t("refresh")}</span><Badge variant="outline" className="ml-auto hidden sm:block text-[10px]">R</Badge></Button></TooltipTrigger><TooltipContent><p>Press R to refresh</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button disabled={blockButtons} variant="outline" className="flex-1" onClick={() => { changeEmail(); setDiscoveredUpdates({ newDomains: true }); }}>{isEditing ? <CheckCheck className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}<span className="hidden sm:inline">{isEditing ? t("save") : t("change")}</span><Badge variant="outline" className="ml-auto hidden sm:block text-[10px]">N</Badge></Button></TooltipTrigger><TooltipContent><p>{!isAuthenticated ? "Login to edit" : isPro ? "Press N" : "Pro only shortcut"}</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button disabled={blockButtons} variant="outline" className="flex-1" onClick={() => handleDeleteAction("inbox")}><Trash2 className="mr-2 h-4 w-4" /><span className="hidden sm:inline">{t("delete")}</span><Badge variant="outline" className="ml-auto hidden sm:block text-[10px]">D</Badge></Button></TooltipTrigger><TooltipContent><p>Press D to delete</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" className="flex-1" onClick={() => { if (isPro) setIsManageModalOpen(true); else openUpsell("Inbox Management"); }}><ListOrdered className="mr-2 h-4 w-4" /><span className="hidden sm:inline">Manage Inboxes</span></Button></TooltipTrigger><TooltipContent><p>View all saved inboxes</p></TooltipContent></Tooltip>
              </div>
            </TooltipProvider>
            <div className="flex items-center gap-4 w-full py-2">
              <button onClick={() => setActiveTab("all")} className={cn("flex items-center gap-2 text-sm font-medium w-1/2 justify-center transition-colors", activeTab === "all" ? "text-primary border-b-2 pb-2" : "text-muted-foreground hover:text-primary")}><Mail className="h-4 w-4" />All</button>
              <button onClick={() => setActiveTab("dismissed")} className={cn("flex items-center gap-2 text-sm font-medium w-1/2 justify-center transition-colors", activeTab === "dismissed" ? "text-primary border-b-2 pb-2" : "text-muted-foreground hover:text-primary")}><Archive className="h-4 w-4" />Dismissed</button>
            </div>
          </>
        )}

        {isSplit ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
            <div className="border rounded-xl overflow-hidden overflow-y-auto">{renderNewMessageList()}</div>
            <div className="border rounded-xl overflow-hidden bg-muted/10 h-full flex flex-col">
              {selectedMessage
                ? <SplitPaneMessageView message={selectedMessage} token={token} apiEndpoint={API_ENDPOINT} isPro={isPro} onUpsell={openUpsell} />
                : <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><Mail className="w-12 h-12 mb-4 opacity-20" /><p>Select an email to read</p></div>
              }
            </div>
          </div>
        ) : isClassic ? renderClassicMessageList()
          : isMobile ? renderMobileMessageList()
            : renderNewMessageList()
        }

        {!isZen && (
          <div className="mt-8 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h3 className="text-base font-semibold mb-2">{t("history_title")}</h3>
              <ul className="space-y-2">{emailHistory.map((he, i) => (<li key={i} className="flex items-center justify-between"><span className="text-sm text-muted-foreground truncate">{he}</span><Button variant="ghost" size="sm" onClick={() => { setEmail(he); setOldEmailUsed(!oldEmailUsed); }}>{t("history_use")}</Button></li>))}</ul>
            </div>
            {/* ── Placement 1: Native domain promo card (replaces ad) ── */}
            {!isPro && (
              <div className="w-full md:w-80 shrink-0">
                <DomainPromoCard />
              </div>
            )}
          </div>
        )}
      </CardContent>

      {!isZen && <CardHeader><h2 className="text-xl font-semibold">{t("card_header_title")}</h2><p className="text-sm text-muted-foreground">{t("card_header_p")}</p></CardHeader>}

      {showAttachmentNotice && !isZen && (
        <div className="p-3 mb-4 mx-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-zinc-800 dark:text-yellow-300 text-center cursor-pointer hover:underline" onClick={() => openUpsell("Large Attachments")}>
          A large attachment was stripped. Upgrade to Pro to receive files up to 25 MB.
        </div>
      )}

      <ManageInboxesModal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} inboxes={initialInboxes} onSelectInbox={(he) => { setEmail(he); setSelectedDomain(he.split("@")[1]); setIsEditing(false); }} />
      <QRCodeModal email={email} isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
      <MessageModal message={selectedMessage} isOpen={isMessageModalOpen} onClose={() => setIsMessageModalOpen(false)} isPro={isPro} onUpsell={() => openUpsell("Attachments")} apiEndpoint={API_ENDPOINT} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={userSettings} onUpdate={setUserSettings} isPro={isPro} onUpsell={openUpsell} isAuthenticated={isAuthenticated} onAuthNeed={(f: string) => { setAuthNeedFeature(f); setIsAuthNeedOpen(true); }} />
      <UpsellModal isOpen={isUpsellOpen} onClose={() => setIsUpsellOpen(false)} featureName={upsellFeature} />
      <AuthNeed isOpen={isAuthNeedOpen} onClose={() => setIsAuthNeedOpen(false)} featureName={authNeedFeature} />
      {error && <ErrorPopup message={error} onClose={() => setError(null)} />}
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirmation} itemToDelete={itemToDelete?.type === "email" ? "email address" : "message"} />
    </Card>
  );
}