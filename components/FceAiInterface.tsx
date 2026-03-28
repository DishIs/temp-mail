"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Send, Bot, User, X, Shield, Zap, Loader2,
  Paperclip, FileText, Trash, Copy, Square
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { CodeBlock } from "@/components/CodeBlock";
import { Turnstile } from "@marsidev/react-turnstile";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── types ─────────────────────────────────────────────────────────────────
interface Attachment {
  name: string;
  type: string;
  base64: string;
  content?: string;
}

interface ToolExecution {
  id: string;
  name: string;
  args: any;
  result?: string;
  status: "running" | "done" | "error";
}

interface Message {
  role: "user" | "model" | "function";
  content: string;
  attachments?: Attachment[];
  hidden?: boolean;
  toolExecutions?: ToolExecution[];
  isToolResult?: boolean;
  toolName?: string;
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

const PROMPT_CATEGORIES = [
  {
    id: "getting_started",
    name: "Getting Started",
    prompts: [
      "What is the rate limit for the Free plan?",
      "Explain how the credits system works",
      "How do I create my first private inbox?",
      "Give me a quickstart guide for the FCE API"
    ]
  },
  {
    id: "sdk",
    name: "SDK & Code",
    prompts: [
      "Generate a Python script to watch emails via WebSocket",
      "Create a Node.js example for extracting OTPs",
      "How to initialize the npm SDK and list messages?",
      "Write a PHP script to fetch emails using REST API"
    ]
  },
  {
    id: "cli",
    name: "CLI Tool",
    prompts: [
      "How do I add a custom domain using the CLI?",
      "Write a cURL command to list all my inboxes",
      "Show me how to fetch the latest OTP using the CLI",
      "What does 'fce watch' do?"
    ]
  },
  {
    id: "advanced",
    name: "Automation",
    prompts: [
      "How to connect FCE to Make.com for email parsing?",
      "Explain the n8n automation flow for FCE",
      "What is the exact OpenAPI specification for the OTP endpoint?",
      "How to set up custom domain DNS records securely?"
    ]
  }
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

// ─── Markdown Renderer ─────────────────────────────────────────────────────
const processThinkBlocks = (text: string) => {
  if (!text.includes("<think>")) return text;
  
  let processed = text.replace(/<think>([\s\S]*?)<\/think>/gi, (match, p1) => {
    return `\n\n> 🧠 **Thought Process**\n> \n> ${p1.trim().replace(/\n/g, '\n> ')}\n\n`;
  });
  
  if (processed.includes("<think>")) {
    const parts = processed.split("<think>");
    const before = parts[0];
    const thinking = parts[1];
    return `${before}\n\n> 🧠 **Thinking...**\n> \n> ${thinking.replace(/\n/g, '\n> ')}`;
  }
  
  return processed;
};

const Markdown = ({ children, isUser }: { children: string; isUser: boolean }) => {
  const processedChildren = isUser ? children : processThinkBlocks(children);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ ...props }) => <h1 className="text-xl font-bold mb-4 mt-6 first:mt-0" {...props} />,
        h2: ({ ...props }) => <h2 className="text-lg font-bold mb-3 mt-5 first:mt-0" {...props} />,
        h3: ({ ...props }) => <h3 className="text-base font-bold mb-2 mt-4 first:mt-0" {...props} />,
        h4: ({ ...props }) => <h4 className="text-sm font-bold mb-1 mt-3 first:mt-0" {...props} />,
        p: ({ ...props }) => <p className={`mb-3 last:mb-0 leading-relaxed ${isUser ? 'opacity-90' : 'text-muted-foreground'}`} {...props} />,
        ul: ({ ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
        li: ({ ...props }) => <li className={`${isUser ? 'opacity-90' : 'text-muted-foreground'}`} {...props} />,
        strong: ({ ...props }) => <strong className="font-bold text-foreground" {...props} />,
        em: ({ ...props }) => <em className="italic" {...props} />,
        code: ({ node, ...props }) => {
          const { className, children } = props;
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match;

          if (isInline) {
            return (
              <code className={`border rounded px-1.5 py-0.5 text-[11px] font-mono mx-0.5 ${isUser ? 'bg-background/20 border-border/20' : 'bg-muted/50 border-border/50'}`}>
                {children}
              </code>
            );
          }

          return (
            <CodeBlock 
              code={String(children).replace(/\n$/, "")} 
              language={match[1]} 
              className="text-xs my-4 rounded border border-border shadow-sm" 
            />
          );
        },
        pre: ({ children }) => <>{children}</>,
        a: ({ ...props }) => <a className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer" {...props} />,
        table: ({ ...props }) => (
          <div className="my-6 overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full border-collapse text-left text-xs" {...props} />
          </div>
        ),
        thead: ({ ...props }) => <thead className="bg-muted/30 border-b border-border/50" {...props} />,
        th: ({ ...props }) => <th className="px-4 py-3 font-semibold text-foreground" {...props} />,
        td: ({ ...props }) => <td className="px-4 py-3 border-t border-border/30 text-muted-foreground" {...props} />,
        blockquote: ({ ...props }) => <blockquote className="border-l-4 border-primary/30 pl-4 py-1 italic my-4 text-muted-foreground/80" {...props} />,
        hr: ({ ...props }) => <hr className="my-8 border-border/40" {...props} />,
      }}
    >
      {processedChildren}
    </ReactMarkdown>
  );
};

