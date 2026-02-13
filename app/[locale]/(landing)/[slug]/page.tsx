// app/[locale]/(landing)/[slug]/page.tsx
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { fetchFromServiceAPI } from "@/lib/api";
import { Locale } from "next-intl";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { EmailBox } from "@/components/email-box";
import { LandingPageTemplate } from "@/components/landing-page-template";
import { LANDING_PAGES, LANDING_PAGE_SLUGS, getPageConfig } from "@/lib/landing-pages-config";
import Script from "next/script";

const FREE_DOMAINS = [
  "areueally.info", "ditapi.info", "ditcloud.info", "ditdrive.info",
  "ditgame.info", "ditlearn.info", "ditpay.info", "ditplay.info",
  "ditube.info", "junkstopper.info",
];

type Props = {
  params: { locale: Locale; slug: string };
};

// Generates all static paths for all locales × all slugs
export function generateStaticParams() {
  return LANDING_PAGES.flatMap((page) => [
    { slug: page.slug },
  ]);
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = params;
  const pageConfig = getPageConfig(slug);
  if (!pageConfig) return {};

  // @ts-ignore
  const t = await getTranslations({ locale, namespace: "LandingPages" });
  const pageT = (key: string) => {
    try {
      // @ts-ignore
      return t(`${pageConfig.translationKey}.${key}`);
    } catch {
      return "";
    }
  };

  return {
    title: pageT("metaTitle"),
    description: pageT("metaDescription"),
    keywords: `temp mail, ${slug.replace(/-/g, " ")}, disposable email, temporary email`,
    openGraph: {
      title: pageT("metaTitle"),
      description: pageT("metaDescription"),
      url: `https://www.freecustom.email/${locale}/${slug}`,
      images: [
        {
          url: "https://www.freecustom.email/logo.webp",
          alt: "FreeCustom.Email",
        },
      ],
    },
    alternates: {
      canonical: `https://www.freecustom.email/en/${slug}`,
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { locale, slug } = params;
  setRequestLocale(locale);

  const pageConfig = getPageConfig(slug);
  if (!pageConfig) {
    notFound();
  }

  // Fetch user session and data (same as homepage)
  const session = await getServerSession();
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
      console.error("Failed to fetch user profile on landing page:", error);
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

  // JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FreeCustom.Email",
    url: `https://www.freecustom.email/${locale}/${slug}`,
    description: translations["metaDescription"] || "",
    applicationCategory: "UtilityApplication",
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
        id="json-ld-landing"
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