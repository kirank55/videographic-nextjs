# JSON Data Creation Guide for Video Projects

This document provides comprehensive information about the JSON data structures used in the videographic project. It serves as inspiration for building similar JSON data in React apps for video editing and creation applications.


## Core Data Structures

### 1. VideoProject

The main project structure containing all project settings and the timeline.

```typescript
interface VideoProject {
  id: string;
  name: string;
  description?: string;
  width: number; // Default: 1920
  height: number; // Default: 1080
  fps: number; // Default: 30
  duration: number; // Minimum: 0.1 seconds
  backgroundColor: string; // Default: #000000
  events: TimelineEvent[];
}
```

**Example:**
```json
{
  "id": "proj_123",
  "name": "My Awesome Video",
  "description": "A tutorial video about JSON data structures",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "duration": 10.5,
  "backgroundColor": "#000000",
  "events": []
}
```

### 2. TimelineEvent

Represents a single element on the timeline with various types (text, shape, image, audio, background, connector).

```typescript
interface TimelineEvent {
  id: string;
  type: "text" | "shape" | "image" | "background" | "audio" | "connector";
  startTime: number; // In seconds (minimum: 0)
  duration: number; // In seconds (minimum: 0.1)
  layer: number; // Default: 0 (higher = above)
  properties: TextProperties | ShapeProperties | ImageProperties | BackgroundProperties | AudioProperties | ConnectorProperties;
  animations?: Animation[];
  transition?: Transition;
}
```

**Example (Text Event):**
```json
{
  "id": "evt_456",
  "type": "text",
  "startTime": 0,
  "duration": 3,
  "layer": 0,
  "properties": {
    "text": "Welcome to JSON Guide",
    "fontSize": 48,
    "fontFamily": "Inter",
    "fontWeight": "bold",
    "fontStyle": "normal",
    "fill": "#ffffff",
    "stroke": "#000000",
    "strokeWidth": 2,
    "textAlign": "center",
    "opacity": 1,
    "x": 960,
    "y": 540,
    "rotation": 0
  },
  "animations": [
    {
      "property": "opacity",
      "from": 0,
      "to": 1,
      "easing": "easeInOut",
      "duration": 0.5
    }
  ]
}
```

### 3. Properties Types

#### TextProperties
```typescript
interface TextProperties {
  text: string;
  fontSize: number; // Minimum: 1
  fontFamily: string; // Default: "Inter"
  fontWeight: string | number; // Default: "normal"
  fontStyle: "normal" | "italic"; // Default: "normal"
  fill: string; // Default: "#ffffff"
  stroke?: string;
  strokeWidth?: number;
  textAlign: "left" | "center" | "right"; // Default: "center"
  opacity: number; // 0-1, default: 1
  x: number;
  y: number;
  rotation: number; // Default: 0
}
```

#### ShapeProperties
```typescript
interface ShapeProperties {
  shapeType: "rect" | "circle" | "ellipse" | "triangle" | "polygon";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string; // Default: "#ffffff"
  stroke?: string;
  strokeWidth?: number;
  opacity: number; // 0-1, default: 1
  rotation: number; // Default: 0
  cornerRadius?: number;
  gradient?: {
    type: "linear" | "radial";
    colors: string[];
    angle?: number;
  };
}
```

**Example (Circle with Gradient):**
```json
{
  "id": "evt_789",
  "type": "shape",
  "startTime": 2,
  "duration": 4,
  "layer": 1,
  "properties": {
    "shapeType": "circle",
    "x": 960,
    "y": 540,
    "radius": 100,
    "fill": "#ff0000",
    "opacity": 0.8,
    "gradient": {
      "type": "radial",
      "colors": ["#ff0000", "#00ff00"],
      "angle": 45
    }
  }
}
```

#### ImageProperties
```typescript
interface ImageProperties {
  src: string; // URL
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number; // 0-1, default: 1
  rotation: number; // Default: 0
  fit: "cover" | "contain" | "fill"; // Default: "cover"
}
```

#### AudioProperties
```typescript
interface AudioProperties {
  src?: string; // URL to audio file
  prompt?: string; // For TTS generation
  volume: number; // 0-1, default: 1
  isVoiceover: boolean; // Default: false
  isMuted: boolean; // Default: false
  fadeIn?: number; // Fade in duration in seconds
  fadeOut?: number; // Fade out duration in seconds
}
```

#### BackgroundProperties
```typescript
interface BackgroundProperties {
  type: "solid" | "gradient" | "image";
  color?: string;
  gradient?: {
    type: "linear" | "radial";
    colors: string[];
    angle?: number;
  };
  image?: string; // URL
}
```

