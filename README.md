<div align="center">
  <br />
  <a href="https://www.freecustom.email">
    <img src="https://www.freecustom.email/logo.webp" alt="FreeCustom.Email" width="72" />
  </a>
  <br />
  <br />

  <h1>FreeCustom.Email</h1>

  <p><b>The fastest, ad-free disposable email service — built for humans and developers alike.</b></p>

  <p>
    Instant inboxes. Fresh domains that aren't blacklisted. Auto OTP extraction.<br />
    Real-time delivery via WebSocket. A full REST API. Zero ads. Forever.
  </p>

  <br />

  <p>
    <a href="https://www.freecustom.email"><strong>→ freecustom.email</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="https://www.freecustom.email/api/docs"><strong>API Docs</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="https://www.freecustom.email/pricing"><strong>Pricing</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="https://status.freecustom.email"><strong>Status</strong></a>
  </p>

  <br />

  <p>
    <a href="https://github.com/DishIs/fce-frontend/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/DishIs/fce-frontend?style=for-the-badge" alt="License" />
    </a>
    <a href="https://github.com/DishIs/fce-frontend/stargazers">
      <img src="https://img.shields.io/github/stars/DishIs/fce-frontend?style=for-the-badge" alt="Stars" />
    </a>
    <a href="https://github.com/DishIs/fce-frontend/issues">
      <img src="https://img.shields.io/github/issues/DishIs/fce-frontend?style=for-the-badge" alt="Issues" />
    </a>
    <a href="https://github.com/DishIs/fce-frontend/pulls">
      <img src="https://img.shields.io/github/issues-pr/DishIs/fce-frontend?style=for-the-badge" alt="Pull Requests" />
    </a>
  </p>

  <br />
  <br />
</div>

---

## What is FreeCustom.Email?

FreeCustom.Email is a **disposable email service** used by over **50,000 users every month** to protect their real inboxes from spam, test signup flows, receive OTP codes, and verify accounts — without ever creating a real email account.

Unlike most temp mail providers that reuse the same tired domains for years (and wonder why they end up on every blocklist), we **regularly rotate in fresh domains** for Pro users. No spam history. No blacklists. No failed deliveries. Emails actually land.

```
Guest  →  10-hour inbox, 10 email limit, shared domains
Free   →  24-hour inbox, 50 email limit, saved addresses
Pro    →  Forever inbox, unlimited capacity, fresh domains, OTP extraction, custom domains
API    →  Full programmatic access, WebSocket push, 5 plan tiers, credit top-ups
```

---

## ✨ Features

### Core
| Feature | Details |
|---|---|
| **Instant Inbox** | No refresh needed — emails push via WebSocket the moment they arrive |
| **Fresh Domains** | Pro users get access to newly rotated domains with zero blocklist history |
| **Auto OTP Extraction** | Login codes detected and surfaced instantly in the inbox list — no email open needed |
| **Verification Link Detection** | One-click Verify button extracted directly from email HTML |
| **Custom Domain** | Receive mail at your own domain on Pro |
| **Private Inboxes** | Pro inboxes are completely private — no public lookup possible |
| **5 GB Storage** | Persistent email + attachment archive on Pro |
| **Ad-Free** | No ads anywhere. Ever. On any plan. |
| **PWA Ready** | Installable on mobile and desktop for a native app experience |

### Developer API
| Capability | Details |
|---|---|
| **REST API** | Full inbox management — create, list, fetch, delete |
| **WebSocket Push** | Real-time email delivery over persistent connections |
| **OTP Extraction** | Regex-powered code detection available as an API feature |
| **Attachment Access** | Download email attachments programmatically |
| **Custom Domains** | Register and receive mail at your own domain via API |
| **5 Plan Tiers** | Free → Developer → Startup → Growth → Enterprise |
| **Credit Top-ups** | Add extra request capacity; credits never expire |

---

## 🛠️ Tech Stack

