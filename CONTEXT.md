# Videographic - Project Context

> **AI-Powered Video Editor** - A web-based 2D video editor that generates video timelines from AI prompts and renders them using Fabric.js canvas with WebCodecs export.

---

## 🏗️ Architecture Overview

### Tech Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js (App Router) | 16.1.3 |
| UI Framework | React + TypeScript | 19.2.3 |
| Styling | Tailwind CSS v4 | ^4 |
| Animations | Framer Motion | ^12.27.0 |
| State Management | Zustand | ^5.0.10 |
| Canvas Rendering | Fabric.js | ^7.1.0 |
| Animation Engine | GSAP | ^3.14.2 |
| Video Export | mp4-muxer, webm-muxer | ^5.2.2, ^5.1.4 |
| Schema Validation | Zod | ^4.3.5 |
| Authentication | NextAuth.js (Auth.js v5) | ^5.0.0-beta.30 |
| Database | PostgreSQL (Neon) | Serverless |
| ORM | Prisma | ^7.2.0 |

### Project Structure
```
src/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Auth routes (login)
│   ├── (dashboard)/         # Protected routes
│   │   ├── dashboard/       # Project gallery
│   │   └── editor/[id]/     # Video editor
│   └── api/                 # API routes
│       ├── auth/            # NextAuth handlers
│       ├── generate/        # AI generation endpoint
│       ├── projects/        # CRUD operations
│       └── samples/         # Sample projects
├── components/
│   ├── auth/                # UserButton, LoginForm
│   ├── dashboard/           # ProjectCard, ProjectGrid, NewProjectButton
│   ├── editor/              # Canvas, Timeline, PropertyPanel, etc.
│   ├── landing/             # Hero, Features, HowItWorks, etc.
│   └── providers/           # SessionProvider, ThemeProvider
├── hooks/                   # useProjects, useProject
├── lib/
│   ├── ai/                  # AI generation (Gemini, OpenAI, OpenRouter)
│   ├── canvas/              # Canvas utilities (grid, collision, commands)
│   ├── core/                # Video rendering & export pipeline
│   ├── data/                # Data access layer (projects.ts)
│   ├── schemas/             # Zod schemas (timeline.ts)
│   └── types/               # TypeScript interfaces
└── stores/                  # Zustand stores (editor-store.ts)
```

---

## 🎬 Core Concepts

### VideoProject Schema
The central data structure representing a video project:

```typescript
interface VideoProject {
  id: string;
  name: string;
  description?: string;
  width: number;           // Default: 1920
  height: number;          // Default: 1080
  fps: number;             // Default: 30
  duration: number;        // In seconds
  backgroundColor: string; // Hex color
  events: TimelineEvent[]; // All elements in the video
}
```

### TimelineEvent Schema
Individual elements in the video timeline:

```typescript
interface TimelineEvent {
  id: string;
  type: "text" | "shape" | "image" | "background" | "audio" | "connector";
  startTime: number;       // When element appears (seconds)
  duration: number;        // How long it's visible (seconds)
  layer: number;           // Z-index (0 = back, higher = front)
  gridPosition?: string;   // Grid position (A1-C3)
  properties: TextProperties | ShapeProperties | ImageProperties | AudioProperties | BackgroundProperties | ConnectorProperties;
  animations?: Animation[];      // Property animations
  transition?: Transition;       // Scene transitions
}
```

### Animation System
```typescript
interface Animation {
  property: "opacity" | "scale" | "x" | "y" | "rotation" | "fill" | "strokeWidth";
  from: number | string;
  to: number | string;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "bounce";
  duration?: number;
  delay?: number;
}
```

### Transition System
```typescript
interface Transition {
  type: "none" | "fade" | "slideLeft" | "slideRight" | "slideUp" | "slideDown" | "scale" | "blur";
  duration: number;
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut";
}
```

---

## 🔑 Key Files Reference

### State Management
- **`src/stores/editor-store.ts`** - Zustand store for editor state
  - `project` - Current VideoProject
  - `currentTime` - Playhead position
  - `isPlaying` - Playback state
  - `selectedId` - Selected element ID
  - `canvas` - Fabric.js canvas instance
  - Actions: `setProject`, `updateEvent`, `addEvent`, `deleteEvent`, `undo`, `redo`

### Canvas Utilities
- **`src/lib/canvas/grid-resolver.ts`** - 3x3 grid system (A1-C3) for LLM spatial prompting
  - Converts grid positions to pixel coordinates
  - Provides grid-based positioning for AI-generated elements

