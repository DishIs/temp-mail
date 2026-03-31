// components/CodeBlock.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Copy } from "lucide-react";
import hljs from "highlight.js";

// ─── VSCode token colours injected once ──────────────────────────────────────
const THEME_ID = "__hljs_vscode__";
const THEME_CSS = `
.hljs-keyword,.hljs-operator                          { color: #569cd6; }
.hljs-type,.hljs-implements,.hljs-module-access        { color: #4ec9b0; }
.hljs-string,.hljs-regexp,.hljs-addition,.hljs-meta .hljs-string { color: #ce9178; }
.hljs-number,.hljs-bullet                             { color: #b5cea8; }
.hljs-built_in,.hljs-attr                             { color: #9cdcfe; }
.hljs-title,.hljs-title.function_,.hljs-variable      { color: #dcdcaa; }
.hljs-class .hljs-title,.hljs-template-variable       { color: #dcdcaa; }
.hljs-comment,.hljs-quote                             { color: #6a9955; font-style: italic; }
.hljs-section,.hljs-name,.hljs-selector-id,.hljs-selector-class { color: #d7ba7d; }
.hljs-meta,.hljs-meta .hljs-keyword                   { color: #c586c0; }
.hljs-params                                          { color: #9cdcfe; }
.hljs-literal,.hljs-selector-tag,.hljs-doctag         { color: #569cd6; }
`;

function injectTheme() {
  if (typeof document === "undefined" || document.getElementById(THEME_ID)) return;
  const s = document.createElement("style");
  s.id = THEME_ID;
  s.textContent = THEME_CSS;
  document.head.appendChild(s);
}

// ─── Language alias normalisation ────────────────────────────────────────────
const ALIASES: Record<string, string> = {
  ts: "typescript", tsx: "typescript",
  js: "javascript", jsx: "javascript",
  py: "python", rb: "ruby",
  sh: "bash", shell: "bash",
  curl: "bash",
  cmd: "dos", bat: "dos",
  ps1: "powershell", ps: "powershell",
  yml: "yaml", tf: "hcl",
  rs: "rust", kt: "kotlin",
  cs: "csharp", cpp: "cpp", cc: "cpp",
  html: "xml", vue: "xml", svelte: "xml",
  graphql: "graphql", gql: "graphql",
};
const normalise = (lang?: string) =>
  lang ? (ALIASES[lang.toLowerCase()] ?? lang.toLowerCase()) : undefined;

// ─── Props ────────────────────────────────────────────────────────────────────
interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  /** Show a thin left accent bar (default true) */
  accent?: boolean;
  /** Show line numbers (default true) */
  lineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language,
  className = "",
  accent = true,
  lineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const lang = normalise(language);

  useEffect(() => { injectTheme(); }, []);

  useEffect(() => {
    const el = codeRef.current;
    if (!el) return;
    el.removeAttribute("data-highlighted");
    try {
      el.innerHTML = lang
        ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
        : hljs.highlightAuto(code).value;
    } catch {
      el.textContent = code;
    }
  }, [code, lang]);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const lineCount = code.split("\n").length;
  const gutterW = `${Math.max(2, String(lineCount).length) + 1}ch`;

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
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground select-none">
            {language}
          </span>
          <button
            onClick={copy}
            aria-label="Copy code"
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            {copied
              ? <><Check className="h-3 w-3" />copied</>
              : <><Copy className="h-3 w-3" />copy</>}
          </button>
        </div>
      )}

      {/* Code body */}
      <div className="flex overflow-x-hidden">
        {/* Line numbers — unselectable, never copied */}
        {lineNumbers && (
          <div
            aria-hidden
            className="shrink-0 text-right font-mono text-xs leading-[1.7] py-5 pr-3 pl-4 border-r border-border"
            style={{
              minWidth: gutterW,
              color: "currentColor",
              opacity: 0.25,
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
            } as React.CSSProperties}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}

        {/* Highlighted code */}
        <pre
          className={`flex-1 min-w-0 text-xs sm:text-sm font-mono text-foreground leading-[1.7] whitespace-pre-wrap break-words overflow-x-hidden ${
            language ? "p-5" : "p-5 pr-14"
          } ${lineNumbers ? "!pl-4" : ""}`}
        >
          <code
            ref={codeRef}
            className="hljs"
            style={{ background: "transparent", padding: 0, fontSize: "inherit", fontFamily: "inherit" }}
          >
            {code}
          </code>
        </pre>
      </div>

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