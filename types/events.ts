export type EmailEvent = {
  id: string;
  inbox: string;
  type:
    | "inbox_created"
    | "email_received"
    | "email_parsed"
    | "otp_extracted"
    | "webhook_sent"
    | "websocket_sent"
    | "error";
  timestamp: number;
  latency_ms?: number;
  metadata?: {
    message_id?: string;
    subject?: string;
    from?: string;
    otp?: string;
    score?: number;
    raw_snippet?: string;
    verification_link?: string;
    error?: string;
  };
  test_run_id?: string;
};

export type TestRun = {
  id: string;
  inbox: string;
  created_at: number;
  status: "pending" | "success" | "failed";
};
