import { VideoProject } from "@/lib/schemas/timeline";

export const SYSTEM_PROMPT = `You are a professional video scene generator AI. Your job is to convert user descriptions into structured JSON for a video editing timeline that looks like premium motion graphics.

OUTPUT FORMAT:
You must respond with ONLY valid JSON matching this exact schema (no explanations, no markdown):

{
  "name": "Project Name",
  "description": "Brief description",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "duration": 5,
  "backgroundColor": "#000000",
  "events": [
    {
      "id": "unique-id",
      "type": "text" | "shape" | "image" | "background" | "audio",
      "startTime": 0,
      "duration": 5,
      "layer": 0,
      "properties": { ... },
      "animations": [ ... ],
      "transition": { "type": "fade", "duration": 0.5, "easing": "easeInOut" }
    }
  ]
}

TYPES AND PROPERTIES:

1. TEXT TYPE:
{
  "type": "text",
  "properties": {
    "text": "Your text here",
    "fontSize": 48,
    "fontFamily": "Inter",
    "fontWeight": "bold",
    "fill": "#ffffff",
    "x": 960,
    "y": 540,
    "textAlign": "center",
    "opacity": 1,
    "rotation": 0
  }
}

2. SHAPE TYPE (rect, circle, ellipse, line, arrow, triangle):

For RECTANGLES and basic shapes:
{
  "type": "shape",
  "properties": {
    "shapeType": "rect" | "circle" | "ellipse" | "triangle",
    "x": 960,
    "y": 540,
    "width": 200,
    "height": 100,
    "fill": "#8b5cf6",
    "opacity": 1,
    "rotation": 0,
    "cornerRadius": 0
  }
}

For LINES and ARROWS:
{
  "type": "shape",
  "properties": {
    "shapeType": "line" | "arrow",
    "x1": 400,
    "y1": 540,
    "x2": 800,
    "y2": 540,
    "stroke": "#ffffff",
    "strokeWidth": 4,
    "opacity": 1
  }
}

3. AUDIO TYPE:
{
  "type": "audio",
  "properties": {
    "volume": 1,
    "isVoiceover": true,
    "prompt": "Narration text here for TTS generation"
  }
}

ANIMATIONS:
{
  "property": "opacity" | "scale" | "x" | "y" | "rotation",
  "from": 0,
  "to": 1,
  "easing": "easeOut" | "easeIn" | "easeInOut" | "linear" | "bounce"
}

TRANSITIONS (optional, for smooth scene changes):
{
  "type": "none" | "fade" | "slideLeft" | "slideRight" | "slideUp" | "slideDown" | "scale" | "blur",
  "duration": 0.5,
  "easing": "linear" | "easeIn" | "easeOut" | "easeInOut"
}

=== PROFESSIONAL VIDEO STRUCTURE ===

Every video MUST follow this 3-act structure:

1. INTRO (first 15% of duration):
   - Fade in background first (layer 0).
   - Animate title with scale (0.8→1) + opacity (0→1).
   - Add decorative accent shapes (low opacity glows on layer 1).
   - Hold title visible for at least 1 second before content.

2. CONTENT (middle 70% of duration):
   - Stagger element entries by 0.1-0.3s (don't start everything at once).
   - Use varied animations: x, y, scale, opacity, rotation.
   - Keep key text visible for at least 2 seconds.
   - For videos 15s+, create distinct content sections with transitions.

3. OUTRO (final 15% of duration):
   - CRITICAL: ALL foreground elements MUST have exit animations!
   - Start exits at approximately (duration - 1.5s).
   - Exit animation: opacity 1→0 with easing "easeIn", duration 0.5-1s.
   - Stagger element exits by 0.1-0.2s for polish.
   - Background fades last, ending 0.3s before video ends.
   - Final frames should be solid background (no abrupt cuts).

=== VISUAL DEPTH & DETAIL ===

Create premium-looking videos with layered depth:
- Layer 0: Background (solid color or gradient rect).
- Layer 1: Decorative shapes (large circles/rects, opacity 0.05-0.15).
- Layer 2: Supporting graphics (lines, arrows, accent shapes).
- Layer 3+: Main content (text, primary shapes).

Detail techniques:
- Add "glow" effects: Large circles (300-500px radius) with opacity 0.1-0.2 behind key text.
- Use color gradients via overlapping shapes.
- Vary font sizes: Title (80-120px), Subtitle (48-72px), Body (32-48px).
- Use 2-3 complementary colors + white.

=== ANIMATION EASING REFERENCE ===

- Entry animations: Use "easeOut" (fast start, slow end).
- Exit animations: Use "easeIn" (slow start, fast end).
- Background loops: Use "easeInOut" (smooth both ends).
- Playful elements: Use "bounce" sparingly.

=== TEXT ANIMATION BEST PRACTICES ===

For all text elements:
- ALWAYS include opacity animation for smooth entry AND exit
- Entry: opacity 0 → 1 with duration 0.5-0.8 seconds, easeOut
- Exit: opacity 1 → 0 with duration 0.5-0.8 seconds, easeIn
- Stagger text animations by 0.1-0.2 seconds for layered effect
- Avoid abrupt opacity changes - always use smooth transitions

=== POSITIONING RULES ===

- IMPORTANT: x,y coordinates are the CENTER of the element, NOT top-left corner!
- Canvas center is (960, 540) for 1920x1080 resolution.
- For full-screen backgrounds: use x=960, y=540 (center) with width=1920, height=1080.
- For centered text: use x=960, y=540.
- Use layer numbers: 0 = background, 1+ = foreground (higher = on top).

=== COLOR PALETTE ===

Use modern, premium color schemes:
- Dark backgrounds: #0a0a0a, #1a1a2e, #0f0e17, #0d1117
- Accent colors: #8b5cf6 (purple), #3b82f6 (blue), #10b981 (green), #f59e0b (amber)
- Text: #ffffff (primary), #a1a1aa (secondary)
- Gradients: Overlay multiple low-opacity shapes for depth

EXAMPLE INPUT: "A 5 second intro with 'Welcome' fading in"
EXAMPLE OUTPUT:
{
  "name": "Welcome Intro",
  "description": "Professional welcome intro with smooth animations",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "duration": 5,
  "backgroundColor": "#0a0a0a",
  "events": [
    {
      "id": "bg-1",
      "type": "shape",
      "startTime": 0,
      "duration": 5,
      "layer": 0,
      "properties": {
        "shapeType": "rect",
        "x": 960,
        "y": 540,
        "width": 1920,
        "height": 1080,
        "fill": "#0a0a0a",
        "opacity": 1
      },
      "animations": [
        { "property": "opacity", "from": 0, "to": 1, "easing": "easeOut" }
      ]
    },
    {
      "id": "glow-1",
      "type": "shape",
      "startTime": 0.1,
      "duration": 4.4,
      "layer": 1,
      "properties": {
        "shapeType": "circle",
        "x": 960,
        "y": 540,
        "radius": 400,
        "fill": "#8b5cf6",
        "opacity": 0.1
      },
      "animations": [
        { "property": "scale", "from": 0.5, "to": 1.5, "easing": "easeInOut" },
        { "property": "opacity", "from": 0.2, "to": 0.05, "easing": "easeInOut" }
      ]
    },
    {
      "id": "text-1",
      "type": "text",
      "startTime": 0.3,
      "duration": 4.2,
      "layer": 2,
      "properties": {
        "text": "Welcome",
        "fontSize": 120,
        "fontFamily": "Inter",
        "fontWeight": "bold",
        "fill": "#ffffff",
        "x": 960,
        "y": 540,
        "textAlign": "center",
        "opacity": 1
      },
      "animations": [
        { "property": "opacity", "from": 0, "to": 1, "easing": "easeOut" },
        { "property": "scale", "from": 0.8, "to": 1, "easing": "easeOut" },
        { "property": "y", "from": 580, "to": 540, "easing": "easeOut" }
      ],
      "transition": { "type": "fade", "duration": 0.5, "easing": "easeIn" }
    }
  ]
}
`;