This repository is the **frontend** for FreeCustom.Email. The backend is separately open-sourced at [DishIs/fce-backend](https://github.com/DishIs/fce-backend).

### Frontend
- **Framework** — Next.js 15 (App Router), React 18
- **Styling** — Tailwind CSS, shadcn/ui, Radix UI primitives
- **Animation** — Framer Motion
- **Auth** — NextAuth.js (Google, GitHub, Magic Link)
- **Payments** — Paddle (subscriptions + one-time credits)
- **i18n** — next-intl
- **Hosting** — Cloudflare Workers (edge-deployed)

### Backend ([fce-backend](https://github.com/DishIs/fce-backend))
- **Runtime** — Cloudflare Workers (V8 isolates, global edge network)
- **Real-time** — WebSockets via Cloudflare Durable Objects
- **SMTP** — Custom email ingestion pipeline handling millions of messages
- **Storage** — Distributed, with per-plan retention policies

### Architecture

```
User → Cloudflare Edge (Frontend, Next.js Workers)
              ↓
       REST API / WebSocket
              ↓
  fce-backend (Cloudflare Workers + Durable Objects)
              ↓
       SMTP Ingestion Pipeline
              ↓
    Email Storage + OTP/Link Extraction
```

The frontend is deployed to Cloudflare Workers for sub-50ms response times at the edge globally. The backend handles SMTP ingestion, WebSocket state via Durable Objects, and all email processing logic. Both layers are independently deployable and open-source.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/DishIs/fce-frontend.git
cd fce-frontend
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

For local development:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys (NextAuth secret, OAuth credentials, API base URL, Paddle keys, etc.).

For production deployment on Cloudflare Workers:

```bash
cp wrangler.jsonc.example wrangler.jsonc
```

Fill in your Cloudflare account ID, zone ID, and all secret bindings in `wrangler.jsonc`.

**4. Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**5. Deploy to Cloudflare Workers (production)**

```bash
npm run deploy
```

---

## 🔌 API Quick Start

FreeCustom.Email exposes a full REST + WebSocket API at `api2.freecustom.email`. Get a free API key from your [dashboard](https://www.freecustom.email/api/dashboard).

```bash
# Create a new inbox
curl -X POST https://api2.freecustom.email/v1/inbox \
  -H "Authorization: Bearer YOUR_API_KEY"

# Fetch emails
curl https://api2.freecustom.email/v1/inbox/YOUR_ADDRESS/emails \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Full documentation → [freecustom.email/api/docs](https://www.freecustom.email/api/docs)
API Pricing → [freecustom.email/api/pricing](https://www.freecustom.email/api/pricing)

---

## 🏢 Need Your Own Temp Mail Infrastructure?

We've processed **millions of emails** and run this infrastructure in production at scale. If your business needs its own disposable email setup, we can help.

**DishIs Technologies** offers end-to-end setup and automation services:

```
What we can set up for you
──────────────────────────
✦  Your own temp mail server — fully configured SMTP pipeline,
   WebSocket delivery, domain rotation, spam filtering

✦  White-label frontend — the full FreeCustom.Email UI
   rebranded and deployed under your domain in days

✦  API-only backend — headless email infrastructure
   your app consumes via REST or WebSocket

✦  Custom automation — OTP bots, verification workflows,
   bulk inbox provisioning, webhook integrations

✦  Ongoing maintenance & domain management — we handle
   domain health, rotation, and deliverability so you don't have to
```

**Why us?**
We've built and operated this exact infrastructure at scale. We know every failure mode — blacklisted domains, SMTP edge cases, WebSocket reconnection logic, Cloudflare Durable Object limits, spam filter evasion patterns. You get years of production experience, not a proof-of-concept.

**Pricing is reasonable.** We're not an enterprise vendor. Talk to us.

> **Get in touch:**
> - 📧 [dishant@dishis.tech](mailto:dishant@dishis.tech)
> - 🌐 [freecustom.email/contact](https://www.freecustom.email/contact)

---

## 🤝 Contributing

Contributions are welcome — bugs, features, docs, translations. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR. All contributors are expected to follow our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

**Good first issues** are labeled [`good first issue`](https://github.com/DishIs/fce-frontend/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) in the tracker.

---

## 📜 License

Licensed under the **Apache License 2.0**. See [LICENSE](LICENSE) for full terms.

You are free to use, modify, and distribute this software. If you build something with it, a star ⭐ and a mention go a long way.

---

<div align="center">
  <br />
  <p>
    Built and maintained by <a href="https://dishis.tech"><b>DishIs Technologies</b></a>
  </p>
  <p>
    <a href="https://www.freecustom.email">freecustom.email</a>
    &nbsp;·&nbsp;
    <a href="https://discord.com/invite/Ztp7kT2QBz">Discord</a>
    &nbsp;·&nbsp;
    <a href="https://www.reddit.com/r/FreeCustomEmail/">Reddit</a>
    &nbsp;·&nbsp;
    <a href="mailto:dishis@dishis.tech">dishis@dishis.tech</a>
  </p>
  <br />
</div>