// components/app-footer.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Gift } from "lucide-react";
import { LATEST_CHANGELOG_VERSION } from "@/lib/changelog";
import { WhatsNewModal } from "./WhatsNewModal";

export function AppFooter() {
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [hasSeenLatest, setHasSeenLatest] = useState(true);

  useEffect(() => {
    // Check if user has seen the latest changelog version
    const seenVersion = localStorage.getItem('seenChangelogVersion');
    if (seenVersion !== LATEST_CHANGELOG_VERSION) {
      setHasSeenLatest(false);
    }
  }, []);

  const openWhatsNew = () => {
    setIsWhatsNewOpen(true);
    localStorage.setItem('seenChangelogVersion', LATEST_CHANGELOG_VERSION);
    setHasSeenLatest(true);
  };

  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };

    updateTheme();

    // watch for theme changes (if you toggle dark mode)
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);


  return (
    <>
      <footer className="bg-muted py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
              © {new Date().getFullYear()} DishIs Technologies. All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-4 items-center">
              {/* WHATS NEW BUTTON (MOVED HERE) */}
              <button
                onClick={openWhatsNew}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors relative"
                aria-label="What's New"
              >
                <Gift className="h-4 w-4" />
                Updates
                {!hasSeenLatest && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </button>

              <Link
                href="/policies/privacy"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/policies/terms"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/policies/refund"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Refund Policy
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
                GitHub
              </a>
              <a
                href="https://rapidapi.com/dishis-technologies-maildrop/api/temp-mail-maildrop1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                API
              </a>
              <a
                href="https://www.reddit.com/r/FreeCustomEmail/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Reddit
              </a>
              <a
                href="https://discord.com/invite/Ztp7kT2QBz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Discord
              </a>
              <Link
                href="/feedback"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Feedback
              </Link>
              <a href="https://www.buymeacoffee.com/dishantsinghdev" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" className="w-24" /></a>
              <iframe
                src={`https://status.freecustom.email/badge?theme=${theme}`}
                width="190"
                height="30"
                frameBorder="0"
                scrolling="no"
                style={{ colorScheme: 'normal' }}
                className="justify-center "
              />
            </div>
          </div>
        </div>
      </footer>

      <WhatsNewModal isOpen={isWhatsNewOpen} onClose={() => setIsWhatsNewOpen(false)} />
    </>
  );
}