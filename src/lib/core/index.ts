/**
 * Core module exports
 */

// Types
export type { EncoderConfig } from "./encoder/types";

// Timeline
export { TimelineController } from "./timeline/TimelineController";
export type { FrameState, ComputedEventState } from "./timeline/TimelineController";

// Encoder
export { VideoEncoderWrapper, DEFAULT_ENCODER_CONFIG } from "./encoder/VideoEncoder";
export type { EncodedChunk } from "./encoder/VideoEncoder";

// Muxer
export { VideoMuxer, createMuxer } from "./encoder/Muxer";
export { WebmVideoMuxer } from "./encoder/WebmMuxer";

// Renderer
export { FabricRenderer } from "./FabricRenderer";

// Exporter
export { VideoExporter } from "./VideoExporter";
export type { ExportOptions, ExportProgress } from "./VideoExporter";

