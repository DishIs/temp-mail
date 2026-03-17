// components/why-section.tsx
import { WhySectionKeys } from '@/lib/i18n-types';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FaCheckCircle, FaStar, FaUser, FaUserShield } from 'react-icons/fa';
import { fetchFromServiceAPI } from '@/lib/api';

// FIX 3: Fetch real domain list server-side so crawlers see actual domain names.
// Previously this section just said "Select above" — zero crawlable content.
async function getAvailableDomains(): Promise<string[]> {
  try {
    // Re-use your existing API; falls back to seed list if it fails
    const res = await fetch('https://www.freecustom.email/api/domains', {
      next: { revalidate: 3600 }, // cache for 1 hour — domains don't change often
    });
    const data = await res.json();
    if (Array.isArray(data?.data)) {
      return data.data
        .filter((d: any) => d.tier === 'free')
        .map((d: any) => d.domain as string)
        .slice(0, 12); // show top 12 free domains
    }
  } catch {
    // silent fallback
  }
  // Hardcoded fallback — these are always visible to crawlers even if API fails
  return ['ditube.info', 'ditmail.info'];
}

export async function WhySection() {
  const t = await getTranslations('WhySection');
  const domains = await getAvailableDomains();

  const features: { key: string; rich: boolean }[] = [
    { key: 'checklist_item1', rich: false },
    { key: 'checklist_item2', rich: false },
    { key: 'checklist_item3', rich: true },
    { key: 'checklist_item4', rich: false },
    { key: 'checklist_item5', rich: false },
    { key: 'checklist_item6', rich: false },
  ];

  const useCases: { key: string; rich: boolean }[] = [
    { key: 'use_case_item1', rich: false },
    { key: 'use_case_item2', rich: false },
    { key: 'use_case_item3', rich: true },
    { key: 'use_case_item4', rich: false },
  ];

  const plans = [
    {
      icon: <FaUser className="text-muted-foreground mt-1" />,
      title: t('updates_item1_title'),
      description: t('updates_item1_desc'),
    },
    {
      icon: <FaUserShield className="text-primary mt-1" />,
      title: t('updates_item2_title'),
      description: t('updates_item2_desc'),
    },
    {
      icon: <FaStar className="text-primary mt-1" />,
      title: t('updates_item3_title'),
      description: t.rich('updates_item3_desc', {
        strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
      }),
    },
  ];

  return (
    <section className="mt-10 space-y-14 pb-12">

      {/* ── 1. SINGLE DEFINITION ─────────────────────────────────────── */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {t('definition_title')}
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t.rich('definition_p', {
            strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
            em: (chunks) => <em>{chunks}</em>,
            link: (chunks) => (
              <Link
                href="/blog/how-to-create-temp-mail"
                className="text-foreground underline underline-offset-2 hover:no-underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>

      {/* ── 2. PLAN TIERS ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {t('updates_title')}
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('updates_p')}
        </p>
        <div className="mt-8 space-y-8">
          {plans.map((plan, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex-shrink-0 text-xl">{plan.icon}</div>
              <div>
                <h3 className="text-base font-medium text-foreground">{plan.title}</h3>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {plan.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. AVAILABLE DOMAINS ─────────────────────────────────────── */}
      {/*
        FIX 3: Domain names are now rendered as crawlable HTML.
        Previously: "Select above, and new domains gets listed regularly." — nothing.
        Now: actual domain names in a visible, crawlable list.
        Google can now index queries like "freecustom email domains"
        and "ditmail temp mail" etc.
      */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {t('domain_list_title')}
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('domain_list_p')}
        </p>
        {domains.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Available temp mail domains">
            {domains.map((domain) => (
              <li key={domain}>
                <span className="inline-flex items-center px-3 py-1.5 rounded-md border border-border bg-muted/20 font-mono text-sm text-foreground/80">
                  @{domain}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          New domains are added regularly. Using a less-known domain reduces the chance of
          it being blocked by sign-up forms.{' '}
          {/*
            FIX 5: Contextual internal link to landing page.
            This passes PageRank from the high-traffic homepage to the landing page.
          */}
          <Link
            href="/temp-mail-for-business"
            className="text-foreground underline underline-offset-2 hover:no-underline"
          >
            Need a custom domain for business?
          </Link>
        </p>
      </div>

      {/* ── 4. COMBINED USE CASES + WHY CHOOSE US ────────────────────── */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {t('combined_section_title')}
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('combined_section_p')}
        </p>

        <h3 className="mt-8 text-sm sm:text-base font-medium text-foreground">
          {t('use_case_title')}
        </h3>
        <ul className="mt-4 space-y-4">
          {useCases.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <FaCheckCircle className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {item.rich
                  ? t.rich(item.key as WhySectionKeys, {
                      strong: (chunks) => (
                        <strong className="text-foreground">{chunks}</strong>
                      ),
                    })
                  : t(item.key as WhySectionKeys)}
              </span>
            </li>
          ))}
        </ul>

        {/*
          FIX 5: Internal links to landing pages embedded in contextual content.
          These pass PageRank from the homepage (~87% of your traffic) to pages
          that currently generate <5% traffic each. This is the #1 way to
          fix the "landing pages underperform" issue without building new backlinks.
        */}
        <div className="mt-8 rounded-lg border border-border bg-muted/10 p-6 space-y-2">
          <p className="text-sm font-medium text-foreground">Popular use cases with detailed guides:</p>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li>
              <Link href="/temp-mail-for-facebook" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                Temp mail for Facebook sign-up →
              </Link>
            </li>
            <li>
              <Link href="/temp-mail-for-instagram" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                Temp mail for Instagram →
              </Link>
            </li>
            <li>
              <Link href="/temp-mail-for-testing" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                Temp mail for developer testing →
              </Link>
            </li>
            <li>
              <Link href="/disposable-email-address" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                Disposable email address guide →
              </Link>
            </li>
            <li>
              <Link href="/throwaway-email" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                Throwaway email explained →
              </Link>
            </li>
            <li>
              <Link href="/fake-email-address" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                Fake email address generator →
              </Link>
            </li>
          </ul>
        </div>

        <h3 className="mt-10 text-sm sm:text-base font-medium text-foreground">
          {t('checklist_title')}
        </h3>
        <ul className="mt-4 space-y-4">
          {features.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <FaCheckCircle className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {item.rich
                  ? t.rich(item.key as WhySectionKeys, {
                      strong: (chunks) => (
                        <strong className="text-foreground">{chunks}</strong>
                      ),
                    })
                  : t(item.key as WhySectionKeys)}
              </span>
            </li>
          ))}
        </ul>
      </div>

    </section>
  );
}