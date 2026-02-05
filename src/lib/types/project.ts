import { Project, ProjectStatus } from "@prisma/client";

// Timeline event types (matching existing Vite app)
export interface TimelineEvent {
  id: string;
  type: "text" | "shape" | "image";
  startTime: number;
  duration: number;
  properties: TextProperties | ShapeProperties | ImageProperties;
  animations?: Animation[];
}

export interface TextProperties {
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  x: number;
  y: number;
  textAlign?: "left" | "center" | "right";
}

export interface ShapeProperties {
  shapeType: "rect" | "circle" | "ellipse";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface ImageProperties {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Animation {
  property: string;
  from: number;
  to: number;
  easing?: string;
  startTime?: number;
  duration?: number;
}

// Full project with typed timeline
export interface VideoProject extends Omit<Project, "timeline"> {
  timeline: TimelineEvent[];
}

// Create project input
export interface CreateProjectInput {
  name: string;
  description?: string;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  timeline?: TimelineEvent[];
}

// Update project input
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  timeline?: TimelineEvent[];
  thumbnail?: string;
  status?: ProjectStatus;
}
