// hooks/use-available-domains.ts
import { useState, useEffect } from "react";

interface DomainConfig {
  domain: string;
  tier: "free" | "pro";
  isNew?: boolean;
}

export function useAvailableDomains(isPro: boolean, isAuthenticated: boolean) {
  const [domains, setDomains] = useState<DomainConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const CACHE_KEY = `domains_v2_${isPro ? "pro" : isAuthenticated ? "free" : "anon"}`;
    const CACHE_TTL = 5 * 60 * 1000; // 5 min

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setDomains(data);
          setIsLoading(false);
          return;
        }
      } catch {}
    }

    fetch("/api/domains") // server-side gated, not in bundle
      .then(r => r.json())
      .then(({ data }) => {
        setDomains(data);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isPro, isAuthenticated]);

  return { domains, isLoading };
}