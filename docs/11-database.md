# Database & Prisma ORM

> **Prerequisites**: Read [01-auth.md](./01-auth.md) first.
>
> **Key Files**:
> - [`prisma/schema.prisma`](file:///c:/Users/kiran/code/p/videographic/videographic%20nextjs/prisma/schema.prisma) - Database schema
> - [`src/lib/db.ts`](file:///c:/Users/kiran/code/p/videographic/videographic%20nextjs/src/lib/db.ts) - Prisma client
> - [`src/lib/data/projects.ts`](file:///c:/Users/kiran/code/p/videographic/videographic%20nextjs/src/lib/data/projects.ts) - Data access layer

---

## 🎯 What You'll Learn

- PostgreSQL on Neon (serverless)
- Prisma ORM setup and configuration
- Database schema design
- The data access layer pattern
- Common database operations

---

## 🗄️ Database Overview

Videographic uses:

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Database** | PostgreSQL | Relational data storage |
| **Hosting** | Neon | Serverless PostgreSQL |
| **ORM** | Prisma 7 | Type-safe database queries |
| **Adapter** | @prisma/adapter-neon | Serverless connection pooling |

```mermaid
graph LR
    A[Next.js App] --> B[Prisma Client]
    B --> C[Neon Adapter]
    C --> D[Neon PostgreSQL]
```

---

## ⚡ Why Neon?

[Neon](https://neon.tech) is a serverless PostgreSQL service that:

- **Scales to zero** - No charges when idle
- **Auto-scaling** - Handles traffic spikes
- **Branching** - Create database branches for testing
- **Edge-compatible** - Works with serverless functions

---

## 📦 Prisma Client Setup

The Prisma client is initialized in `src/lib/db.ts`:

```typescript
// src/lib/db.ts

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Enable WebSocket for local development
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

// Global singleton pattern (prevents multiple connections in dev)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not defined");
  }

  // Use Neon adapter for serverless connections
  const adapter = new PrismaNeon({ connectionString: url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  });
};

// Export singleton instance
export const db = globalForPrisma.prisma ?? createPrismaClient();

// Preserve client across hot reloads in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

### Key Points

| Concept | Explanation |
|---------|-------------|
| **Singleton pattern** | Prevents creating new connections on each hot reload |
| **Neon adapter** | Handles connection pooling for serverless |
| **WebSocket** | Required for local development with Neon |
| **Logging** | Verbose in dev, errors only in prod |

---

## 📋 Database Schema

The database schema is defined in `prisma/schema.prisma`:

### Project Model

The main model for video projects:

```prisma
// prisma/schema.prisma

model Project {
  id          String   @id @default(cuid())  // Unique ID
  name        String                          // Project name
  description String?                         // Optional description
  
  // Video configuration
  width       Int      @default(1920)        // Canvas width
  height      Int      @default(1080)        // Canvas height
  fps         Int      @default(30)          // Frames per second
  duration    Float    @default(5.0)         // Length in seconds
  
  // Timeline data stored as JSON
  timeline    Json                           // Array of TimelineEvent
  
  // Metadata
  thumbnail   String?                        // Preview image
  status      ProjectStatus @default(DRAFT)  // Current state
  
  // Ownership
  userId      String                         // Owner's user ID
  user        User     @relation(...)        // Relation to User
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])  // Index for faster queries by user
}

enum ProjectStatus {
  DRAFT       // Initial state
  RENDERING   // Export in progress
  COMPLETED   // Export finished
  FAILED      // Export error
}
```

### JSON Storage

The `timeline` field stores the entire timeline as JSON:

```json
// Stored in timeline column
[
  {
    "id": "text-1",
    "type": "text",
    "startTime": 0,
    "duration": 3,
    "layer": 1,
    "properties": { "text": "Hello", "fontSize": 48, ... }
  },
  {
    "id": "shape-1",
    "type": "shape",
    ...
  }
]
```

**Why JSON?**

- Flexible structure (no schema migrations for timeline changes)
- Single query to load entire project
- Timeline events have varying structures

---

## 📂 Data Access Layer

The `src/lib/data/projects.ts` file provides functions for CRUD operations:

### Create Project

```typescript
export async function createProject(data: CreateProjectInput): Promise<VideoProject | null> {
  const session = await auth();  // Check authentication
  if (!session?.user?.id) return null;

  const project = await db.project.create({
    data: {
      name: data.name,
      description: data.description,
      width: data.width || 1920,
      height: data.height || 1080,
      fps: data.fps || 30,
      duration: data.duration || 5.0,
      timeline: (data.timeline || []) as any,
      userId: session.user.id,
      status: ProjectStatus.DRAFT,
    },
  });

  return {
    ...project,
    timeline: project.timeline as unknown as TimelineEvent[],
  };
}
```

### Get User's Projects

```typescript
export async function getUserProjects(): Promise<VideoProject[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },  // Most recent first
  });

  return projects.map((p) => ({
    ...p,
    timeline: p.timeline as unknown as TimelineEvent[],
  }));
}
```

### Get Single Project

```typescript
export async function getProjectById(id: string): Promise<VideoProject | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const project = await db.project.findUnique({
    where: {
      id,
      userId: session.user.id,  // Ensure ownership
    },
  });

  if (!project) return null;

  return {
    ...project,
    timeline: project.timeline as unknown as TimelineEvent[],
  };
}
```

### Update Project

```typescript
export async function updateProject(
  id: string,
  data: UpdateProjectInput
): Promise<VideoProject | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const project = await db.project.update({
      where: {
        id,
        userId: session.user.id,  // Ensure ownership
      },
      data: {
        ...data,
        timeline: data.timeline ? (data.timeline as any) : undefined,
      },
    });

    return {
      ...project,
      timeline: project.timeline as unknown as TimelineEvent[],
    };
  } catch (error) {
    return null;
  }
}
```

### Delete Project

```typescript
export async function deleteProject(id: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  try {
    await db.project.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });
    return true;
  } catch (error) {
    return false;
  }
}
```

### Duplicate Project

```typescript
export async function duplicateProject(id: string): Promise<VideoProject | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const original = await db.project.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!original) return null;

  const project = await db.project.create({
    data: {
      name: `${original.name} (Copy)`,  // Add "(Copy)" suffix
      description: original.description,
      width: original.width,
      height: original.height,
      fps: original.fps,
      duration: original.duration,
      timeline: original.timeline as any,
      userId: session.user.id,
      status: ProjectStatus.DRAFT,
    },
  });

  return {
    ...project,
    timeline: project.timeline as unknown as TimelineEvent[],
  };
}
```

---

## 🔒 Security Pattern

Notice every function follows this pattern:

```typescript
export async function someOperation(...) {
  // 1. Check authentication
  const session = await auth();
  if (!session?.user?.id) return null;  // ← Bail if not logged in

  // 2. Include userId in query
  const result = await db.project.findUnique({
    where: {
      id,
      userId: session.user.id,  // ← Only access own projects
    },
  });
}
```

This ensures:
- **Authentication** - Only logged-in users can access data
- **Authorization** - Users can only access their own projects

---

## 🔧 Common Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name migration_name

# Open database GUI
npx prisma studio

# View database schema
npx prisma db pull
```

