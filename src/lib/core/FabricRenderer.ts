/**
 * FabricRenderer - Fabric.js-based renderer for video export
 * Renders timeline events to a canvas for encoding
 */

import * as fabric from "fabric";
import type {
  VideoProject,
  TextProperties,
  ShapeProperties,
} from "@/lib/schemas/timeline";
import type { FrameState, ComputedEventState } from "./timeline/TimelineController";

export class FabricRenderer {
  private canvas: fabric.StaticCanvas | null = null;
  private project: VideoProject;
  private isInitialized: boolean = false;

  constructor(project: VideoProject) {
    this.project = project;
  }

  async initialize(): Promise<void> {
    const canvasEl = document.createElement("canvas");
    canvasEl.width = this.project.width;
    canvasEl.height = this.project.height;

    this.canvas = new fabric.StaticCanvas(canvasEl, {
      width: this.project.width,
      height: this.project.height,
      backgroundColor: this.project.backgroundColor || "#000000",
    });

    this.isInitialized = true;
  }

  renderFrame(frameState: FrameState): void {
    if (!this.canvas) {
      throw new Error("Renderer not initialized");
    }

    this.canvas.clear();
    this.canvas.backgroundColor = this.project.backgroundColor || "#000000";

    for (const eventState of frameState.events) {
      this.renderEvent(eventState);
    }

    this.canvas.renderAll();
  }

  private renderEvent(eventState: ComputedEventState): void {
    const { event, properties } = eventState;

    switch (event.type) {
      case "text":
        this.renderText(properties as TextProperties);
        break;
      case "shape":
        this.renderShape(properties as ShapeProperties);
        break;
    }
  }

  private renderText(props: TextProperties): void {
    const text = new fabric.Textbox(props.text, {
      left: props.x,
      top: props.y,
      originX: "center",
      originY: "center",
      fontSize: props.fontSize || 24,
      fontFamily: props.fontFamily || "Arial",
      fill: props.fill || "#ffffff",
      fontWeight: (props.fontWeight as string) || "normal",
      textAlign: props.textAlign || "center",
      width: 600,
      opacity: props.opacity ?? 1,
      angle: props.rotation || 0,
    });

    this.canvas!.add(text);
  }

  private renderShape(props: ShapeProperties): void {
    const commonProps = {
      left: props.x,
      top: props.y,
      originX: "center" as const,
      originY: "center" as const,
      fill: props.fill || "#ffffff",
      opacity: props.opacity ?? 1,
      angle: props.rotation || 0,
      stroke: props.stroke,
      strokeWidth: props.strokeWidth || 0,
    };

    let shape: fabric.FabricObject | null = null;

    const shapeType = props.shapeType;
    const width = props.width || 100;
    const height = props.height || 100;

    switch (shapeType) {
      case "rect":
        shape = new fabric.Rect({
          ...commonProps,
          width,
          height,
          rx: props.cornerRadius || 0,
          ry: props.cornerRadius || 0,
        });
        break;

      case "circle":
        shape = new fabric.Circle({
          ...commonProps,
          radius: props.radius || Math.min(width, height) / 2,
        });
        break;

      case "ellipse":
        shape = new fabric.Ellipse({
          ...commonProps,
          rx: width / 2,
          ry: height / 2,
        });
        break;
    }

    if (shape) {
      this.canvas!.add(shape);
    }
  }

  getCanvas(): HTMLCanvasElement | null {
    if (!this.canvas) return null;
    return this.canvas.getElement() as HTMLCanvasElement;
  }

  isReady(): boolean {
    return this.isInitialized && this.canvas !== null;
  }

  destroy(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
    this.isInitialized = false;
  }
}
