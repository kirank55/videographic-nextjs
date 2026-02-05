# Project Setup

> **Prerequisites**: None - this is where you start!
>
> **Goal**: Set up a new Next.js project with all required dependencies

---

## 🎯 What You'll Learn

- How to initialize the Next.js project
- All required dependencies and their purposes
- Project folder structure
- Environment variables setup
- Running the development server

---

## 🛠️ Step 1: Create Next.js Project

```bash
npx create-next-app@latest videographic --typescript --tailwind --eslint --app --src-dir
cd videographic
```

When prompted:
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes
- ✅ `src/` directory: Yes
- ✅ App Router: Yes
- ❌ Turbopack: No (optional)
- ✅ Import alias: Yes (@/*)

---

## 📦 Step 2: Install Dependencies

### Core Dependencies

```bash
npm install zustand zod fabric@7 framer-motion
```

| Package | Purpose |
|---------|---------|
| `zustand` | Lightweight state management |
| `zod` | Schema validation for data structures |
| `fabric@7` | Canvas rendering library |
| `framer-motion` | UI animations and transitions |

### Authentication & Database

```bash
npm install next-auth@5 @auth/prisma-adapter prisma @prisma/client
npm install @neondatabase/serverless @prisma/adapter-neon ws
```

| Package | Purpose |
|---------|---------|
| `next-auth@5` | Authentication (Auth.js) |
| `@auth/prisma-adapter` | NextAuth database adapter |
| `prisma` | Database ORM |
| `@prisma/client` | Prisma query client |
| `@neondatabase/serverless` | Serverless PostgreSQL |
| `@prisma/adapter-neon` | Prisma adapter for Neon |
| `ws` | WebSocket for local development |

### Video Export

```bash
npm install mp4-muxer webm-muxer
```

| Package | Purpose |
|---------|---------|
| `mp4-muxer` | MP4 video encoding |
| `webm-muxer` | WebM video encoding |

### UI Components (Optional)

```bash
npm install lucide-react clsx
```

| Package | Purpose |
|---------|---------|
| `lucide-react` | Icon library |
| `clsx` | Conditional class names |

### Dev Dependencies

```bash
npm install -D @types/ws
```

---

## 📁 Step 3: Create Folder Structure

Create the following directories:

```bash
mkdir -p src/lib/schemas
mkdir -p src/lib/data
mkdir -p src/lib/ai
mkdir -p src/lib/core
mkdir -p src/lib/canvas
mkdir -p src/stores
mkdir -p src/components/editor
mkdir -p src/components/editor/hooks
mkdir -p src/components/auth
mkdir -p src/components/dashboard
mkdir -p src/types
```

### Folder Structure Overview

```
src/
├── app/                    # Next.js pages & API routes
│   ├── (auth)/            # Login page (public)
│   ├── (dashboard)/       # Protected routes
│   │   ├── dashboard/     # Project gallery
│   │   └── editor/[id]/   # Video editor
│   └── api/               # REST API endpoints
│
├── components/            # React components
│   ├── auth/              # Login UI
│   ├── dashboard/         # Project cards, grid
│   └── editor/            # Canvas, Timeline, PropertyPanel
│
├── lib/                   # Core logic
│   ├── ai/                # AI generation (prompts, API clients)
│   ├── canvas/            # Grid system, collision detection
│   ├── core/              # Video rendering & export
│   ├── data/              # Database operations
│   └── schemas/           # Zod validation schemas
│
├── stores/                # Zustand state stores
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

---

## 🔐 Step 4: Environment Variables

Create a `.env` file in the project root:

```env
# Database (from Neon dashboard)
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# NextAuth secret (generate with: openssl rand -base64 32)
AUTH_SECRET="your-random-secret"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OpenRouter API (optional, for AI generation)
OPENROUTER_API_KEY="your-openrouter-api-key"
```

### Getting Credentials

| Service | Where to Get Credentials |
|---------|-------------------------|
| **Neon** | [console.neon.tech](https://console.neon.tech/) - Create project → Copy connection string |
| **Google OAuth** | [console.cloud.google.com](https://console.cloud.google.com/) - APIs & Services → Credentials → Create OAuth Client ID |
| **OpenRouter** | [openrouter.ai](https://openrouter.ai/) - Dashboard → API Keys |

---

## 🗄️ Step 5: Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema (we'll edit this in the Database doc)
- Updates `.env` with `DATABASE_URL` placeholder

---

## ✅ Step 6: Verify Setup

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the default Next.js page.

---

## 📋 Build Steps Summary

Files created in this doc:

| File/Folder | Purpose |
|-------------|---------|
| `package.json` | Dependencies |
| `.env` | Environment variables |
| `prisma/schema.prisma` | Database schema (placeholder) |
| `src/lib/` folders | Core logic directories |
| `src/components/` folders | UI component directories |
| `src/stores/` | State management directory |

---

## 📚 Next Steps

Now that your project is set up, define the core data structures:

→ **[02-data-schemas.md](./02-data-schemas.md)** - Data Schemas

---

*This is the foundation - every other doc builds on this setup.*
