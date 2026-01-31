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
  layout: 'classic' | 'split' | 'compact';
  shortcuts: {
    refresh: string;
    copy: string;
    delete: string;
    new: string;
    qr: string;
  };
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
  }
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdate: (newSettings: UserSettings) => void;
  isPro: boolean;
  onUpsell: (feature: string) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onUpdate, isPro, onUpsell }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateShortcut = (action: keyof UserSettings['shortcuts'], key: string) => {
    if (!isPro) {
      onUpsell("Custom Shortcuts");
      return;
    }
    setLocalSettings(prev => ({
      ...prev,
      shortcuts: { ...prev.shortcuts, [action]: key }
    }));
  };

  const handleLayoutChange = (layout: UserSettings['layout']) => {
    if (layout === 'split' && !isPro) {
      onUpsell("Split View Layout");
      return;
    }
    updateSetting('layout', layout);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" /> Settings
          </DialogTitle>
          <DialogDescription>
            Customize your inbox experience.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notify</TabsTrigger>
            <TabsTrigger value="appearance">Layout</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* GENERAL TAB */}
            <TabsContent value="general" className="space-y-4 mt-0">
               <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label>Auto-Save Contacts</Label>
                  <span className="text-xs text-muted-foreground">Automatically save senders to contacts list.</span>
                </div>
                <Switch disabled checked={false} />
              </div>
              <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground text-center">
                 More general settings coming soon.
              </div>
            </TabsContent>

            {/* NOTIFICATIONS TAB */}
            <TabsContent value="notifications" className="space-y-6 mt-0">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label className="flex items-center gap-2">
                     Browser Notifications <Bell className="w-3 h-3" />
                  </Label>
                  <span className="text-xs text-muted-foreground">Get notified when a new email arrives.</span>
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
              
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label>Sound Alerts</Label>
                  <span className="text-xs text-muted-foreground">Play a sound on new email.</span>
                </div>
                <Switch 
                  checked={localSettings.sound} 
                  onCheckedChange={(checked) => updateSetting('sound', checked)} 
                />
              </div>
            </TabsContent>

            {/* APPEARANCE TAB */}
            <TabsContent value="appearance" className="space-y-6 mt-0">
              <div className="grid grid-cols-3 gap-4">
                {/* Classic Layout */}
                <div 
                  className={cn(
                    "cursor-pointer border-2 rounded-lg p-2 hover:border-primary/50 transition-all",
                    localSettings.layout === 'classic' ? "border-primary bg-primary/5" : "border-muted"
                  )}
                  onClick={() => handleLayoutChange('classic')}
                >
                  <div className="aspect-square bg-muted rounded mb-2 flex flex-col gap-1 p-1">
                     <div className="h-1/3 bg-foreground/20 rounded"></div>
                     <div className="h-1/3 bg-foreground/10 rounded"></div>
                     <div className="h-1/3 bg-foreground/10 rounded"></div>
                  </div>
                  <div className="text-center text-sm font-medium">Classic</div>
                </div>

                {/* Compact Layout */}
                <div 
                  className={cn(
                    "cursor-pointer border-2 rounded-lg p-2 hover:border-primary/50 transition-all",
                    localSettings.layout === 'compact' ? "border-primary bg-primary/5" : "border-muted"
                  )}
                  onClick={() => handleLayoutChange('compact')}
                >
                  <div className="aspect-square bg-muted rounded mb-2 flex flex-col gap-0.5 p-1">
                     <div className="h-1/4 bg-foreground/20 rounded"></div>
                     <div className="h-1/4 bg-foreground/10 rounded"></div>
                     <div className="h-1/4 bg-foreground/10 rounded"></div>
                     <div className="h-1/4 bg-foreground/10 rounded"></div>
                  </div>
                  <div className="text-center text-sm font-medium">Compact</div>
                </div>

                {/* Split Layout (PRO) */}
                <div 
                  className={cn(
                    "cursor-pointer border-2 rounded-lg p-2 hover:border-primary/50 transition-all relative",
                    localSettings.layout === 'split' ? "border-primary bg-primary/5" : "border-muted"
                  )}
                  onClick={() => handleLayoutChange('split')}
                >
                  {!isPro && <div className="absolute top-1 right-1"><Crown className="w-3 h-3 text-amber-500 fill-amber-500" /></div>}
                  <div className="aspect-square bg-muted rounded mb-2 flex gap-1 p-1">
                     <div className="w-1/3 flex flex-col gap-1">
                        <div className="h-2 bg-foreground/20 rounded"></div>
                        <div className="h-2 bg-foreground/10 rounded"></div>
                     </div>
                     <div className="w-2/3 bg-background border border-border/50 rounded flex items-center justify-center">
                        <div className="w-4 h-2 bg-foreground/10 rounded"></div>
                     </div>
                  </div>
                  <div className="text-center text-sm font-medium">Split View</div>
                </div>
              </div>
            </TabsContent>

            {/* SHORTCUTS TAB */}
            <TabsContent value="shortcuts" className="space-y-4 mt-0">
               {!isPro && (
                 <div className="bg-amber-500/10 text-amber-500 p-2 rounded text-xs flex items-center gap-2 mb-2">
                    <Crown className="w-3 h-3" /> Upgrade to Pro to customize shortcuts.
                 </div>
               )}
               {Object.entries(localSettings.shortcuts).map(([action, key]) => (
                 <div key={action} className="flex items-center justify-between">
                    <Label className="capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={key} 
                        readOnly={!isPro}
                        className="w-16 text-center font-mono uppercase h-8"
                        onChange={(e) => updateShortcut(action as any, e.target.value.toLowerCase().slice(-1))}
                      />
                    </div>
                 </div>
               ))}
            </TabsContent>
          </div>

          <div className="p-4 border-t flex justify-end gap-2">
             <Button variant="outline" onClick={onClose}>Cancel</Button>
             <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
