"use client";

import { motion } from "framer-motion";
import { CodeBlock } from "@/components/CodeBlock";

const CURL = `curl "https://api2.freecustom.email/v1/inboxes/you@ditmail.info/otp" \\
  -H "Authorization: Bearer fce_xxxx"`;

const JSON_RESPONSE = `{
  "otp": "847291",
  "email_id": "msg_abc123",
  "from": "noreply@example.com",
  "subject": "Your code is 847291"
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
