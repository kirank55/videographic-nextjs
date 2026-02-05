/**
 * MediaRecorderExporter - Fallback exporter using MediaRecorder API
 * More compatible with Firefox and other browsers that have limited WebCodecs support
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
  const exitDuration = 0.3; // seconds
  const localTime = currentTime - event.startTime;
  const timeUntilEnd = event.duration - localTime;
  
  if (timeUntilEnd <= exitDuration && timeUntilEnd > 0) {
    // Calculate exit progress (0 = just started exit, 1 = fully exited)
    const exitProgress = 1 - (timeUntilEnd / exitDuration);
    // Apply easeOut for smooth exit
    const easedExitProgress = exitProgress * (2 - exitProgress);
    
    // Fade out opacity
    const currentOpacity = (properties.opacity as number) ?? 1;
    properties.opacity = currentOpacity * (1 - easedExitProgress);
    
    // Optional: slight scale down for more professional look
    const currentScale = (properties.scale as number) ?? 1;
    properties.scale = currentScale * (1 - easedExitProgress * 0.1); // Scale down by 10%
  }

  return properties;
}

export interface MediaRecorderExportOptions {
  project: VideoProject;
  onProgress?: (progress: { percentage: number; message: string }) => void;
}

export class MediaRecorderExporter {
  static isSupported(): boolean {
    return typeof MediaRecorder !== "undefined" && typeof HTMLCanvasElement !== "undefined";
  }

  async export(options: MediaRecorderExportOptions): Promise<Blob> {
    const { project, onProgress = () => {} } = options;

    onProgress({ percentage: 0, message: "Initializing..." });

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = project.width;
    canvas.height = project.height;

    const fabricCanvas = new fabric.StaticCanvas(canvas, {
      width: project.width,
      height: project.height,
      backgroundColor: project.backgroundColor || "#000000",
    });

    // Setup MediaRecorder with a fixed frame rate
    // We use requestVideoFrameCallback or manual timing to ensure proper duration
    const stream = canvas.captureStream(project.fps);
    
    // Try VP9 first, then VP8, then default
    const mimeTypes = [
      "video/webm;codecs=vp9",
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

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: 8_000_000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Render frames at correct timing
    const totalFrames = Math.ceil(project.duration * project.fps);
    const frameDuration = 1000 / project.fps; // milliseconds per frame

    // Start recording
    recorder.start();

    // Render each frame with proper timing to ensure correct video duration
    const renderFrame = (frame: number): Promise<void> => {
      return new Promise((resolve) => {
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
            }
          }
        }

        fabricCanvas.renderAll();

        // Update progress
        const percentage = Math.round((frame / totalFrames) * 100);
        onProgress({ percentage, message: `Recording frame ${frame + 1}/${totalFrames}` });

        // Wait for the frame duration to ensure proper video timing
        setTimeout(resolve, frameDuration);
      });
    };

    // Render all frames with proper timing
    for (let frame = 0; frame < totalFrames; frame++) {
      await renderFrame(frame);
    }

    // Stop recording
    recorder.stop();

    // Wait for final data
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    onProgress({ percentage: 100, message: "Export complete!" });

    // Cleanup
    fabricCanvas.dispose();

    const mimeType = selectedMimeType.includes("mp4") ? "video/mp4" : "video/webm";
    return new Blob(chunks, { type: mimeType });
  }

  async exportAndDownload(options: MediaRecorderExportOptions): Promise<void> {
    const blob = await this.export(options);
    const extension = blob.type.includes("mp4") ? "mp4" : "webm";
    const filename = `${options.project.name.replace(/\s+/g, "-").toLowerCase()}.${extension}`;

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
