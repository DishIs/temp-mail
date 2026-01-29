// components/message-modal.tsx
"use client"

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getCookie, setCookie } from "cookies-next"
import { Loader, Paperclip, Info, ShieldCheck, Lock, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

interface Attachment {
  filename: string;
  contentType: string;
  content: string;
  size: number;
}

interface Message {
  id: string
  from: string
  to: string
  subject: string
  date: string;
  body?: string
  html?: string
  attachments?: Attachment[]
}

interface MessageModalProps {
  message: Message | null
  isOpen: boolean
  onClose: () => void
  isPro: boolean
  userPlan?: string // Optional: used to calculate precise expiration time
  onUpsell: () => void
  apiEndpoint: string // New Prop: Dynamic endpoint path
}

export function MessageModal({ message, isOpen, onClose, isPro, userPlan, onUpsell, apiEndpoint }: MessageModalProps) {
  const [fullMessage, setFullMessage] = useState<Message | null>(null)
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined)

  useEffect(() => {
    const storedToken = getCookie("authToken") as string | undefined;
    if (storedToken) {
      setToken(storedToken);
    } else {
      fetchToken();
    }
  }, []);

  const fetchToken = async () => {
    try {
      const response = await fetch("/api/auth", { method: "POST" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json() as { token?: string };
      if (data.token) {
        setToken(data.token);
        setCookie("authToken", data.token, { maxAge: 3600 });
      }
    } catch (error) {
      console.error("Failed to fetch token:", error);
    }
  };

  const fetchFullMessage = useCallback(async (messageId: string) => {
    if (!message) return; // Allow fetching public messages without token if endpoint permits

    setIsLoading(true);
    try {
      // 1. Add Security Header & Auth
      const headers: Record<string, string> = {
        'x-fce-client': 'web-client'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 2. Use Dynamic apiEndpoint
      const response = await fetch(`${apiEndpoint}?fullMailboxId=${message.to}&messageId=${messageId}`, {
        headers
      });

      const data = await response.json() as { success: boolean; data: Message; message?: string };
      if (data.success) {
        setFullMessage(data.data);
      }
    } catch (error) {
      console.error('Error fetching full message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [message, token, apiEndpoint]);

  useEffect(() => {
    if (message && isOpen) {
      setFullMessage(null);
      // We trigger fetch even if token is missing (for public guest access)
      // The fetchFullMessage logic handles the headers conditionally
      fetchFullMessage(message.id);
    }
  }, [message, isOpen, token, fetchFullMessage]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Handle Attachment Click
  const handleAttachmentClick = (e: React.MouseEvent, att: Attachment) => {
    if (!isPro) {
      e.preventDefault();
      onUpsell();
      return;
    }
  };

  // Calculate Expiration Date
  const getExpirationDate = () => {
    if (isPro) return null;
    // Default to 12h (guest) if plan not specified, or 24h if free
    const retentionHours = userPlan === 'free' ? 24 : 12;
    const msgDate = new Date(fullMessage?.date || message?.date || Date.now()).getTime();
    return new Date(msgDate + retentionHours * 60 * 60 * 1000);
  };

  const expiresAt = getExpirationDate();

  if (!message) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-w-screen h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">

        {/* Header Section */}
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{fullMessage?.subject || message.subject}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <p><span className="font-semibold text-foreground">From:</span> {fullMessage?.from || message.from}</p>
            <p><span className="font-semibold text-foreground">Date:</span> {new Date(fullMessage?.date || message.date).toLocaleString()}</p>
            <p className="col-span-1 sm:col-span-2 truncate"><span className="font-semibold text-foreground">To:</span> {fullMessage?.to || message.to}</p>
          </div>
        </div>

        {/* Expiration Notice (Clickable Upsell) */}
        {!isPro && expiresAt && (
          <div
            onClick={onUpsell}
            className="bg-amber-50 dark:bg-amber-950/30 border-y border-amber-100 dark:border-amber-900 px-6 py-2 flex items-center justify-between cursor-pointer group hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            title="Click to upgrade"
          >
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Auto-deletes on {expiresAt.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 group-hover:underline">
              Save Forever <Lock className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative bg-white dark:bg-black">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader className='animate-spin text-muted-foreground' />
            </div>
          ) : fullMessage?.html ? (
            <iframe
              srcDoc={`<base target="_blank" />
                <style>
                    body { margin: 0; padding: 1rem; font-family: system-ui, -apple-system, sans-serif; word-wrap: break-word; }
                    ::-webkit-scrollbar { width: 8px; height: 8px; }
                    ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
                </style>
                ${fullMessage.html}`}
              className="w-full h-full border-none block"
              title={fullMessage.subject}
              sandbox="allow-same-origin allow-popups"
            />
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm">{fullMessage?.body || "No content"}</pre>
            </div>
          )}
        </div>

        {/* Footer / Attachments Section */}
        <div className="p-4 bg-muted/30 border-t">
          {fullMessage?.attachments && fullMessage.attachments.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({fullMessage.attachments.length})
                </h3>
                {!isPro && (
                  <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Pro feature
                  </span>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {fullMessage.attachments.map((att, index) => {
                  const downloadUrl = `data:${att.contentType};base64,${att.content}`;
                  return (
                    <a
                      key={index}
                      href={isPro ? downloadUrl : "#"}
                      download={isPro ? att.filename : undefined}
                      onClick={(e) => handleAttachmentClick(e, att)}
                      className="flex items-center gap-3 p-2 bg-background border rounded-md hover:bg-accent transition-colors min-w-[200px] max-w-[250px] group cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm truncate">{att.filename}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(att.size)}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center text-xs text-muted-foreground py-1">
              <ShieldCheck className="h-3 w-3 mr-1.5" />
              Scanned by DITMail Security
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}