"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { setCookie } from "cookies-next";
import {
  Mail, RefreshCw, Trash2, Edit, QrCode, Copy, Check, CheckCheck,
  Star, ListOrdered, Clock, Archive, ArchiveRestore,
  Settings, Crown, ChevronRight, Loader, Paperclip, ShieldCheck,
  Lock, ExternalLink, Globe, Zap, Link2, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableRow } from "@/components/ui/table";
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
import { Session } from "next-auth";
import { ManageInboxesModal } from "./manage-inboxes-modal";
import { UpsellModal } from "./upsell-modal";
import { AuthNeed } from "./auth-needed-moda";
import { SettingsModal, UserSettings, DEFAULT_SETTINGS } from "./settings-modal";

const DOMAIN_AFFILIATE_URL = "https://namecheap.pxf.io/c/7002059/408750/5618";

interface Attachment { filename: string; contentType: string; content: string; size: number; }
interface Message {
  id: string; from: string; to: string; subject: string; date: string;
  text?: string; html?: string; body?: string;
  hasAttachments?: boolean; attachments?: Attachment[];
  otp?: string | null; verificationLink?: string | null;
}

const FREE_DOMAINS = [
  "areueally.info","ditapi.info","ditcloud.info","ditdrive.info",
  "ditgame.info","ditlearn.info","ditpay.info","ditplay.info",
  "ditube.info","junkstopper.info",
];

// Helper to prevent JSON.parse crashes from corrupted localStorage
const safeJsonParse = <T,>(str: string | null, fallback: T): T => {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
};

function generateRandomEmail(domain: string) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  return [...Array(6)].map(() => chars[Math.floor(Math.random() * chars.length)]).join("") + "@" + domain;
}

const getPreferredDomain = (domains: string[], last: string | null) =>
  (last && domains.includes(last)) ? last : (domains[0] && !FREE_DOMAINS.includes(domains[0]) ? domains[0] : domains[0] || FREE_DOMAINS[0]);

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat("en-GB", { day:"numeric",month:"short",hour:"numeric",minute:"numeric",hour12:true }).format(new Date(s));

const fmtDateShort = (s: string) => {
  const d = new Date(s), now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", hour12:false });
  return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short" });
};

const getExpiry = (dateStr: string, hours: number) => {
  const d = new Date(dateStr); d.setHours(d.getHours() + hours);
  const now = new Date(); const diff = d.getTime() - now.getTime();
  const timeStr = d.toLocaleTimeString("en-GB",{hour:"numeric",minute:"numeric",hour12:true});
  if (diff <= 0) return "Expired";
  if (d.getDate() !== now.getDate()) return `Tomorrow ${timeStr}`;
  return `Today ${timeStr}`;
};

function NewEmailFlash({ from, subject, onDone }: { from: string; subject: string; onDone: () => void }) {
  // Added a ref to prevent strict-mode double-firing issues, though key fixes the main bug
  useEffect(() => { 
    const t = setTimeout(onDone, 3400); 
    return () => clearTimeout(t); 
  }, [onDone]);
  
  return (
    <>
      <style>{`
        @keyframes flashEnter {
          0%   { transform:translateY(-100%); opacity:0; }
          10%  { transform:translateY(0);     opacity:1; }
          80%  { transform:translateY(0);     opacity:1; }
          100% { transform:translateY(-100%); opacity:0; }
        }
        @keyframes scanSwipe {
          0%   { background-position:-100% 0; }
          100% { background-position:220% 0; }
        }
      `}</style>
      <div
        className="absolute top-0 inset-x-0 z-50 overflow-hidden pointer-events-none"
        style={{ animation: "flashEnter 3.4s ease-out forwards" }}
      >
        <div className="relative flex items-center gap-3 px-4 py-2.5 bg-background border-b border-border">
          <div className="absolute inset-0" style={{
            background: "linear-gradient(90deg,transparent 0%,hsl(var(--foreground)/0.05) 50%,transparent 100%)",
            backgroundSize: "60% 100%",
            animation: "scanSwipe 0.7s ease-out 0.1s",
          }} />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">RCVD</span>
          <span className="font-mono text-xs text-foreground font-semibold truncate">{from}</span>
          <span className="text-border shrink-0">·</span>
          <span className="font-mono text-xs text-muted-foreground truncate">{subject || "(no subject)"}</span>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground/40 shrink-0 tabular-nums">
            {new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false})}
          </span>
        </div>
      </div>
    </>
  );
}

function ProLockChip({ label, blurContent, onUpsell, variant = "otp" }: {
  label: string; blurContent: string; onUpsell: () => void; variant?: "otp"|"verify";
}) {
  const cls = variant === "otp"
    ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
    : "bg-blue-500/8 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15";
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onUpsell(); }}
      className={cn("group shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono transition-all cursor-pointer select-none", cls)}
      title={`Upgrade to Pro to see ${label}`}>
      <Lock className="h-2.5 w-2.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
      <span className="blur-[4px] tracking-widest pointer-events-none">{blurContent}</span>
    </button>
  );
}

function OtpChip({ otp, onCopy, copied }: { otp: string; onCopy: () => void; copied: boolean }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onCopy(); }}
      className="shrink-0 inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px] font-mono cursor-pointer hover:bg-emerald-500/20 transition-colors"
      title="Click to copy OTP">
      <Zap className="h-2.5 w-2.5 shrink-0" />
      <span className="font-bold tracking-wider">{otp}</span>
      {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5 opacity-50" />}
    </div>
  );
}

function VerifyChip({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
      className="shrink-0 inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 text-[10px] font-medium cursor-pointer hover:bg-blue-500/20 transition-colors"
      title="Open verification link">
      <Link2 className="h-2.5 w-2.5 shrink-0" />
      <span>Verify</span>
      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
    </a>
  );
}

