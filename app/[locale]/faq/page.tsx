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
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };

  return (
    <>
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background">
          <AppHeader initialSession={session} />
          <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t("description")}
            </p>
            <Accordion type="single" collapsible className="mt-8 space-y-2">
              {faqItems.map(({ id, q, a }) => (
                <AccordionItem
                  key={id}
                  value={id}
                  className="rounded-lg border border-border bg-card px-4"
                >
                  <AccordionTrigger className="text-left text-sm font-medium sm:text-base">
                    {q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line">
                    {a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </main>
          <AppFooter />
        </div>
      </ThemeProvider>
    </>
  );
}
