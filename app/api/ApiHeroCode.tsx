// app/api/ApiHeroCode.tsx
"use client";

import { motion } from "framer-motion";
import { CodeBlock } from "@/components/CodeBlock";

const PLAYWRIGHT = `import { test, expect } from "@playwright/test";
import { FreecustomEmailClient } from "freecustom-email";

const fce = new FreecustomEmailClient({ apiKey: process.env.FCE_API_KEY! });

test("signup with email verification", async ({ page }) => {
  const inbox = \`pw-test-\${Date.now()}@ditapi.info\`;
  await fce.inboxes.register(inbox, true);
  await fce.inboxes.startTest(inbox, "e2e-signup");

  await page.goto("https://your-app.com/signup");
  await page.fill('[name="email"]', inbox);
  await page.fill('[name="password"]', "Str0ng!Pass#99");
  await page.click('[type="submit"]');

  const otp = await fce.otp.waitFor(inbox, { timeoutMs: 30_000 });
  
  await page.fill('[name="otp"]', otp);
  await page.click('[data-testid="verify-btn"]');

  await expect(page).toHaveURL("/dashboard");
});`;

const container: any = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
};
const item: any = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function ApiHeroCode() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-3"
    >
      <motion.div variants={item} className="flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 px-0.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Playwright E2E Test</span>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/40 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-foreground/70" />
          </span>
        </div>
        <CodeBlock code={PLAYWRIGHT} language="typescript" />
      </motion.div>
    </motion.div>
  );
}