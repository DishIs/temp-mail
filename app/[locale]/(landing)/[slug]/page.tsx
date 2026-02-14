// app/[locale]/(landing)/[slug]/page.tsx

import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { fetchFromServiceAPI } from "@/lib/api";
import { Locale } from "next-intl";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { EmailBox } from "@/components/email-box";
import { LandingPageTemplate } from "@/components/landing-page-template";
import { LANDING_PAGES, getPageConfig } from "@/lib/landing-pages-config";
import { routing } from "@/i18n/routing";
import Script from "next/script";
import { auth } from "@/auth";

type Props = {
  params: { locale: Locale; slug: string };
};

const SITE_URL = "https://www.freecustom.email";


// ============================
// Static generation (locale × slug)
// ============================

export const dynamicParams = true;
export const revalidate = 86400; // 1 day ISR


// ============================
// Metadata (SEO)
// ============================
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = params;

  const pageConfig = getPageConfig(slug);
  if (!pageConfig) return {};

  const t = await getTranslations({ locale, namespace: "LandingPages" });

  const pageT = (key: string) => {
    try {
      // @ts-ignore
      return t(`${pageConfig.translationKey}.${key}`);
    } catch {
      return "";
    }
  };

  const url = `${SITE_URL}/${locale}/${slug}`;

  // hreflang alternates
  const languages: Record<string, string> = {};
  routing.locales.forEach((loc) => {
    languages[loc] = `${SITE_URL}/${loc}/${slug}`;
  });

  return {
    title: pageT("metaTitle"),
    description: pageT("metaDescription"),
    keywords: `temp mail, ${slug.replace(/-/g, " ")}, disposable email, temporary email`,

    alternates: {
      canonical: url,
      languages,
      "x-default": `${SITE_URL}/en/${slug}`,
    },

    openGraph: {
      title: pageT("metaTitle"),
      description: pageT("metaDescription"),
      url,
      locale,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/logo.webp`,
          alt: "FreeCustom.Email",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: pageT("metaTitle"),
      description: pageT("metaDescription"),
      images: [`${SITE_URL}/logo.webp`],
    },
  };
}


// ============================
// Page
// ============================
export default async function LandingPage({ params }: Props) {
  const { locale, slug } = params;
  setRequestLocale(locale);

  const pageConfig = getPageConfig(slug);
  if (!pageConfig) notFound();

  // ---- Session ----
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

  // Build translations object for this specific page
  // @ts-ignore
  const tNamespace = await getTranslations({ locale, namespace: "LandingPages" });
  const translationKey = pageConfig.translationKey;

  // Extract all translation strings for this page into a flat object
  const translationKeys = [
    "h1", "intro", "metaTitle", "metaDescription",
    // All possible section keys
    "whatIsTitle", "whatIsBody", "definitionTitle", "definitionBody",
    "whyUseTitle", "whyUseBody", "whyTitle", "whyBody",
    "benefitsTitle", "featuresTitle", "whatYouGetTitle",
    "foreverFreeTitle", "foreverFreeBody",
    "adFreeTitle", "adFreeBody",
    "speedTitle", "speedBody",
    "howWeDoItTitle", "howWeDoItBody",
    "spamProtectionTitle", "spamProtectionBody",
    "privacyTitle", "privacyBody",
    "privacyThreatsTitle", "ourApproachTitle", "ourApproachBody",
    "trackingTitle", "trackingBody",
    "securityTitle", "securityBody",
    "securityMeasuresTitle", "threatModelTitle",
    "useCasesTitle", "signupUseCasesTitle",
    "howToUseTitle", "howItWorksTitle", "howItWorksBody",
    "setupTitle", "customizationTitle",
    "proFeaturesTitle",
    "customPrefixTitle", "customPrefixBody",
    "customDomainTitle", "customDomainBody",
    "websocketTitle", "websocketBody",
    "performanceTitle",
    "comparisonTitle", "col1", "col2", "col3",
    "whySwitchTitle", "whySwitchBody",
    "problemsTitle", "ourSolutionTitle",
    "servicesTitle", "verdictTitle", "verdictBody",
    "criteriaTitle",
    "choicesTitle",
    "noAccountTitle", "noAccountBody",
    "bestPracticesTitle",
    "limitsTitle", "limitsBody",
    "testingChallengesTitle", "testTypesTitle",
    "discordVerificationTitle", "discordVerificationBody",
    "discordUseCasesTitle",
    "metaTrackingTitle", "metaTrackingBody",
    "instagramUseCasesTitle",
    "telegramEmailTitle", "telegramEmailBody",
    "telegramUseCasesTitle",
    "otpExplainerTitle", "otpExplainerBody",
    "smartOtpTitle", "smartOtpBody",
    "otpUseCasesTitle",
    "howVerificationWorksTitle", "howVerificationWorksBody",
    "verificationTypesTitle",
    "tipsTitle",
    "instantFeaturesTitle",
    "regenerateTitle", "regenerateBody",
    "disposableVsPermanentTitle", "disposableVsPermanentBody",
    "freeVsPaidTitle", "freeVsPaidBody",
    "privacyFirstTitle", "privacyFirstBody",
    "problemTitle", "problemBody",
    "whatItDoesTitle", "whatItDoesBody",
    "exampleTitle", "exampleBody",
    "docsTitle", "docsBody",
    "redditPrivacyTitle", "redditPrivacyBody",
    "redditUseCasesTitle",
    "faqTitle",
    "ctaTitle", "ctaBody",
    // Numbered items (up to 8 each)
    ...Array.from({ length: 8 }, (_, i) => [
      `benefit${i + 1}`, `freeFeature${i + 1}`, `feature${i + 1}`,
      `useCase${i + 1}`, `signupUseCase${i + 1}`,
      `howToStep${i + 1}`, `setupStep${i + 1}`, `customization${i + 1}`,
      `proFeature${i + 1}`,
      `securityItem${i + 1}`, `privacyThreat${i + 1}`, `measure${i + 1}`,
      `threatModel${i + 1}`, `bestPractice${i + 1}`,
      `privacyLevel${i + 1}`, `criterion${i + 1}`,
      `challenge${i + 1}`, `testType${i + 1}`,
      `otpUseCase${i + 1}`, `verificationType${i + 1}`, `tip${i + 1}`,
      `perf${i + 1}`, `instantFeature${i + 1}`,
      `discordUseCase${i + 1}`, `instagramUseCase${i + 1}`,
      `telegramUseCase${i + 1}`, `redditUseCase${i + 1}`,
      `problem${i + 1}`, `solution${i + 1}`,
      `faq${i + 1}q`, `faq${i + 1}a`,
      // Comparison table rows
      `row${i + 1}f`, `row${i + 1}a`, `row${i + 1}b`,
      // Competitor services
      `service${i + 1}Name`, `service${i + 1}Pro`, `service${i + 1}Con`,
      // Developer solutions
      `solution${i + 1}Title`, `solution${i + 1}Body`,
    ]).flat(),
  ];

  const translations: Record<string, string> = {};
  for (const key of translationKeys) {
    try {
      // @ts-ignore
      const value = tNamespace(`${translationKey}.${key}`);
      if (value && value !== `${translationKey}.${key}`) {
        translations[key] = value;
      }
    } catch {
      // Key doesn't exist for this page — skip
    }
  }

  // ---- Structured data ----
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FreeCustom.Email",
    url: `${SITE_URL}/${locale}/${slug}`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
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

      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen max-w-[100vw] bg-background">
          <AppHeader initialSession={session} />

          <main className="mx-auto max-w-4xl px-4 py-6">
            <LandingPageTemplate
              translations={translations}
              emailBoxComponent={emailBox}
              slug={slug}
            />
          </main>

          <AppFooter />
        </div>
      </ThemeProvider>
    </>
  );
}
