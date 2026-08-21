<div align="center">

# ⚡ Personal Task Manager (Denycode)

**A high-performance, single-user Personal Task & Knowledge Management ecosystem built for speed, security, and aesthetics.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.2-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?style=for-the-badge&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br />

Developed by **[Deni Irawan Nugraha](https://github.com/denycode-dev)** &bull; Repository: **[denycode-dev/personal-task-manager](https://github.com/denycode-dev/personal-task-manager)**

---

</div>

## 📖 Overview

**Personal Task Manager** is a self-hosted, all-in-one productivity suite tailored for developers, creators, and professionals who demand a frictionless workflow. It integrates rich note-taking, interactive Kanban boards, structured checklists, and a unified deadline calendar into a unified Neobrutalism interface.

Built on the modern **Next.js 16 App Router**, **React 19**, and **Neon PostgreSQL (via Drizzle ORM)**, the app is engineered to operate seamlessly as an installable **Progressive Web App (PWA)** with offline fallback support, zero-bloat single-user authentication, and enterprise-grade **AES-256-GCM envelope encryption** for confidential notes.

---

## ✨ Key Features

### 📝 1. Rich Note-Taking & Markdown Integration
- **Tiptap Rich-Text Editor:** Full support for headings, bold/italics, blockquotes, code blocks, tables, and inline images.
- **Reading Insights:** Real-time word count, character count, and estimated reading time calculations.
- **Markdown Export & Import:**
  - Export single notes to `.md` with preserved YAML frontmatter.
  - Export all notes as a structured `.zip` archive.
  - Import single `.md` files or batch import markdown archives seamlessly.
- **Public Note Sharing:** Generate unique, read-only public URLs (`/notes/share/[slug]`) for easy knowledge sharing.

### 🔒 2. Privacy & Envelope Encryption (AES-256-GCM)
- **Note Locking:** Protect confidential notes with an independent per-note password.
- **Envelope Encryption Architecture:** Content is encrypted using a unique Data Encryption Key (DEK) wrapped by a Master Encryption Key (`NOTE_MASTER_ENCRYPTION_KEY`), ensuring password reset recovery without compromising zero-plaintext guarantees.
- **Search Isolation:** Locked note content is never indexed into full-text search vectors (`tsvector`).

### 📋 3. Interactive Kanban Boards
- **Drag-and-Drop Workflow:** Fluid card and column reordering powered by `@dnd-kit`.
- **Card Details:** Checklists, due dates, description, priority tags, and color markers.
- **Media Attachments:** Upload files and preview images directly via ImageKit CDN integration (up to 5MB).
- **Column Customization:** Reorder, rename, and manage task lifecycles with zero latency.

### ☑️ 4. Actionable Checklists & Fast Tracking
- **Standalone & Inline Checklists:** Create structured to-do lists with progress percentage meters.
- **Quick Operations:** Fast check/uncheck, batch item completion, and rapid deletion shortcuts.

### 📅 5. Unified Deadline Calendar & Timeline
- **Global Schedule:** Aggregates deadlines across all Kanban cards, notes, and checklists in one responsive FullCalendar view.
- **Urgent Deadline Indicator (H-1):** Visual warning badges and dashboard summary widgets for tasks due within 24 hours.

### 🎨 6. Neobrutalism Design System & PWA
- **Distinct Aesthetic:** High-contrast borders, bold typography, vibrant accents, and tactile drop-shadows.
- **Theme Support:** Dark and light mode toggle powered by `next-themes`.
- **Installable PWA:** Full service worker caching (`@serwist/next`), custom install prompts for Android/Desktop/iOS, and offline fallback route (`/offline`).
- **Responsive Layout:** Desktop collapsible sidebar & optimized mobile bottom navigation.

---

## 🛠️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│               Client (Browser / Installed PWA)              │
│  - Next.js App Router (RSC + Client Components)             │
│  - Service Worker (@serwist/next) App Shell Cache & Offline │
│  - State: TanStack React Query + Zustand                    │
│  - UI: Tailwind CSS v4 + shadcn/ui + Neobrutalism           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / Server Actions / Cookies
┌──────────────────────────────▼──────────────────────────────┐
│                    Next.js 16 Server                        │
│  - Auth Middleware (Jose JWT Cookie Verification)           │
│  - Server Actions & API Route Handlers                      │
│  - Envelope Crypto Engine (AES-256-GCM + Node crypto)       │
│  - File Upload Validation (≤ 5MB Server Guard)              │
└──────────────┬───────────────────────────────┬──────────────┘
               │ Drizzle ORM                   │ ImageKit SDK
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│   PostgreSQL / Neon Serverless│ │     ImageKit Cloud Storage    │
└─────────────────────────────┘ └─────────────────────────────┘
```

| Layer | Technologies | Description |
|---|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) | High-performance React framework with RSC and Server Actions |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | End-to-end type safety |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) | Neobrutalism design system and accessible UI components |
| **Icons** | [Phosphor Icons](https://phosphoricons.com/), [Lucide React](https://lucide.dev/) | Modern icon sets |
| **Rich Text** | [Tiptap Editor](https://tiptap.dev/) | Extensible headless WYSIWYG editor |
| **Drag & Drop** | [@dnd-kit/core](https://dndkit.com/), [@dnd-kit/sortable](https://dndkit.com/) | Lightweight and modular drag and drop for Kanban boards |
| **Calendar** | [FullCalendar](https://fullcalendar.io/) (React) | Interactive schedule and timeline views |
| **Database & ORM** | [Neon PostgreSQL](https://neon.tech/), [Drizzle ORM](https://orm.drizzle.team/) | Serverless PostgreSQL with type-safe schema definitions |
| **State Management** | [TanStack React Query v5](https://tanstack.com/query/latest), [Zustand](https://zustand-demo.pmnd.rs/) | Server cache orchestration and client state |
| **Authentication** | [jose](https://github.com/panva/jose), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Single-user stateless JWT sessions via `httpOnly` secure cookies |
| **File Storage** | [ImageKit.io](https://imagekit.io/) | Fast image and attachment hosting with 5MB quota enforcement |
| **PWA & Offline** | [@serwist/next](https://serwist.pages.dev/) | Automated Service Worker and offline shell caching |

---

## 🚀 Getting Started (Panduan Memulai dari Nol)

Follow this step-by-step guide to clone, configure, migrate, and run the project locally from scratch.

### 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.x` or higher ([Download Node.js](https://nodejs.org/))
- **Package Manager**: `pnpm` (recommended), `npm`, `yarn`, or `bun`
  ```bash
  npm install -g pnpm
  ```
- **PostgreSQL Database**:
  - A free cloud database instance from [Neon.tech](https://neon.tech/) (recommended) or [Supabase](https://supabase.com/).
  - *Alternatively*, a local PostgreSQL instance running on `localhost:5432`.
- **ImageKit Account**:
  - A free account from [ImageKit.io](https://imagekit.io/) for file/image uploads.

---

### 📥 1. Clone the Repository

```bash
git clone https://github.com/denycode-dev/personal-task-manager.git
cd personal-task-manager
```

---

### 📦 2. Install Dependencies

Install all required dependencies using `pnpm`:

```bash
pnpm install
```

*(Or using npm: `npm install`)*

---

### ⚙️ 3. Configure Environment Variables

Create your local `.env` file by copying the provided `.env.example` template:

```bash
cp .env.example .env
```

Open `.env` in your text editor and fill in your values:

```env
# ------------------------------------------------------------------------------
# 1. Application Authentication & Security
# ------------------------------------------------------------------------------
# Master password used to log into the application (single-user model)
APP_PASSWORD=your_secure_app_password_here

# 32+ character random secret string used to sign JWT session cookies
# Generate with: openssl rand -base64 32
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

# 32-hex character master key used in AES-256-GCM envelope encryption for locked notes
# Generate with: openssl rand -hex 32
NOTE_MASTER_ENCRYPTION_KEY=your_master_encryption_key_32_hex_chars

# ------------------------------------------------------------------------------
# 2. Database Configuration (PostgreSQL / Neon Serverless)
# ------------------------------------------------------------------------------
# PostgreSQL connection string (Example with Neon Serverless Postgres)
DATABASE_URL=postgresql://user:password@ep-sample-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require

# ------------------------------------------------------------------------------
# 3. ImageKit Storage (File & Image Uploads)
# ------------------------------------------------------------------------------
# Obtain these from your ImageKit Dashboard (https://imagekit.io/dashboard/developer/api-keys)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# Max upload limit in bytes (Default: 5MB = 5242880 bytes)
MAX_FILE_SIZE_BYTES=5242880

# ------------------------------------------------------------------------------
# 4. App URL
# ------------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> [!TIP]
> You can quickly generate secure cryptographic keys using terminal commands:
> ```bash
> # For JWT_SECRET:
> node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
>
> # For NOTE_MASTER_ENCRYPTION_KEY:
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

### 🗄️ 4. Setup Database Schema & Migrations

Push the database schema defined in `lib/db/schema` directly to your PostgreSQL database:

```bash
pnpm db:push
```

If you prefer generating and running migration files:

```bash
# 1. Generate migration SQL files
pnpm db:generate

# 2. Execute migrations against the database
pnpm db:migrate
```

*(Optional)* You can inspect and manage your database visually using **Drizzle Studio**:
```bash
pnpm db:studio
```
Then visit `https://local.drizzle.studio` to browse tables, records, and relationships.

---

### 💻 5. Run the Development Server

Start the Next.js development server:

```bash
pnpm dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

1. Enter your `APP_PASSWORD` configured in `.env` to log in.
2. You'll be redirected to your dashboard, ready to create notes, kanban boards, and checklists!

---

### 📱 6. Installing as a Progressive Web App (PWA)

- **Google Chrome / Microsoft Edge (Desktop):** Click the **Install** icon in the browser address bar.
- **Android (Chrome):** Tap the browser menu `⋮` &rarr; **Add to Home Screen** / **Install App**.
- **iOS (Safari):** Tap the **Share** button &rarr; Scroll down and tap **Add to Home Screen**.

---

## 📂 Project Structure

```text
personal-task-manager/
├── app/                        # Next.js App Router root
│   ├── (auth)/                 # Authentication routes (login)
│   ├── (dashboard)/            # Protected application dashboard pages
│   │   ├── calendar/           # FullCalendar timeline & schedule view
│   │   ├── checklists/         # Checklist management pages
│   │   ├── dashboard/          # Summary overview & urgent deadline widgets
│   │   ├── folders/            # Folder organization pages
│   │   ├── kanban/             # Kanban boards & card workflows
│   │   └── notes/              # Tiptap note-taking & markdown manager
│   ├── (public)/               # Publicly shared note viewer (/notes/share/[slug])
│   ├── api/                    # Route handlers (calendar, deadlines, uploads)
│   ├── offline/                # PWA offline fallback page
│   ├── globals.css             # Tailwind CSS & Neobrutalism design tokens
│   ├── manifest.ts             # Web App Manifest generator
│   └── sw.ts                   # Service Worker implementation (@serwist/next)
├── components/                 # Global UI & shared component library
├── config/                     # Environment configuration & Zod schema validation
├── drizzle/                    # Drizzle migrations output directory
├── features/                   # Feature-based modular architecture
│   ├── auth/                   # Authentication forms, actions, and services
│   ├── calendar/               # Calendar feeds, aggregators, and views
│   ├── checklists/             # Checklist state, components, and actions
│   ├── dashboard/              # Statistics widgets and deadline aggregations
│   ├── folders/                # Folder CRUD, color pickers, and stores
│   ├── kanban/                 # Kanban columns, cards, dnd-kit hooks, attachments
│   ├── notes/                  # Tiptap extensions, encryption, Markdown parser
│   └── search/                 # Global full-text search components
├── lib/                        # Core utilities and singletons
│   ├── auth/                   # JWT creation, session cookies, password validation
│   ├── db/                     # Drizzle ORM client and PostgreSQL schemas
│   │   └── schema/             # Normalized 3NF table schemas
│   ├── encryption/             # AES-256-GCM envelope encryption utilities
│   ├── imagekit/               # ImageKit server SDK integration
│   └── pwa/                    # PWA installation listeners and utilities
├── public/                     # Static assets, icons, and manifest images
├── drizzle.config.ts           # Drizzle Kit configuration
├── next.config.ts              # Next.js & Serwist PWA build configuration
└── package.json                # Project dependencies and npm scripts
```

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| **`dev`** | `pnpm dev` | Starts the Next.js development server on `http://localhost:3000` |
| **`build`** | `pnpm build` | Builds the production bundle and generates service worker scripts |
| **`start`** | `pnpm start` | Runs the compiled production build locally |
| **`lint`** | `pnpm lint` | Runs ESLint to verify code quality and style compliance |
| **`db:generate`** | `pnpm db:generate` | Generates Drizzle migration files based on schema changes |
| **`db:migrate`** | `pnpm db:migrate` | Applies pending migration files to the database |
| **`db:push`** | `pnpm db:push` | Directly syncs the database schema with `lib/db/schema` |
| **`db:studio`** | `pnpm db:studio` | Launches Drizzle Studio GUI for inspecting PostgreSQL data |

---

## 🚢 Deployment Guide (Vercel + Neon)

### Deploying to Vercel

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, supply all variables from your `.env` file:
   - `APP_PASSWORD`
   - `JWT_SECRET`
   - `NOTE_MASTER_ENCRYPTION_KEY`
   - `DATABASE_URL`
   - `IMAGEKIT_PUBLIC_KEY`
   - `IMAGEKIT_PRIVATE_KEY`
   - `IMAGEKIT_URL_ENDPOINT`
   - `MAX_FILE_SIZE_BYTES`
   - `NEXT_PUBLIC_APP_URL` (set to your production domain, e.g., `https://your-domain.vercel.app`)
4. Click **Deploy**. Vercel will automatically compile the Next.js application, build the PWA Service Worker, and deploy your instance.

---

## 🛡️ Security & Privacy Architecture

- **Stateless Single-User Authentication:** No unnecessary multi-user overhead or user table vulnerability. Authentication is validated against an environment hash and stored in an encrypted `httpOnly`, `SameSite=Lax` cookie.
- **Envelope Encryption (AES-256-GCM):**
  - Locked notes generate a cryptographic 256-bit Data Encryption Key (DEK).
  - The note's content is encrypted with the DEK using AES-256-GCM.
  - The DEK is encrypted with the master key (`NOTE_MASTER_ENCRYPTION_KEY`) and stored alongside the ciphertext.
  - Full-text search vectors are computed only from plaintext notes—locked content is mathematically impossible to leak via SQL queries or search indexing.
- **Upload Quota Enforcement:** Strict server-side and client-side guards reject any file payload exceeding 5MB before reaching storage.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork the repository** (`https://github.com/denycode-dev/personal-task-manager/fork`)
2. **Create your feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes:**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
4. **Push to the branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

---

## 👤 Author

**Deni Irawan Nugraha**
- **GitHub:** [@denycode-dev](https://github.com/denycode-dev)
- **Repository:** [https://github.com/denycode-dev/personal-task-manager](https://github.com/denycode-dev/personal-task-manager)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with ❤️ by Deni Irawan Nugraha</sub>
</div>
