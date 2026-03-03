import { WhySectionKeys } from '@/lib/i18n-types';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FaCheckCircle, FaStar, FaUser, FaUserShield } from 'react-icons/fa';

export async function WhySection() {
  const t = await getTranslations('WhySection');

  // Define items with a flag to indicate if they need rich text rendering
  const features = [
    { key: 'checklist_item1', rich: false },
    { key: 'checklist_item2', rich: false },
    { key: 'checklist_item3', rich: true }, // Contains <strong>
    { key: 'checklist_item4', rich: false },
    { key: 'checklist_item5', rich: false },
    { key: 'checklist_item6', rich: false },
  ];
  const useCases = [
    { key: 'use_case_item1', rich: false },
    { key: 'use_case_item2', rich: false },
    { key: 'use_case_item3', rich: true }, // Contains <strong>
    { key: 'use_case_item4', rich: false }
  ];

  const updates = [
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
        strong: (chunks) => <strong className="text-foreground">{chunks}</strong>
      }),
    },
  ];

  const domains = [
    'areureally.info', 'ditapi.info', 'ditcloud.info', 'ditdrive.info', 
    'ditgame.info', 'ditlearn.info', 'ditpay.info', 'ditplay.info', 
    'ditube.info', 'junkstopper.info'
  ];

  return (
    <section className="space-y-14 pb-12">
      {/* Snippet / Intro */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {t('snippet_title')}
        </h2>
        <p
          className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: t.raw('snippet_p') }}
        ></p>
      </div>

      {/* Domain List */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {t('domain_list_title')}
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('domain_list_p')}
        </p>
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
          {domains.map(domain => (
            <li key={domain} className="flex items-center gap-2">
               <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
               {domain}
            </li>
          ))}
        </ul>
      </div>

      {/* Updates / Features */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {t('updates_title')}
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('updates_p')}
        </p>
        <div className="mt-8 space-y-8">
          {updates.map((update, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex-shrink-0 text-xl">{update.icon}</div>
              <div>
                <h3 className="text-base font-medium text-foreground">
                  {update.title}
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  {update.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Definition */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {t('definition_title')}
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t.rich('definition_p', {
            strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
            em: (chunks) => <em>{chunks}</em>,
            link: (chunks) => <Link href="/blog/how-to-create-temp-mail" className="text-foreground underline underline-offset-2 hover:no-underline">{chunks}</Link>
          })}
        </p>
      </div>
      
      {/* Use Cases */}
      <div>
        <h3 className="text-sm sm:text-base font-medium text-foreground">
          {t('use_case_title')}
        </h3>
        <ul className="mt-6 space-y-4">
          {useCases.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <FaCheckCircle className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {item.rich ? t.rich(item.key as WhySectionKeys, {
                  strong: (chunks) => <strong className="text-foreground">{chunks}</strong>
                }) : t(item.key as WhySectionKeys)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Checklist */}
      <div>
        <h3 className="text-sm sm:text-base font-medium text-foreground">
          {t('checklist_title')}
        </h3>
        <ul className="mt-6 space-y-4">
          {features.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <FaCheckCircle className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {item.rich ? t.rich(item.key as WhySectionKeys, {
                  strong: (chunks) => <strong className="text-foreground">{chunks}</strong>
                }) : t(item.key as WhySectionKeys)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm sm:text-base text-muted-foreground leading-relaxed"
           dangerouslySetInnerHTML={{ __html: t.raw('checklist_p') }}>
        </p>
      </div>

      {/* Usage */}
       <div>
        <h3 className="text-sm sm:text-base font-medium text-foreground">
          {t('usage_title')}
        </h3>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t.rich('usage_p1', {
            strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
            link: (chunks) => <Link href="/blog/how-to-create-temp-mail" className="text-foreground underline underline-offset-2 hover:no-underline">{chunks}</Link>
          })}
        </p>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('usage_p2')}
        </p>
      </div>

      {/* Conclusion */}
      <div>
        <h3 className="text-sm sm:text-base font-medium text-foreground">
          {t('conclusion_title')}
        </h3>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t('conclusion_p1')}
        </p>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t.rich('conclusion_p2', {
            link: (chunks) => <Link href="/blog/best-practices-for-using-temp-mail" className="text-foreground underline underline-offset-2 hover:no-underline">{chunks}</Link>
          })}
        </p>
      </div>
    </section>
  );
}