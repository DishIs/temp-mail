import { CodeBlock } from "@/components/CodeBlock";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Security & Penetration Testing – FreeCustom.Email Use Cases",
  description: "Use disposable inboxes in controlled security assessments to test auth flows, password resets, and email handling.",
};

export default function SecurityTestingPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/api/use-cases" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          ← Use Cases
        </Link>
        <span className="text-muted-foreground/30">/</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Security Testing</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Security & Penetration Testing
      </h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Validate authentication controls, password reset poisoning vulnerabilities, token leakage, and email HTML sanitization within isolated, disposable environments.
      </p>

      <div className="rounded-lg border border-border bg-muted/5 px-5 py-4 my-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">What you&apos;ll need</p>
        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1 mb-0">
          <li>A Developer plan or above (for higher rate limits and guaranteed inbox persistence)</li>
          <li>Our CLI tool or REST API access</li>
          <li>Testing automation scripts (Python/Bash) for security suites</li>
        </ul>
      </div>

      {/* ── Host Header Poisoning ── */}
      <h2 id="host-header" className="text-lg font-semibold mt-10 mb-2">Password Reset Poisoning</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        You can dynamically provision an inbox using the Python SDK to receive a password reset email and verify if the application leaks the reset token via Host header injection.
      </p>
      <CodeBlock
        language="python"
        code={`import requests, os, time
from freecustom_email import FreeCustomEmail

fce = FreeCustomEmail(api_key=os.environ.get("FCE_API_KEY"), sync=True)
TARGET_URL = "https://target-app.local/forgot-password"

def run_poisoning_test():
    # 1. Provision target inbox
    inbox = f"sec-target-{int(time.time())}@ditapi.info"
    fce.inboxes.register(inbox)

    # 2. Trigger reset with malicious Host header
    malicious_host = "evil.com"
    requests.post(TARGET_URL,
        headers={"Host": malicious_host},
        data={"email": inbox}
    )

    # 3. Wait for the email and check the verification link
    try:
        # wait_for automatically handles polling and returns an OTP/link object
        result = fce.otp.wait_for(inbox, timeout_ms=30000)
        link = result.verification_link if hasattr(result, "verification_link") else str(result)
        
        if malicious_host in link:
            print(f"[!] VULNERABLE: Token leaked to {malicious_host}. Link: {link}")
        else:
            print("[+] SAFE: Host header ignored.")
    except Exception as e:
        print(f"[-] No email received or error: {e}")

run_poisoning_test()`}
      />

      {/* ── Rate Limit Testing ── */}
      <h2 id="rate-limits" className="text-lg font-semibold mt-10 mb-2">Auth Rate Limit Validation</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Bypass IP-based or email-based rate limits during assessments by using hundreds of unique email identities on the fly. FreeCustom.Email's wildcard domains (e.g., anything@ditapi.info) and fresh domains feature ensure your traffic doesn't get blocked.
      </p>
      <CodeBlock
        language="bash"
        code={`#!/bin/bash
# Using the FCE CLI to generate unique emails in a loop for fuzzing

for i in {1..50}; do
  INBOX="fuzz-$i@ditapi.info"
  
  # Register
  fce register $INBOX --silent
  
  # Trigger signup
  curl -X POST https://target-app.local/signup \\
       -d "email=$INBOX" -d "password=TestPass123!"
done`}
      />

      {/* ── HTML Injection / XSS ── */}
      <h2 id="html-injection" className="text-lg font-semibold mt-10 mb-2">Email HTML Injection (XSS)</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Verify how your system sanitizes input reflected in emails (like usernames or profile data). Using the Python SDK, you can quickly fetch the raw HTML body to check for executable scripts.
      </p>
      <CodeBlock
        language="python"
        code={`import os
from freecustom_email import FreeCustomEmail

fce = FreeCustomEmail(api_key=os.environ["FCE_API_KEY"], sync=True)

def check_email_for_xss(inbox: str, payload: str):
    # Fetch the latest message
    messages = fce.messages.list(inbox, limit=1)
    if not messages:
        print("[-] No messages found")
        return
        
    msg_id = messages[0].id
    
    # Fetch full HTML content
    full_msg = fce.messages.get(inbox, msg_id)
    html_body = full_msg.html
    
    if payload in html_body:
        print("[!] HTML Payload reflected without sanitization!")
    else:
        print("[+] Input was sanitized safely.")`}
      />

      <div className="mt-10 flex gap-3 flex-wrap">
        <Button asChild size="sm">
          <Link href="/api/cli">Install the CLI</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/api/docs/messages">Message API Docs →</Link>
        </Button>
      </div>
    </article>
  );
}