# 📧 FreeCustom.Email (Temp Mail Service)

![License](https://img.shields.io/github/license/DishIs/temp-mail)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange)
![Status](https://img.shields.io/website?url=https%3A%2F%2Ffreecustom.email)

**The Fastest, Ad-Free Disposable Email Service.**  
Built with Next.js, Cloudflare Workers, and Tailwind CSS.

🌐 **Live Site:** [FreeCustom.email](https://freecustom.email)  
🚀 **Developer API:** [RapidAPI Link](https://rapidapi.com/dishis-technologies-maildrop/api/temp-mail-maildrop1)

---

## ✨ Features

- ** Instant Inbox:** No refresh needed (WebSockets).
- ** Ad-Free:** Clean, modern UI without invasive popups.
- ** Custom Domains:** Choose from multiple domain options.
- ** Secure:** Emails are encrypted and auto-deleted.
- ** API Access:** Developers can integrate using our API.
- ** PWA Ready:** Installable on mobile and desktop.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 18, Tailwind CSS, Radix UI.
- **Backend:** Cloudflare Workers (Edge), MongoDB (Storage).
- **Realtime:** WebSockets (Cloudflare Durable Objects).
- **Auth:** NextAuth.js (Google, GitHub, Magic Link).

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DishIs/temp-mail.git
   cd temp-mail
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # Ensure all UI components are installed
   npm install @radix-ui/react-switch @radix-ui/react-dialog @radix-ui/react-tabs lucide-react framer-motion
   ```

3. **Set up Environment Variables:**
   Copy `.env.example` to `.env.local` and fill in your keys.
   ```bash
   cp .env.example .env.local
   ```
   *Required variables: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_API_URL`.*

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🔌 API Access for Developers

Need to integrate temp mail into your own app?  
We provide a high-performance API via RapidAPI.

👉 **[Get API Key on RapidAPI](https://rapidapi.com/dishis-technologies-maildrop/api/temp-mail-maildrop1)**

**Features:**
- Create unlimited inboxes.
- Webhooks for new messages.
- Custom domain support.
- 99.9% Uptime SLA.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

<a href="https://www.buymeacoffee.com/dishantsinghdev" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" className="w-24" /></a>