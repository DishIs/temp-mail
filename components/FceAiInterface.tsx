"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Send, Bot, User, X, Shield, Zap, Loader2,
  Paperclip, FileText, Trash, Copy
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { CodeBlock } from "@/components/CodeBlock";

// ─── types ─────────────────────────────────────────────────────────────────
interface Attachment {
  name: string;
  type: string;
  base64: string;
  content?: string;
}

interface Message {
  role: "user" | "model";
  content: string;
  attachments?: Attachment[];
  hidden?: boolean;
}

// ─── styling elements ──────────────────────────────────────────────────────
const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

const ASCII_FRAGMENTS =[
  { x: "2%",  y: "5%",  t: "SYS.INIT // GEMINI.MODEL" },
  { x: "67%", y: "3%",  t: "STATUS: 200 OK" },
  { x: "78%", y: "11%", t: "AWAITING_PROMPT..." },
  { x: "1%",  y: "21%", t: "STREAM_STATE: CONNECTED" },
  { x: "71%", y: "27%", t: "SESSION_ID: <fce_ws_932>" },
  { x: "4%",  y: "37%", t: "TOKENS: 0/2048" },
  { x: "74%", y: "43%", t: "FCE_CLI_HOOK: READY" },
  { x: "1%",  y: "51%", t: "MODE: INTERACTIVE" },
  { x: "69%", y: "57%", t: "LATENCY: 24ms" },
  { x: "3%",  y: "67%", t: "Date: Thu, 4 Mar 2026 09:55:00 +0000" },
  { x: "72%", y: "73%", t: "250-STARTTLS" },
  { x: "2%",  y: "83%", t: "AUTH PLAIN" },
  { x: "67%", y: "87%", t: "RCPT TO:<ai@freecustom.email>" },
];

const EXAMPLE_PROMPTS =[
  "Generate a Python script to watch emails via WebSocket",
  "How do I add a custom domain using the CLI?",
  "Create a Node.js example for extracting OTPs",
  "Write a cURL command to list all my inboxes",
  "What is the rate limit for the Free plan?",
  "Explain how the credits system works"
];

function AsciiLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {ASCII_FRAGMENTS.map((f, i) => (
        <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap"
          style={{ left: f.x, top: f.y, opacity: 0.042 }}>{f.t}</span>
      ))}
    </div>
  );
}

const Cols = () => (
  <>
    <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60 pointer-events-none" aria-hidden />
    <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60 pointer-events-none" aria-hidden />
  </>
);

function SectionMarker({ index, total, label }: { index: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      <div className="w-0.5 h-4 bg-border" aria-hidden />
      <span className="font-mono text-xs text-foreground font-semibold">[ {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")} ]</span>
      <span className="text-muted-foreground/50 text-xs">·</span>
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Markdown Inline Parser ────────────────────────────────────────────────
// Renders basic markdown (bold, italic, inline code, links, lists) safely
const renderMarkdownText = (text: string, isUser: boolean) => {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    
    // Check if it's a list item
    const isListItem = line.trim().match(/^[-*]\s+(.*)/) || line.trim().match(/^\d+\.\s+(.*)/);
    
    // Split by markdown tokens
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);
    
    const renderedLine = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={j} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={j} className="italic">{part.slice(1, -1)}</em>;
      if (part.startsWith('`') && part.endsWith('`')) return (
        <code key={j} className={`border rounded px-1.5 py-0.5 text-[11px] font-mono mx-0.5 ${isUser ? 'bg-background/20 border-border/20' : 'bg-muted/50 border-border/50'}`}>
          {part.slice(1, -1)}
        </code>
      );
      if (part.match(/\[(.*?)\]\((.*?)\)/)) {
        const [, label, href] = part.match(/\[(.*?)\]\((.*?)\)/)!;
        return <a key={j} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity">{label}</a>;
      }
      return <span key={j}>{part}</span>;
    });

    if (isListItem) {
      return (
        <div key={i} className="flex gap-2 mt-1.5">
          <span className="text-muted-foreground/50 select-none">•</span>
          <span className={`${isUser ? 'opacity-90' : 'text-muted-foreground'}`}>{renderedLine}</span>
        </div>
      );
    }
    
    return <p key={i} className={`mb-2 last:mb-0 ${isUser ? 'opacity-90' : 'text-muted-foreground'}`}>{renderedLine}</p>;
  });
};

