"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className={`relative rounded-lg border border-border bg-muted overflow-hidden ${className}`}>
      {language && (
        <span className="absolute top-2 left-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {language}
        </span>
      )}
      <pre className={`overflow-x-auto text-xs sm:text-sm font-mono text-foreground leading-relaxed ${language ? "pt-8 pb-4 pl-4 pr-24" : "p-4 pr-24"}`}>
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={copy}
        aria-label="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
