<div align="center">
  <h1>⚡ YOOM</h1>
  <p><b>Next-Generation Video Conferencing Application</b></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk Auth" />
    <img src="https://img.shields.io/badge/Stream-Video_SDK-005FFF?style=for-the-badge&logo=stream&logoColor=white" alt="Stream SDK" />
  </p>
</div>

---

## 📌 Overview

**YOOM** is a full-featured, real-time video conferencing web application designed for seamless communication. Built with performance and scalability in mind, it provides instant meeting creation, scheduling, screen sharing, recording playback, and personal meeting rooms.

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| 🔒 **Authentication** | Multi-factor social & password authentication powered by Clerk. |
| ⚡ **Instant Meetings** | Quick-start audio and video calls with preview controls. |
| 🎛️ **Meeting Controls** | Mute/unmute, camera toggle, screen sharing, reactions, and layout views. |
| 📅 **Scheduled Calls** | Plan future meetings with custom date/time settings and shareable invite links. |
| 📼 **Recordings & History** | Access recordings of past sessions and view complete meeting history. |
| 🚪 **Personal Room** | Permanent personal room link for instant, hassle-free meetings. |
| 📱 **Responsive UI** | Mobile-first, fully responsive design using Tailwind CSS and Radix UI components. |

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Authentication:** [Clerk](https://clerk.com/)
- **Real-Time Video/Audio:** [Stream Video React SDK](https://getstream.io/video/)
- **Database & Services:** [Supabase](https://supabase.com/)
- **UI & Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Radix UI / Shadcn](https://ui.shadcn.com/)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.0.0 or later
- **npm**, **yarn**, or **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/yoom.git
   cd yoom
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:

   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

   # Stream SDK Credentials
   NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
   STREAM_SECRET_KEY=your_stream_secret_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the app for production |
| `npm run start` | Runs the built production server |
| `npm run lint` | Runs ESLint checks |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
