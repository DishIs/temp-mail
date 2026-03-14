"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Check, Terminal, Zap, Download, BookOpen, ShieldCheck } from "lucide-react";

interface CliModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export function CliModal({ isOpen, onClose, email }: CliModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const ASCII_ART = `
______             _____           _                    _____                _ _ 
|  ___|           /  __ \\         | |                  |  ___|              (_) |
| |_ _ __ ___  ___| /  \\/_   _ ___| |_ ___  _ __ ___   | |__ _ __ ___   __ _ _| |
|  _| '__/ _ \\/ _ \\ |   | | | / __| __/ _ \\| '_ \` _ \\  |  __| '_ \` _ \\ / _\` | | |
| | | | |  __/  __/ \\__/\\ |_| \\__ \\ || (_) | | | | | |_| |__| | | | | | (_| | | |
\\_| |_|  \\___|\\___|\\____/\\__,_|___/\\__\\___/|_| |_| |_(_)____/_| |_| |_|\\__,_|_|_|
  `;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border-border shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Terminal className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold font-mono tracking-tight">
              fce — FreeCustom.Email CLI
            </DialogTitle>
          </div>
          <DialogDescription className="font-mono text-xs text-muted-foreground leading-relaxed">
            Manage disposable inboxes, extract OTPs, and stream real-time email events from your terminal.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-6 pt-0 space-y-8">
            {/* ASCII Banner */}
            <pre className="font-mono text-[6px] md:text-[8px] leading-[1.2] text-primary/40 select-none overflow-hidden py-2 border-y border-border/50">
              {ASCII_ART}
            </pre>

            {/* Installation */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Install</h3>
              </div>
              
              <Tabs defaultValue="brew" className="w-full">
                <TabsList className="bg-muted/50 p-0.5 h-8 border border-border">
                  <TabsTrigger value="brew" className="text-[10px] font-mono h-7 px-3">Homebrew</TabsTrigger>
                  <TabsTrigger value="scoop" className="text-[10px] font-mono h-7 px-3">Scoop</TabsTrigger>
                  <TabsTrigger value="script" className="text-[10px] font-mono h-7 px-3">Shell</TabsTrigger>
                  <TabsTrigger value="go" className="text-[10px] font-mono h-7 px-3">Go</TabsTrigger>
                </TabsList>
                
                <TabsContent value="brew" className="mt-2 space-y-2">
                  <div className="group relative">
                    <pre className="bg-muted/30 p-3 rounded-md font-mono text-xs border border-border overflow-x-auto">
                      <code>{`brew tap DishIs/homebrew-tap\nbrew install fce`}</code>
                    </pre>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard("brew tap DishIs/homebrew-tap\nbrew install fce", "brew")}
                    >
                      {copied === "brew" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="scoop" className="mt-2 space-y-2">
                  <div className="group relative">
                    <pre className="bg-muted/30 p-3 rounded-md font-mono text-xs border border-border overflow-x-auto">
                      <code>{`scoop bucket add fce https://github.com/DishIs/scoop-bucket\nscoop install fce`}</code>
                    </pre>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard("scoop bucket add fce https://github.com/DishIs/scoop-bucket\nscoop install fce", "scoop")}
                    >
                      {copied === "scoop" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="script" className="mt-2 space-y-2">
                  <div className="group relative">
                    <pre className="bg-muted/30 p-3 rounded-md font-mono text-xs border border-border overflow-x-auto">
                      <code>{`curl -sSfL https://raw.githubusercontent.com/DishIs/fce-cli/main/scripts/install.sh | sh`}</code>
                    </pre>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard("curl -sSfL https://raw.githubusercontent.com/DishIs/fce-cli/main/scripts/install.sh | sh", "script")}
                    >
                      {copied === "script" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="go" className="mt-2 space-y-2">
                  <div className="group relative">
                    <pre className="bg-muted/30 p-3 rounded-md font-mono text-xs border border-border overflow-x-auto">
                      <code>{`go install github.com/DishIs/fce-cli@latest`}</code>
                    </pre>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard("go install github.com/DishIs/fce-cli@latest", "go")}
                    >
                      {copied === "go" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            {/* Quick Start */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Quick Start</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono text-muted-foreground"># 1. Login — opens your browser</p>
                  <pre className="bg-muted/30 p-2.5 rounded-md font-mono text-xs border border-border">
                    <code>fce login</code>
                  </pre>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono text-muted-foreground"># 2. Watch current inbox in real time</p>
                  <div className="group relative">
                    <pre className="bg-muted/30 p-2.5 rounded-md font-mono text-xs border border-border">
                      <code>fce watch {email || "random"}</code>
                    </pre>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-1.5 right-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(`fce watch ${email || "random"}`, "watch")}
                    >
                      {copied === "watch" ? <Check className="h-2.5 w-2.5 text-green-500" /> : <Copy className="h-2.5 w-2.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Commands Table */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Commands</h3>
              </div>
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-left font-mono text-[10px]">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-2.5 font-bold uppercase tracking-tighter">Command</th>
                      <th className="p-2.5 font-bold uppercase tracking-tighter">Description</th>
                      <th className="p-2.5 font-bold uppercase tracking-tighter text-right">Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr>
                      <td className="p-2.5 text-foreground">fce login</td>
                      <td className="p-2.5 text-muted-foreground">Authenticate via browser</td>
                      <td className="p-2.5 text-right text-muted-foreground/60">Any</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-foreground">fce watch</td>
                      <td className="p-2.5 text-muted-foreground">Stream via WebSocket</td>
                      <td className="p-2.5 text-right text-amber-500 font-bold">Startup+</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-foreground">fce otp</td>
                      <td className="p-2.5 text-muted-foreground">Extract latest OTP</td>
                      <td className="p-2.5 text-right text-amber-600 font-bold">Growth+</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-foreground">fce status</td>
                      <td className="p-2.5 text-muted-foreground">Account & quota info</td>
                      <td className="p-2.5 text-right text-muted-foreground/60">Any</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-mono text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Keychain Security</p>
                <p className="text-[10px] text-emerald-600/80 leading-relaxed font-mono">
                  Credentials are stored securely in your OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service).
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center">
          <p className="font-mono text-[9px] text-muted-foreground/50">MIT © FreeCustom.Email CLI</p>
          <Button size="sm" variant="outline" className="h-8 font-mono text-[10px]" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
