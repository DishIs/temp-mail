import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { auth } from "@/auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Locale } from "next-intl";
import Script from "next/script";

const FAQ_IDS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15",
] as const;

type Props = { params: { locale: Locale } };

// ── Shared design tokens ──────────────────────────────────────────────────────
const DOT_BG = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

const ASCII_FRAGS = [
  { x: "2%",  y: "5%",  t: "EHLO api2.freecustom.email" },
  { x: "67%", y: "3%",  t: "250 2.1.0 Ok" },
  { x: "78%", y: "11%", t: "From: noreply@service.com" },
  { x: "1%",  y: "21%", t: "RCPT TO:<inbox@ditmail.info>" },
  { x: "71%", y: "27%", t: "Message-ID: <abc123@fce.email>" },
  { x: "4%",  y: "37%", t: "Content-Type: text/plain; charset=utf-8" },
  { x: "1%",  y: "51%", t: "X-OTP: 847291" },
  { x: "69%", y: "57%", t: "SMTP 220 mail.freecustom.email" },
  { x: "3%",  y: "67%", t: "Date: Thu, 4 Mar 2026 09:55:00 +0000" },
  { x: "72%", y: "73%", t: "250-STARTTLS" },
  { x: "2%",  y: "83%", t: "AUTH PLAIN" },
  { x: "67%", y: "87%", t: "MAIL FROM:<service@example.com>" },
  { x: "4%",  y: "93%", t: "Subject: Your verification code is 847291" },
];

export async function generateMetadata({ params }: Props) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "FAQ" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function FAQPage({ params }: Props) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations("FAQ");
  const session = await auth();

  const faqItems = FAQ_IDS.map((id) => ({
    id,
    q: t(`faq${id}_q` as any),
    a: t(`faq${id}_a` as any),
  })).filter((item) => item.q && item.a);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  // split into two columns for the grid layout
  const mid = Math.ceil(faqItems.length / 2);
  const colA = faqItems.slice(0, mid);
  const colB = faqItems.slice(mid);

  return (
    <>
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen max-w-[100vw] bg-background text-foreground overflow-x-hidden">

          {/* Fixed ASCII background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
            {ASCII_FRAGS.map((f, i) => (
              <span
                key={i}
                className="absolute font-mono text-[10px] text-foreground whitespace-nowrap"
                style={{ left: f.x, top: f.y, opacity: 0.035 }}
              >
                {f.t}
              </span>
            ))}
          </div>

          <AppHeader initialSession={session} />

          {/* ── HERO ─────────────────────────────────────────────────────── */}
          <section
            className="relative border-b border-border px-4 sm:px-6 pt-14 pb-16"
            style={DOT_BG}
          >
            {/* Column guides */}
            <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
            <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

            <div className="relative z-10 max-w-5xl mx-auto">
              {/* Section marker */}
              <div className="flex items-center gap-2 mb-8">
                <div className="w-0.5 h-4 bg-border" aria-hidden />
                <span className="font-mono text-xs text-foreground font-semibold">
                  [ 01 / 01 ]
                </span>
                <span className="text-muted-foreground/50 text-xs">·</span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  FAQ
                </span>
              </div>

              {/* Title + description in a two-col card */}
              <div className="grid gap-px bg-border rounded-lg overflow-hidden lg:grid-cols-[1fr_360px]">
                <div className="bg-background px-8 py-10">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 leading-tight">
                    {t("title")}
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                    {t("description")}
                  </p>
                </div>

                {/* Right: quick stats */}
                <div className="bg-background px-8 py-10 border-l border-border flex flex-col justify-center gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      Questions covered
                    </p>
                    <p className="font-mono text-3xl font-bold text-foreground tabular-nums">
                      {faqItems.length}
                    </p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      Topics
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {["Retention","Privacy","Domains","Billing","Features"].map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[10px] uppercase tracking-widest border border-border rounded-sm px-1.5 py-px text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── FAQ BODY ─────────────────────────────────────────────────── */}
          <main
            className="relative border-b border-border px-4 sm:px-6 py-16 sm:py-20"
            style={DOT_BG}
          >
            <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
            <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

            <div className="relative z-10 max-w-5xl mx-auto">

              {/* Two-column accordion grid — gap-px bg-border pattern */}
              <div className="grid gap-px bg-border rounded-lg overflow-hidden lg:grid-cols-2">

                {/* Column A */}
                <div className="bg-background px-0">
                  <Accordion type="single" collapsible>
                    {colA.map(({ id, q, a }, idx) => (
                      <AccordionItem
                        key={id}
                        value={id}
                        className="border-b border-border last:border-0"
                      >
                        <AccordionTrigger className="px-6 py-4 text-left hover:no-underline group">
                          <div className="flex items-start gap-3 w-full pr-2">
                            <span className="font-mono text-[10px] text-muted-foreground/40 tabular-nums pt-0.5 shrink-0 w-5">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors leading-snug text-left">
                              {q}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-5">
                          <div className="pl-8">
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                              {a}
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                {/* Column B */}
                <div className="bg-background px-0 border-l border-border">
                  <Accordion type="single" collapsible>
                    {colB.map(({ id, q, a }, idx) => (
                      <AccordionItem
                        key={id}
                        value={id}
                        className="border-b border-border last:border-0"
                      >
                        <AccordionTrigger className="px-6 py-4 text-left hover:no-underline group">
                          <div className="flex items-start gap-3 w-full pr-2">
                            <span className="font-mono text-[10px] text-muted-foreground/40 tabular-nums pt-0.5 shrink-0 w-5">
                              {String(mid + idx + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors leading-snug text-left">
                              {q}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-5">
                          <div className="pl-8">
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                              {a}
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

              </div>

              {/* Bottom note */}
              <p className="mt-6 font-mono text-[11px] text-muted-foreground/60">
                Still have questions?{" "}
                <a
                  href="/contact"
                  className="text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                >
                  Contact us →
                </a>
              </p>
            </div>
          </main>

          <AppFooter />
        </div>
      </ThemeProvider>
    </>
  );
}