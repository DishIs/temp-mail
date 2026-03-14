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
import { Terminal, ShieldCheck } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";

interface CliModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export function CliModal({ isOpen, onClose, email }: CliModalProps) {
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
            Manage disposable inboxes and stream emails from your terminal.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-6 pt-0 space-y-8">
            {/* Installation */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Installation</h3>
              
              <Tabs defaultValue="brew" className="w-full">
                <TabsList className="bg-muted/50 p-0.5 h-8 border border-border">
                  <TabsTrigger value="brew" className="text-[10px] font-mono h-7 px-3">Homebrew</TabsTrigger>
                  <TabsTrigger value="scoop" className="text-[10px] font-mono h-7 px-3">Scoop</TabsTrigger>
                  <TabsTrigger value="script" className="text-[10px] font-mono h-7 px-3">Shell</TabsTrigger>
                </TabsList>
                
                <TabsContent value="brew" className="mt-3">
                  <CodeBlock language="bash" code={`brew tap DishIs/homebrew-tap\nbrew install fce`} />
                </TabsContent>

                <TabsContent value="scoop" className="mt-3">
                  <CodeBlock language="powershell" code={`scoop bucket add fce https://github.com/DishIs/scoop-bucket\nscoop install fce`} />
                </TabsContent>

                <TabsContent value="script" className="mt-3">
                  <CodeBlock language="bash" code={`curl -sSfL https://raw.githubusercontent.com/DishIs/fce-cli/main/scripts/install.sh | sh`} />
                </TabsContent>
              </Tabs>
            </section>

            {/* Quick Start */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Quick Start</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">1. Authenticate</p>
                  <CodeBlock code={`fce login`} />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">2. Watch inbox</p>
                  <CodeBlock code={`fce watch ${email || "random"}`} />
                </div>
              </div>
            </section>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-mono text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Keychain Security</p>
                <p className="text-[10px] text-emerald-600/80 leading-relaxed font-mono">
                  Credentials are stored securely in your OS keychain.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center">
          <p className="font-mono text-[9px] text-muted-foreground/50">MIT © FreeCustom.Email CLI</p>
          <button onClick={onClose} className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
