// app/api/docs/sdk/python/page.tsx
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
            freecustom-email 1.0.0
          </a>
          <span className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground">Python 3.9+</span>
          <span className="font-mono text-[10px] border border-border rounded px-2 py-px text-muted-foreground">async + sync</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Python SDK</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Official Python client for FreeCustom.Email. Async-first with a synchronous fallback, full type annotations, dataclass response models, and typed exceptions. Requires Python 3.9 or later.
        </p>
      </div>

      {/* Install */}
      <h2 id="install" className="text-lg font-semibold mt-8 mb-3">Installation</h2>
      <CodeBlock code={`pip install freecustom-email`} language="bash" />
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        This installs <code className="rounded bg-muted px-1 py-0.5 text-xs">httpx</code> (HTTP client) and <code className="rounded bg-muted px-1 py-0.5 text-xs">websockets</code> automatically.
      </p>

      {/* Async quick start */}
      <h2 id="quickstart-async" className="text-lg font-semibold mt-10 mb-3">Quick start — async (recommended)</h2>
      <CodeBlock code={`import asyncio
import os
from freecustom_email import FreeCustomEmail

async def main():
    client = FreeCustomEmail(api_key=os.environ["FCE_API_KEY"])

    # 1. Register a disposable inbox
    await client.inboxes.register("test@ditapi.info")

    # 2. (trigger your app to send a verification email)

    # 3. Wait for OTP — polls until it arrives (Growth plan+)
    otp = await client.otp.wait_for("test@ditapi.info", timeout_ms=30_000)
    print(f"OTP: {otp}")  # '847291'

    # 4. Clean up
    await client.inboxes.unregister("test@ditapi.info")

asyncio.run(main())`} language="python" />

      {/* Sync quick start */}
      <h2 id="quickstart-sync" className="text-lg font-semibold mt-10 mb-3">Quick start — sync</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Pass <code className="rounded bg-muted px-1 py-0.5 text-xs">sync=True</code> for synchronous usage — no <code className="rounded bg-muted px-1 py-0.5 text-xs">asyncio</code> needed. Ideal for scripts, Django views, and pytest without asyncio.
      </p>
      <CodeBlock code={`from freecustom_email import FreeCustomEmail

client = FreeCustomEmail(api_key="fce_...", sync=True)

client.inboxes.register("test@ditapi.info")
otp = client.otp.wait_for("test@ditapi.info", timeout_ms=30_000)
print(f"OTP: {otp}")`} language="python" />

      {/* Client config */}
      <h2 id="client" className="text-lg font-semibold mt-10 mb-3">Client configuration</h2>
      <CodeBlock code={`from freecustom_email import FreeCustomEmail

client = FreeCustomEmail(
    api_key="fce_...",                    # required
    base_url="https://...",               # optional — defaults to https://api2.freecustom.email/v1
    timeout=10.0,                         # optional — seconds (default: 10.0)
    retry_attempts=2,                     # optional — retries on timeout/network errors
    retry_initial_delay=0.5,              # optional — exponential backoff base (seconds)
    sync=False,                           # optional — True for synchronous usage
)`} language="python" />

      {/* Inboxes */}
      <h2 id="inboxes" className="text-lg font-semibold mt-10 mb-3">Inboxes</h2>
      <CodeBlock code={`# Register
result = await client.inboxes.register("mytest@ditapi.info")
# RegisterInboxResult(success=True, message='Inbox registered.', inbox='mytest@ditapi.info')

# List all registered inboxes
inboxes = await client.inboxes.list()
# [InboxObject(inbox='mytest@ditapi.info', local='mytest', domain='ditapi.info')]

# Unregister
await client.inboxes.unregister("mytest@ditapi.info")`} language="python" />

      {/* Messages */}
      <h2 id="messages" className="text-lg font-semibold mt-10 mb-3">Messages</h2>
      <CodeBlock code={`# List all messages
messages = await client.messages.list("mytest@ditapi.info")
for msg in messages:
    print(msg.subject, msg.otp, msg.verification_link)
    print(msg.from_)  # Note: 'from_' not 'from' (Python keyword)

# Get a single message
msg = await client.messages.get("mytest@ditapi.info", "D3vt8NnEQ")

# Delete
await client.messages.delete("mytest@ditapi.info", "D3vt8NnEQ")

# Wait for a message matching a condition
msg = await client.messages.wait_for(
    "mytest@ditapi.info",
    timeout_ms=30_000,
    poll_interval_ms=2_000,
    match=lambda m: "github" in m.from_,
)`} language="python" />

      {/* OTP */}
      <h2 id="otp" className="text-lg font-semibold mt-10 mb-3">OTP extraction</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        OTP extraction requires <strong>Growth plan or above</strong>.
      </p>
      <CodeBlock code={`# Get latest OTP (returns None if no OTP email found)
result = await client.otp.get("mytest@ditapi.info")
if result.otp:
    print(f"OTP: {result.otp}")                       # '847291'
    print(f"Link: {result.verification_link}")         # 'https://...'
    print(f"From: {result.from_}")

# Poll until OTP arrives — most common in test automation
otp = await client.otp.wait_for(
    "mytest@ditapi.info",
    timeout_ms=30_000,      # raise WaitTimeoutError after 30s
    poll_interval_ms=2_000, # check every 2s
)
print(f"Got OTP: {otp}")`} language="python" />

      {/* Full flow */}
      <h2 id="full-flow" className="text-lg font-semibold mt-10 mb-3">Full verification flow</h2>
      <CodeBlock code={`import httpx

async def trigger_signup():
    """Trigger your app to send a verification email."""
    async with httpx.AsyncClient() as http:
        await http.post(
            "https://yourapp.com/api/send-verification",
            json={"email": "mytest@ditapi.info"},
        )

otp = await client.get_otp_for_inbox(
    inbox="mytest@ditapi.info",
    trigger_fn=trigger_signup,
    timeout_ms=30_000,
    auto_unregister=True,   # cleans up the inbox afterwards
)
print(f"Verified! OTP was: {otp}")`} language="python" />

      {/* WebSocket */}
      <h2 id="websocket" className="text-lg font-semibold mt-10 mb-3">Real-time WebSocket</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Requires <strong>Startup plan or above</strong>. Email events arrive in under 200ms with no polling.
      </p>
      <CodeBlock code={`ws = client.realtime(
    mailbox="mytest@ditapi.info",  # omit to subscribe to all your inboxes
    auto_reconnect=True,
    reconnect_delay=3.0,            # seconds between reconnect attempts
    max_reconnect_attempts=10,
    ping_interval=30.0,             # keepalive ping interval in seconds
)

@ws.on("connected")
async def on_connect(info):
    print(f"Connected — plan: {info.plan}")
    print(f"Subscribed: {info.subscribed_inboxes}")

@ws.on("email")
async def on_email(email):
    print(f"From: {email.from_}")
    print(f"Subject: {email.subject}")
    print(f"OTP: {email.otp}")             # already extracted
    print(f"Link: {email.verification_link}")

@ws.on("disconnected")
async def on_disconnect(code, reason):
    print(f"Disconnected: {code} {reason}")

@ws.on("reconnecting")
async def on_reconnect(attempt, max_attempts):
    print(f"Reconnecting {attempt}/{max_attempts}...")

@ws.on("error")
async def on_error(event):
    print(f"Error: {event.message}")
    if event.upgrade_url:
        print(f"Upgrade at: {event.upgrade_url}")

await ws.connect()

# Block until disconnected — use in long-running processes
await ws.wait()

# Or disconnect manually
await ws.disconnect()`} language="python" />

      {/* Webhooks */}
      <h2 id="webhooks" className="text-lg font-semibold mt-10 mb-3">Webhooks</h2>
      <CodeBlock code={`# Register a webhook — your URL gets a POST on every new email
hook = await client.webhooks.register(
    inbox="mytest@ditapi.info",
    url="https://your-server.com/hooks/email",
)
print(f"Webhook ID: {hook.id}")

# List
hooks = await client.webhooks.list()

# Unregister
await client.webhooks.unregister(hook.id)`} language="python" />

      {/* Domains */}
      <h2 id="domains" className="text-lg font-semibold mt-10 mb-3">Domains</h2>
      <CodeBlock code={`# Available domains on your plan
domains = await client.domains.list()

# With expiry metadata
all_domains = await client.domains.list_with_expiry()
for d in all_domains:
    if d.expiring_soon:
        print(f"{d.domain} expires in {d.expires_in_days} days")

# Custom domains (Growth plan+)
custom = await client.domains.list_custom()

result = await client.domains.add_custom("mail.yourdomain.com")
print("Add these DNS records:")
for rec in result.dns_records:
    print(f"  {rec.type} {rec.hostname} → {rec.value}")

v = await client.domains.verify_custom("mail.yourdomain.com")
print(f"Verified: {v.verified}")

await client.domains.remove_custom("mail.yourdomain.com")`} language="python" />

      {/* Account */}
      <h2 id="account" className="text-lg font-semibold mt-10 mb-3">Account</h2>
      <CodeBlock code={`info = await client.account.info()
print(info.plan, info.credits, info.api_inbox_count)
print(info.features.otp_extraction)  # True/False

usage = await client.account.usage()
print(f"{usage.requests_used} / {usage.requests_limit} requests used")
print(f"Resets at: {usage.resets}")`} language="python" />

      {/* Error handling */}
      <h2 id="errors" className="text-lg font-semibold mt-10 mb-3">Error handling</h2>
      <CodeBlock code={`from freecustom_email.errors import (
    FreecustomEmailError,
    AuthError,
    PlanError,
    RateLimitError,
    NotFoundError,
    TimeoutError,
    WaitTimeoutError,
)

try:
    otp = await client.otp.wait_for("mytest@ditapi.info")

except AuthError:
    # 401 — invalid or revoked API key
    print("Invalid API key")

except PlanError as e:
    # 403 — operation requires a higher plan
    print(f"Plan too low: {e}")
    print(f"Upgrade at: {e.upgrade_url}")

except RateLimitError as e:
    # 429 — rate limited
    print(f"Rate limited. Retry after {e.retry_after}s")

except WaitTimeoutError as e:
    # wait_for() timed out — no OTP arrived
    print(f"No OTP arrived in {e.timeout_ms}ms for {e.inbox}")

except NotFoundError:
    # 404 — inbox not registered
    print("Inbox not found or not registered")

except FreecustomEmailError as e:
    # catch-all for any other API error
    print(f"[{e.status}] {e.code}: {e}")`} language="python" />

      {/* Type annotations */}
      <h2 id="types" className="text-lg font-semibold mt-10 mb-3">Type annotations</h2>
      <CodeBlock code={`from freecustom_email.types import (
    InboxObject,
    Message,
    Attachment,
    OtpResult,
    DomainInfo,
    CustomDomain,
    AccountInfo,
    UsageStats,
    Webhook,
    WsConnectedEvent,
    WsEmailEvent,
    WsErrorEvent,
)

async def handle_email(email: WsEmailEvent) -> None:
    if email.otp:
        await submit_verification(email.otp)`} language="python" />

      {/* Use in tests */}
      <h2 id="testing" className="text-lg font-semibold mt-10 mb-3">Use in test automation</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Typical pytest pattern — register a unique inbox per test, trigger signup, capture OTP, verify, clean up.
      </p>
      <CodeBlock code={`import pytest
import asyncio
from freecustom_email import FreeCustomEmail

@pytest.fixture
async def client():
    return FreeCustomEmail(api_key=os.environ["FCE_API_KEY"])

@pytest.mark.asyncio
async def test_signup_verification(client, test_app):
    inbox = "pytest-signup@ditapi.info"
    
    otp = await client.get_otp_for_inbox(
        inbox=inbox,
        trigger_fn=lambda: test_app.signup(email=inbox),
        timeout_ms=20_000,
    )
    
    result = await test_app.verify(email=inbox, otp=otp)
    assert result.verified is True`} language="python" />

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
          <li>
            <Link href="/api/docs/errors" className="text-foreground underline underline-offset-4 hover:no-underline">
              Error reference
            </Link>
            {" "}— all API error codes
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