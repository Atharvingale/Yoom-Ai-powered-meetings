# YOOM

A modern video conferencing platform built with Next.js, TypeScript, and Stream Video SDK.

## Tech Stack

[![TypeScript](https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6)](https://www.typescript.org/)
[![Next.js](https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/-Supabase-181818?style=for-the-badge&logoColor=white&logo=supabase)](https://supabase.io/)
[![Clerk](https://img.shields.io/badge/-Clerk-7D7D7D?style=for-the-badge&logoColor=white&logo=clerk)](https://clerk.com/)
[![Stream Video](https://img.shields.io/badge/-Stream_VIDEO-00CFFF?style=for-the-badge)](https://getstream.io/video-react-sdk/)

## Features

- **Authentication:** Secure login & registration with Clerk
- **Video Meetings:** Real-time audio & video with Stream SDK
- **Meeting Controls:** Screen sharing, recording, reactions
- **Personal Rooms:** Unique meeting links for instant sessions
- **Schedule Meetings:** Plan & join future meetings
- **Responsive UI:** Works across all device sizes

## Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd YOOM

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Clerk and Stream API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Stream Video SDK](https://getstream.io/video-react-sdk/docs)
- [Clerk Documentation](https://clerk.com/docs)