// ─── Component ─────────────────────────────────────────────────────────────
export function FceAiInterface() {
  const[messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinking, setThinking] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!localStorage.getItem("fce_ai_consent")) setShowConsent(true);
    else mainInputRef.current?.focus();
  },[]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isLoading, thinking]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        let content = "";
        if (file.type.startsWith("text/") || /\.(json|yaml|yml|ts|py|js)$/.test(file.name)) {
          content = await file.text();
        }
        setAttachments(prev =>[...prev, { name: file.name, type: file.type || "application/octet-stream", base64, content }]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitChat = async (chatMessages: Message[], retryCount = 0) => {
    if (retryCount > 3) {
      toast.error("Tool execution limit reached.");
      setIsLoading(false);
      setThinking(null);
      return;
    }

    setIsLoading(true);
    if (!thinking) setThinking("Processing request...");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ messages: chatMessages.filter(m => !m.hidden) }),
      });

      if (!response.ok) throw new Error("API Error");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";
      let toolCallToExecute: any = null;
      
      setThinking(null);
      setMessages(prev =>[...prev, { role: "model", content: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        
        if (chunk.includes("__FCE_AI_CALL__:")) {
          const parts = chunk.split("__FCE_AI_CALL__:");
          if (parts[0]) { aiContent += parts[0]; updateLast(aiContent); }
          
          try {
            const callData = JSON.parse(parts[1]);
            toolCallToExecute = callData.calls[0];
          } catch(e) { console.error("Failed to parse tool call:", e); }
          break;
        }
        
        aiContent += chunk; 
        updateLast(aiContent);
      }

      if (toolCallToExecute) {
        setThinking(`Executing: ${toolCallToExecute.name}() ...`); 
        
        const toolRes = await fetch("/api/ai/tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool: toolCallToExecute.name,
            params: toolCallToExecute.args || {}
          })
        });
        
        const toolData = await toolRes.json();
        const toolResultString = toolData.result || toolData.error || "No data returned.";

        const toolResultMessage: Message = {
          role: "user",
          content: `[SYSTEM: The tool '${toolCallToExecute.name}' returned this data:\n${toolResultString}\n\nPlease analyze this and provide the final answer.]`,
          hidden: true
        };

        const newChatHistory = [...chatMessages, toolResultMessage];

        setMessages(prev => {
          const temp = [...prev];
          temp.pop(); 
          temp.push(toolResultMessage);
          return temp;
        });

        await submitChat(newChatHistory, retryCount + 1);
        return; 
      }

    } catch (e) { 
      toast.error("Failed to connect to FCE AI"); 
      setMessages(prev => prev.filter(m => m.content !== ""));
    } 

    setIsLoading(false); 
    setThinking(null); 
    setTimeout(() => mainInputRef.current?.focus(), 100);
  };

  const updateLast = (content: string) => setMessages(prev => {
    const last =[...prev];
    if (last.length > 0) last[last.length - 1].content = content;
    return last;
  });

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    const msg: Message = { role: "user", content: input.trim(), attachments: [...attachments] };
    setInput(""); setAttachments([]);
    const updated = [...messages, msg];
    setMessages(updated);
    await submitChat(updated);
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-background text-foreground overflow-x-hidden font-sans" style={DOT_BG}>
      <AsciiLayer />
      <Cols />

      <ScrollArea className="flex-1 relative z-10" ref={scrollRef}>
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-44">
          
          {/* Header Marker */}
          <SectionMarker index={1} total={1} label="FreeCustom.Email AI" />
          
          {/* Empty State */}
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.1] mb-5">
                FCE AI<br />Developer Console
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg leading-relaxed mb-8">
                Natural language interface for the FreeCustom.Email API. Generate SDK snippets, debug WebSockets, or parse OpenAPI schemas instantly.
              </p>
              
              <div className="mt-8">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">Example Prompts</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <button 
                      key={i} 
                      onClick={() => { setInput(prompt); mainInputRef.current?.focus(); }}
                      className="text-left p-4 bg-background/60 hover:bg-muted/30 border border-border/60 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <div className="space-y-8 mt-6">
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-4 group ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Avatar Icon */}
                <div className="mt-1 flex items-start justify-center shrink-0">
                  {m.role === 'user' 
                    ? <User className="w-4 h-4 text-muted-foreground/50" /> 
                    : <Zap className="w-4 h-4 text-foreground" />
                  }
                </div>
                
                {/* Bubble Content */}
                <div className={`relative max-w-[95%] md:max-w-[85%] ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  
                  {m.role === 'model' && (
                    <div className="absolute -top-7 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { navigator.clipboard.writeText(m.content); toast.success("Copied"); }} className="flex items-center gap-1.5 px-2 py-1 bg-muted/20 border border-border rounded text-[10px] font-mono hover:bg-muted/40 transition-colors">
                        <Copy className="w-3 h-3" /> COPY RAW
                      </button>
                    </div>
                  )}

                  <div className={`inline-block text-[13px] leading-relaxed p-4 rounded-lg border text-left ${
                    m.role === 'user' 
                      ? 'bg-muted/20 border-border text-foreground' 
                      : 'bg-background/90 border-transparent shadow-sm'
                  }`}>
                    {/* Render Content (Code Blocks + Markdown) */}
                    {m.content.split(/(```[\s\S]*?```)/g).map((part, idx) => {
                      if (part.startsWith('```')) {
                        const lines = part.split('\n');
                        const lang = lines[0].replace('```','').trim();
                        const code = lines.slice(1,-1).join('\n');
                        return <CodeBlock key={idx} code={code} language={lang} className="text-xs my-4 rounded border border-border shadow-sm" />;
                      }
                      return <div key={idx}>{renderMarkdownText(part, m.role === 'user')}</div>;
                    })}
                    
                    {/* Attachments */}
                    {m.attachments?.length ? (
                       <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                         {m.attachments.map((at, idx) => (
                           <div key={idx} className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted/20 border border-border rounded text-[10px] font-mono text-muted-foreground">
                              <FileText className="w-3 h-3" /> <span className="truncate max-w-[150px]">{at.name}</span>
                           </div>
                         ))}
                       </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Thinking State */}
            {thinking && (
              <div className="flex gap-4 animate-pulse pt-2">
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin mt-1" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest pt-1">{thinking}</span>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent z-20 pointer-events-none">
        <div className="max-w-4xl mx-auto flex flex-col gap-2 pointer-events-auto">
          
          <div className="flex items-center justify-between px-1">
             <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" /> Terminal Input
             </span>
             {messages.length > 0 && (
               <button onClick={() => setMessages([])} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                 <Trash className="w-3 h-3" /> Clear Buffer
               </button>
             )}
          </div>

          <div className="bg-background/90 backdrop-blur-xl border border-border rounded-lg shadow-2xl overflow-hidden focus-within:border-foreground/30 transition-colors">
            
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="flex gap-2 p-3 border-b border-border overflow-x-auto bg-muted/10">
                  {attachments.map((at, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1 bg-background border border-border rounded text-xs font-mono text-muted-foreground shrink-0">
                      <span className="truncate max-w-[120px]">{at.name}</span>
                      <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end p-2 gap-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="w-4 h-4" />
              </Button>
              <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              
              <Textarea 
                ref={mainInputRef} 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder="Ask a question or paste code..."
                className="min-h-[44px] max-h-[200px] border-0 focus-visible:ring-0 bg-transparent text-sm px-2 py-3 resize-none shadow-none font-mono placeholder:text-muted-foreground/40"
              />

              <Button onClick={handleSend} disabled={isLoading || (!input.trim() && attachments.length === 0)} size="icon" className="h-10 w-10 rounded shrink-0 transition-transform active:scale-95 shadow-none border border-border bg-muted/20 hover:bg-foreground hover:text-background">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showConsent} onOpenChange={setShowConsent}>
        <DialogContent className="sm:max-w-[400px] rounded-lg border-border bg-background p-8 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-sm font-mono flex items-center gap-3 uppercase tracking-widest text-foreground">
              <Shield className="w-4 h-4" /> System Policy
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            The FCE AI Terminal uses specialized language models to assist with API integration. 
            All inputs are processed securely and are strictly excluded from public model training datasets.
          </p>
          <Button variant="outline" className="w-full h-10 rounded text-xs font-mono uppercase tracking-widest border-border hover:bg-foreground hover:text-background transition-colors" onClick={() => { localStorage.setItem("fce_ai_consent", "true"); setShowConsent(false); }}>
            Acknowledge & Connect
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}