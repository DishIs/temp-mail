// app/api/ApiCodeExamples.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CodeBlock } from "@/components/CodeBlock";

const CURL = `# 1. Register an inbox
curl -X POST https://api2.freecustom.email/v1/inboxes \\
  -H "Authorization: Bearer fce_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"inbox":"test@ditmail.info"}'

# 2. Get latest OTP
curl "https://api2.freecustom.email/v1/inboxes/test@ditmail.info/otp" \\
  -H "Authorization: Bearer fce_your_api_key"`;

const NODE = `const res = await fetch("https://api2.freecustom.email/v1/inboxes", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.FCE_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ inbox: "test@ditmail.info" }),
});
const { data } = await res.json();
const inbox = data?.inbox;

const otpRes = await fetch(
  \`https://api2.freecustom.email/v1/inboxes/\${inbox}/otp\`,
  { headers: { "Authorization": "Bearer " + process.env.FCE_API_KEY } }
);
const { data: otpData } = await otpRes.json();
const otp = otpData?.otp;`;

const PYTHON = `import os
import requests

headers = {"Authorization": f"Bearer {os.environ['FCE_API_KEY']}"}

r = requests.post(
    "https://api2.freecustom.email/v1/inboxes",
    headers=headers,
    json={"inbox": "test@ditmail.info"},
)
inbox = r.json()["data"]["inbox"]

r2 = requests.get(
    f"https://api2.freecustom.email/v1/inboxes/{inbox}/otp",
    headers=headers,
)
otp = r2.json().get("data", {}).get("otp")`;

const GO = `package main

import (
  "bytes"
  "encoding/json"
  "net/http"
  "os"
)

func main() {
  key  := os.Getenv("FCE_API_KEY")
  body, _ := json.Marshal(map[string]string{"inbox": "test@ditmail.info"})

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

type Tab = { id: string; label: string; lang: string; code: string };

const TABS: Tab[] = [
  { id: "curl",   label: "cURL",    lang: "curl",       code: CURL   },
  { id: "node",   label: "Node.js", lang: "javascript", code: NODE   },
  { id: "python", label: "Python",  lang: "python",     code: PYTHON },
  { id: "go",     label: "Go",      lang: "go",         code: GO     },
];

export function ApiCodeExamples() {
  const [active, setActive] = useState("curl");
  const current = TABS.find(t => t.id === active)!;

  return (
    <div className="w-full rounded-lg border border-border overflow-hidden">
      {/* Tab bar — underline style matching dashboard */}
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
            className={`relative px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-150 shrink-0 ${
              active === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
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
          {/* Re-use CodeBlock but strip its own border/rounding so it sits flush */}
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