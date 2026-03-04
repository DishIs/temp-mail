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
      <p className="text-sm text-muted-foreground mt-2">Or use <code className="rounded bg-muted px-1 py-0.5 text-xs">Authorization: Bearer fce_xxx</code> and <code className="rounded bg-muted px-1 py-0.5 text-xs">mailbox</code> in the query.</p>

      <h2 id="limits" className="text-lg font-semibold mt-8 mb-2">Connection limits per plan</h2>
      <p className="text-sm text-muted-foreground">Startup: 5 concurrent · Growth: 20 · Enterprise: 100.</p>

      <h2 id="events" className="text-lg font-semibold mt-8 mb-2">Event: new_mail</h2>
      <p className="text-sm text-muted-foreground mb-3">Payload includes message id, from, subject, date, and body snippet. Full schema is in the OpenAPI spec.</p>

      <h2 id="heartbeat" className="text-lg font-semibold mt-8 mb-2">Heartbeat</h2>
      <p className="text-sm text-muted-foreground mb-3">Send <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"type\": \"ping\" }"}</code>; receive <code className="rounded bg-muted px-1 py-0.5 text-xs">{"{ \"type\": \"pong\", \"ts\": 1234567890 }"}</code>.</p>

      <h2 id="node" className="text-lg font-semibold mt-8 mb-2">Node.js example (ws)</h2>
      <CodeBlock code={`const WebSocket = require("ws");
const ws = new WebSocket(
  "wss://api2.freecustom.email/v1/ws?api_key=" + process.env.FCE_API_KEY + "&mailbox=test@ditmail.info"
);
ws.on("message", (data) => console.log(JSON.parse(data)));
ws.on("open", () => ws.send(JSON.stringify({ type: "ping" })));`} language="javascript" />

      <h2 id="python" className="text-lg font-semibold mt-8 mb-2">Python example (websockets)</h2>
      <CodeBlock code={`import asyncio
import websockets
import json

async def main():
    uri = "wss://api2.freecustom.email/v1/ws?api_key=YOUR_KEY&mailbox=test@ditmail.info"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({"type": "ping"}))
        async for msg in ws:
            print(json.loads(msg))

asyncio.run(main())`} language="python" />

      <DocPageNav prev={{ href: "/api/docs/otp", label: "OTP extraction" }} next={{ href: "/api/docs/rate-limits", label: "Rate limits" }} />
    </article>
  );
}
