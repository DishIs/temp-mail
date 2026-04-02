"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Bot, FlaskConical, Globe, Shield, Layers, Zap, GitBranch, Terminal, ArrowRight
} from "lucide-react";

const DOT_BG = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

function SectionMarker({ index, total, label }: { index: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      <div className="w-0.5 h-4 bg-border" aria-hidden />
      <span className="font-mono text-xs text-foreground font-semibold">
        [{String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}]
      </span>
      <span className="text-muted-foreground/50 text-xs">·</span>
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

const USE_CASES = [
  {
    slug: "playwright-selenium",
    icon: <Globe className="h-5 w-5" />,
    title: "Playwright & Selenium",
    desc: "Automate signup and OTP verification flows in end-to-end tests using disposable inboxes.",
    tags: ["E2E", "Browser", "QA"],
    difficulty: "Beginner",
  },
  {
    slug: "ai-agents",
    icon: <Bot className="h-5 w-5" />,
    title: "AI Agent Integration",
    desc: "Give Claude, GPT, or any LLM agent the ability to sign up for services and verify emails autonomously.",
    tags: ["MCP", "Claude", "LangChain"],
    difficulty: "Intermediate",
  },
  {
    slug: "ci-cd-pipelines",
    icon: <GitBranch className="h-5 w-5" />,
    title: "CI / CD Pipelines",
    desc: "Provision a fresh inbox per test run in GitHub Actions, GitLab CI, or CircleCI.",
    tags: ["GitHub Actions", "GitLab", "CircleCI"],
    difficulty: "Beginner",
  },
  {
    slug: "otp-extraction",
    icon: <Zap className="h-5 w-5" />,
    title: "OTP Extraction",
    desc: "Parse verification codes from any email programmatically — no regex, no brittle patterns.",
    tags: ["API", "Automation"],
    difficulty: "Beginner",
  },
  {
    slug: "multi-account-testing",
    icon: <Layers className="h-5 w-5" />,
    title: "Multi-Account Testing",
    desc: "Spin up hundreds of isolated inboxes to test user flows across different account states.",
    tags: ["Scale", "Isolation"],
    difficulty: "Intermediate",
  },
  {
    slug: "security-testing",
    icon: <Shield className="h-5 w-5" />,
    title: "Security & Penetration Testing",
    desc: "Use disposable inboxes in controlled security assessments to test auth flows and email handling.",
    tags: ["Security", "Auth"],
    difficulty: "Advanced",
  },
];

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "border-border text-muted-foreground",
  Intermediate: "border-border text-muted-foreground",
  Advanced: "border-border text-muted-foreground",
};

export default function UseCasesPage() {
  return (
    <div className="bg-background text-foreground min-h-screen" style={DOT_BG}>
      <div className="fixed inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" />
      <div className="fixed inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/50 pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">

        {/* Hero */}
        <FadeIn>
          <SectionMarker index={1} total={2} label="Use Cases" />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground mt-4 mb-4">
            Real-world workflows
          </h1>
          <p className="max-w-xl text-muted-foreground text-base sm:text-lg leading-relaxed mb-12">
            Step-by-step guides for integrating disposable email into your stack — from browser automation and CI pipelines to AI agents.
          </p>
        </FadeIn>

        {/* Grid */}
        <FadeIn delay={0.1}>
          <SectionMarker index={2} total={2} label="All Use Cases" />
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 rounded-lg overflow-hidden">
            {USE_CASES.map((uc, i) => (
              <FadeIn key={uc.slug} delay={i * 0.06}>
                <Link
                  href={`/api/use-cases/${uc.slug}`}
                  className="group flex flex-col bg-background px-6 py-8 h-full hover:bg-muted/10 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {uc.icon}
                    </div>
                    <span className={`font-mono text-[9px] uppercase tracking-wider border rounded px-1.5 py-px ${DIFFICULTY_STYLES[uc.difficulty]}`}>
                      {uc.difficulty}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-2">{uc.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{uc.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {uc.tags.map((tag) => (
                      <span key={tag} className="font-mono text-[10px] border border-border rounded px-1.5 py-px text-muted-foreground/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50 group-hover:text-foreground transition-colors">
                    View guide <ArrowRight className="h-2.5 w-2.5 ml-1" />
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}