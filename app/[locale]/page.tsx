// app/[locale]/page.tsx

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

const DOT_BG = {
  backgroundImage:
    'radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)',
  backgroundSize: '28px 28px',
} as const;

const ASCII_FRAGS = [
  { x: '2%',  y: '5%',  t: 'EHLO api2.freecustom.email' },
  { x: '67%', y: '3%',  t: '250 2.1.0 Ok' },
  { x: '78%', y: '11%', t: 'From: noreply@service.com' },
  { x: '1%',  y: '21%', t: 'RCPT TO:<inbox@ditmail.info>' },
  { x: '71%', y: '27%', t: 'Message-ID: <abc123@fce.email>' },
  { x: '4%',  y: '37%', t: 'Content-Type: text/plain; charset=utf-8' },
  { x: '1%',  y: '51%', t: 'X-OTP: 847291' },
  { x: '69%', y: '57%', t: 'SMTP 220 mail.freecustom.email' },
  { x: '3%',  y: '67%', t: 'Date: Thu, 4 Mar 2026 09:55:00 +0000' },
  { x: '72%', y: '73%', t: '250-STARTTLS' },
  { x: '2%',  y: '83%', t: 'AUTH PLAIN' },
  { x: '67%', y: '87%', t: 'MAIL FROM:<service@example.com>' },
  { x: '4%',  y: '93%', t: 'Subject: Your verification code is 847291' },
];

