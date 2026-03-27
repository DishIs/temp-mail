// app/api/docs/sdk/page.tsx
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";

export const metadata = {
  title: "SDKs – API Docs",
  description: "Official SDKs for FreeCustom.Email — JavaScript/TypeScript and Python. Install and get your first OTP in under 30 seconds.",
};

const SDKS = [
  {
    lang: "JavaScript / TypeScript",
    badge: "npm",
    pkg: "freecustom-email",
    install: "npm install freecustom-email",
    version: "1.0.0",
    href: "/api/docs/sdk/npm",
    npmUrl: "https://www.npmjs.com/package/freecustom-email",
    features: ["Full TypeScript types", "ESM + CommonJS dual build", "Async-first API", "Auto-reconnect WebSocket", "Typed error classes"],
    snippet: `import { FreecustomEmailClient } from 'freecustom-email';

const client = new FreecustomEmailClient({ apiKey: 'fce_...' });

// Get OTP in one line
const otp = await client.otp.waitFor('test@ditapi.info');
console.log(otp); // '847291'`,
  },
  {
    lang: "Python",
    badge: "PyPI",
    pkg: "freecustom-email",
    install: "pip install freecustom-email",
    version: "1.0.0",
    href: "/api/docs/sdk/python",
    npmUrl: "https://pypi.org/project/freecustom-email/",
    features: ["Async (asyncio) + sync modes", "Full type annotations", "dataclass response models", "Auto-reconnect WebSocket", "Typed exception hierarchy"],
    snippet: `from freecustom_email import FreeCustomEmail
import asyncio

client = FreeCustomEmail(api_key="fce_...")

async def main():
    otp = await client.otp.wait_for("test@ditapi.info")
    print(otp)  # '847291'

asyncio.run(main())`,
  },
];

const THIRTY_SECONDS = [
  {
    n: "01",
    title: "Install",
    js: "npm install freecustom-email",
    py: "pip install freecustom-email",
  },
  {
    n: "02",
    title: "Import + init",
    js: `import { FreecustomEmailClient } from 'freecustom-email';\nconst client = new FreecustomEmailClient({ apiKey: process.env.FCE_API_KEY });`,
    py: `from freecustom_email import FreeCustomEmail\nclient = FreeCustomEmail(api_key=os.environ["FCE_API_KEY"])`,
  },
  {
    n: "03",
    title: "Register + get OTP",
    js: `await client.inboxes.register('test@ditapi.info');\nconst otp = await client.otp.waitFor('test@ditapi.info');`,
    py: `await client.inboxes.register("test@ditapi.info")\notp = await client.otp.wait_for("test@ditapi.info")`,
  },
];

export default function SdkHubPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Official SDKs</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Official client libraries for FreeCustom.Email. Full API coverage, typed responses, built-in WebSocket, and real-time OTP extraction — ready in under 30 seconds.
        </p>
      </div>

      {/* 30-second flow */}
      <div className="rounded-lg border border-border overflow-hidden mb-10">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/10">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full border border-border" />
            <span className="h-2 w-2 rounded-full border border-border" />
            <span className="h-2 w-2 rounded-full border border-border" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Start in 30 seconds</span>
          <span className="ml-auto font-mono text-[10px] border border-border rounded px-1.5 py-px text-foreground">JavaScript</span>
        </div>
        <div className="divide-y divide-border">
          {THIRTY_SECONDS.map((step) => (
            <div key={step.n} className="flex gap-0">
              <div className="shrink-0 w-14 flex items-start justify-center pt-4 pb-4 border-r border-border">
                <span className="font-mono text-[10px] text-muted-foreground/50">{step.n}</span>
              </div>
              <div className="flex-1 px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{step.title}</p>
                <pre className="font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap">{step.js}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SDK cards */}
      <h2 id="available" className="text-lg font-semibold mt-8 mb-4">Available SDKs</h2>
      <div className="grid sm:grid-cols-2 gap-4 not-prose mb-10">
        {SDKS.map((sdk) => (
          <div key={sdk.lang} className="rounded-lg border border-border bg-background overflow-hidden flex flex-col">
            {/* header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] border border-border rounded px-1.5 py-px text-muted-foreground">
                  {sdk.badge}
                </span>
                <span className="text-sm font-semibold text-foreground">{sdk.lang}</span>
              </div>
              <a
                href={sdk.npmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                v{sdk.version}
              </a>
            </div>

            {/* install */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/5 font-mono text-xs">
              <span className="text-muted-foreground/50">$</span>
              <code className="text-foreground flex-1">{sdk.install}</code>
            </div>

            {/* features */}
            <ul className="px-5 py-4 space-y-1.5 border-b border-border flex-1">
              {sdk.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-foreground/50 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* code */}
            <div className="px-5 py-4 border-b border-border">
              <pre className="font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre overflow-x-auto">
                {sdk.snippet}
              </pre>
            </div>

            {/* footer */}
            <div className="px-5 py-4">
              <Link
                href={sdk.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
              >
                Full {sdk.lang} SDK docs →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* What's included */}
      <h2 id="coverage" className="text-lg font-semibold mt-8 mb-3">What's covered</h2>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Both SDKs cover the full API surface — every endpoint, every response type, and the real-time WebSocket layer.
      </p>
      <div className="rounded-lg border border-border overflow-hidden not-prose mb-8">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              <th className="text-left py-2.5 px-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Resource</th>
              <th className="text-left py-2.5 px-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Methods</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              { r: "client.inboxes",  m: "register, list, unregister" },
              { r: "client.messages", m: "list, get, delete, waitFor" },
              { r: "client.otp",      m: "get, waitFor" },
              { r: "client.domains",  m: "list, listWithExpiry, listCustom, addCustom, verifyCustom, removeCustom" },
              { r: "client.webhooks", m: "register, list, unregister" },
              { r: "client.account",  m: "info, usage" },
              { r: "client.realtime", m: "WebSocket client (on, once, connect, disconnect, wait)" },
            ].map(({ r, m }) => (
              <tr key={r} className="hover:bg-muted/5">
                <td className="py-2.5 px-4 font-mono text-foreground">{r}</td>
                <td className="py-2.5 px-4 text-muted-foreground">{m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Other languages note */}
      <div className="p-4 rounded-lg border border-border bg-muted/10 text-sm text-muted-foreground not-prose">
        <p className="font-medium text-foreground mb-1">Using another language?</p>
        <p>
          Any HTTP client works with the REST API. See the <Link href="/api/docs/quickstart" className="text-foreground underline underline-offset-4 hover:no-underline">Quickstart</Link> for cURL, Go, and Ruby examples. The{" "}
          <a href="/openapi.yaml" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4 hover:no-underline">OpenAPI spec</a>{" "}
          can generate a client in 50+ languages via <a href="https://github.com/OpenAPITools/openapi-generator" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4 hover:no-underline">openapi-generator</a>.
        </p>
      </div>

      <DocPageNav
        prev={{ href: "/api/docs/quickstart", label: "Quickstart" }}
        next={{ href: "/api/docs/sdk/npm", label: "JavaScript / TypeScript SDK" }}
      />
    </article>
  );
}