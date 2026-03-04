"use client";

import "@scalar/api-reference-react/style.css";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { PlaygroundHeader } from "./PlaygroundHeader";
import { PlaygroundFooter } from "./PlaygroundFooter";

const ApiReferenceReact = dynamic(
  () => import("@scalar/api-reference-react").then((mod) => mod.ApiReferenceReact),
  { ssr: false }
);

export function PlaygroundClient() {
  const { resolvedTheme } = useTheme();
  const { data: session, status } = useSession();
  const [playgroundToken, setPlaygroundToken] = useState<string | null>(null);

  const specUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/openapi.yaml`
      : "/openapi.yaml";

  // Fetch playground token when user is logged in (backend can return a short-lived token)
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setPlaygroundToken(null);
      return;
    }
    let cancelled = false;
    fetch("/api/user/playground-token")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data?.token === "string") setPlaygroundToken(data.token);
        else setPlaygroundToken(null);
      })
      .catch(() => {
        if (!cancelled) setPlaygroundToken(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id]);

  const scalarConfig = useMemo(() => {
    const resolved = resolvedTheme === "dark" ? "dark" : "light";
    return {
      url: specUrl,
      theme: "default" as const,
      metaData: {
        title: "API Playground – FreeCustom.Email",
        description:
          "Try the API live with the interactive explorer. Disposable email infrastructure for developers.",
      },
      favicon: "/logo.webp",
      // Sync with app theme (light/dark/system from header)
      forceDarkModeState: resolved as "light" | "dark",
      hideDarkModeToggle: true,
      // Auto-fill API key when we have a playground token from the backend
      authentication: {
        preferredSecurityScheme: "BearerAuth",
        persistAuth: true,
        ...(playgroundToken
          ? {
              securitySchemes: {
                BearerAuth: { token: playgroundToken },
              },
            }
          : {}),
      },
    };
  }, [specUrl, resolvedTheme, playgroundToken]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-0px)]">
      <PlaygroundHeader />
      <div className="flex-1 min-h-[500px] w-full playground-scalar-wrap">
        <ApiReferenceReact
          key={`scalar-${resolvedTheme ?? "light"}`}
          configuration={scalarConfig}
        />
      </div>
      <PlaygroundFooter />
    </div>
  );
}
