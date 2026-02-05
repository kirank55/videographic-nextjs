/**
 * Timeline Controller - Manages time-based progression for video rendering
 * Handles deterministic frame stepping for video export
 */

import type {
  VideoProject,
  TimelineEvent,
  Animation,
  TextProperties,
  ShapeProperties,
  ImageProperties,
} from "@/lib/schemas/timeline";

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
 * Computed properties for an event at a specific time
 */
export interface ComputedEventState {
  event: TimelineEvent;
  properties: TextProperties | ShapeProperties | ImageProperties;
  isVisible: boolean;
}

/**
 * Frame state - all visible events and their computed properties
 */
export interface FrameState {
  time: number;
  frameNumber: number;
  events: ComputedEventState[];
}

export class TimelineController {
  private project: VideoProject;
  private currentFrame: number = 0;
  private totalFrames: number;
  private frameDuration: number;

  constructor(project: VideoProject) {
    this.project = project;
    this.totalFrames = Math.ceil(project.duration * project.fps);
    this.frameDuration = 1 / project.fps;
  }

  getTotalFrames(): number {
    return this.totalFrames;
  }

  getCurrentFrame(): number {
    return this.currentFrame;
  }

  frameToTime(frame: number): number {
    return frame * this.frameDuration;
  }

  timeToFrame(time: number): number {
    return Math.floor(time * this.project.fps);
  }

  reset(): void {
    this.currentFrame = 0;
  }

  nextFrame(): FrameState | null {
    if (this.currentFrame >= this.totalFrames) {
      return null;
    }

    const state = this.getFrameState(this.currentFrame);
    this.currentFrame++;
    return state;
  }

  getFrameState(frameNumber: number): FrameState {
    const time = this.frameToTime(frameNumber);
    const events = this.getVisibleEvents(time);

    return {
      time,
      frameNumber,
      events: events.map((event) => this.computeEventState(event, time)),
    };
  }

  private getVisibleEvents(time: number): TimelineEvent[] {
    return this.project.events
      .filter((event) => {
        const start = event.startTime;
        const end = event.startTime + event.duration;
        return time >= start && time < end;
      })
      .sort((a, b) => {
        if (a.layer !== b.layer) return a.layer - b.layer;
        // If layers are equal, prioritize background elements to be drawn first (at the bottom)
        const isABg = a.type === 'background' || a.id.toLowerCase().includes('bg') || a.id.toLowerCase().includes('background');
        const isBBg = b.type === 'background' || b.id.toLowerCase().includes('bg') || b.id.toLowerCase().includes('background');
        if (isABg && !isBBg) return -1;
        if (!isABg && isBBg) return 1;
        return 0;
      });
  }

  private computeEventState(
    event: TimelineEvent,
    time: number
  ): ComputedEventState {
    const properties = { ...event.properties };

    if (event.animations && event.animations.length > 0) {
      const eventLocalTime = time - event.startTime;

      for (const animation of event.animations) {
        const animatedValue = this.interpolateAnimation(
          animation,
          eventLocalTime,
          event.duration
        );
        if (animatedValue !== null) {
          (properties as Record<string, unknown>)[animation.property] = animatedValue;
        }
      }
    }

    // Apply smooth exit effect (fade out during last 0.3 seconds)
    const exitDuration = 0.3; // seconds
    const localTime = time - event.startTime;
    const timeUntilEnd = event.duration - localTime;
    
    if (timeUntilEnd <= exitDuration && timeUntilEnd > 0) {
      // Calculate exit progress (0 = just started exit, 1 = fully exited)
      const exitProgress = 1 - (timeUntilEnd / exitDuration);
      // Apply easeOut for smooth exit
      const easedExitProgress = exitProgress * (2 - exitProgress);
      
      // Fade out opacity
      const currentOpacity = ((properties as Record<string, unknown>).opacity as number) ?? 1;
      (properties as Record<string, unknown>).opacity = currentOpacity * (1 - easedExitProgress);
      
      // Slight scale down for more professional look
      const currentScale = ((properties as Record<string, unknown>).scale as number) ?? 1;
      (properties as Record<string, unknown>).scale = currentScale * (1 - easedExitProgress * 0.1);
    }

    return {
      event,
      properties: properties as TextProperties | ShapeProperties | ImageProperties,
      isVisible: true,
    };
  }

  private interpolateAnimation(
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

    if (typeof animation.from === "number" && typeof animation.to === "number") {
      return animation.from + (animation.to - animation.from) * easedProgress;
    }

    return progress < 0.5 ? animation.from : animation.to;
  }

  getProject(): VideoProject {
    return this.project;
  }

  hasMoreFrames(): boolean {
    return this.currentFrame < this.totalFrames;
  }

  getProgress(): number {
    return (this.currentFrame / this.totalFrames) * 100;
  }

  *frames(): Generator<FrameState> {
    this.reset();
    let frame = this.nextFrame();
    while (frame !== null) {
      yield frame;
      frame = this.nextFrame();
    }
  }
}
