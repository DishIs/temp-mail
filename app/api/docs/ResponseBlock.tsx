import { CodeBlock } from "@/components/CodeBlock";

interface ResponseBlockProps {
  status: number;
  label: string;
  body: string;
  language?: "json" | "curl" | "text";
}

export function ResponseBlock({ status, label, body, language = "json" }: ResponseBlockProps) {
  const isSuccess = status >= 200 && status < 300;
  const isError = status >= 400;
  return (
    <div className="mt-3">
      <p className="text-sm font-medium flex items-center gap-2 mb-1.5">
        <span
          className={`inline-flex items-center justify-center w-14 rounded font-mono text-xs ${
            isSuccess
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : isError
                ? "bg-destructive/15 text-destructive"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {status}
        </span>
        {label}
      </p>
      <CodeBlock code={body} language={language} />
    </div>
  );
}
