import { z } from "zod";

// Animation Types
export const AnimationSchema = z.object({
  property: z.enum(["opacity", "scale", "x", "y", "rotation", "fill", "strokeWidth"]),
  from: z.number().or(z.string()), // Allow colors for fill
  to: z.number().or(z.string()),
  easing: z.enum(["linear", "easeIn", "easeOut", "easeInOut", "bounce"]).optional(),
  duration: z.number().optional(), // Override event duration
  delay: z.number().optional(),
  startTime: z.number().optional(), // For DB compatibility
});

// Text properties
export const TextPropertiesSchema = z.object({
  text: z.string(),
  fontSize: z.number().min(1),
  fontFamily: z.string().default("Inter"),
  fontWeight: z.union([z.string(), z.number()]).default("normal"),
  fontStyle: z.enum(["normal", "italic"]).default("normal"),
  fill: z.string().default("#ffffff"),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  textAlign: z.enum(["left", "center", "right"]).default("center"),
  opacity: z.number().min(0).max(1).default(1),
  x: z.number(),
  y: z.number(),
  rotation: z.number().default(0),
});

// Shape properties
export const ShapePropertiesSchema = z.object({
  shapeType: z.enum(["rect", "circle", "ellipse", "triangle", "polygon"]),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  radius: z.number().optional(),
  fill: z.string().default("#ffffff"),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  opacity: z.number().min(0).max(1).default(1),
  rotation: z.number().default(0),
  cornerRadius: z.number().optional(),
  gradient: z.object({
    type: z.enum(["linear", "radial"]),
    colors: z.array(z.string()),
    angle: z.number().optional(),
  }).optional(),
});

// Image properties
export const ImagePropertiesSchema = z.object({
  src: z.string().url(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  opacity: z.number().min(0).max(1).default(1),
  rotation: z.number().default(0),
  fit: z.enum(["cover", "contain", "fill"]).default("cover"),
});

// Audio properties
export const AudioPropertiesSchema = z.object({
  src: z.string().url().optional(), // URL to audio file
  prompt: z.string().optional(), // For TTS generation
  volume: z.number().min(0).max(1).default(1),
  isVoiceover: z.boolean().default(false),
  isMuted: z.boolean().default(false),
  fadeIn: z.number().optional(), // Fade in duration in seconds
  fadeOut: z.number().optional(), // Fade out duration in seconds
});

// Background properties
export const BackgroundPropertiesSchema = z.object({
  type: z.enum(["solid", "gradient", "image"]),
  color: z.string().optional(),
  gradient: z.object({
    type: z.enum(["linear", "radial"]),
    colors: z.array(z.string()),
    angle: z.number().optional(),
  }).optional(),
  image: z.string().url().optional(),
});

// Transition schema for scene transitions
export const TransitionSchema = z.object({
  type: z.enum(["none", "fade", "slideLeft", "slideRight", "slideUp", "slideDown", "scale", "blur"]),
  duration: z.number().min(0).default(0.5),
  easing: z.enum(["linear", "easeIn", "easeOut", "easeInOut"]).default("easeInOut"),
});

// Timeline event
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
      // Connector properties
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

// Types - Output (Full objects with defaults applied)
export type Animation = z.infer<typeof AnimationSchema>;
export type TextProperties = z.infer<typeof TextPropertiesSchema>;
export type ShapeProperties = z.infer<typeof ShapePropertiesSchema>;
export type ImageProperties = z.infer<typeof ImagePropertiesSchema>;
export type AudioProperties = z.infer<typeof AudioPropertiesSchema>;
export type BackgroundProperties = z.infer<typeof BackgroundPropertiesSchema>;
export type Transition = z.infer<typeof TransitionSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type VideoProject = z.infer<typeof VideoProjectSchema>;

// Types - Input (Optional fields allowed)
export type VideoProjectInput = z.input<typeof VideoProjectSchema>;
export type TimelineEventInput = z.input<typeof TimelineEventSchema>;
