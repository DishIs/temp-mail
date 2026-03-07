// components/why-section.tsx
// SEO REWRITE — Key changes:
//  1. Removed duplicate "What is temp mail" + "What is disposable email" sections
//     → ONE clean definition block. Google penalises repeat definitions on same page.
//  2. Merged checklist + use cases into a single section with a proper H2
//  3. Replaced the "delivers on all fronts, versatile solution" sentence with real copy
//  4. H2/H3 hierarchy is now consistent and meaningful for crawlers
//  5. "Definition" section moved UP so it reads as a natural intro before features
//  6. Removed "Usage" and "Conclusion" sections — repetitive content that adds
//     no ranking value and dilutes topical focus

import { WhySectionKeys } from '@/lib/i18n-types';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FaCheckCircle, FaStar, FaUser, FaUserShield } from 'react-icons/fa';

export async function WhySection() {
  const t = await getTranslations('WhySection');

  const features = [
    { key: 'checklist_item1', rich: false },
    { key: 'checklist_item2', rich: false },
    { key: 'checklist_item3', rich: true },
    { key: 'checklist_item4', rich: false },
    { key: 'checklist_item5', rich: false },
    { key: 'checklist_item6', rich: false },
  ];

  const useCases = [
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

      {/*
        ── 1. SINGLE DEFINITION ────────────────────────────────────────────
        One clean explanation of what temp mail is.
        Previously there were TWO definition sections ("snippet" + "definition").
        Google's crawlers see repeated definitions as thin/padding content.
      */}
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

      {/*
        ── 2. PLAN TIERS ───────────────────────────────────────────────────
        Good differentiated content — kept and promoted to H2.
        Previously buried as "From Anonymous Use to Pro Power" with an H2
        that didn't signal plan comparison to Google.
      */}
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

      {/*
        ── 3. AVAILABLE DOMAINS ────────────────────────────────────────────
        Concrete, unique content — no other site has this exact list.
        Good for long-tail queries like "freecustom email domains".
      */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {t('domain_list_title')}
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('domain_list_p')}
        </p>
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
          Select above, and new domains gets listed regularly.
        </ul>
      </div>

      {/*
        ── 4. COMBINED USE CASES + WHY CHOOSE US ──────────────────────────
        Previously these were two separate lists ("Why Use Custom Temp Mail"
        and "How to Choose the Best Temp Mail Service") with near-identical
        framing. Merged into one section. Half the content, twice the clarity.
        The removed "checklist_p" sentence ("delivers on all fronts...") is
        NOT included — it was SEO filler with zero meaning.
      */}
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