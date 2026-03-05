// app/[locale]/page.tsx
// SEO REWRITE — Key changes:
//  1. Added FAQPage JSON-LD schema (rich result eligible)
//  2. Social proof bar (50k users + rating) moved directly under EmailBox
//  3. H1 is now benefit-driven, not a keyword list
//  4. "What we do" section repurposed as a trust/benefit block (still satisfies Google OAuth)
//  5. Removed keyword-stuffed card_header_p — WhySection carries that weight now
//  6. Title / meta rewritten in translation strings (see en.json)

import { setRequestLocale, getTranslations } from 'next-intl/server';
import { AppFooter } from '@/components/app-footer';
import { AppHeader } from '@/components/app-header';
import { EmailBox } from '@/components/email-box';
import { PopularArticles } from '@/components/popular-articles';
import { WhySection } from '@/components/why-section';
import Status from '@/components/Status';
import Script from 'next/script';
import Link from 'next/link';
import { Locale } from 'next-intl';
import { ThemeProvider } from '@/components/theme-provider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { fetchFromServiceAPI } from '@/lib/api';
import { AwardsSection } from '@/components/AwardsSection';
import { LANDING_PAGES } from '@/lib/landing-pages-config';
import { auth } from '@/auth';

type Props = {
  params: { locale: Locale };
};

