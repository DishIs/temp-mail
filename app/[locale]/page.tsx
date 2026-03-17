// app/[locale]/page.tsx
// KEY CHANGE: No auth(), no EmailBoxDataFetcher, no Suspense around EmailBox.
// The shell renders in <50ms. EmailBox handles its own data client-side.

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
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { AwardsSection } from '@/components/AwardsSection';
import { LANDING_PAGES } from '@/lib/landing-pages-config';
import { Suspense } from 'react';

type Props = { params: { locale: Locale } };

const BASE_URL = 'https://www.freecustom.email';

const DOT_BG = {
  backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)',
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

  // ── Schema LD ──────────────────────────────────────────────────────────────
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FreeCustom.Email',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    url: BASE_URL,
    description: 'Instantly generate a free disposable or custom temporary email address. No signup required. Real-time inbox, ad-free, with developer API.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: 120,
      bestRating: '5',
      worstRating: '1',
    },
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FreeCustom.Email',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.webp`,
    description: 'Free temporary email service with custom domains, real-time inbox, and developer API. No signup, no ads, forever free.',
    sameAs: [
      'https://www.linkedin.com/company/freecustom-email',
      'https://github.com/DishantSinghDev/temp-mail',
      'https://www.producthunt.com/products/freecustom-email',
    ],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{
      '@type': 'ListItem', position: 1, name: 'Temp Mail', item: `${BASE_URL}/${locale}`,
    }],
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FreeCustom.Email',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/blog?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { id: '1',  q: tFaq('faq1_q'),  a: tFaq('faq1_a') },
      { id: '2',  q: tFaq('faq2_q'),  a: tFaq('faq2_a') },
      { id: '3',  q: tFaq('faq3_q'),  a: tFaq('faq3_a') },
      { id: '4',  q: tFaq('faq4_q'),  a: tFaq('faq4_a') },
      { id: '5',  q: tFaq('faq5_q'),  a: tFaq('faq5_a') },
      { id: '6',  q: tFaq('faq6_q'),  a: tFaq('faq6_a') },
      { id: '7',  q: tFaq('faq7_q'),  a: tFaq('faq7_a') },
      { id: '8',  q: tFaq('faq8_q'),  a: tFaq('faq8_a') },
      { id: '9',  q: tFaq('faq9_q'),  a: tFaq('faq9_a') },
      { id: '10', q: tFaq('faq10_q'), a: tFaq('faq10_a') },
      { id: '11', q: tFaq('faq11_q'), a: tFaq('faq11_a') },
      { id: '12', q: tFaq('faq12_q'), a: tFaq('faq12_a') },
      { id: '13', q: tFaq('faq13_q'), a: tFaq('faq13_a') },
      { id: '14', q: tFaq('faq14_q'), a: tFaq('faq14_a') },
      { id: '15', q: tFaq('faq15_q'), a: tFaq('faq15_a') },
    ].map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const internalLinks = LANDING_PAGES.map((page) => ({
    href: `/${page.slug}`,
    label: page.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    priority: page.priority,
  }));

  const TOTAL_SECTIONS = 3;

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd, softwareJsonLd, faqJsonLd, breadcrumbJsonLd, websiteJsonLd]),
        }}
      />

      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen max-w-[100vw] bg-background text-foreground overflow-x-hidden">

          <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
            {ASCII_FRAGS.map((f, i) => (
              <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap"
                style={{ left: f.x, top: f.y, opacity: 0.035 }}>{f.t}</span>
            ))}
          </div>

          {/*
            FIX: AppHeader no longer needs initialSession from server.
            It fetches session client-side via useSession().
            This removes the auth() blocking call from TTFB.
          */}
          <AppHeader />

          {/* H1 is always in the initial HTML — never behind a loading gate */}
          <h1 className="sr-only">{t('h1')}</h1>

          <section
            className="relative border-b border-border px-4 sm:px-6 pt-6 pb-8"
            style={DOT_BG}
            aria-label="Temporary email generator"
          >
            <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
            <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />

            <div className="relative z-10 w-full max-w-7xl mx-auto">
              {/*
                FIX: EmailBox now manages its own session and profile fetch client-side.
                No more props passed from server. No Suspense wrapper needed here.
                The skeleton renders immediately — this becomes the LCP element.
              */}
              <EmailBox />

              <Status />

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

              {/*
                KEYWORD PARAGRAPH — Point 2 fix.
                This is the most important single paragraph on the entire page.
                It must contain: "temp mail", "temporary email", "disposable email",
                "OTP", "verification" in natural prose — not stuffed.
                It renders in the initial HTML (server component) so Google sees it
                immediately, before any JS runs.
                The font-mono + muted styling keeps it visually subtle so it doesn't
                compete with the tool UI, but it is fully crawlable text.
              */}
              <p className="mt-4 max-w-3xl text-xs text-muted-foreground/80 leading-relaxed font-mono">
                <Link href="/temp-mail" className="text-foreground/70 hover:text-foreground transition-colors underline underline-offset-2 decoration-border">Temp mail</Link>
                {' '}by FreeCustom.Email — create a free{' '}
                <Link href="/temporary-email" className="text-foreground/70 hover:text-foreground transition-colors underline underline-offset-2 decoration-border">temporary email</Link>
                {' '}address instantly. Use a{' '}
                <Link href="/disposable-email" className="text-foreground/70 hover:text-foreground transition-colors underline underline-offset-2 decoration-border">disposable email</Link>
                {' '}to receive{' '}
                <Link href="/temp-mail-for-otp" className="text-foreground/70 hover:text-foreground transition-colors underline underline-offset-2 decoration-border">OTP and verification codes</Link>
                {', signups, and test registrations — without exposing your real inbox. No registration, forever free, zero ads.'}
              </p>
            </div>
          </section>

          <main className="relative z-10">

            <section className="relative border-b border-border px-4 sm:px-6 py-16 sm:py-20" style={DOT_BG}>
              <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
              <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
              <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-2 mb-10">
                  <div className="w-0.5 h-4 bg-border" aria-hidden />
                  <span className="font-mono text-xs text-foreground font-semibold">[ 01 / {String(TOTAL_SECTIONS).padStart(2, '0')} ]</span>
                  <span className="text-muted-foreground/50 text-xs">·</span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">About</span>
                </div>
                <div className="grid gap-px bg-border rounded-lg overflow-hidden lg:grid-cols-[1fr_360px]">
                  <div className="bg-background px-8 py-10">
                    <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4 leading-snug">{t('h1')}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: t.raw('p1') }} />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t.rich('p2_part1', { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
                      <Link className="text-foreground underline underline-offset-2 hover:no-underline" href="/blog/forever-free-and-ad-free">{t('p2_link1')}</Link>
                      {t.rich('p2_part2')}
                      <Link className="text-foreground underline underline-offset-2 hover:no-underline" href="/blog/why-we-are-fastest">{t('p2_link2')}</Link>
                      {t.rich('p2_part3')}
                    </p>
                  </div>
                  <div className="bg-background px-8 py-10 border-l border-border">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">How it works</p>
                    <h2 className="text-sm font-semibold text-foreground mb-3">How this service works</h2>
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

            <section className="relative border-b border-border px-4 sm:px-6 py-16 sm:py-20" style={DOT_BG} aria-labelledby="landing-faq-heading">
              <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
              <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
              <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-2 mb-10">
                  <div className="w-0.5 h-4 bg-border" aria-hidden />
                  <span className="font-mono text-xs text-foreground font-semibold">[ 02 / {String(TOTAL_SECTIONS).padStart(2, '0')} ]</span>
                  <span className="text-muted-foreground/50 text-xs">·</span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">FAQ</span>
                </div>
                <div className="grid gap-px bg-border rounded-lg overflow-hidden lg:grid-cols-[260px_1fr]">
                  <div className="bg-background px-8 py-10">
                    <h2 id="landing-faq-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3 leading-snug">{t('landing_faq_heading')}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">Quick answers to the most common questions.</p>
                    <Link href={`/${locale}/faq`} className="inline-flex items-center gap-1 text-xs font-mono text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors">
                      {t('landing_faq_view_all')} →
                    </Link>
                  </div>
                  <div className="bg-background px-8 py-6 border-l border-border">
                    <Accordion type="single" collapsible className="divide-y divide-border">
                      {[
                        { id: '1',  q: tFaq('faq1_q'),  a: tFaq('faq1_a') },
                        { id: '2',  q: tFaq('faq2_q'),  a: tFaq('faq2_a') },
                        { id: '3',  q: tFaq('faq3_q'),  a: tFaq('faq3_a') },
                        { id: '4',  q: tFaq('faq4_q'),  a: tFaq('faq4_a') },
                        { id: '5',  q: tFaq('faq5_q'),  a: tFaq('faq5_a') },
                        { id: '6',  q: tFaq('faq6_q'),  a: tFaq('faq6_a') },
                        { id: '7',  q: tFaq('faq7_q'),  a: tFaq('faq7_a') },
                        { id: '8',  q: tFaq('faq8_q'),  a: tFaq('faq8_a') },
                        { id: '9',  q: tFaq('faq9_q'),  a: tFaq('faq9_a') },
                        { id: '10', q: tFaq('faq10_q'), a: tFaq('faq10_a') },
                        { id: '11', q: tFaq('faq11_q'), a: tFaq('faq11_a') },
                        { id: '12', q: tFaq('faq12_q'), a: tFaq('faq12_a') },
                        { id: '13', q: tFaq('faq13_q'), a: tFaq('faq13_a') },
                        { id: '14', q: tFaq('faq14_q'), a: tFaq('faq14_a') },
                        { id: '15', q: tFaq('faq15_q'), a: tFaq('faq15_a') },
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

            <section className="relative border-b border-border px-4 sm:px-6 py-16 sm:py-20" style={DOT_BG}>
              <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
              <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
              <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-2 mb-10">
                  <div className="w-0.5 h-4 bg-border" aria-hidden />
                  <span className="font-mono text-xs text-foreground font-semibold">[ 03 / {String(TOTAL_SECTIONS).padStart(2, '0')} ]</span>
                  <span className="text-muted-foreground/50 text-xs">·</span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Explore</span>
                </div>
                {/* ── CHANGE 2: Keyword-rich anchor text in Explore section ─────────── */}
              {/* Replace your existing Explore section grid entirely: */}

                <div className="rounded-lg border border-border overflow-hidden mb-8">
                  <div className="grid gap-px bg-border md:grid-cols-2">

                    {/* Guides column — core authority pages with keyword anchors */}
                    <div className="bg-background px-8 py-8">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Guides</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 list-none">
                        {/*
                          ANCHOR TEXT FIX: Each anchor now uses the exact keyword
                          phrase that the target page is trying to rank for.
                          Previously these were generic title-case labels.
                          Google uses anchor text as a strong ranking signal for
                          the destination page.
                        */}
                        <li><Link href="/temp-mail" className="text-sm text-foreground underline-offset-2 hover:underline py-0.5 block">Free temp mail</Link></li>
                        <li><Link href="/temporary-email" className="text-sm text-foreground underline-offset-2 hover:underline py-0.5 block">Temporary email address</Link></li>
                        <li><Link href="/disposable-email" className="text-sm text-foreground underline-offset-2 hover:underline py-0.5 block">Disposable email</Link></li>
                        <li><Link href="/anonymous-email" className="text-sm text-foreground underline-offset-2 hover:underline py-0.5 block">Anonymous email</Link></li>
                        <li><Link href="/free-temp-mail" className="text-sm text-foreground underline-offset-2 hover:underline py-0.5 block">Free disposable email</Link></li>
                        <li><Link href="/temp-mail-api" className="text-sm text-foreground underline-offset-2 hover:underline py-0.5 block">Temp mail API</Link></li>
                      </ul>
                    </div>

                    {/* Popular column — feature + use-case pages */}
                    <div className="bg-background px-8 py-8 border-l border-border">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Popular</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 list-none">
                        <li><Link href="/temp-mail-for-otp" className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline py-0.5 block">Temp mail for OTP</Link></li>
                        <li><Link href="/temp-mail-for-verification" className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline py-0.5 block">Email verification temp mail</Link></li>
                        <li><Link href="/temp-mail-for-developers" className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline py-0.5 block">Temp mail for developers</Link></li>
                        <li><Link href="/temp-mail-for-testing" className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline py-0.5 block">Temp mail for testing</Link></li>
                        <li><Link href="/temp-mail-with-custom-domain" className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline py-0.5 block">Custom domain temp mail</Link></li>
                        <li><Link href="/temp-mail-no-ads" className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline py-0.5 block">Temp mail no ads</Link></li>
                      </ul>
                    </div>

                  </div>

                  {/* Second row — competitor alternatives + new high-volume pages */}
                  <div className="grid gap-px bg-border md:grid-cols-3 border-t border-border">
                    <div className="bg-background px-8 py-6">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Alternatives</p>
                      <ul className="space-y-1.5 list-none">
                        <li><Link href="/guerrillamail-alternative" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors block">GuerillaMail alternative</Link></li>
                        <li><Link href="/10minmail-alternative" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors block">10MinuteMail alternative</Link></li>
                        <li><Link href="/best-temp-mail-services" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors block">Best temp mail services</Link></li>
                      </ul>
                    </div>
                    <div className="bg-background px-8 py-6 border-l border-border">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">By platform</p>
                      <ul className="space-y-1.5 list-none">
                        <li><Link href="/temp-mail-for-facebook" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors block">Temp mail for Facebook</Link></li>
                        <li><Link href="/temp-mail-for-discord" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors block">Temp mail for Discord</Link></li>
                        <li><Link href="/temp-mail-for-instagram" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors block">Temp mail for Instagram</Link></li>
                      </ul>
                    </div>
                    <div className="bg-background px-8 py-6 border-l border-border">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Tools</p>
                      <ul className="space-y-1.5 list-none">
                        {/*
                          NEW PAGES from point 6.
                          These don't exist yet — add them to landing-pages-config.ts below.
                          Linking to them now means Google will crawl them the moment
                          you create them.
                        */}
                        <li><Link href="/throwaway-email" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors block">Throwaway email</Link></li>
                        <li><Link href="/receive-email-online" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors block">Receive email online</Link></li>
                        <li><Link href="/fake-email-generator" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-2 transition-colors block">Fake email generator</Link></li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Suspense fallback={
                  <div className="w-full h-48 border border-border border-dashed rounded-lg flex items-center justify-center bg-background/50">
                    <span className="font-mono text-xs text-muted-foreground animate-pulse">Loading articles...</span>
                  </div>
                }>
                  <PopularArticles />
                </Suspense>
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