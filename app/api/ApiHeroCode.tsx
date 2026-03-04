"use client";

import { motion } from "framer-motion";
import { CodeBlock } from "@/components/CodeBlock";

const CURL = `curl "https://api.freecustom.email/v1/inboxes/you@ditmail.info/otp" \\
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

export function ApiHeroCode() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="space-y-2"
    >
      <CodeBlock code={CURL} language="curl" />
      <CodeBlock code={JSON_RESPONSE} language="json" />
    </motion.div>
  );
}
