import { notFound } from "next/navigation";
import { fetchFromServiceAPI } from "@/lib/api";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { EmailBox } from "@/components/email-box";
import { LandingPageTemplate } from "@/components/landing-page-template";
import { getPageConfig } from "@/lib/landing-pages-config";
import { AwardsSection } from "@/components/AwardsSection";
import Script from "next/script";
import { auth } from "@/auth";

// Fix for 500 Error: Provide the next-intl context manually for shared components
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import enMessages from "@/messages/landing-page-content.json";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

const SITE_URL = "https://www.freecustom.email";

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

export async function generateMetadata({ params }: Props) {
  const { slug } = params;

  const pageConfig = getPageConfig(slug);
  if (!pageConfig) return {};

  const t = (enMessages.LandingPages as any)[pageConfig.translationKey];
  if (!t) return {};

  const url = `${SITE_URL}/${slug}`;

  return {
    title: t.metaTitle || `${slug.replace(/-/g, ' ')}`,
    description: t.metaDescription || "",
    keywords: `temp mail, ${slug.replace(/-/g, " ")}, disposable email, temporary email`,
    alternates: { canonical: url },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      url,
      locale: "en",
      type: "website",
      images: [{ url: `${SITE_URL}/logo.webp`, alt: "FreeCustom.Email" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.metaTitle,
      description: t.metaDescription,
      images: [`${SITE_URL}/logo.webp`],
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { slug } = params;
  
  // Set locale for any Server Components relying on next-intl
  setRequestLocale('en');

  const pageConfig = getPageConfig(slug);
  if (!pageConfig) notFound();

  const session = await auth();

  let customDomains: any[] = [];
  let userInboxes: string[] = [];
  let currentInbox: string | null = null;

  if (session?.user?.id) {
    try {
      const profileData = await fetchFromServiceAPI(`/user/profile/${session.user.id}`);
      if (profileData.success && profileData.user) {
        const { user } = profileData;
        if (user.plan === "pro" && Array.isArray(user.customDomains)) {
          customDomains = user.customDomains;
        }
        if (Array.isArray(user.inboxes)) {
          userInboxes = user.inboxes;
          if (userInboxes.length > 0) currentInbox = userInboxes[0];
        }
      }
    } catch (error) {
      console.error("Profile fetch failed:", error);
    }
  }

  const translations = (enMessages.LandingPages as any)[pageConfig.translationKey] || {};

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FreeCustom.Email",
    url: `${SITE_URL}/${slug}`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    description: translations.metaDescription || "Free temporary email generator. Create disposable or dummy email addresses instantly.",
    image: `${SITE_URL}/logo.webp`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    potentialAction: { "@type": "UseAction", target: `${SITE_URL}/${slug}` }
  };

  const emailBox = (
    <EmailBox
      initialSession={session}
      initialCustomDomains={customDomains}
      initialInboxes={userInboxes}
      initialCurrentInbox={currentInbox}
    />
  );

  return (
    <>
      <Script
        id="jsonld-landing"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-screen max-w-[100vw] bg-background text-foreground overflow-x-hidden">
            
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

            <main className="relative z-10">
              <LandingPageTemplate
                translations={translations}
                emailBoxComponent={emailBox}
                slug={slug}
              />
            </main>

            <AwardsSection />
            <AppFooter />
          </div>
        </ThemeProvider>
      </NextIntlClientProvider>
    </>
  );
}