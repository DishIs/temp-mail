"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Send, RefreshCcw, Edit2, PlayCircle, Bot, User, Trash2, Copy, Check, 
  X, Shield, Lock, Zap, Loader2, FileArchive as FileZip, 
  Paperclip, Image as ImageIcon, FileText, Trash
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import JSZip from "jszip";
import { useTranslations } from "next-intl";
import { CodeBlock } from "@/components/CodeBlock";

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

const EXAMPLE_PROMPTS = [
  "Generate a Python script to get the latest OTP from 'test@ditmail.info'",
  "How do I add a custom domain using the CLI?",
  "Create a TypeScript example for streaming emails via WebSocket.",
  "What's the rate limit for the Free plan?",
];

// Custom hook for responsive text area
const useAutoResizeTextArea = () => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    const el = textAreaRef.current;
    if (el) {
      el.style.height = "0px";
      const scrollHeight = el.scrollHeight;
      el.style.height = scrollHeight + "px";
    }
  }, [value]);

  return [textAreaRef, value, setValue] as const;
};

// Main Component
export function FceAiInterface() {
  const t = useTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinking, setThinking] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editInput, setEditInput] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mainInputRef, input, setInput] = useAutoResizeTextArea();

  // Auto-focus on load
  useEffect(() => {
    const consented = localStorage.getItem("fce_ai_consent");
    if (!consented) {
      setShowConsent(true);
    } else {
      mainInputRef.current?.focus();
    }
  }, []);

  // Scroll to bottom on new message
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
    mainInputRef.current?.focus();
  };
  
  // File upload and paste handling (as before)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (implementation remains the same)
  };
  const handlePaste = async (e: React.ClipboardEvent) => {
    // ... (implementation remains the same)
  };

  // Centralized chat submission logic
  const submitChat = async (chatMessages: Message[]) => {
    setIsLoading(true);
    setThinking("FCE AI is analyzing the request...");
    
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ messages: chatMessages.filter(m => !m.hidden) }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || "Connection Error");
      }

      const reader = response.body?.getReader();
      let aiContent = "";
      setThinking(null);

      setMessages(prev => [...prev, { role: "model", content: "" }]);

      while (true) {
        // ... (streaming and tool call logic remains the same)
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => prev.filter(m => m.content !== ""));
      toast.error(`Error: ${error.message || "Unable to reach FCE AI"}`);
      setThinking(null);
    } finally {
      setIsLoading(false);
      mainInputRef.current?.focus();
    }
  };

  // Handlers for send, retry, delete, edit (as before)
  const handleSendMessage = async (e?: React.FormEvent) => {
    // ... (implementation remains the same)
  };
  const handleRetry = async (index: number) => {
    // ... (implementation remains the same)
  };
  const handleDelete = (index: number) => {
    // ... (implementation remains the same)
  };
  const startEdit = (index: number, content: string) => {
    // ... (implementation remains the same)
  };
  const submitEdit = async (index: number) => {
    // ... (implementation remains the same)
  };
  const downloadAllCode = (content: string) => {
    // ... (implementation remains the same)
  };
  const handleExamplePrompt = (prompt: string) => {
    setInput(prompt);
    mainInputRef.current?.focus();
  };

  const MessageContent = ({ content }: { content: string }) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith("```")) {
            const lines = part.split("\n");
            const lang = lines[0].replace("```", "").trim();
            const code = lines.slice(1, -1).join("\n");
            return <CodeBlock key={i} code={code} language={lang} className="text-[13px] bg-muted/30" />;
          }
          return <p key={i}>{part}</p>;
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-transparent">
      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-40">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center space-y-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h3 className="text-3xl font-extrabold tracking-tight">FCE AI Assistant</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto pt-1">
                  Your intelligent partner for mastering the FreeCustom.Email ecosystem.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <button key={i} onClick={() => handleExamplePrompt(prompt)} className="text-left p-3 bg-muted/40 hover:bg-muted/80 border border-border/80 rounded-lg text-[13px] font-medium transition-colors">
                    {prompt}
                  </button>
                ))}
              </motion.div>
            </div>
          )}
          
          <div className="space-y-8">
            {messages.map((m, i) => !m.hidden && (
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex w-full group ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex w-[95%] max-w-3xl gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                   <div className="relative flex-1">
                      <div className={`p-4 text-[14px] leading-relaxed rounded-xl ${m.role === 'user' ? 'bg-primary/90 text-primary-foreground' : 'bg-muted/60'}`}>
                        <MessageContent content={m.content} />
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </ScrollArea>

      {/* Fixed input container */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent pb-4 pt-8">
        <div className="max-w-3xl mx-auto border border-border rounded-xl bg-background/80 backdrop-blur-lg shadow-2xl focus-within:border-primary/40 transition-all">
          {/* ... attachments UI ... */}

          <div className="relative p-2">
            <Textarea 
              ref={mainInputRef}
              value={input}
              onPaste={handlePaste}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="min-h-[60px] max-h-[300px] w-full border-0 focus-visible:ring-0 bg-transparent text-sm p-3 pr-24 resize-none shadow-none"
            />
            
            <div className="absolute right-3 bottom-3 flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && attachments.length === 0)} size="icon" className="h-8 w-8 rounded-lg">
                  <Send className="w-4 h-4" />
                </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ... Modals ... */}
    </div>
  );
}
