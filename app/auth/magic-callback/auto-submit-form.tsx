'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export function AutoSubmitForm({ action }: { action: () => Promise<void> }) {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true; // prevent double-fire in React StrictMode

    action().finally(() => {
      // Hard navigate so SessionProvider re-hydrates from the new cookie.
      // A soft (client-side) redirect leaves useSession() stale until manual refresh.
      window.location.replace('/dashboard');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <Loader2 className="h-6 w-6 animate-spin" />;
}