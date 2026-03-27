import { Metadata } from "next";
import APIClient from "./APIClient";

export const metadata: Metadata = {
  title: "API Overview – Temp Mail for Developers",
  description: "FreeCustom.Email API provides disposable email infrastructure for developers. Programmatic temporary inboxes, real-time WebSocket, and automatic OTP extraction.",
};

export default function ApiPage() {
  return <APIClient />;
}
