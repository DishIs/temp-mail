import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";

export const metadata = {
  title: "WebSocket – API Docs",
  description: "Real-time email delivery via WebSocket.",
};

export default function WebSocketPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">WebSocket</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Subscribe to an inbox over a persistent WebSocket to receive new messages in real time. Available on Startup plan and above. Each push event counts as one request toward your monthly quota.
      </p>

      <h2 id="url" className="text-lg font-semibold mt-8 mb-2">Connection URL</h2>
      <CodeBlock code={`wss://api2.freecustom.email/v1/ws?api_key=fce_xxx&mailbox=addr@domain.com`} language="text" />
      <p className="text-sm text-muted-foreground mt-2">Query <code className="rounded bg-muted px-1 py-0.5 text-xs">mailbox</code> is optional — omit to subscribe to all registered inboxes.</p>

      <h2 id="limits" className="text-lg font-semibold mt-8 mb-2">Connection limits per plan</h2>
      <p className="text-sm text-muted-foreground">Startup: 5 concurrent · Growth: 20 · Enterprise: 100. Requires Startup plan or higher.</p>

      <h2 id="events" className="text-lg font-semibold mt-8 mb-2">Server events</h2>
      <p className="text-sm text-muted-foreground mb-2"><strong>On connect:</strong> <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"type\": \"connected\", \"plan\": \"startup\", \"subscribed_to\": [...], \"max_connections\": 5, \"current_connections\": 2 }"}</code></p>
      <p className="text-sm text-muted-foreground mb-2"><strong>New email:</strong> <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"type\": \"new_message\", \"inbox\": \"...\", \"message\": { \"id\", \"from\", \"subject\", \"date\", \"has_attachment\", \"otp\", \"verification_link\" } }"}</code></p>
      <p className="text-sm text-muted-foreground mb-3"><strong>Heartbeat:</strong> Server sends <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"type\": \"ping\" }"}</code> every 30s; client responds with <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"type\": \"pong\" }"}</code>.</p>

      <h2 id="errors" className="text-lg font-semibold mt-8 mb-2">Close codes</h2>
      <p className="text-sm text-muted-foreground">4001 — Invalid/missing API key · 4003 — Plan too low · 4004 — Inbox not registered · 4029 — Connection limit reached. Error payload: <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"type\": \"error\", \"code\": \"...\", \"message\": \"...\", \"upgrade_url\": \"...\" }"}</code></p>

      <h2 id="node" className="text-lg font-semibold mt-8 mb-2">Node.js example (ws)</h2>
      <CodeBlock code={`const WebSocket = require("ws");
const ws = new WebSocket(
  "wss://api2.freecustom.email/v1/ws?api_key=" + process.env.FCE_API_KEY + "&mailbox=test@ditapi.info"
);
ws.on("message", (data) => console.log(JSON.parse(data)));
ws.on("open", () => ws.send(JSON.stringify({ type: "pong" })));`} language="javascript" />

      <h2 id="python" className="text-lg font-semibold mt-8 mb-2">Python example (websockets)</h2>
      <CodeBlock code={`import asyncio
import websockets
import json

async def main():
    uri = "wss://api2.freecustom.email/v1/ws?api_key=YOUR_KEY&mailbox=test@ditapi.info"
    async with websockets.connect(uri) as ws:
        async for msg in ws:
            data = json.loads(msg)
            if data.get("type") == "ping":
                await ws.send(json.dumps({"type": "pong"}))
            else:
                print(data)

asyncio.run(main())`} language="python" />

      <DocPageNav prev={{ href: "/api/docs/otp", label: "OTP extraction" }} next={{ href: "/api/docs/rate-limits", label: "Rate limits" }} />
    </article>
  );
}
