import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../../DocPageNav";

export const metadata = {
  title: "Python SDK – API Docs",
  description: "Official Python SDK for FreeCustom.Email. pip install freecustom-email.",
};

export default function PythonSdkPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground">PyPI</span>
          <a
            href="https://pypi.org/project/freecustom-email/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            freecustom-email
          </a>
          <span className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground">Python 3.9+</span>
          <span className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground">async + sync</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Python SDK</h1>
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
      <h2 id="install" className="text-lg font-semibold mt-8 mb-3">📦 Installation</h2>
      <CodeBlock code={`pip install freecustom-email`} language="bash" />

      {/* Quick start */}
      <h2 id="quickstart" className="text-lg font-semibold mt-8 mb-3">🚀 Quick Start (Auth Flow Testing)</h2>
      <CodeBlock code={`import asyncio
from freecustom_email import FreeCustomEmail

async def main():
    client = FreeCustomEmail(api_key="fce_your_api_key_here")
    email = "test@ditube.info"

    # 1. Create inbox (pass \`is_testing=True\` for zero-latency testing mode)
    await client.inboxes.register(email, is_testing=True)

    # 2. Start test run (NEW - Groups events in your timeline)
    await client.inboxes.start_test(email, "signup-test-1")

    # 3. Trigger your app (e.g. using httpx or playwright)
    # await httpx.post("https://yourapp.com/api/send-otp", json={"email": email})

    # 4. Wait for OTP
    otp = await client.otp.wait_for(email)
    print(f"OTP: {otp}")

    # 5. Debug the full flow
    timeline = await client.inboxes.get_timeline(email, "signup-test-1")
    print(timeline)

if __name__ == "__main__":
    asyncio.run(main())`} language="python" />

      {/* Debugging */}
      <h2 id="debugging" className="text-lg font-semibold mt-10 mb-3">🔥 Debug Your Auth Flow</h2>
      
      <h3 className="text-base font-semibold mt-6 mb-2">Timeline (see what actually happened)</h3>
      <CodeBlock code={`timeline = await client.inboxes.get_timeline(email)
for event in timeline.events:
    print(f"[{event.type}] - {event.time}ms")`} language="python" />

      <h3 className="text-base font-semibold mt-6 mb-2">Insights (why your test failed)</h3>
      <CodeBlock code={`insights = await client.inboxes.get_insights(email)
for insight in insights:
    print(f"[{insight.type}] {insight.message}")`} language="python" />

      <h3 className="text-base font-semibold mt-6 mb-2">Test Runs (group your flows)</h3>
      <CodeBlock code={`await client.inboxes.start_test(email, "signup-test-1")
timeline = await client.inboxes.get_timeline(email, "signup-test-1")`} language="python" />

      {/* Real-time */}
      <h2 id="realtime" className="text-lg font-semibold mt-10 mb-3">⚡ Real-time Debugging (WebSocket)</h2>
      <CodeBlock code={`ws = client.realtime(mailbox=email)

@ws.on("email")
async def on_email(event):
    print(f"Flow update: {event}")

await ws.connect()
await ws.wait()`} language="python" />

      {/* Sync */}
      <h2 id="sync" className="text-lg font-semibold mt-10 mb-3">⚙️ Synchronous Mode (Selenium / Pytest)</h2>
      <CodeBlock code={`from freecustom_email import FreeCustomEmail

client = FreeCustomEmail(api_key="fce_...", sync=True)

# 1. Register
client.inboxes.register("test@ditube.info", is_testing=True)

# 2. Wait
otp = client.otp.wait_for("test@ditube.info")
print("OTP:", otp)`} language="python" />

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
        <li><code className="bg-muted px-1 rounded">client.inboxes.start_test(email, test_id)</code></li>
        <li><code className="bg-muted px-1 rounded">client.otp.wait_for(email)</code></li>
        <li><code className="bg-muted px-1 rounded">client.inboxes.get_timeline(email, test_id)</code></li>
        <li><code className="bg-muted px-1 rounded">client.inboxes.get_insights(email)</code></li>
      </ul>

      {/* Links */}
      <div className="mt-10 p-4 rounded-lg border border-border bg-muted/10 text-sm text-muted-foreground not-prose">
        <p className="font-medium text-foreground mb-2">Links</p>
        <ul className="space-y-1">
          <li>
            <a href="https://pypi.org/project/freecustom-email/" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4 hover:no-underline">
              pypi.org/project/freecustom-email
            </a>
            {" "}— PyPI package page
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
        prev={{ href: "/api/docs/sdk/npm", label: "JavaScript / TypeScript SDK" }}
        next={{ href: "/api/docs/websocket", label: "WebSocket" }}
      />
    </article>
  );
}
