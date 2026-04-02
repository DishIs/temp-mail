"use client";

// UseCasesSection.tsx
// Drop this into the API, CLI, and MCP landing pages as a section.
// Props let you filter which use cases are highlighted for each surface.

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Globe, Bot, GitBranch, Zap, Layers, Shield } from "lucide-react";

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

const ALL_USE_CASES = [
  {
    slug: "playwright-selenium",
    icon: <Globe className="h-4 w-4" />,
    title: "Playwright & Selenium",
    desc: "Automate signup + OTP verification flows in E2E tests without shared accounts or flaky state.",
    snippet: `const inbox = await createInbox("pw-test");
const otp = await waitForOtp(inbox);
await page.fill('[name="otp"]', otp);`,
    tags: ["E2E", "QA"],
    surface: ["api", "cli"],
  },
  {
    slug: "ai-agents",
    icon: <Bot className="h-4 w-4" />,
    title: "AI Agent Integration",
    desc: "Give Claude or any LLM agent the ability to sign up for services and verify emails autonomously via MCP.",
    snippet: `// Claude Desktop — one config line
"fce-mcp": { "command": "npx", 
  "args": ["-y", "fce-mcp-server"] }`,
    tags: ["MCP", "Claude"],
    surface: ["api", "mcp"],
  },
  {
    slug: "ci-cd-pipelines",
    icon: <GitBranch className="h-4 w-4" />,
    title: "CI / CD Pipelines",
    desc: "Provision a fresh isolated inbox per test run in GitHub Actions, GitLab CI, or CircleCI.",
    snippet: `# .github/workflows/e2e.yml
env:
  FCE_API_KEY: \${{ secrets.FCE_API_KEY }}`,
    tags: ["GitHub Actions", "CI"],
    surface: ["api", "cli"],
  },
  {
    slug: "otp-extraction",
    icon: <Zap className="h-4 w-4" />,
    title: "OTP Extraction",
    desc: "Extract 4–8 digit codes and verification links from any email — no regex, no maintenance.",
    snippet: `const otp = await client.otp.waitFor(inbox);
// "847291"`,
    tags: ["API", "SDK"],
    surface: ["api", "mcp"],
  },
  {
    slug: "multi-account-testing",
    icon: <Layers className="h-4 w-4" />,
    title: "Multi-Account Testing",
    desc: "Spin up hundreds of isolated inboxes to test user flows across different account states.",
    snippet: `const inboxes = await Promise.all(
  Array.from({length: 50}, (_, i) =>
    createInbox(\`user-\${i}\`)));`,
    tags: ["Scale", "Parallel"],
    surface: ["api", "cli"],
  },
];

interface Props {
  surface: "api" | "cli" | "mcp";
  sectionIndex: number;
  sectionTotal: number;
}

export function UseCasesSection({ surface, sectionIndex, sectionTotal }: Props) {
  const filtered = ALL_USE_CASES.filter((uc) => uc.surface.includes(surface)).slice(0, 4);

  return (
    <section className="relative border-t border-border px-6 py-16 lg:py-24">
      <div className="relative z-10 max-w-5xl w-full mx-auto">
        <SectionMarker index={sectionIndex} total={sectionTotal} label="Use Cases" />
        <FadeIn>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2 text-balance">
                Built for real workflows
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Step-by-step guides for the most common disposable email patterns.
              </p>
            </div>
            <Link
              href="/api/use-cases"
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1"
            >
              All use cases <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </FadeIn>

        <div className="grid gap-px bg-border sm:grid-cols-2 rounded-lg overflow-hidden">
          {filtered.map((uc, i) => (
            <FadeIn key={uc.slug} delay={i * 0.07}>
              <Link
                href={`/api/use-cases/${uc.slug}`}
                className="group flex flex-col bg-background px-6 py-8 h-full hover:bg-muted/10 transition-colors duration-200"
              >
                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors mb-3">
                  {uc.icon}
                  <p className="text-sm font-semibold text-foreground">{uc.title}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{uc.desc}</p>
                <pre className="font-mono text-[10px] text-muted-foreground/60 leading-relaxed overflow-x-auto border border-border rounded p-2.5 bg-muted/5 mb-4 whitespace-pre-wrap">
                  {uc.snippet}
                </pre>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-1.5 flex-wrap">
                    {uc.tags.map((tag) => (
                      <span key={tag} className="font-mono text-[9px] border border-border rounded px-1.5 py-px text-muted-foreground/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40 group-hover:text-foreground transition-colors flex items-center gap-1">
                    Guide <ArrowRight className="h-2.5 w-2.5" />
                  </span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}