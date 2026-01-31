// components/email-box.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getCookie, setCookie } from "cookies-next";
import { Mail, RefreshCw, Trash2, Edit, QrCode, Copy, Check, CheckCheck, Star, ListOrdered, Clock, AlertTriangle, EyeOff, Archive, ArchiveRestore, Settings, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QRCodeModal } from "./qr-code-modal";
import { cn } from "@/lib/utils";
import { MessageModal } from "./message-modal";
import { ErrorPopup } from "./error-popup";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { ShareDropdown } from "./ShareDropdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Session } from "next-auth";
import { ManageInboxesModal } from "./manage-inboxes-modal";
import { UpsellModal } from "./upsell-modal";
import { AuthNeed } from "./auth-needed-moda"; // Fixed typo: moda -> modal
import { SettingsModal, UserSettings, DEFAULT_SETTINGS } from "./settings-modal";

const FREE_DOMAINS = [
  "areueally.info", "ditapi.info",
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
      Keeping this service free & private. <br />
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
  text?: string;
  html?: string;
  hasAttachments?: boolean;
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

// Helper for nice dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

// Helper for Expiration Date
const getExpirationDate = (dateString: string, hours: number) => {
  const date = new Date(dateString);
  date.setHours(date.getHours() + hours);

  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const isTomorrow = date.getDate() !== now.getDate();

  const timeStr = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric', hour12: true });

  if (diff <= 0) return "Expired";
  if (isTomorrow) return `Tomorrow at ${timeStr}`;
  return `Today at ${timeStr}`;
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
  // @ts-ignore
  const userPlan = session?.user?.plan || 'none';
  const isPro = userPlan === 'pro';

  // --- DYNAMIC ENDPOINT SELECTION ---
  const API_ENDPOINT = isAuthenticated ? '/api/private-mailbox' : '/api/public-mailbox';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [discoveredUpdates, setDiscoveredUpdates] = useState({ newDomains: false });
  const [showAttachmentNotice, setShowAttachmentNotice] = useState(false);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  
  // SETTINGS STATE
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // --- SMART OTP EXTRACTION (Client Side) ---
  const extractOtp = (message: Message): string | null => {
    if (!message.subject) return null;
    const subject = message.subject;
    const otpRegex = /(?:code|otp|verification|pin).*?(\b\d{4,8}\b)/i;
    const match = subject.match(otpRegex);
    if (match && match[1]) return match[1];
    const simple6 = subject.match(/\b\d{6}\b/);
    if (simple6) return simple6[0];
    return null;
  };

  // --- NEW STATE FOR UI ---
  const [activeTab, setActiveTab] = useState<'all' | 'dismissed'>('all');
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [dismissedMessageIds, setDismissedMessageIds] = useState<Set<string>>(new Set());
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  // --- UPSELL STATE ---
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [isAuthNeedOpen, setIsAuthNeedOpen] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState("Pro Features");
  const [authNeedFeature, setAuthNeedFeature] = useState("LoggedIn Features");

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

      try {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
           setUserSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
        }
      } catch (e) {
        console.error("Error loading settings", e);
      }

      try {
        const savedReadIds = JSON.parse(localStorage.getItem('readMessageIds') || '[]');
        setReadMessageIds(new Set(savedReadIds));

        const savedDismissedIds = JSON.parse(localStorage.getItem('dismissedMessageIds') || '[]');
        setDismissedMessageIds(new Set(savedDismissedIds));
      } catch (e) {
        console.error("Error loading local storage state", e);
      } finally {
        setIsStorageLoaded(true);
      }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem('userSettings', JSON.stringify(userSettings));

    if (isAuthenticated) {
        fetch('/api/user/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userSettings)
        }).catch(e => console.error("Sync settings failed", e));
    }
  }, [userSettings, isStorageLoaded, isAuthenticated]);


  const sendNotification = (title: string, body: string) => {
    if (userSettings.sound) {
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log("Audio play failed (user interaction needed first)", e));
      } catch (e) {
        // ignore audio errors
      }
    }

    if (userSettings.notifications && document.visibilityState !== "visible") {
      new Notification(title, {
        body,
        icon: '/logo.webp'
      });
    }
  };

  useEffect(() => {
    if (isStorageLoaded) {
      localStorage.setItem('readMessageIds', JSON.stringify(Array.from(readMessageIds)));
    }
  }, [readMessageIds, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
      localStorage.setItem('dismissedMessageIds', JSON.stringify(Array.from(dismissedMessageIds)));
    }
  }, [dismissedMessageIds, isStorageLoaded]);


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
  }, [email, session, isAuthenticated, userPlan]);

  useEffect(() => {
    if (selectedDomain) {
      localStorage.setItem('lastUsedDomain', selectedDomain);
    }
  }, [selectedDomain]);

  useEffect(() => {
    if (!email || (isAuthenticated && !token)) return;
    refreshInbox();
    const socket = new WebSocket(`wss://api2.freecustom.email/?mailbox=${email}`);
    socket.onopen = () => console.log("WebSocket connection established");
    socket.onmessage = () => refreshInbox();
    return () => socket.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, token, isAuthenticated]);

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
    setReadMessageIds(new Set());
    setDismissedMessageIds(new Set());
  };

  const handleDomainChange = (newDomain: string) => {
    setSelectedDomain(newDomain);
    const prefix = email.split("@")[0];
    setEmail(`${prefix}@${newDomain}`);
  };

  // --- KEYBOARD SHORTCUTS HANDLER ---
  const handleProShortcut = (action: () => void, featureName: string) => {
    if (isPro) {
      action();
    } else {
      openUpsell(`Keyboard Shortcut: ${featureName}`);
    }
  };
  const handleAuthNeededShortcut = (action: () => void, featureName: string) => {
    if (isAuthenticated) {
      action();
    } else {
      setAuthNeedFeature(`Keyboard Shortcut: ${featureName}`);
      setIsAuthNeedOpen(true)
    }
  };

  const shortcuts = {
    [userSettings.shortcuts.refresh]: () => handleAuthNeededShortcut(refreshInbox, 'Refresh Inbox'),
    [userSettings.shortcuts.copy]: () => handleAuthNeededShortcut(copyEmail, 'Copy Email'),
    [userSettings.shortcuts.delete]: () => handleProShortcut(deleteEmail, "Delete / Burn Email"),
    [userSettings.shortcuts.new]: () => handleProShortcut(changeEmail, "Quick Edit"),
    [userSettings.shortcuts.qr]: () => setIsQRModalOpen(!isQRModalOpen)
  };

  useKeyboardShortcuts(shortcuts, 'pro');

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
      return null;
    }
  };

  const refreshInbox = async () => {
    if (isAuthenticated && !token) {
      return;
    }

    setIsRefreshing(true);
    try {
      const headers: Record<string, string> = {
        'x-fce-client': 'web-client'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_ENDPOINT}?fullMailboxId=${email}`, {
        headers
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("You are refreshing too fast.");
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setShowAttachmentNotice(!!data.wasAttachmentStripped);
      const typedData = data as { success: boolean; data: Message[]; message?: string };
      if (typedData.success && Array.isArray(typedData.data)) {
        // DETECT NEW MESSAGES FOR NOTIFICATION
        const newMsgs = typedData.data.filter(m => !readMessageIds.has(m.id) && !messages.some(old => old.id === m.id));
        
        // Update unread count for Title
        const unreadCount = typedData.data.filter(m => !readMessageIds.has(m.id)).length;
        if (unreadCount > 0) {
            document.title = `(${unreadCount}) ${email} - Free Custom Email`;
        } else {
             document.title = `${email} - Free Custom Email`;
        }

        if (newMsgs.length > 0 && messages.length > 0) {
             const latest = newMsgs[0];
             sendNotification(`New Email from ${latest.from}`, latest.subject || "(No Subject)");
        }

        setMessages(typedData.data);
        checkSavedMessages(typedData.data);
      } else {
        throw new Error(typedData.message || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSaveMessage = async (message: Message, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userPlan !== 'free') return;

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
        const headers: Record<string, string> = { 'x-fce-client': 'web-client' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_ENDPOINT}?fullMailboxId=${email}&messageId=${messageId}`, {
          headers
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

  const handleMessageAction = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTab === 'dismissed') {
      // Restore action
      setDismissedMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
      return;
    }
    setDismissedMessageIds(prev => new Set(prev).add(messageId));
  };

  const viewMessage = async (message: Message) => {
    if (!readMessageIds.has(message.id)) {
      setReadMessageIds(prev => new Set(prev).add(message.id));
    }
    setSelectedMessage(message);
    if (userSettings.layout !== 'split') {
        setIsMessageModalOpen(true);
    }
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
      setReadMessageIds(new Set());
      setDismissedMessageIds(new Set());
      if (email && (isAuthenticated ? token : true)) {
        refreshInbox();
      }
    } else if (itemToDelete?.type === 'message' && itemToDelete.id) {
      try {
        const headers: Record<string, string> = { 'x-fce-client': 'web-client' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_ENDPOINT}?fullMailboxId=${email}&messageId=${itemToDelete.id}`, {
          method: 'DELETE',
          headers
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

  const handleEmailInputChange = (newPrefix: string) => {
    newPrefix = newPrefix.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    setEmail(`${newPrefix}@${selectedDomain}`);
    setBlockButtons(newPrefix.length === 0);
  };

  const changeEmail = () => {
    if (!isAuthenticated) {
      setIsAuthNeedOpen(true)
      setAuthNeedFeature('Update Email')
      return;
    }
    if (isEditing) {
      const [prefix] = email.split('@');
      if (prefix && prefix.length > 0) {
        setEmail(`${prefix}@${selectedDomain}`);
        setIsEditing(false);
        setReadMessageIds(new Set());
        setDismissedMessageIds(new Set());
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

  // Filter messages based on tab
  const filteredMessages = useMemo(() => {
    if (activeTab === 'dismissed') {
      return messages.filter(m => dismissedMessageIds.has(m.id));
    }
    return messages.filter(m => !dismissedMessageIds.has(m.id));
  }, [messages, activeTab, dismissedMessageIds]);

  // Layout Renders
  const isSplit = userSettings.layout === 'split' && isPro;
  const isCompact = userSettings.layout === 'compact';
  const isZen = userSettings.layout === 'zen';
  const isMinimal = userSettings.layout === 'minimal';

  useEffect(() => {
      // Toggle global UI elements based on layout
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      const nav = document.querySelector('nav');
      
      if (isZen) {
          if(header) header.style.display = 'none';
          if(footer) footer.style.display = 'none';
          if(nav) nav.style.display = 'none';
      } else if (isMinimal) {
          if(header) header.style.display = 'flex'; // Keep header for Minimal
          if(footer) footer.style.display = 'none';
      } else {
          // Restore
          if(header) header.style.display = '';
          if(footer) footer.style.display = '';
          if(nav) nav.style.display = '';
      }
      
      return () => {
          // Cleanup on unmount/change
          if(header) header.style.display = '';
          if(footer) footer.style.display = '';
          if(nav) nav.style.display = '';
      };
  }, [userSettings.layout, isZen, isMinimal]);

  const renderMessageList = () => (
     <div className="flex flex-col rounded-xl overflow-hidden bg-background border border-border/50">
          {filteredMessages.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-4">
              <div className="bg-muted/30 p-4 rounded-full mb-4">
                {activeTab === 'all' ? <Mail className="h-8 w-8 text-muted-foreground/50" /> : <Archive className="h-8 w-8 text-muted-foreground/50" />}
              </div>
              <div className="text-lg font-medium">{activeTab === 'all' ? t('inbox_empty_title') : "No dismissed emails"}</div>
              <div className="text-sm text-muted-foreground max-w-xs">{activeTab === 'all' ? t('inbox_empty_subtitle') : "Emails you dismiss without deleting appear here."}</div>
            </div>
          ) : (
            filteredMessages.map((message) => {
              const isRead = readMessageIds.has(message.id);
              const isUnread = !isRead;
              const isSelected = selectedMessage?.id === message.id;
              
              const expirationText = userPlan === 'pro' ? "Permanent" : getExpirationDate(message.date, 24);
              const otp = userSettings.smartOtp ? extractOtp(message) : null;

              return (
                <div
                  key={message.id}
                  onClick={() => viewMessage(message)}
                  className={cn(
                    "group relative flex flex-col gap-1 sm:flex-row sm:items-center px-4 border-b last:border-0 cursor-pointer transition-all hover:bg-muted/40",
                    isCompact ? "py-1" : "py-2",
                    isSelected && isSplit ? "bg-primary/5 border-l-4 border-l-primary" : "",
                    isUnread && !isSelected ? "bg-background" : "bg-muted/5 dark:bg-muted/10"
                  )}
                >
                  {/* Avatar / Icon Placeholder */}
                  {!isCompact && (
                      <div className="hidden sm:flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {message.from.charAt(1).toUpperCase()}
                      </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center justify-between ">
                      <span className={cn("truncate text-sm", isUnread ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                        {message.from}
                      </span>
                      <span className={cn("text-xs whitespace-nowrap shrink-0", isUnread ? "font-semibold text-foreground" : "text-muted-foreground")}>
                        {formatDate(message.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn("truncate text-xs flex-1", isUnread ? "font-semibold text-foreground" : "text-muted-foreground")}>
                        {message.subject || "(No Subject)"}
                      </span>
                      
                      {otp && (
                        <div 
                            className="shrink-0 flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 text-[10px] font-mono cursor-pointer hover:bg-green-500/20 transition-colors z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(otp);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            title="Click to copy OTP"
                        >
                            <span className="font-bold tracking-wider">{otp}</span>
                            <Copy className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>

                    {!isCompact && (
                        <div className="flex items-center justify-between mt-1">
                        {/* Expiration Notice */}
                        <div
                            className="flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                            onClick={(e) => {
                            e.stopPropagation();
                            openUpsell("Permanent Storage");
                            }}
                        >
                            <Clock className="h-3 w-3" />
                            <span>{expirationText}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {(userPlan === 'free') && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={savedMessageIds.has(message.id) ? "Unsave" : "Save to Browser"}
                                onClick={(e) => toggleSaveMessage(message, e)}
                            >
                                <Star className={cn("h-4 w-4", savedMessageIds.has(message.id) && "fill-amber-500 text-amber-500")} />
                            </Button>
                            )}
                            {(userPlan === 'pro') && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={"Delete Permanently"}
                                onClick={() => {
                                setItemToDelete({ type: 'message', id: message.id });
                                setIsDeleteModalOpen(true);

                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            )}
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title={activeTab === 'dismissed' ? "Restore" : "Dismiss"}
                            onClick={(e) => handleMessageAction(message.id, e)}
                            >
                            {activeTab === 'dismissed' ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                            </Button>
                        </div>
                        </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
  );

  return (
    <Card className={cn("border-dashed", isZen ? "border-0 shadow-none bg-transparent" : "")}>
      {!isZen && (
        <CardHeader>
          <h2 className="text-xl font-semibold">{t('card_header_title')}</h2>
          <p className="text-sm text-muted-foreground">{t('card_header_p')}</p>
        </CardHeader>
      )}

      <CardContent className="space-y-2 pt-3">
        {/* Controls Section - Hidden in Zen */}
        {!isZen && (
          <>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={email.split('@')[0]}
                    onChange={(e) => handleEmailInputChange(e.target.value)}
                    className="flex-1"
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
                            onSelect={() => {
                              if (isCustom && !isPro) {
                                openUpsell("Custom Domains");
                                return;
                              }
                              handleDomainChange(domain);
                            }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isPro) {
                                  openUpsell("Priority Domain Settings");
                                  return;
                                }
                                handlePrimaryDomainChange(domain);
                              }}
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
                  {/* SETTINGS BUTTON */}
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    onClick={() => setIsSettingsOpen(true)} 
                    disabled={blockButtons} 
                    title={"Settings"}
                  >
                    <Settings className="h-4 w-4" />
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
                      {isEditing ? <CheckCheck className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                      <span className="hidden sm:inline">{isEditing ? t('save') : t('change')}</span>
                      {<Badge variant="outline" className="ml-auto hidden sm:block">N</Badge>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{!isAuthenticated ? 'Login to edit and use its shortcut' : (isPro) ? 'Press N to edit' : 'Shortcut is Pro Only'}</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button disabled={blockButtons} variant="outline" className="flex-1" onClick={deleteEmail} aria-label={t('delete')}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{t('delete')}</span>
                      <Badge variant="outline" className="ml-auto hidden sm:block">D</Badge>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{!isAuthenticated ? 'Login to use shortcuts' : (isPro) ? 'Press D to delete' : 'Shortcut is Pro Only'}</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        if (isPro) {
                          setIsManageModalOpen(true);
                        } else {
                          openUpsell("Inbox Management");
                        }
                      }}
                      aria-label="Manage all inboxes"
                    >
                      <ListOrdered className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Manage Inboxes</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>View and manage your full inbox history.</p></TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            {/* TABS HEADER */}
            <div className="flex items-center gap-4 w-full py-2">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary w-1/2 justify-center",
                  activeTab === 'all' ? "text-primary border-b-2 pb-2" : "text-muted-foreground"
                )}
              >
                <Mail className="h-4 w-4" /> All
              </button>
              <button
                onClick={() => setActiveTab('dismissed')}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary w-1/2 justify-center",
                  activeTab === 'dismissed' ? "text-primary border-b-2 pb-2" : "text-muted-foreground"
                )}
              >
                <Archive className="h-4 w-4" />
                Dismissed
              </button>
            </div>
          </>
        )}

        {/* MESSAGE AREA - Always visible */}
        {isSplit ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
                <div className="border rounded-xl overflow-hidden overflow-y-auto">
                    {renderMessageList()}
                </div>
                <div className="border rounded-xl p-4 overflow-y-auto bg-muted/10">
                    {selectedMessage ? (
                         <div className="space-y-4">
                            <h2 className="text-xl font-bold">{selectedMessage.subject}</h2>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{selectedMessage.from}</span>
                                <span>{formatDate(selectedMessage.date)}</span>
                            </div>
                            <hr />
                            <div className="prose dark:prose-invert max-w-none">
                                <div className="text-center py-10">
                                    <p className="mb-4">Select an email to view full details.</p>
                                    <Button onClick={() => setIsMessageModalOpen(true)} className="mt-4">
                                      Open Full View
                                    </Button>
                                </div>
                            </div>
                         </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Mail className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select an email to read</p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            // CLASSIC / COMPACT VIEW
            renderMessageList()
        )}

        {/* Footer/History Area - Hidden in Zen */}
        {!isZen && (
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

            {!isPro && (
              <div className="w-full md:w-64 shrink-0">
                <PrivacyAdSide />
              </div>
            )}
          </div>
        )}
      </CardContent>

      {showAttachmentNotice && !isZen && (
        <div
          className="p-3 mb-4 mx-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 text-center cursor-pointer hover:underline"
          onClick={() => openUpsell("Large Attachments")}
        >
          An email arrived with a large attachment. Upgrade to Pro to view files up to 25MB.
        </div>
      )}

      {/* Modals placed outside CardContent to ensure they render correctly */}
      <ManageInboxesModal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} inboxes={initialInboxes} onSelectInbox={useHistoryEmail} />
      <QRCodeModal email={email} isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />

      <MessageModal
        message={selectedMessage}
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        isPro={isPro}
        onUpsell={() => openUpsell("Attachments")}
        apiEndpoint={API_ENDPOINT}
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={userSettings}
        onUpdate={setUserSettings}
        isPro={isPro}
        onUpsell={openUpsell}
        isAuthenticated={isAuthenticated}
        onAuthNeed={(feature: string) => {
          setAuthNeedFeature(feature);
          setIsAuthNeedOpen(true);
        }}
      />

      <UpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        featureName={upsellFeature}
      />
      <AuthNeed
        isOpen={isAuthNeedOpen}
        onClose={() => setIsAuthNeedOpen(false)}
        featureName={authNeedFeature}
      />

      {error && (<ErrorPopup message={error} onClose={() => setError(null)} />)}
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirmation} itemToDelete={itemToDelete?.type === 'email' ? 'email address' : 'message'} />
    </Card>
  );
}