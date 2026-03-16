// components/settings-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Crown, Keyboard, Layout, Bell, Settings, Zap, ShieldCheck,
  Smartphone, Table as TableIcon, Monitor, Sparkles, Check, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserSettings {
  notifications: boolean;
  sound: boolean;
  layout: "new" | "classic" | "split" | "compact" | "minimal" | "zen" | "retro" | "mobile";
  shortcuts: { refresh: string; copy: string; delete: string; new: string; qr: string };
  smartOtp: boolean;
  /** Auto-categorize emails by brand (Discord, Instagram, etc.) — Pro only */
  categorization: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: false,
  sound: true,
  layout: "new",
  shortcuts: { refresh: "r", copy: "c", delete: "d", new: "n", qr: "q" },
  smartOtp: false,          // will be set to true for Pro on first load
  categorization: false,    // opt-in, Pro only
};

/** Call this once after session loads to apply Pro defaults */
export function applyProDefaults(settings: UserSettings, isPro: boolean): UserSettings {
  if (!isPro) return settings;
  return {
    ...settings,
    // OTP extraction ON by default for Pro (only if never explicitly changed)
    smartOtp: settings.smartOtp === undefined ? true : settings.smartOtp,
  };
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdate: (s: UserSettings) => void;
  isPro: boolean;
  isAuthenticated: boolean;
  onUpsell: (feature: string) => void;
  onAuthNeed: (feature: string) => void;
}

// ─── Sidebar tabs ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "general",      label: "General",        icon: Zap      },
  { id: "appearance",   label: "Inbox Layout",   icon: Layout   },
  { id: "notifications",label: "Notifications",  icon: Bell     },
  { id: "shortcuts",    label: "Shortcuts",       icon: Keyboard },
];

// ─── Layout options ───────────────────────────────────────────────────────────
const LAYOUTS: {
  id: UserSettings["layout"];
  label: string;
  desc: string;
  icon: React.ReactNode;
  pro?: boolean;
}[] = [
  { id: "classic",  label: "Classic",      desc: "Table view with details. The default experience.", icon: <TableIcon className="h-4 w-4" /> },
  { id: "new",      label: "New",          desc: "Modern list view with avatars.",                   icon: <Sparkles  className="h-4 w-4" /> },
  { id: "compact",  label: "Compact",      desc: "Dense list — fits more emails on small screens.",  icon: <Layout    className="h-4 w-4" /> },
  { id: "split",    label: "Split View",   desc: "Email list and content side-by-side. Desktop best.", icon: <div className="flex gap-1"><div className="w-2 h-4 border border-border rounded-sm" /><div className="w-4 h-4 border border-border rounded-sm" /></div>, pro: true },
  { id: "zen",      label: "Zen Mode",     desc: "No navigation, no header. Just the inbox.",        icon: <ShieldCheck className="h-4 w-4" />, pro: true },
  { id: "mobile",   label: "Mobile Focus", desc: "Large touch targets for very small screens.",      icon: <Smartphone className="h-4 w-4" />, pro: true },
  { id: "retro",    label: "Retro HTML",   desc: "1990s style — least CSS, raw HTML interface.",     icon: <Monitor  className="h-4 w-4" />, pro: true },
];

