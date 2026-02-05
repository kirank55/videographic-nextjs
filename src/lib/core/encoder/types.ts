/**
 * Core types for video encoding
 */

export interface EncoderConfig {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
}

export interface ExportProgress {
  phase: "preparing" | "rendering" | "encoding" | "muxing" | "complete" | "error";
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  message?: string;
}
