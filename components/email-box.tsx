"use client";

import { useState, useEffect, useMemo } from "react";
import { getCookie, setCookie } from "cookies-next";
import { Mail, RefreshCw, Trash2, Edit, QrCode, Copy, Check, CheckCheck, Star, ListOrdered, RotateCwSquare, Clock, AlertTriangle, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { QRCodeModal } from "./qr-code-modal";
import { cn } from "@/lib/utils";
import { MessageModal } from "./message-modal";
import { ErrorPopup } from "./error-popup";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { ShareDropdown } from "./ShareDropdown";
import { AnimatePresence, motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { useTranslations } from "next-intl";
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Session } from "next-auth";
import { ManageInboxesModal } from "./manage-inboxes-modal";
import { UpsellModal } from "./upsell-modal"; // <-- Import Upsell Modal

const FREE_DOMAINS = [
  "saleis.live", "arrangewith.me", "areueally.info", "ditapi.info",
  "ditcloud.info", "ditdrive.info", "ditgame.info", "ditlearn.info",
  "ditpay.info", "ditplay.info", "ditube.info", "junkstopper.info"
];

function generateRandomEmail(domain: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const length = 6;
  let prefix = "";
  for (let i = 0; i < length; i++) {
    prefix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}@${domain}`;
}

// --- PRIVACY AD COMPONENT ---
const PrivacyAdSide = () => (
    <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 text-center mb-6">
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
        <EyeOff className="w-3 h-3" /> Privacy-Safe Ad
      </div>
      <div className="text-xs text-muted-foreground">
        Keeping this service free & private. <br/>
        <span className="font-semibold text-primary">Upgrade to remove.</span>
      </div>
    </div>
);

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
}

interface EmailBoxProps {
  initialSession: Session | null;
  initialCustomDomains: any[];
  initialInboxes: string[];
  initialCurrentInbox: string | null;
}

const getPreferredDomain = (
  availableDomains: string[],
  lastUsedDomain: string | null
): string => {
  if (lastUsedDomain && availableDomains.includes(lastUsedDomain)) {
    return lastUsedDomain;
  }
  const firstAvailableDomain = availableDomains[0];
  const isFirstDomainCustom = firstAvailableDomain && !FREE_DOMAINS.includes(firstAvailableDomain);
  if (isFirstDomainCustom) {
    return firstAvailableDomain;
  }
  return firstAvailableDomain || FREE_DOMAINS[0];
};

export function EmailBox({
  initialSession,
  initialCustomDomains,
  initialInboxes,
  initialCurrentInbox
}: EmailBoxProps) {
  const t = useTranslations('EmailBox');
  const [session] = useState(initialSession);
  const isAuthenticated = !!session;
  const userPlan = session?.user?.plan || 'none'; // 'none', 'free', 'pro'
  const isPro = userPlan === 'pro';

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [emailHistory, setEmailHistory] = useState<string[]>(initialInboxes);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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
  
  // --- UPSELL STATE ---
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState("Pro Features");

  const openUpsell = (feature: string) => {
    setUpsellFeature(feature);
    setIsUpsellOpen(true);
  };

  const availableDomains = useMemo(() => {
    const verifiedCustomDomains = initialCustomDomains?.filter((d: any) => d.verified).map((d: any) => d.domain) ?? [];
    return [...new Set([...verifiedCustomDomains, ...FREE_DOMAINS])];
  }, [initialCustomDomains]);

  const updateUserInbox = async (newInbox: string) => {
    if (!isAuthenticated || !newInbox) return;
    try {
      await fetch('/api/user/inboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inboxName: newInbox }),
      });
    } catch (err) {
      console.error("Error syncing inbox:", err);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchToken();
      const localHistory: string[] = JSON.parse(localStorage.getItem('emailHistory') || '[]');
      const lastUsedDomain: string | null = localStorage.getItem('lastUsedDomain');
      const initialDomain = getPreferredDomain(availableDomains, lastUsedDomain);
      let effectiveInitialEmail: string | null = null;
      let historyToDisplay: string[] = [];

      if (initialInboxes.length > 0) {
        historyToDisplay = initialInboxes;
        effectiveInitialEmail = initialCurrentInbox || initialInboxes[0];
      } else if (localHistory.length > 0) {
        historyToDisplay = localHistory;
        effectiveInitialEmail = localHistory[0];
      } else {
        effectiveInitialEmail = generateRandomEmail(initialDomain);
        historyToDisplay = [effectiveInitialEmail];
      }

      setEmail(effectiveInitialEmail);
      setEmailHistory(historyToDisplay);
      setSelectedDomain(effectiveInitialEmail.split('@')[1]);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!email) return;
    updateUserInbox(email);
    const currentLocalHistory: string[] = JSON.parse(localStorage.getItem('emailHistory') || '[]');
    let newHistory = [email, ...currentLocalHistory.filter(e => e !== email)];

    if (userPlan === 'free') {
      newHistory = newHistory.slice(0, 7);
    } else if (!isAuthenticated) {
      newHistory = newHistory.slice(0, 5);
    }
    localStorage.setItem('emailHistory', JSON.stringify(newHistory));
    setEmailHistory(newHistory);
  }, [email, session]);

  useEffect(() => {
    if (selectedDomain) {
      localStorage.setItem('lastUsedDomain', selectedDomain);
    }
  }, [selectedDomain]);

  useEffect(() => {
    if (!email || !token) return;
    refreshInbox();
    const socket = new WebSocket(`wss://api2.freecustom.email/?mailbox=${email}`);
    socket.onopen = () => console.log("WebSocket connection established");
    socket.onmessage = () => refreshInbox();
    return () => socket.close();
  }, [email, token]);

  const checkSavedMessages = (currentMessages: Message[]) => {
    const savedIds = new Set<string>();
    currentMessages.forEach(msg => {
      if (localStorage.getItem(`saved-msg-${msg.id}`)) {
        savedIds.add(msg.id);
      }
    });
    setSavedMessageIds(savedIds);
  };

  const useHistoryEmail = (historyEmail: string) => {
    setEmail(historyEmail);
    setSelectedDomain(historyEmail.split('@')[1]);
    setIsEditing(false);
  };

  const deleteEmail = () => {
    const lastUsedDomain = localStorage.getItem('lastUsedDomain');
    const domainToUse = getPreferredDomain(availableDomains, lastUsedDomain);
    const newEmail = generateRandomEmail(domainToUse);
    setEmail(newEmail);
    setSelectedDomain(domainToUse);
    setMessages([]);
  };

  const handleDomainChange = (newDomain: string) => {
    setSelectedDomain(newDomain);
    const prefix = email.split("@")[0];
    setEmail(`${prefix}@${newDomain}`);
  };

  const shortcuts = {
    'r': () => refreshInbox(),
    'c': () => copyEmail(),
    'd': () => deleteEmail(),
    'n': () => isAuthenticated && changeEmail(),
  };
  useKeyboardShortcuts(shortcuts, userPlan || 'anonymous');

  const fetchToken = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/auth", { method: "POST" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json() as { token?: string };
      if (data.token) {
        setToken(data.token);
        setCookie("authToken", data.token, { maxAge: 3600 });
        return data.token;
      }
      throw new Error("No token received from server");
    } catch (error) {
      setError(`Error fetching token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const refreshInbox = async () => {
    if (!token) {
      setError('Not authenticated');
      return;
    }
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/mailbox?fullMailboxId=${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setShowAttachmentNotice(!!data.wasAttachmentStripped);
      const typedData = data as { success: boolean; data: Message[]; message?: string };
      if (typedData.success && Array.isArray(typedData.data)) {
        setMessages(typedData.data);
        checkSavedMessages(typedData.data);
      } else {
        throw new Error(typedData.message || 'Failed to fetch messages');
      }
    } catch (error) {
      setError(`Error fetching inbox: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSaveMessage = async (message: Message) => {
    if (userPlan !== 'free') return; // Only free users save to browser (Pro saves to cloud auto)

    const isSaved = savedMessageIds.has(message.id);
    const messageId = message.id;

    if (isSaved) {
      localStorage.removeItem(`saved-msg-${messageId}`);
      setSavedMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    } else {
      try {
        const response = await fetch(`/api/mailbox?fullMailboxId=${email}&messageId=${messageId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          localStorage.setItem(`saved-msg-${messageId}`, JSON.stringify(data.data));
          setSavedMessageIds(prev => new Set(prev).add(messageId));
        } else {
          setError('Failed to fetch message details for saving.');
        }
      } catch (err) {
        setError(`Error saving message: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const deleteMessage = (messageId: string) => {
    setItemToDelete({ type: 'message', id: messageId });
    setIsDeleteModalOpen(true);
  };

  const viewMessage = async (message: Message) => {
    setSelectedMessage(message);
    setIsMessageModalOpen(true);
  };

  const handleDeleteConfirmation = async () => {
    if (itemToDelete?.type === 'email') {
      let domain = localStorage.getItem('primaryDomain') as string;
      if (!domain || !availableDomains.includes(domain)) {
        domain = availableDomains[Math.floor(Math.random() * availableDomains.length)];
      }
      const newEmail = generateRandomEmail(domain);
      setEmail(newEmail);
      setSelectedDomain(domain);
      setMessages([]);
      if (email && token) {
        refreshInbox();
      }
    } else if (itemToDelete?.type === 'message' && itemToDelete.id) {
      try {
        const response = await fetch(`/api/mailbox?fullMailboxId=${email}&messageId=${itemToDelete.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const typedData = data as { success: boolean; message?: string };
        if (typedData.success) {
          setMessages(messages.filter(m => m.id !== itemToDelete.id));
        } else {
          throw new Error(typedData.message || 'Failed to delete message');
        }
      } catch (error) {
        setError(`Error deleting message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleEmailInputChage = (newPrefix: string) => {
    newPrefix = newPrefix.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    setEmail(`${newPrefix}@${selectedDomain}`);
    setBlockButtons(newPrefix.length === 0);
  };

  const changeEmail = () => {
    if (!isAuthenticated) {
      const newEmail = generateRandomEmail(selectedDomain);
      setEmail(newEmail);
      return;
    }
    if (isEditing) {
      const [prefix] = email.split('@');
      if (prefix && prefix.length > 0) {
        setEmail(`${prefix}@${selectedDomain}`);
        setIsEditing(false);
      } else {
        setError('Please enter a valid email prefix.');
      }
    } else {
      setIsEditing(true);
    }
  };

  const handlePrimaryDomainChange = (domain: string) => {
    const current = localStorage.getItem('primaryDomain');
    if (current === domain) {
      localStorage.removeItem('primaryDomain');
      setPrimaryDomain(null);
    } else {
      localStorage.setItem('primaryDomain', domain);
      setPrimaryDomain(domain);
    }
  };

  const handleNewDomainUpdates = () => {
    setDiscoveredUpdates({ newDomains: true });
    localStorage.setItem('discoveredUpdates', JSON.stringify({ newDomains: true }));
  };

  return (
    <Card className="border-dashed">
      <CardContent className="space-y-4 pt-10">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={email.split('@')[0]}
                onChange={(e) => handleEmailInputChage(e.target.value)}
                className="flex-1 r"
                placeholder={t('placeholder_username')}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-1/2 truncate">
                    {selectedDomain || t('select_domain')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[min(100%,14rem)] max-h-[60vh] overflow-y-auto p-1 rounded-md bg-white dark:bg-zinc-900 shadow-lg border border-muted z-50 custom-scrollbar">
                  {availableDomains.map((domain) => {
                    const isCustom = !FREE_DOMAINS.includes(domain);
                    return (
                      <DropdownMenuItem
                        key={domain}
                        onSelect={() => handleDomainChange(domain)}
                        className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-muted dark:hover:bg-zinc-800"
                      >
                        <div className="flex items-center gap-2">
                          {isCustom && <Crown className="h-4 w-4 text-amber-500" />}
                          <span>{domain}</span>
                        </div>
                        <Button
                          title={primaryDomain === domain ? t('unset_primary') : t('set_primary')}
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handlePrimaryDomainChange(domain); }}
                          aria-label={`Set ${domain} as primary`}
                          className="hover:bg-transparent"
                        >
                          <Star className={`h-4 w-4 ${primaryDomain === domain ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                        </Button>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex-1 rounded-md bg-muted p-2">{email || t('loading')}</div>
          )}
          <TooltipProvider delayDuration={200}>
            <div className="flex gap-2" role="group" aria-label="Email actions">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="icon" onClick={copyEmail} className="relative" disabled={blockButtons} aria-label="Copy email address" title="Copy email address">
                    <Copy className={cn("h-4 w-4 transition-all", copied && "opacity-0")} />
                    <span className={cn("absolute inset-0 flex items-center justify-center transition-all", copied ? "opacity-100" : "opacity-0")}>
                      <Check className="h-4 w-4 transition-all" />
                    </span>
                    <span className="absolute top-[-2px] text-xs right-0 hidden sm:block">C</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isAuthenticated ? 'Press C to copy' : 'Login to use shortcuts'}</p></TooltipContent>
              </Tooltip>
              <Button className="hidden xs:flex" variant="secondary" size="icon" onClick={() => setIsQRModalOpen(true)} disabled={blockButtons} title={t('show_qr')} aria-label={t('show_qr')}>
                <QrCode className="h-4 w-4" />
              </Button>
              <ShareDropdown />
            </div>
          </TooltipProvider>
        </div>
        <TooltipProvider delayDuration={200}>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Email management actions">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled={blockButtons || isRefreshing} variant="outline" className="flex-1" onClick={refreshInbox} aria-label={isRefreshing ? t('refreshing') : t('refresh')}>
                  <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                  <span className="hidden sm:inline">{isRefreshing ? t('refreshing') : t('refresh')}</span>
                  <Badge variant="outline" className="ml-auto hidden sm:block">R</Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{isAuthenticated ? 'Press R to refresh' : 'Login to use shortcuts'}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled={blockButtons} variant="outline" className="flex-1" onClick={() => { changeEmail(); handleNewDomainUpdates(); }} aria-label={isEditing ? t('save') : t('change')}>
                  {!session?.user ? <RotateCwSquare className="mr-2 h-4 w-4" /> : isEditing ? <CheckCheck className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                  <span className="hidden sm:inline">{!session?.user ? t('change') : isEditing ? t('save') : t('change')}</span>
                  {isAuthenticated && <Badge variant="outline" className="ml-auto hidden sm:block">N</Badge>}
                  <AnimatePresence>
                    {!discoveredUpdates.newDomains && (
                      <motion.span key="new-badge" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="text-[10px] bg-black text-white rounded-full px-1.5">{t('new')}</motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{!isAuthenticated ? 'Login to edit and use its shortcut' : (isPro) ? 'Press N to edit' : 'Only for PRO users'}</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled={blockButtons} variant="outline" className="flex-1" onClick={deleteEmail} aria-label={t('delete')}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{t('delete')}</span>
                  <Badge variant="outline" className="ml-auto hidden sm:block">D</Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{!isAuthenticated ? 'Login to use shortcuts' : (isPro) ? 'Press D to delete' : 'Only for PRO users'}</p></TooltipContent>
            </Tooltip>
            {(isPro) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="flex-1" onClick={() => setIsManageModalOpen(true)} aria-label="Manage all inboxes">
                    <ListOrdered className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Manage Inboxes</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>View and manage your full inbox history.</p></TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
        
        {/* --- EXPIRATION & UPSELL NOTICE --- */}
        {!isPro && messages.length > 0 && (
            <div 
                className="group flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                onClick={() => openUpsell("Permanent Cloud Storage")}
            >
                <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-500">
                    <Clock className="h-4 w-4" />
                    <span>
                        Emails in this inbox will be deleted in <strong>{userPlan === 'free' ? '24 hours' : '12 hours'}</strong>.
                    </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 group-hover:underline">
                    Prevent deletion <Crown className="h-3 w-3" />
                </div>
            </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table_sender')}</TableHead>
              <TableHead>{t('table_subject')}</TableHead>
              <TableHead>{t('table_date')}</TableHead>
              <TableHead>{t('table_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <div className="py-12">
                    <div className="mb-4 flex justify-center"><Mail className="h-12 w-12 text-muted-foreground" /></div>
                    <div className="text-lg font-medium">{t('inbox_empty_title')}</div>
                    <div className="text-sm text-muted-foreground">{t('inbox_empty_subtitle')}</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message, index) => (
                <TableRow key={message.id} className={index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}>
                  <TableCell>{message.from}</TableCell>
                  <TableCell>{message.subject}</TableCell>
                  <TableCell>{new Date(message.date).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="link" onClick={() => viewMessage(message)}>{t('view')}</Button>
                    <Button variant="link" onClick={() => deleteMessage(message.id)}>{t('delete')}</Button>
                    {(userPlan === 'free') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title={savedMessageIds.has(message.id) ? "Unsave from Browser" : "Save to Browser"}
                        onClick={() => toggleSaveMessage(message)}
                      >
                        <Star className={cn("h-4 w-4", savedMessageIds.has(message.id) && "fill-amber-500 text-amber-500")} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-8 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{t('history_title')}</h3>
                <ul className="space-y-2">
                    {emailHistory.map((historyEmail, index) => (
                    <li key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{historyEmail}</span>
                        <Button variant="ghost" size="sm" onClick={() => { setEmail(historyEmail); setOldEmailUsed(!oldEmailUsed); }}>{t('history_use')}</Button>
                    </li>
                    ))}
                </ul>
            </div>
            
            {/* Sidebar for Ads (Non-Pro) */}
            {!isPro && (
                <div className="w-full md:w-64 shrink-0">
                    <PrivacyAdSide />
                </div>
            )}
        </div>

      </CardContent>
      {showAttachmentNotice && (
        <div 
            className="p-3 mb-4 mx-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 text-center cursor-pointer hover:underline"
            onClick={() => openUpsell("Large Attachments")}
        >
          An email arrived with a large attachment. Upgrade to Pro to view files up to 25MB.
        </div>
      )}
      <CardHeader>
        <h2 className="text-xl font-semibold">{t('card_header_title')}</h2>
        <p className="text-sm text-muted-foreground">{t('card_header_p')}</p>
      </CardHeader>
      
      {/* Modals */}
      <ManageInboxesModal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} inboxes={initialInboxes} onSelectInbox={useHistoryEmail} />
      <QRCodeModal email={email} isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
      
      <MessageModal 
        message={selectedMessage} 
        isOpen={isMessageModalOpen} 
        onClose={() => setIsMessageModalOpen(false)} 
        isPro={isPro} // Pass Pro status
        onUpsell={() => openUpsell("Attachments")} // Handle Upsell Trigger
      />
      
      <UpsellModal 
        isOpen={isUpsellOpen} 
        onClose={() => setIsUpsellOpen(false)} 
        featureName={upsellFeature} 
      />
      
      {error && (<ErrorPopup message={error} onClose={() => setError(null)} />)}
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirmation} itemToDelete={itemToDelete?.type === 'email' ? 'email address' : 'message'} />
    </Card>
  );
}