#### ConnectorProperties
```typescript
interface ConnectorProperties {
  sourceId: string;
  targetId: string;
  type: "line" | "arrow"; // Default: "arrow"
  stroke: string; // Default: "#ffffff"
  strokeWidth: number; // Default: 2
  opacity: number; // 0-1, default: 1
}
```

### 4. Animation

Defines animations for timeline events.

```typescript
interface Animation {
  property: "opacity" | "scale" | "x" | "y" | "rotation" | "fill" | "strokeWidth";
  from: number | string; // Numbers for numeric properties, strings for colors
  to: number | string;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "bounce";
  duration?: number; // Override event duration
  delay?: number;
  startTime?: number; // For DB compatibility
}
```

### 5. Transition

Defines scene transitions.

```typescript
interface Transition {
  type: "none" | "fade" | "slideLeft" | "slideRight" | "slideUp" | "slideDown" | "scale" | "blur";
  duration: number; // Minimum: 0, default: 0.5
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut"; // Default: "easeInOut"
}
```

## Intermediate Visual Script Structure

The project also uses an intermediate schema for AI generation pipeline:

```typescript
interface VisualScript {
  title: string;
  totalDuration: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  colorPalette: {
    background: string;
    primary: string;
    secondary: string;
    text: string;
  };
  scenes: VisualScriptScene[];
  voiceover?: {
    enabled: boolean;
    script: string;
  };
}
```

## Data Validation

The project uses Zod schemas for data validation. Key schemas:

```typescript
import { z } from "zod";

// Animation schema
export const AnimationSchema = z.object({
  property: z.enum(["opacity", "scale", "x", "y", "rotation", "fill", "strokeWidth"]),
  from: z.number().or(z.string()),
  to: z.number().or(z.string()),
  easing: z.enum(["linear", "easeIn", "easeOut", "easeInOut", "bounce"]).optional(),
  duration: z.number().optional(),
  delay: z.number().optional(),
  startTime: z.number().optional(),
});

// Timeline event schema
export const TimelineEventSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "shape", "image", "background", "audio", "connector"]),
  startTime: z.number().min(0),
  duration: z.number().min(0.1),
  layer: z.number().default(0),
  properties: z.union([
    TextPropertiesSchema,
    ShapePropertiesSchema,
    ImagePropertiesSchema,
    BackgroundPropertiesSchema,
    AudioPropertiesSchema,
    z.object({
      sourceId: z.string(),
      targetId: z.string(),
      type: z.enum(["line", "arrow"]).default("arrow"),
      stroke: z.string().default("#ffffff"),
      strokeWidth: z.number().default(2),
      opacity: z.number().min(0).max(1).default(1),
    }),
  ]),
  animations: z.array(AnimationSchema).optional(),
  transition: TransitionSchema.optional(),
});

// Full project schema
export const VideoProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  width: z.number().default(1920),
  height: z.number().default(1080),
  fps: z.number().default(30),
  duration: z.number().min(0.1),
  backgroundColor: z.string().default("#000000"),
  events: z.array(TimelineEventSchema),
});
```

## Complete Example Project

Here's a complete video project with multiple events:

```json
{
  "id": "proj_complete",
  "name": "Product Demo Video",
  "description": "A demo video for our new product",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "duration": 15,
  "backgroundColor": "#001a33",
  "events": [
    {
      "id": "evt_background",
      "type": "background",
      "startTime": 0,
      "duration": 15,
      "layer": 0,
      "properties": {
        "type": "gradient",
        "gradient": {
          "type": "linear",
          "colors": ["#001a33", "#003366"],
          "angle": 45
        }
      }
    },
    {
      "id": "evt_title",
      "type": "text",
      "startTime": 0,
      "duration": 4,
      "layer": 1,
      "properties": {
        "text": "Introducing Our New Product",
        "fontSize": 64,
        "fontFamily": "Inter",
        "fontWeight": "bold",
        "fontStyle": "normal",
        "fill": "#ffffff",
        "stroke": "#00ccff",
        "strokeWidth": 3,
        "textAlign": "center",
        "opacity": 1,
        "x": 960,
        "y": 400,
        "rotation": 0
      },
      "animations": [
        {
          "property": "opacity",
          "from": 0,
          "to": 1,
          "easing": "easeInOut",
          "duration": 1
        },
        {
          "property": "y",
          "from": 350,
          "to": 400,
          "easing": "easeOut",
          "duration": 1
        }
      ]
    },
    {
      "id": "evt_icon",
      "type": "shape",
      "startTime": 3,
      "duration": 8,
      "layer": 2,
      "properties": {
        "shapeType": "circle",
        "x": 960,
        "y": 600,
        "radius": 150,
        "fill": "#00ccff",
        "opacity": 0.8,
        "gradient": {
          "type": "radial",
          "colors": ["#00ccff", "#0066cc"],
          "angle": 0
        }
      },
      "animations": [
        {
          "property": "opacity",
          "from": 0,
          "to": 0.8,
          "easing": "easeIn",
          "duration": 0.5,
          "delay": 0.5
        },
        {
          "property": "rotation",
          "from": 0,
          "to": 360,
          "easing": "linear",
          "duration": 8
        }
      ]
    },
    {
      "id": "evt_description",
      "type": "text",
      "startTime": 5,
      "duration": 6,
      "layer": 3,
      "properties": {
        "text": "Revolutionary Features",
        "fontSize": 36,
        "fontFamily": "Inter",
        "fontWeight": "normal",
        "fontStyle": "italic",
        "fill": "#ffffff",
        "stroke": "#00ff99",
        "strokeWidth": 1,
        "textAlign": "center",
        "opacity": 1,
        "x": 960,
        "y": 800,
        "rotation": 0
      },
      "animations": [
        {
          "property": "opacity",
          "from": 0,
          "to": 1,
          "easing": "easeIn",
          "duration": 0.5
        }
      ],
      "transition": {
        "type": "fade",
        "duration": 0.5,
        "easing": "easeInOut"
      }
    },
    {
      "id": "evt_audio",
      "type": "audio",
      "startTime": 0,
      "duration": 15,
      "layer": 4,
      "properties": {
        "src": "https://example.com/background-music.mp3",
        "volume": 0.3,
        "isVoiceover": false,
        "isMuted": false,
        "fadeIn": 1,
        "fadeOut": 1
      }
    }
  ]
}
```

