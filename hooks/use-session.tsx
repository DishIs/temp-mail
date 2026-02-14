"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import type { SessionToken } from "@/lib/session";

type Status = "loading" | "authenticated" | "unauthenticated";

interface SessionContextValue {
  data: SessionToken | null;
  status: Status;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: "loading",
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SessionToken | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        setData(null);
        setStatus("unauthenticated");
        return;
      }
      const json = await res.json();
      if (json?.user) {
        setData(json.user);
        setStatus("authenticated");
      } else {
        setData(null);
        setStatus("unauthenticated");
      }
    } catch {
      setData(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ data, status, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}