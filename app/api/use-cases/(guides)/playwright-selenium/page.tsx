import { CodeBlock } from "@/components/CodeBlock";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Playwright & Selenium – FreeCustom.Email Use Cases",
  description: "Automate email verification in Playwright and Selenium E2E tests using the official SDKs.",
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
        Automate signup flows that require email OTP verification using disposable inboxes. No shared test accounts, no flaky email state, no cleanup overhead. The official SDKs handle polling and extraction automatically.
      </p>

      <div className="rounded-lg border border-border bg-muted/5 px-5 py-4 my-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">What you&apos;ll need</p>
        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1 mb-0">
          <li>A FreeCustom.Email API key</li>
          <li>Playwright (TypeScript) or Selenium (Python) installed in your project</li>
          <li>
            <code className="text-xs bg-muted/60 rounded px-1">npm install freecustom-email</code> (for Playwright) or <code className="text-xs bg-muted/60 rounded px-1">pip install freecustom-email</code> (for Selenium)
          </li>
        </ul>
      </div>

      {/* ── Playwright ── */}
      <h2 id="playwright" className="text-lg font-semibold mt-10 mb-2">Playwright (TypeScript)</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Using the Node SDK, you can generate an inbox, trigger the signup, and wait for the OTP in just three lines of code. The SDK uses long-polling internally so tests remain perfectly fast and stable.
      </p>

      <h3 className="text-base font-semibold mt-6 mb-2">Full Playwright Test</h3>
      <CodeBlock
        language="typescript"
        code={`import { test, expect } from "@playwright/test";
import { FreecustomEmailClient } from "freecustom-email";

// Initialize the FCE client globally for your tests
const fce = new FreecustomEmailClient({ apiKey: process.env.FCE_API_KEY! });

test("signup with email verification", async ({ page }) => {
  // 1. Create a dynamic inbox
  const inbox = \`pw-test-\${Date.now()}@ditapi.info\`;
  await fce.inboxes.register(inbox);

  // 2. Fill the signup form in your app
  await page.goto("https://your-app.com/signup");
  await page.fill('[name="email"]', inbox);
  await page.fill('[name="password"]', "Str0ng!Pass#99");
  await page.click('[type="submit"]');

  // 3. Wait for the OTP email and extract the code automatically (Wait API)
  const otp = await fce.otp.waitFor(inbox, { timeoutMs: 30_000 });

  // 4. Enter OTP in the verification step
  await page.fill('[name="otp"]', otp);
  await page.click('[data-testid="verify-btn"]');

  // Assert successful verification
  await expect(page).toHaveURL("/dashboard");
});

// Optionally cleanup (though not strictly necessary as inboxes are isolated)
test.afterEach(async ({}, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) {
    // Only cleanup on success; leave failed tests for debugging
    // await fce.inboxes.unregister(inbox);
  }
});`}
      />

      {/* ── Selenium ── */}
      <h2 id="selenium" className="text-lg font-semibold mt-12 mb-2">Selenium (Python)</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        The Python SDK supports a <code className="text-xs bg-muted/60 rounded px-1">sync=True</code> mode, which is perfect for traditional, synchronous Selenium test runners like pytest without needing <code className="text-xs bg-muted/60 rounded px-1">asyncio</code> wrappers.
      </p>
      <CodeBlock
        language="python"
        code={`import time, os
from selenium import webdriver
from selenium.webdriver.common.by import By
from freecustom_email import FreeCustomEmail

# Initialize synchronous client
fce = FreeCustomEmail(api_key=os.environ["FCE_API_KEY"], sync=True)

def test_signup_with_otp():
    inbox = f"sel-{int(time.time())}@ditapi.info"
    fce.inboxes.register(inbox)
    
    driver = webdriver.Chrome()
    try:
        driver.get("https://your-app.com/signup")
        driver.find_element(By.NAME, "email").send_keys(inbox)
        driver.find_element(By.NAME, "password").send_keys("Str0ng!Pass#99")
        driver.find_element(By.CSS_SELECTOR, '[type="submit"]').click()

        # SDK automatically waits for the email and extracts the 6 digit OTP
        otp = fce.otp.wait_for(inbox, timeout_ms=30000)

        driver.find_element(By.NAME, "otp").send_keys(otp)
        driver.find_element(By.CSS_SELECTOR, '[data-testid="verify-btn"]').click()

        assert "/dashboard" in driver.current_url
    finally:
        fce.inboxes.unregister(inbox)
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
          <Link href="/api/docs/sdk/npm">Node SDK Docs</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/api/use-cases/ci-cd-pipelines">CI / CD integration →</Link>
        </Button>
      </div>
    </article>
  );
}