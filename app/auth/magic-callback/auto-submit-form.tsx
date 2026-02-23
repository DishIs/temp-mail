'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export function AutoSubmitForm({ action }: { action: () => Promise<void> }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Auto-submit as soon as the page mounts — no user click needed
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={action}>
      <Loader2 className="h-6 w-6 animate-spin" />
    </form>
  );
}