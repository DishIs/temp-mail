// app/api/ApiCodeExamples.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CodeBlock } from "@/components/CodeBlock";

const CURL = `# 1. Register an inbox
curl -X POST https://api2.freecustom.email/v1/inboxes \\
  -H "Authorization: Bearer fce_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"inbox":"test@ditapi.info"}'

# 2. Get latest OTP
curl "https://api2.freecustom.email/v1/inboxes/test@ditapi.info/otp" \\
  -H "Authorization: Bearer fce_your_api_key"`;

const NODE = `import { FreecustomEmailClient } from 'freecustom-email';
// npm install freecustom-email

const client = new FreecustomEmailClient({
  apiKey: process.env.FCE_API_KEY,
});

// Register a disposable inbox
await client.inboxes.register('test@ditapi.info');

// Wait for OTP — no polling, no regex
const otp = await client.otp.waitFor('test@ditapi.info');
console.log(otp); // '212342'`;

const PYTHON = `from freecustom_email import FreeCustomEmail
# pip install freecustom-email
import asyncio, os

client = FreeCustomEmail(api_key=os.environ["FCE_API_KEY"])

async def main():
    # Register a disposable inbox
    await client.inboxes.register("test@ditapi.info")

    # Wait for OTP — no polling, no regex
    otp = await client.otp.wait_for("test@ditapi.info")
    print(otp)  # '212342'

asyncio.run(main())`;

const GO = `package main

import (
  "bytes"
  "encoding/json"
  "net/http"
  "os"
)

func main() {
  key  := os.Getenv("FCE_API_KEY")
  body, _ := json.Marshal(map[string]string{"inbox": "test@ditapi.info"})

  req, _ := http.NewRequest(
    "POST",
    "https://api2.freecustom.email/v1/inboxes",
    bytes.NewReader(body),
  )
  req.Header.Set("Authorization", "Bearer "+key)
  req.Header.Set("Content-Type", "application/json")

  resp, _ := http.DefaultClient.Do(req)
  // ... parse JSON, then GET /v1/inboxes/{inbox}/otp
  _ = resp
}`;

type Tab = { id: string; label: string; lang: string; code: string; badge?: string };

const TABS: Tab[] = [
  { id: "curl",   label: "cURL",    lang: "bash",       code: CURL   },
  { id: "node",   label: "Node.js", lang: "typescript", code: NODE,   badge: "SDK" },
  { id: "python", label: "Python",  lang: "python",     code: PYTHON, badge: "SDK" },
  { id: "go",     label: "Go",      lang: "go",         code: GO     },
];

export function ApiCodeExamples() {
  const [active, setActive] = useState("curl");
  const current = TABS.find(t => t.id === active)!;

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-muted/10 px-4 gap-0 overflow-x-auto">
        {/* Terminal dots */}
        <div className="flex items-center gap-1.5 pr-4 mr-2 border-r border-border shrink-0 py-3" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
          <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
          <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
        </div>

        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-150 shrink-0 ${
              active === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className={`font-mono text-[8px] uppercase tracking-wider border rounded px-1 py-px leading-none transition-colors ${
                active === tab.id
                  ? "border-foreground/40 text-foreground/70"
                  : "border-border text-muted-foreground/50"
              }`}>
                {tab.badge}
              </span>
            )}
            {/* animated underline indicator */}
            {active === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-px bg-foreground"
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
              />
            )}
          </button>
        ))}

        {/* SDK install hint — only visible when an SDK tab is active */}
        <AnimatePresence>
          {current.badge === "SDK" && (
            <motion.div
              key="sdk-hint"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="ml-auto shrink-0 flex items-center gap-2"
            >
              <span className="font-mono text-[10px] text-muted-foreground/50">
                {active === "node" ? "npm install freecustom-email" : "pip install freecustom-email"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Code panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <CodeBlock
            code={current.code}
            language={current.lang}
            accent={false}
            className="rounded-none border-0 bg-muted/20"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}