const SplitPaneMessageView = ({
  message, token, apiEndpoint, isPro, onUpsell,
}: { message: Message; token: string|null; apiEndpoint: string; isPro: boolean; onUpsell:(f:string)=>void }) => {
  const [fullMessage, setFullMessage] = useState<Message|null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchFull = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const headers: Record<string,string> = {"x-fce-client":"web-client"};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch(`${apiEndpoint}?fullMailboxId=${message.to}&messageId=${id}`,{headers});
      if (!r.ok) throw new Error("Fetch failed");
      const d = await r.json(); 
      if (d.success) setFullMessage(d.data);
    } catch(e){console.error(e);} finally{setIsLoading(false);}
  },[message.to,token,apiEndpoint]);
  useEffect(()=>{setFullMessage(null);fetchFull(message.id);},[message.id,fetchFull]);
  const fmt=(b:number)=>{if(!b)return"0 B";const s=["B","KB","MB","GB"];const i=Math.floor(Math.log(b)/Math.log(1024));return`${(b/Math.pow(1024,i)).toFixed(1)} ${s[i]}`;};
  const m = fullMessage||message;
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border bg-muted/10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Subject</p>
        <h2 className="text-sm font-semibold text-foreground mb-2 break-words leading-snug">{m.subject}</h2>
        <div className="grid gap-0.5 font-mono text-[11px] text-muted-foreground">
          <span><span className="text-foreground/40 mr-2">FROM</span>{m.from}</span>
          <span><span className="text-foreground/40 mr-2">DATE</span>{new Date(m.date).toLocaleString()}</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative min-h-0 bg-white dark:bg-zinc-950">
        {isLoading
          ? <div className="flex justify-center items-center h-full"><Loader className="animate-spin h-4 w-4 mr-2 text-muted-foreground"/><span className="font-mono text-xs text-muted-foreground">fetching…</span></div>
          : m.html
            ? <iframe srcDoc={`<base target="_blank"/><style>body{margin:0;padding:1.5rem;font-family:system-ui,sans-serif;word-wrap:break-word}img{max-width:100%}</style>${m.html}`} className="w-full h-full border-none" sandbox="allow-same-origin allow-popups" title="Email"/>
            : <div className="h-full overflow-y-auto p-6 whitespace-pre-wrap font-mono text-xs text-foreground/80">{m.body||m.text||"No content."}</div>
        }
      </div>
      {m.attachments?.length ? (
        <div className="p-3 bg-muted/20 border-t border-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Attachments</span>
            {!isPro && <span className="font-mono text-[10px] text-amber-600 border border-amber-500/30 rounded px-1.5 py-px flex items-center gap-1"><Lock className="h-2.5 w-2.5"/>Pro</span>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {m.attachments.map((att,i)=>(
              <a key={i} href={isPro?`data:${att.contentType};base64,${att.content}`:"#"} download={isPro?att.filename:undefined}
                onClick={(e)=>{if(!isPro){e.preventDefault();onUpsell("Attachments");}}}
                className="flex items-center gap-2 p-1.5 bg-background border border-border rounded hover:bg-muted/40 transition-colors min-w-[140px] max-w-[180px]">
                <Paperclip className="h-3 w-3 text-muted-foreground shrink-0"/>
                <div className="min-w-0"><p className="font-mono text-[10px] truncate">{att.filename}</p><p className="font-mono text-[10px] text-muted-foreground">{fmt(att.size)}</p></div>
              </a>
            ))}
          </div>
        </div>
      ) : !isLoading && (
        <div className="px-4 py-2 border-t border-border bg-muted/10">
          <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="h-3 w-3"/>Scanned · No threats detected</span>
        </div>
      )}
    </div>
  );
};

function DomainPromoCard() {
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Permanent inbox</p>
      </div>
      <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
        Get a custom domain + private email in 2 min. Stop losing access when temp addresses expire.
      </p>
      <a rel="sponsored" href={DOMAIN_AFFILIATE_URL} target="_blank"
        className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground underline underline-offset-2 decoration-border hover:decoration-foreground transition-colors">
        Get .COM from Namecheap →
      </a>
    </div>
  );
}

interface EmailBoxProps {
  initialSession: Session|null;
  initialCustomDomains: any[];
  initialInboxes: string[];
  initialCurrentInbox: string|null;
}

