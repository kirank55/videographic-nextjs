# API Routes

> **Prerequisites**: Read [11-ai-generation.md](./11-ai-generation.md) first.
>
> **Key Directory**: [`src/app/api/`](file:///c:/Users/kiran/code/p/videographic/videographic%20nextjs/src/app/api)

---

## 🎯 What You'll Learn

- All API endpoints and their purpose
- Authentication patterns
- Request/response formats
- Error handling

---

## 📋 Route Overview

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/[...nextauth]` | * | NextAuth.js authentication |
| `/api/projects` | GET | List user's projects |
| `/api/projects` | POST | Create new project |
| `/api/projects/:id` | GET | Get single project |
| `/api/projects/:id` | PATCH | Update project |
| `/api/projects/:id` | DELETE | Delete project |
| `/api/projects/:id/duplicate` | POST | Duplicate project |
| `/api/generate` | POST | Generate with AI |

---

## 🔐 Authentication

All routes (except auth) require authentication:

```typescript
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... proceed
}
```

---

## 📁 Projects API

### List Projects

```http
GET /api/projects
Authorization: Session cookie
```

**Response:**
```json
[
  {
    "id": "clx...",
    "name": "My Video",
    "duration": 10,
    "width": 1920,
    "height": 1080,
    "updatedAt": "2024-01-15T10:30:00Z",
    "events": [...]
  }
]
```

**Source:** [`src/app/api/projects/route.ts`](file:///c:/Users/kiran/code/p/videographic/videographic%20nextjs/src/app/api/projects/route.ts)

```typescript
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const projects = await getUserProjects();
  return NextResponse.json(projects);
}
```

---

### Create Project

```http
POST /api/projects
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Video",
  "description": "Optional description",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "duration": 10,
  "timeline": []
}
```

**Response:** `201 Created`
```json
{
  "id": "clx...",
  "name": "New Video",
  ...
}
```

```typescript
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const body: CreateProjectInput = await request.json();
  
  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    );
  }
  
  const project = await createProject(body);
  return NextResponse.json(project, { status: 201 });
}
```

---

### Get Single Project

```http
GET /api/projects/:id
```

**Response:**
```json
{
  "id": "clx...",
  "name": "My Video",
  "events": [...]
}
```

```typescript
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = await params;
  const project = await getProjectById(id);
  
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  
  return NextResponse.json(project);
}
```

---

### Update Project

```http
PATCH /api/projects/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "duration": 15,
  "timeline": [...]
}
```

```typescript
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = await params;
  const body: UpdateProjectInput = await request.json();
  const project = await updateProject(id, body);
  
  return NextResponse.json(project);
}
```

---

### Delete Project

```http
DELETE /api/projects/:id
```

**Response:**
```json
{ "success": true }
```

```typescript
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = await params;
  await deleteProject(id);
  return NextResponse.json({ success: true });
}
```

---

### Duplicate Project

```http
POST /api/projects/:id/duplicate
```

**Response:** `201 Created`
```json
{
  "id": "new-clx...",
  "name": "My Video (Copy)",
  ...
}
```

```typescript
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = await params;
  const project = await duplicateProject(id);
  return NextResponse.json(project, { status: 201 });
}
```

---

## 🤖 AI Generation API

```http
POST /api/generate
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "A 10 second intro with 'Welcome to My Channel'",
  "duration": 10,
  "saveProject": true
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "clx...",
    "name": "Welcome Intro",
    "events": [...]
  }
}
```

**Source:** [`src/app/api/generate/route.ts`](file:///c:/Users/kiran/code/p/videographic/videographic%20nextjs/src/app/api/generate/route.ts)

```typescript
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: GenerateRequest = await request.json();

  if (!body.prompt?.trim()) {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 }
    );
  }

  const result = await generateWithOpenRouter(
    body.prompt,
    apiKey,
    OPENROUTER_MODELS["minimax-m2.1"],
    body.duration || 5
  );

  if (!result.success || !result.project) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    );
  }

  // Optionally save to database
  if (body.saveProject) {
    const savedProject = await createProject({
      name: result.project.name,
      // ...
    });
    return NextResponse.json({ ...result, project: savedProject });
  }

  return NextResponse.json(result);
}
```

---

## 🔑 NextAuth Routes

```http
GET/POST /api/auth/[...nextauth]
```

Handled automatically by NextAuth.js:

- `/api/auth/signin` - Sign in page
- `/api/auth/signout` - Sign out
- `/api/auth/callback/google` - OAuth callback
- `/api/auth/session` - Get session

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

---

## ⚠️ Error Responses

All routes return consistent error format:

```json
{
  "error": "Error message here"
}
```

Status codes:
- `400` - Bad request (missing/invalid params)
- `401` - Unauthorized (not logged in)
- `404` - Not found
- `500` - Server error

---

## 🔧 Build Steps

API route files to create:

| Step | File | Action |
|------|------|--------|
| 1 | `src/app/api/auth/[...nextauth]/route.ts` | NextAuth handlers (created in auth doc) |
| 2 | `src/app/api/projects/route.ts` | List/create projects |
| 3 | `src/app/api/projects/[id]/route.ts` | Get/update/delete project |
| 4 | `src/app/api/projects/[id]/duplicate/route.ts` | Duplicate project |
| 5 | `src/app/api/generate/route.ts` | AI generation endpoint |

### Create Routes

For each route, implement the HTTP methods documented in this file with proper authentication checks.

---

## 📚 Conclusion

You've completed the Videographic documentation! 🎉

### Learning Path Summary

1. **[00-overview.md](./00-overview.md)** - Project introduction
2. **[01-project-setup.md](./01-project-setup.md)** - Initial project setup
3. **[02-data-schemas.md](./02-data-schemas.md)** - Zod schemas
4. **[03-database.md](./03-database.md)** - Database & Prisma
5. **[04-auth.md](./04-auth.md)** - Authentication
6. **[05-state-management.md](./05-state-management.md)** - Zustand store
7. **[06-fabric-canvas.md](./06-fabric-canvas.md)** - Canvas rendering
8. **[07-animation-engine.md](./07-animation-engine.md)** - Animations
9. **[08-timeline-component.md](./08-timeline-component.md)** - Timeline UI
10. **[09-editor-architecture.md](./09-editor-architecture.md)** - Editor layout
11. **[10-render-export.md](./10-render-export.md)** - Video export
12. **[11-ai-generation.md](./11-ai-generation.md)** - AI generation
13. **[12-api-routes.md](./12-api-routes.md)** - API reference (this file)

---

*This documentation should give you a complete understanding of how Videographic works and enable you to rebuild the app from scratch. Happy coding!*
