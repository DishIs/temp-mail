"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Send, Bot, User, Trash2, Download, Copy, Check, 
  X, Shield, Lock, Zap, Loader2, FileArchive as FileZip, 
  Info, Paperclip, Image as ImageIcon, FileText, Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import JSZip from "jszip";
import { useTranslations } from "next-intl";

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

export function FceAiInterface() {
  const t = useTranslations();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showPermission, setShowPermission] = useState<{
    show: boolean;
    type: string;
    description: string;
    params: any;
    resolve?: (allow: boolean) => void;
  } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const consented = localStorage.getItem("fce_ai_consent");
    if (!consented) setShowConsent(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleConsent = () => {
    localStorage.setItem("fce_ai_consent", "true");
    setShowConsent(false);
  };

  const askPermission = (type: string, description: string, params: any) => {
    return new Promise<boolean>((resolve) => {
      setShowPermission({ show: true, type, description, params, resolve });
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        let content = "";
        
        if (file.type.startsWith("text/") || file.name.endsWith(".json") || file.name.endsWith(".yaml") || file.name.endsWith(".yml") || file.name.endsWith(".ts") || file.name.endsWith(".py") || file.name.endsWith(".js")) {
          content = await file.text();
        }

        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type || "application/octet-stream",
          base64: base64,
          content: content
        }]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setAttachments(prev => [...prev, {
              name: file.name || "pasted-image.png",
              type: file.type,
              base64: event.target?.result as string
            }]);
          };
          reader.readAsDataURL(file);
        }
      } else if (item.type === "text/plain") {
        // If it's a large paste, we could treat it as a file
        const text = e.clipboardData.getData("text/plain");
        if (text.length > 500) {
           e.preventDefault();
           setAttachments(prev => [...prev, {
             name: "pasted-text.txt",
             type: "text/plain",
             base64: `data:text/plain;base64,${btoa(text)}`,
             content: text
           }]);
        }
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessage = input.trim();
    const currentAttachments = [...attachments];
    setInput("");
    setAttachments([]);
    
    const newMessages: Message[] = [...messages, { 
      role: "user", 
      content: userMessage,
      attachments: currentAttachments
    }];
    
    if (newMessages.length > 20) {
      for (let i = 0; i < newMessages.length - 15; i++) {
        newMessages[i].hidden = true;
      }
    }
    
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ messages: newMessages.filter(m => !m.hidden) }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || "Connection Error");
      }

      const reader = response.body?.getReader();
      let aiContent = "";

      setMessages(prev => [...prev, { role: "model", content: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        
        if (chunk.includes("__FCE_AI_CALL__:")) {
          const [text, callStr] = chunk.split("__FCE_AI_CALL__:");
          if (text) {
            aiContent += text;
            setMessages(prev => {
              const last = [...prev];
              last[last.length - 1].content = aiContent;
              return last;
            });
          }
          // Note: In real production we'd re-trigger the call here with tool results
          continue;
        }

        aiContent += chunk;
        setMessages(prev => {
          const last = [...prev];
          last[last.length - 1].content = aiContent;
          return last;
        });
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: "model", content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAllCode = async (content: string) => {
    const codeBlocks = content.match(/```[\s\S]*?```/g);
    if (!codeBlocks) return;
    const zip = new JSZip();
    codeBlocks.forEach((block, index) => {
      const lines = block.split("\n");
      const lang = lines[0].replace("```", "").trim() || "txt";
      const code = lines.slice(1, -1).join("\n");
      zip.file(`generated_${index + 1}.${lang === "javascript" ? "js" : lang === "python" ? "py" : lang}`, code);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fce_ai_code.zip";
    a.click();
  };

  return (
    <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 md:px-0" ref={scrollRef}>
        <div className="max-w-3xl mx-auto py-12 md:py-20 space-y-12">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shadow-inner">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-extrabold tracking-tight">How can FCE AI help?</h3>
                <p className="text-muted-foreground text-base max-w-sm mx-auto">
                  Paste code, attach images of errors, or ask for API automations. FCE AI can analyze files and screenshots.
                </p>
              </div>
            </div>
          )}
          
          {messages.map((m, i) => !m.hidden && (
            <motion.div 
              key={i} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start w-full group"
            >
              <div className="flex gap-6 md:gap-8 w-full">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${m.role === "user" ? "bg-muted border-border" : "bg-primary/10 border-primary/20"}`}>
                  {m.role === "user" ? <User className="w-5 h-5 text-muted-foreground" /> : <Bot className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 space-y-4 overflow-hidden">
                  <div className="font-bold text-xs uppercase tracking-[0.15em] text-muted-foreground/60 flex items-center gap-2">
                    {m.role === "user" ? (session?.user?.name || "User") : "FCE AI"}
                    {m.role === "model" && <Zap className="w-3 h-3 text-primary fill-primary" />}
                  </div>
                  
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-2">
                       {m.attachments.map((at, idx) => (
                         <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 border rounded-lg max-w-[200px] overflow-hidden">
                            {at.type.startsWith("image/") ? <ImageIcon className="w-4 h-4 shrink-0" /> : <FileText className="w-4 h-4 shrink-0" />}
                            <span className="text-[11px] font-medium truncate">{at.name}</span>
                         </div>
                       ))}
                    </div>
                  )}

                  <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {m.content}
                  </div>
                  
                  {m.role === "model" && m.content.includes("```") && (
                    <div className="pt-2 flex gap-3">
                      <Button size="sm" variant="outline" className="h-8 gap-2 rounded-lg text-xs font-semibold hover:bg-muted" onClick={() => downloadAllCode(m.content)}>
                        <FileZip className="w-4 h-4" /> Export (.zip)
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 gap-2 rounded-lg text-xs font-semibold" onClick={() => {
                         navigator.clipboard.writeText(m.content);
                      }}>
                        <Copy className="w-4 h-4" /> Copy markdown
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start w-full">
               <div className="flex gap-6 md:gap-8 w-full">
                 <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-primary/10 border-primary/20">
                   <Bot className="w-5 h-5 text-primary" />
                 </div>
                 <div className="flex-1 space-y-4">
                    <div className="font-bold text-xs uppercase tracking-[0.15em] text-muted-foreground/60 flex items-center gap-2">
                      FCE AI <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    </div>
                    <div className="space-y-2">
                       <div className="h-4 w-full bg-muted/50 animate-pulse rounded-md" />
                       <div className="h-4 w-2/3 bg-muted/50 animate-pulse rounded-md" />
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Claude-style fixed input container */}
      <div className="bg-gradient-to-t from-background via-background to-transparent pb-8 pt-10 px-4">
        <div className="max-w-4xl mx-auto border-2 border-muted-foreground/20 rounded-3xl bg-background/50 backdrop-blur-xl shadow-2xl focus-within:border-primary/40 transition-all overflow-hidden">
          {/* Attachment preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/20 border-b border-muted">
              {attachments.map((at, i) => (
                <div key={i} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-background border rounded-xl group relative">
                  {at.type.startsWith("image/") ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  <span className="text-[12px] font-medium max-w-[120px] truncate">{at.name}</span>
                  <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="p-0.5 rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative p-2">
            <Textarea 
              value={input}
              onPaste={handlePaste}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything about the API, attach images, or paste code..."
              disabled={isLoading}
              className="min-h-[100px] max-h-[400px] w-full border-0 focus-visible:ring-0 bg-transparent text-lg p-4 resize-none placeholder:text-muted-foreground/50"
            />
            
            <div className="flex items-center justify-between px-2 pb-1 pt-2">
              <div className="flex gap-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                </Button>
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  accept="image/*,text/*,.json,.yaml,.yml,.js,.ts,.py"
                />
                <Button type="button" variant="ghost" size="icon" className="rounded-xl">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground font-medium hidden sm:block">
                  Press Enter to send
                </span>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || (!input.trim() && attachments.length === 0)}
                  size="icon"
                  className="h-10 w-10 rounded-2xl shadow-xl transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto flex items-center justify-between mt-3 px-2">
           <p className="text-[11px] text-muted-foreground font-medium">
             FCE AI analyzed {messages.filter(m => m.attachments).length} files in this chat.
           </p>
           <button onClick={() => setMessages([])} className="text-[11px] font-bold text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors">
             <Trash className="w-3 h-3" /> CLEAR SESSION
           </button>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={showConsent} onOpenChange={setShowConsent}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-4 p-8 shadow-3xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black italic">
              <Shield className="w-8 h-8 text-primary" /> FCE AI SECURE
            </DialogTitle>
            <DialogDescription className="space-y-5 pt-2 text-foreground/80 leading-relaxed text-base">
              <p>Welcome to the premium developer assistant. Before we begin, understand our privacy model:</p>
              <div className="space-y-3 bg-muted/30 p-6 rounded-3xl border shadow-inner">
                <p className="flex items-center gap-3 font-semibold text-foreground"><Check className="w-5 h-5 text-primary" /> Secure Data Processing via Gemini.</p>
                <p className="flex items-center gap-3 font-semibold text-foreground"><Check className="w-5 h-5 text-primary" /> Your Conversation is Private.</p>
                <p className="flex items-center gap-3 font-semibold text-foreground"><Check className="w-5 h-5 text-primary" /> Multi-modal analysis enabled.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-6">
            <Button className="w-full h-14 rounded-2xl text-lg font-black tracking-tight shadow-2xl shadow-primary/30 active:scale-95 transition-transform" onClick={handleConsent}>
              START ASSISTANT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