## Database Operations

The project uses Prisma for database operations. Here are the main functions:

```typescript
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CreateProjectInput, UpdateProjectInput, VideoProject, TimelineEvent } from "@/lib/types/project";
import { ProjectStatus } from "@prisma/client";

// Create a new project
export async function createProject(data: CreateProjectInput): Promise<VideoProject | null> {
  const session = await auth();
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

// Update a project
export async function updateProject(id: string, data: UpdateProjectInput): Promise<VideoProject | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const project = await db.project.update({
      where: {
        id,
        userId: session.user.id,
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

// Get all projects for a user
export async function getUserProjects(): Promise<VideoProject[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const projects = await db.project.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return projects.map((p) => ({
    ...p,
    timeline: p.timeline as unknown as TimelineEvent[],
  }));
}
```

## Usage in React Apps

### Creating a New Project

```typescript
import { useState } from "react";
import { createProject } from "@/lib/data/projects";
import { VideoProject } from "@/lib/schemas/timeline";

// Create an empty project
const initialProject: VideoProject = {
  id: `proj_${Date.now()}`,
  name: "Untitled Project",
  description: "My new video project",
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 10,
  backgroundColor: "#000000",
  events: [],
};

// Example usage in a React component
const ProjectCreator = () => {
  const [project, setProject] = useState<VideoProject>(initialProject);

  const handleCreate = async () => {
    try {
      const createdProject = await createProject(project);
      if (createdProject) {
        console.log("Project created successfully:", createdProject);
      }
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  return (
    <div>
      {/* Project creation UI */}
      <button onClick={handleCreate}>Create Project</button>
    </div>
  );
};
```

### Updating a Project

```typescript
import { updateProject } from "@/lib/data/projects";

// Update project function
const handleUpdateProject = async (projectId: string, updatedData: Partial<VideoProject>) => {
  try {
    const result = await updateProject(projectId, updatedData);
    if (result) {
      console.log("Project updated successfully:", result);
    }
  } catch (error) {
    console.error("Error updating project:", error);
  }
};

// Example: Update project duration
handleUpdateProject("proj_123", { duration: 15 });
```

## Best Practices

1. **Validation First:** Always validate data against Zod schemas before saving to the database
2. **Type Safety:** Use TypeScript types to ensure consistency across the app
3. **Timeline Management:** Keep track of event order and layer positioning
4. **Animations:** Define clear animation sequences with appropriate durations and easings
5. **Error Handling:** Implement proper error handling for all database operations
6. **Performance:** Optimize large projects by paginating or lazy-loading timeline events

## Extensions and Customization

The JSON structure can be extended with additional features:
- **Video Effects:** Add blur, color correction, or other visual effects
- **Advanced Animations:** Implement keyframe animations with multiple points
- **3D Elements:** Add support for 3D shapes and objects
- **Interactive Elements:** Add clickable elements for interactive videos
- **Subtitles:** Implement timed subtitles or captions

## Conclusion

This JSON data structure provides a flexible and extensible framework for building video editing and creation applications. By following the guidelines and examples provided, you can create robust React apps that handle complex video projects with ease.