// ─── Tool Executions Group ──────────────────────────────────────────────────
function ToolExecutionsGroup({ executions }: { executions: ToolExecution[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!executions || executions.length === 0) return null;

  const runningCount = executions.filter(e => e.status === "running").length;
  const isRunning = runningCount > 0;
  
  let summaryText = "";
  if (isRunning) {
    summaryText = `Running ${runningCount > 1 ? `${runningCount} tools` : executions.find(e => e.status === "running")?.name}...`;
  } else {
    summaryText = `Used ${executions.length > 1 ? `${executions.length} tools` : executions[0].name}`;
  }

  return (
    <div className="mb-3 text-xs font-mono border-b border-border/30 pb-2">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className={`flex items-center gap-2 w-full text-left transition-colors ${isRunning ? 'text-primary animate-pulse' : 'text-muted-foreground hover:text-foreground'}`}
      >
        {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
        <span className="flex-1 truncate">{summaryText}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1 space-y-4 border-l-2 border-border/50 ml-1.5 pl-3 mt-2">
              {executions.map((exec, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-widest text-foreground font-semibold flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-muted-foreground" /> {exec.name}
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase tracking-widest text-[9px]">Parameters</span>
                    <pre className="mt-0.5 text-[11px] whitespace-pre-wrap text-muted-foreground">{JSON.stringify(exec.args, null, 2)}</pre>
                  </div>
                  {exec.result && (
                    <div className="mt-2">
                      <span className="text-muted-foreground uppercase tracking-widest text-[9px]">Result</span>
                      <pre className="mt-0.5 text-[11px] max-h-32 overflow-y-auto whitespace-pre-wrap text-muted-foreground/80">{exec.result}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────
export function FceAiInterface() {
  const[messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinking, setThinking] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isConsenting, setIsConsenting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(PROMPT_CATEGORIES[0].id);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainInputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("fce_ai_consent")) setShowConsent(true);
    else mainInputRef.current?.focus();
    
    // Reset scroll to top on mount
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = 0;
    }
  },[]);

  const handleConsent = async () => {
    if (!turnstileToken) return;
    setIsConsenting(true);
    try {
      const res = await fetch("/api/ai/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("fce_ai_consent", "true");
        setShowConsent(false);
      } else {
        toast.error(data.error || "Verification failed");
        setTurnstileToken(null);
      }
    } catch(e) {
      toast.error("An error occurred");
    } finally {
      setIsConsenting(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        if (messages.length > 0) {
          viewport.scrollTop = viewport.scrollHeight;
        } else {
          viewport.scrollTop = 0;
        }
      }
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
    setThinking(retryCount > 0 ? "Analyzing tool results..." : "Processing request...");

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ messages: chatMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorBody = await response.json();
          throw new Error(errorBody.error || "API Error");
        } else {
          throw new Error(response.statusText || "API Error");
        }
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";
      let toolCallsToExecute: any[] = [];
      
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
            toolCallsToExecute = callData.calls || [];
          } catch(e) { console.error("Failed to parse tool call:", e); }
          break;
        }
        
        aiContent += chunk;
        updateLast(aiContent);
      }

      if (toolCallsToExecute.length > 0) {
        setThinking("Executing tools...");
        
        const executions = toolCallsToExecute.map(call => ({
          id: Math.random().toString(36).substring(7),
          name: call.name,
          args: call.args,
          status: "running" as const
        }));

        setMessages(prev => {
          const temp = [...prev];
          const lastMsg = temp[temp.length - 1];
          if (lastMsg && lastMsg.role === 'model') {
            lastMsg.toolExecutions = [
              ...(lastMsg.toolExecutions || []),
              ...executions
            ];
          }
          return temp;
        });
        
        const toolResultMessages: Message[] = [];
        const completedExecutions = [] as ToolExecution[];

        for (const exec of executions) {
          try {
            const toolRes = await fetch("/api/ai/tool", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tool: exec.name,
                params: exec.args || {}
              })
            });
            
            const toolData = await toolRes.json();
            const toolResultString = toolData.result || toolData.error || "No data returned.";

            toolResultMessages.push({
              role: "function",
              content: `[SYSTEM: The tool '${exec.name}' returned this data:\n${toolResultString}\n\nPlease analyze this and provide the final answer.]`,
              hidden: true,
              isToolResult: true,
              toolName: exec.name
            });

            completedExecutions.push({
              ...exec,
              status: "done" as const,
              result: toolResultString
            });
          } catch (err) {
            console.error("Tool execution failed:", err);
            const toolResultString = "Tool execution failed.";
            toolResultMessages.push({
              role: "function",
              content: `[SYSTEM: The tool '${exec.name}' returned this data:\n${toolResultString}\n\nPlease analyze this and provide the final answer.]`,
              hidden: true,
              isToolResult: true,
              toolName: exec.name
            });
            completedExecutions.push({
              ...exec,
              status: "done" as const,
              result: toolResultString
            });
          }
        }

        const updatedModelMsg: Message = {
          role: "model",
          content: aiContent,
          toolExecutions: completedExecutions
        };
        const newChatHistory = [...chatMessages, updatedModelMsg, ...toolResultMessages];

        setMessages(prev => {
          const temp = [...prev];
          const aiMsg = temp[temp.length - 1];
          if (aiMsg && aiMsg.role === 'model' && aiMsg.toolExecutions) {
             for (const exec of aiMsg.toolExecutions) {
                 const comp = completedExecutions.find(c => c.id === exec.id);
                 if (comp) {
                     exec.status = "done";
                     exec.result = comp.result;
                 }
             }
          }
          temp.push(...toolResultMessages);
          return temp;
        });

        await submitChat(newChatHistory, retryCount + 1);
        return;
      }

    } catch (e: any) {
      if (e.name === 'AbortError') return;
      
      let systemErrorMessage = "";
      
      if (e.message === "Unauthorized. Turnstile verification required.") {
        localStorage.removeItem("fce_ai_consent");
        setTurnstileToken(null);
        setShowConsent(true);
        toast.error("Please complete verification to continue.");
      } else if (e.message === "Session token limit exceeded. Please try again later.") {
        toast.error(e.message);
        systemErrorMessage = "\n\n> ⚠️ **SYSTEM ERROR:** You have exceeded your session token limit. Please wait and try again later.";
      } else {
        toast.error(e.message || "Failed to connect to FCE AI");
        systemErrorMessage = `\n\n> ⚠️ **SYSTEM ERROR:** ${e.message || "Failed to connect to FCE AI"}`;
      }
      
      setMessages(prev => {
        const cleaned = prev.filter(m => m.content !== "");
        if (systemErrorMessage) {
           cleaned.push({ role: "model", content: systemErrorMessage });
        }
        return cleaned;
      });
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

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setThinking(null);
    }
  };

  const visibleMessages = messages.filter(m => !m.hidden);
  const groupedMessages = visibleMessages.reduce((acc, m) => {
    const last = acc[acc.length - 1];
    if (last && last.role === 'model' && m.role === 'model') {
      if (m.content) {
        last.content = last.content ? `${last.content}\n\n${m.content}` : m.content;
      }
      if (m.toolExecutions) {
        last.toolExecutions = [...(last.toolExecutions || []), ...m.toolExecutions];
      }
    } else {
      acc.push({ ...m });
    }
    return acc;
  }, [] as Message[]);

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
                <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-border/50 pb-2">
                  {PROMPT_CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md transition-colors ${
                        selectedCategory === category.id 
                          ? 'bg-muted/50 text-foreground' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {PROMPT_CATEGORIES.find(c => c.id === selectedCategory)?.prompts.map((prompt, i) => (
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
            {groupedMessages.map((m, i) => (
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
                    {/* Render Tool Executions */}
                    {m.toolExecutions && m.toolExecutions.length > 0 && (
                      <ToolExecutionsGroup executions={m.toolExecutions} />
                    )}
                    
                    <Markdown isUser={m.role === 'user'}>{m.content}</Markdown>
                    
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
               <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" /> AI Input
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

              {isLoading ? (
                <Button onClick={handleStop} size="icon" className="h-10 w-10 rounded shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Square className="w-4 h-4 fill-current" />
                </Button>
              ) : (
                <Button onClick={handleSend} disabled={!input.trim() && attachments.length === 0} size="icon" className="h-10 w-10 rounded shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showConsent} onOpenChange={(open) => { if (!open && localStorage.getItem("fce_ai_consent")) setShowConsent(false); }}>
        <DialogContent className="sm:max-w-[400px] rounded-lg border-border bg-background p-8 shadow-2xl [&>button]:hidden">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-sm font-mono flex items-center gap-3 uppercase tracking-widest text-foreground">
              <Shield className="w-4 h-4" /> System Policy
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            The FCE AI uses specialized language models to assist with API integration. 
            All inputs are processed securely and are strictly excluded from public model training datasets.
          </p>
          <div className="flex flex-col gap-4 items-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setTurnstileToken(token)}
              options={{ theme: "dark" }}
            />
            <Button 
              variant="outline" 
              className="w-full h-10 rounded text-xs font-mono uppercase tracking-widest border-border hover:bg-foreground hover:text-background transition-colors" 
              disabled={!turnstileToken || isConsenting}
              onClick={handleConsent}
            >
              {isConsenting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Acknowledge & Connect"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}