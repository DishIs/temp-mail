import { CodeBlock } from "@/components/CodeBlock";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Multi-Account Testing – FreeCustom.Email Use Cases",
  description: "Spin up hundreds of isolated disposable inboxes to test user flows across different account states in parallel.",
};

export default function MultiAccountTestingPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/api/use-cases" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          ← Use Cases
        </Link>
        <span className="text-muted-foreground/30">/</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Multi-Account Testing</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Multi-Account & Parallel State Testing
      </h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Test complex user flows that require interacting across dozens or hundreds of accounts simultaneously. Whether it's validating refer-a-friend loops, multiplayer states, or bulk notification systems, disposable inboxes ensure completely isolated sessions.
      </p>

      <div className="rounded-lg border border-border bg-muted/5 px-5 py-4 my-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">What you&apos;ll need</p>
        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1 mb-0">
          <li>A Startup, Growth, or Enterprise API key (high rate limits required)</li>
          <li>Test runner capable of parallel execution (e.g., Jest, Playwright, or custom scripts)</li>
          <li>WebSocket connectivity for parallel real-time listeners (optional, but recommended over polling)</li>
        </ul>
      </div>

      {/* ── Parallel Provisioning ── */}
      <h2 id="parallel-provisioning" className="text-lg font-semibold mt-10 mb-2">Mass Inbox Provisioning</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        You can create hundreds of inboxes concurrently. On the Enterprise plan, your rate limit allows up to 100 requests per second.
      </p>
      <CodeBlock
        language="typescript"
        code={`import { randomBytes } from "crypto";

const FCE_API = "https://api2.freecustom.email";
const API_KEY = process.env.FCE_API_KEY!;

// Generate a random inbox name
const genInbox = () => \`user-\${randomBytes(4).toString("hex")}@ditapi.info\`;

async function provisionInboxes(count: number): Promise<string[]> {
  const tasks = Array.from({ length: count }).map(async () => {
    const inbox = genInbox();
    const res = await fetch(\`\${FCE_API}/v1/inboxes\`, {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${API_KEY}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inbox }),
    });
    
    if (!res.ok) throw new Error(\`Failed to create: \${inbox}\`);
    return inbox;
  });

  // Execute concurrently
  return Promise.all(tasks);
}

// Provision 50 isolated inboxes in ~1 second
const accounts = await provisionInboxes(50);
console.log(accounts);`}
      />

      {/* ── WebSockets for Scale ── */}
      <h2 id="websocket-scale" className="text-lg font-semibold mt-10 mb-2">Real-time Bulk Listening (WebSockets)</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Polling 50+ inboxes via REST would quickly exhaust your rate limits and become sluggish. Instead, use WebSockets to listen to all inboxes with a single connection.
      </p>
      <CodeBlock
        language="typescript"
        code={`import WebSocket from "ws";

async function listenToAllInboxes(inboxes: string[]) {
  // 1. Get a WebSocket ticket
  const ticketRes = await fetch(\`\${FCE_API}/v1/ws-ticket\`, {
    method: "POST",
    headers: { Authorization: \`Bearer \${API_KEY}\` }
  });
  const { ticket } = await ticketRes.json();

  // 2. Connect
  const ws = new WebSocket(\`wss://api2.freecustom.email/v1/ws?ticket=\${ticket}\`);

  ws.on("open", () => {
    console.log("WebSocket connected.");
    // Subscribe to all inboxes
    inboxes.forEach(inbox => {
      ws.send(JSON.stringify({ type: "subscribe", inbox }));
    });
  });

  ws.on("message", (data) => {
    const event = JSON.parse(data.toString());
    
    if (event.type === "new_message") {
      console.log(\`[NEW EMAIL] \${event.inbox}: \${event.message.subject}\`);
      
      // Check if it's an OTP message
      if (event.message.otp) {
        console.log(\`Extracted OTP for \${event.inbox}: \${event.message.otp}\`);
        // Emit to your test framework's event bus...
      }
    }
  });

  return ws;
}

const wsConnection = await listenToAllInboxes(accounts);`}
      />

      {/* ── Webhooks Alternative ── */}
      <h2 id="webhooks" className="text-lg font-semibold mt-10 mb-2">Alternative: Webhooks</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        If you are testing asynchronous workflows spanning minutes or hours (e.g., drip campaigns, delayed welcome emails), keeping a WebSocket open is impractical. Instead, configure a webhook to receive POST notifications to your staging backend or CI listener.
      </p>
      <CodeBlock
        language="bash"
        code={`# Register a webhook for the inbox (Requires Growth/Enterprise plan)
curl -X POST "https://api2.freecustom.email/v1/webhooks" \\
  -H "Authorization: Bearer fce_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "inbox": "user-a1b2c3d4@ditapi.info",
    "url": "https://ci-runner.your-app.com/fce-callbacks"
  }'`}
      />

      <div className="mt-10 flex gap-3 flex-wrap">
        <Button asChild size="sm">
          <Link href="/api/docs/websocket">WebSocket Docs</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/api/docs/webhooks">Webhooks Docs →</Link>
        </Button>
      </div>
    </article>
  );
}