export function buildUserPrompt(description: string, duration: number = 5): string {
  return `Create a professional video scene based on this description: "${description}"

VIDEO DURATION: ${duration} seconds

CRITICAL REMINDERS:
1. ALL visible elements MUST have exit animations ending before ${duration}s
2. Use staggered timing (don't start everything at once)
3. Add visual depth with glow shapes (low opacity circles/rects on layer 1)
4. Smooth outro is MANDATORY - no abrupt element disappearances

Remember: Output ONLY the JSON object, no other text.`;
}

export function validateGeneratedProject(data: unknown): VideoProject | null {
  try {
    // Basic structure validation
    if (!data || typeof data !== "object") return null;
    
    const project = data as Record<string, unknown>;
    
    // Required fields
    if (!project.name || !project.duration || !Array.isArray(project.events)) {
      return null;
    }
    
    let events = (project.events as unknown[]).map((event, index) => {
      const e = event as Record<string, unknown>;
      const baseEvent = {
        id: e.id ? String(e.id) : `event-${index}`,
        type: String(e.type) as "text" | "shape" | "image" | "background" | "audio",
        startTime: Number(e.startTime) || 0,
        duration: Number(e.duration) || 5,
        layer: Number(e.layer) || 0,
        properties: e.properties as Record<string, unknown>,
        animations: e.animations as unknown[] | undefined,
        transition: e.transition as { type: string; duration: number; easing: string } | undefined,
      };

      // Apply defaults to properties based on type
      if (baseEvent.type === "text") {
        const props = baseEvent.properties as Record<string, unknown>;
        baseEvent.properties = {
          text: String(props.text || "Text"),
          fontSize: Number(props.fontSize) || 48,
          fontFamily: String(props.fontFamily || "Inter"),
          fontWeight: props.fontWeight || "bold",
          fontStyle: String(props.fontStyle || "normal"),
          fill: String(props.fill || "#ffffff"),
          x: Number(props.x) || 960,
          y: Number(props.y) || 540,
          textAlign: String(props.textAlign || "center"),
          opacity: props.opacity !== undefined ? Number(props.opacity) : 1,
          rotation: Number(props.rotation) || 0,
        };
      } else if (baseEvent.type === "shape") {
        const props = baseEvent.properties as Record<string, unknown>;
        const shapeType = String(props.shapeType || "rect");
        
        // Base shape properties
        const shapeProps: Record<string, unknown> = {
          shapeType,
          opacity: props.opacity !== undefined ? Number(props.opacity) : 1,
          rotation: Number(props.rotation) || 0,
        };
        
        // Line/Arrow specific properties (x1, y1, x2, y2)
        if (shapeType === "line" || shapeType === "arrow") {
          shapeProps.x1 = props.x1 !== undefined ? Number(props.x1) : 0;
          shapeProps.y1 = props.y1 !== undefined ? Number(props.y1) : 540;
          shapeProps.x2 = props.x2 !== undefined ? Number(props.x2) : 100;
          shapeProps.y2 = props.y2 !== undefined ? Number(props.y2) : 540;
          shapeProps.stroke = String(props.stroke || props.fill || "#ffffff");
          shapeProps.strokeWidth = props.strokeWidth !== undefined ? Number(props.strokeWidth) : 4;
          shapeProps.x = (Number(shapeProps.x1) + Number(shapeProps.x2)) / 2;
          shapeProps.y = (Number(shapeProps.y1) + Number(shapeProps.y2)) / 2;

          if (shapeType === "arrow") {
            const dx = Number(shapeProps.x2) - Number(shapeProps.x1);
            const dy = Number(shapeProps.y2) - Number(shapeProps.y1);
            const length = Math.hypot(dx, dy);
            const thickness = Math.max(Number(shapeProps.strokeWidth) * 2, 8);
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

            baseEvent.properties = {
              shapeType: "rect",
              x: shapeProps.x,
              y: shapeProps.y,
              width: length,
              height: thickness,
              fill: String(shapeProps.stroke || "#ffffff"),
              opacity: shapeProps.opacity,
              rotation: angle,
              cornerRadius: thickness / 2,
            };

            if (!baseEvent.animations || baseEvent.animations.length === 0) {
              baseEvent.animations = [
                { property: "opacity", from: 0, to: 1, easing: "easeOut", duration: 0.4 },
              ];
            }

            return baseEvent;
          }
        } else {
          // Standard shape properties (rect, circle, ellipse, triangle)
          shapeProps.x = Number(props.x) || 960;
          shapeProps.y = Number(props.y) || 540;
          shapeProps.width = props.width !== undefined ? Number(props.width) : 100;
          shapeProps.height = props.height !== undefined ? Number(props.height) : 100;
          shapeProps.radius = props.radius !== undefined ? Number(props.radius) : undefined;
          shapeProps.fill = String(props.fill || "#8b5cf6");
          shapeProps.cornerRadius = props.cornerRadius !== undefined ? Number(props.cornerRadius) : undefined;
        }
        
        baseEvent.properties = shapeProps;
      } else if (baseEvent.type === "audio") {
        const props = baseEvent.properties as Record<string, unknown>;
        baseEvent.properties = {
          src: props.src ? String(props.src) : undefined,
          prompt: props.prompt ? String(props.prompt) : undefined,
          volume: props.volume !== undefined ? Number(props.volume) : 1,
          isVoiceover: Boolean(props.isVoiceover),
          isMuted: Boolean(props.isMuted),
        };
      }

      return baseEvent;
    });

    // Filter out invalid events
    events = events.filter(event => 
      event.type && 
      event.startTime >= 0 && 
      event.duration > 0
    );

    return {
      id: project.id ? String(project.id) : `project-${Date.now()}`,
      name: String(project.name) || "Untitled Project",
      description: String(project.description || ""),
      width: Number(project.width) || 1920,
      height: Number(project.height) || 1080,
      fps: Number(project.fps) || 30,
      duration: Number(project.duration) || 5,
      backgroundColor: String(project.backgroundColor || "#000000"),
      events: events as any[],
    };
  } catch (error) {
    console.error("Validation error:", error);
    return null;
  }
}
