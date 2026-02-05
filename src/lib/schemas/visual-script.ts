/**
 * Intermediate schema for the two-phase generation pipeline
 * Phase 1 (Refiner) produces this structured visual script
 * Phase 2 (Converter) transforms it into VideoProject JSON
 */

export interface VisualScriptElement {
  type: "title" | "subtitle" | "accent-shape" | "glow" | "icon-placeholder" | "connector";
  description: string;
  position: "center" | "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  importance: "primary" | "secondary" | "decorative";
  animation?: string;  // e.g., "bounce-in", "typewriter", "slide-left"
}

export interface SceneEffects {
  visual?: string[];   // e.g., ["film-grain", "vignette"]
  motion?: string[];   // e.g., ["ken-burns-zoom", "parallax"]
  overlay?: string[];  // e.g., ["rain", "confetti", "light-leak"]
}

export interface VisualScriptScene {
  id: string;
  duration: number;
  purpose: "intro" | "content" | "transition" | "outro";
  mainText: string;           // Max 7 words
  subText?: string;           // Optional subtitle
  visualDescription: string;  // Concrete visual description
  backgroundColor: string;
  mood: string;               // e.g., "energetic", "calm", "professional"
  elements: VisualScriptElement[];
  effects?: SceneEffects;     // Optional effect hints for converter
  transitionIn?: "fade" | "slide" | "scale" | "none";
  transitionOut?: "fade" | "slide" | "scale" | "none";
}

export interface VisualScript {
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

export function validateVisualScript(data: unknown): VisualScript | null {
  try {
    if (!data || typeof data !== "object") return null;
    
    const script = data as Record<string, unknown>;
    
    // Required fields
    if (!script.title || !script.totalDuration || !Array.isArray(script.scenes)) {
      return null;
    }

    if (!script.colorPalette || typeof script.colorPalette !== "object") {
      return null;
    }

    const palette = script.colorPalette as Record<string, unknown>;
    if (!palette.background || !palette.primary || !palette.text) {
      return null;
    }

    return {
      title: String(script.title),
      totalDuration: Number(script.totalDuration),
      aspectRatio: (script.aspectRatio as "16:9" | "9:16" | "1:1") || "16:9",
      colorPalette: {
        background: String(palette.background),
        primary: String(palette.primary),
        secondary: String(palette.secondary || palette.primary),
        text: String(palette.text),
      },
      scenes: (script.scenes as unknown[]).map((scene) => {
        const s = scene as Record<string, unknown>;
        
        // Parse effects if present
        let effects: SceneEffects | undefined;
        if (s.effects && typeof s.effects === "object") {
          const e = s.effects as Record<string, unknown>;
          effects = {
            visual: Array.isArray(e.visual) ? e.visual.map(String) : undefined,
            motion: Array.isArray(e.motion) ? e.motion.map(String) : undefined,
            overlay: Array.isArray(e.overlay) ? e.overlay.map(String) : undefined,
          };
        }
        
        return {
          id: String(s.id || `scene-${Date.now()}`),
          duration: Number(s.duration || 3),
          purpose: (s.purpose as "intro" | "content" | "transition" | "outro") || "content",
          mainText: String(s.mainText || ""),
          subText: s.subText ? String(s.subText) : undefined,
          visualDescription: String(s.visualDescription || ""),
          backgroundColor: String(s.backgroundColor || "#000000"),
          mood: String(s.mood || "neutral"),
          elements: Array.isArray(s.elements) ? (s.elements as unknown[]).map((el) => {
            const e = el as Record<string, unknown>;
            return {
              type: (e.type as VisualScriptElement["type"]) || "title",
              description: String(e.description || ""),
              position: (e.position as VisualScriptElement["position"]) || "center",
              importance: (e.importance as VisualScriptElement["importance"]) || "secondary",
              animation: e.animation ? String(e.animation) : undefined,
            };
          }) : [],
          effects,
          transitionIn: s.transitionIn as "fade" | "slide" | "scale" | "none" | undefined,
          transitionOut: s.transitionOut as "fade" | "slide" | "scale" | "none" | undefined,
        };
      }),
      voiceover: script.voiceover ? {
        enabled: Boolean((script.voiceover as Record<string, unknown>).enabled),
        script: String((script.voiceover as Record<string, unknown>).script || ""),
      } : undefined,
    };
  } catch {
    return null;
  }
}
