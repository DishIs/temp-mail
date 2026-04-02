import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";
import { ResponseBlock } from "../ResponseBlock";

export const metadata = {
  title: "Webhooks – API Docs",
  description: "Subscribe to real-time message notifications via HTTP webhooks.",
};

export default function WebhooksPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Webhooks</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Subscribe to real-time HTTP POST notifications when new emails arrive in your registered inboxes. Webhooks require the <strong>Growth</strong> plan or above.
      </p>

      {/* Register */}
      <h2 id="register" className="text-lg font-semibold mt-8 mb-2">
        POST /v1/webhooks
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Register a webhook URL for a specific inbox. The URL must be publicly reachable over HTTPS.
      </p>
      <CodeBlock
        language="curl"
        code={`curl -X POST https://api2.freecustom.email/v1/webhooks \\
  -H "Authorization: Bearer fce_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-server.com/callback",
    "inbox": "target@ditapi.info"
  }'`}
      />
      <h3 className="text-sm font-semibold mt-4 mb-2">Request body</h3>
      <div className="rounded-lg border border-border overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              {["Field", "Type", "Required", "Description"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-4 py-2.5 font-mono text-xs text-foreground">url</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">string (uri)</td>
              <td className="px-4 py-2.5 font-mono text-xs text-foreground">✓</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">HTTPS endpoint to receive POST requests.</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 font-mono text-xs text-foreground">inbox</td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">string (email)</td>
              <td className="px-4 py-2.5 font-mono text-xs text-foreground">✓</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">A registered inbox under your account.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-semibold mt-4 mb-1">Responses</h3>
      <ResponseBlock
        status={201}
        label="Webhook registered"
        body={`{
  "success": true,
  "id": "wh_01jqz4abc123",
  "inbox": "target@ditapi.info",
  "url": "https://your-server.com/callback"
}`}
      />
      <ResponseBlock
        status={403}
        label="Plan too low or inbox not owned"
        body={`{
  "success": false,
  "error": "plan_required",
  "message": "Webhooks require the Growth plan ($49/mo) or above.",
  "upgrade_url": "https://freecustom.email/api/pricing"
}`}
      />

      {/* List */}
      <h2 id="list" className="text-lg font-semibold mt-10 mb-2">
        GET /v1/webhooks
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Returns all active webhook subscriptions for your account.
      </p>
      <CodeBlock
        language="curl"
        code={`curl "https://api2.freecustom.email/v1/webhooks" \\
  -H "Authorization: Bearer fce_your_api_key"`}
      />
      <ResponseBlock
        status={200}
        label="Success"
        body={`{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "wh_01jqz4abc123",
      "inbox": "target@ditapi.info",
      "url": "https://your-server.com/callback",
      "createdAt": "2026-03-04T10:00:00.000Z",
      "failureCount": 0
    }
  ]
}`}
      />

      {/* Delete */}
      <h2 id="delete" className="text-lg font-semibold mt-10 mb-2">
        DELETE /v1/webhooks/{`{id}`}
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        Unregisters a webhook by its ID. The ID is returned when you register a webhook.
      </p>
      <CodeBlock
        language="curl"
        code={`curl -X DELETE "https://api2.freecustom.email/v1/webhooks/wh_01jqz4abc123" \\
  -H "Authorization: Bearer fce_your_api_key"`}
      />
      <ResponseBlock
        status={200}
        label="Deleted"
        body={`{
  "success": true,
  "message": "Webhook wh_01jqz4abc123 unregistered."
}`}
      />
      <ResponseBlock
        status={404}
        label="Not found"
        body={`{
  "success": false,
  "error": "not_found",
  "message": "Webhook wh_01jqz4abc123 not found."
}`}
      />

      {/* Payload */}
      <h2 id="payload" className="text-lg font-semibold mt-10 mb-2">
        Webhook Payload
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        When a new email arrives in a subscribed inbox, we send a{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">POST</code> request to your URL with the
        following JSON body:
      </p>
      <CodeBlock
        language="json"
        code={`{
  "event": "new_message",
  "inbox": "target@ditapi.info",
  "message": {
    "id": "msg_01jqz3k4m5n6p7q8",
    "from": "noreply@github.com",
    "subject": "Your GitHub verification code",
    "date": "2026-03-04T09:55:00.000Z",
    "has_attachment": false,
    "otp": "482931",
    "verification_link": "https://github.com/verify?token=abc123"
  }
}`}
      />
      <p className="text-xs text-muted-foreground mt-2">
        Respond with any <code className="rounded bg-muted px-1 py-0.5">2xx</code> status to acknowledge receipt. We retry up to 3 times with exponential backoff on failure. After 10 consecutive failures the webhook is automatically disabled.
      </p>

      {/* Verifying signatures */}
      <h2 id="security" className="text-lg font-semibold mt-10 mb-2">
        Security
      </h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        All webhook requests include an{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">X-FCE-Signature</code> header containing an
        HMAC-SHA256 signature of the raw request body, signed with your API key. Verify it to ensure the
        request originated from FreeCustom.Email:
      </p>
      <CodeBlock
        language="typescript"
        code={`import crypto from "crypto";

function verifyWebhook(rawBody: string, signature: string, apiKey: string) {
  const expected = crypto
    .createHmac("sha256", apiKey)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}`}
      />

      {/* Integration examples */}
      <h2 id="examples" className="text-lg font-semibold mt-10 mb-2">
        Integration Examples
      </h2>

      <h3 className="text-sm font-semibold mt-4 mb-2">Node.js / Express</h3>
      <CodeBlock
        language="typescript"
        code={`import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.raw({ type: "application/json" }));

app.post("/callback", (req, res) => {
  const sig = req.headers["x-fce-signature"] as string;
  const raw = req.body.toString();

  if (!verifyWebhook(raw, sig, process.env.FCE_API_KEY!)) {
    return res.status(401).send("Invalid signature");
  }

  const { event, inbox, message } = JSON.parse(raw);
  console.log(\`New email in \${inbox}: OTP = \${message.otp}\`);

  res.sendStatus(200);
});`}
      />

      <h3 className="text-sm font-semibold mt-6 mb-2">Python / FastAPI</h3>
      <CodeBlock
        language="python"
        code={`import hmac, hashlib, os
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

@app.post("/callback")
async def webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("x-fce-signature", "")
    expected = hmac.new(
        os.environ["FCE_API_KEY"].encode(),
        body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, sig):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    print(f"OTP: {payload['message']['otp']}")
    return {"ok": True}`}
      />

      <DocPageNav
        prev={{ href: "/api/docs/otp", label: "OTP extraction" }}
        next={{ href: "/api/docs/websocket", label: "WebSocket" }}
      />
    </article>
  );
}