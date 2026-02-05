/**
 * VideoExporter - High-quality video export using canvas stream recording
 * Uses MediaRecorder with VP9 for best quality and compatibility
 */

import * as fabric from "fabric";
import type { VideoProject, TimelineEvent, Animation } from "@/lib/schemas/timeline";

type EasingType = "linear" | "easeIn" | "easeOut" | "easeInOut" | "bounce";

const easingFunctions: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  bounce: (t) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
};

function interpolateAnimation(
  animation: Animation,
  localTime: number,
  eventDuration: number
): number | string | null {
  const animDuration = animation.duration ?? eventDuration;
  const startTime = animation.delay ?? animation.startTime ?? 0;

  if (localTime < startTime) return animation.from;
  if (localTime >= startTime + animDuration) return animation.to;

  const progress = (localTime - startTime) / animDuration;
  const easingFn =
    easingFunctions[(animation.easing as EasingType) || "linear"] || easingFunctions.linear;
  const easedProgress = easingFn(progress);

  if (typeof animation.from === "number" && typeof animation.to === "number") {
    return animation.from + (animation.to - animation.from) * easedProgress;
  }
  return progress < 0.5 ? animation.from : animation.to;
}

function computeProperties(event: TimelineEvent, currentTime: number): Record<string, unknown> {
  const properties = { ...event.properties } as Record<string, unknown>;
  if (event.animations && event.animations.length > 0) {
    const localTime = currentTime - event.startTime;
    for (const animation of event.animations) {
      const value = interpolateAnimation(animation, localTime, event.duration);
      if (value !== null) {
        properties[animation.property] = value;
      }
    }
  }

  // Apply smooth exit effect (fade out during last 0.3 seconds)
  const exitDuration = 0.3;
  const localTime = currentTime - event.startTime;
  const timeUntilEnd = event.duration - localTime;
  
  if (timeUntilEnd <= exitDuration && timeUntilEnd > 0) {
    const exitProgress = 1 - (timeUntilEnd / exitDuration);
    const easedExitProgress = exitProgress * (2 - exitProgress);
    
    const currentOpacity = (properties.opacity as number) ?? 1;
    properties.opacity = currentOpacity * (1 - easedExitProgress);
    
    const currentScale = (properties.scale as number) ?? 1;
    properties.scale = currentScale * (1 - easedExitProgress * 0.1);
  }

  return properties;
}

export interface ExportProgress {
  phase: "preparing" | "rendering" | "encoding" | "muxing" | "complete" | "error";
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  message: string;
}

export interface ExportOptions {
  project: VideoProject;
  config?: {
    bitrate?: number;
  };
  filename?: string;
  onProgress?: (progress: ExportProgress) => void;
}

export class VideoExporter {
  static isSupported(): boolean {
    return typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement !== "undefined";
  }

