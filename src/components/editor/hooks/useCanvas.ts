"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/stores/editor-store";
import type { TimelineEvent, Animation } from "@/lib/schemas/timeline";

type EasingType = "linear" | "easeIn" | "easeOut" | "easeInOut" | "bounce";

/**
 * Easing functions for animations
 */
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

/**
 * Interpolate an animation value at a specific local time
 */
function interpolateAnimation(
  animation: Animation,
  localTime: number,
  eventDuration: number
): number | string | null {
  const animDuration = animation.duration ?? eventDuration;
  const startTime = animation.delay ?? 0;

  if (localTime < startTime) {
    return animation.from;
  }

  if (localTime >= startTime + animDuration) {
    return animation.to;
  }

  const progress = (localTime - startTime) / animDuration;
  const easingFn =
    easingFunctions[animation.easing as EasingType] || easingFunctions.linear;
  const easedProgress = easingFn(progress);

  // Handle numeric interpolation
  if (typeof animation.from === "number" && typeof animation.to === "number") {
    return animation.from + (animation.to - animation.from) * easedProgress;
  }

  // For colors/strings, return based on progress
  return progress < 0.5 ? animation.from : animation.to;
}

/**
 * Compute animated properties for an event at a specific time
 */
function computeAnimatedProperties(
  event: TimelineEvent,
  currentTime: number
): Record<string, unknown> {
  const properties = { ...event.properties } as Record<string, unknown>;

  if (event.animations && event.animations.length > 0) {
    const eventLocalTime = currentTime - event.startTime;

    for (const animation of event.animations) {
      const animatedValue = interpolateAnimation(
        animation,
        eventLocalTime,
        event.duration
      );
      if (animatedValue !== null) {
        properties[animation.property] = animatedValue;
      }
    }
  }

  // Check if event has an AI-generated opacity animation
  const hasOpacityAnimation = event.animations?.some(anim => anim.property === "opacity");

  // Only apply smooth exit effect if no AI-generated opacity animation exists
  if (!hasOpacityAnimation) {
    const exitDuration = 0.8; // seconds - longer for smoother transition
    const localTime = currentTime - event.startTime;
    const timeUntilEnd = event.duration - localTime;
    
    if (timeUntilEnd <= exitDuration && timeUntilEnd > 0) {
      // Calculate exit progress (0 = just started exit, 1 = fully exited)
      const exitProgress = 1 - (timeUntilEnd / exitDuration);
      // Apply easeIn for smooth exit
      const easedExitProgress = exitProgress * exitProgress;
      
      // Fade out opacity
      const currentOpacity = (properties.opacity as number) ?? 1;
      properties.opacity = currentOpacity * (1 - easedExitProgress);
      
      // Slight scale down for more professional look
      const currentScale = (properties.scale as number) ?? 1;
      properties.scale = currentScale * (1 - easedExitProgress * 0.1);
    }
  }

  return properties;
}

type RectBounds = { left: number; top: number; width: number; height: number };
type TextLayoutItem = {
  id: string;
  obj: fabric.Textbox;
  layer: number;
  hasPositionAnimation: boolean;
};

function rectanglesOverlap(
  a: RectBounds,
  b: RectBounds,
  padding: number = 0
): boolean {
  return !(
    a.left + a.width + padding < b.left ||
    a.left > b.left + b.width + padding ||
    a.top + a.height + padding < b.top ||
    a.top > b.top + b.height + padding
  );
}

