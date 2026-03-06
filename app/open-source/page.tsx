// app/open-source/page.tsx
"use client";

import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { CheckCircle2, XCircle } from "lucide-react";

const REPOS = [
  {
    name: "fce-backend",
    fullName: "DishIs/fce-backend",
    url: "https://github.com/DishIs/fce-backend",
    label: "Backend · Maildrop",
    description:
      "The core engine powering FreeCustom.Email. A multi-service Node.js + TypeScript application that handles everything from receiving emails via a custom Haraka SMTP server to managing user accounts, real-time WebSocket updates, and API requests.",
    license: "Apache-2.0",
    stars: 3,
    language: "TypeScript",
    stack: ["Node.js", "TypeScript", "Docker", "Haraka SMTP", "MongoDB", "Redis", "WebSockets"],
    highlights: [
      "High-performance smtp-fast engine",
      "Microservices architecture",
      "Docker Compose one-command deploy",
      "Public REST API at /api/playground",
    ],
  },
  {
    name: "fce-frontend",
    fullName: "DishIs/fce-frontend",
    url: "https://github.com/DishIs/fce-frontend",
    label: "Frontend · UI",
    description:
      "The open-source Next.js frontend powering FreeCustom.Email's UI. Blazing fast, fully ad-free, and built to score near-perfect on PageSpeed. Plug it into our public API or your own self-hosted backend.",
    license: "MIT",
    stars: null,
    language: "TypeScript",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "NextAuth.js", "React"],
    highlights: [
      "95–100 PageSpeed score out of the box",
      "Zero ads, zero trackers",
      "Connect to public API or self-host",
      "Fully customisable branding & themes",
    ],
  },
];

const COMPARISON = [
  {
    feature: "Fully Open Source",
    fce: true,
    mailinator: false,
    guerrilla: false,
    tempMailOrg: false,
    note: "Both our frontend & backend are public on GitHub.",
  },
  {
    feature: "Zero Ads",
    fce: true,
    mailinator: false,
    guerrilla: false,
    tempMailOrg: false,
    note: "No ad networks, no tracking pixels for advertising.",
  },
  {
    feature: "No User Tracking",
    fce: true,
    mailinator: false,
    guerrilla: false,
    tempMailOrg: false,
    note: "We collect only aggregate, non-identifiable analytics.",
  },
  {
    feature: "No Data Selling",
    fce: true,
    mailinator: false,
    guerrilla: "unknown",
    tempMailOrg: false,
    note: "We explicitly do not sell personal information (CCPA compliant).",
  },
  {
    feature: "Self-Hostable",
    fce: true,
    mailinator: false,
    guerrilla: false,
    tempMailOrg: false,
    note: "Deploy your own instance with Docker Compose.",
  },
  {
    feature: "Public REST API",
    fce: true,
    mailinator: true,
    guerrilla: false,
    tempMailOrg: true,
    note: "Available at freecustom.email/api and /api/playground.",
  },
  {
    feature: "Custom Inbox Names",
    fce: true,
    mailinator: true,
    guerrilla: false,
    tempMailOrg: false,
    note: "Pick your own inbox name, no random strings.",
  },
  {
    feature: "Real-Time Updates",
    fce: true,
    mailinator: false,
    guerrilla: false,
    tempMailOrg: false,
    note: "WebSocket-powered live inbox — no manual refresh.",
  },
];

function CheckCell({ value }: { value: boolean | "unknown" }) {
  if (value === true) return <CheckCircle2 className="w-4 h-4 text-foreground mx-auto" />;
  if (value === "unknown") return <span className="text-muted-foreground text-xs block text-center">?</span>;
  return <span className="w-4 h-4 block mx-auto rounded-full border border-border" />;
}