- **`src/lib/canvas/collision.ts`** - Collision detection and resolution system
  - Detects overlapping elements
  - Resolves collisions with intelligent separation logic
  - Handles text elements with priority

- **`src/lib/canvas/command-executor.ts`** - LLM command handling
  - Implements commands like connect, align, group, distribute
  - Enables relative operations based on element IDs

### Schema Definitions
- **`src/lib/schemas/timeline.ts`** - All Zod schemas
  - `VideoProjectSchema`, `TimelineEventSchema`
  - `TextPropertiesSchema`, `ShapePropertiesSchema`, `ImagePropertiesSchema`
  - `AudioPropertiesSchema`, `BackgroundPropertiesSchema`, `ConnectorProperties`
  - `AnimationSchema`, `TransitionSchema`

### AI Generation
- **`src/lib/ai/prompts.ts`** - System prompt and validation
  - `SYSTEM_PROMPT` - Instructs LLM to output valid JSON
  - `buildUserPrompt()` - Formats user description
  - `validateGeneratedProject()` - Validates & fixes LLM output
  - Uses collision detection for auto-fix

- **`src/lib/ai/openrouter.ts`** - OpenRouter API client (FREE models only)
- **`src/lib/ai/gemini.ts`** - Google Gemini client
- **`src/lib/ai/openai.ts`** - OpenAI client

- **`src/lib/ai/two-phase-generator.ts`** - Two-phase generation pipeline
  - `generateWithTwoPhase()` - Standard sequential generation
  - `generateWithParallelScenes()` - Parallel scene synthesis (faster)
  - `retryPhase2()` - Retry phase 2 conversion

- **`src/lib/ai/converter.ts`** - VisualScript to VideoProject conversion

### Web Worker
- **`src/workers/json-parser.worker.ts`** - Web worker for offloading JSON parsing
  - Handles large AI responses without blocking the UI
  - Fallbacks to direct parsing for small responses

### Video Export Pipeline
- **`src/lib/core/VideoExporter.ts`** - Main export orchestrator
  - Supports WebCodecs (Chrome) and MediaRecorder (Firefox) fallbacks
  - Exports to MP4 (H.264) or WebM (VP8/VP9)
  
- **`src/lib/core/FabricRenderer.ts`** - Renders timeline to Fabric.js canvas
- **`src/lib/core/MediaRecorderExporter.ts`** - Fallback export method
- **`src/lib/core/encoder/`** - Video encoder wrappers and muxers

### Editor Components
- **`src/components/editor/EditorClient.tsx`** - Main editor container
  - Integrates Canvas, Timeline, PropertyPanel, LayersPanel
  - Handles keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Shift+Z)
  - Auto-save functionality

- **`src/components/editor/Canvas.tsx`** - Fabric.js canvas wrapper
- **`src/components/editor/Timeline.tsx`** - Timeline track visualization
- **`src/components/editor/PropertyPanel.tsx`** - Element property editor
- **`src/components/editor/AddElementToolbar.tsx`** - Add new elements
- **`src/components/editor/AIGenerateModal.tsx`** - AI generation dialog
- **`src/components/editor/ExportModal.tsx`** - Export progress dialog

### Data Access
- **`src/lib/data/projects.ts`** - Server-side CRUD operations
  - `createProject()`, `getUserProjects()`, `getProjectById()`
  - `updateProject()`, `deleteProject()`, `duplicateProject()`

- **`src/hooks/useProjects.ts`** - Client-side data fetching hooks

### Types
- **`src/types/commands.ts`** - LLM command definitions
  - Command types: connect, align, group, distribute
  - Direction and grid position support

### Authentication
- **`src/lib/auth.ts`** - NextAuth.js configuration (Google OAuth)
- **`src/lib/db.ts`** - Prisma client with Neon adapter
- **`src/middleware.ts`** - Route protection middleware

---

## 🗄️ Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  projects      Project[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Project {
  id          String        @id @default(cuid())
  name        String
  description String?
  width       Int           @default(1920)
  height      Int           @default(1080)
  fps         Int           @default(30)
  duration    Float         @default(5.0)
  timeline    Json          // Array of TimelineEvent
  thumbnail   String?
  status      ProjectStatus @default(DRAFT)
  userId      String
  user        User          @relation(...)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

