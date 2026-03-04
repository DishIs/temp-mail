"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/CodeBlock";

const CURL = `# Register an inbox
curl -X POST https://api2.freecustom.email/v1/inboxes \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"address":"test@ditmail.info"}'

# Get latest OTP
curl "https://api2.freecustom.email/v1/inboxes/test@ditmail.info/otp" \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

const NODE = `const res = await fetch("https://api2.freecustom.email/v1/inboxes", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.FCE_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ address: "test@ditmail.info" }),
});
const { inbox } = await res.json();

const otpRes = await fetch(
  \`https://api2.freecustom.email/v1/inboxes/\${inbox}/otp\`,
  { headers: { "Authorization": "Bearer " + process.env.FCE_API_KEY } }
);
const { otp } = await otpRes.json();`;

const PYTHON = `import os
import requests

headers = {"Authorization": f"Bearer {os.environ['FCE_API_KEY']}"}

r = requests.post(
    "https://api2.freecustom.email/v1/inboxes",
    headers=headers,
    json={"address": "test@ditmail.info"},
)
inbox = r.json()["inbox"]

r2 = requests.get(
    f"https://api2.freecustom.email/v1/inboxes/{inbox}/otp",
    headers=headers,
)
otp = r2.json().get("otp")`;

const GO = `package main

import ("net/http"; "bytes"; "encoding/json"; "os")

func main() {
  key := os.Getenv("FCE_API_KEY")
  body, _ := json.Marshal(map[string]string{"address": "test@ditmail.info"})
  req, _ := http.NewRequest("POST", "https://api2.freecustom.email/v1/inboxes", bytes.NewReader(body))
  req.Header.Set("Authorization", "Bearer "+key)
  req.Header.Set("Content-Type", "application/json")
  resp, _ := http.DefaultClient.Do(req)
  // ... parse JSON for inbox, then GET .../otp
}`;

export function ApiCodeExamples() {
  return (
    <Tabs defaultValue="curl" className="w-full">
      <TabsList className="mb-2 w-full sm:w-auto">
        <TabsTrigger value="curl">cURL</TabsTrigger>
        <TabsTrigger value="node">Node.js</TabsTrigger>
        <TabsTrigger value="python">Python</TabsTrigger>
        <TabsTrigger value="go">Go</TabsTrigger>
      </TabsList>
      <TabsContent value="curl">
        <CodeBlock code={CURL} language="curl" />
      </TabsContent>
      <TabsContent value="node">
        <CodeBlock code={NODE} language="javascript" />
      </TabsContent>
      <TabsContent value="python">
        <CodeBlock code={PYTHON} language="python" />
      </TabsContent>
      <TabsContent value="go">
        <CodeBlock code={GO} language="go" />
      </TabsContent>
    </Tabs>
  );
}