// ─── Row component ─────────────────────────────────────────────────────────────
function SettingRow({
  label, description, locked, isNew, children,
}: {
  label: string;
  description?: string;
  locked?: boolean;
  isNew?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border py-4 first:border-0 gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {locked && <Crown className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
          {isNew && (
            <span className="relative inline-flex items-center">
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded px-1.5 py-px bg-emerald-500/8">New</span>
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function SettingsModal({
  isOpen, onClose, settings, onUpdate,
  isPro, isAuthenticated, onUpsell, onAuthNeed,
}: SettingsModalProps) {
  const [local, setLocal] = useState<UserSettings>(settings);
  const [activeTab, setActiveTab] = useState("general");

  // Apply Pro defaults on open (OTP on by default for Pro)
  useEffect(() => {
    const base = { ...settings };
    if (isPro && base.smartOtp === false) {
      // Only auto-enable if they haven't explicitly touched it
      // We use localStorage to track if it was ever manually set
      const manuallySet = localStorage.getItem("smartOtpManuallySet");
      if (!manuallySet) base.smartOtp = true;
    }
    setLocal(base);
  }, [settings, isOpen, isPro]);

  const requirePro = (action: () => void, feature: string) => {
    if (!isPro) { onUpsell(feature); } else { action(); }
  };

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) =>
    setLocal(prev => ({ ...prev, [key]: value }));

  const updateShortcut = (action: keyof UserSettings["shortcuts"], key: string) =>
    requirePro(() => setLocal(prev => ({
      ...prev, shortcuts: { ...prev.shortcuts, [action]: key },
    })), "Custom Shortcuts");

  const handleLayout = (id: UserSettings["layout"]) => {
    const proLayouts: UserSettings["layout"][] = ["split", "minimal", "zen", "retro", "mobile"];
    if (proLayouts.includes(id)) {
      requirePro(() => update("layout", id), `${id.charAt(0).toUpperCase() + id.slice(1)} Layout`);
    } else {
      update("layout", id);
    }
  };

  const handleSmartOtpToggle = (checked: boolean) => {
    requirePro(() => {
      localStorage.setItem("smartOtpManuallySet", "1");
      update("smartOtp", checked);
    }, "Smart OTP Extractor");
  };

  const handleCategorizationToggle = (checked: boolean) => {
    requirePro(() => update("categorization", checked), "Email Categorization");
  };

  return (
    <Dialog open={isOpen} onOpenChange={o => !o && onClose()}>
      <DialogContent
        className={[
          "max-w-[800px] h-[85vh] md:h-[70vh]",
          "p-0 gap-0 overflow-hidden flex flex-col md:flex-row",
          "bg-background border border-border rounded-lg",
          "[&>button:first-of-type]:hidden",
        ].join(" ")}
      >

        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:flex flex-col w-56 border-r border-border bg-muted/10 shrink-0">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="h-2 w-2 rounded-full border border-border bg-background" />
              <span className="h-2 w-2 rounded-full border border-border bg-background" />
              <span className="h-2 w-2 rounded-full border border-border bg-background" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Settings</span>
          </div>
          <nav className="flex flex-col gap-0.5 p-3 flex-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left transition-colors w-full",
                  activeTab === id
                    ? "bg-background border border-border text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20",
                )}>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Mobile header ── */}
        <div className="md:hidden flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Settings</span>
          <button onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors">
            <span className="text-sm font-mono leading-none">✕</span>
          </button>
        </div>

        {/* ── Mobile tab strip ── */}
        <div className="md:hidden border-b border-border shrink-0 bg-muted/10 overflow-x-auto">
          <div className="flex gap-0 px-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-colors relative shrink-0",
                  activeTab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}>
                <Icon className="h-3 w-3" />
                {label}
                {activeTab === id && <span className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content pane ── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6">

            {/* GENERAL */}
            {activeTab === "general" && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">General</p>
                <p className="text-xs text-muted-foreground mb-6">Automation and smart features.</p>

                {/* Smart OTP — ON by default for Pro */}
                <SettingRow
                  label="Smart OTP Extractor"
                  description={
                    isPro
                      ? "Automatically detect 4–8 digit codes in incoming emails and show a Copy button. Enabled by default for Pro."
                      : "Automatically detect 4–8 digit codes in incoming emails and show a Copy button."
                  }
                  locked={!isPro}
                >
                  {isPro ? (
                    <Switch
                      checked={local.smartOtp}
                      onCheckedChange={handleSmartOtpToggle}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUpsell("Smart OTP Extractor")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400 font-mono text-[10px] uppercase tracking-wider hover:bg-amber-500/15 transition-colors"
                    >
                      <Crown className="h-3 w-3" />
                      Upgrade to Pro
                    </button>
                  )}
                </SettingRow>

                {/* Email Categorization — NEW, Pro only */}
                <SettingRow
                  label="Email Categorization"
                  description="Auto-label emails from Discord, Instagram, GitHub, Google and 50+ brands. Shown as a badge next to each message."
                  locked={!isPro}
                  isNew
                >
                  {isPro ? (
                    <Switch
                      checked={local.categorization}
                      onCheckedChange={handleCategorizationToggle}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUpsell("Email Categorization")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400 font-mono text-[10px] uppercase tracking-wider hover:bg-amber-500/15 transition-colors"
                    >
                      <Crown className="h-3 w-3" />
                      Upgrade to Pro
                    </button>
                  )}
                </SettingRow>

                {/* Categorization preview — only when enabled */}
                {isPro && local.categorization && (
                  <div className="mt-2 mb-2 rounded-lg border border-border bg-muted/10 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Preview — badge examples</p>
                    <div className="flex flex-wrap gap-2">
                      {["Discord","Instagram","GitHub","Google","Stripe","Slack","Spotify","Netflix"].map(cat => (
                        <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono bg-muted/40 border-border text-muted-foreground">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Notifications</p>
                <p className="text-xs text-muted-foreground mb-6">How you want to be alerted.</p>
                <SettingRow label="Browser Notifications" description="Receive a push notification when a new email arrives.">
                  <Switch
                    checked={local.notifications}
                    onCheckedChange={c => {
                      if (c && "Notification" in window) {
                        Notification.requestPermission().then(p => {
                          if (p === "granted") update("notifications", true);
                        });
                      } else {
                        update("notifications", false);
                      }
                    }}
                  />
                </SettingRow>
                <SettingRow label="Sound Effects" description="Play a subtle chime on new email.">
                  <Switch checked={local.sound} onCheckedChange={c => update("sound", c)} />
                </SettingRow>
              </div>
            )}

            {/* APPEARANCE */}
            {activeTab === "appearance" && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Inbox Layout</p>
                <p className="text-xs text-muted-foreground mb-6">Customize the look and feel of your inbox.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
                  {LAYOUTS.map(({ id, label, desc, icon, pro }) => {
                    const active = local.layout === id;
                    return (
                      <button key={id} onClick={() => handleLayout(id)}
                        className={cn(
                          "group relative bg-background px-5 py-5 text-left flex flex-col gap-3 hover:bg-muted/10 transition-colors",
                          active && "bg-muted/20",
                        )}>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{icon}</span>
                          <div className="flex items-center gap-1.5">
                            {pro && !isPro && <Crown className="h-3 w-3 text-muted-foreground/50" />}
                            {active && (
                              <span className="h-4 w-4 rounded-full bg-foreground flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-background" />
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SHORTCUTS */}
            {activeTab === "shortcuts" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Keyboard Map</p>
                  {!isPro && (
                    <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded px-2 py-0.5">
                      <Crown className="h-3 w-3" /> Pro required
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-6">Press these keys to perform actions quickly.</p>
                <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                  {Object.entries(local.shortcuts).map(([action, key]) => (
                    <div key={action} className="flex items-center justify-between px-5 py-3 bg-background hover:bg-muted/10 transition-colors">
                      <span className="text-sm text-foreground capitalize">{action === "new" ? "Quick Edit / New" : action}</span>
                      <Input
                        value={key}
                        readOnly={!isPro}
                        className={cn("w-10 text-center font-mono uppercase h-7 text-xs", !isPro && "cursor-not-allowed opacity-50 bg-muted")}
                        onChange={e => updateShortcut(action as keyof UserSettings["shortcuts"], e.target.value.toLowerCase().slice(-1))}
                      />
                    </div>
                  ))}
                </div>
                {!isPro && (
                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-center gap-3">
                    <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground mb-0.5">Custom Shortcuts — Pro Feature</p>
                      <p className="text-xs text-muted-foreground">Remap every shortcut to any key you want.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpsell("Custom Keyboard Shortcuts")}
                      className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:no-underline transition-colors"
                    >
                      Upgrade →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2 shrink-0 bg-muted/10">
            <Button variant="ghost" size="sm" onClick={onClose} className="font-mono text-xs uppercase tracking-widest">Cancel</Button>
            <Button size="sm" onClick={() => { onUpdate(local); onClose(); }} className="font-mono text-xs uppercase tracking-widest min-w-[80px]">Save</Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}