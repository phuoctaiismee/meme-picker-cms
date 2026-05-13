# Meme Library CMS

![Meme Library CMS Banner](https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?auto=format&fit=crop&q=80&w=1200&h=400)

A premium, production-ready Content Management System (CMS) designed for high-performance digital asset management, specializing in memes. This platform features a robust tagging system, AI-powered content analysis, and a context-aware suggestion engine for browser extensions.

## 🚀 Key Features

- **Advanced Meme Management**: Upload, categorize, and manage high-quality memes with support for both images and videos.
- **AI-Powered Suggestions**: Integrated with **Google Gemini 2.0** to analyze text context and suggest relevant memes for social media interactions.
- **Smart Tagging System**: Comprehensive tag management with automated categorization and fast filtering.
- **Cloud-Native Storage**: Seamless integration with **Cloudinary** for optimized media delivery and **Supabase** for lightning-fast database operations.
- **Premium Admin Interface**: A state-of-the-art UI/UX built with React, featuring dark mode, glassmorphism aesthetics, and smooth animations.
- **Audit & Analytics**: Track administrator actions and view library statistics through a centralized dashboard.

## 🛠️ Technology Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Actions)
- **Language**: TypeScript
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Media Hosting**: [Cloudinary](https://cloudinary.com/)
- **Artificial Intelligence**: [Google Gemini AI SDK](https://ai.google.dev/)
- **State Management**: [TanStack Query (React Query)](https://tanstack.com/query/latest) & Zustand
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Design System
- **Icons**: Hugeicons React

## 📂 Project Structure

```text
meme-picker-cms/
├── public/              # Static assets (images, logos, etc.)
├── src/
│   ├── apis/            # Centralized API client logic & interfaces
│   │   ├── client/      # Supabase & AI service implementations
│   │   └── interfaces/  # TypeScript type definitions
│   ├── app/             # Next.js App Router (Pages & API Routes)
│   │   ├── (cms)/       # Protected CMS layout and routes
│   │   └── api/         # Backend API endpoints (Suggest, Memes, Tags)
│   ├── components/      # Shared UI components and Layouts
│   │   ├── layouts/     # Persistent layout components (Sidebar, Header)
│   │   └── ui/          # Atomic UI components (Buttons, Cards, Inputs)
│   ├── features/        # Feature-based modular logic
│   │   ├── memes/       # Meme management screens & components
│   │   ├── profile/     # User profile & security settings
│   │   └── tags/        # Tagging system implementation
│   ├── lib/             # Utility functions (Supabase, Storage, Slug)
│   └── store/           # Global state management (Zustand)
├── .env.example         # Environment variables template
└── next.config.ts       # Next.js configuration
```

## ⚙️ Getting Started

### Prerequisites

- Node.js 18.x or higher
- Yarn or NPM
- A Supabase account
- A Cloudinary account
- A Google AI Studio API Key (for Gemini)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/meme-picker-cms.git
   cd meme-picker-cms
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_UPLOAD_FOLDER=meme-picker-cms

   # Gemini AI
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server:**
   ```bash
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the result.

## 🔌 API Reference

### Meme Suggestion Engine
`POST /api/suggest`

Analyzes text context and returns relevant memes.
- **Body**: `{ "context": string, "limit": number }`
- **Auth**: CORS enabled for browser extension access.

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ by the Meme Curator Team.
