// app/open-source/page.tsx
"use client";

import {
  Github,
  Code2,
  Server,
  Globe,
  Shield,
  Star,
  GitFork,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Lock,
  Eye,
  Zap,
  Package,
  Terminal,
  FileCode,
  Heart,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/nLHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { useSession } from "next-auth/react";
import Link from "next/link";

const REPOS = [
  {
    name: "fce-backend",
    fullName: "DishIs/fce-backend",
    url: "https://github.com/DishIs/fce-backend",
    label: "Backend · Maildrop",
    icon: <Server className="w-5 h-5" />,
    color: "text-orange-500",
    badgeColor: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
    borderColor: "border-orange-500/20",
    bgColor: "bg-orange-50/50 dark:bg-orange-950/10",
    description:
      "The core engine powering FreeCustom.Email. A multi-service Node.js + TypeScript application that handles everything from receiving emails via a custom Haraka SMTP server to managing user accounts, real-time WebSocket updates, and API requests.",
    license: "Apache-2.0",
    stars: 3,
    language: "TypeScript",
    stack: ["Node.js", "TypeScript", "Docker", "Haraka SMTP", "MongoDB", "Redis", "WebSockets"],
    highlights: [
      { icon: <Zap className="w-4 h-4" />, label: "High-performance smtp-fast engine" },
      { icon: <Package className="w-4 h-4" />, label: "Microservices architecture" },
      { icon: <Terminal className="w-4 h-4" />, label: "Docker Compose one-command deploy" },
      { icon: <Globe className="w-4 h-4" />, label: "Public REST API at /api/playground" },
    ],
    // Suggested GitHub metadata
    suggestedAbout:
      "Open-source disposable email backend for FreeCustom.Email — Haraka SMTP, Redis, MongoDB, Docker. Self-hostable & privacy-first.",
    suggestedTags: [
      "open-source", "fce-frontend", "disposable-email", "haraka", "smtp",
      "nodejs", "typescript", "docker", "redis", "mongodb", "fce-frontend-api",
      "fce-frontend-generator", "privacy", "self-hosted",
    ],
  },
  {
    name: "fce-frontend",
    fullName: "DishIs/fce-frontend",
    url: "https://github.com/DishIs/fce-frontend",
    label: "Frontend · UI",
    icon: <FileCode className="w-5 h-5" />,
    color: "text-blue-500",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    borderColor: "border-blue-500/20",
    bgColor: "bg-blue-50/50 dark:bg-blue-950/10",
    description:
      "The open-source Next.js frontend powering FreeCustom.Email's UI. Blazing fast, fully ad-free, and built to score near-perfect on PageSpeed. Plug it into our public API or your own self-hosted backend.",
    license: "MIT",
    stars: null,
    language: "TypeScript",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "NextAuth.js", "React"],
    highlights: [
      { icon: <Zap className="w-4 h-4" />, label: "95–100 PageSpeed score out of the box" },
      { icon: <Shield className="w-4 h-4" />, label: "Zero ads, zero trackers" },
      { icon: <Globe className="w-4 h-4" />, label: "Connect to public API or self-host" },
      { icon: <Code2 className="w-4 h-4" />, label: "Fully customisable branding & themes" },
    ],
    suggestedAbout:
      "Open-source Next.js frontend for FreeCustom.Email — ad-free, blazing fast disposable email UI. Plug in any API or self-host.",
    suggestedTags: [
      "open-source", "fce-frontend", "disposable-email", "nextjs", "typescript",
      "tailwindcss", "nextauth", "privacy", "ad-free", "fce-frontend-generator",
      "throwaway-email", "self-hosted",
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
  if (value === true)
    return <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />;
  if (value === "unknown")
    return <span className="text-muted-foreground text-xs mx-auto block text-center">?</span>;
  return <XCircle className="w-5 h-5 text-destructive/60 mx-auto" />;
}

export default function OpenSourcePage() {
  const { data: session } = useSession();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background">
        <AppHeader initialSession={session} />

        <div className="container max-w-4xl mx-auto py-12 px-4 sm:px-6">

          {/* ── Header ─────────────────────────────── */}
          <div className="text-center mb-12 space-y-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Github className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Open Source
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              FreeCustom.Email is built entirely in the open. Both our frontend
              and backend are publicly available on GitHub — inspect every line,
              contribute, or self-host your own instance.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Badge variant="outline" className="gap-1.5 px-3 py-1 text-sm">
                <Heart className="w-3.5 h-3.5 text-red-500" /> 100% Open Core
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1 text-sm">
                <Shield className="w-3.5 h-3.5 text-green-500" /> Privacy-First
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1 text-sm">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Community Driven
              </Badge>
            </div>
          </div>

          <div className="space-y-10">

            {/* ── Repositories ───────────────────────── */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Code2 className="w-6 h-6 text-primary" /> Our Repositories
              </h2>
              <p className="text-sm text-muted-foreground">
                Two repositories. One complete, privacy-respecting temp mail
                stack — no private code hiding behind the curtain.
              </p>

              <div className="grid gap-6">
                {REPOS.map((repo) => (
                  <Card
                    key={repo.name}
                    className={`${repo.borderColor} ${repo.bgColor}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1">
                          <CardTitle
                            className={`flex items-center gap-2 ${repo.color}`}
                          >
                            {repo.icon}
                            {repo.fullName}
                          </CardTitle>
                          <CardDescription>{repo.description}</CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-2"
                          asChild
                        >
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Github className="w-4 h-4" />
                            View on GitHub
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>

                      {/* Meta badges */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Badge
                          variant="outline"
                          className={repo.badgeColor}
                        >
                          {repo.label}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <FileCode className="w-3 h-3" />
                          {repo.language}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Lock className="w-3 h-3" />
                          {repo.license}
                        </Badge>
                        {repo.stars !== null && (
                          <Badge variant="outline" className="gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {repo.stars} stars
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-5">
                      {/* Tech stack */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Stack
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {repo.stack.map((tech) => (
                            <Badge
                              key={tech}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Highlights */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                          Highlights
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {repo.highlights.map((h) => (
                            <div
                              key={h.label}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <span className={repo.color}>{h.icon}</span>
                              {h.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Suggested GitHub metadata */}
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Suggested GitHub Repo Metadata
                        </p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> About (description)
                            </p>
                            <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 font-mono leading-relaxed">
                              {repo.suggestedAbout}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                              <GitFork className="w-3 h-3" /> Topics / Tags
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {repo.suggestedTags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs font-mono"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* ── Comparison ─────────────────────────── */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" /> How We Compare
              </h2>
              <p className="text-sm text-muted-foreground">
                Most temp mail services treat privacy as an afterthought — or
                worse, as a product to monetise. Here's how FreeCustom.Email
                stacks up against the most popular alternatives.
              </p>

              <Card>
                <CardContent className="pt-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4 pr-4 font-semibold text-foreground">
                          Feature
                        </th>
                        <th className="text-center py-4 px-3 font-semibold text-primary min-w-[80px]">
                          FCE ✦
                        </th>
                        <th className="text-center py-4 px-3 font-medium text-muted-foreground min-w-[80px]">
                          Mailinator
                        </th>
                        <th className="text-center py-4 px-3 font-medium text-muted-foreground min-w-[80px]">
                          Guerrilla
                        </th>
                        <th className="text-center py-4 px-3 font-medium text-muted-foreground min-w-[80px]">
                          temp-mail.org
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON.map((row, i) => (
                        <tr
                          key={row.feature}
                          className={
                            i !== COMPARISON.length - 1 ? "border-b" : ""
                          }
                        >
                          <td className="py-3 pr-4 text-foreground font-medium align-top">
                            {row.feature}
                            <p className="text-xs text-muted-foreground font-normal mt-0.5 leading-snug">
                              {row.note}
                            </p>
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <CheckCell value={row.fce} />
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <CheckCell value={row.mailinator} />
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <CheckCell value={row.guerrilla} />
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <CheckCell value={row.tempMailOrg} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <div className="p-4 border rounded-lg bg-muted/20 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 inline mr-1.5 text-amber-500" />
                Competitor data is based on publicly available information and
                our best assessment at the time of writing. Features may
                change — always verify with each provider directly.
              </div>
            </section>

            {/* ── Why Open Source ─────────────────────── */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 text-primary" /> Why We're Open
                Source
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Eye className="w-5 h-5 text-primary" />,
                    title: "Radical Transparency",
                    body: "When we say we don't track you, sell your data, or show ads — you can verify it. Every claim in our privacy policy is backed by public code.",
                  },
                  {
                    icon: <Users className="w-5 h-5 text-primary" />,
                    title: "Community Trust",
                    body: "Open source builds real accountability. Security researchers, developers, and users can audit, flag issues, and contribute improvements.",
                  },
                  {
                    icon: <Server className="w-5 h-5 text-primary" />,
                    title: "Self-Hostable",
                    body: "Don't trust any third-party with your data? Run your own instance. Our Docker Compose setup makes it straightforward to deploy on your own infrastructure.",
                  },
                ].map((card) => (
                  <Card key={card.title}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        {card.icon}
                        {card.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{card.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* ── Contributing CTA ───────────────────── */}
            <div className="mt-4 text-center p-8 border rounded-xl bg-muted/20 space-y-4">
              <Github className="w-8 h-8 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Want to contribute?</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Bug reports, pull requests, and ideas are all welcome. Check the
                contributing guide in each repository to get started.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://github.com/DishIs/fce-backend"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <Server className="w-4 h-4" />
                    Backend Repo
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://github.com/DishIs/fce-frontend"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <FileCode className="w-4 h-4" />
                    Frontend Repo
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}