// components/CodeBlock.tsx
"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  /** Show a thin left accent bar (default true) */
  accent?: boolean;
}

export function CodeBlock({ code, language, className = "", accent = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      className={`group relative rounded-lg border border-border bg-muted/30 overflow-hidden min-w-0 max-w-full ${className}`}
    >
      {/* Left accent bar */}
      {accent && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border" aria-hidden />
      )}

      {/* Header row */}
      {language && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
          {/* Decorative dots — like a terminal titlebar */}
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground select-none">
            {language}
          </span>
          {/* copy button in header */}
          <button
            onClick={copy}
            aria-label="Copy code"
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            {copied
              ? <><Check className="h-3 w-3" />copied</>
              : <><Copy className="h-3 w-3" />copy</>
            }
          </button>
        </div>
      )}

      {/* Code body */}
      <pre
        className={`text-xs sm:text-sm font-mono text-foreground leading-[1.7] whitespace-pre-wrap break-words overflow-x-hidden ${language ? "p-5" : "p-5 pr-14"}`}
      >
        <code>{code}</code>
      </pre>

      {/* Floating copy button when no header */}
      {!language && (
        <button
          onClick={copy}
          aria-label="Copy code"
          className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-md border border-border bg-background/80 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-150"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
}