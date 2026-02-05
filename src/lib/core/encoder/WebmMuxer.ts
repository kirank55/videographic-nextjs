/**
 * WebM Muxer - webm-muxer integration for VP8/VP9 codecs
 */

import { Muxer, ArrayBufferTarget } from "webm-muxer";
import type { EncoderConfig } from "./types";
import type { EncodedChunk } from "./VideoEncoder";

export interface WebmMuxerOptions {
  config: EncoderConfig;
  codec: string;
}

export class WebmVideoMuxer {
  private muxer: Muxer<ArrayBufferTarget> | null = null;
  private config: EncoderConfig;
  private isFinalized: boolean = false;
  private codec: string;

  constructor(options: WebmMuxerOptions) {
    this.config = options.config;
    this.codec = options.codec;
  }

  initialize(): void {
    console.log(`Initializing WebM muxer with codec: ${this.codec}`);
    
    // Determine the WebM codec type
    const isVp9 = this.codec.startsWith("vp09") || this.codec === "vp9";
    const codecType = isVp9 ? "V_VP9" : "V_VP8";

    this.muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: codecType,
        width: this.config.width,
        height: this.config.height,
        frameRate: this.config.fps,
      },
    });
    this.isFinalized = false;
  }

  addVideoChunk(chunk: EncodedChunk): void {
    if (!this.muxer) {
      throw new Error("WebM Muxer not initialized");
    }
    if (this.isFinalized) {
      throw new Error("WebM Muxer already finalized");
    }

    // webm-muxer uses addVideoChunk with an EncodedVideoChunk-like object
    // We create a fake chunk object that matches the expected interface
    const videoChunk = {
      type: chunk.isKeyFrame ? "key" as const : "delta" as const,
      timestamp: chunk.timestamp,
      duration: chunk.duration,
      byteLength: chunk.data.byteLength,
      copyTo: (destination: ArrayBufferLike) => {
        new Uint8Array(destination).set(chunk.data);
      },
    };

    // Create metadata with decoderConfig including colorSpace
    // This is required by webm-muxer for proper handling
    const isVp9 = this.codec.startsWith("vp09") || this.codec === "vp9";
    const meta = {
      decoderConfig: {
        codec: isVp9 ? "vp09.00.10.08" : "vp8",
        codedWidth: this.config.width,
        codedHeight: this.config.height,
        colorSpace: {
          primaries: "bt709",
          transfer: "bt709", 
          matrix: "bt709",
          fullRange: false,
        },
      },
    };

    this.muxer.addVideoChunk(
      videoChunk as unknown as EncodedVideoChunk,
      meta as unknown as EncodedVideoChunkMetadata
    );
  }

  addVideoChunks(chunks: EncodedChunk[]): void {
    for (const chunk of chunks) {
      this.addVideoChunk(chunk);
    }
  }

  finalize(): ArrayBuffer {
    if (!this.muxer) {
      throw new Error("WebM Muxer not initialized");
    }
    if (this.isFinalized) {
      throw new Error("WebM Muxer already finalized");
    }

    this.muxer.finalize();
    this.isFinalized = true;

    const target = this.muxer.target as ArrayBufferTarget;
    return target.buffer;
  }

  getBlob(): Blob {
    const buffer = this.finalize();
    return new Blob([buffer], { type: "video/webm" });
  }

  getDownloadUrl(): string {
    const blob = this.getBlob();
    return URL.createObjectURL(blob);
  }

  downloadAs(filename: string = "video.webm"): void {
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
  }

  isReady(): boolean {
    return this.muxer !== null && !this.isFinalized;
  }
}
