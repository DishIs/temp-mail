"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function ExtAuthClient({ extToken }: { extToken: string }) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const t = useTranslations("common");

  useEffect(() => {
    if (!extToken) {
      setStatus("error");
      return;
    }

    try {
      // Send token to extension via postMessage
      window.postMessage({ type: "FCE_EXT_AUTH_SUCCESS", extToken }, "*");
      setStatus("success");
      
      // Auto-close tab after a few seconds
      setTimeout(() => {
        window.close();
      }, 3000);
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }, [extToken]);

  return (
    <div className="text-center flex flex-col items-center p-8 max-w-sm mx-auto bg-card rounded-xl border shadow-sm">
      {status === "loading" && (
        <>
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h1 className="text-xl font-semibold mb-2">Authenticating Extension...</h1>
          <p className="text-muted-foreground text-sm">Please wait while we connect your FreeCustom.Email account to the extension.</p>
        </>
      )}
      
      {status === "success" && (
        <>
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h1 className="text-xl font-semibold mb-2">Authentication Successful!</h1>
          <p className="text-muted-foreground text-sm">You can now close this tab and return to the extension.</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 text-2xl font-bold">!</div>
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">We couldn't complete the authentication process.</p>
        </>
      )}
    </div>
  );
}
