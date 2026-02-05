import { VideoProjectInput } from "@/lib/schemas/timeline";

export interface SampleProject {
  id: string;
  name: string;
  description: string;
  category: "intro" | "promo" | "social" | "minimal" | "animated";
  thumbnail?: string;
  project: VideoProjectInput;
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "hello-world",
    name: "Hello World",
    description: "Simple text animation intro",
    category: "minimal",
    project: {
      id: "hello-world",
      name: "Hello World",
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 3,
      backgroundColor: "#0f0f23",
      events: [
        {
          id: "bg-gradient",
          type: "shape",
          startTime: 0,
          duration: 3,
          layer: 0,
          properties: {
            shapeType: "rect",
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            fill: "#0f0f23",
            gradient: {
              type: "radial",
              colors: ["#1a1a2e", "#0f0f23"],
            },
          },
        },
        {
          id: "main-text",
          type: "text",
          startTime: 0.5,
          duration: 2.5,
          layer: 1,
          properties: {
            text: "Hello World",
            fontSize: 120,
            fontFamily: "Inter",
            fontWeight: "bold",
            fill: "#ffffff",
            x: 960,
            y: 540,
            textAlign: "center",
          },
          animations: [
            { property: "opacity", from: 0, to: 1, easing: "easeOut" },
            { property: "scale", from: 0.8, to: 1, easing: "easeOut" },
          ],
        },
      ],
    },
  },
  {
    id: "gradient-intro",
    name: "Gradient Intro",
    description: "Animated gradient background with title",
    category: "intro",
    project: {
      id: "gradient-intro",
      name: "Gradient Intro",
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5,
      backgroundColor: "#000000",
      events: [
        {
          id: "bg",
          type: "shape",
          startTime: 0,
          duration: 5,
          layer: 0,
          properties: {
            shapeType: "rect",
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            fill: "#1e1e3f",
            gradient: {
              type: "linear",
              colors: ["#667eea", "#764ba2"],
              angle: 135,
            },
          },
        },
        {
          id: "circle-1",
          type: "shape",
          startTime: 0,
          duration: 5,
          layer: 1,
          properties: {
            shapeType: "circle",
            x: 300,
            y: 300,
            radius: 200,
            fill: "#ffffff",
            opacity: 0.1,
          },
          animations: [
            { property: "scale", from: 0, to: 1.5, easing: "easeOut" },
            { property: "opacity", from: 0.3, to: 0, easing: "linear" },
          ],
        },
        {
          id: "title",
          type: "text",
          startTime: 0.5,
          duration: 4,
          layer: 2,
          properties: {
            text: "Your Brand",
            fontSize: 100,
            fontFamily: "Inter",
            fontWeight: "bold",
            fill: "#ffffff",
            x: 960,
            y: 480,
            textAlign: "center",
          },
          animations: [
            { property: "y", from: 520, to: 480, easing: "easeOut" },
            { property: "opacity", from: 0, to: 1, easing: "easeOut" },
          ],
        },
        {
          id: "subtitle",
          type: "text",
          startTime: 1,
          duration: 3.5,
          layer: 2,
          properties: {
            text: "Tagline goes here",
            fontSize: 36,
            fontFamily: "Inter",
            fontWeight: "normal",
            fill: "#ffffff",
            x: 960,
            y: 580,
            textAlign: "center",
          },
          animations: [
            { property: "opacity", from: 0, to: 0.8, easing: "easeOut" },
          ],
        },
      ],
    },
  },
  {
    id: "social-promo",
    name: "Social Media Promo",
    description: "Eye-catching social media video",
    category: "social",
    project: {
      id: "social-promo",
      name: "Social Media Promo",
      width: 1080,
      height: 1080,
      fps: 30,
      duration: 6,
      backgroundColor: "#ff6b6b",
      events: [
        {
          id: "bg",
          type: "shape",
          startTime: 0,
          duration: 6,
          layer: 0,
          properties: {
            shapeType: "rect",
            x: 0,
            y: 0,
            width: 1080,
            height: 1080,
            fill: "#ff6b6b",
            gradient: {
              type: "linear",
              colors: ["#ff6b6b", "#feca57"],
              angle: 45,
            },
          },
        },
        {
          id: "headline",
          type: "text",
          startTime: 0.3,
          duration: 5.2,
          layer: 1,
          properties: {
            text: "BIG SALE",
            fontSize: 140,
            fontFamily: "Inter",
            fontWeight: "900",
            fill: "#ffffff",
            x: 540,
            y: 400,
            textAlign: "center",
          },
          animations: [
            { property: "scale", from: 0, to: 1, easing: "bounce" },
          ],
        },
        {
          id: "discount",
          type: "text",
          startTime: 0.8,
          duration: 4.7,
          layer: 1,
          properties: {
            text: "50% OFF",
            fontSize: 80,
            fontFamily: "Inter",
            fontWeight: "bold",
            fill: "#000000",
            x: 540,
            y: 540,
            textAlign: "center",
          },
          animations: [
            { property: "opacity", from: 0, to: 1, easing: "easeOut" },
            { property: "y", from: 580, to: 540, easing: "easeOut" },
          ],
        },
        {
          id: "cta",
          type: "text",
          startTime: 1.5,
          duration: 4,
          layer: 1,
          properties: {
            text: "Shop Now →",
            fontSize: 36,
            fontFamily: "Inter",
            fontWeight: "600",
            fill: "#ffffff",
            x: 540,
            y: 700,
            textAlign: "center",
          },
          animations: [
            { property: "opacity", from: 0, to: 1, easing: "easeInOut" },
          ],
        },
      ],
    },
  },
];

export function getSampleProject(id: string): SampleProject | undefined {
  return SAMPLE_PROJECTS.find((p) => p.id === id);
}

export function getSamplesByCategory(category: SampleProject["category"]): SampleProject[] {
  return SAMPLE_PROJECTS.filter((p) => p.category === category);
}
