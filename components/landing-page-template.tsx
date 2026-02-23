"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight, Zap, Shield, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "next-intl";
import { LANDING_PAGES } from "@/lib/landing-pages-config";

const INTERNAL_LINKS = LANDING_PAGES.map(page => ({
  href: `/${page.slug}`,
  label: page.slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase()),
  priority: page.priority
}));


interface LandingPageTemplateProps {
  translations: Record<string, string>;
  emailBoxComponent: React.ReactNode;
  slug: string;
}

// Renders generic sections from translation key groups
const renderBulletList = (
  translations: Record<string, string>,
  keyPrefix: string,
  count: number = 6,
  icon?: React.ReactNode
) => {
  const items = [];
  for (let i = 1; i <= count; i++) {
    const key = `${keyPrefix}${i}`;
    if (translations[key]) {
      items.push(
        <li key={i} className="flex items-start gap-2 text-muted-foreground">
          {icon || <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />}
          <span dangerouslySetInnerHTML={{ __html: translations[key] }} />
        </li>
      );
    }
  }
  return items.length > 0 ? <ul className="space-y-2">{items}</ul> : null;
};

const renderStepList = (
  translations: Record<string, string>,
  keyPrefix: string,
  count: number = 5
) => {
  const items = [];
  for (let i = 1; i <= count; i++) {
    const key = `${keyPrefix}${i}`;
    if (translations[key]) {
      items.push(
        <li key={i} className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
            {i}
          </span>
          <span className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: translations[key] }} />
        </li>
      );
    }
  }
  return items.length > 0 ? <ol className="space-y-3">{items}</ol> : null;
};


