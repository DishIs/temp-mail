"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Crown, Keyboard, Layout, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserSettings {
  notifications: boolean;
  sound: boolean;
  layout: 'classic' | 'split' | 'compact' | 'minimal' | 'zen'; // Added 'minimal' and 'zen'
  shortcuts: {
    refresh: string;
    copy: string;
    delete: string;
    new: string;
    qr: string;
  };
  smartOtp: boolean; // Added
}

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: false,
  sound: true,
  layout: 'classic',
  shortcuts: {
    refresh: 'r',
    copy: 'c',
    delete: 'd',
    new: 'n',
    qr: 'q'
  },
  smartOtp: false // Default off, requires Pro
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdate: (newSettings: UserSettings) => void;
  isPro: boolean;
  isAuthenticated: boolean; // Added
  onUpsell: (feature: string) => void;
  onAuthNeed: (feature: string) => void; // Added
}

export function SettingsModal({ isOpen, onClose, settings, onUpdate, isPro, isAuthenticated, onUpsell, onAuthNeed }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [activeTab, setActiveTab] = useState("general"); // Control active tab manually for sidebar

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    // Auth Check for saving "permanent" settings? 
    // For now, we allow guests to change basic stuff locally.
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const requirePro = (action: () => void, feature: string) => {
      if (!isPro) {
          onUpsell(feature);
      } else {
          action();
      }
  };

  const requireAuth = (action: () => void, feature: string) => {
      if (!isAuthenticated) {
          onAuthNeed(feature);
      } else {
          action();
      }
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
    const proLayouts = ['split', 'minimal', 'zen'];
    if (proLayouts.includes(layout)) {
         requirePro(() => updateSetting('layout', layout), `${layout.charAt(0).toUpperCase() + layout.slice(1)} Layout`);
    } else {
         updateSetting('layout', layout);
    }
  };

  // --- RESPONSIVE LAYOUT HELPERS ---
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
      <DialogContent className="max-w-[800px] h-[80vh] p-0 gap-0 overflow-hidden flex flex-col md:flex-row">
        
        {/* SIDEBAR (Desktop) */}
        <div className="hidden md:flex flex-col w-64 border-r bg-muted/20 p-4 gap-1">
            <div className="flex items-center gap-2 px-2 mb-6 text-lg font-semibold">
                <Settings className="w-5 h-5" /> Settings
            </div>
            <SidebarItem id="general" label="General" icon={Settings} />
            <SidebarItem id="notifications" label="Notifications" icon={Bell} />
            <SidebarItem id="appearance" label="Appearance & Layout" icon={Layout} />
            <SidebarItem id="shortcuts" label="Shortcuts" icon={Keyboard} />
        </div>

        {/* HEADER (Mobile) */}
        <div className="md:hidden p-4 border-b flex items-center justify-between">
             <div className="font-semibold flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</div>
             <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col min-h-0 bg-background">
            {/* TABS (Mobile Only) */}
            <div className="md:hidden border-b">
                <div className="flex overflow-x-auto">
                    {['general', 'notifications', 'appearance', 'shortcuts'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap",
                                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                            )}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                
                {activeTab === "general" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h3 className="text-lg font-medium mb-4">General Preferences</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Auto-Save Contacts</Label>
                                        <p className="text-sm text-muted-foreground">Automatically save senders to contacts list.</p>
                                    </div>
                                    <Switch disabled checked={false} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-base">Smart OTP Extractor</Label>
                                            {!isPro && <Crown className="w-3 h-3 text-amber-500" />}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Detect and show verification codes in the email list.</p>
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

                {activeTab === "notifications" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div>
                            <h3 className="text-lg font-medium mb-4">Notifications</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Browser Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Get notified when a new email arrives.</p>
                                    </div>
                                    <Switch 
                                        checked={localSettings.notifications} 
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                Notification.requestPermission().then(p => {
                                                    if (p === 'granted') updateSetting('notifications', true);
                                                });
                                            } else {
                                                updateSetting('notifications', false);
                                            }
                                        }} 
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Sound Alerts</Label>
                                        <p className="text-sm text-muted-foreground">Play a sound on new email.</p>
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

                {activeTab === "appearance" && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div>
                            <h3 className="text-lg font-medium mb-4">Inbox Layout</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { id: 'classic', name: 'Classic', desc: 'Standard view' },
                                    { id: 'compact', name: 'Compact', desc: 'Dense list' },
                                    { id: 'split', name: 'Split View', desc: 'Side-by-side', pro: true },
                                    { id: 'minimal', name: 'Minimalist', desc: 'Hide history & footer', pro: true },
                                    { id: 'zen', name: 'Zen Mode', desc: 'Focus only', pro: true },
                                ].map((layout) => (
                                    <div 
                                        key={layout.id}
                                        className={cn(
                                            "relative cursor-pointer border-2 rounded-xl p-4 hover:border-primary/50 transition-all flex flex-col gap-2",
                                            localSettings.layout === layout.id ? "border-primary bg-primary/5" : "border-muted"
                                        )}
                                        onClick={() => handleLayoutChange(layout.id as any)}
                                    >
                                        {layout.pro && !isPro && <div className="absolute top-2 right-2"><Crown className="w-3 h-3 text-amber-500 fill-amber-500" /></div>}
                                        <div className="font-semibold">{layout.name}</div>
                                        <div className="text-xs text-muted-foreground">{layout.desc}</div>
                                    </div>
                                ))}
                            </div>
                         </div>
                     </div>
                )}

                {activeTab === "shortcuts" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                             <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium">Keyboard Shortcuts</h3>
                                {!isPro && (
                                    <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded flex items-center gap-1">
                                        <Crown className="w-3 h-3" /> Edit requires Pro
                                    </span>
                                )}
                             </div>
                             <div className="space-y-2">
                                {Object.entries(localSettings.shortcuts).map(([action, key]) => (
                                    <div key={action} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                                        <span className="capitalize text-sm font-medium">{action.replace(/([A-Z])/g, ' $1')}</span>
                                        <Input 
                                            value={key} 
                                            readOnly={!isPro}
                                            className="w-16 text-center font-mono uppercase h-8"
                                            onChange={(e) => updateShortcut(action as any, e.target.value.toLowerCase().slice(-1))}
                                        />
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                )}

            </ScrollArea>
            
            <div className="p-4 border-t bg-background flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
