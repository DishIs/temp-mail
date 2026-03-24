"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import Link from "next/link";

interface CliModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const ALL_COMMANDS = [
  { c: "fce login",          d: "Browser-based auth, keychain-backed",   plan: "Any" },
  { c: "fce dev",            d: "Create temp inbox + watch instantly",    plan: "Any" },
  { c: "fce watch [inbox]",  d: "Stream emails via WebSocket",            plan: "Startup+" },
  { c: "fce otp <inbox>",    d: "Extract latest OTP",                     plan: "Growth+" },
  { c: "fce status",         d: "Account info and plan",                  plan: "Any" },
  { c: "fce inbox",          d: "Manage registered addresses",            plan: "Any" },
  { c: "fce messages",       d: "List messages in an inbox",              plan: "Any" },
  { c: "fce domains",        d: "List available domains",                 plan: "Any" },
  { c: "fce usage",          d: "Check credit consumption",               plan: "Any" },
  { c: "fce update",         d: "Update to latest version",               plan: "Any" },
];

export function CliModal({ isOpen, onClose, email }: CliModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border-border">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-0.5 h-4 bg-border" aria-hidden />
            <span className="font-mono text-xs text-foreground font-semibold">fce</span>
            <span className="text-muted-foreground/50 text-xs">·</span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">FreeCustom.Email CLI</span>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight leading-tight">
            Your terminal,<br />your inbox
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground mt-2 leading-relaxed">
            Create disposable inboxes, stream emails, and extract OTPs — all from your terminal.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="p-6 space-y-7">

            {/* Installation */}
            <section className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Installation</p>

              <Tabs defaultValue="npm" className="w-full">
                <TabsList className="bg-muted/30 p-0.5 h-8 border border-border rounded-md gap-0 flex-wrap">
                  <TabsTrigger value="npm"   className="text-[10px] font-mono h-7 px-3 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-none">npm</TabsTrigger>
                  <TabsTrigger value="shell" className="text-[10px] font-mono h-7 px-3 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-none">Shell</TabsTrigger>
                  <TabsTrigger value="brew"  className="text-[10px] font-mono h-7 px-3 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-none">Homebrew</TabsTrigger>
                  <TabsTrigger value="scoop" className="text-[10px] font-mono h-7 px-3 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-none">Scoop</TabsTrigger>
                  <TabsTrigger value="choco" className="text-[10px] font-mono h-7 px-3 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-none">Choco</TabsTrigger>
                  <TabsTrigger value="go"    className="text-[10px] font-mono h-7 px-3 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-none">Go</TabsTrigger>
                </TabsList>

                <div className="mt-3">
                  <TabsContent value="npm" className="mt-0">
                    <CodeBlock language="bash" code="npm install -g fcemail" className="bg-muted/20" />
                    <p className="font-mono text-[9px] text-muted-foreground/50 mt-1.5">All platforms · update with <code>npm install -g fcemail@latest</code></p>
                  </TabsContent>
                  <TabsContent value="shell" className="mt-0">
                    <CodeBlock language="bash" code="curl -fsSL freecustom.email/install.sh | sh" className="bg-muted/20" />
                    <p className="font-mono text-[9px] text-muted-foreground/50 mt-1.5">macOS and Linux</p>
                  </TabsContent>
                  <TabsContent value="brew" className="mt-0">
                    <CodeBlock language="bash" code={`brew tap DishIs/homebrew-tap\nbrew install fce`} className="bg-muted/20" />
                    <p className="font-mono text-[9px] text-muted-foreground/50 mt-1.5">macOS and Linux · update with <code>brew upgrade fce</code></p>
                  </TabsContent>
                  <TabsContent value="scoop" className="mt-0">
                    <CodeBlock language="powershell" code={`scoop bucket add fce https://github.com/DishIs/scoop-bucket\nscoop install fce`} className="bg-muted/20" />
                    <p className="font-mono text-[9px] text-muted-foreground/50 mt-1.5">Windows · update with <code>scoop update fce</code></p>
                  </TabsContent>
                  <TabsContent value="choco" className="mt-0">
                    <CodeBlock language="powershell" code="choco install fce" className="bg-muted/20" />
                    <p className="font-mono text-[9px] text-muted-foreground/50 mt-1.5">Windows · update with <code>choco upgrade fce</code></p>
                  </TabsContent>
                  <TabsContent value="go" className="mt-0">
                    <CodeBlock language="bash" code="go install github.com/DishIs/fce-cli@latest" className="bg-muted/20" />
                    <p className="font-mono text-[9px] text-muted-foreground/50 mt-1.5">All platforms · requires Go 1.21+</p>
                  </TabsContent>
                </div>
              </Tabs>
            </section>

            {/* Quick start */}
            <section className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Quick start</p>
              <div className="rounded-lg border border-border overflow-hidden">
                {/* step 1 */}
                <div className="flex gap-0 border-b border-border">
                  <div className="w-10 shrink-0 flex items-start justify-center pt-3.5 border-r border-border">
                    <span className="font-mono text-[9px] text-muted-foreground/40">01</span>
                  </div>
                  <div className="flex-1 px-4 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Install via npm</p>
                    <CodeBlock code="npm install -g fcemail" language="bash" className="bg-muted/20" />
                  </div>
                </div>
                {/* step 2 */}
                <div className="flex gap-0 border-b border-border">
                  <div className="w-10 shrink-0 flex items-start justify-center pt-3.5 border-r border-border">
                    <span className="font-mono text-[9px] text-muted-foreground/40">02</span>
                  </div>
                  <div className="flex-1 px-4 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Login — opens browser, saves key to keychain</p>
                    <CodeBlock code="fce login" language="bash" className="bg-muted/20" />
                  </div>
                </div>
                {/* step 3 */}
                <div className="flex gap-0">
                  <div className="w-10 shrink-0 flex items-start justify-center pt-3.5 border-r border-border">
                    <span className="font-mono text-[9px] text-muted-foreground/40">03</span>
                  </div>
                  <div className="flex-1 px-4 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
                      {email ? "Watch your inbox" : "Create inbox and watch instantly"}
                    </p>
                    <CodeBlock
                      code={email ? `fce watch ${email}` : "fce dev"}
                      language="bash"
                      className="bg-muted/20"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* OTP output example */}
            <section className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">OTP extraction</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/10">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500/50" />
                    <span className="h-2 w-2 rounded-full bg-amber-500/50" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500/50" />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {email ? `fce otp ${email}` : "fce otp <inbox>"}
                  </span>
                  <span className="ml-auto font-mono text-[9px] border border-amber-500/20 text-amber-600/70 rounded px-1.5 py-px">Growth+</span>
                </div>
                <div className="p-4 font-mono text-xs text-muted-foreground space-y-0.5">
                  <p className="text-muted-foreground/30">────────────────────────────────────────────────</p>
                  <p className="text-foreground/70">  OTP</p>
                  <p className="text-muted-foreground/30">────────────────────────────────────────────────</p>
                  <p className="mt-1">&nbsp;</p>
                  <p><span className="text-muted-foreground">  OTP   · </span><span className="text-emerald-400 font-semibold"> 212342</span></p>
                  <p><span className="text-muted-foreground">  From  · </span><span className="text-foreground/60"> "Dishant Singh" &lt;dishupandey57@gmail.com&gt;</span></p>
                  <p><span className="text-muted-foreground">  Subj  · </span><span className="text-foreground/60"> Your OTP for FCE: 212342</span></p>
                  <p><span className="text-muted-foreground">  Time  · </span><span className="text-foreground/60"> 20:19:54</span></p>
                </div>
              </div>
            </section>

            {/* Commands grid */}
            <section className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Commands</p>
              <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
                {ALL_COMMANDS.map((cmd) => (
                  <div
                    key={cmd.c}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/10 transition-colors cursor-pointer group"
                    onClick={() => navigator.clipboard?.writeText(cmd.c)}
                  >
                    <code className="font-mono text-xs text-foreground w-44 shrink-0">{cmd.c}</code>
                    <span className="text-xs text-muted-foreground flex-1 leading-snug">{cmd.d}</span>
                    <span className={`font-mono text-[9px] border rounded px-1.5 py-px shrink-0 ${
                      cmd.plan === "Any" ? "border-border text-muted-foreground/50"
                        : cmd.plan.includes("Growth") ? "border-amber-500/20 text-amber-600/70"
                        : "border-blue-500/20 text-blue-500/70"
                    }`}>{cmd.plan}</span>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[9px] text-muted-foreground/40">Click any row to copy the command.</p>
            </section>

            {/* Security notice */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-mono text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Keychain-backed security</p>
                <p className="text-[10px] text-emerald-600/80 leading-relaxed font-mono">
                  Credentials stored in macOS Keychain, Windows Credential Manager, or Linux Secret Service. API keys auto-update with your plan.
                </p>
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="font-mono text-[9px] text-muted-foreground/40">MIT · v0.1.12 · FreeCustom.Email</p>
            <div className="flex items-center gap-3">
              {["CLI docs", "Automation"].map((label, i) => (
                <Link key={label} href={i === 0 ? "/api/cli" : "/api/automation"} onClick={onClose}
                  className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
                  {label} <ArrowRight className="h-2.5 w-2.5" />
                </Link>
              ))}
            </div>
          </div>
          <button onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Close
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}