"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Crown, 
  Keyboard, 
  Layout, 
  Bell, 
  Settings, 
  Zap, 
  ShieldCheck,
  MousePointer2,
  Table as TableIcon,
  Monitor,
  Smartphone,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

export interface UserSettings {
  notifications: boolean;
  sound: boolean;
  // new: modern list (earlier classic) | classic: tables (default) | split: email + content | compact: dense list | minimal: no history | zen: no UI | retro: html 1.0 | mobile: small screens
  layout: 'new' | 'classic' | 'split' | 'compact' | 'minimal' | 'zen' | 'retro' | 'mobile'; 
  shortcuts: {
    refresh: string;
    copy: string;
    delete: string;
    new: string;
    qr: string;
  };
  smartOtp: boolean; 
}

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: false,
  sound: true,
  layout: 'classic', // Table view is default
  shortcuts: {
    refresh: 'r',
    copy: 'c',
    delete: 'd',
    new: 'n',
    qr: 'q'
  },
  smartOtp: false
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdate: (newSettings: UserSettings) => void;
  isPro: boolean;
  isAuthenticated: boolean;
  onUpsell: (feature: string) => void;
  onAuthNeed: (feature: string) => void;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdate, 
  isPro, 
  isAuthenticated, 
  onUpsell,
  onAuthNeed 
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [activeTab, setActiveTab] = useState("general"); 

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  const requirePro = (action: () => void, feature: string) => {
    if (!isPro) {
      onUpsell(feature);
    } else {
      action();
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateShortcut = (action: keyof UserSettings['shortcuts'], key: string) => {
    requirePro(() => {
        setLocalSettings(prev => ({
            ...prev,
            shortcuts: { ...prev.shortcuts, [action]: key }
        }));
    }, "Custom Shortcuts");
  };

  const handleLayoutChange = (layout: UserSettings['layout']) => {
    // Pro layouts
    const proLayouts = ['split', 'minimal', 'zen', 'retro', 'mobile'];
    
    if (proLayouts.includes(layout)) {
         requirePro(() => updateSetting('layout', layout), `${layout.charAt(0).toUpperCase() + layout.slice(1)} Layout`);
    } else {
         updateSetting('layout', layout);
    }
  };

  const SidebarItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
      <button
        onClick={() => setActiveTab(id)}
        className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left",
            activeTab === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
        )}
      >
          <Icon className="w-4 h-4" />
          {label}
      </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[800px] h-[85vh] md:h-[70vh] p-0 gap-0 overflow-hidden flex flex-col md:flex-row border-0 md:border sm:rounded-xl ">
        
        <div className="hidden md:flex flex-col w-64 border-r bg-muted/20 p-4 gap-1 shrink-0">
            <div className="flex items-center gap-2 px-2 mb-6 text-lg font-semibold tracking-tight">
                <Settings className="w-5 h-5" /> Settings
            </div>
            <SidebarItem id="general" label="General" icon={Zap} />
            <SidebarItem id="appearance" label="Inbox Layout" icon={Layout} />
            <SidebarItem id="notifications" label="Notifications" icon={Bell} />
            <SidebarItem id="shortcuts" label="Shortcuts" icon={Keyboard} />
        </div>

        <div className="md:hidden p-4 border-b flex items-center justify-between bg-background shrink-0 z-10">
             <div className="font-semibold flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</div>
             <Button variant="ghost" size="sm" onClick={onClose} className="h-8">Close</Button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-background">
            <div className="md:hidden border-b shrink-0 bg-muted/10">
                <div className="flex overflow-x-auto no-scrollbar py-1 px-2 gap-2">
                    {[
                        { id: 'general', label: 'General', icon: Zap },
                        { id: 'appearance', label: 'Layout', icon: Layout },
                        { id: 'notifications', label: 'Notify', icon: Bell },
                        { id: 'shortcuts', label: 'Keys', icon: Keyboard }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                                activeTab === tab.id 
                                    ? "bg-primary text-primary-foreground border-primary" 
                                    : "bg-background border-border text-muted-foreground"
                            )}
                        >
                            <tab.icon className="w-3 h-3" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 pb-20 md:pb-6">
                
                {/* --- GENERAL TAB --- */}
                {activeTab === "general" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-lg font-medium mb-1">Productivity</h3>
                            <p className="text-sm text-muted-foreground mb-4">Automation and smart features.</p>
                            
                            <div className="space-y-4 border rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 pr-4">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-base font-medium">Smart OTP Extractor</Label>
                                            {!isPro && <Crown className="w-3 h-3 text-amber-500" />}
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Automatically detect 4-8 digit verification codes in incoming emails and show a "Copy" button in the list.
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={localSettings.smartOtp} 
                                        onCheckedChange={(checked) => requirePro(() => updateSetting('smartOtp', checked), "Smart OTP Extractor")} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- NOTIFICATIONS TAB --- */}
                {activeTab === "notifications" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div>
                            <h3 className="text-lg font-medium mb-1">Alerts</h3>
                            <div className="space-y-4 border rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Browser Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Receive a push notification when a new email arrives.</p>
                                    </div>
                                    <Switch 
                                        checked={localSettings.notifications} 
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                if ('Notification' in window) {
                                                    Notification.requestPermission().then(p => {
                                                        if (p === 'granted') updateSetting('notifications', true);
                                                    });
                                                }
                                            } else {
                                                updateSetting('notifications', false);
                                            }
                                        }} 
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Sound Effects</Label>
                                        <p className="text-sm text-muted-foreground">Play a subtle chime on new email.</p>
                                    </div>
                                    <Switch 
                                        checked={localSettings.sound} 
                                        onCheckedChange={(checked) => updateSetting('sound', checked)} 
                                    />
                                </div>
                            </div>
                         </div>
                    </div>
                )}

                {/* --- APPEARANCE TAB --- */}
                {activeTab === "appearance" && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div>
                            <h3 className="text-lg font-medium mb-1">Interface Design</h3>
                            <p className="text-sm text-muted-foreground mb-4">Customize the look and feel of your inbox.</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Classic (Table) - DEFAULT */}
                                <div 
                                    onClick={() => handleLayoutChange('classic')}
                                    className={cn(
                                        "relative cursor-pointer border-2 rounded-xl p-4 hover:border-primary/50 transition-all flex flex-col gap-2",
                                        localSettings.layout === 'classic' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <TableIcon className="w-5 h-5 opacity-70" />
                                        {localSettings.layout === 'classic' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold">Classic</div>
                                        <div className="text-xs text-muted-foreground mt-1">Table view with details. The default experience.</div>
                                    </div>
                                </div>

                                {/* New (Old Standard) */}
                                <div 
                                    onClick={() => handleLayoutChange('new')}
                                    className={cn(
                                        "relative cursor-pointer border-2 rounded-xl p-4 hover:border-primary/50 transition-all flex flex-col gap-2",
                                        localSettings.layout === 'new' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <Sparkles className="w-5 h-5 opacity-70" />
                                        {localSettings.layout === 'new' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold">New</div>
                                        <div className="text-xs text-muted-foreground mt-1">Modern list view with avatars.</div>
                                    </div>
                                </div>

                                {/* Compact */}
                                <div 
                                    onClick={() => handleLayoutChange('compact')}
                                    className={cn(
                                        "relative cursor-pointer border-2 rounded-xl p-4 hover:border-primary/50 transition-all flex flex-col gap-2",
                                        localSettings.layout === 'compact' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <Layout className="w-5 h-5 opacity-70" />
                                        {localSettings.layout === 'compact' && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold">Compact</div>
                                        <div className="text-xs text-muted-foreground mt-1">Dense list view. Fits more emails on small screens.</div>
                                    </div>
                                </div>

                                {/* Split View */}
                                <div 
                                    onClick={() => handleLayoutChange('split')}
                                    className={cn(
                                        "relative cursor-pointer border-2 rounded-xl p-4 hover:border-primary/50 transition-all flex flex-col gap-2",
                                        localSettings.layout === 'split' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-1"><div className="w-2 h-4 border rounded-sm" /><div className="w-4 h-4 border rounded-sm" /></div>
                                        {!isPro && <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold">Split View</div>
                                        <div className="text-xs text-muted-foreground mt-1">Email list and content side-by-side. Best for desktop.</div>
                                    </div>
                                </div>

                                {/* Zen Mode */}
                                <div 
                                    onClick={() => handleLayoutChange('zen')}
                                    className={cn(
                                        "relative cursor-pointer border-2 rounded-xl p-4 hover:border-primary/50 transition-all flex flex-col gap-2",
                                        localSettings.layout === 'zen' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <ShieldCheck className="w-5 h-5 opacity-70" />
                                        {!isPro && <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold">Zen Mode</div>
                                        <div className="text-xs text-muted-foreground mt-1">No navigation, no header. Just the email box.</div>
                                    </div>
                                </div>

                                {/* Mobile Optimized */}
                                <div 
                                    onClick={() => handleLayoutChange('mobile')}
                                    className={cn(
                                        "relative cursor-pointer border-2 rounded-xl p-4 hover:border-primary/50 transition-all flex flex-col gap-2",
                                        localSettings.layout === 'mobile' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <Smartphone className="w-5 h-5 opacity-70" />
                                        {!isPro && <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold">Mobile Focus</div>
                                        <div className="text-xs text-muted-foreground mt-1">Large touch targets for very small screens.</div>
                                    </div>
                                </div>

                                {/* Retro / HTML 1.0 */}
                                <div 
                                    onClick={() => handleLayoutChange('retro')}
                                    className={cn(
                                        "relative cursor-pointer border-2 rounded-xl p-4 hover:border-primary/50 transition-all flex flex-col gap-2",
                                        localSettings.layout === 'retro' ? "border-primary bg-primary/5" : "border-muted"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <Monitor className="w-5 h-5 opacity-70" />
                                        {!isPro && <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold">Retro HTML</div>
                                        <div className="text-xs text-muted-foreground mt-1">Least CSS. 1990s style raw HTML interface.</div>
                                    </div>
                                </div>

                            </div>
                         </div>
                     </div>
                )}

                {/* --- SHORTCUTS TAB --- */}
                {activeTab === "shortcuts" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                             <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-medium">Keyboard Map</h3>
                                {!isPro && (
                                    <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full flex items-center gap-1 border border-amber-500/20">
                                        <Crown className="w-3 h-3" /> Custom keys require Pro
                                    </span>
                                )}
                             </div>
                             <p className="text-sm text-muted-foreground mb-4">Press these keys to perform actions quickly.</p>
                             
                             <div className="space-y-2 border rounded-xl overflow-hidden divide-y">
                                {Object.entries(localSettings.shortcuts).map(([action, key]) => (
                                    <div key={action} className="flex items-center justify-between p-3 bg-card hover:bg-muted/30 transition-colors">
                                        <span className="capitalize text-sm font-medium flex items-center gap-2">
                                            {action === 'new' ? 'Quick Edit / New' : action}
                                        </span>
                                        <div className="relative">
                                            <Input 
                                                value={key} 
                                                readOnly={!isPro}
                                                className={cn(
                                                    "w-12 text-center font-mono uppercase h-8 text-xs",
                                                    !isPro && "cursor-not-allowed opacity-70 bg-muted"
                                                )}
                                                onChange={(e) => updateShortcut(action as any, e.target.value.toLowerCase().slice(-1))}
                                            />
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
            
            <div className="p-4 border-t bg-background flex justify-end gap-2 shrink-0 z-20">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} className="min-w-[100px]">Save</Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}