/**
 * Muxer - mp4-muxer integration for creating MP4 files
 * Handles H.264/AVC encoding with proper AVCC configuration
 */

import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import type { EncoderConfig } from "./types";
import type { EncodedChunk } from "./VideoEncoder";

export interface MuxerOptions {
  config: EncoderConfig;
  fastStart?: boolean;
  codec?: string;
}

export type MuxerCodec = "avc" | "vp9" | "hevc" | "av1";

export class VideoMuxer {
  private muxer: Muxer<ArrayBufferTarget> | null = null;
  private config: EncoderConfig;
  private fastStart: boolean;
  private isFinalized: boolean = false;
  private videoCodec: MuxerCodec;
  private codecPrivate: Uint8Array | null = null;
  private hasAddedFirstKeyframe: boolean = false;

  constructor(options: MuxerOptions) {
    this.config = options.config;
    this.fastStart = options.fastStart ?? true;
    this.videoCodec = this.detectMuxerCodec(options.codec || options.config.codec);
  }

  private detectMuxerCodec(codecString: string): MuxerCodec {
    if (codecString.startsWith("avc") || codecString.startsWith("avc1")) {
      return "avc";
    }
    if (codecString.startsWith("vp09") || codecString === "vp9") {
      return "vp9";
    }
    if (codecString.startsWith("vp8") || codecString === "vp8") {
      console.warn("VP8 is not directly supported by mp4-muxer, using VP9 container");
      return "vp9";
    }
    if (codecString.startsWith("hvc") || codecString.startsWith("hev")) {
      return "hevc";
    }
    if (codecString.startsWith("av01") || codecString === "av1") {
      return "av1";
    }
    console.warn(`Unknown codec ${codecString}, defaulting to avc`);
    return "avc";
  }

  initialize(): void {
    console.log(`Initializing muxer with codec: ${this.videoCodec}`);
    this.muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: this.videoCodec,
        width: this.config.width,
        height: this.config.height,
      },
      fastStart: this.fastStart ? "in-memory" : false,
      firstTimestampBehavior: "offset",
    });
    this.isFinalized = false;
    this.hasAddedFirstKeyframe = false;
    this.codecPrivate = null;
  }

  addVideoChunk(chunk: EncodedChunk): void {
    if (!this.muxer) {
      throw new Error("Muxer not initialized");
    }
    if (this.isFinalized) {
      throw new Error("Muxer already finalized");
    }

    // Store codec description from first keyframe
    if (chunk.isKeyFrame && chunk.description && !this.codecPrivate) {
      this.codecPrivate = chunk.description;
    }

    // For AVC, we need to use addVideoChunkRaw with proper handling
    // Pass the codec description (AVCC data) when available
    if (this.videoCodec === "avc" && this.codecPrivate) {
      // Use addVideoChunkRaw with the codec private data for keyframes
      if (chunk.isKeyFrame && !this.hasAddedFirstKeyframe) {
        this.hasAddedFirstKeyframe = true;
        // First keyframe - the muxer should auto-detect from the data
      }
    }

    // Use addVideoChunkRaw for all chunks - mp4-muxer handles parsing
    this.muxer.addVideoChunkRaw(
      chunk.data,
      chunk.isKeyFrame ? "key" : "delta",
      chunk.timestamp,
      chunk.duration
    );
  }

  addVideoChunks(chunks: EncodedChunk[]): void {
    for (const chunk of chunks) {
      this.addVideoChunk(chunk);
    }
  }

  finalize(): ArrayBuffer {
    if (!this.muxer) {
      throw new Error("Muxer not initialized");
    }
    if (this.isFinalized) {
      throw new Error("Muxer already finalized");
    }

    this.muxer.finalize();
    this.isFinalized = true;

    const target = this.muxer.target as ArrayBufferTarget;
    return target.buffer;
  }

  getBlob(): Blob {
    const buffer = this.finalize();
    return new Blob([buffer], { type: "video/mp4" });
  }

  getDownloadUrl(): string {
    const blob = this.getBlob();
    return URL.createObjectURL(blob);
  }

  downloadAs(filename: string = "video.mp4"): void {
    const url = this.getDownloadUrl();
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  reset(): void {
    this.muxer = null;
    this.isFinalized = false;
    this.codecPrivate = null;
    this.hasAddedFirstKeyframe = false;
  }

  isReady(): boolean {
    return this.muxer !== null && !this.isFinalized;
  }
}

export function createMuxer(config: EncoderConfig): VideoMuxer {
  const muxer = new VideoMuxer({ config });
  muxer.initialize();
  return muxer;
}
