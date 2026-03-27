// app/api/docs/sdk/npm/page.tsx
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
            freecustom-email@1.0.0
          </a>
          <span className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground">ESM + CJS</span>
          <span className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground">TypeScript</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">JavaScript / TypeScript SDK</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Official JavaScript and TypeScript client for FreeCustom.Email. Works in Node.js 18+, Deno, Bun, and the browser. Full TypeScript types, ESM + CommonJS builds, async WebSocket with auto-reconnect.
        </p>
      </div>

      {/* Install */}
      <h2 id="install" className="text-lg font-semibold mt-8 mb-3">Installation</h2>
      <CodeBlock code={`npm install freecustom-email\n# or\npnpm add freecustom-email\n# or\nyarn add freecustom-email`} language="bash" />

      {/* Quick start */}
      <h2 id="quickstart" className="text-lg font-semibold mt-8 mb-3">Quick start</h2>
      <CodeBlock code={`import { FreecustomEmailClient } from 'freecustom-email';

const client = new FreecustomEmailClient({
  apiKey: process.env.FCE_API_KEY!, // fce_...
});

// 1. Register a disposable inbox
await client.inboxes.register('test@ditapi.info');

// 2. (trigger your app to send a verification email)

// 3. Get the OTP — polls until it arrives (Growth plan+)
const otp = await client.otp.waitFor('test@ditapi.info', { timeoutMs: 30_000 });
console.log('OTP:', otp); // '847291'

// 4. Clean up
await client.inboxes.unregister('test@ditapi.info');`} language="typescript" />

      {/* Client config */}
      <h2 id="client" className="text-lg font-semibold mt-10 mb-3">Client configuration</h2>
      <CodeBlock code={`const client = new FreecustomEmailClient({
  apiKey:  'fce_...',     // required
  baseUrl: 'https://...',  // optional — defaults to https://api2.freecustom.email/v1
  timeout: 10_000,         // optional — request timeout in ms (default: 10s)
  retry: {                 // optional — retry on timeout/network errors
    attempts:       2,
    initialDelayMs: 500,   // exponential backoff: 500ms, 1s
  },
});`} language="typescript" />

      {/* Inboxes */}
      <h2 id="inboxes" className="text-lg font-semibold mt-10 mb-3">Inboxes</h2>
      <CodeBlock code={`// Register a new inbox
const result = await client.inboxes.register('mytest@ditapi.info');
// { success: true, message: 'Inbox registered.', inbox: 'mytest@ditapi.info' }

// List all registered inboxes
const inboxes = await client.inboxes.list();
// [{ inbox: 'mytest@ditapi.info', local: 'mytest', domain: 'ditapi.info' }]

// Unregister
await client.inboxes.unregister('mytest@ditapi.info');`} language="typescript" />

      {/* Messages */}
      <h2 id="messages" className="text-lg font-semibold mt-10 mb-3">Messages</h2>
      <CodeBlock code={`// List all messages in an inbox
const messages = await client.messages.list('mytest@ditapi.info');

// Get a single message by ID
const msg = await client.messages.get('mytest@ditapi.info', 'D3vt8NnEQ');
console.log(msg.subject, msg.otp, msg.verificationLink);

// Delete a message
await client.messages.delete('mytest@ditapi.info', 'D3vt8NnEQ');

// Wait for a message matching a condition (polls until found or timeout)
const msg = await client.messages.waitFor('mytest@ditapi.info', {
  timeoutMs:      30_000,
  pollIntervalMs: 2_000,
  match: m => m.from.includes('github.com'),
});`} language="typescript" />

      {/* OTP */}
      <h2 id="otp" className="text-lg font-semibold mt-10 mb-3">OTP extraction</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        OTP extraction requires <strong>Growth plan or above</strong>. On lower plans, the <code className="rounded bg-muted px-1 py-0.5 text-xs">otp</code> field returns <code className="rounded bg-muted px-1 py-0.5 text-xs">__DETECTED__</code> as a signal to upgrade.
      </p>
      <CodeBlock code={`// Get the latest OTP immediately (returns null if none found)
const result = await client.otp.get('mytest@ditapi.info');
if (result.otp) {
  console.log('OTP:', result.otp);               // '847291'
  console.log('Link:', result.verification_link); // 'https://...'
}

// Poll until OTP arrives — the most common pattern in test automation
const otp = await client.otp.waitFor('mytest@ditapi.info', {
  timeoutMs:      30_000, // throw WaitTimeoutError after 30s
  pollIntervalMs: 2_000,  // check every 2s
});`} language="typescript" />

      {/* Full flow */}
      <h2 id="full-flow" className="text-lg font-semibold mt-10 mb-3">Full verification flow</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        <code className="rounded bg-muted px-1 py-0.5 text-xs">getOtpForInbox</code> handles the entire register → trigger → wait → unregister lifecycle. Ideal for test suites.
      </p>
      <CodeBlock code={`const otp = await client.getOtpForInbox(
  'mytest@ditapi.info',
  async () => {
    // Trigger your app to send the verification email
    await fetch('https://yourapp.com/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mytest@ditapi.info' }),
    });
  },
  {
    timeoutMs:       30_000, // default 30s
    autoUnregister:  true,   // default true — cleans up after
  },
);
console.log('Verified with OTP:', otp);`} language="typescript" />

      {/* WebSocket */}
      <h2 id="websocket" className="text-lg font-semibold mt-10 mb-3">Real-time WebSocket</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Requires <strong>Startup plan or above</strong>. Delivers emails in under 200ms with no polling. Auto-reconnects on disconnect.
      </p>
      <CodeBlock code={`const ws = client.realtime({
  mailbox:              'mytest@ditapi.info', // omit to subscribe to all your inboxes
  autoReconnect:        true,
  reconnectDelayMs:     3_000,
  maxReconnectAttempts: 10,
  pingIntervalMs:       30_000,
});

ws.on('connected', info => {
  console.log('Connected — plan:', info.plan);
  console.log('Subscribed:', info.subscribed_inboxes);
});

ws.on('email', email => {
  console.log('From:', email.from);
  console.log('OTP:', email.otp);               // already extracted
  console.log('Link:', email.verificationLink);
});

ws.on('disconnected', ({ code, reason }) => {
  console.log(\`Disconnected: \${code} \${reason}\`);
});

ws.on('reconnecting', ({ attempt, maxAttempts }) => {
  console.log(\`Reconnecting \${attempt}/\${maxAttempts}...\`);
});

ws.on('error', err => {
  if (err.upgrade_url) console.log('Upgrade at:', err.upgrade_url);
});

await ws.connect();

// Check live status
console.log('Connected:', ws.isConnected);

// Disconnect cleanly
ws.disconnect();`} language="typescript" />

      {/* Webhooks */}
      <h2 id="webhooks" className="text-lg font-semibold mt-10 mb-3">Webhooks</h2>
      <CodeBlock code={`// Register a webhook — your URL gets a POST on every new email
const hook = await client.webhooks.register(
  'mytest@ditapi.info',
  'https://your-server.com/hooks/email',
);
console.log('Webhook ID:', hook.id);

// List active webhooks
const hooks = await client.webhooks.list();

// Unregister
await client.webhooks.unregister(hook.id);`} language="typescript" />

      {/* Domains */}
      <h2 id="domains" className="text-lg font-semibold mt-10 mb-3">Domains</h2>
      <CodeBlock code={`// Domains available on your plan
const domains = await client.domains.list();

// With expiry metadata
const all = await client.domains.listWithExpiry();

// Custom domains (Growth plan+)
const custom = await client.domains.listCustom();

const result = await client.domains.addCustom('mail.yourdomain.com');
console.log('Add these DNS records:', result.dns_records);

const v = await client.domains.verifyCustom('mail.yourdomain.com');
console.log('Verified:', v.verified);

await client.domains.removeCustom('mail.yourdomain.com');`} language="typescript" />

      {/* Account */}
      <h2 id="account" className="text-lg font-semibold mt-10 mb-3">Account</h2>
      <CodeBlock code={`const info = await client.account.info();
console.log(info.plan, info.credits, info.api_inbox_count);

const usage = await client.account.usage();
console.log(\`\${usage.requests_used} / \${usage.requests_limit} requests used\`);
console.log('Resets at:', usage.resets);`} language="typescript" />

      {/* Error handling */}
      <h2 id="errors" className="text-lg font-semibold mt-10 mb-3">Error handling</h2>
      <CodeBlock code={`import {
  FreecustomEmailClient,
  FreecustomEmailError,
  AuthError,
  PlanError,
  RateLimitError,
  NotFoundError,
  TimeoutError,
} from 'freecustom-email';

try {
  const otp = await client.otp.get('mytest@ditapi.info');
} catch (err) {
  if (err instanceof AuthError) {
    // 401 — invalid or revoked API key
    console.error('Invalid API key');
  } else if (err instanceof PlanError) {
    // 403 — operation requires a higher plan
    console.error('Plan too low:', err.message);
    if (err.upgradeUrl) window.open(err.upgradeUrl);
  } else if (err instanceof RateLimitError) {
    // 429 — rate limited
    console.error('Rate limited. Retry after:', err.retryAfter, 'seconds');
  } else if (err instanceof NotFoundError) {
    // 404 — inbox not registered
    console.error('Inbox not found');
  } else if (err instanceof TimeoutError) {
    // request timed out
    console.error('Request timed out');
  } else if (err instanceof FreecustomEmailError) {
    // all other API errors
    console.error(\`[\${err.status}] \${err.code}: \${err.message}\`);
  }
}`} language="typescript" />

      {/* TypeScript types */}
      <h2 id="types" className="text-lg font-semibold mt-10 mb-3">TypeScript types</h2>
      <CodeBlock code={`import type {
  FreecustomEmailConfig,
  ApiPlan,
  InboxObject,
  Message,
  Attachment,
  OtpResult,
  DomainInfo,
  CustomDomain,
  AccountInfo,
  UsageStats,
  Webhook,
  WsClientOptions,
  WsConnectedEvent,
  WsNewEmailEvent,
  WsErrorEvent,
} from 'freecustom-email';`} language="typescript" />

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
          <li>
            <Link href="/api/docs/errors" className="text-foreground underline underline-offset-4 hover:no-underline">
              Error reference
            </Link>
            {" "}— all API error codes
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