---

## 🌐 Environment Setup

```env
# Database connection string from Neon dashboard
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

### Getting Neon Credentials

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. Add to `.env` file

---

## 📐 Type Conversions

Prisma stores JSON as `Json`, but we need `TimelineEvent[]`:

```typescript
// When reading from database
const project = await db.project.findUnique({ where: { id } });
const timeline = project.timeline as unknown as TimelineEvent[];

// When writing to database
await db.project.create({
  data: {
    timeline: events as any,  // Cast for compatibility
  },
});
```

This is necessary because:
- Prisma's `Json` type is flexible
- Our `TimelineEvent[]` is strictly typed
- TypeScript needs explicit casts between them

---

## 📊 Schema Relationships

```mermaid
erDiagram
    User ||--o{ Project : owns
    User ||--o{ Account : has
    User ||--o{ Session : has
    
    User {
        string id PK
        string name
        string email UK
        datetime createdAt
    }
    
    Project {
        string id PK
        string name
        json timeline
        string userId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Account {
        string id PK
        string provider
        string userId FK
    }
    
    Session {
        string id PK
        string sessionToken UK
        string userId FK
    }
```

---

## 🐛 Debugging Tips

### View All Queries (Development)

The Prisma client is configured to log queries in development:

```typescript
// Already in db.ts
log: process.env.NODE_ENV === "development" 
  ? ["query", "error", "warn"] 
  : ["error"],
```

### Use Prisma Studio

```bash
npx prisma studio
```

Opens a web GUI at `http://localhost:5555` to browse/edit data.

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `P2002: Unique constraint` | Duplicate entry | Check for existing record |
| `P2025: Record not found` | Invalid ID | Verify ID exists |
| `Connection error` | Bad credentials | Check DATABASE_URL |

---

## 📚 Next Steps

Now that you understand data persistence, learn about client-side state:

→ **[03-state-management.md](./03-state-management.md)** - Zustand State Management

---

*The database stores your projects permanently - the store manages them while editing.*
