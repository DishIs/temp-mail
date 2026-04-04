"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, Zap, ArrowRight, Cpu, Layers, GitBranch, Check, Copy, Play, RotateCcw, Terminal, Mail, Server, Key } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { ApiStats } from "@/components/ApiStats";
import { UseCasesSection } from "@/components/UseCasesSection";

// ─── shared ──────────────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @keyframes mq-left  { from { transform:translateX(0) } to { transform:translateX(-50%) } }
    @keyframes mq-right { from { transform:translateX(-50%) } to { transform:translateX(0) } }
    .mq-l { animation: mq-left  38s linear infinite; display:flex; width:max-content; }
    .mq-r { animation: mq-right 44s linear infinite; display:flex; width:max-content; }
    .mq-l:hover, .mq-r:hover { animation-play-state:paused; }
    @keyframes blink { 50%{opacity:0} }
    .caret { display:inline-block;width:2px;height:13px;background:currentColor;
             animation:blink 1s step-end infinite;margin-left:2px;vertical-align:-2px; }
    .flow-line-base { stroke: #0f172a; stroke-width: 1.5; stroke-dasharray: 5 4; }
    .flow-line-visited { stroke: #0f172a; stroke-width: 2; }
  `}</style>
);

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

function AsciiLayer() {
  const fragments = [
    { x: "3%",  y: "8%",  t: "MCP/1.0 200 OK" },
    { x: "65%", y: "4%",  t: "create_and_wait_for_otp()" },
    { x: "72%", y: "14%", t: "JSON-RPC 2.0" },
    { x: "2%",  y: "22%", t: "params: { timeout: 30 }" },
    { x: "68%", y: "28%", t: "method: tools/call" },
    { x: "5%",  y: "38%", t: "result: { otp: 847291 }" },
    { x: "70%", y: "42%", t: "tools/list" },
    { x: "1%",  y: "52%", t: "longpoll active..." },
    { x: "75%", y: "58%", t: "email received" },
    { x: "3%",  y: "68%", t: "SMTP RCPT TO:<test@>" },
    { x: "71%", y: "74%", t: "extract_otp()" },
    { x: "2%",  y: "84%", t: "Redis pub/sub" },
    { x: "68%", y: "88%", t: "connection closed" },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {fragments.map((f, i) => (
        <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap" style={{ left: f.x, top: f.y, opacity: 0.045 }}>{f.t}</span>
      ))}
    </div>
  );
}

const Cols = () => (
  <>
    <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
    <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
  </>
);

const OpenAILogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-4 h-4">
    <circle cx="12" cy="12" r="9.5"/>
    <line x1="12" y1="2.5" x2="12" y2="21.5"/>
    <line x1="2.5" y1="12" x2="21.5" y2="12"/>
    <line x1="5.5" y1="5.5" x2="18.5" y2="18.5"/>
    <line x1="18.5" y1="5.5" x2="5.5" y2="18.5"/>
  </svg>
);
const AnthropicLogo = () => (
  <svg viewBox="0 0 32 24" fill="currentColor" className="w-5 h-4">
    <path d="M19.2 3h-4.2L5 21h4.5l2-5h9l2 5H27L19.2 3zm-6.3 10l3.1-8 3.1 8h-6.2z"/>
  </svg>
);
const LangChainLogo = () => (
  <svg viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-4">
    <circle cx="10" cy="12" r="7"/>
    <circle cx="30" cy="12" r="7"/>
    <path d="M17 12h6" strokeWidth="2.5"/>
  </svg>
);
const CursorLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M4 2l16 9-9 2-3 9L4 2z"/>
  </svg>
);
const N8nLogo = () => (
  <span className="font-mono font-bold text-xs" style={{letterSpacing: "-0.5px"}}>n8n</span>
);
const LangGraphLogo = () => (
  <svg viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-4">
    <circle cx="8" cy="12" r="4" fill="currentColor" fillOpacity="0.15"/>
    <circle cx="20" cy="5"  r="4" fill="currentColor" fillOpacity="0.15"/>
    <circle cx="32" cy="12" r="4" fill="currentColor" fillOpacity="0.15"/>
    <circle cx="20" cy="19" r="4" fill="currentColor" fillOpacity="0.15"/>
    <line x1="12" y1="12" x2="16" y2="7"/>
    <line x1="24" y1="7"  x2="28" y2="11"/>
    <line x1="28" y1="13" x2="24" y2="17"/>
    <line x1="16" y1="17" x2="12" y2="13"/>
  </svg>
);
const WindsurfLogo = () => (
  <svg viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-4">
    <path d="M4 18 Q10 6 16 10 Q22 14 28 4"/>
    <path d="M4 21 Q12 14 20 16 Q26 18 28 12" opacity="0.45"/>
  </svg>
);
const MakeLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <polygon points="12,2 22,7 22,17 12,22 2,17 2,7"/>
    <circle cx="12" cy="12" r="3.5"/>
  </svg>
);
const CrewAILogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <path d="M12 2L20 7v10L12 22 4 17V7z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const AutoGenLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <rect x="4" y="6" width="16" height="12" rx="3"/>
    <circle cx="9"  cy="12" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
    <path d="M8 4h2M14 4h2" strokeLinecap="round"/>
    <path d="M9 17.5C9 18.9 10.3 20 12 20s3-1.1 3-2.5" strokeLinecap="round"/>
  </svg>
);
const LlamaLogo = () => (
  <svg viewBox="0 0 32 24" fill="currentColor" className="w-5 h-4">
    <path d="M16 4L4 12v8l12 4 12-4v-8L16 4zm0 4l6 2v4l-6 2-6-2v-4l6-2z"/>
  </svg>
);
const GeminiLogo = () => (
  <svg viewBox="0 0 32 24" fill="currentColor" className="w-5 h-4">
    <path d="M8 4h16v4H8V4zm0 6h16v4H8v-4zm0 6h10v4H8v-4z"/>
  </svg>
);
const GrokLogo = () => (
  <svg viewBox="0 0 32 24" fill="currentColor" className="w-5 h-4">
    <circle cx="16" cy="12" r="8"/>
  </svg>
);

const ROW1 = [
  { name:"Claude",     Logo: AnthropicLogo,  sub:"AI Agent" },
  { name:"Cursor",     Logo: CursorLogo,     sub:"IDE"      },
  { name:"LangChain",  Logo: LangChainLogo,  sub:"Framework"},
  { name:"OpenAI",     Logo: OpenAILogo,     sub:"LLM"      },
  { name:"n8n",        Logo: N8nLogo,        sub:"Workflow" },
  { name:"Windsurf",   Logo: WindsurfLogo,   sub:"IDE"      },
  { name:"LangGraph",  Logo: LangGraphLogo,  sub:"Agents"   },
  { name:"AutoGen",    Logo: AutoGenLogo,    sub:"MS Agents"},
  { name:"Make",       Logo: MakeLogo,       sub:"Automation"},
  { name:"CrewAI",     Logo: CrewAILogo,     sub:"Multi-agent"},
  { name:"Llama",      Logo: LlamaLogo,      sub:"LLM"      },
  { name:"Gemini",     Logo: GeminiLogo,    sub:"LLM"      },
];
const ROW2 = [
  { name:"Grok",       Logo: GrokLogo,       sub:"LLM"      },
  { name:"AutoGen",    Logo: AutoGenLogo,    sub:"Multi-agent"},
  { name:"Claude",     Logo: AnthropicLogo,  sub:"Sonnet"   },
  { name:"Cursor",     Logo: CursorLogo,     sub:"Composer" },
  { name:"LangChain",  Logo: LangChainLogo,  sub:"Framework"},
  { name:"OpenAI",     Logo: OpenAILogo,     sub:"GPT"      },
  { name:"n8n",        Logo: N8nLogo,        sub:"Workflow" },
  { name:"Windsurf",   Logo: WindsurfLogo,   sub:"Code AI"  },
  { name:"LangGraph",  Logo: LangGraphLogo,  sub:"Agents"   },
  { name:"Make",       Logo: MakeLogo,       sub:"iPaaS"    },
  { name:"CrewAI",     Logo: CrewAILogo,     sub:"Multi-agent"},
  { name:"Llama",      Logo: LlamaLogo,      sub:"Meta"     },
];
const ROW3 = [
  { name:"Gemini",     Logo: GeminiLogo,     sub:"Google"   },
  { name:"Grok",      Logo: GrokLogo,       sub:"xAI"      },
  { name:"AutoGen",   Logo: AutoGenLogo,    sub:"Microsoft"},
  { name:"Ollama",    Logo: LlamaLogo,      sub:"Local LLM"},
  { name:"Vercel",    Logo: CursorLogo,    sub:"Deploy"   },
  { name:"Netlify",   Logo: WindsurfLogo,  sub:"Edge"     },
  { name:"Railway",   Logo: LangGraphLogo,  sub:" hosting"},
  { name:"Render",    Logo: MakeLogo,       sub:" hosting"},
  { name:"Supabase",  Logo: CrewAILogo,    sub:"Database" },
  { name:"MongoDB",   Logo: AutoGenLogo,    sub:"Database" },
  { name:"PostgreSQL",Logo: OpenAILogo,     sub:"Database" },
  { name:"Redis",     Logo: AnthropicLogo,  sub:"Cache"    },
];

function BrandChip({ name, Logo, sub }: { name: string; Logo: React.ElementType; sub: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 mx-1.5 my-1 border border-border rounded-lg bg-background whitespace-nowrap">
      <span className="text-foreground flex items-center">
        <Logo/>
      </span>
      <div>
        <p className="m-0 text-xs font-semibold text-foreground font-mono leading-tight">{name}</p>
        <p className="m-0 text-[10px] text-muted-foreground font-mono leading-tight">{sub}</p>
      </div>
    </div>
  );
}

export function WorksWithSection() {
  const duped1 = [...ROW1, ...ROW1, ...ROW1];
  const duped2 = [...ROW2, ...ROW2, ...ROW2];
  const duped3 = [...ROW3, ...ROW3, ...ROW3];
  return (
    <section className="relative border-t border-border py-12 sm:py-16 overflow-hidden" style={DOT_BG}>
      <div className="px-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-0.5 h-4 bg-border" />
            <span className="font-mono text-xs font-semibold text-foreground">[{String(1).padStart(2, "0")} / {String(7).padStart(2, "0")}]</span>
            <span className="text-muted-foreground/50 text-xs">·</span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Works With
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-4 mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground m-0 leading-tight text-balance break-words">
              Plugs into your stack
            </h2>
            <span className="text-sm text-muted-foreground font-mono">
              Any MCP-compatible agent — Claude Desktop, Cursor, Windsurf, n8n, Make, and more
            </span>
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

        <div className="overflow-hidden py-1">
          <motion.div 
            className="flex gap-4 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {duped1.map((b, i) => <BrandChip key={`row1-${i}`} {...b}/>)}
          </motion.div>
        </div>

        <div className="overflow-hidden py-1 mt-2">
          <motion.div 
            className="flex gap-4 w-max"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          >
            {duped2.map((b, i) => <BrandChip key={`row2-${i}`} {...b}/>)}
          </motion.div>
        </div>

        <div className="overflow-hidden py-1 mt-2">
          <motion.div 
            className="flex gap-4 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {duped3.map((b, i) => <BrandChip key={`row3-${i}`} {...b}/>)}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SectionMarker({
  index,
  total,
  label,
}: {
  index: number;
  total: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-10">
      <div className="w-0.5 h-4 bg-border" aria-hidden />
      <span className="font-mono text-xs text-foreground font-semibold">
        [{String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}]
      </span>
      <span className="text-muted-foreground/50 text-xs">·</span>
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Neural Flow Animation (unique to MCP) ────────────────────────────────────
// Visualises: Agent → MCP Server → FCE Backend → OTP → Agent (circular)
// Uses an SVG neural/graph topology instead of the linear step approach.

type NodeDef = {
  id: string;
  x: number;
  y: number;
  label: string;
  sub: string;
  badge?: string;
};

const NODES: NodeDef[] = [
  { id: "agent",   x: 0.12, y: 0.5,  label: "AI Agent",    sub: "Claude / GPT / Custom" },
  { id: "mcp",     x: 0.38, y: 0.18, label: "MCP Server",  sub: "fce-mcp-server",   badge: "npx" },
  { id: "fce",     x: 0.62, y: 0.5,  label: "FCE Backend", sub: "Redis pub/sub" },
  { id: "smtp",    x: 0.38, y: 0.82, label: "SMTP Ingest",  sub: "Any email sender" },
  { id: "otp",     x: 0.88, y: 0.5,  label: "OTP Returned", sub: "Structured JSON",       badge: "< 200ms" },
];

const EDGES: { from: string; to: string; label: string; delay: number }[] = [
  { from: "agent", to: "mcp",  label: "create_and_wait_for_otp()",  delay: 0 },
  { from: "mcp",   to: "fce",  label: "long-poll / Redis sub",       delay: 0.6 },
  { from: "smtp",  to: "fce",  label: "SMTP deliver",                delay: 1.2 },
  { from: "fce",   to: "otp",  label: "extract OTP",                 delay: 1.8 },
  { from: "otp",   to: "agent",label: "{ otp, inbox }",              delay: 2.4 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function NeuralFlowAnimation() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: false, margin: "-80px" });
  const [size, setSize] = useState({ w: 700, h: 320 });
  const [activeEdge, setActiveEdge] = useState<number | null>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setSize({ w: e.contentRect.width, h: Math.max(e.contentRect.width * 0.46, 260) });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // auto-cycle through edges
  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const tick = () => {
      setActiveEdge(i % EDGES.length);
      setActiveNode(EDGES[i % EDGES.length].to);
      i++;
    };
    tick();
    const id = setInterval(tick, 900);
    return () => clearInterval(id);
  }, [inView, pulseKey]);

  const px = (nx: number) => nx * size.w;
  const py = (ny: number) => ny * size.h;

  return (
    <div ref={containerRef} className="w-full select-none">
      <div className="relative w-full rounded-lg border border-border overflow-hidden bg-background/80">
        {/* top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/10">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full border border-border" />
            <span className="h-2 w-2 rounded-full border border-border" />
            <span className="h-2 w-2 rounded-full border border-border" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            MCP · Neural Flow
          </span>
          <button
            onClick={() => setPulseKey((k) => k + 1)}
            className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            ↺ restart
          </button>
        </div>

        <svg
          ref={svgRef}
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="block"
        >
          {/* edge paths */}
          {EDGES.map((edge, ei) => {
            const src = NODES.find((n) => n.id === edge.from)!;
            const dst = NODES.find((n) => n.id === edge.to)!;
            const x1 = px(src.x), y1 = py(src.y);
            const x2 = px(dst.x), y2 = py(dst.y);
            const mx = lerp(x1, x2, 0.5);
            const my = lerp(y1, y2, 0.5);
            const d = `M ${x1} ${y1} Q ${mx} ${my - 28} ${x2} ${y2}`;
            const isActive = activeEdge === ei;

            return (
              <g key={edge.from + edge.to}>
                {/* base line */}
                <path d={d} fill="none" stroke="hsl(0 0% 100% / 0.07)" strokeWidth={1.5} />
                {/* active glow */}
                {isActive && (
                  <motion.path
                    key={pulseKey + "-edge-" + ei}
                    d={d}
                    fill="none"
                    stroke="hsl(0 0% 100% / 0.55)"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                )}
                {/* label */}
                {isActive && (
                  <motion.text
                    x={mx}
                    y={my - 34}
                    textAnchor="middle"
                    fill="hsl(0 0% 60%)"
                    fontSize={size.w < 500 ? 7 : 9}
                    fontFamily="monospace"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 0.8 }}
                  >
                    {edge.label}
                  </motion.text>
                )}
              </g>
            );
          })}

          {/* nodes */}
          {NODES.map((node) => {
            const cx = px(node.x);
            const cy = py(node.y);
            const isActive = activeNode === node.id;
            const r = size.w < 500 ? 22 : 28;

            return (
              <g key={node.id} onClick={() => setActiveNode(node.id)} style={{ cursor: "pointer" }}>
                {/* pulse ring */}
                {isActive && (
                  <motion.circle
                    key={pulseKey + "-ring-" + node.id}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="hsl(0 0% 100% / 0.2)"
                    strokeWidth={1}
                    initial={{ r: r, opacity: 0.8 }}
                    animate={{ r: r + 18, opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                )}
                {/* circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={isActive ? "hsl(0 0% 10%)" : "hsl(0 0% 6%)"}
                  stroke={isActive ? "hsl(0 0% 80%)" : "hsl(0 0% 20%)"}
                  strokeWidth={isActive ? 1.5 : 1}
                />
                {/* label */}
                <text
                  x={cx}
                  y={cy - (size.w < 500 ? 3 : 4)}
                  textAnchor="middle"
                  fill={isActive ? "hsl(0 0% 95%)" : "hsl(0 0% 50%)"}
                  fontSize={size.w < 500 ? 7 : 8.5}
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {node.label}
                </text>
                <text
                  x={cx}
                  y={cy + (size.w < 500 ? 7 : 9)}
                  textAnchor="middle"
                  fill="hsl(0 0% 35%)"
                  fontSize={size.w < 500 ? 5.5 : 7}
                  fontFamily="monospace"
                >
                  {node.sub}
                </text>
                {/* badge */}
                {node.badge && (
                  <>
                    <rect
                      x={cx + r - 2}
                      y={cy - r - 10}
                      width={node.badge.length * (size.w < 500 ? 5 : 6) + 8}
                      height={size.w < 500 ? 12 : 14}
                      rx={3}
                      fill="hsl(0 0% 8%)"
                      stroke="hsl(0 0% 25%)"
                      strokeWidth={0.8}
                    />
                    <text
                      x={cx + r + node.badge.length * (size.w < 500 ? 2.5 : 3) + 2}
                      y={cy - r + (size.w < 500 ? 1 : 0)}
                      textAnchor="middle"
                      fill="hsl(0 0% 65%)"
                      fontSize={size.w < 500 ? 5 : 6.5}
                      fontFamily="monospace"
                    >
                      {node.badge}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* live feed */}
        <div className="border-t border-border px-4 py-3 bg-muted/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeEdge}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 shrink-0" />
              <span className="font-mono text-[10px] text-muted-foreground">
                {activeEdge !== null ? EDGES[activeEdge].label : "idle"}
              </span>
              {activeEdge !== null && (
                <span className="ml-auto font-mono text-[10px] text-muted-foreground/40">
                  {EDGES[activeEdge].from} → {EDGES[activeEdge].to}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Tool Cards ───────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "get_latest_email",
    plan: "Growth+",
    cost: "2×",
    desc: "Fetch the latest message from an inbox. Returns sender, subject, body text, OTP, and verification link.",
    args: [{ name: "inbox", type: "string", required: true }],
  },
  {
    name: "extract_otp",
    plan: "Growth+",
    cost: "3×",
    desc: "Directly retrieves the latest 4–6 digit code or verification link from the most recent email.",
    args: [{ name: "inbox", type: "string", required: true }],
  },
  {
    name: "create_and_wait_for_otp",
    plan: "Growth+",
    cost: "5×",
    star: true,
    desc: "Generates a random inbox and holds the connection open until an OTP arrives — complete signup flow in a single tool call.",
    args: [
      { name: "domain", type: "string", required: false },
      { name: "timeout", type: "number (10–60)", required: false },
    ],
  },
];

function ToolCard({ tool }: { tool: (typeof TOOLS)[0] }) {
  return (
    <div
      className={`rounded-lg border bg-background overflow-hidden ${
        tool.star ? "border-foreground/30" : "border-border"
      }`}
    >
      <div
        className={`flex items-start justify-between gap-4 px-5 py-4 border-b ${
          tool.star ? "border-foreground/20 bg-foreground/5" : "border-border bg-muted/5"
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono text-sm text-foreground">{tool.name}</code>
            {tool.star && (
              <span className="font-mono text-[10px] border border-foreground/30 text-foreground/70 rounded px-1.5 py-px">
                🔥 GOLD
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tool.desc}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className="font-mono text-[10px] border border-amber-400/30 text-amber-500 rounded px-1.5 py-px">
            {tool.plan}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/50">{tool.cost} credit</span>
        </div>
      </div>
      <div className="px-5 py-3">
        <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-2">
          Args
        </p>
        <div className="space-y-1">
          {tool.args.map((a) => (
            <div key={a.name} className="flex items-center gap-3">
              <code className="font-mono text-xs text-foreground">{a.name}</code>
              <span className="font-mono text-[10px] text-muted-foreground/50">{a.type}</span>
              {!a.required && (
                <span className="font-mono text-[10px] text-muted-foreground/40 border border-border rounded px-1">
                  optional
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Live Demo: Agent → OTP ────────────────────────────────────────────
const DEMO_STEPS = [
  { id:"call",    label:"Agent calls tool",    ms: 0,    code:`create_and_wait_for_otp({ domain:"ditapi.info", timeout:30 })`, color:"#3b82f6" },
  { id:"inbox",   label:"Inbox provisioned",  ms: 700,  code:`inbox created → test_a8f2@ditapi.info`, color:"#8b5cf6" },
  { id:"waiting", label:"Holding connection", ms: 1400, code:`// Long-poll active… waiting for email`, color:"#f59e0b" },
  { id:"smtp",    label:"Email arrives",       ms: 2800, code:`SMTP RCPT TO:<test_a8f2@ditapi.info>\nSubject: Your verification code is 847291`, color:"#10b981" },
  { id:"parse",   label:"OTP extracted",       ms: 3600, code:`OTP detected: "847291"\nLink: https://acme.com/verify?token=abc123`, color:"#10b981" },
  { id:"return",  label:"Returned to agent",   ms: 4200, code:`{ success:true, otp:"847291",\n  inbox:"test_a8f2@ditapi.info",\n  elapsed_ms: 3241 }`, color:"#22c55e" },
];

function LiveDemoSection() {
  const [running, setRunning] = useState(false);
  const [step,    setStep]    = useState(-1);
  const [done,    setDone]    = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const run = () => {
    if (running) return;
    setRunning(true);
    setStep(-1);
    setDone(false);
    timers.current.forEach(clearTimeout);

    DEMO_STEPS.forEach((s, i) => {
      timers.current.push(
        setTimeout(() => setStep(i), s.ms)
      );
    });
    timers.current.push(
      setTimeout(() => { setDone(true); setRunning(false); }, 4900)
    );
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    setRunning(false); setStep(-1); setDone(false);
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const elapsed = step >= 0 ? DEMO_STEPS[step].ms : 0;

  return (
    <section className="rounded-lg border border-border overflow-hidden bg-background">
      {/* toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/10">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-border" />
          <span className="h-2.5 w-2.5 rounded-full border border-border" />
          <span className="h-2.5 w-2.5 rounded-full border border-border" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          AI Agent Terminal
        </span>
        <span className={`ml-auto font-mono text-[10px] ${running ? "text-amber-500" : done ? "text-emerald-500" : "text-muted-foreground/50"} min-w-[80px] text-right`}>
          {running ? `${(elapsed/1000).toFixed(1)}s elapsed` : done ? "✓ complete" : "ready"}
        </span>
        <button
          onClick={done ? reset : run}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
            done 
              ? "border border-border text-muted-foreground hover:text-foreground" 
              : running 
              ? "bg-foreground text-background"
              : "bg-foreground text-white hover:bg-foreground/90"
          }`}
          disabled={running}
        >
          {done ? <><RotateCcw className="h-3 w-3" /> reset</> : running ? "running…" : <><Play className="h-3 w-3" /> run demo</>}
        </button>
      </div>

      {/* steps pane */}
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] min-h-[280px] sm:min-h-[340px]">
        {/* left: step list */}
        <div className="border-b sm:border-b-0 sm:border-r border-border p-3 sm:p-4 space-y-1">
          {DEMO_STEPS.map((s, i) => {
            const active  = step === i;
            const past    = step >  i;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-2.5 py-2 px-3 rounded-md transition-all ${
                  active ? "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500" : ""
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  past ? "bg-emerald-500" : active ? "" : "bg-border"
                }`} style={active ? { background: s.color, border: `1px solid ${s.color}` } : {}}/>
                <span className={`font-mono text-[10px] leading-tight truncate ${
                  active ? "text-foreground font-medium" : past ? "text-muted-foreground" : "text-muted-foreground/50"
                }`}>
                  {s.label}
                  {active && <span className="caret ml-1" />}
                </span>
                {past && <Check className="h-3 w-3 text-emerald-500 ml-auto flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* right: code output */}
        <div className="p-4 sm:p-6 font-mono text-sm">
          <AnimatePresence mode="wait">
            {step >= 0 ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: DEMO_STEPS[step].color }}>
                  {DEMO_STEPS[step].label}
                </p>
                <pre className="text-xs leading-relaxed p-3 sm:p-4 rounded-lg border border-border bg-muted/5 overflow-x-auto whitespace-pre-wrap break-all">
                  {DEMO_STEPS[step].code}
                </pre>

                {/* return value badge */}
                {step === DEMO_STEPS.length-1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center gap-3 flex-wrap"
                  >
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">
                      OTP returned: <code className="font-mono text-sm">847291</code>
                    </span>
                    <span className="ml-auto text-xs text-emerald-600/70">3241 ms</span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full gap-3 py-12"
              >
                <Terminal className="h-7 w-7 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground font-mono">
                  Press run demo to simulate the agent flow
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// ─── Plan Table ───────────────────────────────────────────────────────────────

const PLAN_ROWS = [
  { name: "Free",       mcp: false, ops: 0,   sessions: 0  },
  { name: "Developer",  mcp: false, ops: 0,   sessions: 0  },
  { name: "Startup",    mcp: false, ops: 0,   sessions: 0  },
  { name: "Growth",     mcp: true,  ops: 60,  sessions: 5  },
  { name: "Enterprise", mcp: true,  ops: 200, sessions: 10 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MCPClient() {
  const T = 8;

  return (
    <div className="bg-background text-foreground overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 py-28 text-center" style={DOT_BG}>
        <AsciiLayer />
        <Cols />

        <div className="relative z-10 max-w-3xl w-full">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <SectionMarker index={1} total={T} label="MCP" />
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight text-foreground leading-[1.1] mb-5 text-balance break-words"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
            Model Context Protocol<br />for email automation
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}>
            An AI-native email interface. No polling, no parsing, no wiring. Give your agent an intent — get back an OTP in under 3 seconds.
          </motion.p>

          <motion.div className="flex flex-wrap items-center justify-center gap-3 mb-12"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}>
            <Button asChild size="lg">
              <Link href="/api/pricing">Get Growth access</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/api/docs/mcp">Read the docs</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="relative z-10">
        {/* ── WORKS WITH ────────────────────────────────────────────────────── */}
        <WorksWithSection />

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <AsciiLayer />
        <Cols />
        <div className="relative z-10 max-w-3xl w-full mx-auto">
          <FadeIn>
            <SectionMarker index={2} total={T} label="How it works" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight text-balance break-words">
              From intent to OTP<br />in a single tool call
            </h2>
            <p className="text-sm text-muted-foreground mb-10 max-w-lg leading-relaxed">
              Your AI agent calls create_and_wait_for_otp(). The MCP server holds a long-poll connection, watches for incoming email via Redis pub/sub, extracts the verification code, and returns it — no callbacks, no webhooks, no polling loops.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <NeuralFlowAnimation />
          </FadeIn>
        </div>
      </section>

      <ApiStats />

      <UseCasesSection surface="mcp" sectionIndex={3} sectionTotal={T} />

      {/* ── WHY MCP — USE CASES ────────────────────────────────────────────── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <AsciiLayer />
        <Cols />
        <div className="relative z-10 max-w-5xl w-full mx-auto">
          <FadeIn>
            <SectionMarker index={4} total={T} label="Why MCP" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight text-balance break-words">
              Three tools.<br />Every workflow covered.
            </h2>
            <p className="text-sm text-muted-foreground mb-12 max-w-xl leading-relaxed">
              MCP tools expose email operations as first-class primitives. No REST endpoints, no webhook glue code — just intent-driven function calls that your agent can use directly.
            </p>
          </FadeIn>

          <div className="grid gap-px bg-border sm:grid-cols-3 rounded-lg overflow-hidden mb-12">
            {[
              {
                icon: <Bot className="h-4 w-4" />,
                title: "Agent-native signup testing",
                desc: "Tell Claude to register on any site and extract the OTP. No boilerplate — just intent. The agent handles the entire flow from form submission to email verification.",
                code: `await claude.runTask(\n  "Register on acme.com and verify email"\n)`,
              },
              {
                icon: <Cpu className="h-4 w-4" />,
                title: "CI / CD pipeline auth",
                desc: "Your test suite needs a fresh inbox per run. One MCP call provisions it and waits for the verification email. No more flaky tests from race conditions.",
                code: `const { otp } = await mcp.create_and_wait_for_otp({\n  timeout: 30\n})`,
              },
              {
                icon: <Layers className="h-4 w-4" />,
                title: "Multi-agent orchestration",
                desc: "Nest MCP calls inside larger agent graphs (LangGraph, AutoGen). Each sub-agent gets its own isolated inbox for parallel operations.",
                code: `// LangGraph node\nexport const verifyEmail = tool(\n  mcp.extract_otp\n)`,
              },
            ].map((card, i) => (
              <FadeIn key={card.title} delay={i * 0.07}>
                <div className="bg-background px-6 py-8 h-full flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-foreground">
                    {card.icon}
                    <p className="text-sm font-semibold">{card.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{card.desc}</p>
                  <pre className="font-mono text-[10px] text-muted-foreground/60 leading-relaxed overflow-x-auto border border-border rounded p-2 bg-muted/5">
                    {card.code}
                  </pre>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Neural flow */}
          <FadeIn delay={0.1}>
            <NeuralFlowAnimation />
          </FadeIn>
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <AsciiLayer />
        <Cols />
        <div className="relative z-10 max-w-5xl w-full mx-auto">
          <FadeIn>
            <SectionMarker index={5} total={T} label="Tools" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight text-balance break-words">
              Three tools.<br />Infinite workflows.
            </h2>
            <p className="text-sm text-muted-foreground mb-10 max-w-xl leading-relaxed">
              MCP tools expose email operations as first-class primitives. Each tool is designed for specific email automation tasks — from quick checks to complete signup flows.
            </p>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3 mb-8">
            {TOOLS.map((tool, i) => (
              <FadeIn key={tool.name} delay={i * 0.08}>
                <ToolCard tool={tool} />
              </FadeIn>
            ))}
          </div>

          {/* Billing note */}
          <FadeIn delay={0.2}>
            <div className="rounded-lg border border-border bg-muted/5 px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-2">
                Credit multipliers
              </p>
              <div className="flex flex-wrap gap-6">
                {[
                  { op: "get_latest_email", mult: "2×" },
                  { op: "extract_otp", mult: "3×" },
                  { op: "create_and_wait_for_otp", mult: "5×" },
                ].map((r) => (
                  <div key={r.op} className="flex items-baseline gap-2">
                    <code className="font-mono text-xs text-foreground">{r.op}</code>
                    <span className="font-mono text-xs text-muted-foreground/60">{r.mult}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

        {/* ── PLAN TABLE ── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <AsciiLayer />
        <Cols />
        <div className="relative z-10 max-w-3xl w-full mx-auto">
          <FadeIn>
            <SectionMarker index={6} total={T} label="Plans" />
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/10">
                    {["Plan", "MCP Access", "Ops / min", "Concurrent sessions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLAN_ROWS.map((row, i) => (
                    <tr key={row.name} className={`border-b border-border last:border-0 ${row.mcp ? "bg-foreground/[0.02]" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{row.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.mcp ? (
                          <span className="text-foreground">✓ Included</span>
                        ) : (
                          <span className="text-muted-foreground/40">✗ Blocked</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.ops || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.sessions || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

        {/* ── LIVE DEMO ── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <AsciiLayer />
        <Cols />
        <div className="relative z-10 max-w-3xl w-full mx-auto">
          <FadeIn>
            <SectionMarker index={6} total={T} label="Demo" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight text-balance break-words">
              See it in action
            </h2>
            <p className="text-sm text-muted-foreground mb-10 max-w-lg leading-relaxed">
              Watch create_and_wait_for_otp() run end-to-end. The demo simulates an AI agent calling the MCP tool, waiting for email delivery, extracting the OTP, and returning the result.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <LiveDemoSection />
          </FadeIn>
        </div>
      </section>

      {/* ── SETUP ── */}
      <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
        <AsciiLayer />
        <Cols />
        <div className="relative z-10 max-w-3xl w-full mx-auto">
          <FadeIn>
            <SectionMarker index={7} total={T} label="Setup" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight text-balance break-words">
              Attach to any MCP client
            </h2>
            <p className="text-sm text-muted-foreground mb-10 max-w-xl leading-relaxed">
              Add the server to Claude Desktop, Cursor, or any MCP-compatible agent framework via <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded font-mono">npx</code>. Takes less than 30 seconds to configure.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <CodeBlock
              language="json"
              code={`{
  "mcpServers": {
    "fce-mcp": {
      "command": "npx",
      "args": ["-y", "fce-mcp-server"],
      "env": {
        "FCE_API_KEY": "your_growth_or_enterprise_api_key"
      }
    }
  }
}`}
              />
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Claude Desktop</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Paste the config into <code className="text-[10px] bg-muted/40 px-1 rounded">claude_desktop_config.json</code>. Restart Claude.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Cursor & Windsurf</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Add the <code className="text-[10px] bg-muted/40 px-1 rounded">npx</code> command in the MCP Servers UI or <code className="text-[10px] bg-muted/40 px-1 rounded">mcp_config.json</code>.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Kilo CLI</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Add to your <code className="text-[10px] bg-muted/40 px-1 rounded">kilo.json</code> under the <code className="text-[10px] bg-muted/40 px-1 rounded">mcp</code> section.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Custom Agent</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use any SDK (Python <code className="text-[10px] bg-muted/40 px-1 rounded">mcp</code>, JS <code className="text-[10px] bg-muted/40 px-1 rounded">@modelcontextprotocol/sdk</code>) to connect.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── CLOUD SSE ── */}
        <section className="relative border-t border-border px-6 py-24" style={DOT_BG}>
          <AsciiLayer />
          <Cols />
          <div className="relative z-10 max-w-3xl w-full mx-auto">
            <FadeIn>
              <SectionMarker index={8} total={T} label="Cloud SSE" />
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight text-balance break-words">
                Cloud-based AI agents? No problem.
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-xl leading-relaxed">
                For cloud-based AI platforms that cannot run local commands (Claude Web, OpenAI Playground, Replit Agent), we provide a hosted SSE endpoint with OAuth 2.0 support.
              </p>
            </FadeIn>
            
            <FadeIn delay={0.1}>
              <div className="rounded-lg border border-border bg-muted/5 p-4 mb-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Base URL</p>
                <code className="text-sm text-foreground break-all">https://mcp.freecustom.email</code>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="rounded-lg border border-border overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      {["Endpoint", "Method", "Description"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ep: "/sse", method: "GET", desc: "Establish SSE connection" },
                      { ep: "/messages", method: "POST", desc: "Send JSON-RPC messages" },
                      { ep: "/authorize", method: "GET", desc: "OAuth authorization" },
                      { ep: "/token", method: "POST", desc: "OAuth token exchange" },
                    ].map((r) => (
                      <tr key={r.ep} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.ep}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.method}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-5 py-4">
                <h4 className="text-blue-500 font-semibold mb-2 text-sm">Two Auth Methods</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li><strong>Direct API Key</strong>: Pass via <code className="text-xs bg-muted px-1 rounded">Authorization</code> header or <code className="text-xs bg-muted px-1 rounded">access_token</code> query param</li>
                  <li><strong>OAuth 2.0</strong>: For clients like Claude Web — use your API key as <code className="text-xs bg-muted px-1 rounded">client_id</code></li>
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={0.25}>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-5 py-4 mt-4">
                <h4 className="text-blue-500 font-semibold mb-2 text-sm">Quick Start for Claude Web</h4>
                <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                  <li>Open Claude Web (claude.ai) → Settings → Integrations → Add Custom Connector</li>
                  <li>Name: <code className="text-xs bg-muted px-1 rounded">FreeCustom.Email MCP</code></li>
                  <li>URL: <code className="text-xs bg-muted px-1 rounded">https://mcp.freecustom.email/sse</code></li>
                  <li>Auth: Your FreeCustom.Email API key as OAuth Client ID</li>
                </ol>
              </div>
            </FadeIn>
          </div>
        </section>
      </div>
    </div>
  );
}