  async export(options: ExportOptions): Promise<Blob> {
    const { project, onProgress = () => {}, config } = options;

    onProgress({
      phase: "preparing",
      currentFrame: 0,
      totalFrames: 0,
      percentage: 0,
      message: "Initializing...",
    });

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = project.width;
    canvas.height = project.height;

    const fabricCanvas = new fabric.StaticCanvas(canvas, {
      width: project.width,
      height: project.height,
      backgroundColor: project.backgroundColor || "#000000",
    });

    // Setup MediaRecorder with the best available codec
    const stream = canvas.captureStream(project.fps);
    
    // Try VP9 first (best quality), then H.264 (best compatibility), then VP8
    const mimeTypes = [
      "video/webm;codecs=vp9",
      "video/mp4;codecs=avc1.640028",  // H.264 High Profile
      "video/mp4;codecs=avc1.42E01E",  // H.264 Baseline
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];
    
    let selectedMimeType = "";
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    if (!selectedMimeType) {
      throw new Error("No supported video codec found for MediaRecorder");
    }

    console.log(`Using MediaRecorder with: ${selectedMimeType}`);

    const bitrate = config?.bitrate ?? 10_000_000; // Default 10 Mbps
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: bitrate,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    const totalFrames = Math.ceil(project.duration * project.fps);
    const frameDuration = 1000 / project.fps;

    // Start recording
    recorder.start();

    onProgress({
      phase: "encoding",
      currentFrame: 0,
      totalFrames,
      percentage: 0,
      message: "Recording frames...",
    });

    // Render each frame with proper timing
    for (let frame = 0; frame < totalFrames; frame++) {
      const currentTime = frame / project.fps;

      // Render frame
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = project.backgroundColor || "#000000";

      for (const event of project.events) {
        const isVisible =
          currentTime >= event.startTime &&
          currentTime <= event.startTime + event.duration;
        if (!isVisible) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const props = computeProperties(event, currentTime) as any;
        const scale = (props.scale as number) ?? 1;
        const commonProps = {
          left: props.x as number,
          top: props.y as number,
          originX: "center" as const,
          originY: "center" as const,
          opacity: (props.opacity as number) ?? 1,
          scaleX: scale,
          scaleY: scale,
          angle: (props.rotation as number) ?? 0,
        };

        if (event.type === "text") {
          const text = new fabric.Textbox(props.text || "", {
            ...commonProps,
            fontSize: props.fontSize || 24,
            fontFamily: props.fontFamily || "Arial",
            fill: props.fill || "#ffffff",
            textAlign: props.textAlign || "center",
            fontWeight: props.fontWeight || "normal",
            width: 600,
          });
          fabricCanvas.add(text);
        } else if (event.type === "shape") {
          const shapeType = props.shapeType;
          if (shapeType === "rect") {
            const rect = new fabric.Rect({
              ...commonProps,
              width: props.width || 100,
              height: props.height || 100,
              fill: props.fill || "#8b5cf6",
              rx: props.cornerRadius || 0,
              ry: props.cornerRadius || 0,
            });
            fabricCanvas.add(rect);
          } else if (shapeType === "circle") {
            const circle = new fabric.Circle({
              ...commonProps,
              radius: props.radius || 50,
              fill: props.fill || "#8b5cf6",
            });
            fabricCanvas.add(circle);
          } else if (shapeType === "ellipse") {
            const ellipse = new fabric.Ellipse({
              ...commonProps,
              rx: (props.width || 100) / 2,
              ry: (props.height || 100) / 2,
              fill: props.fill || "#8b5cf6",
            });
            fabricCanvas.add(ellipse);
          } else if (shapeType === "line") {
            // Simple line from (x1,y1) to (x2,y2)
            const x1 = (props.x1 as number) ?? 0;
            const y1 = (props.y1 as number) ?? 0;
            const x2 = (props.x2 as number) ?? 100;
            const y2 = (props.y2 as number) ?? 0;
            const line = new fabric.Line([x1, y1, x2, y2], {
              stroke: (props.stroke as string) || props.fill || "#ffffff",
              strokeWidth: (props.strokeWidth as number) || 4,
              opacity: (props.opacity as number) ?? 1,
              originX: "center",
              originY: "center",
            });
            fabricCanvas.add(line);
          } else if (shapeType === "arrow") {
            // Arrow: render as rounded rectangle bar
            const x1 = (props.x1 as number) ?? 0;
            const y1 = (props.y1 as number) ?? 0;
            const x2 = (props.x2 as number) ?? 100;
            const y2 = (props.y2 as number) ?? 0;
            const strokeColor = (props.stroke as string) || props.fill || "#ffffff";
            const strokeWidth = (props.strokeWidth as number) || 4;

            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const targetX = (props.x as number) ?? centerX;
            const targetY = (props.y as number) ?? centerY;
            const dx = targetX - centerX;
            const dy = targetY - centerY;
            const adjX1 = x1 + dx;
            const adjY1 = y1 + dy;
            const adjX2 = x2 + dx;
            const adjY2 = y2 + dy;

            const angle = Math.atan2(adjY2 - adjY1, adjX2 - adjX1) * (180 / Math.PI);
            const length = Math.hypot(adjX2 - adjX1, adjY2 - adjY1);
            const thickness = Math.max(strokeWidth * 2, 8);

            const bar = new fabric.Rect({
              left: (adjX1 + adjX2) / 2,
              top: (adjY1 + adjY2) / 2,
              width: length,
              height: thickness,
              fill: strokeColor,
              opacity: (props.opacity as number) ?? 1,
              angle,
              originX: "center",
              originY: "center",
              rx: thickness / 2,
              ry: thickness / 2,
            });
            fabricCanvas.add(bar);
          } else if (shapeType === "triangle") {
            // Triangle shape
            const width = (props.width as number) || 100;
            const height = (props.height as number) || 100;
            const triangle = new fabric.Triangle({
              ...commonProps,
              width: width,
              height: height,
              fill: props.fill || "#8b5cf6",
            });
            fabricCanvas.add(triangle);
          }
        }
      }

      fabricCanvas.renderAll();

      // Update progress
      const percentage = Math.round((frame / totalFrames) * 100);
      onProgress({
        phase: "encoding",
        currentFrame: frame + 1,
        totalFrames,
        percentage,
        message: `Encoding frame ${frame + 1}/${totalFrames}`,
      });

      // Wait for the frame duration to ensure proper video timing
      await new Promise((resolve) => setTimeout(resolve, frameDuration));
    }

    // Stop recording
    recorder.stop();

    // Wait for final data
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    onProgress({
      phase: "complete",
      currentFrame: totalFrames,
      totalFrames,
      percentage: 100,
      message: "Export complete!",
    });

    // Cleanup
    fabricCanvas.dispose();

    const mimeType = selectedMimeType.includes("mp4") ? "video/mp4" : "video/webm";
    return new Blob(chunks, { type: mimeType });
  }

  async exportAndDownload(options: ExportOptions): Promise<void> {
    const blob = await this.export(options);
    const extension = blob.type.includes("mp4") ? "mp4" : "webm";
    const baseName =
      options.filename?.replace(/\.(mp4|webm)$/i, "") ||
      options.project.name.replace(/\s+/g, "-").toLowerCase();
    const filename = `${baseName}.${extension}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
