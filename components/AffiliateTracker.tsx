"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function TrackerLogic() {
  const searchParams = useSearchParams();
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    const ref = searchParams?.get("ref");
    
    // Only track if there's a ref and we haven't tracked it yet in this session
    if (ref && trackedRef.current !== ref) {
      trackedRef.current = ref;
      
      // Fire and forget async call
      fetch("/api/affiliate/track-visit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref }),
        // keepalive ensures the request finishes even if the user navigates away quickly
        keepalive: true, 
      }).catch((e) => {
        // Silently ignore errors to not interfere with user experience
        console.error("Affiliate tracking failed silently:", e);
      });
    }
  }, [searchParams]);

  return null;
}

export function AffiliateTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerLogic />
    </Suspense>
  );
}

