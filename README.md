<div align="center">
  <a href="https://www.freecustom.email">
    <img src="https://www.freecustom.email/logo.webp" alt="FreeCustom.Email Logo" width="150">
  </a>
  <h1>FreeCustom.Email</h1>
  <p>
    <b>The Fastest, Ad-Free Disposable Email Service.</b>
  </p>
  <p>
    Built with Next.js, Cloudflare Workers, and Tailwind CSS.
  </p>
  <p>
    <a href="https://www.freecustom.email"><strong>www.freecustom.email</strong></a>
  </p>
  <p>
    <a href="https://github.com/DishIs/fce-frontend/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/DishIs/fce-frontend?style=for-the-badge" alt="License">
    </a>
    <a href="https://github.com/DishIs/fce-frontend/stargazers">
      <img src="https://img.shields.io/github/stars/DishIs/fce-frontend?style=for-the-badge" alt="Stargazers">
    </a>
    <a href="https://github.com/DishIs/fce-frontend/issues">
      <img src="https://img.shields.io/github/issues/DishIs/fce-frontend?style=for-the-badge" alt="Issues">
    </a>
    <a href="https://github.com/DishIs/fce-frontend/pulls">
      <img src="https://img.shields.io/github/issues-pr/DishIs/fce-frontend?style=for-the-badge" alt="Pull Requests">
    </a>
  </p>
</div>

---

## ✨ Features

-   **Instant Inbox**: No refresh needed thanks to WebSockets.
-   **Ad-Free**: A clean, modern UI without any invasive popups or ads.
-   **Custom Domains**: Choose from a variety of domain options.
-   **Secure**: All emails are encrypted and automatically deleted after a set period.
-   **Developer API**: A powerful API for developers to integrate our service into their applications.
-   **PWA Ready**: Installable on both mobile and desktop for a native-like experience.

---

## 🛠️ Tech Stack

This project is the frontend for FreeCustom.Email. The backend is also open-source and can be found at [DishIs/fce-backend](https://github.com/DishIs/fce-backend).

-   **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS, Radix UI.
-   **Backend**: Cloudflare Workers (Edge), WebSockets (Cloudflare Durable Objects).
-   **Authentication**: NextAuth.js (Google, GitHub, Magic Link).

### Architecture

This frontend is hosted on Cloudflare Workers, which allows for incredibly fast response times at the edge. However, some connections like TCP are not handled optimally by Cloudflare Workers. To address this, our backend, [fce-backend](https://github.com/DishIs/fce-backend), is responsible for handling these connections, ensuring a robust and reliable service.

---

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+
-   npm or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/DishIs/fce-frontend.git
    cd fce-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Copy `.env.example` to `.env.local` and fill in your keys for local development.
    ```bash
    cp .env.example .env.local
    ```
    For production deployments with Cloudflare, copy `wrangler.jsonc.example` to `wrangler.jsonc` and fill in your keys.
    ```bash
    cp wrangler.jsonc.example wrangler.jsonc
    ```

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🤝 Contributing

We welcome contributions of all kinds! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions on how to get started. All contributors are expected to abide by our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## 📜 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for more details.

---

<div align="center">
  <p>
    A project by <a href="https://dishis.tech"><b>DishIs Technologies</b></a>
  </p>
</div>
