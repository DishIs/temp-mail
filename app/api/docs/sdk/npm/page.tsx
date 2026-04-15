import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../../DocPageNav";

export const metadata = {
  title: "JavaScript / TypeScript SDK – API Docs",
  description: "Official JavaScript and TypeScript SDK for FreeCustom.Email. npm install freecustom-email.",
};

export default function NpmSdkPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground">npm</span>
          <a
            href="https://www.npmjs.com/package/freecustom-email"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            freecustom-email
          </a>
          <span className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground">ESM + CJS</span>
          <span className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground">TypeScript</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">JavaScript / TypeScript SDK</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Test, debug, and automate signup, OTP, and email-based authentication flows — with real-time observability.
        </p>
      </div>

      <div className="mb-8 p-6 rounded-lg border border-border bg-muted/10">
        <h3 className="font-semibold text-lg mb-4 mt-0">Why this exists</h3>
        <p className="text-sm text-muted-foreground mb-4">Testing auth flows is painful:</p>
        <ul className="text-sm text-muted-foreground space-y-2 mb-4 list-none pl-0">
          <li className="flex items-center gap-2"><span className="text-red-500">❌</span> Flaky email delivery</li>
          <li className="flex items-center gap-2"><span className="text-red-500">❌</span> Polling delays</li>
          <li className="flex items-center gap-2"><span className="text-red-500">❌</span> OTP parsing issues</li>
          <li className="flex items-center gap-2"><span className="text-red-500">❌</span> No visibility into failures</li>
        </ul>
        <p className="text-sm font-medium">FreeCustom.Email solves this by giving you: 👉 real-time auth flow debugging.</p>
      </div>

      {/* Install */}
      <h2 id="install" className="text-lg font-semibold mt-8 mb-3">Installation</h2>
      <CodeBlock code={`npm install freecustom-email\n# or\npnpm add freecustom-email\n# or\nyarn add freecustom-email`} language="bash" />

      {/* Quick start */}
      <h2 id="quickstart" className="text-lg font-semibold mt-8 mb-3">🚀 Quick Start (Auth Flow Testing)</h2>
      <CodeBlock code={`import { FreecustomEmailClient } from 'freecustom-email';

const client = new FreecustomEmailClient({
  apiKey: 'fce_your_api_key_here',
});

// 1. Create inbox (pass \`true\` for zero-latency testing mode)
const email = 'test@ditube.info';
await client.inboxes.register(email, true);

// 2. Start test run (NEW - Groups events in your timeline)
await client.inboxes.startTest(email, 'signup-test-1');

// 3. Trigger your app
await fetch('https://yourapp.com/api/send-otp', {
  method: 'POST',
  body: JSON.stringify({ email }),
});

// 4. Wait for OTP
const otp = await client.otp.waitFor(email);
console.log('OTP:', otp);

// 5. Debug the full flow
const timeline = await client.inboxes.getTimeline(email, 'signup-test-1');
console.log(timeline);`} language="typescript" />

      {/* Debugging */}
      <h2 id="debugging" className="text-lg font-semibold mt-10 mb-3">🔥 Debug Your Auth Flow</h2>
      
      <h3 className="text-base font-semibold mt-6 mb-2">Timeline (see what actually happened)</h3>
      <CodeBlock code={`const timeline = await client.inboxes.getTimeline(email);
console.log(timeline);
// [
//   { "type": "smtp_rcpt_received", "time": 820 },
//   { "type": "email_received", "time": 830 },
//   { "type": "otp_extracted", "time": 835 },
//   { "type": "websocket_sent", "time": 840 }
// ]`} language="typescript" />

      <h3 className="text-base font-semibold mt-6 mb-2">Insights (why your test failed)</h3>
      <CodeBlock code={`const insights = await client.inboxes.getInsights(email);
console.log(insights);
// [
//   { "type": "slow_delivery", "message": "Email took >3s" },
//   { "type": "multiple_detected", "message": "Multiple emails detected" }
// ]`} language="typescript" />

      <h3 className="text-base font-semibold mt-6 mb-2">Test Runs (group your flows)</h3>
      <CodeBlock code={`await client.inboxes.startTest(email, 'signup-test-1');
const timeline = await client.inboxes.getTimeline(email, 'signup-test-1');`} language="typescript" />

      {/* Real-time */}
      <h2 id="realtime" className="text-lg font-semibold mt-10 mb-3">⚡ Real-time Debugging (WebSocket)</h2>
      <CodeBlock code={`const ws = client.realtime({ mailbox: email });

ws.on('email', event => {
  console.log('Flow update:', event);
});

await ws.connect();`} language="typescript" />

      {/* Playwright Example */}
      <h2 id="playwright" className="text-lg font-semibold mt-10 mb-3">🧪 Full Playwright Example</h2>
      <CodeBlock code={`import { test, expect } from '@playwright/test';
import { FreecustomEmailClient } from 'freecustom-email';

const client = new FreecustomEmailClient({ apiKey: process.env.FCE_API_KEY! });

test('signup flow', async ({ page }) => {
  const email = 'test@ditube.info';

  await client.inboxes.register(email, true);
  await client.inboxes.startTest(email, 'e2e-signup');

  await page.goto('/signup');
  await page.fill('#email', email);
  await page.click('button');

  // Automatically waits for the email and extracts the code
  const otp = await client.otp.waitFor(email);

  await page.fill('#otp', otp);
  await page.click('#verify');

  // Debugging: View exactly how long delivery took
  const timeline = await client.inboxes.getTimeline(email, 'e2e-signup');
  console.log(timeline);
});`} language="typescript" />

      {/* Mental Model */}
      <h2 id="mental-model" className="text-lg font-semibold mt-10 mb-3">🔁 Old vs New Mental Model</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 font-medium">Old (Temp Mail)</th>
              <th className="py-2 font-medium">New (FreeCustom.Email)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr><td className="py-2">receive emails</td><td className="py-2 font-semibold text-primary">test auth flows</td></tr>
            <tr><td className="py-2">read inbox</td><td className="py-2 font-semibold text-primary">debug flows</td></tr>
            <tr><td className="py-2">parse OTP manually</td><td className="py-2 font-semibold text-primary">auto extract + analyze</td></tr>
            <tr><td className="py-2">polling</td><td className="py-2 font-semibold text-primary">real-time events</td></tr>
          </tbody>
        </table>
      </div>

      {/* Most Important Methods */}
      <h2 id="methods" className="text-lg font-semibold mt-10 mb-3">🔥 Most Important Methods (for devs)</h2>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2">
        <li><code className="bg-muted px-1 rounded">client.inboxes.startTest(email, testId)</code></li>
        <li><code className="bg-muted px-1 rounded">client.otp.waitFor(email)</code></li>
        <li><code className="bg-muted px-1 rounded">client.inboxes.getTimeline(email, testId)</code></li>
        <li><code className="bg-muted px-1 rounded">client.inboxes.getInsights(email)</code></li>
      </ul>

      {/* Links */}
      <div className="mt-10 p-4 rounded-lg border border-border bg-muted/10 text-sm text-muted-foreground not-prose">
        <p className="font-medium text-foreground mb-2">Links</p>
        <ul className="space-y-1">
          <li>
            <a href="https://www.npmjs.com/package/freecustom-email" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4 hover:no-underline">
              npmjs.com/package/freecustom-email
            </a>
            {" "}— npm package page
          </li>
          <li>
            <Link href="/api/playground" className="text-foreground underline underline-offset-4 hover:no-underline">
              Interactive Playground
            </Link>
            {" "}— try API calls in the browser
          </li>
        </ul>
      </div>

      <DocPageNav
        prev={{ href: "/api/docs/sdk", label: "SDKs overview" }}
        next={{ href: "/api/docs/sdk/python", label: "Python SDK" }}
      />
    </article>
  );
}
