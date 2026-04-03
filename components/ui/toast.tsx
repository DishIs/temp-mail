"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "loading";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  timestamp: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, title: string, message?: string) => string;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Module-level store for toast functions
let toastStore: ToastContextType | null = null;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 15);
    const newToast: Toast = {
      id,
      type,
      title,
      message,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev, newToast]);

    if (type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }

    return id;
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Store functions for external access
  useEffect(() => {
    toastStore = { toasts, addToast, updateToast, removeToast, clearToasts };
    return () => {
      toastStore = null;
    };
  }, [toasts, addToast, updateToast, removeToast, clearToasts]);

  const contextValue = { toasts, addToast, updateToast, removeToast, clearToasts };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[360px]">
      {toasts.map((toastItem) => (
        <ToastItem key={toastItem.id} toast={toastItem} onDismiss={() => removeToast(toastItem.id)} />
      ))}
    </div>
  );
}

async function generateAIHelp(title: string, message: string): Promise<string> {
  const lowerTitle = title.toLowerCase();
  const lowerMsg = (message || "").toLowerCase();
  
  if (lowerTitle.includes("webhook") || lowerMsg.includes("webhook")) {
    if (lowerMsg.includes("forbidden") || lowerMsg.includes("invalid signature")) {
      return "Your request signature may have expired or the API credentials are invalid. Try refreshing the page and attempting the action again.";
    }
    if (lowerMsg.includes("not found") || lowerMsg.includes("404")) {
      return "The webhook or resource you're trying to access doesn't exist or was deleted. Check if the inbox still exists in your dashboard.";
    }
    if (lowerMsg.includes("rate limit")) {
      return "You've exceeded the API rate limit. Wait a moment before trying again, or check your plan's limits.";
    }
    return "Webhook operations require a Growth plan or higher. Upgrade your plan to manage webhooks.";
  }
  
  if (lowerMsg.includes("forbidden") || lowerMsg.includes("invalid signature")) {
    return "This is usually a temporary issue. Try refreshing the page and logging out/in again. If it persists, clear your browser cache.";
  }
  
  if (lowerMsg.includes("rate limit") || lowerMsg.includes("too many")) {
    return "You've hit the rate limit. Please wait a moment before retrying. Check your API usage in the dashboard.";
  }
  
  if (lowerMsg.includes("unauthorized") || lowerMsg.includes("401")) {
    return "Your session may have expired. Please sign out and sign back in, then try again.";
  }
  
  return "Please try again. If the problem persists, contact support with the error details.";
}

function ToastItem({ toast: toastItem, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpText, setHelpText] = useState<string | null>(null);
  const [loadingHelp, setLoadingHelp] = useState(false);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />,
    info: <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />,
    loading: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />,
  };

  const borderColors = {
    success: "border-l-green-500 dark:border-l-green-400",
    error: "border-l-red-500 dark:border-l-red-400",
    info: "border-l-blue-500 dark:border-l-blue-400",
    loading: "border-l-muted-foreground",
  };

  const bgColors = {
    success: "bg-green-500/5 dark:bg-green-500/10",
    error: "bg-red-500/5 dark:bg-red-500/10",
    info: "bg-blue-500/5 dark:bg-blue-500/10",
    loading: "bg-muted/50",
  };

  const handleGetHelp = async () => {
    setShowHelp(true);
    setLoadingHelp(true);
    try {
      const help = await generateAIHelp(toastItem.title, toastItem.message || "");
      setHelpText(help);
    } catch {
      setHelpText("Unable to get help at this moment. Please try again later.");
    } finally {
      setLoadingHelp(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative bg-background border border-border rounded-lg shadow-lg overflow-hidden",
        "transition-all duration-200 ease-out cursor-pointer",
        "hover:shadow-xl",
        borderColors[toastItem.type],
        bgColors[toastItem.type]
      )}
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
    >
      <div 
        className="flex items-start gap-3 p-3"
        onClick={() => toastItem.type === "error" && setExpanded(!expanded)}
      >
        <div className="mt-0.5">{icons[toastItem.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{toastItem.title}</p>
          {toastItem.message && !expanded && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{toastItem.message}</p>
          )}
          {expanded && toastItem.message && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">{toastItem.message}</p>
              {toastItem.type === "error" && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleGetHelp(); }}
                  className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {loadingHelp ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {loadingHelp ? "Analyzing..." : "Need help?"}
                </button>
              )}
              {showHelp && helpText && (
                <div className="mt-2 p-2 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground leading-relaxed">{helpText}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      
      {toastItem.type === "loading" && (
        <div className="h-0.5 bg-muted overflow-hidden">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
      )}
    </div>
  );
}

// Export toast API that works anywhere
function callToast(type: ToastType, msg: string, opts?: { id?: string }) {
  if (!toastStore) {
    console.warn("ToastProvider not mounted yet");
    return;
  }
  
  const { addToast, updateToast, removeToast } = toastStore;
  
  if (opts?.id) {
    updateToast(opts.id, { type, title: msg });
    setTimeout(() => removeToast(opts.id!), type === "loading" ? 3000 : 4000);
  } else {
    addToast(type, msg);
  }
}

export const toast = {
  success: (msg: string, opts?: { id?: string }) => callToast("success", msg, opts),
  error: (msg: string, opts?: { id?: string }) => callToast("error", msg, opts),
  info: (msg: string) => callToast("info", msg),
  loading: (msg: string) => callToast("loading", msg),
  dismiss: (id: string) => toastStore?.removeToast(id),
  promise: async <T,>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }) => {
    if (!toastStore) throw promise;
    const { addToast, updateToast, removeToast } = toastStore;
    const id = addToast("loading", msgs.loading);
    try {
      const result = await promise;
      updateToast(id, { type: "success", title: msgs.success });
      setTimeout(() => removeToast(id), 3000);
      return result;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Something went wrong";
      updateToast(id, { type: "error", title: msgs.error, message: errMsg });
      setTimeout(() => removeToast(id), 5000);
      throw e;
    }
  },
  custom: (t: any) => {
    if (t.type === "error") callToast("error", t.message || "Error");
    else if (t.type === "success") callToast("success", t.message || "Success");
    else callToast("info", t.message || "");
    return t;
  },
};