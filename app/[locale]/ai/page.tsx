import { DevHeader } from "@/components/DevHeader";
import { FceAiInterface } from "@/components/FceAiInterface";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FCE AI - Your Intelligent API Assistant | FreeCustom.Email",
  description: "Ask FCE AI about our API, CLI tool, or automation integrations. Generate code, manage inboxes, and get instant support.",
};

// ASCII fragments for background
const ASCII_FRAGMENTS = [
  { x: "2%",  y: "5%",  t: "EHLO api2.freecustom.email" },
  { x: "67%", y: "3%",  t: "250 2.1.0 Ok" },
  { x: "78%", y: "11%", t: "From: noreply@service.com" },
  { x: "1%",  y: "21%", t: "RCPT TO:<inbox@ditapi.info>" },
  { x: "71%", y: "27%", t: "Message-ID: <abc123@fce.email>" },
  { x: "4%",  y: "37%", t: "Content-Type: text/plain; charset=utf-8" },
  { x: "74%", y: "43%", t: "354 End data with <CR><LF>.<CR><LF>" },
  { x: "1%",  y: "51%", t: "X-OTP: 847291" },
  { x: "69%", y: "57%", t: "SMTP 220 mail.freecustom.email" },
  { x: "3%",  y: "67%", t: "Date: Thu, 4 Mar 2026 09:55:00 +0000" },
  { x: "72%", y: "73%", t: "250-STARTTLS" },
  { x: "2%",  y: "83%", t: "AUTH PLAIN" },
  { x: "67%", y: "87%", t: "MAIL FROM:<service@example.com>" },
  { x: "4%",  y: "93%", t: "Content-Transfer-Encoding: quoted-printable" },
  { x: "70%", y: "96%", t: "Subject: Your verification code is 847291" },
];

const DOT_BG = {
  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(0 0% 50% / 0.11) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

function AsciiLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {ASCII_FRAGMENTS.map((f, i) => (
        <span key={i} className="absolute font-mono text-[10px] text-foreground whitespace-nowrap"
          style={{ left: f.x, top: f.y, opacity: 0.042 }}>{f.t}</span>
      ))}
    </div>
  );
}

const Cols = () => (
  <>
    <div className="absolute inset-y-0 left-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
    <div className="absolute inset-y-0 right-[max(0px,calc(50%-40rem))] w-px bg-border/60" aria-hidden />
  </>
);

export default function FceAiPage() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative" style={DOT_BG}>
      <AsciiLayer />
      <Cols />
      <div className="relative z-10 flex flex-col h-full">
        <DevHeader />
        <main className="flex-1 overflow-hidden">
          <FceAiInterface />
        </main>
      </div>
    </div>
  );
}
