"use client";

import Link from "next/link";
import { CheckCircle, Zap } from "lucide-react";
import Status from "@/components/Status";
import { LANDING_PAGES } from "@/lib/landing-pages-config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DOT_BG = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

const INTERNAL_LINKS = LANDING_PAGES.map(page => ({
  href: `/${page.slug}`,
  label: page.slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase()),
  priority: page.priority
}));

interface LandingPageTemplateProps {
  translations: Record<string, string>;
  emailBoxComponent: React.ReactNode;
  slug: string;
}

// ── EXACT TYPOGRAPHY & COMPONENT RENDERERS ───────────────────────────────

const renderBulletList = (
  translations: Record<string, string>,
  keyPrefix: string,
  count: number = 6,
  icon?: React.ReactNode
) => {
  const items = [];
  for (let i = 1; i <= count; i++) {
    const key = `${keyPrefix}${i}`;
    if (translations[key]) {
      items.push(
        <li key={i} className="flex items-start gap-3">
          {icon || <CheckCircle className="text-primary mt-0.5 h-4 w-4 shrink-0" />}
          <span 
            className="text-sm sm:text-base text-muted-foreground leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: translations[key] }} 
          />
        </li>
      );
    }
  }
  return items.length > 0 ? <ul className="mt-4 space-y-4">{items}</ul> : null;
};

const renderStepList = (
  translations: Record<string, string>,
  keyPrefix: string,
  count: number = 8
) => {
  const items = [];
  for (let i = 1; i <= count; i++) {
    const key = `${keyPrefix}${i}`;
    if (translations[key]) {
      items.push(
        <li key={i} className="flex items-start gap-3">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5 border border-primary/20">
            {i}
          </span>
          <span 
            className="text-sm sm:text-base text-muted-foreground leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: translations[key] }} 
          />
        </li>
      );
    }
  }
  return items.length > 0 ? <ol className="mt-4 space-y-4">{items}</ol> : null;
};

