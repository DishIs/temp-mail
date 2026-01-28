export function AwardsSection() {
  return (
    <section className="bg-white dark:bg-black py-12 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
          Trust & Recognition
        </h2>
        <div className="flex justify-center gap-4 flex-wrap">
          <a
            href="https://www.goodfirms.co/email-management-software/"
            target="_blank"
            rel="noopener noreferrer"
            title="Top Email Marketing Software"
          >
            <img
              src="https://assets.goodfirms.co/static/goodfirms.svg"
              alt="Top Email Marketing Software"
            />
          </a>
          <a
            href="https://www.scamadviser.com/check-website/freecustom.email"
            target="_blank"
            rel="noopener noreferrer"
            title="100 score on ScamAdvisor.com"
          >
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0mijE9pPNHQ8e4QAlvEpWQTuDeR-hfL95Uw&s"
              alt="Trusted by ScamAdvisor.com"
              className="w-52"
            />
          </a>
        </div>
        
      </div>
    </section>
  );
}
