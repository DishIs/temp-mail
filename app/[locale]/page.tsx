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

export default async function Page({ params }: Props) {
    const { locale } = params;
    setRequestLocale(locale);

    const t = await getTranslations({ locale, namespace: 'PageContent' });
    const tJsonLd = await getTranslations({ locale, namespace: 'JsonLd' });
    const tFaq = await getTranslations({ locale, namespace: 'FAQ' });

    // --- FETCH ALL USER DATA ON SERVER ---
    const session = await auth();
    let customDomains = [];
    let userInboxes = [];
    let currentInbox = null;

    if (session?.user?.id) {
        try {
            // Fetch the entire user profile in one call
            const profileData = await fetchFromServiceAPI(`/user/profile/${session.user.id}`);

            if (profileData.success && profileData.user) {
                const { user } = profileData;
                // Get custom domains if the user is pro
                if (user.plan === 'pro' && Array.isArray(user.customDomains)) {
                    customDomains = user.customDomains;
                }
                // Get the list of user's inboxes
                if (Array.isArray(user.inboxes)) {
                    userInboxes = user.inboxes;
                    // Set the initial inbox to the first one in their list as a default
                    if (userInboxes.length > 0) {
                        currentInbox = userInboxes[0];
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch user profile data on server:", error);
            // Gracefully continue with empty arrays on error
        }
    }

    const organizationJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'FreeCustom.Email',
        url: 'https://www.freecustom.email',
        logo: 'https://www.freecustom.email/logo.webp',
        description: 'Free temporary email service with custom domains and developer API.',
        sameAs: [
            'https://www.linkedin.com/company/freecustom-email',
            'https://github.com/DishantSinghDev/temp-mail',
            'https://www.producthunt.com/products/freecustom-email'
        ]
    };


    const softwareJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'FreeCustom.Email',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Web',
        url: 'https://www.freecustom.email',
        description:
            'Free temporary email generator. Create disposable or dummy email addresses instantly with custom domains and real-time inbox.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '120'
        }
    };


    const internalLinks = LANDING_PAGES.map(page => ({
        href: `/${page.slug}`,
        label: page.slug
            .replace(/-/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase()),
        priority: page.priority
    }));



    return (
        <>
            <Script
                id="json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        organizationJsonLd,
                        softwareJsonLd
                    ])
                }}
            />
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="min-h-screen max-w-[100vw] bg-background">
                    <AppHeader initialSession={session} />
                    <main className="w-full max-w-7xl mx-auto px-4 py-8 sm:py-12">
                        <section className="mb-10">
                            {/* Email box + status: full width of container for medium/large screens */}
                            <div className="w-full">
                                <EmailBox
                                    initialSession={session}
                                    initialCustomDomains={customDomains}
                                    initialInboxes={userInboxes}
                                    initialCurrentInbox={currentInbox}
                                />
                                <Status />
                            </div>

                            {/* Required for Google OAuth verification center — clear section near the top */}
                            <section className="mt-6 max-w-4xl rounded-lg border border-border bg-card p-6 sm:p-8" aria-labelledby="what-we-do-heading">
                                <h2 id="what-we-do-heading" className="text-lg font-semibold tracking-tight text-foreground">
                                    What FreeCustom.Email Does
                                </h2>
                                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                    FreeCustom.Email provides temporary and custom email addresses that allow users to receive emails instantly without using their personal inbox.
                                </p>
                                <p className="mt-2 text-sm font-medium text-foreground">Users can:</p>
                                <ul className="mt-1.5 list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    <li>Generate disposable email addresses</li>
                                    <li>Receive verification codes and login links</li>
                                    <li>Save inboxes with an account</li>
                                    <li>Upgrade to a permanent email with a custom domain</li>
                                </ul>
                                <p className="mt-4 text-sm font-medium text-foreground">We use Google Sign-In only to:</p>
                                <ul className="mt-1.5 list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    <li>Create and secure your account</li>
                                    <li>Save your inbox history</li>
                                    <li>Manage your subscription</li>
                                </ul>
                                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                    We do not access your Gmail, contacts, or any external Google data.
                                </p>
                            </section>

                            <div className="mt-6 max-w-4xl rounded-lg border border-border bg-card p-6 sm:p-8">
                                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                                    {t('h1')}
                                </h1>
                                <p
                                    className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: t.raw('p1') }}
                                />
                                <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                                    {t.rich('p2_part1', {
                                        strong: (chunks) => <strong className="text-foreground">{chunks}</strong>
                                    })}
                                    <Link className="text-foreground underline underline-offset-2 hover:no-underline" href="/blog/forever-free-and-ad-free">
                                        {t('p2_link1')}
                                    </Link>
                                    {t.rich('p2_part2')}
                                    <Link className="text-foreground underline underline-offset-2 hover:no-underline" href="/blog/why-we-are-fastest">
                                        {t('p2_link2')}
                                    </Link>
                                    {t.rich('p2_part3')}
                                </p>
                            </div>
                        </section>
                        <div className="max-w-4xl">
                        <WhySection />

                        {/* Landing page FAQs (subset); full list on /faq */}
                        <section className="mt-14 border-t border-border pt-10" aria-labelledby="landing-faq-heading">
                            <h2 id="landing-faq-heading" className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">
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
                                    <AccordionItem key={id} value={id} className="rounded-lg border border-border bg-card px-4">
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
                                <Link href={`/${locale}/faq`} className="text-foreground underline underline-offset-2 hover:no-underline">
                                {t('landing_faq_view_all')}
                                </Link>
                            </p>
                        </section>

                        <section className="mt-14 border-t border-border pt-10">
                            <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Explore guides</h2>
                            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                                {internalLinks
                                    .filter(l => l.priority === 'high')
                                    .map(link => (
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
                                <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Popular</h3>
                                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                                    {internalLinks
                                        .filter(l => l.priority === 'medium')
                                        .slice(0, 6)
                                        .map(link => (
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