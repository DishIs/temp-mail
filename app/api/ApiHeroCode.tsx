// app/api/ApiHeroCode.tsx
"use client";

import { motion } from "framer-motion";
import { CodeBlock } from "@/components/CodeBlock";

const CURL = `curl "https://api2.freecustom.email/v1/inboxes/you@ditapi.info/otp" \\
  -H "Authorization: Bearer fce_xxxx"`;

const JSON_RESPONSE = `{
  "success": true,
  "data": {
    "otp": "847291",
    "verification_link": "https://...",
    "from": "noreply@example.com",
    "subject": "Your code is 847291",
    "message_id": "msg_abc123",
    "received_at": "2026-03-04T09:55:00.000Z"
  }
}`;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function ApiHeroCode() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-3 sm:grid-cols-2"
    >
      {/* Request */}
      <motion.div variants={item} className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-0.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Request</span>
          {/* animated status dot */}
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/40 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-foreground/70" />
          </span>
        </div>
        <CodeBlock code={CURL} language="curl" />
      </motion.div>

      {/* Response */}
      <motion.div variants={item} className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-0.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Response</span>
          <span className="font-mono text-[10px] text-muted-foreground/60 border border-border rounded px-1 py-px">200 OK</span>
        </div>
        <CodeBlock code={JSON_RESPONSE} language="json" />
      </motion.div>
    </motion.div>
  );
}