const renderComparisonTable = (translations: Record<string, string>) => {
  if (!translations["col1"]) return null;

  const rows = [];
  for (let i = 1; i <= 6; i++) {
    const rowKey = `row${i}f`;
    if (translations[rowKey]) {
      rows.push({
        feature: translations[rowKey],
        us: translations[`row${i}a`] || "",
        them: translations[`row${i}b`] || "",
      });
    }
  }

  if (rows.length === 0) return null;

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-left p-4 font-semibold text-foreground">{translations["col1"]}</th>
            <th className="text-left p-4 font-semibold text-primary">{translations["col2"]}</th>
            <th className="text-left p-4 font-semibold text-muted-foreground">{translations["col3"]}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/10"}>
              <td className="p-4 font-medium text-foreground">{row.feature}</td>
              <td className="p-4 text-primary font-medium">✓ {row.us}</td>
              <td className="p-4 text-muted-foreground">{row.them}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Section = ({ title, children, isSub = false }: { title?: string; children: React.ReactNode; isSub?: boolean }) => (
  <div>
    {title && (
      <h2 className={`font-semibold tracking-tight text-foreground ${isSub ? "mt-8 text-sm sm:text-base" : "text-xl sm:text-2xl"}`}>
        {title}
      </h2>
    )}
    {children}
  </div>
);

const Paragraph = ({ children, html }: { children?: React.ReactNode, html?: string }) => {
  if (html) {
    return <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">{children}</p>;
};

// ── MAIN TEMPLATE ────────────────────────────────────────────────────────

export function LandingPageTemplate({
  translations: t,
  emailBoxComponent,
  slug,
}: LandingPageTemplateProps) {

  const linksToShow = INTERNAL_LINKS
    .filter(l => !l.href.includes(slug))
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

  const faqItems = [];
  for (let i = 1; i <= 8; i++) {
    if (t[`faq${i}q`] && t[`faq${i}a`]) {
      faqItems.push({ id: `faq-${i}`, q: t[`faq${i}q`], a: t[`faq${i}a`] });
    }
  }

  const hasBullets = (prefix: string) => !!t[`${prefix}1`];
  const hasAll = (...keys: string[]) => keys.every(k => !!t[k]);

  const totalSections = faqItems.length > 0 ? 3 : 2;

  return (
    <>
      {/* ── HERO: EmailBox (Matches Main Page Exactly) ──────────────── */}
      <section className="relative border-b border-border px-4 sm:px-6 pt-6 pb-8" style={DOT_BG}>
        <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
        <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {emailBoxComponent}
          
          <div className="mt-3">
            <Status />
          </div>

          {/* Social proof strip exactly like the main page */}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground" aria-label="User trust indicators">
            <span className="flex items-center gap-1">
              <span className="text-yellow-500" aria-hidden="true">★★★★★</span>
              <strong className="text-foreground font-mono">4.9/5</strong>
            </span>
            <span className="hidden sm:block text-border" aria-hidden="true">·</span>
            <span>Trusted by <strong className="text-foreground font-mono">50,000+</strong> users every month</span>
            <span className="hidden sm:block text-border" aria-hidden="true">·</span>
            <span><strong className="text-foreground font-mono">1,750,000+</strong> emails processed</span>
            <span className="hidden sm:block text-border" aria-hidden="true">·</span>
            <span className="text-muted-foreground/70">Forever free · No ads · No signup</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 01: About / Details ──────────────────────────────── */}
      <section className="relative border-b border-border px-4 sm:px-6 py-16 sm:py-20" style={DOT_BG}>
        <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
        <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-0.5 h-4 bg-border" aria-hidden />
            <span className="font-mono text-xs text-foreground font-semibold">
              [ 01 / {String(totalSections).padStart(2, '0')} ]
            </span>
            <span className="text-muted-foreground/50 text-xs">·</span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">About</span>
          </div>

          {/* Top Info Grid */}
          <div className="grid gap-px bg-border rounded-t-lg overflow-hidden lg:grid-cols-[1fr_360px]">
            <div className="bg-background px-8 py-10">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4 leading-snug">
                {t["h1"]}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t["intro"]}
              </p>
            </div>
            
            <div className="bg-background px-8 py-10 border-l border-border">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">At a glance</p>
              <h2 className="text-sm font-semibold text-foreground mb-3">
                {t["howItWorksTitle"] || "How it works"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t["howItWorksBody"] || "FreeCustom.Email generates disposable email addresses so you can receive emails, verification codes, and sign-up links without using your real inbox. Built for speed and privacy."}
              </p>
              {t["ctaTitle"] && (
                 <div className="border-t border-border mt-6 pt-5">
                    <p className="text-xs text-muted-foreground font-medium text-foreground">
                      {t["ctaTitle"]}
                    </p>
                 </div>
              )}
            </div>
          </div>

          {/* Dynamic Content Blocks - Matches WhySection padding and spacing */}
          <div className="rounded-b-lg border border-t-0 border-border bg-background px-8 py-10 space-y-14 pb-12">
            
            {hasAll("whatIsTitle") && (
              <Section title={t["whatIsTitle"]}>
                <Paragraph html={t["whatIsBody"]} />
              </Section>
            )}

            {hasAll("definitionTitle") && (
              <Section title={t["definitionTitle"]}>
                <Paragraph html={t["definitionBody"]} />
              </Section>
            )}

            {hasAll("whyUseTitle") && (
              <Section title={t["whyUseTitle"]}>
                <Paragraph>{t["whyUseBody"]}</Paragraph>
              </Section>
            )}

            {hasAll("whyTitle") && (
              <Section title={t["whyTitle"]}>
                <Paragraph>{t["whyBody"]}</Paragraph>
              </Section>
            )}

            {(hasAll("benefitsTitle") || hasBullets("benefit")) && (
              <Section title={t["benefitsTitle"]}>
                {renderBulletList(t, "benefit")}
              </Section>
            )}

            {(hasAll("featuresTitle") || hasBullets("feature")) && (
              <Section title={t["featuresTitle"]}>
                {renderBulletList(t, "feature")}
              </Section>
            )}

            {hasAll("foreverFreeTitle") && (
              <Section title={t["foreverFreeTitle"]}>
                <Paragraph>{t["foreverFreeBody"]}</Paragraph>
              </Section>
            )}

            {hasAll("speedTitle") && (
              <Section title={t["speedTitle"]}>
                <Paragraph>{t["speedBody"]}</Paragraph>
              </Section>
            )}

            {hasAll("privacyTitle") && (
              <Section title={t["privacyTitle"]}>
                <Paragraph>{t["privacyBody"]}</Paragraph>
              </Section>
            )}

            {(hasAll("securityTitle") || hasBullets("securityItem")) && (
              <Section title={t["securityTitle"]}>
                <Paragraph>{t["securityBody"]}</Paragraph>
                {renderBulletList(t, "securityItem")}
              </Section>
            )}

            {(hasAll("useCasesTitle") || hasBullets("useCase")) && (
              <Section title={t["useCasesTitle"]}>
                {renderBulletList(t, "useCase")}
              </Section>
            )}

            {(hasAll("howToUseTitle") || hasBullets("howToStep")) && (
              <Section title={t["howToUseTitle"]}>
                {renderStepList(t, "howToStep")}
              </Section>
            )}

            {(hasAll("setupTitle") || hasBullets("setupStep")) && (
              <Section title={t["setupTitle"]}>
                {renderStepList(t, "setupStep", 3)}
              </Section>
            )}

            {(hasAll("proFeaturesTitle") || hasBullets("proFeature")) && (
              <Section title={t["proFeaturesTitle"]}>
                {renderBulletList(t, "proFeature", 6, <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />)}
              </Section>
            )}

            {hasAll("customPrefixTitle") && (
              <Section title={t["customPrefixTitle"]}>
                <Paragraph>{t["customPrefixBody"]}</Paragraph>
              </Section>
            )}

            {hasAll("customDomainTitle") && (
              <Section title={t["customDomainTitle"]}>
                <Paragraph>{t["customDomainBody"]}</Paragraph>
              </Section>
            )}

            {hasAll("comparisonTitle") && (
              <Section title={t["comparisonTitle"]}>
                {renderComparisonTable(t)}
              </Section>
            )}

            {(hasAll("problemsTitle") || hasBullets("problem")) && (
              <Section title={t["problemsTitle"]}>
                {renderBulletList(t, "problem", 4)}
              </Section>
            )}

            {(hasAll("ourSolutionTitle") || hasBullets("solution")) && (
              <Section title={t["ourSolutionTitle"]}>
                {renderBulletList(t, "solution", 4)}
              </Section>
            )}

            {hasAll("servicesTitle") && (
              <Section title={t["servicesTitle"]}>
                <div className="mt-6 space-y-4">
                  {[1, 2, 3, 4].map(i => t[`service${i}Name`] ? (
                    <div key={i} className="border border-border rounded-lg p-5 bg-background">
                      <div className="font-semibold text-foreground mb-2 flex items-center gap-3">
                        {t[`service${i}Name`]}
                        {i === 1 && <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-primary/10 text-primary rounded-full">Top Pick</span>}
                      </div>
                      <div className="space-y-1.5">
                        {t[`service${i}Pro`] && <p className="text-sm text-muted-foreground flex gap-2"><span className="shrink-0 text-green-500">✓</span> {t[`service${i}Pro`]}</p>}
                        {t[`service${i}Con`] && <p className="text-sm text-muted-foreground flex gap-2"><span className="shrink-0 text-red-500/70">✗</span> {t[`service${i}Con`]}</p>}
                      </div>
                    </div>
                  ) : null)}
                </div>
              </Section>
            )}

            {hasAll("verdictTitle") && (
              <Section title={t["verdictTitle"]}>
                <Paragraph>{t["verdictBody"]}</Paragraph>
              </Section>
            )}

            {hasAll("exampleTitle") && (
              <Section title={t["exampleTitle"]}>
                <Paragraph>{t["exampleBody"]}</Paragraph>
                <div className="mt-4 bg-muted/30 border border-border rounded-md p-4 font-mono text-xs overflow-x-auto text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">GET</span>
                  {" /api/private-mailbox?fullMailboxId="}
                  <span className="text-blue-500">your-test@yourdomain.com</span>
                  <br />
                  Authorization: Bearer YOUR_API_KEY
                </div>
              </Section>
            )}

            {/* Other dynamically matched sections */}
            {[
              "discordVerificationTitle", "metaTrackingTitle", "telegramEmailTitle",
              "otpExplainerTitle", "howVerificationWorksTitle", "redditPrivacyTitle"
            ].map(key => {
              const bodyKey = key.replace("Title", "Body");
              if (hasAll(key, bodyKey)) {
                return (
                  <Section key={key} title={t[key]}>
                    <Paragraph>{t[bodyKey]}</Paragraph>
                  </Section>
                );
              }
              return null;
            })}

            {/* Other dynamically matched lists */}
            {[
              { titleKey: "discordUseCasesTitle", listKey: "discordUseCase" },
              { titleKey: "instagramUseCasesTitle", listKey: "instagramUseCase" },
              { titleKey: "telegramUseCasesTitle", listKey: "telegramUseCase" },
              { titleKey: "otpUseCasesTitle", listKey: "otpUseCase" },
              { titleKey: "verificationTypesTitle", listKey: "verificationType" },
              { titleKey: "redditUseCasesTitle", listKey: "redditUseCase" },
            ].map(({ titleKey, listKey }) => {
              if (hasAll(titleKey) || hasBullets(listKey)) {
                return (
                  <Section key={titleKey} title={t[titleKey]}>
                    {renderBulletList(t, listKey, 8)}
                  </Section>
                );
              }
              return null;
            })}
            
          </div>
        </div>
      </section>

      {/* ── SECTION 02: FAQ ───────────────────────────────────────────── */}
      {faqItems.length > 0 && (
        <section className="relative border-b border-border px-4 sm:px-6 py-16 sm:py-20" style={DOT_BG}>
          <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
          <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-10">
              <div className="w-0.5 h-4 bg-border" />
              <span className="font-mono text-xs text-foreground font-semibold">
                [ 02 / {String(totalSections).padStart(2, '0')} ]
              </span>
              <span className="text-muted-foreground/50 text-xs">·</span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">FAQ</span>
            </div>

            <div className="grid gap-px bg-border rounded-lg overflow-hidden lg:grid-cols-[260px_1fr]">
              <div className="bg-background px-8 py-10">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3 leading-snug">
                  {t["faqTitle"] || "Frequently asked questions"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">Quick answers to common queries about this topic.</p>
              </div>
              
              <div className="bg-background px-8 py-6 border-l border-border">
                <Accordion type="single" collapsible className="divide-y divide-border">
                  {faqItems.map(({ id, q, a }) => (
                    <AccordionItem key={id} value={id} className="border-0 py-0">
                      <AccordionTrigger className="text-left text-sm font-medium py-4 hover:no-underline text-foreground/90 hover:text-foreground">
                        {q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed whitespace-pre-line">
                        {a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 03: Explore ───────────────────────────────────────── */}
      <section className="relative border-b border-border px-4 sm:px-6 py-16 sm:py-20" style={DOT_BG}>
        <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
        <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-0.5 h-4 bg-border" />
            <span className="font-mono text-xs text-foreground font-semibold">
              [ {String(totalSections).padStart(2, '0')} / {String(totalSections).padStart(2, '0')} ]
            </span>
            <span className="text-muted-foreground/50 text-xs">·</span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Explore</span>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid gap-px bg-border md:grid-cols-2">
              <div className="bg-background px-8 py-8">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Guides</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {linksToShow.filter(l => l.priority === "high").map(link => (
                    <Link key={link.href} href={link.href} className="text-sm text-foreground underline-offset-2 hover:underline py-0.5">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="bg-background px-8 py-8 border-l border-border">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Popular</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {linksToShow.filter(l => l.priority === "medium").slice(0, 8).map(link => (
                    <Link key={link.href} href={link.href} className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline py-0.5">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}