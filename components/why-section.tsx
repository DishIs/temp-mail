import { WhySectionKeys } from '@/lib/i18n-types';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FaCheckCircle, FaStar, FaUser, FaUserShield } from 'react-icons/fa';

export async function WhySection() {
  const t = await getTranslations('WhySection');

  // REVISED: Define items with a flag to indicate if they need rich text rendering
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
      icon: <FaUser className="text-gray-500" />,
      title: t('updates_item1_title'),
      description: t('updates_item1_desc'),
    },
    {
      icon: <FaUserShield className="text-blue-500" />,
      title: t('updates_item2_title'),
      description: t('updates_item2_desc'),
    },
    {
      icon: <FaStar className="text-amber-500" />,
      title: t('updates_item3_title'),
      description: t.rich('updates_item3_desc', {
        strong: (chunks) => <strong>{chunks}</strong>
      }),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="bg-white dark:bg-black border dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
          {t('snippet_title')}
        </h2>
        <p
          className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: t.raw('snippet_p') }}
        ></p>
      </div>

      <div className="bg-white dark:bg-black border dark:border-gray-700 p-6 rounded-lg">
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{t('domain_list_title')}</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{t('domain_list_p')}</p>
        <ul className="mt-4 list-disc pl-5 text-gray-700 dark:text-gray-200 space-y-1">
          {['areureally.info', 'ditapi.info', 'ditcloud.info', 'ditdrive.info', 'ditgame.info', 'ditlearn.info', 'ditpay.info', 'ditplay.info', 'ditube.info', 'junkstopper.info'].map(domain => (
            <li key={domain}>{domain}</li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-black border dark:border-gray-700 p-6 rounded-lg">
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{t('updates_title')}</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{t('updates_p')}</p>
        <div className="mt-6 space-y-4">
          {updates.map((update, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-md border dark:border-gray-800">
              <div className="flex-shrink-0 mt-1">{update.icon}</div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">{update.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{update.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-black border dark:border-gray-700 p-6 rounded-lg">
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{t('definition_title')}</h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">
          {t.rich('definition_p', {
            strong: (chunks) => <strong>{chunks}</strong>,
            em: (chunks) => <em>{chunks}</em>,
            link: (chunks) => <Link href="/blog/how-to-create-temp-mail" className="text-blue-600 underline dark:text-blue-400">{chunks}</Link>
          })}
        </p>
      </div>
      
      <div className="bg-white dark:bg-black border dark:border-gray-700 p-6 rounded-lg">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('use_case_title')}</h3>
        <ul className="mt-4 space-y-3">
          {/* --- REVISED: Conditional rendering to fix TS error --- */}
          {useCases.map((item, i) => (
            <li key={i} className="flex items-start">
              <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span className="dark:text-gray-200">
                {item.rich ? t.rich(item.key as WhySectionKeys, {
                  strong: (chunks) => <strong>{chunks}</strong>
                }) : t(item.key as WhySectionKeys)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-black border dark:border-gray-700 p-6 rounded-lg">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('checklist_title')}</h3>
        <ul className="mt-4 space-y-3">
          {/* --- REVISED: Conditional rendering to fix TS error --- */}
          {features.map((item, i) => (
            <li key={i} className="flex items-start dark:text-gray-200">
              <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              {item.rich ? t.rich(item.key as WhySectionKeys, {
                strong: (chunks) => <strong>{chunks}</strong>
              }) : t(item.key as WhySectionKeys)}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed"
           dangerouslySetInnerHTML={{ __html: t.raw('checklist_p') }}>
        </p>
      </div>

       <div className="bg-white dark:bg-black border dark:border-gray-700 p-6 rounded-lg">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('usage_title')}</h3>
        <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">
          {t.rich('usage_p1', {
            strong: (chunks) => <strong>{chunks}</strong>,
            link: (chunks) => <Link href="/blog/how-to-create-temp-mail" className="text-blue-600 underline dark:text-blue-400">{chunks}</Link>
          })}
        </p>
        <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">{t('usage_p2')}</p>
      </div>

      <div className="bg-white dark:bg-black border dark:border-gray-700 p-6 rounded-lg">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('conclusion_title')}</h3>
        <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">{t('conclusion_p1')}</p>
        <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
          {t.rich('conclusion_p2', {
            link: (chunks) => <Link href="/blog/best-practices-for-using-temp-mail" className="text-blue-600 underline dark:text-blue-400">{chunks}</Link>
          })}
        </p>
      </div>
    </section>
  );
}