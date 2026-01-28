import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="bg-muted py-8 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-center text-gray-600 mb-4 sm:mb-0">
            © {new Date().getFullYear()} DishIs Technologies. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 items-center">
            <Link
              href="/blog/privacy-policy"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/blog/terms-of-service"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Contact
            </Link>
            <a
              href="https://github.com/DishIs/temp-mail"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              GitHub Repository
            </a>
            <a
              href="https://rapidapi.com/dishis-technologies-maildrop/api/temp-mail-maildrop1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              For developers: Temp Mail API
            </a>
            <a
              href="https://www.reddit.com/r/FreeCustomEmail/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Reddit Community
            </a>
            <Link
              href="/feedback"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Feedback
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