export default async function Page({ params }: Props) {
  const { locale } = params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'PageContent' });
  const tFaq = await getTranslations({ locale, namespace: 'FAQ' });

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

  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FreeCustom.Email',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    url: 'https://www.freecustom.email',
    description:
      'Instantly generate a free disposable or custom temporary email address. No signup required. Real-time inbox, ad-free, with developer API.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '120' },
  };

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

  const TOTAL_SECTIONS = 3;

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
        <div className="min-h-screen max-w-[100vw] bg-background text-foreground overflow-x-hidden">

          {/* Fixed ASCII background layer */}
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

          {/* ── HERO: EmailBox — tight under header, no wrapper card ───── */}
          <section
            className="relative border-b border-border px-4 sm:px-6 pt-6 pb-8"
            style={DOT_BG}
            aria-label="Temporary email generator"
          >
            <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
            <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

            <div className="relative z-10 w-full max-w-7xl mx-auto">
              {/* EmailBox — directly on the page, no extra card wrapping it */}
              <EmailBox
                initialSession={session}
                initialCustomDomains={customDomains}
                initialInboxes={userInboxes}
                initialCurrentInbox={currentInbox}
              />

              {/* Status — right below the tool */}
              <div className="mt-3">
                <Status />
              </div>

              {/* Social proof strip */}
              <div
                className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground"
                aria-label="User trust indicators"
              >
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

          <main className="relative z-10">

            {/* ── SECTION 01: About ─────────────────────────────────────── */}
            <section className="relative border-b border-border px-4 sm:px-6 py-16 sm:py-20" style={DOT_BG}>
              <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
              <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

              <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-2 mb-10">
                  <div className="w-0.5 h-4 bg-border" aria-hidden />
                  <span className="font-mono text-xs text-foreground font-semibold">
                    [ 01 / {String(TOTAL_SECTIONS).padStart(2, '0')} ]
                  </span>
                  <span className="text-muted-foreground/50 text-xs">·</span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">About</span>
                </div>

                <div className="grid gap-px bg-border rounded-lg overflow-hidden lg:grid-cols-[1fr_360px]">
                  <div className="bg-background px-8 py-10" aria-labelledby="main-heading">
                    <h1 id="main-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4 leading-snug">
                      {t('h1')}
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: t.raw('p1') }} />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t.rich('p2_part1', { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
                      <Link className="text-foreground underline underline-offset-2 hover:no-underline" href="/blog/forever-free-and-ad-free">{t('p2_link1')}</Link>
                      {t.rich('p2_part2')}
                      <Link className="text-foreground underline underline-offset-2 hover:no-underline" href="/blog/why-we-are-fastest">{t('p2_link2')}</Link>
                      {t.rich('p2_part3')}
                    </p>
                  </div>
                  <div className="bg-background px-8 py-10 border-l border-border" aria-labelledby="what-we-do-heading">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">How it works</p>
                    <h2 id="what-we-do-heading" className="text-sm font-semibold text-foreground mb-3">How this service works</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      FreeCustom.Email generates disposable email addresses so you can receive emails, verification codes,
                      and sign-up links without using your real inbox. Google Sign-In is used only to save your inbox
                      history and manage your subscription — we never access your Gmail, contacts, or any Google data.
                    </p>
                    <div className="border-t border-border mt-6 pt-5">
                      <p className="text-xs text-muted-foreground">
                        Building something?{' '}
                        <Link href="/api" className="text-foreground underline underline-offset-2 hover:no-underline">API Overview →</Link>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-b-lg border border-t-0 border-border bg-background px-8 py-10">
                  <WhySection />
                </div>
              </div>
            </section>

            {/* ── SECTION 02: FAQ ───────────────────────────────────────── */}
            <section className="relative border-b border-border px-4 sm:px-6 py-16 sm:py-20" style={DOT_BG} aria-labelledby="landing-faq-heading">
              <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
              <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

              <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-2 mb-10">
                  <div className="w-0.5 h-4 bg-border" aria-hidden />
                  <span className="font-mono text-xs text-foreground font-semibold">
                    [ 02 / {String(TOTAL_SECTIONS).padStart(2, '0')} ]
                  </span>
                  <span className="text-muted-foreground/50 text-xs">·</span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">FAQ</span>
                </div>

                <div className="grid gap-px bg-border rounded-lg overflow-hidden lg:grid-cols-[260px_1fr]">
                  <div className="bg-background px-8 py-10">
                    <h2 id="landing-faq-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3 leading-snug">
                      {t('landing_faq_heading')}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">Quick answers to the most common questions.</p>
                    <Link href={`/${locale}/faq`} className="inline-flex items-center gap-1 text-xs font-mono text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors">
                      {t('landing_faq_view_all')} →
                    </Link>
                  </div>
                  <div className="bg-background px-8 py-6 border-l border-border">
                    <Accordion type="single" collapsible className="divide-y divide-border">
                      {[
                        { id: '1', q: tFaq('faq1_q'), a: tFaq('faq1_a') },
                        { id: '2', q: tFaq('faq2_q'), a: tFaq('faq2_a') },
                        { id: '3', q: tFaq('faq3_q'), a: tFaq('faq3_a') },
                        { id: '6', q: tFaq('faq6_q'), a: tFaq('faq6_a') },
                        { id: '9', q: tFaq('faq9_q'), a: tFaq('faq9_a') },
                      ].map(({ id, q, a }) => (
                        <AccordionItem key={id} value={id} className="border-0 py-0">
                          <AccordionTrigger className="text-left text-sm font-medium py-4 hover:no-underline text-foreground/90 hover:text-foreground">{q}</AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed whitespace-pre-line">{a}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              </div>
            </section>

            {/* ── SECTION 03: Explore + Articles ───────────────────────── */}
            <section className="relative border-b border-border px-4 sm:px-6 py-16 sm:py-20" style={DOT_BG}>
              <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
              <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

              <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-2 mb-10">
                  <div className="w-0.5 h-4 bg-border" aria-hidden />
                  <span className="font-mono text-xs text-foreground font-semibold">
                    [ 03 / {String(TOTAL_SECTIONS).padStart(2, '0')} ]
                  </span>
                  <span className="text-muted-foreground/50 text-xs">·</span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Explore</span>
                </div>

                <div className="rounded-lg border border-border overflow-hidden mb-8">
                  <div className="grid gap-px bg-border md:grid-cols-2">
                    <div className="bg-background px-8 py-8">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Guides</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {internalLinks.filter((l) => l.priority === 'high').map((link) => (
                          <Link key={link.href} href={`/${locale}${link.href}`} className="text-sm text-foreground underline-offset-2 hover:underline py-0.5">
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div className="bg-background px-8 py-8 border-l border-border">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Popular</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {internalLinks.filter((l) => l.priority === 'medium').slice(0, 6).map((link) => (
                          <Link key={link.href} href={`/${locale}${link.href}`} className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline py-0.5">
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <PopularArticles />
              </div>
            </section>

          </main>

          <AwardsSection />
          <AppFooter />
        </div>
      </ThemeProvider>
    </>
  );
}