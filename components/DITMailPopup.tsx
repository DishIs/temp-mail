// components/DITMailPopup.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // <-- Import useSession
import { motion, AnimatePresence } from 'framer-motion'; // <-- Import for animations
import { X, Star, Zap, Layers } from 'lucide-react'; // <-- Import modern icons
import { Button } from '@/components/ui/button';
import { AuthPopup } from './AuthPopup';

// A small, reusable component for feature highlights
const FeatureHighlight = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <li className="flex items-center gap-3 text-sm text-muted-foreground">
    <div className="flex-shrink-0 text-primary">{icon}</div>
    <span>{children}</span>
  </li>
);

export function DITMailPopup() {
  const { data: session, status } = useSession(); // <-- Get user session
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  useEffect(() => {
    // Only show the popup if the user is not logged in and hasn't dismissed it before
    if (status === 'unauthenticated') {
      const popupDismissed = localStorage.getItem('ditmailPopupDismissed_v2'); // Use a new key for the new design
      if (!popupDismissed) {
        const timer = setTimeout(() => {
          setIsPopupVisible(true);
        }, 4000); // Slightly longer delay
        return () => clearTimeout(timer);
      }
    }
  }, [status]); // Effect depends on the authentication status

  const handleDismissPopup = () => {
    setIsPopupVisible(false);
    localStorage.setItem('ditmailPopupDismissed_v2', 'true');
  };

  return (
    <>
      <AnimatePresence>
        {isPopupVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed bottom-5 right-5 z-50 p-6 w-[calc(100%-2.5rem)] sm:w-auto sm:max-w-sm bg-background rounded-xl shadow-2xl border"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-foreground">
                    Unlock Your Pro Features
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Sign in to get more from your mailbox.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismissPopup}
                  className="flex-shrink-0 -mr-2 -mt-2"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ul className="space-y-2">
                <FeatureHighlight icon={<Star className="h-4 w-4" />}>
                  Save important emails forever
                </FeatureHighlight>
                <FeatureHighlight icon={<Zap className="h-4 w-4" />}>
                  Use your own custom domains
                </FeatureHighlight>
                <FeatureHighlight icon={<Layers className="h-4 w-4" />}>
                  No future ads
                </FeatureHighlight>
              </ul>

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                {/* This button could open your AuthPopup */}
                <Link href={'/pricing'}>
                  <Button className="w-full">
                    Compare Plans
                  </Button>
                </Link>
                <Button variant="secondary" asChild className="w-full">
                  <Link href="/blog">See What's New</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}