function resolveTextOverlaps(
  textObjects: TextLayoutItem[],
  canvas: fabric.Canvas
): void {
  if (textObjects.length < 2) return;

  const padding = 20;
  const canvasHeight = canvas.getHeight();

  const sorted = [...textObjects].sort((a, b) => b.layer - a.layer);

  const anchors: TextLayoutItem[] = [];

  for (const item of sorted) {
    const obj = item.obj;
    obj.setCoords();
    let rect = obj.getBoundingRect();

    let iterations = 0;
    let hasOverlap = true;

    while (hasOverlap && iterations < 10) {
      hasOverlap = false;

      for (const anchor of anchors) {
        anchor.obj.setCoords();
        const anchorRect = anchor.obj.getBoundingRect();

        if (rectanglesOverlap(rect, anchorRect, padding)) {
          const newTop = anchorRect.top + anchorRect.height + padding;
          const maxTop = Math.max(0, canvasHeight - rect.height - padding);
          const proposedTop = Math.min(newTop, maxTop);

          // If there's no space below, try above
          if (proposedTop === maxTop && anchorRect.top - rect.height - padding >= 0) {
            obj.set({ top: anchorRect.top - rect.height - padding });
          } else {
            obj.set({ top: proposedTop });
          }

          obj.setCoords();
          rect = obj.getBoundingRect();
          hasOverlap = true;
          break;
        }
      }

      iterations += 1;
    }

    anchors.push(item);
  }
}

