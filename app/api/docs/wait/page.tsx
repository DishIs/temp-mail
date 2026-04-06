import { CodeBlock } from "@/components/CodeBlock";
import { DocPageNav } from "../DocPageNav";
import { ResponseBlock } from "../ResponseBlock";

export const metadata = {
  title: "Wait API – API Docs",
  description: "Wait for incoming emails efficiently using Long Polling.",
};

export default function WaitApiPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Wait API</h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        The Wait API allows you to wait for a new email to arrive in a specified mailbox using Long Polling. This eliminates the need for rapid polling, reduces your request overhead, and ensures you get emails as soon as they arrive.
      </p>

      <div className="bg-muted/30 border border-border/50 rounded-lg p-4 mt-6 mb-8">
        <h3 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Important Considerations
        </h3>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li><strong>Plan Requirement:</strong> Available on <strong>Developer</strong> plan or above.</li>
          <li><strong>Billing:</strong> High-value endpoint; 1 successful wait call consumes <strong>10 monthly requests</strong>.</li>
          <li><strong>Connections:</strong> Only 1 concurrent wait request per inbox is allowed.</li>
        </ul>
      </div>

      <h2 id="wait" className="text-lg font-semibold mt-8 mb-2">GET /v1/inboxes/{`{inbox}`}/wait</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Hold the connection open until a new message arrives or the timeout is reached.
      </p>

      <h3 className="text-sm font-semibold mt-6 mb-2">Query Parameters</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20 text-foreground">
              <th className="py-2 px-4 font-medium">Parameter</th>
              <th className="py-2 px-4 font-medium">Type</th>
              <th className="py-2 px-4 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border/20">
              <td className="py-2 px-4"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">timeout</code></td>
              <td className="py-2 px-4 text-xs font-mono">integer</td>
              <td className="py-2 px-4">Maximum seconds to wait before returning a timeout response. Default: 30, Min: 10, Max: 60.</td>
            </tr>
            <tr className="border-b border-border/20">
              <td className="py-2 px-4"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">since</code></td>
              <td className="py-2 px-4 text-xs font-mono">string</td>
              <td className="py-2 px-4">Optional. Provide the ID of the last message seen. If a newer message already exists, it returns immediately instead of waiting.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <CodeBlock code={`curl "https://api2.freecustom.email/v1/inboxes/mytest@ditapi.info/wait?timeout=45" \\
  -H "Authorization: Bearer fce_your_api_key"`} language="curl" />

      <h3 className="text-sm font-semibold mt-6 mb-2">Responses</h3>
      <ResponseBlock status={200} label="New message received" body={`{
  "success": true,
  "message": "New message received",
  "data": {
    "id": "msg_01jqz3k4m5n6p7q8r9s0t1u2v3",
    "from": "noreply@github.com",
    "subject": "Your GitHub verification code",
    "date": "2026-03-04T09:55:00.000Z",
    "has_attachment": false,
    "otp": "482931",
    "verification_link": "https://github.com/verify?token=abc123"
  }
}`} />
      
      <p className="text-xs text-muted-foreground mt-2 mb-4">
        If no message arrives within the specified timeout period, the API will gracefully return a timeout response. You can immediately initiate another wait request.
      </p>

      <ResponseBlock status={200} label="Timeout Reached" body={`{
  "success": false,
  "message": "Timeout reached"
}`} />

      <ResponseBlock status={403} label="Plan or Plan Limit Restrictions" body={`{
  "success": false,
  "error": "forbidden",
  "message": "Wait API is not available on your current plan."
}`} />

      <ResponseBlock status={429} label="Too Many Concurrent Waits" body={`{
  "success": false,
  "error": "rate_limit",
  "message": "A wait operation is already in progress for this inbox."
}`} />

      <h2 id="examples" className="text-lg font-semibold mt-10 mb-4">Code Examples</h2>
      
      <h3 className="text-sm font-semibold mt-4 mb-2">Node.js (Fetch)</h3>
      <CodeBlock code={`async function waitForEmail(inbox, apiKey) {
  try {
    const url = \`https://api2.freecustom.email/v1/inboxes/\${inbox}/wait?timeout=60\`;
    const response = await fetch(url, {
      headers: { 'Authorization': \`Bearer \${apiKey}\` }
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('New email arrived:', data.data.subject);
      return data.data;
    } else {
      console.log('Timeout reached. Retrying...');
      return waitForEmail(inbox, apiKey); // Optional recursive retry
    }
  } catch (error) {
    console.error('Wait failed:', error);
  }
}`} language="javascript" />

      <h3 className="text-sm font-semibold mt-6 mb-2">Python (Requests)</h3>
      <CodeBlock code={`import requests

def wait_for_email(inbox, api_key):
    url = f"https://api2.freecustom.email/v1/inboxes/{inbox}/wait"
    headers = {"Authorization": f"Bearer {api_key}"}
    params = {"timeout": 60}
    
    try:
        # Note: requests timeout should be slightly longer than API timeout
        response = requests.get(url, headers=headers, params=params, timeout=65)
        data = response.json()
        
        if data.get("success"):
            print("New email arrived:", data["data"]["subject"])
            return data["data"]
        else:
            print("Timeout reached.")
            return None
    except requests.exceptions.RequestException as e:
        print("Wait failed:", e)
        return None`} language="python" />

      <DocPageNav prev={{ href: "/api/docs/otp", label: "OTP extraction" }} next={{ href: "/api/docs/mcp", label: "MCP" }} />
    </article>
  );
}
