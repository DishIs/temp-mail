import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";
import { ResponseBlock } from "../ResponseBlock";

export const metadata = {
  title: "MCP Access – AI-Native Email Workflows",
  description: "Model Context Protocol integration for FreeCustom.Email.",
};

export default function McpDocsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        MCP — AI-Native Email Workflows
      </h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Our MCP layer is not just another API client — it is a <strong>premium interface</strong> built specifically for AI agents, LLMs, and advanced automation systems. It wraps our backend architecture into intent-driven tools that AI agents can use out-of-the-box.
      </p>

      {/* Why MCP */}
      <h2 id="why-mcp" className="text-lg font-semibold mt-8 mb-2">
        Why MCP?
      </h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Traditional APIs require you to build logic: "create inbox", "poll for email", "parse text", "extract OTP". With our MCP, you use <strong>AI-native workflows</strong>. You provide the intent, and the server handles the complexity.
      </p>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mb-4">
        <li><strong>No Polling</strong>: Powered by long-polling and Redis pub/sub.</li>
        <li><strong>No Complex Logic</strong>: Single operations handle multi-step flows (e.g., <code className="rounded bg-muted px-1 py-0.5 text-xs">create_and_wait_for_otp</code>).</li>
        <li><strong>Agent-Ready</strong>: Simply attach the server to Claude Desktop, Cursor, or your custom agent framework.</li>
      </ul>

      {/* Plan gating */}
      <h2 id="plans" className="text-lg font-semibold mt-10 mb-2">
        Plan Requirements &amp; Feature Gating
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        The MCP layer is a premium feature, restricted to our higher-tier plans:
      </p>
      <div className="rounded-lg border border-border overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              {["Plan", "MCP Access", "Ops / min", "Concurrent sessions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Free",       ok: false, ops: "0", sess: "0" },
              { name: "Developer", ok: false, ops: "0", sess: "0" },
              { name: "Startup",   ok: false, ops: "0", sess: "0" },
              { name: "Growth",    ok: true,  ops: "60", sess: "5" },
              { name: "Enterprise",ok: true,  ops: "200", sess: "10" },
            ].map((r) => (
              <tr key={r.name} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  {r.ok ? <span className="text-foreground">✓ Included</span> : <span className="text-muted-foreground/40">✗ Blocked</span>}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.ops}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.sess}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-5 py-4 my-4">
        <h4 className="text-blue-500 font-semibold mb-2 text-sm">Important: OAuth Works with All Plans</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The OAuth authentication flow works with <strong>any valid API key</strong> (including Free plans). This allows you to connect to the MCP server and see available tools. However, actually <strong>executing MCP tools requires a Growth or Enterprise plan</strong>.
        </p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
          <li>✅ OAuth connection succeeds</li>
          <li>✅ Token exchange works</li>
          <li>❌ Using any MCP tool returns: <code className="text-xs bg-muted px-1 rounded">{"{"}error": "MCP not available on your plan", "upgrade": "Growth required{"}"}</code></li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2 italic">
          This is intentional — you can connect your API key and see the tools available, but you'll need to upgrade to use them.
        </p>
      </div>

      {/* Advanced Pricing */}
      <h2 id="pricing" className="text-lg font-semibold mt-10 mb-2">
        Advanced Pricing &amp; Billing
      </h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Because MCP tools perform advanced processing (combining authentication, inbox creation, listening, and extracting), <strong>MCP requests consume higher credits</strong> than normal API operations.
      </p>
      <div className="rounded-lg border border-border overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              {["Operation", "Action", "Cost (Multiplier)"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { op: "get_latest_email", action: "Fetch the latest message from an inbox", cost: "2×" },
              { op: "extract_otp", action: "Parse and extract OTP from an inbox", cost: "3×" },
              { op: "create_and_wait_for_otp", action: "Create inbox & wait for OTP in one call", cost: "5×" },
              { op: "watch_email", action: "Long-polling wait for new emails", cost: "10×" },
              { op: "All other tools", action: "Standard API operations", cost: "1×" },
            ].map((r) => (
              <tr key={r.op} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.op}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.action}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-foreground font-semibold">{r.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tools */}
      <h2 id="tools" className="text-lg font-semibold mt-10 mb-2">
        Tools Provided
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        We provide three categories of MCP tools: <strong>Email Operations</strong>, <strong>Inbox Management</strong>, and <strong>Custom Domain Management</strong>.
      </p>

      {/* Email Operations */}
      <h3 className="text-base font-semibold mt-6 mb-3">Email Operations</h3>

      <h4 id="get-latest-email" className="text-sm font-semibold mt-4 mb-1">
        <code>get_latest_email</code>
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        Retrieves the most recent email for a given inbox address.
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        <strong>Args:</strong> <code className="rounded bg-muted px-1 py-0.5 text-xs">inbox</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · required</span> — The full email address (e.g. <code className="rounded bg-muted px-1 py-0.5 text-xs">hello@ditube.info</code>)
      </p>

      <h4 id="extract-otp" className="text-sm font-semibold mt-6 mb-1">
        <code>extract_otp</code>
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        Directly retrieves the latest 4-6 digit code or verification link.
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        <strong>Args:</strong> <code className="rounded bg-muted px-1 py-0.5 text-xs">inbox</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · required</span> — The full email address of the inbox
      </p>

      <h4 id="create-and-wait" className="text-sm font-semibold mt-6 mb-1">
        <code>create_and_wait_for_otp</code>{" "}
        <span className="font-mono text-[10px] border border-foreground/30 text-foreground/70 rounded px-1.5 py-px ml-1">🔥 GOLD</span>
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        Generates a random inbox on our premium domains and holds the connection open until an OTP arrives. This allows an AI agent to execute a complete signup flow in a single tool call!
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        <strong>Args:</strong>{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">domain</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · optional · default ditube.info</span>
        {" · "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">timeout</code>{" "}
        <span className="text-muted-foreground/60 text-xs">number (10-60) · optional · default 45</span>
      </p>

      <h4 className="text-sm font-semibold mt-6 mb-1">
        <code>watch_email</code>
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        Long-polling wait for new emails on an existing inbox. Use this when you've already created an inbox and want to wait for the next incoming email.
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        <strong>Args:</strong>{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">inbox</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · required</span>
        {" · "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">timeout</code>{" "}
        <span className="text-muted-foreground/60 text-xs">number (10-60) · optional · default 30</span>
        {" · "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">since</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · optional · message ID to wait for newer messages</span>
      </p>

      <h4 className="text-sm font-semibold mt-6 mb-1">
        <code>get_messages</code>
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        Fetches multiple messages from an inbox.
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        <strong>Args:</strong>{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">inbox</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · required</span>
        {" · "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">limit</code>{" "}
        <span className="text-muted-foreground/60 text-xs">number (1-100) · optional · default 10</span>
        {" · "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">unread_only</code>{" "}
        <span className="text-muted-foreground/60 text-xs">boolean · optional</span>
      </p>

      <h4 className="text-sm font-semibold mt-6 mb-1">
        <code>delete_email</code>
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        Deletes a specific email from an inbox.
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        <strong>Args:</strong>{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">inbox</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · required</span>
        {" · "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">message_id</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · required</span>
      </p>

      {/* Inbox Management */}
      <h3 className="text-base font-semibold mt-8 mb-3">Inbox Management</h3>

      <h4 className="text-sm font-semibold mt-4 mb-1">
        <code>list_inboxes</code>
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        Lists all inboxes owned by the API key's account.
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        <strong>Args:</strong> (none)
      </p>

      {/* Custom Domain Management */}
      <h3 className="text-base font-semibold mt-8 mb-3">Custom Domain Management</h3>

      <h4 className="text-sm font-semibold mt-4 mb-1">
        <code>list_custom_domains</code>
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        Lists all custom domains associated with the account.
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        <strong>Args:</strong> (none)
      </p>

      <h4 className="text-sm font-semibold mt-6 mb-1">
        <code>add_custom_domain</code>
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        Adds a new custom domain to the account.
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        <strong>Args:</strong>{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">domain</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · required</span> — The custom domain to add (e.g. <code className="rounded bg-muted px-1 py-0.5 text-xs">mail.yourdomain.com</code>)
      </p>

      <h4 className="text-sm font-semibold mt-6 mb-1">
        <code>verify_custom_domain</code>
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        Initiates DNS verification for a custom domain.
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        <strong>Args:</strong>{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">domain</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · required</span> — The custom domain to verify
      </p>

      <h4 className="text-sm font-semibold mt-6 mb-1">
        <code>delete_custom_domain</code>
      </h4>
      <p className="text-sm text-muted-foreground mb-2">
        Deletes a custom domain from the account.
      </p>
      <p className="text-sm text-muted-foreground mb-2">
        <strong>Args:</strong>{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">domain</code>{" "}
        <span className="text-muted-foreground/60 text-xs">string · required</span> — The custom domain to delete
      </p>

      {/* MCP Hosting */}
      <h2 id="mcp" className="text-lg font-semibold mt-10 mb-2">
        MCP Hosting (Cloud-Based AI Agents)
      </h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        For cloud-based AI platforms that cannot run local commands (like Claude Web, Claude Desktop, Cursor, etc.), we provide hosted MCP endpoints. We support <strong>two transport protocols</strong>:
      </p>
      
      <div className="rounded-lg border border-border bg-muted/5 p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-foreground">1. Streamable HTTP</span>
          <span className="font-mono text-[10px] border border-green-500/30 text-green-600 rounded px-1.5 py-px">Recommended</span>
        </div>
        <p className="text-sm text-muted-foreground">New MCP standard, better for modern clients</p>
      </div>
      
      <div className="rounded-lg border border-border bg-muted/5 p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-foreground">2. SSE</span>
          <span className="font-mono text-[10px] border border-amber-500/30 text-amber-600 rounded px-1.5 py-px">Legacy</span>
        </div>
        <p className="text-sm text-muted-foreground">Legacy support for clients that require Server-Sent Events</p>
      </div>

      <h3 className="text-base font-semibold mt-6 mb-2">Base URL</h3>
      <CodeBlock
        language="text"
        code={`https://mcp.freecustom.email`}
      />

      <h3 className="text-base font-semibold mt-6 mb-2">Endpoints</h3>
      <div className="rounded-lg border border-border overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              {["Endpoint", "Method", "Transport", "Description"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { ep: "/mcp", method: "POST", transport: "Streamable HTTP", desc: "Primary MCP endpoint (recommended)" },
              { ep: "/mcp", method: "GET", transport: "Streamable HTTP", desc: "Initial MCP connection" },
              { ep: "/sse", method: "GET", transport: "SSE", desc: "Legacy SSE endpoint" },
              { ep: "/messages", method: "POST", transport: "SSE", desc: "Send messages (SSE only)" },
              { ep: "/authorize", method: "GET", transport: "OAuth", desc: "OAuth authorization" },
              { ep: "/token", method: "POST", transport: "OAuth", desc: "OAuth token exchange" },
            ].map((r) => (
              <tr key={r.ep + r.method} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.ep}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.method}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.transport}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-base font-semibold mt-6 mb-2">Which endpoint should I use?</h3>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mb-4">
        <li><strong>Claude Web / Modern clients</strong>: Use <code className="rounded bg-muted px-1 py-0.5 text-xs">/mcp</code> (Streamable HTTP)</li>
        <li><strong>Claude Desktop / Legacy clients</strong>: Use <code className="rounded bg-muted px-1 py-0.5 text-xs">/sse</code> (SSE)</li>
        <li>Both support the same authentication methods</li>
      </ul>

      <h3 className="text-base font-semibold mt-6 mb-2">Authentication</h3>
      <p className="text-sm text-muted-foreground mb-3">
        We support <strong>two authentication methods</strong>:
      </p>

      <h4 className="text-sm font-semibold mt-4 mb-2">Option 1: Direct API Key (Simple)</h4>
      <p className="text-sm text-muted-foreground mb-2">
        Pass your API key via the <code className="rounded bg-muted px-1 py-0.5 text-xs">Authorization</code> header or <code className="rounded bg-muted px-1 py-0.5 text-xs">access_token</code> query param:
      </p>
      <CodeBlock
        language="bash"
        code={`Authorization: Bearer YOUR_API_KEY`}
      />
      <p className="text-sm text-muted-foreground mt-2 mb-3">Or:</p>
      <CodeBlock
        language="bash"
        code={`GET /mcp?access_token=YOUR_API_KEY`}
      />

      <h4 className="text-sm font-semibold mt-6 mb-2">Option 2: OAuth 2.0 (Required by Some Clients)</h4>
      <p className="text-sm text-muted-foreground mb-3">
        Some AI clients (like Claude Web) require OAuth. We implement a simplified OAuth flow where your API key acts as the <code className="rounded bg-muted px-1 py-0.5 text-xs">client_id</code>:
      </p>
      <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-2 mb-4">
        <li><strong>Authorize</strong>: Redirect user to:</li>
      </ol>
      <CodeBlock
        language="bash"
        code={`GET /authorize?client_id=YOUR_API_KEY&redirect_uri=REDIRECT_URI&state=STATE&code_challenge=CHALLENGE&code_challenge_method=S256`}
      />
      <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-2 mb-4" start={2}>
        <li><strong>Token Exchange</strong>: Client exchanges the auth code for a token:</li>
      </ol>
      <CodeBlock
        language="bash"
        code={`POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=AUTH_CODE&client_id=YOUR_API_KEY`}
      />
      <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-2 mb-4" start={3}>
        <li><strong>Response</strong>:</li>
      </ol>
      <CodeBlock
        language="bash"
        code={`GET /.well-known/oauth-authorization-server`}
      />

      <h3 className="text-base font-semibold mt-6 mb-2">Endpoints</h3>
      <div className="rounded-lg border border-border overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              {["Endpoint", "Method", "Description"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { ep: "/sse", method: "GET", desc: "Establish SSE connection for real-time MCP communication" },
              { ep: "/messages", method: "POST", desc: "Send JSON-RPC messages to the MCP server" },
              { ep: "/authorize", method: "GET", desc: "OAuth authorization endpoint" },
              { ep: "/token", method: "POST", desc: "OAuth token exchange endpoint" },
              { ep: "/.well-known/oauth-authorization-server", method: "GET", desc: "OAuth metadata" },
            ].map((r) => (
              <tr key={r.ep} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.ep}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.method}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-base font-semibold mt-6 mb-2">Connecting with Streamable HTTP (/mcp)</h3>
      <p className="text-sm text-muted-foreground mb-3">
        The recommended endpoint for modern MCP clients. Uses the new Streamable HTTP transport protocol.
      </p>
      <CodeBlock
        language="bash"
        code={`# Streamable HTTP (recommended)
curl -X POST https://mcp.freecustom.email/mcp \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "claude-web",
        "version": "1.0.0"
      }
    },
    "id": 1
  }'`}
      />

      <h3 className="text-base font-semibold mt-6 mb-2">SSE Connection Example</h3>
      <CodeBlock
        language="bash"
        code={`# With Direct API Key
curl -N https://mcp.freecustom.email/sse \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: text/event-stream"

# With OAuth Token
curl -N https://mcp.freecustom.email/sse \\
  -H "Authorization: Bearer OAUTH_ACCESS_TOKEN" \\
  -H "Accept: text/event-stream"

# With Query Param
curl -N "https://mcp.freecustom.email/sse?access_token=YOUR_API_KEY" \\
  -H "Accept: text/event-stream"`}
      />

      <h3 className="text-base font-semibold mt-6 mb-2">Send Messages Example</h3>
      <CodeBlock
        language="bash"
        code={`curl -X POST "https://mcp.freecustom.email/messages?sessionId=SESSION_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_and_wait_for_otp",
      "arguments": {
        "domain": "ditube.info",
        "timeout": 45
      }
    }
  }'`}
      />

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-5 py-4 my-6">
        <h4 className="text-blue-500 font-semibold mb-2 text-sm">Quick Start for Claude Web</h4>
        <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
          <li>Open Claude Web (claude.ai)</li>
          <li>Go to <strong>Settings</strong> → <strong>Integrations</strong> → <strong>Add Custom Connector</strong></li>
          <li>Configure:
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li><strong>Name:</strong> <code className="rounded bg-muted px-1 py-0.5 text-xs">FreeCustom.Email MCP</code></li>
              <li><strong>Remote MCP Server URL:</strong> <code className="rounded bg-muted px-1 py-0.5 text-xs">https://mcp.freecustom.email/sse</code></li>
              <li><strong>OAuth Client ID:</strong> Your FreeCustom.Email API key</li>
            </ul>
          </li>
          <li>Click <strong>Connect</strong></li>
        </ol>
      </div>

      {/* JSON-RPC Protocol */}
      <h2 id="json-rpc" className="text-lg font-semibold mt-10 mb-2">
        JSON-RPC 2.0 Protocol
      </h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        The MCP server follows JSON-RPC 2.0 specification:
      </p>

      <h4 className="text-sm font-semibold mt-4 mb-2">Request Format</h4>
      <CodeBlock
        language="json"
        code={`{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "TOOL_NAME",
    "arguments": { ... }
  }
}`}
      />

      <h4 className="text-sm font-semibold mt-4 mb-2">Response Format</h4>
      <CodeBlock
        language="json"
        code={`{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { ... }
}`}
      />

      <h4 className="text-sm font-semibold mt-4 mb-2">Error Format</h4>
      <CodeBlock
        language="json"
        code={`{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": "Details here"
  }
}`}
      />

      <h3 className="text-base font-semibold mt-6 mb-2">Available Methods</h3>
      <div className="rounded-lg border border-border overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              {["Method", "Description"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { m: "initialize", desc: "Initialize the MCP connection, returns server capabilities" },
              { m: "tools/list", desc: "List all available tools" },
              { m: "tools/call", desc: "Call a specific tool with arguments" },
              { m: "resources/list", desc: "List available resources (if any)" },
              { m: "resources/read", desc: "Read a specific resource" },
            ].map((r) => (
              <tr key={r.m} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.m}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-base font-semibold mt-6 mb-2">Initialize Request Example</h3>
      <CodeBlock
        language="json"
        code={`{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "claude-web",
      "version": "1.0.0"
    }
  }
}`}
      />
      <ResponseBlock
        status={200}
        label="Initialize Response"
        body={`{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "serverInfo": {
      "name": "fce-mcp",
      "version": "1.0.9"
    }
  }
}`}
      />

      <h3 className="text-base font-semibold mt-6 mb-2">List Tools Request Example</h3>
      <CodeBlock
        language="json"
        code={`{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}`}
      />

      {/* Installation */}
      <h2 id="install" className="text-lg font-semibold mt-10 mb-2">
        Installation &amp; Setup
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        You can run our MCP server via <code className="rounded bg-muted px-1 py-0.5 text-xs">npx</code> or by installing it from source.
      </p>

      <h3 className="text-base font-semibold mt-6 mb-2">Option 1: NPX (Recommended)</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Configure your MCP client (e.g., Claude Desktop <code className="rounded bg-muted px-1 py-0.5 text-xs">claude_desktop_config.json</code>):
      </p>
      <CodeBlock
        language="json"
        code={`{
  "mcpServers": {
    "fce-mcp": {
      "command": "npx",
      "args": ["-y", "fce-mcp-server"],
      "env": {
        "FCE_API_KEY": "your_growth_or_enterprise_api_key"
      }
    }
  }
}`}
      />

      <h3 className="text-base font-semibold mt-6 mb-2">Option 2: From Source</h3>
      <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1 mb-4">
        <li>Clone this repository and navigate to <code className="rounded bg-muted px-1 py-0.5 text-xs">mcp-server/</code>.</li>
        <li>Run <code className="rounded bg-muted px-1 py-0.5 text-xs">npm install</code> and <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run build</code>.</li>
        <li>Add to your configuration using <code className="rounded bg-muted px-1 py-0.5 text-xs">node</code> and the <code className="rounded bg-muted px-1 py-0.5 text-xs">build/index.js</code> path.</li>
      </ol>

      {/* Abuse & Limits */}
      <h2 id="limits" className="text-lg font-semibold mt-10 mb-2">
        Abuse &amp; Limits
      </h2>
      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
        To ensure stability, MCP traffic runs through our Abuse Engine with strict limits applied <em>before</em> the normal rate-limiter:
      </p>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
        <li><strong>Ops/Minute Caps</strong>: 60 for Growth, 200 for Enterprise.</li>
        <li><strong>Timeout Caps</strong>: Connections are forcefully closed after 60 seconds to prevent hanging.</li>
        <li><strong>Multiplier Consumption</strong>: Requests immediately deduct their respective multipliers (1x, 2x, 3x, 5x, 10x) from your monthly allocation.</li>
      </ul>

      {/* Error Responses */}
      <h2 id="errors" className="text-lg font-semibold mt-10 mb-2">
        Error Responses
      </h2>
      <ResponseBlock
        status={403}
        label="Plan Not Available"
        body={`{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32001,
    "message": "FreeCustom.Email API Error: MCP not available on your plan...",
    "data": "Plan upgrade required"
  }
}`}
      />
      <ResponseBlock
        status={401}
        label="Invalid API Key"
        body={`{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32002,
    "message": "API error: Invalid API key",
    "data": "Authentication failed"
  }
}`}
      />
      <ResponseBlock
        status={404}
        label="Tool Not Found"
        body={`{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": "Tool 'invalid_tool' does not exist"
  }
}`}
      />
      <ResponseBlock
        status={400}
        label="Invalid Arguments"
        body={`{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": "Missing required parameter: inbox"
  }
}`}
      />

      <DocPageNav
        prev={{ href: "/api/docs/websocket", label: "WebSocket" }}
        next={{ href: "/api/docs/sdk", label: "SDKs" }}
      />
    </article>
  );
}