export function useCanvas(containerRef?: React.RefObject<HTMLDivElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutCacheRef = useRef<Record<string, { x: number; y: number }>>({});
  const { project, currentTime, isPlaying, setCanvas, setSelectedId, updateEventProperty } =
    useEditorStore();

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create Fabric canvas
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 1920,
      height: 1080,
      backgroundColor: "#000000",
      selection: true,
      preserveObjectStacking: true,
    });

    // Handle selection
    fabricCanvas.on("selection:created", (e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selected = e.selected?.[0] as any;
      if (selected && selected.data?.id) {
        setSelectedId(selected.data.id);
      }
    });

    fabricCanvas.on("selection:updated", (e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selected = e.selected?.[0] as any;
      if (selected && selected.data?.id) {
        setSelectedId(selected.data.id);
      }
    });

    fabricCanvas.on("selection:cleared", () => {
      // Don't clear selection if we're in the middle of a canvas update
      // Check if there's actually no active object
      setTimeout(() => {
        const canvas = useEditorStore.getState().canvas;
        if (canvas && !canvas.getActiveObject()) {
          setSelectedId(null);
        }
      }, 0);
    });

    // Handle modifications (drag, resize, rotate)
    fabricCanvas.on("object:modified", (e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const target = e.target as any;
      if (!target || !target.data?.id) return;

      const id = target.data.id;
      const { project } = useEditorStore.getState();
      const event = project?.events.find(ev => ev.id === id);
      const shapeType = (event?.properties as Record<string, unknown> | undefined)?.shapeType as string | undefined;

      // Helper function to update property and freeze any related animations
      const updatePropAndAnimation = (property: string, value: number) => {
        updateEventProperty(id, property, value);
        
        // If this property has an animation, freeze it at the new value
        if (event?.animations) {
          const hasAnimation = event.animations.some(anim => anim.property === property);
          if (hasAnimation) {
            const updatedAnimations = event.animations.map(anim => {
              if (anim.property === property) {
                return { ...anim, from: value, to: value };
              }
              return anim;
            });
            useEditorStore.getState().updateEvent(id, { animations: updatedAnimations });
          }
        }
      };

      // Special handling for line/arrow shapes (use x1/y1/x2/y2)
      if (event?.type === "shape" && (shapeType === "line" || shapeType === "arrow")) {
        const data = target.data as { anchorX?: number; anchorY?: number; x1?: number; y1?: number; x2?: number; y2?: number } | undefined;
        const propsRecord = (event?.properties as Record<string, unknown>) ?? {};

        const baseX1 = data?.x1 ?? (Number(propsRecord.x1) || 0);
        const baseY1 = data?.y1 ?? (Number(propsRecord.y1) || 0);
        const baseX2 = data?.x2 ?? (Number(propsRecord.x2) || 100);
        const baseY2 = data?.y2 ?? (Number(propsRecord.y2) || 0);

        const baseCenterX = (baseX1 + baseX2) / 2;
        const baseCenterY = (baseY1 + baseY2) / 2;

        const newCenterX = (target.left as number) ?? baseCenterX;
        const newCenterY = (target.top as number) ?? baseCenterY;

        const dx = newCenterX - baseCenterX;
        const dy = newCenterY - baseCenterY;

        const x1 = baseX1 + dx;
        const y1 = baseY1 + dy;
        const x2 = baseX2 + dx;
        const y2 = baseY2 + dy;

        updatePropAndAnimation("x", newCenterX);
        updatePropAndAnimation("y", newCenterY);
        updatePropAndAnimation("x1", x1);
        updatePropAndAnimation("y1", y1);
        updatePropAndAnimation("x2", x2);
        updatePropAndAnimation("y2", y2);

        target.data = {
          ...data,
          anchorX: newCenterX,
          anchorY: newCenterY,
          x1,
          y1,
          x2,
          y2,
        };

        return;
      }

      // Update store with new position
      updatePropAndAnimation("x", target.left);
      updatePropAndAnimation("y", target.top);

      // Handle scaling/resizing for different object types
      if (target.type === "textbox") {
        // For text, update fontSize based on scale
        const scaledFontSize = Math.round(target.fontSize * target.scaleY);
        updatePropAndAnimation("fontSize", scaledFontSize);
        // Reset scale after applying to fontSize
        target.set({ scaleX: 1, scaleY: 1 });
        target.fontSize = scaledFontSize;
      } else if (target.type === "rect" || target.type === "ellipse") {
        // For rectangles and ellipses, update width and height based on scale
        const newWidth = Math.round(target.width * target.scaleX);
        const newHeight = Math.round(target.height * target.scaleY);
        updatePropAndAnimation("width", newWidth);
        updatePropAndAnimation("height", newHeight);
        // Reset scale after applying to dimensions
        target.set({ 
          width: newWidth, 
          height: newHeight, 
          scaleX: 1, 
          scaleY: 1,
        });
      } else if (target.type === "circle") {
        // For circles, update radius based on scale (use average of scaleX and scaleY for uniform scaling)
        const currentRadius = target.radius || 50;
        const newRadius = Math.round(currentRadius * Math.max(target.scaleX, target.scaleY));
        updatePropAndAnimation("radius", newRadius);
        // Also update width/height for consistency
        updatePropAndAnimation("width", newRadius * 2);
        updatePropAndAnimation("height", newRadius * 2);
        // Reset scale after applying to radius
        target.set({ 
          radius: newRadius, 
          scaleX: 1, 
          scaleY: 1,
        });
      } else if (target.type === "image") {
        // For images, store the scale factors
        updatePropAndAnimation("scaleX", target.scaleX);
        updatePropAndAnimation("scaleY", target.scaleY);
      }

      // Handle rotation
      if (target.angle !== undefined && target.angle !== 0) {
        updatePropAndAnimation("rotation", target.angle);
      }
    });

    setCanvas(fabricCanvas);

    // Fit canvas to container - calculate zoom to fit both width AND height
    const resizeObserver = new ResizeObserver(() => {
      // Use provided container ref, or fallback to parent element
      const container = containerRef?.current || canvasRef.current?.parentElement;
      if (container && fabricCanvas) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate the zoom ratio needed to fit within both width and height
        const widthRatio = containerWidth / 1920;
        const heightRatio = containerHeight / 1080;
        
        // Use the smaller ratio to ensure canvas fits completely
        const ratio = Math.min(widthRatio, heightRatio);
        
        // Ensure ratio is valid (positive number)
        if (ratio <= 0 || !isFinite(ratio)) return;
        
        // Calculate actual canvas dimensions at this zoom level
        const canvasWidth = Math.floor(1920 * ratio);
        const canvasHeight = Math.floor(1080 * ratio);
        
        fabricCanvas.setDimensions({
          width: canvasWidth,
          height: canvasHeight,
        });
        fabricCanvas.setZoom(ratio);
      }
    });

    // Observe the container for size changes
    const elementToObserve = containerRef?.current || canvasRef.current?.parentElement;
    if (elementToObserve) {
      resizeObserver.observe(elementToObserve);
    }

    return () => {
      fabricCanvas.dispose();
      resizeObserver.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Canvas content when project or time changes
  useEffect(() => {
    const canvas = useEditorStore.getState().canvas;
    if (!canvas || !project) return;

    // Store current selection before clearing
    const { selectedId, selectedIds } = useEditorStore.getState();

    // Disable selection events temporarily
    canvas.off('selection:cleared');
    canvas.off('selection:created');
    canvas.off('selection:updated');

    // Update background color
    canvas.backgroundColor = project.backgroundColor || "#000000";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let objectToSelect: any = null;
    const textObjects: TextLayoutItem[] = [];
    const existingObjects: { [key: string]: any } = {};

    // Collect existing objects by id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvas.getObjects().forEach((obj: any) => {
      if (obj !== canvas.backgroundImage && obj.data?.id) {
        existingObjects[obj.data.id] = obj;
      }
    });

    // Render objects visible at current time
    project.events.forEach((event: TimelineEvent) => {
      // Check if event should be visible - increased tolerance for smoother transitions
      const visibilityEpsilon = 0.5; // 500ms tolerance for playback timing
      const isVisible =
        currentTime >= event.startTime - visibilityEpsilon &&
        currentTime <= event.startTime + event.duration + visibilityEpsilon;
      if (!isVisible) return;

      // Calculate animated properties at current time
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props = computeAnimatedProperties(event, currentTime) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fabricObj: any = null;

      // Only apply scale to images - text and shapes should not have scale property
      // This prevents dimension multiplication when dragging imported elements
      const scale = event.type === "image" ? (props.scale as number) ?? 1 : 1;

      const commonProps = {
        left: props.x as number,
        top: props.y as number,
        originX: "center" as const,
        originY: "center" as const,
        opacity: (props.opacity as number) ?? 1,
        scaleX: scale,
        scaleY: scale,
        angle: (props.rotation as number) ?? 0,
        data: { id: event.id, layer: event.layer },
      };

      if (event.type === "text") {
        const hasPositionAnimation =
          event.animations?.some((anim) => anim.property === "x" || anim.property === "y") ?? false;
        // Always use the latest property values from the store
        const xPos = (props.x as number);
        const yPos = (props.y as number);
        
        // Reuse existing text object if possible
        if (existingObjects[event.id] && existingObjects[event.id].type === "textbox") {
          fabricObj = existingObjects[event.id];
          // Update existing object properties - ALWAYS update position from store
          fabricObj.set({
            text: props.text || "",
            fontSize: props.fontSize,
            fontFamily: props.fontFamily || "Inter",
            fill: props.fill || "#ffffff",
            textAlign: props.textAlign || "center",
            opacity: (props.opacity as number) ?? 1,
            scaleX: 1,
            scaleY: 1,
            angle: (props.rotation as number) ?? 0,
            left: xPos,
            top: yPos,
          });
          fabricObj.setCoords(); // Update coordinates after position change
          // Remove from existing objects to prevent deletion
          delete existingObjects[event.id];
        } else {
          // Create new text object
          fabricObj = new fabric.Textbox(props.text || "", {
            fontSize: props.fontSize,
            fontFamily: props.fontFamily || "Inter",
            fill: props.fill || "#ffffff",
            width: 600,
            textAlign: props.textAlign || "center",
            editable: false, // Disable editing by default
            lockMovementY: false, // Ensure Y movement is not locked
            lockScalingY: false, // Ensure Y scaling is not locked
            originX: "center" as const,
            originY: "center" as const,
            opacity: (props.opacity as number) ?? 1,
            scaleX: 1, // Always use scale 1 for text to prevent dimension issues
            scaleY: 1, // Always use scale 1 for text to prevent dimension issues
            angle: (props.rotation as number) ?? 0,
            left: xPos,
            top: yPos,
          });
          
          fabricObj.data = { id: event.id, layer: event.layer, anchorX: xPos, anchorY: yPos };
          
          // Enable editing only on double click
          fabricObj.on('mousedblclick', function() {
            // @ts-ignore
            this.editable = true;
            // @ts-ignore
            this.enterEditing();
            // @ts-ignore
            this.selectAll();
          });
          
          // Disable editing when exiting edit mode
          fabricObj.on('editing:exited', function() {
            // @ts-ignore
            this.editable = false;
          });
        }
        
        // Update cache with latest values
        layoutCacheRef.current[event.id] = { x: xPos, y: yPos };
      } else if (event.type === "shape") {
        const shapeType = props.shapeType;
        
        // Check if we can reuse an existing shape object
        const existingShape = existingObjects[event.id];
        const existingShapeType = existingShape?.data?.shapeType || existingShape?.type;
        
        // Determine the fabric type for this shape
        let expectedFabricType = shapeType;
        if (shapeType === "arrow") expectedFabricType = "rect";
        
        // Reuse existing object if same type, otherwise create new
        const canReuse = existingShape && (
          (shapeType === "rect" && existingShape.type === "rect") ||
          (shapeType === "circle" && existingShape.type === "circle") ||
          (shapeType === "ellipse" && existingShape.type === "ellipse") ||
          (shapeType === "line" && existingShape.type === "line") ||
          (shapeType === "arrow" && existingShape.type === "rect" && existingShape.data?.shapeType === "arrow") ||
          (shapeType === "triangle" && existingShape.type === "triangle")
        );
        
        if (canReuse) {
          fabricObj = existingShape;
          delete existingObjects[event.id]; // Don't remove this object later
          
          // Update the existing shape's properties based on type
          if (shapeType === "rect") {
            fabricObj.set({
              left: props.x as number,
              top: props.y as number,
              width: props.width || 100,
              height: props.height || 100,
              fill: props.fill || "#8b5cf6",
              opacity: (props.opacity as number) ?? 1,
              angle: (props.rotation as number) ?? 0,
              rx: props.cornerRadius || 0,
              ry: props.cornerRadius || 0,
            });
          } else if (shapeType === "circle") {
            fabricObj.set({
              left: props.x as number,
              top: props.y as number,
              radius: props.radius || 50,
              fill: props.fill || "#8b5cf6",
              opacity: (props.opacity as number) ?? 1,
              angle: (props.rotation as number) ?? 0,
            });
          } else if (shapeType === "ellipse") {
            fabricObj.set({
              left: props.x as number,
              top: props.y as number,
              rx: (props.width || 100) / 2,
              ry: (props.height || 50) / 2,
              fill: props.fill || "#8b5cf6",
              opacity: (props.opacity as number) ?? 1,
              angle: (props.rotation as number) ?? 0,
            });
          } else if (shapeType === "triangle") {
            fabricObj.set({
              left: props.x as number,
              top: props.y as number,
              width: props.width || 100,
              height: props.height || 100,
              fill: props.fill || "#8b5cf6",
              opacity: (props.opacity as number) ?? 1,
              angle: (props.rotation as number) ?? 0,
            });
          } else if (shapeType === "line") {
            const x1 = (props.x1 as number) ?? 0;
            const y1 = (props.y1 as number) ?? 0;
            const x2 = (props.x2 as number) ?? 100;
            const y2 = (props.y2 as number) ?? 0;
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const targetX = (props.x as number) ?? centerX;
            const targetY = (props.y as number) ?? centerY;
            const dx = targetX - centerX;
            const dy = targetY - centerY;
            fabricObj.set({
              x1: x1 + dx,
              y1: y1 + dy,
              x2: x2 + dx,
              y2: y2 + dy,
              stroke: (props.stroke as string) || props.fill || "#ffffff",
              strokeWidth: (props.strokeWidth as number) || 4,
              opacity: (props.opacity as number) ?? 1,
            });
          } else if (shapeType === "arrow") {
            const x1 = (props.x1 as number) ?? 0;
            const y1 = (props.y1 as number) ?? 0;
            const x2 = (props.x2 as number) ?? 100;
            const y2 = (props.y2 as number) ?? 0;
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
            const strokeWidth = (props.strokeWidth as number) || 4;
            const thickness = Math.max(strokeWidth * 2, 8);
            fabricObj.set({
              left: (adjX1 + adjX2) / 2,
              top: (adjY1 + adjY2) / 2,
              width: length,
              height: thickness,
              fill: (props.stroke as string) || props.fill || "#ffffff",
              opacity: (props.opacity as number) ?? 1,
              angle,
            });
          }
          
          fabricObj.setCoords();
        } else {
          // Create new shape object (original code)
          if (shapeType === "rect") {
            fabricObj = new fabric.Rect({
              ...commonProps,
              width: props.width || 100,
              height: props.height || 100,
              fill: props.fill || "#8b5cf6",
              rx: props.cornerRadius || 0,
              ry: props.cornerRadius || 0,
            });
          } else if (shapeType === "circle") {
            fabricObj = new fabric.Circle({
              ...commonProps,
              radius: props.radius || 50,
              fill: props.fill || "#8b5cf6",
            });
          } else if (shapeType === "ellipse") {
            fabricObj = new fabric.Ellipse({
              ...commonProps,
              rx: (props.width || 100) / 2,
              ry: (props.height || 50) / 2,
              fill: props.fill || "#8b5cf6",
            });
          } else if (shapeType === "line") {
          // Simple line from (x1,y1) to (x2,y2)
          const x1 = (props.x1 as number) ?? 0;
          const y1 = (props.y1 as number) ?? 0;
          const x2 = (props.x2 as number) ?? 100;
          const y2 = (props.y2 as number) ?? 0;
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
          fabricObj = new fabric.Line([adjX1, adjY1, adjX2, adjY2], {
            stroke: (props.stroke as string) || props.fill || "#ffffff",
            strokeWidth: (props.strokeWidth as number) || 4,
            opacity: (props.opacity as number) ?? 1,
            originX: "center",
            originY: "center",
          });
          fabricObj.data = {
            id: event.id,
            layer: event.layer,
            shapeType: "line",
            anchorX: targetX,
            anchorY: targetY,
            x1: adjX1,
            y1: adjY1,
            x2: adjX2,
            y2: adjY2,
          };
        } else if (shapeType === "arrow") {
          // Arrow: render as rounded rectangle bar
          const x1 = (props.x1 as number) ?? 0;
          const y1 = (props.y1 as number) ?? 0;
          const x2 = (props.x2 as number) ?? 100;
          const y2 = (props.y2 as number) ?? 0;
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
          const strokeColor = (props.stroke as string) || props.fill || "#ffffff";
          const strokeWidth = (props.strokeWidth as number) || 4;
          
          const angle = Math.atan2(adjY2 - adjY1, adjX2 - adjX1) * (180 / Math.PI);
          const length = Math.hypot(adjX2 - adjX1, adjY2 - adjY1);
          const thickness = Math.max(strokeWidth * 2, 8);

          fabricObj = new fabric.Rect({
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
          fabricObj.data = {
            id: event.id,
            layer: event.layer,
            shapeType: "arrow",
            anchorX: targetX,
            anchorY: targetY,
            x1: adjX1,
            y1: adjY1,
            x2: adjX2,
            y2: adjY2,
          };
        } else if (shapeType === "triangle") {
          // Triangle shape
          const width = (props.width as number) || 100;
          const height = (props.height as number) || 100;
          fabricObj = new fabric.Triangle({
            ...commonProps,
            width: width,
            height: height,
            fill: props.fill || "#8b5cf6",
          });
        }
        }
        if (fabricObj && !fabricObj.data) {
          fabricObj.data = { id: event.id, layer: event.layer, shapeType };
        } else if (fabricObj) {
          fabricObj.data = { ...fabricObj.data, id: event.id, layer: event.layer, shapeType };
        }
      }

      if (fabricObj) {
        // Only add to canvas if this is a newly created object (not reused)
        // For shapes: if canReuse was true, we updated an existing object
        // For text: if existingObjects[event.id] was found, we updated an existing object
        const isReusedObject = (event.type === "text" && existingObjects[event.id] === undefined && canvas.getObjects().includes(fabricObj)) ||
                              (event.type === "shape" && canvas.getObjects().includes(fabricObj));
        
        if (!isReusedObject) {
          canvas.add(fabricObj);
        }
        
        // For textboxes, force position update after adding to canvas
        // This ensures position is applied after height calculation
        if (event.type === "text") {
          const data = (fabricObj as { data?: { anchorX?: number; anchorY?: number } }).data;
          const anchorX = data?.anchorX ?? (props.x as number);
          const anchorY = data?.anchorY ?? (props.y as number);
          fabricObj.set({
            left: anchorX,
            top: anchorY,
          });
          fabricObj.setCoords();
          // Only render if this is a new object to avoid unnecessary renders
          if (!isReusedObject) {
            canvas.renderAll();
          }
        }

        if (event.type === "text" && fabricObj instanceof fabric.Textbox) {
          const hasPositionAnimation =
            event.animations?.some((anim) => anim.property === "x" || anim.property === "y") ?? false;
          textObjects.push({ id: event.id, obj: fabricObj, layer: event.layer, hasPositionAnimation });
        }

        // Track object if it should be re-selected
        if (selectedId && event.id === selectedId) {
          objectToSelect = fabricObj;
        }
      }
    });

    const updateLayoutCache = () => {
      textObjects.forEach((item) => {
        if (!item.hasPositionAnimation) {
          const cached = {
            x: (item.obj.left as number) ?? 0,
            y: (item.obj.top as number) ?? 0,
          };
          layoutCacheRef.current[item.id] = cached;
          const data = (item.obj as { data?: { anchorX?: number; anchorY?: number } }).data;
          if (data) {
            data.anchorX = cached.x;
            data.anchorY = cached.y;
          }
        }
      });
    };

    if (!isPlaying) {
      resolveTextOverlaps(textObjects, canvas);
      updateLayoutCache();
    }

    if (!isPlaying && typeof document !== "undefined" && document.fonts?.ready && textObjects.length > 0) {
      void document.fonts.ready.then(() => {
        textObjects.forEach(({ obj }) => {
          const data = (obj as unknown as { data?: { anchorX?: number; anchorY?: number } }).data;
          if (data?.anchorX !== undefined && data?.anchorY !== undefined) {
            obj.set({ left: data.anchorX, top: data.anchorY });
            obj.setCoords();
          }
        });
        resolveTextOverlaps(textObjects, canvas);
        updateLayoutCache();
        canvas.requestRenderAll();
      });
    }

    // Remove objects that are no longer visible
    Object.values(existingObjects).forEach(obj => {
      if (obj !== canvas.backgroundImage) {
        canvas.remove(obj);
      }
    });

    canvas.requestRenderAll();

    // Restore selection after render
    if (objectToSelect) {
      canvas.setActiveObject(objectToSelect);
      canvas.requestRenderAll();
    }

    // Re-enable selection events
    canvas.on('selection:cleared', () => {
      setTimeout(() => {
        const canvas = useEditorStore.getState().canvas;
        if (canvas && !canvas.getActiveObject()) {
          setSelectedId(null);
        }
      }, 0);
    });

    canvas.on('selection:created', (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selected = e.selected?.[0] as any;
      if (selected && selected.data?.id) {
        setSelectedId(selected.data.id);
      }
    });

    canvas.on('selection:updated', (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selected = e.selected?.[0] as any;
      if (selected && selected.data?.id) {
        setSelectedId(selected.data.id);
      }
    });
  }, [project, currentTime, isPlaying]);

  return canvasRef;
}
