# Timeline Component

> **Prerequisites**: Read [07-animation-engine.md](./07-animation-engine.md) first.
>
> **Key File**: [`src/components/editor/Timeline.tsx`](file:///c:/Users/kiran/code/p/videographic/videographic%20nextjs/src/components/editor/Timeline.tsx)

---

## 🎯 What You'll Learn

- Timeline component architecture
- Track visualization (visual + audio)
- Playhead control and scrubbing
- Drag-to-move and resize events
- Zoom functionality
- Playback loop implementation

---

## 📐 Timeline Overview

The Timeline is a horizontal track view showing when elements appear:

```
┌───────────────────────────────────────────────────────────────┐
│ ▶ Play  ⏮ Reset  │  0:02.50 / 0:10.00  │  Zoom: [─●──] 100%  │
├────────┬──────────────────────────────────────────────────────┤
│        │  0s    1s    2s    3s    4s    5s    6s    7s    8s  │
│        │   ▼ (playhead)                                       │
├────────┼──────────────────────────────────────────────────────┤
│Layer 3 │      [═══ Text ═══]                                  │
│Layer 2 │  [══ Shape ══]           [══ Image ══]               │
│Layer 1 │           [════════ Background ════════]             │
├────────┼──────────────────────────────────────────────────────┤
│ Audio  │  [════ 🔊 Voiceover ════]│░░░░░░░░░░░░░░│             │
└────────┴──────────────────────────────────────────────────────┘
```

---

## 🏗️ Component Structure

```typescript
export function Timeline({ onHide }: TimelineProps) {
  // State from store
  const { project, currentTime, setCurrentTime, isPlaying, ... } = useEditorStore();
  
  // Local state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Refs
  const tracksRef = useRef<HTMLDivElement>(null);
  
  // Calculations
  const pixelsPerSecond = 100 * zoom;
  const totalWidth = totalDuration * pixelsPerSecond;
  
  return (
    <div className="h-full flex flex-col">
      {/* Controls Bar */}
      <div>...</div>
      
      {/* Timeline Content */}
      <div className="flex">
        {/* Track Labels */}
        <div>...</div>
        
        {/* Scrollable Tracks */}
        <div ref={tracksRef}>
          {/* Ruler */}
          {/* Events */}
          {/* Playhead */}
        </div>
      </div>
    </div>
  );
}
```

---

## 🎮 Controls Bar

The top control bar provides playback and zoom controls:

```typescript
<div className="h-10 flex items-center px-4 gap-4">
  {/* Play/Pause Button */}
  <button onClick={() => setIsPlaying(!isPlaying)}>
    {isPlaying ? "⏸ Pause" : "▶ Play"}
  </button>

  {/* Reset Button */}
  <button onClick={() => setCurrentTime(0)}>⏮</button>

  {/* Time Display */}
  <div>
    <span>{formatTime(currentTime)}</span>
    <span>/</span>
    <span>{formatTime(totalDuration)}</span>
  </div>

  {/* Selection Indicator */}
  {selectedIds.size > 0 && (
    <div>{selectedIds.size} items selected</div>
  )}

  {/* Zoom Controls */}
  <div>
    <button onClick={() => setZoom(zoom - 0.25)}>−</button>
    <input type="range" value={zoom} onChange={...} />
    <button onClick={() => setZoom(zoom + 0.25)}>+</button>
    <span>{Math.round(zoom * 100)}%</span>
  </div>
</div>
```

### Time Formatting

```typescript
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

// Example: 65.5 → "1:05.50"
```

---

## 📏 Ruler and Time Markers

The sticky ruler shows time markers:

```typescript
<div className="h-6 sticky top-0 z-20" onClick={handleProgressClick}>
  {/* Second markers */}
  {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
    <div
      key={i}
      className="absolute"
      style={{ left: `${(i / totalDuration) * 100}%` }}
    >
      <div className="h-3 w-px bg-gray-600" />
      <span className="text-[9px]">{i}s</span>
    </div>
  ))}

  {/* Half-second markers */}
  {Array.from({ length: Math.ceil(totalDuration * 2) }).map((_, i) => {
    if (i % 2 === 0) return null;
    return (
      <div
        key={`half-${i}`}
        className="absolute h-1.5 w-px bg-gray-700"
        style={{ left: `${(i / 2 / totalDuration) * 100}%` }}
      />
    );
  })}
</div>
```

---

## ▶ Playhead

The playhead shows current time and can be dragged:

```typescript
{/* Playhead in ruler */}
<div
  className="absolute w-0.5 bg-purple-500"
  style={{ left: `${(currentTime / totalDuration) * 100}%` }}
  onMouseDown={handlePlayheadMouseDown}
>
  {/* Triangle handle */}
  <div className="absolute -left-2 -top-1 w-4 h-4">
    <div className="border-l-[6px] border-r-[6px] border-t-8 
                    border-l-transparent border-r-transparent 
                    border-t-purple-500" />
  </div>
</div>
```

### Playhead Dragging

```typescript
const handlePlayheadMouseDown = (e: React.MouseEvent) => {
  e.stopPropagation();
  setIsDraggingPlayhead(true);
  document.body.style.cursor = "ew-resize";
};

useEffect(() => {
  if (!isDraggingPlayhead) return;

  const handleMouseMove = (e: MouseEvent) => {
    const rect = tracksRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + tracksRef.current.scrollLeft;
    const time = Math.min(Math.max(x / totalWidth * totalDuration, 0), totalDuration);
    setCurrentTime(time);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", () => setIsDraggingPlayhead(false));
  
  return () => { /* cleanup */ };
}, [isDraggingPlayhead]);
```

---

## 🎨 Track Items

Each TimelineEvent renders as a colored bar:

```typescript
{visualEvents.map((event) => (
  <div
    key={event.id}
    className={`absolute h-6 rounded cursor-grab ${getEventColor(event.type)} 
                ${selectedIds.has(event.id) ? "ring-2 ring-purple-400" : ""}`}
    style={{
      left: `${(event.startTime / totalDuration) * 100}%`,
      width: `${(event.duration / totalDuration) * 100}%`,
      top: `${event.layer * 28 + 8}px`,
    }}
    onMouseDown={(e) => handleItemMouseDown(e, event.id, ...)}
  >
    {/* Left resize handle */}
    <div 
      className="absolute left-0 w-2 h-full cursor-ew-resize" 
      onMouseDown={(e) => handleResizeMouseDown(..., "left")}
    />

    {/* Content */}
    <div className="flex items-center px-2">
      <span>{getEventIcon(event.type)}</span>
      <span>{event.type === "text" ? event.properties.text : event.type}</span>
    </div>

    {/* Right resize handle */}
    <div 
      className="absolute right-0 w-2 h-full cursor-ew-resize" 
      onMouseDown={(e) => handleResizeMouseDown(..., "right")}
    />
  </div>
))}
```

### Event Colors

```typescript
const getEventColor = (type: string) => {
  switch (type) {
    case "text":       return "bg-blue-500";
    case "shape":      return "bg-purple-500";
    case "image":      return "bg-orange-500";
    case "background": return "bg-slate-600";
    case "audio":      return "bg-green-500";
    default:           return "bg-gray-500";
  }
};
```

### Event Icons

```typescript
const getEventIcon = (type: string) => {
  switch (type) {
    case "text":       return "📝";
    case "shape":      return "🟦";
    case "image":      return "🖼️";
    case "background": return "🎨";
    case "audio":      return "🔊";
    default:           return "📦";
  }
};
```

---

## 🖱️ Drag to Move Events

Dragging events changes their position and layer:

```typescript
const handleItemMouseDown = (e, eventId, eventStartTime, eventLayer) => {
  e.stopPropagation();
  setDraggingId(eventId);
  toggleSelectedId(eventId, e.ctrlKey || e.metaKey);  // Multi-select
  
  dragStartX.current = e.clientX;
  dragStartY.current = e.clientY;
  dragStartTime.current = eventStartTime;
  dragStartLayer.current = eventLayer;
};

useEffect(() => {
  if (!draggingId) return;

  const handleMouseMove = (e: MouseEvent) => {
    // Horizontal: change start time
    const deltaX = e.clientX - dragStartX.current;
    const deltaTime = (deltaX / totalWidth) * totalDuration;
    const newStartTime = Math.max(0, dragStartTime.current + deltaTime);

    // Vertical: change layer
    const deltaY = e.clientY - dragStartY.current;
    const layerDelta = Math.round(deltaY / TRACK_HEIGHT);
    const newLayer = Math.max(0, dragStartLayer.current + layerDelta);

    updateEvent(draggingId, { startTime: newStartTime, layer: newLayer });
  };

  // ... event listeners
}, [draggingId]);
```

---

## ↔️ Resize Events

Resize handles change duration or both start time and duration:

```typescript
const handleResizeMouseDown = (e, eventId, startTime, duration, edge) => {
  setResizingId(eventId);
  setResizeEdge(edge);  // "left" or "right"
  dragStartX.current = e.clientX;
  dragStartTime.current = startTime;
  dragStartDuration.current = duration;
};

useEffect(() => {
  if (!resizingId) return;

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - dragStartX.current;
    const deltaTime = (deltaX / totalWidth) * totalDuration;

    if (resizeEdge === "right") {
      // Resize from right: just change duration
      const newDuration = Math.max(0.1, dragStartDuration.current + deltaTime);
      updateEvent(resizingId, { duration: newDuration });
    } else {
      // Resize from left: change start time AND duration
      const newStartTime = Math.max(0, dragStartTime.current + deltaTime);
      const timeDelta = newStartTime - dragStartTime.current;
      const newDuration = Math.max(0.1, dragStartDuration.current - timeDelta);
      updateEvent(resizingId, { startTime: newStartTime, duration: newDuration });
    }
  };

  // ... event listeners
}, [resizingId, resizeEdge]);
```

---

## 🔄 Playback Loop

When playing, `currentTime` updates continuously:

```typescript
useEffect(() => {
  if (!isPlaying) return;

  let animationFrame: number;
  let lastTime = performance.now();

  const loop = (timestamp: number) => {
    if (!useEditorStore.getState().isPlaying) return;

    const dt = (timestamp - lastTime) / 1000;  // Delta in seconds
    lastTime = timestamp;

    let newTime = currentTime + dt;

    if (newTime >= totalDuration) {
      newTime = 0;
      setIsPlaying(false);  // Stop at end
    }

    setCurrentTime(newTime);
    animationFrame = requestAnimationFrame(loop);
  };

  animationFrame = requestAnimationFrame(loop);

  return () => cancelAnimationFrame(animationFrame);
}, [isPlaying, totalDuration]);
```

---

## 🔍 Zoom Functionality

Zoom changes the scale of the timeline:

```typescript
const [zoom, setZoom] = useState(1);  // 1 = 100%
const pixelsPerSecond = 100 * zoom;
const totalWidth = totalDuration * pixelsPerSecond;

// At zoom 1x: 10 seconds = 1000px
// At zoom 2x: 10 seconds = 2000px
// At zoom 0.5x: 10 seconds = 500px
```

---

## 🔊 Audio Track

Audio events are displayed in a separate track:

```typescript
const audioEvents = project.events.filter(e => e.type === "audio");

{audioEvents.length > 0 && (
  <div className="relative h-7 border-t bg-green-500/5">
    {audioEvents.map((event) => (
      <div
        key={event.id}
        className="absolute h-5 bg-green-600 rounded-sm"
        style={{
          left: `${(event.startTime / totalDuration) * 100}%`,
          width: `${(event.duration / totalDuration) * 100}%`,
        }}
      >
        {/* Waveform visualization */}
        <div className="flex items-end gap-px opacity-40">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/60"
              style={{ height: `${20 + Math.sin(i * 0.8) * 30}%` }}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
)}
```

---

## 📋 Layer Tracks

Visual events are organized by layer:

```typescript
const maxLayer = Math.max(...project.events.map(e => e.layer), 0);

{/* Track Labels */}
{Array.from({ length: maxLayer + 1 }).map((_, layer) => (
  <div key={layer} className="h-7 flex items-center px-2">
    <span className="text-[10px] text-gray-500">Layer {layer + 1}</span>
  </div>
))}
```

---

## 🖱️ Context Menu

Right-click opens a context menu:

```typescript
const [contextMenu, setContextMenu] = useState<{ x: number; y: number; eventId: string } | null>(null);

// On track item
onContextMenu={(e) => {
  e.preventDefault();
  setContextMenu({
    x: e.clientX,
    y: e.clientY,
    eventId: event.id,
  });
}}

// Render context menu
{contextMenu && (
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    eventId={contextMenu.eventId}
    onClose={() => setContextMenu(null)}
  />
)}
```

---

## 📐 Key Constants

```typescript
const TRACK_HEIGHT = 28;  // Height of each layer row in pixels
const BASE_PIXELS_PER_SECOND = 100;  // At zoom 1x
```

---

## 🔧 Build Steps

Files to create:

| Step | File | Action |
|------|------|--------|
| 1 | `src/components/editor/Timeline.tsx` | Timeline component |

### Create Timeline Component

Create `src/components/editor/Timeline.tsx` with:
- Controls bar (play/pause, time display, zoom)
- Ruler with time markers
- Track items for each event
- Playhead rendering and dragging
- Event drag-to-move and resize handlers
- Audio track visualization

Use the code patterns from this doc as reference.

---

## 📚 Next Steps

Now that you understand the Timeline, learn about the full editor architecture:

→ **[09-editor-architecture.md](./09-editor-architecture.md)** - Editor Architecture

---

*The timeline is where you orchestrate when elements appear and disappear - it's the conductor of your video.*
