import { CodeBlock } from "@/components/CodeBlock";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Playwright & Selenium – FreeCustom.Email Use Cases",
  description: "Automate email verification in Playwright and Selenium E2E tests using disposable inboxes.",
};

export default function PlaywrightSeleniumPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/api/use-cases" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          ← Use Cases
        </Link>
        <span className="text-muted-foreground/30">/</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Playwright & Selenium</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Playwright & Selenium — Email Verification Testing
      </h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Automate signup flows that require email OTP verification using disposable inboxes. No shared test accounts, no flaky email state, no cleanup overhead.
      </p>

      <div className="rounded-lg border border-border bg-muted/5 px-5 py-4 my-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">What you&apos;ll need</p>
        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1 mb-0">
          <li>A FreeCustom.Email API key (Free plan works for basic polling; Developer+ for long-poll)</li>
          <li>Playwright or Selenium installed in your project</li>
          <li>
            <code className="text-xs bg-muted/60 rounded px-1">npm install freecustom-email</code> (optional SDK) or raw{" "}
            <code className="text-xs bg-muted/60 rounded px-1">fetch</code>
          </li>
        </ul>
      </div>

      {/* ── Playwright ── */}
      <h2 id="playwright" className="text-lg font-semibold mt-10 mb-2">Playwright</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        The pattern: generate a unique inbox per test, fill the signup form, then call the FCE API to wait for the OTP and complete verification.
      </p>

      <h3 className="text-base font-semibold mt-6 mb-2">TypeScript — full example</h3>
      <CodeBlock
        language="typescript"
        code={`import { test, expect } from "@playwright/test";

const FCE_API = "https://api2.freecustom.email";
const API_KEY = process.env.FCE_API_KEY!;

async function createInbox(): Promise<string> {
  const res = await fetch(\`\${FCE_API}/v1/inboxes\`, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inbox: \`pw-test-\${Date.now()}@ditapi.info\` }),
  });
  const data = await res.json();
  return data.data.inbox;
}

async function waitForOtp(inbox: string, timeoutMs = 30_000): Promise<string> {
  // Long-poll — one request, waits up to 30s for the email (Developer+ plan)
  const res = await fetch(
    \`\${FCE_API}/v1/inboxes/\${encodeURIComponent(inbox)}/wait?timeout=30\`,
    { headers: { Authorization: \`Bearer \${API_KEY}\` } }
  );
  if (!res.ok) throw new Error("wait endpoint failed");
  
  // Then fetch the OTP
  const otpRes = await fetch(
    \`\${FCE_API}/v1/inboxes/\${encodeURIComponent(inbox)}/otp\`,
    { headers: { Authorization: \`Bearer \${API_KEY}\` } }
  );
  const { data } = await otpRes.json();
  if (!data?.otp) throw new Error("No OTP found");
  return data.otp;
}

test("signup with email verification", async ({ page }) => {
  const inbox = await createInbox();

  // Fill the signup form
  await page.goto("https://your-app.com/signup");
  await page.fill('[name="email"]', inbox);
  await page.fill('[name="password"]', "Str0ng!Pass#99");
  await page.click('[type="submit"]');

  // Wait for OTP email and extract the code
  const otp = await waitForOtp(inbox);

  // Enter OTP in the verification step
  await page.fill('[name="otp"]', otp);
  await page.click('[data-testid="verify-btn"]');

  await expect(page).toHaveURL("/dashboard");
});`}
      />

      <h3 className="text-base font-semibold mt-8 mb-2">Cleanup (afterEach)</h3>
      <CodeBlock
        language="typescript"
        code={`// Optionally delete the inbox after each test to keep your account tidy.
// Not required — inboxes are isolated by their unique address.
test.afterEach(async ({ }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    console.log("Test failed — leaving inbox for debugging");
  }
  // await deleteInbox(inbox); // implement as needed
});`}
      />

      {/* ── Selenium ── */}
      <h2 id="selenium" className="text-lg font-semibold mt-12 mb-2">Selenium (Python)</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Same pattern works with any Selenium binding. This example uses Python + <code className="text-xs bg-muted/60 rounded px-1">requests</code>.
      </p>
      <CodeBlock
        language="python"
        code={`import time, os, requests
from selenium import webdriver
from selenium.webdriver.common.by import By

FCE_API = "https://api2.freecustom.email"
API_KEY = os.environ["FCE_API_KEY"]
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

def create_inbox(address: str) -> str:
    r = requests.post(
        f"{FCE_API}/v1/inboxes",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={"inbox": address},
    )
    return r.json()["data"]["inbox"]

def wait_for_otp(inbox: str, timeout: int = 30) -> str:
    # Long-poll (Developer+ plan)
    requests.get(
        f"{FCE_API}/v1/inboxes/{inbox}/wait",
        headers=HEADERS,
        params={"timeout": timeout},
        timeout=timeout + 5,
    )
    r = requests.get(f"{FCE_API}/v1/inboxes/{inbox}/otp", headers=HEADERS)
    otp = r.json()["data"]["otp"]
    if not otp:
        raise RuntimeError("No OTP found")
    return otp

def test_signup_with_otp():
    inbox = create_inbox(f"sel-{int(time.time())}@ditapi.info")
    
    driver = webdriver.Chrome()
    try:
        driver.get("https://your-app.com/signup")
        driver.find_element(By.NAME, "email").send_keys(inbox)
        driver.find_element(By.NAME, "password").send_keys("Str0ng!Pass#99")
        driver.find_element(By.CSS_SELECTOR, '[type="submit"]').click()

        otp = wait_for_otp(inbox)

        driver.find_element(By.NAME, "otp").send_keys(otp)
        driver.find_element(By.CSS_SELECTOR, '[data-testid="verify-btn"]').click()

        assert "/dashboard" in driver.current_url
    finally:
        driver.quit()

if __name__ == "__main__":
    test_signup_with_otp()
    print("✓ Signup with OTP verification passed")`}
      />

      {/* ── Parallel tests ── */}
      <h2 id="parallel" className="text-lg font-semibold mt-12 mb-2">Parallel Tests</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Because each test generates a unique inbox address, parallel test runs never interfere with each other.
        With the Growth plan you can run dozens of concurrent inbox-creation + OTP-wait cycles within the ops/second limit.
      </p>
      <CodeBlock
        language="typescript"
        code={`// playwright.config.ts — safe to run fully parallel
import { defineConfig } from "@playwright/test";

export default defineConfig({
  workers: 10,         // 10 parallel workers
  timeout: 60_000,     // 60s per test (covers OTP wait)
  use: { baseURL: "https://your-app.com" },
});`}
      />

      <div className="mt-10 flex gap-3 flex-wrap">
        <Button asChild size="sm">
          <Link href="/api/docs/quickstart">API Quickstart</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/api/use-cases/ci-cd-pipelines">CI / CD integration →</Link>
        </Button>
      </div>
    </article>
  );
}