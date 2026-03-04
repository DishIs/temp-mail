"use client";

import "@scalar/api-reference-react/style.css";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

const ApiReferenceReact = dynamic(
  () => import("@scalar/api-reference-react").then((mod) => mod.ApiReferenceReact),
  { ssr: false }
);

export function PlaygroundClient() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  const specUrl = typeof window !== "undefined" ? `${window.location.origin}/openapi.yaml` : "/openapi.yaml";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-[600px]">
        <ApiReferenceReact
          configuration={{
            url: specUrl,
            theme: "default",
          }}
        />
      </div>
    </div>
  );
}
