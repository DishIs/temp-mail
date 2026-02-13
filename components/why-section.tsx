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
      icon: <FaUser className="text-gray-500 mt-1" />,
      title: t('updates_item1_title'),
      description: t('updates_item1_desc'),
    },
    {
      icon: <FaUserShield className="text-blue-500 mt-1" />,
      title: t('updates_item2_title'),
      description: t('updates_item2_desc'),
    },
    {
      icon: <FaStar className="text-amber-500 mt-1" />,
      title: t('updates_item3_title'),
      description: t.rich('updates_item3_desc', {
        strong: (chunks) => <strong>{chunks}</strong>
      }),
    },
  ];

  const domains = [
    'areureally.info', 'ditapi.info', 'ditcloud.info', 'ditdrive.info', 
    'ditgame.info', 'ditlearn.info', 'ditpay.info', 'ditplay.info', 
    'ditube.info', 'junkstopper.info'
  ];

  return (
    <section className="space-y-12 pb-10">
      {/* Snippet / Intro */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
          {t('snippet_title')}
        </h2>
        <p
          className="mt-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: t.raw('snippet_p') }}
        ></p>
      </div>

      {/* Domain List */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
          {t('domain_list_title')}
        </h2>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          {t('domain_list_p')}
        </p>
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
          {domains.map(domain => (
            <li key={domain} className="flex items-center">
               <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
               {domain}
            </li>
          ))}
        </ul>
      </div>

      {/* Updates / Features */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
          {t('updates_title')}
        </h2>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          {t('updates_p')}
        </p>
        <div className="mt-8 space-y-8">
          {updates.map((update, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex-shrink-0 text-xl">{update.icon}</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {update.title}
                </h3>
                <p className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                  {update.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Definition */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
          {t('definition_title')}
        </h2>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          {t.rich('definition_p', {
            strong: (chunks) => <strong>{chunks}</strong>,
            em: (chunks) => <em>{chunks}</em>,
            link: (chunks) => <Link href="/blog/how-to-create-temp-mail" className="text-blue-600 hover:underline dark:text-blue-400">{chunks}</Link>
          })}
        </p>
      </div>
      
      {/* Use Cases */}
      <div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {t('use_case_title')}
        </h3>
        <ul className="mt-6 space-y-4">
          {useCases.map((item, i) => (
            <li key={i} className="flex items-start">
              <FaCheckCircle className="text-green-500 mt-1.5 mr-3 flex-shrink-0" />
              <span className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.rich ? t.rich(item.key as WhySectionKeys, {
                  strong: (chunks) => <strong>{chunks}</strong>
                }) : t(item.key as WhySectionKeys)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Checklist */}
      <div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {t('checklist_title')}
        </h3>
        <ul className="mt-6 space-y-4">
          {features.map((item, i) => (
            <li key={i} className="flex items-start">
              <FaCheckCircle className="text-green-500 mt-1.5 mr-3 flex-shrink-0" />
              <span className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.rich ? t.rich(item.key as WhySectionKeys, {
                  strong: (chunks) => <strong>{chunks}</strong>
                }) : t(item.key as WhySectionKeys)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-lg text-gray-700 dark:text-gray-300 leading-relaxed"
           dangerouslySetInnerHTML={{ __html: t.raw('checklist_p') }}>
        </p>
      </div>

      {/* Usage */}
       <div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {t('usage_title')}
        </h3>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          {t.rich('usage_p1', {
            strong: (chunks) => <strong>{chunks}</strong>,
            link: (chunks) => <Link href="/blog/how-to-create-temp-mail" className="text-blue-600 hover:underline dark:text-blue-400">{chunks}</Link>
          })}
        </p>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          {t('usage_p2')}
        </p>
      </div>

      {/* Conclusion */}
      <div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {t('conclusion_title')}
        </h3>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          {t('conclusion_p1')}
        </p>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          {t.rich('conclusion_p2', {
            link: (chunks) => <Link href="/blog/best-practices-for-using-temp-mail" className="text-blue-600 hover:underline dark:text-blue-400">{chunks}</Link>
          })}
        </p>
      </div>
    </section>
  );
}