// Comparison table renderer (for competitor pages)
const renderComparisonTable = (translations: Record<string, string>) => {
  if (!translations["col1"]) return null;

  const rows = [];
  for (let i = 1; i <= 5; i++) {
    const rowKey = `row${i}f`;
    if (translations[rowKey]) {
      rows.push({
        feature: translations[rowKey],
        us: translations[`row${i}a`] || "",
        them: translations[`row${i}b`] || "",
      });
    }
  }

  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 font-semibold">{translations["col1"]}</th>
            <th className="text-left p-3 font-semibold text-green-600 dark:text-green-400">
              {translations["col2"]}
            </th>
            <th className="text-left p-3 font-semibold text-muted-foreground">
              {translations["col3"]}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
              <td className="p-3 font-medium">{row.feature}</td>
              <td className="p-3 text-green-600 dark:text-green-400 font-medium">
                ✓ {row.us}
              </td>
              <td className="p-3 text-muted-foreground">{row.them}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Section block component
const Section = ({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`space-y-3 ${className}`}>
    {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
    {children}
  </div>
);

// FAQ item component
const FaqItem = ({ question, answer }: { question: string; answer: string }) => (
  <div className="border border-border rounded-lg p-4 space-y-2">
    <h3 className="font-semibold text-foreground">{question}</h3>
    <p className="text-sm text-muted-foreground">{answer}</p>
  </div>
);

export function LandingPageTemplate({
  translations: t,
  emailBoxComponent,
  slug,
}: LandingPageTemplateProps) {
  const locale = useLocale();


const linksToShow = INTERNAL_LINKS
  .filter(l => !l.href.includes(slug)) // exclude current page
  .sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  })
  .slice(0, 14); // ideal count


  // Collect FAQ items
  const faqItems = [];
  for (let i = 1; i <= 5; i++) {
    if (t[`faq${i}q`] && t[`faq${i}a`]) {
      faqItems.push({ q: t[`faq${i}q`], a: t[`faq${i}a`] });
    }
  }

  // Detect which section groups exist
  const hasBullets = (prefix: string) => !!t[`${prefix}1`];
  const hasAll = (...keys: string[]) => keys.every(k => !!t[k]);

  return (
    <div className="space-y-8">
      {/* Hero Section - Above the fold */}
      <div className="text-center space-y-3 pt-4">
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-xs uppercase tracking-wider">
            Free Temp Mail
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
          {t["h1"]}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          {t["intro"]}
        </p>
      </div>

      {/* EmailBox Tool - Embedded immediately */}
      <div id="email-tool">{emailBoxComponent}</div>

      {/* Content Sections Below the Tool */}
      <div className="bg-white dark:bg-black border dark:border-gray-700 rounded-lg p-6 sm:p-8 space-y-8">

        {/* Dynamic content sections - rendered based on available translation keys */}

        {/* What Is / Definition section */}
        {hasAll("whatIsTitle") && (
          <Section title={t["whatIsTitle"]}>
            <p className="text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t["whatIsBody"] || "" }} />
          </Section>
        )}

        {hasAll("definitionTitle") && (
          <Section title={t["definitionTitle"]}>
            <p className="text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t["definitionBody"] || "" }} />
          </Section>
        )}

        {/* Why Use section */}
        {hasAll("whyUseTitle") && (
          <Section title={t["whyUseTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["whyUseBody"]}</p>
          </Section>
        )}

        {hasAll("whyTitle") && (
          <Section title={t["whyTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["whyBody"]}</p>
          </Section>
        )}

        {/* Benefits / Features list */}
        {(hasAll("benefitsTitle") || hasBullets("benefit")) && (
          <Section title={t["benefitsTitle"]}>
            {renderBulletList(t, "benefit")}
          </Section>
        )}

        {(hasAll("featuresTitle") || hasBullets("feature")) && (
          <Section title={t["featuresTitle"]}>
            {renderBulletList(t, "feature")}
          </Section>
        )}

        {/* Free features */}
        {(hasAll("whatYouGetTitle") || hasBullets("freeFeature")) && (
          <Section title={t["whatYouGetTitle"]}>
            {renderBulletList(t, "freeFeature")}
          </Section>
        )}

        {/* Forever Free / Ad Free sections */}
        {hasAll("foreverFreeTitle") && (
          <Section title={t["foreverFreeTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["foreverFreeBody"]}</p>
          </Section>
        )}

        {hasAll("adFreeTitle") && (
          <Section title={t["adFreeTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["adFreeBody"]}</p>
          </Section>
        )}

        {hasAll("speedTitle") && (
          <Section title={t["speedTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["speedBody"]}</p>
          </Section>
        )}

        {hasAll("howWeDoItTitle") && (
          <Section title={t["howWeDoItTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["howWeDoItBody"]}</p>
          </Section>
        )}

        {/* Spam protection */}
        {hasAll("spamProtectionTitle") && (
          <Section title={t["spamProtectionTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["spamProtectionBody"]}</p>
          </Section>
        )}

        {/* Privacy sections */}
        {hasAll("privacyTitle") && (
          <Section title={t["privacyTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["privacyBody"]}</p>
          </Section>
        )}

        {(hasAll("privacyThreatsTitle") || hasBullets("privacyThreat")) && (
          <Section title={t["privacyThreatsTitle"]}>
            {renderBulletList(t, "privacyThreat")}
          </Section>
        )}

        {hasAll("ourApproachTitle") && (
          <Section title={t["ourApproachTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["ourApproachBody"]}</p>
          </Section>
        )}

        {(hasAll("trackingTitle")) && (
          <Section title={t["trackingTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["trackingBody"]}</p>
          </Section>
        )}

        {(hasAll("securityTitle") || hasBullets("securityItem")) && (
          <Section title={t["securityTitle"]}>
            <p className="text-muted-foreground leading-relaxed mb-3">{t["securityBody"]}</p>
            {renderBulletList(t, "securityItem")}
          </Section>
        )}

        {/* Use cases */}
        {(hasAll("useCasesTitle") || hasBullets("useCase")) && (
          <Section title={t["useCasesTitle"]}>
            {renderBulletList(t, "useCase")}
          </Section>
        )}

        {(hasAll("signupUseCasesTitle") || hasBullets("signupUseCase")) && (
          <Section title={t["signupUseCasesTitle"]}>
            {renderBulletList(t, "signupUseCase")}
          </Section>
        )}

        {/* How to use steps */}
        {(hasAll("howToUseTitle") || hasBullets("howToStep")) && (
          <Section title={t["howToUseTitle"]}>
            {renderStepList(t, "howToStep")}
          </Section>
        )}

        {(hasAll("howItWorksTitle")) && (
          <Section title={t["howItWorksTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["howItWorksBody"]}</p>
          </Section>
        )}

        {/* Setup steps */}
        {(hasAll("setupTitle") || hasBullets("setupStep")) && (
          <Section title={t["setupTitle"]}>
            {renderStepList(t, "setupStep", 3)}
          </Section>
        )}

        {/* Customization */}
        {(hasAll("customizationTitle") || hasBullets("customization")) && (
          <Section title={t["customizationTitle"]}>
            {renderBulletList(t, "customization", 4)}
          </Section>
        )}

        {/* Pro features */}
        {(hasAll("proFeaturesTitle") || hasBullets("proFeature")) && (
          <Section title={t["proFeaturesTitle"]}>
            {renderBulletList(t, "proFeature", 6, <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />)}
          </Section>
        )}

        {/* Specific features */}
        {hasAll("customPrefixTitle") && (
          <Section title={t["customPrefixTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["customPrefixBody"]}</p>
          </Section>
        )}

        {hasAll("customDomainTitle") && (
          <Section title={t["customDomainTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["customDomainBody"]}</p>
          </Section>
        )}

        {hasAll("websocketTitle") && (
          <Section title={t["websocketTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["websocketBody"]}</p>
          </Section>
        )}

        {(hasAll("performanceTitle") || hasBullets("perf")) && (
          <Section title={t["performanceTitle"]}>
            {renderBulletList(t, "perf", 4, <Zap className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />)}
          </Section>
        )}

        {/* Security measures */}
        {/* {(hasAll("securityMeasuresTitle") || hasBullets("measure")) && (
          <Section title={t["securityMeasuresTitle"]}>
            {renderBulletList(t, "measure", 6, <Shield className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />)}
          </Section>
        )} */}

        {(hasAll("threatModelTitle") || hasBullets("threatModel")) && (
          <Section title={t["threatModelTitle"]}>
            {renderBulletList(t, "threatModel", 4)}
          </Section>
        )}

        {/* Comparison table for competitor pages */}
        {hasAll("comparisonTitle") && (
          <Section title={t["comparisonTitle"]}>
            {renderComparisonTable(t)}
          </Section>
        )}

        {hasAll("whySwitchTitle") && (
          <Section title={t["whySwitchTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["whySwitchBody"]}</p>
          </Section>
        )}

        {/* Problems / Solutions (comparison pages) */}
        {(hasAll("problemsTitle") || hasBullets("problem")) && (
          <Section title={t["problemsTitle"]}>
            {renderBulletList(t, "problem", 4)}
          </Section>
        )}

        {(hasAll("ourSolutionTitle") || hasBullets("solution")) && (
          <Section title={t["ourSolutionTitle"]}>
            {renderBulletList(t, "solution", 4)}
          </Section>
        )}

        {/* Services comparison (best services page) */}
        {hasAll("servicesTitle") && (
          <Section title={t["servicesTitle"]}>
            <div className="space-y-4">
              {[1, 2, 3].map(i => t[`service${i}Name`] ? (
                <div key={i} className="border border-border rounded-lg p-4">
                  <div className="font-semibold text-foreground mb-1 flex items-center gap-2">
                    {i === 1 && <Badge variant="default" className="text-xs">Our Pick</Badge>}
                    {t[`service${i}Name`]}
                  </div>
                  {t[`service${i}Pro`] && <p className="text-sm text-green-600 dark:text-green-400">✓ {t[`service${i}Pro`]}</p>}
                  {t[`service${i}Con`] && <p className="text-sm text-muted-foreground">✗ {t[`service${i}Con`]}</p>}
                </div>
              ) : null)}
            </div>
          </Section>
        )}

        {hasAll("verdictTitle") && (
          <Section title={t["verdictTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["verdictBody"]}</p>
          </Section>
        )}

        {/* Privacy levels */}
        {(hasAll("choicesTitle") || hasBullets("privacyLevel")) && (
          <Section title={t["choicesTitle"]}>
            {renderBulletList(t, "privacyLevel", 3)}
          </Section>
        )}

        {/* No account section */}
        {hasAll("noAccountTitle") && (
          <Section title={t["noAccountTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["noAccountBody"]}</p>
          </Section>
        )}

        {/* Best practices */}
        {(hasAll("bestPracticesTitle") || hasBullets("bestPractice")) && (
          <Section title={t["bestPracticesTitle"]}>
            {renderBulletList(t, "bestPractice", 5)}
          </Section>
        )}

        {/* Limits section */}
        {hasAll("limitsTitle") && (
          <Section title={t["limitsTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["limitsBody"]}</p>
          </Section>
        )}

        {/* Developer / Test types */}
        {(hasAll("testingChallengesTitle") || hasBullets("challenge")) && (
          <Section title={t["testingChallengesTitle"]}>
            {renderBulletList(t, "challenge", 4)}
          </Section>
        )}

        {(hasAll("testTypesTitle") || hasBullets("testType")) && (
          <Section title={t["testTypesTitle"]}>
            {renderBulletList(t, "testType", 4)}
          </Section>
        )}

        {/* Platform-specific */}
        {hasAll("discordVerificationTitle") && (
          <Section title={t["discordVerificationTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["discordVerificationBody"]}</p>
          </Section>
        )}

        {(hasAll("discordUseCasesTitle") || hasBullets("discordUseCase")) && (
          <Section title={t["discordUseCasesTitle"]}>
            {renderBulletList(t, "discordUseCase", 4)}
          </Section>
        )}

        {hasAll("metaTrackingTitle") && (
          <Section title={t["metaTrackingTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["metaTrackingBody"]}</p>
          </Section>
        )}

        {(hasAll("instagramUseCasesTitle") || hasBullets("instagramUseCase")) && (
          <Section title={t["instagramUseCasesTitle"]}>
            {renderBulletList(t, "instagramUseCase", 4)}
          </Section>
        )}

        {hasAll("telegramEmailTitle") && (
          <Section title={t["telegramEmailTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["telegramEmailBody"]}</p>
          </Section>
        )}

        {(hasAll("telegramUseCasesTitle") || hasBullets("telegramUseCase")) && (
          <Section title={t["telegramUseCasesTitle"]}>
            {renderBulletList(t, "telegramUseCase", 3)}
          </Section>
        )}

        {/* OTP */}
        {hasAll("otpExplainerTitle") && (
          <Section title={t["otpExplainerTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["otpExplainerBody"]}</p>
          </Section>
        )}

        {hasAll("smartOtpTitle") && (
          <Section title={t["smartOtpTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["smartOtpBody"]}</p>
          </Section>
        )}

        {(hasAll("otpUseCasesTitle") || hasBullets("otpUseCase")) && (
          <Section title={t["otpUseCasesTitle"]}>
            {renderBulletList(t, "otpUseCase", 4)}
          </Section>
        )}

        {/* Verification */}
        {hasAll("howVerificationWorksTitle") && (
          <Section title={t["howVerificationWorksTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["howVerificationWorksBody"]}</p>
          </Section>
        )}

        {(hasAll("verificationTypesTitle") || hasBullets("verificationType")) && (
          <Section title={t["verificationTypesTitle"]}>
            {renderBulletList(t, "verificationType", 4)}
          </Section>
        )}

        {(hasAll("tipsTitle") || hasBullets("tip")) && (
          <Section title={t["tipsTitle"]}>
            {renderBulletList(t, "tip", 4)}
          </Section>
        )}

        {/* Instant / Fast / Regenerate */}
        {(hasAll("instantFeaturesTitle") || hasBullets("instantFeature")) && (
          <Section title={t["instantFeaturesTitle"]}>
            {renderBulletList(t, "instantFeature", 3, <Zap className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />)}
          </Section>
        )}

        {hasAll("regenerateTitle") && (
          <Section title={t["regenerateTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["regenerateBody"]}</p>
          </Section>
        )}

        {/* Disposable vs Permanent */}
        {hasAll("disposableVsPermanentTitle") && (
          <Section title={t["disposableVsPermanentTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["disposableVsPermanentBody"]}</p>
          </Section>
        )}

        {/* Free vs Paid */}
        {hasAll("freeVsPaidTitle") && (
          <Section title={t["freeVsPaidTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["freeVsPaidBody"]}</p>
          </Section>
        )}

        {/* Privacy first */}
        {hasAll("privacyFirstTitle") && (
          <Section title={t["privacyFirstTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["privacyFirstBody"]}</p>
          </Section>
        )}

        {/* Criteria */}
        {(hasAll("criteriaTitle") || hasBullets("criterion")) && (
          <Section title={t["criteriaTitle"]}>
            {renderBulletList(t, "criterion", 4)}
          </Section>
        )}

        {/* Problem (singular) */}
        {hasAll("problemTitle") && (
          <Section title={t["problemTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["problemBody"]}</p>
          </Section>
        )}

        {/* Developer solutions */}
        {[1, 2, 3].map(i => t[`solution${i}Title`] ? (
          <Section key={i} title={t[`solution${i}Title`]}>
            <p className="text-muted-foreground leading-relaxed">{t[`solution${i}Body`]}</p>
          </Section>
        ) : null)}

        {/* API */}
        {hasAll("whatItDoesTitle") && (
          <Section title={t["whatItDoesTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["whatItDoesBody"]}</p>
          </Section>
        )}

        {(hasAll("useCasesTitle") || hasBullets("useCase")) && !hasAll("whatItDoesTitle") && null}

        {hasAll("exampleTitle") && (
          <Section title={t["exampleTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["exampleBody"]}</p>
            <div className="bg-muted/50 rounded-md p-4 font-mono text-xs overflow-x-auto">
              <span className="text-green-600 dark:text-green-400">GET</span>
              {" /api/private-mailbox?fullMailboxId="}
              <span className="text-blue-500">your-test@yourdomain.com</span>
              <br />
              <span className="text-muted-foreground">Authorization: Bearer YOUR_API_KEY</span>
            </div>
          </Section>
        )}

        {hasAll("docsTitle") && (
          <Section title={t["docsTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["docsBody"]}</p>
            <Link href="/api-docs" className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium">
              View API Documentation <ArrowRight className="w-3 h-3" />
            </Link>
          </Section>
        )}

        {/* Twitter-specific */}
        {hasAll("twitterXTitle") && (
          <Section title={t["twitterXTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["twitterXBody"]}</p>
          </Section>
        )}

        {/* Reddit-specific */}
        {hasAll("redditPrivacyTitle") && (
          <Section title={t["redditPrivacyTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["redditPrivacyBody"]}</p>
          </Section>
        )}

        {(hasAll("redditUseCasesTitle") || hasBullets("redditUseCase")) && (
          <Section title={t["redditUseCasesTitle"]}>
            {renderBulletList(t, "redditUseCase", 4)}
          </Section>
        )}

        {/* Facebook-specific */}
        {(hasAll("useCasesTitle") || hasBullets("facebookUseCase")) && false && null}

        {/* Speed */}
        {hasAll("speedTitle") && !hasAll("adFreeTitle") && (
          <Section title={t["speedTitle"]}>
            <p className="text-muted-foreground leading-relaxed">{t["speedBody"]}</p>
          </Section>
        )}

        {/* FAQ Section */}
        {faqItems.length > 0 && (
          <Section title={t["faqTitle"] || "Frequently Asked Questions"}>
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <FaqItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </Section>
        )}

        {/* CTA Section */}
        {t["ctaTitle"] && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center space-y-3">
            <h2 className="text-xl font-bold">{t["ctaTitle"]}</h2>
            <p className="text-muted-foreground">{t["ctaBody"]}</p>
          </div>
        )}

        {/* Internal Links */}
        {/* INTERNAL LINKS (locale-aware) */}
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Related Services
          </h3>

          <div className="flex flex-wrap gap-2">
            {linksToShow.map((l) => (
              <Link
                key={l.href}
                href={`/${locale}${l.href}`}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}