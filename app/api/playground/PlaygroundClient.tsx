"use client";

import "@scalar/api-reference-react/style.css";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { PlaygroundHeader } from "./PlaygroundHeader";
import { PlaygroundFooter } from "./PlaygroundFooter";

const ApiReferenceReact = dynamic(
  () => import("@scalar/api-reference-react").then((mod) => mod.ApiReferenceReact),
  { ssr: false }
);

export function PlaygroundClient() {
  const { resolvedTheme } = useTheme();

  const specUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/openapi.yaml`
      : "/openapi.yaml";

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
      forceDarkModeState: resolved as "light" | "dark",
      hideDarkModeToggle: true,
      authentication: {
        preferredSecurityScheme: "BearerAuth",
        persistAuth: true,
      },
    };
  }, [specUrl, resolvedTheme]);

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