export default function OpenSourcePage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />

        <div className="max-w-2xl mx-auto py-20 px-6">

          {/* Header */}
          <div className="mb-16">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Open Source
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-5">
              Open Source
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
              FreeCustom.Email is built entirely in the open. Both our frontend
              and backend are publicly available on GitHub — inspect every line,
              contribute, or self-host your own instance.
            </p>
            <div className="flex flex-wrap gap-4 mt-6 text-xs text-muted-foreground">
              <span>100% Open Core</span>
              <span className="text-border">·</span>
              <span>Privacy-First</span>
              <span className="text-border">·</span>
              <span>Community Driven</span>
            </div>
          </div>

          <div className="space-y-16">

            {/* Repositories */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                01 — Our Repositories
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Two repositories. One complete, privacy-respecting temp mail
                stack — no private code hiding behind the curtain.
              </p>

              <div className="space-y-0">
                {REPOS.map((repo, i) => (
                  <div key={repo.name} className="border-t border-border py-8 last:pb-0">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{repo.label}</p>
                        <h3 className="text-sm font-medium text-foreground font-mono">{repo.fullName}</h3>
                      </div>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-border hover:decoration-foreground"
                      >
                        GitHub <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                      {repo.description}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-5">
                      <span>{repo.language}</span>
                      <span className="text-border">·</span>
                      <span>{repo.license}</span>
                      {repo.stars !== null && (
                        <>
                          <span className="text-border">·</span>
                          <span>{repo.stars} stars</span>
                        </>
                      )}
                    </div>

                    <div className="mb-5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Stack</p>
                      <p className="text-xs text-muted-foreground">{repo.stack.join(" · ")}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Highlights</p>
                      <div className="space-y-1">
                        {repo.highlights.map((h) => (
                          <p key={h} className="text-xs text-muted-foreground">{h}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Comparison */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                02 — How We Compare
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                Most temp mail services treat privacy as an afterthought — or
                worse, as a product to monetise. Here's how FreeCustom.Email
                stacks up against the most popular alternatives.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left pb-3 pr-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Feature</th>
                      <th className="text-center pb-3 px-3 text-xs font-medium uppercase tracking-widest text-foreground min-w-[60px]">FCE</th>
                      <th className="text-center pb-3 px-3 text-xs font-medium uppercase tracking-widest text-muted-foreground min-w-[60px]">Mailinator</th>
                      <th className="text-center pb-3 px-3 text-xs font-medium uppercase tracking-widest text-muted-foreground min-w-[60px]">Guerrilla</th>
                      <th className="text-center pb-3 px-3 text-xs font-medium uppercase tracking-widest text-muted-foreground min-w-[60px]">temp-mail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row) => (
                      <tr key={row.feature} className="border-b border-border last:border-0">
                        <td className="py-4 pr-4 align-top">
                          <p className="text-sm text-foreground font-medium">{row.feature}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{row.note}</p>
                        </td>
                        <td className="py-4 px-3 align-middle"><CheckCell value={row.fce} /></td>
                        <td className="py-4 px-3 align-middle"><CheckCell value={row.mailinator} /></td>
                        <td className="py-4 px-3 align-middle"><CheckCell value={row.guerrilla} /></td>
                        <td className="py-4 px-3 align-middle"><CheckCell value={row.tempMailOrg} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Competitor data is based on publicly available information and our best assessment at the time of writing. Features may change — always verify with each provider directly.
              </p>
            </section>

            <div className="border-t border-border" />

            {/* Why Open Source */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
                03 — Why We're Open Source
              </h2>
              <div className="space-y-0">
                {[
                  {
                    title: "Radical Transparency",
                    body: "When we say we don't track you, sell your data, or show ads — you can verify it. Every claim in our privacy policy is backed by public code.",
                  },
                  {
                    title: "Community Trust",
                    body: "Open source builds real accountability. Security researchers, developers, and users can audit, flag issues, and contribute improvements.",
                  },
                  {
                    title: "Self-Hostable",
                    body: "Don't trust any third-party with your data? Run your own instance. Our Docker Compose setup makes it straightforward to deploy on your own infrastructure.",
                  },
                ].map((card) => (
                  <div key={card.title} className="border-t border-border py-6 last:pb-0">
                    <p className="text-sm font-medium text-foreground mb-2">{card.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-border" />

            {/* Contributing CTA */}
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
                Want to contribute?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Bug reports, pull requests, and ideas are all welcome. Check the
                contributing guide in each repository to get started.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/DishIs/fce-backend" target="_blank" rel="noopener noreferrer" className="gap-2">
                    Backend Repo <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/DishIs/fce-frontend" target="_blank" rel="noopener noreferrer" className="gap-2">
                    Frontend Repo <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}