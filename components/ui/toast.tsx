"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── types ───────────────────────────────────────────────────────────────────

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

// ─── context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

// Module-level store so `toast.*` works outside React trees
let toastStore: ToastContextType | null = null;

// ─── provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const scheduleRemove = useCallback((id: string, delay: number) => {
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, delay);
    timers.current.set(id, t);
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Math.random().toString(36).slice(2, 11);
      setToasts((prev) => [
        ...prev,
        { id, type, title, message, timestamp: Date.now() },
      ]);
      if (type !== "loading") scheduleRemove(id, 5000);
      return id;
    },
    [scheduleRemove]
  );

  const updateToast = useCallback(
    (id: string, updates: Partial<Toast>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      // If transitioning away from loading, auto-dismiss
      if (updates.type && updates.type !== "loading") {
        scheduleRemove(id, 4000);
      }
    },
    [scheduleRemove]
  );

  const removeToast = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => {
    toastStore = { toasts, addToast, updateToast, removeToast, clearToasts };
    return () => { toastStore = null; };
  }, [toasts, addToast, updateToast, removeToast, clearToasts]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, updateToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// ─── container ───────────────────────────────────────────────────────────────

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 w-[340px] max-w-[calc(100vw-2rem)] pointer-events-none"
    >
      <AnimatePresence initial={false} mode="sync">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── item ────────────────────────────────────────────────────────────────────

async function generateAIHelp(title: string, message: string): Promise<string> {
  const low = (title + " " + message).toLowerCase();
  if (low.includes("rate limit") || low.includes("too many"))
    return "You've hit the rate limit. Wait a moment before retrying. Check your API usage in the dashboard.";
  if (low.includes("unauthorized") || low.includes("401"))
    return "Your session may have expired. Sign out and sign back in, then try again.";
  if (low.includes("forbidden") || low.includes("signature"))
    return "This is usually a temporary credentials issue. Refresh the page or clear your browser cache and try again.";
  if (low.includes("not found") || low.includes("404"))
    return "The resource doesn't exist or was deleted. Confirm the inbox or webhook is still active in your dashboard.";
  if (low.includes("webhook"))
    return "Webhook operations require the Growth plan or higher. Upgrade your plan to manage webhooks.";
  return "Please try again. If the problem persists, contact support with the error details shown.";
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
  error:   <AlertCircle  className="h-3.5 w-3.5 shrink-0" />,
  info:    <Info         className="h-3.5 w-3.5 shrink-0" />,
  loading: <Loader2      className="h-3.5 w-3.5 shrink-0 animate-spin" />,
};

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [helpText, setHelpText] = useState<string | null>(null);
  const [loadingHelp, setLoadingHelp] = useState(false);
  const prevType = useRef<ToastType>(t.type);

  // Detect loading → resolved transition to briefly highlight
  const [justResolved, setJustResolved] = useState(false);
  useEffect(() => {
    if (prevType.current === "loading" && t.type !== "loading") {
      setJustResolved(true);
      const id = setTimeout(() => setJustResolved(false), 600);
      return () => clearTimeout(id);
    }
    prevType.current = t.type;
  }, [t.type]);

  const handleGetHelp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingHelp(true);
    const help = await generateAIHelp(t.title, t.message || "").catch(
      () => "Unable to get help right now. Please try again later."
    );
    setHelpText(help);
    setLoadingHelp(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: justResolved ? [1, 1.015, 1] : 1,
        transition: {
          opacity: { duration: 0.2 },
          y: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
          scale: justResolved
            ? { duration: 0.4, times: [0, 0.4, 1] }
            : { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      exit={{
        opacity: 0,
        y: 8,
        scale: 0.97,
        transition: { duration: 0.18, ease: "easeIn" },
      }}
      className={cn(
        "pointer-events-auto w-full rounded-lg border bg-background overflow-hidden",
        "shadow-[0_2px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.4)]",
        // left accent via border-l
        "border-l-2",
        t.type === "success" && "border-l-foreground border-border",
        t.type === "error"   && "border-l-foreground border-border",
        t.type === "info"    && "border-l-foreground/50 border-border",
        t.type === "loading" && "border-l-border border-border"
      )}
    >
      {/* main row */}
      <div
        className={cn(
          "flex items-start gap-3 px-3.5 py-3",
          t.type === "error" && t.message && "cursor-pointer"
        )}
        onClick={() => t.type === "error" && t.message && setExpanded((v) => !v)}
      >
        {/* icon */}
        <div
          className={cn(
            "mt-px",
            t.type === "loading" && "text-muted-foreground",
            t.type === "success" && "text-foreground",
            t.type === "error"   && "text-foreground",
            t.type === "info"    && "text-muted-foreground",
          )}
        >
          {ICONS[t.type]}
        </div>

        {/* text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">
            {t.title}
          </p>

          {/* collapsed preview */}
          {t.message && !expanded && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">
              {t.message}
            </p>
          )}

          {/* expanded detail + help */}
          <AnimatePresence initial={false}>
            {expanded && t.message && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 pt-2 border-t border-border/60">
                  <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                    {t.message}
                  </p>

                  {/* help trigger */}
                  {!helpText && (
                    <button
                      onClick={handleGetHelp}
                      className="mt-2.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {loadingHelp
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Sparkles className="h-3 w-3" />}
                      {loadingHelp ? "Analyzing…" : "Need help?"}
                    </button>
                  )}

                  {/* help answer */}
                  <AnimatePresence>
                    {helpText && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2.5 rounded-md border border-border bg-muted/10 px-3 py-2"
                      >
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {helpText}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* dismiss */}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="shrink-0 -mr-0.5 -mt-0.5 rounded p-1 text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* loading bar */}
      <AnimatePresence>
        {t.type === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-px bg-border overflow-hidden"
          >
            <motion.div
              className="h-full bg-foreground/30 origin-left"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── external toast API ───────────────────────────────────────────────────────

export const toast = {
  success(msg: string, opts?: { id?: string }) {
    if (!toastStore) return;
    const { addToast, updateToast, removeToast } = toastStore;
    if (opts?.id) {
      updateToast(opts.id, { type: "success", title: msg });
    } else {
      addToast("success", msg);
    }
  },

  error(msg: string, opts?: { id?: string; detail?: string }) {
    if (!toastStore) return;
    const { addToast, updateToast } = toastStore;
    if (opts?.id) {
      updateToast(opts.id, { type: "error", title: msg, message: opts.detail });
    } else {
      addToast("error", msg, opts?.detail);
    }
  },

  info(msg: string) {
    toastStore?.addToast("info", msg);
  },

  loading(msg: string): string {
    return toastStore?.addToast("loading", msg) ?? "";
  },

  dismiss(id: string) {
    toastStore?.removeToast(id);
  },

  async promise<T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: string }
  ): Promise<T> {
    if (!toastStore) return promise;
    const { addToast, updateToast, removeToast } = toastStore;
    const id = addToast("loading", msgs.loading);
    try {
      const result = await promise;
      updateToast(id, { type: "success", title: msgs.success });
      return result;
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Something went wrong";
      updateToast(id, { type: "error", title: msgs.error, message: detail });
      throw e;
    }
  },
};