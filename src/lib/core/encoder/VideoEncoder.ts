/**
 * VideoEncoder - WebCodecs API wrapper for H.264 encoding
 */

import type { EncoderConfig } from "./types";

export interface EncodedChunk {
  data: Uint8Array;
  timestamp: number;
  duration: number;
  isKeyFrame: boolean;
  description?: Uint8Array;
}

export class VideoEncoderWrapper {
  private encoder: VideoEncoder | null = null;
  private chunks: EncodedChunk[] = [];
  private config: EncoderConfig;
  private frameCount: number = 0;
  private isInitialized: boolean = false;
  private onChunkCallback?: (chunk: EncodedChunk) => void;
  private codecDescription?: Uint8Array;
  private actualCodec: string = "";

  // H.264 codec variants - prioritized for best MP4 compatibility
  // Chrome/Edge have excellent H.264 hardware encoding support
  private static readonly FALLBACK_CODECS = [
    "avc1.640028", // H.264 High Level 4.0 (best quality)
    "avc1.64001f", // H.264 High Level 3.1
    "avc1.4d401f", // H.264 Main Extended
    "avc1.4d001f", // H.264 Main Level 3.1
    "avc1.42001f", // H.264 Baseline Level 3.1
    "avc1.42E01E", // H.264 Baseline Level 3.0
  ];

  constructor(config: EncoderConfig) {
    this.config = config;
  }

  static isSupported(): boolean {
    return typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined";
  }

  private async findSupportedCodec(): Promise<{
    codec: string;
    config: VideoEncoderConfig;
  } | null> {
    const codecs = this.config.codec
      ? [
          this.config.codec,
          ...VideoEncoderWrapper.FALLBACK_CODECS.filter((c) => c !== this.config.codec),
        ]
      : VideoEncoderWrapper.FALLBACK_CODECS;

    // Try hardware acceleration first, then software
    const accelerationModes: HardwareAcceleration[] = ["prefer-hardware", "prefer-software", "no-preference"];

    for (const acceleration of accelerationModes) {
      for (const codec of codecs) {
        const isAvc = codec.startsWith("avc");
        const isVp9 = codec.startsWith("vp09") || codec === "vp9";
        
        const codecConfig: VideoEncoderConfig = {
          codec,
          width: this.config.width,
          height: this.config.height,
          bitrate: this.config.bitrate,
          framerate: this.config.fps,
          hardwareAcceleration: acceleration,
          // AVC-specific config
          ...(isAvc ? { avc: { format: "avc" } } : {}),
          // VP9 may need alpha mode for some browsers
          ...(isVp9 ? { alpha: "discard" as const } : {}),
        };

        try {
          const support = await VideoEncoder.isConfigSupported(codecConfig);
          if (support.supported) {
            console.log(`Found supported codec: ${codec} (acceleration: ${acceleration})`);
            return { codec, config: support.config || codecConfig };
          }
        } catch (err) {
          // Silently continue to next codec
          console.debug(`Codec ${codec} check failed:`, err);
        }
      }
    }

    // Log all attempted codecs for debugging
    console.error("No supported codec found. Attempted codecs:", codecs);
    return null;
  }

  getActualCodec(): string {
    return this.actualCodec;
  }

  async initialize(onChunk?: (chunk: EncodedChunk) => void): Promise<void> {
    if (!VideoEncoderWrapper.isSupported()) {
      throw new Error("WebCodecs API is not supported in this browser");
    }

    this.onChunkCallback = onChunk;

    const supported = await this.findSupportedCodec();
    if (!supported) {
      throw new Error(
        "No supported video codec found. Please use Chrome 94+, Edge 94+, or Firefox 130+."
      );
    }

    this.actualCodec = supported.codec;
    console.log(`Using codec: ${this.actualCodec}`);

    this.encoder = new VideoEncoder({
      output: (chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata) => {
        this.handleEncodedChunk(chunk, metadata);
      },
      error: (error: DOMException) => {
        console.error("VideoEncoder error:", error);
        throw error;
      },
    });

    this.encoder.configure(supported.config);
    this.isInitialized = true;
    this.frameCount = 0;
    this.chunks = [];
  }

  private handleEncodedChunk(
    chunk: EncodedVideoChunk,
    metadata?: EncodedVideoChunkMetadata
  ): void {
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);

    let description: Uint8Array | undefined;
    if (chunk.type === "key" && metadata?.decoderConfig?.description) {
      const descBuffer = metadata.decoderConfig.description as ArrayBuffer;
      description = new Uint8Array(descBuffer);
      if (!this.codecDescription) {
        this.codecDescription = description;
      }
    }

    const encodedChunk: EncodedChunk = {
      data,
      timestamp: chunk.timestamp,
      duration: chunk.duration ?? 1_000_000 / this.config.fps,
      isKeyFrame: chunk.type === "key",
      description,
    };

    this.chunks.push(encodedChunk);

    if (this.onChunkCallback) {
      this.onChunkCallback(encodedChunk);
    }
  }

  async encodeFrame(
    canvas: OffscreenCanvas | HTMLCanvasElement,
    frameNumber: number,
    forceKeyFrame: boolean = false
  ): Promise<void> {
    if (!this.encoder || !this.isInitialized) {
      throw new Error("Encoder not initialized");
    }

    const timestamp = Math.floor((frameNumber / this.config.fps) * 1_000_000);
    const duration = Math.floor(1_000_000 / this.config.fps);

    const frame = new VideoFrame(canvas, {
      timestamp,
      duration,
    });

    const isKeyFrame = forceKeyFrame || frameNumber % (this.config.fps * 2) === 0;

    this.encoder.encode(frame, { keyFrame: isKeyFrame });
    frame.close();

    this.frameCount++;
  }

  async finalize(): Promise<EncodedChunk[]> {
    if (!this.encoder) {
      throw new Error("Encoder not initialized");
    }

    await this.encoder.flush();
    return this.chunks;
  }

  getChunks(): EncodedChunk[] {
    return this.chunks;
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  close(): void {
    if (this.encoder && this.encoder.state !== "closed") {
      this.encoder.close();
    }
    this.encoder = null;
    this.isInitialized = false;
    this.chunks = [];
    this.frameCount = 0;
  }

  getState(): "unconfigured" | "configured" | "closed" | null {
    return this.encoder?.state ?? null;
  }
}

export const DEFAULT_ENCODER_CONFIG: EncoderConfig = {
  width: 1920,
  height: 1080,
  fps: 30,
  bitrate: 8_000_000,
  codec: "avc1.42001f",
};
