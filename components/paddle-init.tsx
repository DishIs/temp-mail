"use client";

import Script from "next/script";

declare global {
  interface Window { Paddle?: any; }
}

export function PaddleInit() {
  return (
    <Script
      src="https://cdn.paddle.com/paddle/v2/paddle.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (!window.Paddle) return;
        window.Paddle.Environment.set(
          process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? "sandbox" : "production"
        );
        window.Paddle.Initialize({
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        });
      }}
    />
  );
}