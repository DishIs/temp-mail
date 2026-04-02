import { CodeBlock } from "@/components/CodeBlock";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "OTP Extraction – FreeCustom.Email Use Cases",
  description: "Parse verification codes from any email programmatically — no regex, no brittle patterns.",
};

export default function OtpExtractionPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/api/use-cases" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          ← Use Cases
        </Link>
        <span className="text-muted-foreground/30">/</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">OTP Extraction</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">OTP Extraction</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Our API automatically detects and extracts 4–8 digit codes and verification links from incoming emails. No regex, no template matching, no maintenance.
      </p>

      <div className="rounded-lg border border-border bg-muted/5 px-5 py-4 my-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Plan requirements</p>
        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1 mb-0">
          <li>Free plan: OTP detected but returns <code className="text-xs bg-muted/60 rounded px-1">__DETECTED__</code> (upgrade hint)</li>
          <li>Developer+ plan: Full OTP value returned via <code className="text-xs bg-muted/60 rounded px-1">GET /v1/inboxes/{"{inbox}"}/otp</code></li>
          <li>Growth+ plan: MCP <code className="text-xs bg-muted/60 rounded px-1">extract_otp</code> tool available</li>
        </ul>
      </div>

      {/* ── REST API ── */}
      <h2 id="rest" className="text-lg font-semibold mt-10 mb-2">Via REST API</h2>
      <CodeBlock
        language="curl"
        code={`# 1. Register inbox
curl -X POST https://api2.freecustom.email/v1/inboxes \\
  -H "Authorization: Bearer fce_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"inbox":"verify@ditapi.info"}'

# 2. Trigger signup/verification on the target service
# (your app code here)

# 3. Wait for email (long-poll — Developer+ plan)
curl "https://api2.freecustom.email/v1/inboxes/verify@ditapi.info/wait?timeout=30" \\
  -H "Authorization: Bearer fce_your_api_key"

# 4. Extract OTP
curl "https://api2.freecustom.email/v1/inboxes/verify@ditapi.info/otp" \\
  -H "Authorization: Bearer fce_your_api_key"`}
      />
      <CodeBlock
        language="json"
        code={`{
  "success": true,
  "data": {
    "inbox": "verify@ditapi.info",
    "otp": "847291",
    "verification_link": "https://acme.com/verify?token=abc123xyz",
    "from": "noreply@acme.com",
    "subject": "Your verification code is 847291",
    "message_id": "msg_01jqz3k4m5n6",
    "received_at": "2026-03-04T09:55:00.000Z"
  }
}`}
      />

      {/* ── Node SDK ── */}
      <h2 id="node-sdk" className="text-lg font-semibold mt-10 mb-2">Node.js SDK</h2>
      <CodeBlock
        language="typescript"
        code={`import { FreecustomEmailClient } from "freecustom-email";

const client = new FreecustomEmailClient({ apiKey: process.env.FCE_API_KEY! });

// Register inbox
await client.inboxes.register("verify@ditapi.info");

// Trigger your signup flow here...

// Wait for and extract OTP automatically
const otp = await client.otp.waitFor("verify@ditapi.info");
console.log("OTP:", otp); // "847291"

// Or get OTP + verification link together (without waiting)
const result = await client.otp.get("verify@ditapi.info");
console.log(result.otp, result.verification_link);`}
      />

      {/* ── Python SDK ── */}
      <h2 id="python-sdk" className="text-lg font-semibold mt-10 mb-2">Python SDK</h2>
      <CodeBlock
        language="python"
        code={`import asyncio, os
from freecustom_email import FreeCustomEmail

client = FreeCustomEmail(api_key=os.environ["FCE_API_KEY"])

async def main():
    await client.inboxes.register("verify@ditapi.info")
    
    # Trigger your signup flow here...
    
    # Wait for and extract OTP automatically
    otp = await client.otp.wait_for("verify@ditapi.info")
    print("OTP:", otp)

asyncio.run(main())`}
      />

      {/* ── Link-based verification ── */}
      <h2 id="verification-links" className="text-lg font-semibold mt-10 mb-2">
        Verification Links
      </h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Some services send a click-to-verify link instead of a numeric OTP. The API and SDKs extract both:
      </p>
      <CodeBlock
        language="typescript"
        code={`const result = await client.otp.waitFor("verify@ditapi.info");

if (result.verification_link) {
  // Navigate to the link in Playwright
  await page.goto(result.verification_link);
} else if (result.otp) {
  // Enter the code in the form
  await page.fill('[name="otp"]', result.otp);
  await page.click('[type="submit"]');
}`}
      />

      <div className="mt-10 flex gap-3 flex-wrap">
        <Button asChild size="sm">
          <Link href="/api/docs/otp">OTP API reference</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/api/use-cases/ai-agents">AI agent integration →</Link>
        </Button>
      </div>
    </article>
  );
}