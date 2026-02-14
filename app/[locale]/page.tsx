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

import { getServerSession } from 'next-auth';
import { fetchFromServiceAPI } from '@/lib/api';
import { AwardsSection } from '@/components/AwardsSection';
import { LANDING_PAGES } from '@/lib/landing-pages-config';

type Props = {
    params: { locale: Locale };
};

export default async function Page({ params }: Props) {
    const { locale } = params;
    setRequestLocale(locale);

    const t = await getTranslations({ locale, namespace: 'PageContent' });
    const tJsonLd = await getTranslations({ locale, namespace: 'JsonLd' });

    // --- FETCH ALL USER DATA ON SERVER ---
    const session = await getServerSession();
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

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: tJsonLd('name'),
        url: 'https://www.freecustom.email',
        logo: 'https://www.freecustom.email/logo.webp',
        description: tJsonLd('description'),
        sameAs: [
            'https://www.linkedin.com/company/freecustom-email',
            'https://github.com/DishantSinghDev/temp-mail',
            'https://www.producthunt.com/products/freecustom-email',
        ],
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="min-h-screen max-w-[100vw] bg-background">
                    <AppHeader initialSession={session} />
                    <main className="mx-auto m-2 px-4 py-4">
                        <section className="mb-4">
                            {/* --- Pass all fetched data as props --- */}
                            <EmailBox
                                initialSession={session}
                                initialCustomDomains={customDomains}
                                initialInboxes={userInboxes}
                                initialCurrentInbox={currentInbox}
                            />
                            <Status />
                            <div className="bg-white dark:bg-black border mt-4 dark:border-gray-700 p-6 rounded-lg">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">
                                    {t('h1')}
                                </h1>
                                <p
                                    className="mb-4 text-muted-foreground leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: t.raw('p1') }}
                                ></p>
                                <p className=" text-muted-foreground leading-relaxed">
                                    {t.rich('p2_part1', {
                                        strong: (chunks) => <strong>{chunks}</strong>
                                    })}
                                    <Link className="text-blue-700 hover:underline" href="/blog/forever-free-and-ad-free">
                                        {t('p2_link1')}
                                    </Link>
                                    {t.rich('p2_part2')}
                                    <Link className="text-blue-700 hover:underline" href="/blog/why-we-are-fastest">
                                        {t('p2_link2')}
                                    </Link>
                                    {t.rich('p2_part3')}
                                </p>
                            </div>
                        </section>
                        <WhySection />
                        <section className="mt-12">
                            <h3 className="text-2xl font-bold">Explore Temp Mail Guides</h3>

                            {/* Core Pages */}
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Core</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {internalLinks
                                        .filter(l => l.priority === 'high')
                                        .map(link => (
                                            <Link
                                                key={link.href}
                                                href={`/${locale}${link.href}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                </div>
                            </div>

                            {/* Medium */}
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Popular Features</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {internalLinks
                                        .filter(l => l.priority === 'medium')
                                        .slice(0, 6)
                                        .map(link => (
                                            <Link
                                                key={link.href}
                                                href={`/${locale}${link.href}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                </div>
                            </div>
                        </section>

                        <PopularArticles />

                    </main>
                    <AwardsSection />
                    <AppFooter />
                </div>
            </ThemeProvider>
        </>
    );
}