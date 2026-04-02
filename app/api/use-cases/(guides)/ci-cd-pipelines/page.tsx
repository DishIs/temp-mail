import { CodeBlock } from "@/components/CodeBlock";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "CI / CD Pipelines – FreeCustom.Email Use Cases",
  description: "Provision fresh disposable inboxes per test run in GitHub Actions, GitLab CI, and CircleCI.",
};

export default function CiCdPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/api/use-cases" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          ← Use Cases
        </Link>
        <span className="text-muted-foreground/30">/</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">CI / CD Pipelines</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        CI / CD Pipelines
      </h1>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        Provision a fresh, isolated disposable inbox per test run. Works with GitHub Actions, GitLab CI, CircleCI, and any CI that can run shell commands or Node/Python.
      </p>

      {/* ── GitHub Actions ── */}
      <h2 id="github-actions" className="text-lg font-semibold mt-10 mb-2">GitHub Actions</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Store your API key in{" "}
        <code className="text-xs bg-muted/60 rounded px-1">Settings → Secrets → FCE_API_KEY</code>, then
        reference it in your workflow.
      </p>
      <CodeBlock
        language="yaml"
        code={`# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    env:
      FCE_API_KEY: \${{ secrets.FCE_API_KEY }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test
        env:
          FCE_API_KEY: \${{ secrets.FCE_API_KEY }}`}
      />

      <h3 className="text-base font-semibold mt-6 mb-2">Playwright / Jest Setup Helper</h3>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Wrap the FreeCustom.Email Node SDK in a reusable helper that you can inject into any test file.
      </p>
      <CodeBlock
        language="typescript"
        code={`// helpers/inbox.ts
import { FreecustomEmailClient } from "freecustom-email";

// Ensure FCE_API_KEY is available in your CI environment secrets
export const fce = new FreecustomEmailClient({ apiKey: process.env.FCE_API_KEY! });

export async function createInbox(prefix = "ci"): Promise<string> {
  const inbox = \`\${prefix}-\${Date.now()}-\${Math.random().toString(36).slice(2,6)}@ditapi.info\`;
  await fce.inboxes.register(inbox);
  return inbox;
}

export async function waitForOtp(inbox: string, timeoutMs = 30_000): Promise<string> {
  // Uses long-polling automatically, handles retries and extraction
  const otp = await fce.otp.waitFor(inbox, { timeoutMs });
  if (!otp) throw new Error("No OTP received within timeout");
  return otp;
}`}
      />

      {/* ── GitLab CI ── */}
      <h2 id="gitlab" className="text-lg font-semibold mt-12 mb-2">GitLab CI</h2>
      <CodeBlock
        language="yaml"
        code={`# .gitlab-ci.yml
stages:
  - test

e2e:
  stage: test
  image: mcr.microsoft.com/playwright:v1.44.0-jammy
  variables:
    FCE_API_KEY: \$FCE_API_KEY  # set in CI/CD → Variables
  script:
    - npm ci
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
    expire_in: 7 days`}
      />

      {/* ── CircleCI ── */}
      <h2 id="circleci" className="text-lg font-semibold mt-12 mb-2">CircleCI</h2>
      <CodeBlock
        language="yaml"
        code={`# .circleci/config.yml
version: 2.1

jobs:
  e2e:
    docker:
      - image: mcr.microsoft.com/playwright:v1.44.0-jammy
    environment:
      FCE_API_KEY: \$FCE_API_KEY  # set in Project Settings → Environment Variables
    steps:
      - checkout
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - store_artifacts:
          path: playwright-report

workflows:
  test:
    jobs:
      - e2e`}
      />

      {/* ── pytest ── */}
      <h2 id="pytest" className="text-lg font-semibold mt-12 mb-2">pytest fixture (Python)</h2>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Provide a fresh inbox as a pytest fixture with automatic teardown using the Python SDK.
      </p>
      <CodeBlock
        language="python"
        code={`# conftest.py
import time, os, pytest
from freecustom_email import FreeCustomEmail

# Use sync=True to work easily inside synchronous pytest fixtures
fce = FreeCustomEmail(api_key=os.environ["FCE_API_KEY"], sync=True)

@pytest.fixture
def disposable_inbox():
    """Yields a unique inbox address; registers it before and unregisters after."""
    inbox = f"pytest-{int(time.time())}@ditapi.info"
    fce.inboxes.register(inbox)
    
    yield inbox
    
    # Cleanup after test completes
    fce.inboxes.unregister(inbox)

# --- example test ---
# def test_signup(browser, disposable_inbox):
#     page = browser.new_page()
#     page.goto("https://your-app.com/signup")
#     page.fill('[name="email"]', disposable_inbox)
#     page.fill('[name="password"]', "Test1234!")
#     page.click('[type="submit"]')
#
#     # SDK handles waiting and OTP extraction
#     otp = fce.otp.wait_for(disposable_inbox, timeout_ms=30000)
#     assert otp, "No OTP received"
#
#     page.fill('[name="otp"]', otp)
#     page.click('[data-testid="verify-btn"]')
#     assert "/dashboard" in page.url`}
      />

      <div className="mt-10 flex gap-3 flex-wrap">
        <Button asChild size="sm">
          <Link href="/api/docs/quickstart">API Quickstart</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/api/use-cases/playwright-selenium">Playwright & Selenium →</Link>
        </Button>
      </div>
    </article>
  );
}