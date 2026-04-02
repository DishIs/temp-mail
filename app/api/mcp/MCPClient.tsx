"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, Zap, ArrowRight, Cpu, Layers, GitBranch } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { ApiStats } from "@/components/ApiStats";
import { UseCasesSection } from "@/components/UseCasesSection";

// ─── shared ──────────────────────────────────────────────────────────────────

const DOT_BG = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

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
  { id: "mcp",     x: 0.38, y: 0.18, label: "MCP Server",  sub: "maildrop-mcp-server",   badge: "npx" },
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
  const T = 5;

  return (
    <div className="bg-background text-foreground" style={DOT_BG}>
      <div className="fixed inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" />
      <div className="fixed inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── HERO ── */}
        <div className="py-16 lg:py-24">
          <FadeIn>
            <SectionMarker index={1} total={T} label="MCP" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground mt-4 mb-4">
              Model Context Protocol
            </h1>
            <p className="max-w-xl text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">
              An AI-native email interface. No polling, no parsing, no wiring. Give your agent an intent — get back an OTP.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm">
                <Link href="/api/pricing">Get Growth access</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/api/docs/mcp">Read the docs</Link>
              </Button>
            </div>
          </FadeIn>
        </div>

        <ApiStats />

        <UseCasesSection surface="mcp" sectionIndex={2} sectionTotal={T+1} />

        {/* ── WHY MCP — USE CASES ── */}
        <div className="py-16 lg:py-20 border-t border-border">
          <SectionMarker index={3} total={T+1} label="Why MCP" />
          <div className="grid gap-px bg-border sm:grid-cols-3 rounded-lg overflow-hidden mb-12">
            {[
              {
                icon: <Bot className="h-4 w-4" />,
                title: "Agent-native signup testing",
                desc: "Tell Claude to register on any site and extract the OTP. No boilerplate — just intent.",
                code: `await claude.runTask(\n  "Register on acme.com and verify email"\n)`,
              },
              {
                icon: <Cpu className="h-4 w-4" />,
                title: "CI / CD pipeline auth",
                desc: "Your test suite needs a fresh inbox per run. One MCP call provisions it and waits.",
                code: `const { otp } = await mcp.create_and_wait_for_otp({\n  timeout: 30\n})`,
              },
              {
                icon: <Layers className="h-4 w-4" />,
                title: "Multi-agent orchestration",
                desc: "Nest MCP calls inside larger agent graphs. Each sub-agent gets its own isolated inbox.",
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

        {/* ── TOOLS ── */}
        <div className="py-16 lg:py-20 border-t border-border">
          <SectionMarker index={3} total={T} label="Tools" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-8">
            Three tools. Infinite workflows.
          </h2>
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
            {TOOLS.map((tool, i) => (
              <FadeIn key={tool.name} delay={i * 0.08}>
                <ToolCard tool={tool} />
              </FadeIn>
            ))}
          </div>

          {/* Billing note */}
          <FadeIn delay={0.2}>
            <div className="mt-6 rounded-lg border border-border bg-muted/5 px-5 py-4">
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

        {/* ── PLAN TABLE ── */}
        <div className="py-16 lg:py-20 border-t border-border">
          <SectionMarker index={4} total={T} label="Plans" />
          <FadeIn>
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

        {/* ── SETUP ── */}
        <div className="py-16 lg:py-20 border-t border-border">
          <SectionMarker index={5} total={T} label="Setup" />
          <div className="max-w-3xl">
            <FadeIn>
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
                Attach to any MCP client
              </h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                Add the server to Claude Desktop, Cursor, or any MCP-compatible agent framework via <code className="text-xs bg-muted/40 px-1 py-0.5 rounded">npx</code>.
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <CodeBlock
                language="json"
                code={`{
  "mcpServers": {
    "fce-mcp": {
      "command": "npx",
      "args": ["-y", "maildrop-mcp-server"],
      "env": {
        "FCE_API_KEY": "your_growth_or_enterprise_api_key"
      }
    }
  }
}`}
              />
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Claude Desktop</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Paste the config into <code className="text-[10px] bg-muted/40 px-1 rounded">claude_desktop_config.json</code>. Restart Claude. The tools appear automatically.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Custom Agent</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use any MCP SDK (Python <code className="text-[10px] bg-muted/40 px-1 rounded">mcp</code>, JS <code className="text-[10px] bg-muted/40 px-1 rounded">@modelcontextprotocol/sdk</code>) to connect programmatically.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="mt-8 flex gap-3">
                <Button asChild size="sm">
                  <Link href="/api/docs/mcp">Full MCP docs</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/use-cases/ai-agents">AI agent use cases <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
}