import { Metadata } from "next";
import AuthFlowDebuggerClient from "./AuthFlowDebuggerClient";

export const metadata: Metadata = {
  title: "Auth Flow Debugger – FreeCustom.Email API",
  description: "Debug your authentication flows, OTP extraction, and email delivery in real-time. Sub-millisecond latency tracking and visual flow analysis.",
};

export default function AuthFlowDebuggerPage() {
  return <AuthFlowDebuggerClient />;
}