enum ProjectStatus {
  DRAFT
  RENDERING
  COMPLETED
  FAILED
}
```

---

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List user's projects |
| `/api/projects` | POST | Create new project |
| `/api/projects/[id]` | GET | Get project by ID |
| `/api/projects/[id]` | PATCH | Update project |
| `/api/projects/[id]` | DELETE | Delete project |
| `/api/projects/[id]/duplicate` | POST | Duplicate project |
| `/api/generate` | POST | Generate project via AI |
| `/api/samples` | GET | List sample projects |
| `/api/auth/[...nextauth]` | * | Auth.js handlers |

---

## 🎨 UI/UX Guidelines

### Design System
- **Theme**: Dark mode with vibrant accent colors
- **Primary Color**: Purple/Violet (`#8b5cf6`)
- **Background**: Dark gradients (`#0a0a0a`, `#1a1a2e`, `#0f0e17`)
- **Typography**: Inter font family (Google Fonts)
- **Animations**: Framer Motion for page transitions and micro-interactions

### Component Patterns
- Use Framer Motion `motion.*` components for animations
- Follow glassmorphism aesthetic where appropriate
- Implement responsive layouts (mobile-first)
- Use Radix UI icons (`@radix-ui/react-icons`)

---

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
AUTH_SECRET="..."

# AI (optional - uses free OpenRouter models by default)
OPENROUTER_API_KEY="..."
GEMINI_API_KEY="..."
OPENAI_API_KEY="..."
```

---

## 📋 Development Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Database
npx prisma db push   # Sync schema to database
npx prisma studio    # Open database GUI
npx prisma generate  # Generate Prisma client

# Build
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## 🚧 Known Issues & TODOs

### Pending Features (from features.local.md)
- [ ] Audio Playback Engine - Synchronized audio with timeline
- [ ] Text-to-Speech Integration - Generate voiceovers
- [ ] Image Generation - DALL-E/Imagen integration for image prompts
- [ ] Asset Library - Manage generated/uploaded assets
- [ ] Rich Text Support - Multi-color/font text blocks
- [ ] Canvas State Persistence - Fix resize handle persistence bug
- [ ] Export Alignment - Fix slight cropping in exported video

### Implemented Features ✅
- AI Generation Modal (Gemini, OpenAI, OpenRouter)
- Audio Schema Support
- Enhanced Timeline (sticky ruler, zoom, track labels)
- Layer Management (drag-drop reordering)
- Animation Controls (add/remove, property config, easing)
- Transition System (fade, slide, scale, blur)
- Background Editing (solid, gradient, presets)
- Property Panel (type-specific editors)
- Video Export (WebCodecs + MediaRecorder fallback)
- Undo/Redo (50-state history)
- Auto-save & Keyboard Shortcuts

### New Features ✅
- Grid-based Positioning System (A1-C3 grid)
- Connector Elements (lines/arrows between elements)
- Command-based Operations (connect, align, group, distribute)
- Collision Detection & Auto-fix
- Web Worker for JSON Parsing (improves UI performance)
- Parallel Scene Synthesis (faster generation)

---

## 🔄 Data Flow

```
User Prompt → AI Generation API → validateGeneratedProject() → VideoProject
     ↓
EditorStore (Zustand) ← User Edits ↔ PropertyPanel/Timeline/Canvas
     ↓
Auto-save → API → Database (Project.timeline JSON)
     ↓
Export → FabricRenderer → VideoEncoder → MP4/WebM Blob → Download
```

---

## 💡 Code Conventions

1. **File Naming**: kebab-case for files, PascalCase for components
2. **Exports**: Named exports preferred, use index.ts barrels
3. **Types**: Prefer Zod schemas with inferred types
4. **API Routes**: Use `runtime = "nodejs"` for Prisma-dependent routes
5. **State Updates**: Use Zustand's `set()` with spread operators
6. **Validation**: Always validate AI-generated content with Zod

---

## 🤖 AI Coding Guidelines

When making changes to this codebase:

1. **Schema Changes**: Update `src/lib/schemas/timeline.ts`, then update corresponding TypeScript interfaces in `src/lib/types/project.ts`

2. **New Element Types**: 
   - Add type to `TimelineEventSchema.type` enum
   - Create new `*PropertiesSchema` in timeline.ts
   - Update `PropertyPanel.tsx` to handle new type
   - Update `FabricRenderer.ts` to render new type

3. **AI Prompt Changes**: Update `SYSTEM_PROMPT` in `src/lib/ai/prompts.ts` and update `validateGeneratedProject()` to handle new properties

4. **New API Endpoints**: Create in `src/app/api/`, add `runtime = "nodejs"` if using Prisma

5. **Editor State**: Add to `EditorState` interface and implement in `useEditorStore`

6. **New Components**: Place in appropriate folder under `src/components/`, follow existing patterns

---

*Last Updated: January 2026*