export default async function Page({ params }: Props) {
  const { locale } = params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'PageContent' });
  const tFaq = await getTranslations({ locale, namespace: 'FAQ' });

  // --- FETCH ALL USER DATA ON SERVER ---
  const session = await auth();
  let customDomains: string[] = [];
  let userInboxes = [];
  let currentInbox = null;

  if (session?.user?.id) {
    try {
      const profileData = await fetchFromServiceAPI(`/user/profile/${session.user.id}`);
      if (profileData.success && profileData.user) {
        const { user } = profileData;
        if (user.plan === 'pro' && Array.isArray(user.customDomains)) {
          customDomains = user.customDomains;
        }
        if (Array.isArray(user.inboxes)) {
          userInboxes = user.inboxes;
          if (userInboxes.length > 0) currentInbox = userInboxes[0];
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile data on server:', error);
    }
  }

  // ─── JSON-LD: Organization ────────────────────────────────────────────────
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FreeCustom.Email',
    url: 'https://www.freecustom.email',
    logo: 'https://www.freecustom.email/logo.webp',
    description:
      'Free temporary email service with custom domains, real-time inbox, and developer API. No signup, no ads, forever free.',
    sameAs: [
      'https://www.linkedin.com/company/freecustom-email',
      'https://github.com/DishantSinghDev/temp-mail',
      'https://www.producthunt.com/products/freecustom-email',
    ],
  };

  // ─── JSON-LD: SoftwareApplication (triggers star rating in SERPs) ─────────
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FreeCustom.Email',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    url: 'https://www.freecustom.email',
    description:
      'Instantly generate a free disposable or custom temporary email address. No signup required. Real-time inbox, ad-free, with developer API.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '120',
    },
  };

  // ─── JSON-LD: FAQPage (triggers FAQ rich results in SERPs) ────────────────
  // Use only the 5 FAQs shown on this page so markup matches visible content.
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { id: '1', q: tFaq('faq1_q'), a: tFaq('faq1_a') },
      { id: '2', q: tFaq('faq2_q'), a: tFaq('faq2_a') },
      { id: '3', q: tFaq('faq3_q'), a: tFaq('faq3_a') },
      { id: '6', q: tFaq('faq6_q'), a: tFaq('faq6_a') },
      { id: '9', q: tFaq('faq9_q'), a: tFaq('faq9_a') },
    ].map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const internalLinks = LANDING_PAGES.map((page) => ({
    href: `/${page.slug}`,
    label: page.slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    priority: page.priority,
  }));

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd, softwareJsonLd, faqJsonLd]),
        }}
      />

      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen max-w-[100vw] bg-background">
          <AppHeader initialSession={session} />

          <main className="w-full max-w-7xl mx-auto px-4 py-8 sm:py-12">

            {/* ── HERO: EmailBox + Status ──────────────────────────────── */}
            <section aria-label="Temporary email generator">
              <EmailBox
                initialSession={session}
                initialCustomDomains={customDomains}
                initialInboxes={userInboxes}
                initialCurrentInbox={currentInbox}
              />
              <Status />

              {/*
                ── SOCIAL PROOF BAR ────────────────────────────────────────
                Moved here from the pricing page. This is the #1 conversion
                fix: visitors see trust signals before reading a single word.
              */}
              <div
                className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
                aria-label="User trust indicators"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-yellow-500" aria-hidden="true">★★★★★</span>
                  <strong className="text-foreground">4.9/5</strong> rating
                </span>
                <span className="hidden sm:block text-border" aria-hidden="true">|</span>
                <span>
                  Trusted by <strong className="text-foreground">50,000+</strong> users every month
                </span>
                <span className="hidden sm:block text-border" aria-hidden="true">|</span>
                <span>
                  <strong className="text-foreground">1,750,000+</strong> emails processed
                </span>
                <span className="hidden sm:block text-border" aria-hidden="true">|</span>
                <span>Forever free · No ads · No signup</span>
              </div>
            </section>

            {/* ── MAIN CONTENT (max-width for readability) ─────────────── */}
            <div className="mt-10 max-w-4xl">

              {/*
                ── H1 + INTRO ──────────────────────────────────────────────
                H1 is benefit-first. Keywords appear naturally, not crammed.
                The Google OAuth "what we do" requirement is woven in here
                rather than in a separate anonymous block — cleaner UX and
                still satisfies the verification requirement.
              */}
              <section aria-labelledby="main-heading">
                <h1
                  id="main-heading"
                  className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground"
                >
                  {t('h1')}
                </h1>
                <p
                  className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: t.raw('p1') }}
                />
                <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t.rich('p2_part1', {
                    strong: (chunks) => (
                      <strong className="text-foreground">{chunks}</strong>
                    ),
                  })}
                  <Link
                    className="text-foreground underline underline-offset-2 hover:no-underline"
                    href="/blog/forever-free-and-ad-free"
                  >
                    {t('p2_link1')}
                  </Link>
                  {t.rich('p2_part2')}
                  <Link
                    className="text-foreground underline underline-offset-2 hover:no-underline"
                    href="/blog/why-we-are-fastest"
                  >
                    {t('p2_link2')}
                  </Link>
                  {t.rich('p2_part3')}
                </p>
              </section>

              {/*
                ── GOOGLE OAUTH DISCLOSURE ─────────────────────────────────
                Required for Google verification. Kept compact; not a wall
                of text. Positioned after the H1 so it doesn't compete with
                the hero value proposition.
              */}
              <section
                className="mt-6 rounded-lg border border-border bg-card p-5 sm:p-6"
                aria-labelledby="what-we-do-heading"
              >
                <h2
                  id="what-we-do-heading"
                  className="text-sm font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  How this service works
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  FreeCustom.Email generates disposable email addresses so you can receive
                  emails, verification codes, and sign-up links without using your real inbox.
                  Google Sign-In is used only to save your inbox history and manage your
                  subscription — we never access your Gmail, contacts, or any Google data.
                </p>
              </section>

              {/* ── WHY SECTION (features, use cases, one definition) ───── */}
              <WhySection />

              {/*
                ── FAQ SECTION ─────────────────────────────────────────────
                FAQPage JSON-LD above exactly mirrors these 5 questions.
                Google requires visible content to match the markup.
              */}
              <section
                className="mt-14 border-t border-border pt-10"
                aria-labelledby="landing-faq-heading"
              >
                <h2
                  id="landing-faq-heading"
                  className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4"
                >
                  {t('landing_faq_heading')}
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {[
                    { id: '1', q: tFaq('faq1_q'), a: tFaq('faq1_a') },
                    { id: '2', q: tFaq('faq2_q'), a: tFaq('faq2_a') },
                    { id: '3', q: tFaq('faq3_q'), a: tFaq('faq3_a') },
                    { id: '6', q: tFaq('faq6_q'), a: tFaq('faq6_a') },
                    { id: '9', q: tFaq('faq9_q'), a: tFaq('faq9_a') },
                  ].map(({ id, q, a }) => (
                    <AccordionItem
                      key={id}
                      value={id}
                      className="rounded-lg border border-border bg-card px-4"
                    >
                      <AccordionTrigger className="text-left text-sm font-medium py-4 hover:no-underline">
                        {q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4 whitespace-pre-line">
                        {a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <p className="mt-4 text-sm text-muted-foreground">
                  <Link
                    href={`/${locale}/faq`}
                    className="text-foreground underline underline-offset-2 hover:no-underline"
                  >
                    {t('landing_faq_view_all')}
                  </Link>
                </p>
              </section>

              {/* ── INTERNAL LINKS / EXPLORE GUIDES ─────────────────────── */}
              <section className="mt-14 border-t border-border pt-10">
                <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Explore guides
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                  {internalLinks
                    .filter((l) => l.priority === 'high')
                    .map((link) => (
                      <Link
                        key={link.href}
                        href={`/${locale}${link.href}`}
                        className="text-sm text-foreground underline-offset-2 hover:underline"
                      >
                        {link.label}
                      </Link>
                    ))}
                </div>
                <div className="mt-6">
                  <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Popular
                  </h3>
                  <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                    {internalLinks
                      .filter((l) => l.priority === 'medium')
                      .slice(0, 6)
                      .map((link) => (
                        <Link
                          key={link.href}
                          href={`/${locale}${link.href}`}
                          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        >
                          {link.label}
                        </Link>
                      ))}
                  </div>
                </div>
              </section>

              {/* ── API CTA ──────────────────────────────────────────────── */}
              <section className="mt-10 py-6 border-t border-border">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Building something? Use our API for disposable inboxes, OTP
                    extraction, and real-time email delivery.
                  </p>
                  <Link
                    href="/api"
                    className="text-sm font-medium text-primary hover:underline underline-offset-2"
                  >
                    API Overview →
                  </Link>
                </div>
              </section>

              <PopularArticles />
            </div>
          </main>

          <AwardsSection />
          <AppFooter />
        </div>
      </ThemeProvider>
    </>
  );
}