export function EmailBox({ initialSession, initialCustomDomains, initialInboxes, initialCurrentInbox }: EmailBoxProps) {
  const t = useTranslations("EmailBox");
  const [session] = useState(initialSession);
  const isAuthenticated = !!session;
  // @ts-ignore
  const userPlan = session?.user?.plan || "none";
  const isPro = userPlan === "pro";
  const API_ENDPOINT = isAuthenticated ? "/api/private-mailbox" : "/api/public-mailbox";

  const [isManageModalOpen,  setIsManageModalOpen]  = useState(false);
  const [email,              setEmail]              = useState(initialCurrentInbox || initialInboxes[0] || "");
  const [isEditing,          setIsEditing]          = useState(false);
  const [messages,           setMessages]           = useState<Message[]>([]);
  const [emailHistory,       setEmailHistory]       = useState<string[]>(initialInboxes);
  const [selectedDomain,     setSelectedDomain]     = useState("");
  const [primaryDomain,      setPrimaryDomain]      = useState<string|null>(null);
  const [token,              setToken]              = useState<string|null>(null);
  const [isQRModalOpen,      setIsQRModalOpen]      = useState(false);
  const [copied,             setCopied]             = useState(false);
  const [otpCopied,          setOTPCopied]          = useState<string|null>(null);
  const [selectedMessage,    setSelectedMessage]    = useState<Message|null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [error,              setError]              = useState<string|null>(null);
  const [isRefreshing,       setIsRefreshing]       = useState(false);
  const [isDeleteModalOpen,  setIsDeleteModalOpen]  = useState(false);
  const [itemToDelete,       setItemToDelete]       = useState<{type:"email"|"message";id?:string}|null>(null);
  const [blockButtons,       setBlockButtons]       = useState(false);
  const [oldEmailUsed,       setOldEmailUsed]       = useState(false);
  const [discoveredUpdates,  setDiscoveredUpdates]  = useState({newDomains:false});
  const [showAttachmentNotice,setShowAttachmentNotice]=useState(false);
  const [savedMessageIds,    setSavedMessageIds]    = useState<Set<string>>(new Set());
  const [isSettingsOpen,     setIsSettingsOpen]     = useState(false);
  const [userSettings,       setUserSettings]       = useState<UserSettings>(DEFAULT_SETTINGS);
  const [activeTab,          setActiveTab]          = useState<"all"|"dismissed">("all");
  const [readMessageIds,     setReadMessageIds]     = useState<Set<string>>(new Set());
  const [dismissedMessageIds,setDismissedMessageIds]= useState<Set<string>>(new Set());
  const [isStorageLoaded,    setIsStorageLoaded]    = useState(false);
  const [isUpsellOpen,       setIsUpsellOpen]       = useState(false);
  const [isAuthNeedOpen,     setIsAuthNeedOpen]     = useState(false);
  const [upsellFeature,      setUpsellFeature]      = useState("Pro Features");
  const [authNeedFeature,    setAuthNeedFeature]    = useState("LoggedIn Features");
  const [flashQueue,         setFlashQueue]         = useState<{id:string;from:string;subject:string}[]>([]);
  const [newRowIds,          setNewRowIds]          = useState<Set<string>>(new Set());

  const skipNextSettingsSave = useRef(false);
  const originalTitle        = useRef(typeof document!=="undefined" ? document.title : "DITMail");
  const wsRef                = useRef<WebSocket|null>(null);
  const reconnectTimerRef    = useRef<ReturnType<typeof setTimeout>|null>(null);
  const reconnectAttemptsRef = useRef(0);
  const currentEmailRef      = useRef("");
  const sendNotificationRef  = useRef<(t:string,b:string)=>void>(()=>{});
  const setMessagesRef       = useRef(setMessages);
  const isRefreshingThrottleRef = useRef(false); // Throttle hotkey spam

  const openUpsell = (feature: string) => { setUpsellFeature(feature); setIsUpsellOpen(true); };

  const availableDomains = useMemo(() => {
    const custom = initialCustomDomains?.filter((d:any)=>d.verified).map((d:any)=>d.domain)??[];
    return [...new Set([...custom,...FREE_DOMAINS])];
  },[initialCustomDomains]);

  const isSplit   = userSettings.layout==="split"   && isPro;
  const isCompact = userSettings.layout==="compact";
  const isZen     = userSettings.layout==="zen";
  const isMinimal = userSettings.layout==="minimal";
  const isClassic = userSettings.layout==="classic";
  const isMobile  = userSettings.layout==="mobile"  && isPro;
  const isRetro   = userSettings.layout==="retro"   && isPro;

  const renderBadges = useCallback((msg: Message) => {
    const hasOtp    = !!msg.otp;
    const hasVerify = !!msg.verificationLink;
    if (!hasOtp && !hasVerify) return null;
    const isRealOtp  = msg.otp!=="__DETECTED__";
    const isRealLink = msg.verificationLink!=="__DETECTED__";
    return (
      <span className="inline-flex items-center gap-1 flex-wrap">
        {hasOtp && (isPro&&isRealOtp
          ? <OtpChip otp={msg.otp!} onCopy={()=>{navigator.clipboard.writeText(msg.otp!);setOTPCopied(msg.id);setTimeout(()=>setOTPCopied(null),2000);}} copied={otpCopied===msg.id}/>
          : <ProLockChip label="OTP code" blurContent="847291" onUpsell={()=>openUpsell("Auto OTP Extraction")} variant="otp"/>
        )}
        {hasVerify && (isPro&&isRealLink
          ? <VerifyChip url={msg.verificationLink!}/>
          : <ProLockChip label="verify link" blurContent="Verify" onUpsell={()=>openUpsell("Verification Link Detection")} variant="verify"/>
        )}
      </span>
    );
  },[isPro,otpCopied]);

  const connectWebSocket = useCallback(async (mailbox: string) => {
    if (reconnectTimerRef.current){clearTimeout(reconnectTimerRef.current);reconnectTimerRef.current=null;}
    const prev=wsRef.current;
    if(prev){prev.onclose=null;if(prev.readyState<2)prev.close(1000,"mailbox_change");}
    let wsToken="";
    try{
      const res=await fetch("/api/ws-ticket",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mailbox})});
      if (res.ok) { const data=await res.json();wsToken=data.token??""; }
    }catch{}
    const url=`wss://api2.freecustom.email/?mailbox=${encodeURIComponent(mailbox)}&token=${encodeURIComponent(wsToken)}`;
    const ws=new WebSocket(url);wsRef.current=ws;
    ws.onopen=()=>{reconnectAttemptsRef.current=0;};
    ws.onmessage=(ev)=>{
      try{
        const d=JSON.parse(ev.data);
        if(d.type!=="new_mail"||d.mailbox!==currentEmailRef.current)return;
        const msg:Message={id:d.id,from:d.from,to:d.to,subject:d.subject,date:d.date,hasAttachments:d.hasAttachment,otp:d.otp??null,verificationLink:d.verificationLink??null};
        setMessagesRef.current(prev=>{
          if(prev.some(m=>m.id===msg.id))return prev;
          sendNotificationRef.current(`New Email from ${msg.from}`,msg.subject||"(No Subject)");
          return[msg,...prev];
        });
        setFlashQueue(q=>[...q,{id:msg.id,from:msg.from,subject:msg.subject||""}]);
        setNewRowIds(s=>new Set(s).add(msg.id));
        setTimeout(()=>setNewRowIds(s=>{const n=new Set(s);n.delete(msg.id);return n;}),1400);
      }catch(_){}
    };
    ws.onerror=()=>{};
    ws.onclose=(ev)=>{
      if(ev.code===1000)return;
      const delay=Math.min(500*Math.pow(2,reconnectAttemptsRef.current),30_000);
      reconnectAttemptsRef.current++;
      reconnectTimerRef.current=setTimeout(()=>{if(currentEmailRef.current)connectWebSocket(currentEmailRef.current);},delay);
    };
  },[]);

  useEffect(()=>()=>{
    if(reconnectTimerRef.current)clearTimeout(reconnectTimerRef.current);
    const ws=wsRef.current;if(ws){ws.onclose=null;ws.close(1000,"unmount");}
  },[]);

  useEffect(()=>{
    const init=async()=>{
      await fetchToken();
      const localHistory = safeJsonParse<string[]>(localStorage.getItem("emailHistory"), []);
      const lastDomain=localStorage.getItem("lastUsedDomain");
      let initEmail:string,hist:string[];
      
      const savedSettings = safeJsonParse<UserSettings | null>(localStorage.getItem("userSettings"), null);
      if(savedSettings)setUserSettings({...DEFAULT_SETTINGS,...savedSettings});
      
      setReadMessageIds(new Set(safeJsonParse<string[]>(localStorage.getItem("readMessageIds"), [])));
      setDismissedMessageIds(new Set(safeJsonParse<string[]>(localStorage.getItem("dismissedMessageIds"), [])));
      setIsStorageLoaded(true);
      
      if(initialInboxes.length>0){hist=initialInboxes;initEmail=initialCurrentInbox||initialInboxes[0];}
      else if(localHistory.length>0){hist=localHistory;initEmail=localHistory[0];}
      else{const d=getPreferredDomain(availableDomains,lastDomain);initEmail=generateRandomEmail(d);hist=[initEmail];}
      
      if (!email) {
        setEmail(initEmail);
      }
      setEmailHistory(hist);
      setSelectedDomain(initEmail.split("@")[1] || "");
    };
    init();
  },[]);

  useEffect(()=>{
    const fetch_=async()=>{
      if(!isAuthenticated)return;
      try{
        const r=await fetch("/api/user/settings");
        if(r.ok){
          const d=await r.json();
          if(d.settings){skipNextSettingsSave.current=true;setUserSettings(p=>({...p,...d.settings}));localStorage.setItem("userSettings",JSON.stringify({...DEFAULT_SETTINGS,...d.settings}));}
        }
      }catch{}
    };
    if(isStorageLoaded)fetch_();
  },[isAuthenticated,isStorageLoaded]);

  useEffect(()=>{
    if(!isStorageLoaded)return;
    if(skipNextSettingsSave.current){skipNextSettingsSave.current=false;return;}
    localStorage.setItem("userSettings",JSON.stringify(userSettings));
    if(isAuthenticated)fetch("/api/user/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(userSettings)}).catch(()=>{});
  },[userSettings,isStorageLoaded,isAuthenticated]);

  useEffect(()=>{
    const n=messages.filter(m=>!readMessageIds.has(m.id)&&!dismissedMessageIds.has(m.id)).length;
    const base=originalTitle.current.replace(/^\(\d+\)\s*/,"");
    document.title=n>0?`(${n}) ${base}`:base;
  },[messages,readMessageIds,dismissedMessageIds]);

  const sendNotification=(title:string,body:string)=>{
    if(userSettings.sound)try{new Audio("/notification.mp3").play().catch(()=>{});}catch{}
    if(userSettings.notifications&&document.visibilityState!=="visible")new Notification(title,{body,icon:"/logo.webp"});
  };
  useEffect(()=>{sendNotificationRef.current=sendNotification;});
  useEffect(()=>{if(isStorageLoaded)localStorage.setItem("readMessageIds",     JSON.stringify([...readMessageIds]));},     [readMessageIds,    isStorageLoaded]);
  useEffect(()=>{if(isStorageLoaded)localStorage.setItem("dismissedMessageIds",JSON.stringify([...dismissedMessageIds]));}, [dismissedMessageIds,isStorageLoaded]);
  useEffect(()=>{if(selectedDomain)localStorage.setItem("lastUsedDomain",selectedDomain);},[selectedDomain]);

  useEffect(()=>{
    if(!email)return;
    if(isAuthenticated) fetch("/api/user/inboxes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({inboxName:email})}).catch(()=>{});
    
    const h = safeJsonParse<string[]>(localStorage.getItem("emailHistory"), []);
    let next=[email,...h.filter(e=>e!==email)];
    if(userPlan==="free")next=next.slice(0,7);else if(!isAuthenticated)next=next.slice(0,5);
    localStorage.setItem("emailHistory",JSON.stringify(next));setEmailHistory(next);
  },[email,session,userPlan,isAuthenticated]);

  useEffect(()=>{
    if(!email)return;if(isAuthenticated&&!token)return;
    currentEmailRef.current=email;connectWebSocket(email);refreshInbox();
  },[email,token,isAuthenticated,connectWebSocket]); // eslint-disable-line

  const fetchToken=async()=>{
    try{
      const r=await fetch("/api/auth",{method:"POST"});
      if (!r.ok) return null;
      const d=await r.json() as{token?:string};
      if(d.token){setToken(d.token);setCookie("authToken",d.token,{maxAge:3600});return d.token;}
    }catch{}
    return null;
  };

  const refreshInbox=async()=>{
    if (isRefreshingThrottleRef.current) return;
    if (isAuthenticated && !token) return;
    
    isRefreshingThrottleRef.current = true;
    setIsRefreshing(true);
    try{
      const headers:Record<string,string>={"x-fce-client":"web-client"};
      if(token)headers["Authorization"]=`Bearer ${token}`;
      const r=await fetch(`${API_ENDPOINT}?fullMailboxId=${email}`,{headers});
      if(!r.ok)throw new Error(r.status===429?"Refreshing too fast.":`HTTP ${r.status}`);
      const d=await r.json();setShowAttachmentNotice(!!d.wasAttachmentStripped);
      if(d.success&&Array.isArray(d.data)){
        const newMsgs=d.data.filter((m:Message)=>!readMessageIds.has(m.id)&&!messages.some(old=>old.id===m.id));
        if(newMsgs.length>0&&messages.length>0)sendNotification(`New Email from ${newMsgs[0].from}`,newMsgs[0].subject||"(No Subject)");
        setMessages(d.data);
        const ids=new Set<string>();d.data.forEach((msg:Message)=>{if(localStorage.getItem(`saved-msg-${msg.id}`))ids.add(msg.id);});setSavedMessageIds(ids);
      }
    }catch(e){console.error(e);}finally{
      setIsRefreshing(false);
      setTimeout(() => { isRefreshingThrottleRef.current = false; }, 1000); // 1s throttle
    }
  };

  const copyEmail=async()=>{await navigator.clipboard.writeText(email);setCopied(true);setTimeout(()=>setCopied(false),2000);};

  const toggleSaveMessage=async(msg:Message,e:React.MouseEvent)=>{
    e.stopPropagation();if(userPlan!=="free")return;
    if(savedMessageIds.has(msg.id)){localStorage.removeItem(`saved-msg-${msg.id}`);setSavedMessageIds(p=>{const s=new Set(p);s.delete(msg.id);return s;});}
    else{
      try{
        const headers:Record<string,string>={"x-fce-client":"web-client"};
        if(token)headers["Authorization"]=`Bearer ${token}`;
        const r=await fetch(`${API_ENDPOINT}?fullMailboxId=${email}&messageId=${msg.id}`,{headers});
        if (!r.ok) throw new Error("Fetch failed");
        const d=await r.json();
        if(d.success){localStorage.setItem(`saved-msg-${msg.id}`,JSON.stringify(d.data));setSavedMessageIds(p=>new Set(p).add(msg.id));}else setError("Failed to save message.");
      }catch(err){setError(`Save error: ${err}`);}
    }
  };

  const handleMessageAction=(id:string,e:React.MouseEvent)=>{
    e.stopPropagation();
    if(activeTab==="dismissed")setDismissedMessageIds(p=>{const s=new Set(p);s.delete(id);return s;});
    else setDismissedMessageIds(p=>new Set(p).add(id));
  };

  const viewMessage=(msg:Message)=>{
    if(!readMessageIds.has(msg.id))setReadMessageIds(p=>new Set(p).add(msg.id));
    setSelectedMessage(msg);if(!isSplit)setIsMessageModalOpen(true);
  };

  const deleteEmail=()=>{
    const d=getPreferredDomain(availableDomains,localStorage.getItem("lastUsedDomain"));
    const ne=generateRandomEmail(d);setEmail(ne);setSelectedDomain(d);setMessages([]);setReadMessageIds(new Set());setDismissedMessageIds(new Set());
  };

  const handleDeleteAction=(type:"inbox"|"message",id?:string)=>{
    if(!isAuthenticated&&type==="message"){setAuthNeedFeature("Delete Message");setIsAuthNeedOpen(true);return;}
    if(!isPro&&type==="message"){openUpsell("Permanent Deletion");return;}
    if(type==="inbox")deleteEmail();else if(id){setItemToDelete({type:"message",id});setIsDeleteModalOpen(true);}
  };

  const handleDeleteConfirmation=async()=>{
    if(itemToDelete?.type==="email"){const d=getPreferredDomain(availableDomains,localStorage.getItem("primaryDomain"));const ne=generateRandomEmail(d);setEmail(ne);setSelectedDomain(d);setMessages([]);setReadMessageIds(new Set());setDismissedMessageIds(new Set());}
    else if(itemToDelete?.type==="message"&&itemToDelete.id){
      try{
        const headers:Record<string,string>={"x-fce-client":"web-client"};
        if(token)headers["Authorization"]=`Bearer ${token}`;
        const r=await fetch(`${API_ENDPOINT}?fullMailboxId=${email}&messageId=${itemToDelete.id}`,{method:"DELETE",headers});
        if (!r.ok) throw new Error("Delete failed");
        const d=await r.json();
        if(d.success)setMessages(msgs=>msgs.filter(m=>m.id!==itemToDelete.id));else throw new Error(d.message);
      }catch(err){setError(`Delete failed: ${err}`);}
    }
    setIsDeleteModalOpen(false);setItemToDelete(null);
  };

  const changeEmail=()=>{
    if(!isAuthenticated){setIsAuthNeedOpen(true);setAuthNeedFeature("Update Email");return;}
    if(isEditing){const[p]=email.split("@");if(p?.length>0){setEmail(`${p}@${selectedDomain}`);setIsEditing(false);setReadMessageIds(new Set());setDismissedMessageIds(new Set());}else setError("Enter a valid email prefix.");}
    else setIsEditing(true);
  };

  const handleProShortcut =(fn:()=>void,name:string)=>{if(isPro)fn();else openUpsell(`Keyboard Shortcut: ${name}`);};
  const handleAuthShortcut=(fn:()=>void,name:string)=>{if(isAuthenticated)fn();else{setAuthNeedFeature(`Keyboard Shortcut: ${name}`);setIsAuthNeedOpen(true);}};

  useKeyboardShortcuts({
    [userSettings.shortcuts.refresh]:()=>handleAuthShortcut(refreshInbox,"Refresh"),
    [userSettings.shortcuts.copy]:   ()=>handleAuthShortcut(copyEmail,"Copy Email"),
    [userSettings.shortcuts.delete]: ()=>handleDeleteAction("inbox"),
    [userSettings.shortcuts.new]:    ()=>handleProShortcut(changeEmail,"Quick Edit"),
    [userSettings.shortcuts.qr]:     ()=>setIsQRModalOpen(!isQRModalOpen),
  },"pro");

  const filteredMessages=useMemo(()=>{
    if(activeTab==="dismissed")return messages.filter(m=> dismissedMessageIds.has(m.id));
    return messages.filter(m=>!dismissedMessageIds.has(m.id));
  },[messages,activeTab,dismissedMessageIds]);

  // Safely inject layout classes to the body to hide header/footer natively via CSS
  useEffect(()=>{
    if (typeof document !== "undefined") {
      document.body.setAttribute('data-fce-layout', userSettings.layout);
    }
    return () => {
      if (typeof document !== "undefined") document.body.removeAttribute('data-fce-layout');
    };
  },[userSettings.layout]);

  const renderEmptyState=()=>(
    <div className="py-14 flex flex-col items-center text-center px-6">
      <div className="mb-5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground/40">
        <span>$</span>
        <span>LISTEN {email.split("@")[1]||"…"}</span>
        <span className="inline-block w-1.5 h-3.5 bg-muted-foreground/30 animate-pulse"/>
      </div>
      <p className="font-mono text-xs text-muted-foreground/60 mb-1">
        {activeTab==="all"?t("inbox_empty_title"):"No dismissed emails"}
      </p>
      <p className="font-mono text-[11px] text-muted-foreground/40 max-w-xs">
        {activeTab==="all"?t("inbox_empty_subtitle"):"Dismissed emails appear here."}
      </p>
      {activeTab==="all"&&!isPro&&(
        <div className="mt-6 border border-dashed border-border rounded-lg px-5 py-3 max-w-xs space-y-1.5">
          <p className="font-mono text-[10px] text-muted-foreground/60">Stop losing emails when this address expires.</p>
          <a rel="sponsored" href={DOMAIN_AFFILIATE_URL} target="_blank"
            className="inline-flex items-center gap-1 font-mono text-[10px] text-foreground underline underline-offset-2 decoration-border hover:decoration-foreground">
            <Globe className="h-3 w-3"/>Get your own domain →
          </a>
        </div>
      )}
    </div>
  );

  const renderInboxList=()=>(
    <div className="relative">
      <style>{`
        @keyframes rowEnter {
          0%  {opacity:0;transform:translateX(-6px);background-color:hsl(var(--foreground)/0.04);}
          35% {opacity:1;transform:translateX(0);background-color:hsl(var(--foreground)/0.04);}
          100%{background-color:transparent;}
        }
        @keyframes glowFadeOut {
          0%  {opacity:1;}70%{opacity:1;}100%{opacity:0;}
        }
      `}</style>

      <div className="grid items-center border-b border-border bg-muted/20 px-3 py-1.5"
        style={{gridTemplateColumns:"1.25rem 1fr 3.5rem 4rem"}}>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">#</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50 pl-2">From · Subject</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50 text-right">Time</span>
        <span/>
      </div>

      {filteredMessages.length===0 ? renderEmptyState() : (
        <div className="divide-y divide-border/50">
          {filteredMessages.map((msg,idx)=>{
            const isRead    = readMessageIds.has(msg.id);
            const isSelected= selectedMessage?.id===msg.id;
            const isNew     = newRowIds.has(msg.id);
            return (
              <div key={msg.id} onClick={()=>viewMessage(msg)}
                className={cn(
                  "group relative cursor-pointer transition-all duration-200",
                  "grid items-center px-3 gap-0",
                  isCompact?"py-1.5":"py-2.5",
                  isSelected&&isSplit?"bg-foreground/5 border-l-2 border-l-foreground":"hover:bg-muted/25",
                  isNew&&"[animation:rowEnter_0.45s_ease-out]",
                )}
                style={{gridTemplateColumns:"1.25rem 1fr 3.5rem 4rem"}}>

                {isNew&&<div className="absolute inset-y-0 left-0 w-0.5 bg-emerald-500 [animation:glowFadeOut_1.4s_ease-out_forwards]"/>}

                <span className={cn("font-mono text-[10px] tabular-nums shrink-0",isNew?"text-emerald-500 font-bold":"text-muted-foreground/30")}>
                  {isNew?"→":String(idx+1).padStart(2,"0")}
                </span>

                <div className="min-w-0 flex flex-col gap-0.5 pl-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!isCompact&&(
                      <span className={cn("inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-bold font-mono shrink-0",
                        isRead?"bg-muted/40 text-muted-foreground/50":"bg-foreground/8 text-foreground/70")}>
                        {msg.from.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className={cn("font-mono text-xs truncate",isRead?"text-muted-foreground":"text-foreground font-semibold")}>
                      {msg.from.replace(/<.*?>/g,"").trim()||msg.from}
                    </span>
                    {!isRead&&<span className="h-1 w-1 rounded-full bg-foreground shrink-0"/>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pl-0 sm:pl-7">
                    <span className={cn("font-mono text-[11px] truncate flex-1",isRead?"text-muted-foreground/50":"text-muted-foreground")}>
                      {msg.subject||"(no subject)"}
                    </span>
                    {renderBadges(msg)}
                    {msg.hasAttachments&&<Paperclip className="h-2.5 w-2.5 text-muted-foreground/35 shrink-0"/>}
                  </div>
                  {!isCompact&&!isPro&&(
                    <span className="font-mono text-[10px] text-muted-foreground/35 flex items-center gap-1 pl-0 sm:pl-7">
                      <Clock className="h-2.5 w-2.5"/>expires {getExpiry(msg.date,24)}
                    </span>
                  )}
                </div>

                <span className="font-mono text-[10px] text-muted-foreground/50 text-right tabular-nums">
                  {fmtDateShort(msg.date)}
                </span>

                <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                  {userPlan==="free"&&(
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e)=>toggleSaveMessage(msg,e)}>
                      <Star className={cn("h-3 w-3",savedMessageIds.has(msg.id)&&"fill-amber-500 text-amber-500")}/>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e)=>{e.stopPropagation();handleDeleteAction("message",msg.id);}}>
                    <Trash2 className="h-3 w-3"/>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={(e)=>handleMessageAction(msg.id,e)}>
                    {activeTab==="dismissed"?<ArchiveRestore className="h-3 w-3"/>:<Archive className="h-3 w-3"/>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderMobileMessageList=()=>(
    <div className="flex flex-col gap-2 py-2 px-3">
      {filteredMessages.map(msg=>(
        <div key={msg.id} onClick={()=>viewMessage(msg)}
          className="bg-card border border-border rounded-lg p-3 active:scale-[0.98] transition-transform flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
            <span className="font-mono text-xs font-semibold truncate text-foreground">{msg.from}</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] text-muted-foreground truncate">{msg.subject||"(No Subject)"}</span>
              {renderBadges(msg)}
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/50">{fmtDate(msg.date)}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0"/>
        </div>
      ))}
      {filteredMessages.length===0&&renderEmptyState()}
    </div>
  );

  const renderClassicMessageList=()=>(
    <div className="overflow-x-auto">
      <Table><TableBody>
        {filteredMessages.length===0
          ?<tr><td colSpan={4} className="py-8">{renderEmptyState()}</td></tr>
          :filteredMessages.map((msg,i)=>(
            <TableRow key={msg.id} className={cn("border-b border-border/50 transition-colors",i%2===0?"bg-muted/10":"bg-background","hover:bg-muted/20")}>
              <td className="py-2 pl-3 font-mono text-xs truncate max-w-[120px] text-muted-foreground">{msg.from}</td>
              <td className="py-2 px-2"><div className="flex items-center gap-2 flex-wrap"><span className="font-mono text-xs text-foreground">{msg.subject}</span>{renderBadges(msg)}</div></td>
              <td className="py-2 px-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{fmtDateShort(msg.date)}</td>
              <td className="py-2 pr-3">
                <div className="flex items-center gap-1">
                  <Button variant="link" size="sm" className="h-6 px-2 font-mono text-[10px]" onClick={()=>viewMessage(msg)}>{t("view")}</Button>
                  <Button variant="link" size="sm" className="h-6 px-2 font-mono text-[10px] text-destructive" onClick={(e)=>{e.stopPropagation();handleDeleteAction("message",msg.id);}}>{t("delete")}</Button>
                  {userPlan==="free"&&<Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e)=>toggleSaveMessage(msg,e)}><Star className={cn("h-3 w-3",savedMessageIds.has(msg.id)&&"fill-amber-500 text-amber-500")}/></Button>}
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={(e)=>handleMessageAction(msg.id,e)}>
                    {activeTab==="dismissed"?<ArchiveRestore className="h-3 w-3"/>:<Archive className="h-3 w-3"/>}
                  </Button>
                </div>
              </td>
            </TableRow>
          ))}
      </TableBody></Table>
    </div>
  );

  const renderRetroMessageList=()=>(
    <div style={{fontFamily:'"Times New Roman",serif',background:"white",color:"black",padding:20,minHeight:"100vh"}}>
      <h1 style={{fontSize:24,fontWeight:"bold",marginBottom:10}}>Email Box 1.0</h1>
      <div style={{marginBottom:20}}>Welcome, <b>{email}</b>. [<a href="#" onClick={(e)=>{e.preventDefault();refreshInbox();}} style={{color:"blue"}}>Refresh</a>] [<a href="#" onClick={(e)=>{e.preventDefault();setIsSettingsOpen(true);}} style={{color:"blue"}}>Settings</a>]</div>
      <hr/><ul style={{listStyle:"disc",paddingLeft:20,marginTop:10}}>
        {filteredMessages.length===0?<li>No messages.</li>:filteredMessages.map(msg=>(
          <li key={msg.id} style={{marginBottom:5}}>
            <a href="#" onClick={(e)=>{e.preventDefault();viewMessage(msg);}} style={{color:"blue"}}>{msg.subject||"(No Subject)"}</a>
            <span style={{fontSize:12,color:"#555"}}> - {msg.from} ({fmtDate(msg.date)})</span>
          </li>
        ))}
      </ul>
    </div>
  );

  if(isRetro)return(
    <>{renderRetroMessageList()}
      <style dangerouslySetInnerHTML={{__html: `body[data-fce-layout="retro"] header, body[data-fce-layout="retro"] footer, body[data-fce-layout="retro"] nav { display: none !important; }`}} />
      <MessageModal message={selectedMessage} isOpen={isMessageModalOpen} onClose={()=>setIsMessageModalOpen(false)} isPro={isPro} onUpsell={()=>openUpsell("Attachments")} apiEndpoint={API_ENDPOINT}/>
      <SettingsModal isOpen={isSettingsOpen} onClose={()=>setIsSettingsOpen(false)} settings={userSettings} onUpdate={setUserSettings} isPro={isPro} onUpsell={openUpsell} isAuthenticated={isAuthenticated} onAuthNeed={(f:string)=>{setAuthNeedFeature(f);setIsAuthNeedOpen(true);}}/>
    </>
  );

  return(
    <div className={cn("relative",isZen&&"")}>
      
      {/* Global Style Hiding based on layout setting */}
      <style dangerouslySetInnerHTML={{__html: `
        body[data-fce-layout="zen"] header, body[data-fce-layout="zen"] footer, body[data-fce-layout="zen"] nav { display: none !important; }
        body[data-fce-layout="minimal"] footer { display: none !important; }
      `}} />

      {flashQueue.length>0&&(
        <NewEmailFlash
          key={flashQueue[0].id}
          from={flashQueue[0].from}
          subject={flashQueue[0].subject}
          onDone={()=>setFlashQueue(q=>q.slice(1))}
        />
      )}

      <div className={cn("rounded-lg border border-border bg-background overflow-hidden",isZen&&"border-0 bg-transparent")}>

        <div className="border-b border-border">
          <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0",isRefreshing?"bg-amber-500 animate-pulse":"bg-emerald-500 animate-pulse")}/>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              SMTP · {email.split("@")[1]||"…"}
            </span>
            <div className="flex-1"/>
            <span className="font-mono text-[10px] text-muted-foreground/40 tabular-nums">
              {messages.length} msg{messages.length!==1?"s":""}
            </span>
          </div>

          <div className="flex items-start gap-2 px-4 pb-3 pt-0.5">
            {isEditing?(
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={email.split("@")[0]}
                  onChange={(e)=>{const v=e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g,"");setEmail(`${v}@${selectedDomain}`);setBlockButtons(v.length===0);}}
                  className="flex-1 font-mono text-sm h-9"
                  placeholder={t("placeholder_username")}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shrink-0 font-mono text-xs h-9 gap-1 max-w-[160px]">
                      <span className="truncate">@{selectedDomain}</span>
                      <ChevronDown className="h-3 w-3 opacity-50 shrink-0"/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[min(100%,14rem)] max-h-[60vh] overflow-y-auto p-1 rounded-md bg-background shadow-lg border border-border z-50">
                    {availableDomains.map(d=>{
                      const isCustom=!FREE_DOMAINS.includes(d);
                      return(
                        <DropdownMenuItem key={d}
                          onSelect={()=>{if(isCustom&&!isPro){openUpsell("Custom Domains");return;}setSelectedDomain(d);setEmail(`${email.split("@")[0]}@${d}`);}}
                          className="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-muted font-mono text-xs">
                          <div className="flex items-center gap-2">
                            {isCustom&&<Crown className="h-3 w-3 text-amber-500"/>}
                            <span>@{d}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-transparent shrink-0"
                            onClick={(e)=>{e.stopPropagation();if(!isPro){openUpsell("Priority Domain");return;}const c=localStorage.getItem("primaryDomain");if(c===d){localStorage.removeItem("primaryDomain");setPrimaryDomain(null);}else{localStorage.setItem("primaryDomain",d);setPrimaryDomain(d);}}}>
                            <Star className={cn("h-3 w-3",primaryDomain===d?"fill-yellow-500 text-yellow-500":"text-muted-foreground")}/>
                          </Button>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ):(
              <div className="flex-1 min-w-0">
                <div
                  className="flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 group hover:border-foreground/30 transition-colors cursor-text"
                  onClick={isAuthenticated?()=>setIsEditing(true):undefined}
                >
                  <span className="font-mono text-[10px] text-muted-foreground/40 shrink-0 select-none">TO</span>
                  <span className="font-mono text-sm text-foreground flex-1 truncate">{email||t("loading")}</span>
                  {isAuthenticated&&(
                    <Edit className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"/>
                  )}
                </div>
                {!isPro&&(
                  <p className="font-mono text-[10px] text-muted-foreground/50 mt-1 pl-1">
                    Own domain?{" "}
                    <a rel="sponsored" href={DOMAIN_AFFILIATE_URL} target="_blank"
                      className="text-foreground/60 hover:text-foreground underline underline-offset-2 transition-colors">
                      Get from Namecheap →
                    </a>
                  </p>
                )}
              </div>
            )}

            <TooltipProvider delayDuration={200}>
              <div className="flex gap-1.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 relative" onClick={copyEmail} disabled={blockButtons}>
                      <Copy className={cn("h-3.5 w-3.5 absolute transition-all",copied&&"opacity-0 scale-75")}/>
                      <Check className={cn("h-3.5 w-3.5 absolute transition-all",!copied&&"opacity-0 scale-75")}/>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="font-mono text-[10px]">Copy · C</p></TooltipContent>
                </Tooltip>
                <Button variant="outline" size="icon" className="h-9 w-9 hidden sm:flex" onClick={()=>setIsQRModalOpen(true)} disabled={blockButtons}>
                  <QrCode className="h-3.5 w-3.5"/>
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={()=>setIsSettingsOpen(true)} disabled={blockButtons}>
                  <Settings className="h-3.5 w-3.5"/>
                </Button>
                <ShareDropdown/>
              </div>
            </TooltipProvider>
          </div>

          {!isZen&&(
            <div className="flex gap-px border-t border-border" style={{background:"var(--border)"}}>
              {([
                {icon:<RefreshCw className={cn("h-3 w-3",isRefreshing&&"animate-spin")}/>, label:isRefreshing?t("refreshing"):t("refresh"), hint:"R", disabled:blockButtons||isRefreshing, onClick:refreshInbox},
                {icon:isEditing?<CheckCheck className="h-3 w-3"/>:<Edit className="h-3 w-3"/>, label:isEditing?t("save"):t("change"), hint:"N", disabled:blockButtons, onClick:()=>{changeEmail();setDiscoveredUpdates({newDomains:true});}},
                {icon:<Trash2 className="h-3 w-3"/>, label:t("delete"), hint:"D", disabled:blockButtons, onClick:()=>handleDeleteAction("inbox")},
                {icon:<ListOrdered className="h-3 w-3"/>, label:"Manage", hint:"", disabled:false, onClick:()=>{if(isPro)setIsManageModalOpen(true);else openUpsell("Inbox Management");}},
              ] as const).map(({icon,label,hint,disabled,onClick})=>(
                <button key={label} disabled={disabled as boolean} onClick={onClick as ()=>void}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-background hover:bg-muted/30 transition-colors font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed">
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                  {hint&&<span className="hidden sm:inline font-mono text-[9px] text-muted-foreground/35 normal-case tracking-normal">{hint}</span>}
                </button>
              ))}
            </div>
          )}

          {!isZen&&(
            <div className="flex gap-px border-t border-border" style={{background:"var(--border)"}}>
              {(["all","dismissed"] as const).map(tab=>{
                const unread=tab==="all"?filteredMessages.filter(m=>!readMessageIds.has(m.id)).length:0;
                return(
                  <button key={tab} onClick={()=>setActiveTab(tab)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors",
                      activeTab===tab?"bg-background text-foreground":"bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground"
                    )}>
                    {tab==="all"?<Mail className="h-3 w-3"/>:<Archive className="h-3 w-3"/>}
                    {tab}
                    {unread>0&&<span className="font-mono text-[9px] border border-border rounded-sm px-1 py-px tabular-nums leading-none">{unread}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {isSplit?(
          <div className="grid grid-cols-1 md:grid-cols-2 h-[560px]">
            <div className="border-r border-border overflow-y-auto">{renderInboxList()}</div>
            <div className="overflow-hidden flex flex-col bg-muted/5">
              {selectedMessage
                ?<SplitPaneMessageView message={selectedMessage} token={token} apiEndpoint={API_ENDPOINT} isPro={isPro} onUpsell={openUpsell}/>
                :<div className="flex flex-col items-center justify-center h-full gap-2"><Mail className="w-8 h-8 opacity-15"/><span className="font-mono text-[11px] text-muted-foreground/40">select a message</span></div>
              }
            </div>
          </div>
        ):isClassic?renderClassicMessageList()
         :isMobile ?renderMobileMessageList()
         :renderInboxList()
        }

        {!isZen&&(
          <div className="border-t border-border">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="flex-1 px-4 py-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t("history_title")}</p>
                <ul className="space-y-1.5">
                  {emailHistory.map((he,i)=>(
                    <li key={i} className="flex items-center justify-between gap-2 group">
                      <span className="font-mono text-[11px] text-muted-foreground/60 truncate group-hover:text-muted-foreground transition-colors">{he}</span>
                      <button onClick={()=>{setEmail(he);setOldEmailUsed(!oldEmailUsed);}}
                        className="font-mono text-[10px] text-foreground/50 hover:text-foreground transition-colors whitespace-nowrap shrink-0 underline underline-offset-2 decoration-border hover:decoration-foreground">
                        {t("history_use")}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {!isPro&&(
                <div className="md:w-72 shrink-0 px-4 py-4">
                  <DomainPromoCard/>
                </div>
              )}
            </div>
          </div>
        )}

        {!isZen&&(
          <div className="border-t border-border px-4 py-3 bg-muted/5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Inbox</p>
            <h2 className="text-sm font-semibold text-foreground">{t("card_header_title")}</h2>
            <p className="font-mono text-[11px] text-muted-foreground/60 mt-0.5 leading-relaxed">{t("card_header_p")}</p>
          </div>
        )}

        {showAttachmentNotice&&!isZen&&(
          <div className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-2.5 cursor-pointer hover:bg-amber-500/10 transition-colors" onClick={()=>openUpsell("Large Attachments")}>
            <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Lock className="h-3 w-3"/>Large attachment stripped — upgrade to Pro to receive files up to 25 MB
            </span>
          </div>
        )}
      </div>

      <ManageInboxesModal isOpen={isManageModalOpen} onClose={()=>setIsManageModalOpen(false)} inboxes={initialInboxes} onSelectInbox={(he)=>{setEmail(he);setSelectedDomain(he.split("@")[1]);setIsEditing(false);}}/>
      <QRCodeModal email={email} isOpen={isQRModalOpen} onClose={()=>setIsQRModalOpen(false)}/>
      <MessageModal message={selectedMessage} isOpen={isMessageModalOpen} onClose={()=>setIsMessageModalOpen(false)} isPro={isPro} onUpsell={()=>openUpsell("Attachments")} apiEndpoint={API_ENDPOINT}/>
      <SettingsModal isOpen={isSettingsOpen} onClose={()=>setIsSettingsOpen(false)} settings={userSettings} onUpdate={setUserSettings} isPro={isPro} onUpsell={openUpsell} isAuthenticated={isAuthenticated} onAuthNeed={(f:string)=>{setAuthNeedFeature(f);setIsAuthNeedOpen(true);}}/>
      <UpsellModal isOpen={isUpsellOpen} onClose={()=>setIsUpsellOpen(false)} featureName={upsellFeature}/>
      <AuthNeed isOpen={isAuthNeedOpen} onClose={()=>setIsAuthNeedOpen(false)} featureName={authNeedFeature}/>
      {error&&<ErrorPopup message={error} onClose={()=>setError(null)}/>}
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={()=>setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirmation} itemToDelete={itemToDelete?.type==="email"?"email address":"message"}/>
    </div>
  );
}