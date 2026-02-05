"use client";

import { useEffect, useState, useRef } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { ContextMenu } from "./ContextMenu";

interface TimelineProps {
    onHide?: () => void;
}

export function Timeline({ onHide }: TimelineProps) {
    const {
        project,
        currentTime,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
        updateEvent,
        selectedIds,
        toggleSelectedId,
    } = useEditorStore();
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [resizingId, setResizingId] = useState<string | null>(null);
    const [resizeEdge, setResizeEdge] = useState<"left" | "right" | null>(null);
    const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; eventId: string | null } | null>(null);
    const dragStartX = useRef(0);
    const dragStartY = useRef(0);
    const dragStartTime = useRef(0);
    const dragStartDuration = useRef(0);
    const dragStartLayer = useRef(0);
    const playheadDragOffset = useRef(0);
    const tracksRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);

    // Track row height (matches CSS)
    const TRACK_HEIGHT = 28;

    if (!project) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                No Project Loaded
            </div>
        );
    }

    const totalDuration = project.duration || 10;
    const pixelsPerSecond = 100 * zoom;
    const totalWidth = totalDuration * pixelsPerSecond;

    // Get visual and audio events
    const visualEvents = project.events.filter(e => e.type !== "audio");
    const audioEvents = project.events.filter(e => e.type === "audio");
    const maxLayer = Math.max(...project.events.map(e => e.layer), 0);

    // Playback loop
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        let animationFrame: number;
        let lastTime = performance.now();

        const loop = (timestamp: number) => {
            if (!useEditorStore.getState().isPlaying) return;

            const dt = (timestamp - lastTime) / 1000;
            lastTime = timestamp;

            const state = useEditorStore.getState();
            let newTime = state.currentTime + dt;

            if (newTime >= totalDuration) {
                newTime = 0;
                setIsPlaying(false);
            }

            setCurrentTime(newTime);
            animationFrame = requestAnimationFrame(loop);
        };

        if (isPlaying) {
            lastTime = performance.now();
            animationFrame = requestAnimationFrame(loop);
        }

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [isPlaying, totalDuration, setCurrentTime, setIsPlaying]);

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rulerRect = e.currentTarget.getBoundingClientRect();
        const tracksRect = tracksRef.current?.getBoundingClientRect();
        const scrollLeft = tracksRef.current?.scrollLeft || 0;
        
        // Calculate the actual click position relative to the entire timeline
        const x = e.clientX - rulerRect.left + scrollLeft;
        
        // Calculate the actual timeline width from DOM
        const actualTimelineWidth = tracksRef.current?.children[0]?.clientWidth || totalWidth;
        
        // Calculate time using both methods for debugging
        const timePercent = Math.min(Math.max((x / actualTimelineWidth) * totalDuration, 0), totalDuration);
        const timePixel = Math.min(Math.max(x / pixelsPerSecond, 0), totalDuration);
        
        console.log('Timeline Click Debug:');
        console.log('  x:', x);
        console.log('  rulerRect:', rulerRect);
        console.log('  tracksRect:', tracksRect);
        console.log('  scrollLeft:', scrollLeft);
        console.log('  pixelsPerSecond:', pixelsPerSecond);
        console.log('  totalDuration:', totalDuration);
        console.log('  actualTimelineWidth:', actualTimelineWidth);
        console.log('  calculated time (percent):', timePercent);
        console.log('  calculated time (pixel):', timePixel);
        
        // Use the method that's more accurate
        setCurrentTime(timePercent);
    };

    // Playhead drag handlers
    const handlePlayheadMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!tracksRef.current) return;

        // Calculate the actual timeline width from DOM
        const actualTimelineWidth = tracksRef.current?.children[0]?.clientWidth || totalWidth;
        
        // Calculate the offset between click position and playhead position
        const rect = tracksRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left + tracksRef.current.scrollLeft;
        const playheadX = (currentTime / totalDuration) * actualTimelineWidth;
        playheadDragOffset.current = clickX - playheadX;

        setIsDraggingPlayhead(true);
        document.body.style.cursor = "ew-resize";
    };

    // Handle playhead dragging
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (!isDraggingPlayhead || !tracksRef.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!tracksRef.current) return;
            const rect = tracksRef.current.getBoundingClientRect();
            // Subtract the offset to keep playhead at cursor position
            const x = e.clientX - rect.left + tracksRef.current.scrollLeft - playheadDragOffset.current;
            
            // Calculate the actual timeline width from DOM
            const actualTimelineWidth = tracksRef.current?.children[0]?.clientWidth || totalWidth;
            
            const time = Math.min(Math.max((x / actualTimelineWidth) * totalDuration, 0), totalDuration);
            setCurrentTime(time);
        };

        const handleMouseUp = () => {
            setIsDraggingPlayhead(false);
            document.body.style.cursor = "";
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingPlayhead, totalDuration, totalWidth, setCurrentTime]);

    // Timeline item dragging (move position and layer)
    const handleItemMouseDown = (
        e: React.MouseEvent,
        eventId: string,
        eventStartTime: number,
        eventLayer: number
    ) => {
        e.stopPropagation();
        setDraggingId(eventId);
        // Support multi-select with Ctrl/Cmd+click
        toggleSelectedId(eventId, e.ctrlKey || e.metaKey);
        dragStartX.current = e.clientX;
        dragStartY.current = e.clientY;
        dragStartTime.current = eventStartTime;
        dragStartLayer.current = eventLayer;
        document.body.style.cursor = "move";
    };

    // Timeline item resize (change duration)
    const handleResizeMouseDown = (
        e: React.MouseEvent,
        eventId: string,
        eventStartTime: number,
        eventDuration: number,
        edge: "left" | "right"
    ) => {
        e.stopPropagation();
        setResizingId(eventId);
        setResizeEdge(edge);
        // Support multi-select with Ctrl/Cmd+click
        toggleSelectedId(eventId, e.ctrlKey || e.metaKey);
        dragStartX.current = e.clientX;
        dragStartTime.current = eventStartTime;
        dragStartDuration.current = eventDuration;
        document.body.style.cursor = "ew-resize";
    };

    // Handle dragging (move horizontally and between layers)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (!draggingId || !tracksRef.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!tracksRef.current) return;

            // Horizontal movement (time)
            const deltaX = e.clientX - dragStartX.current;
            const deltaTime = (deltaX / totalWidth) * totalDuration;
            const newStartTime = Math.max(
                0,
                Math.min(totalDuration - 0.1, dragStartTime.current + deltaTime)
            );

            // Vertical movement (layer)
            const deltaY = e.clientY - dragStartY.current;
            const layerDelta = Math.round(deltaY / TRACK_HEIGHT);
            const newLayer = Math.max(0, dragStartLayer.current + layerDelta);

            updateEvent(draggingId, { startTime: newStartTime, layer: newLayer });
        };

        const handleMouseUp = () => {
            setDraggingId(null);
            document.body.style.cursor = "";
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [draggingId, totalDuration, totalWidth, updateEvent, TRACK_HEIGHT]);

    // Handle resizing (change duration)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (!resizingId || !tracksRef.current || !resizeEdge) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!tracksRef.current) return;

            const deltaX = e.clientX - dragStartX.current;
            const deltaTime = (deltaX / totalWidth) * totalDuration;

            if (resizeEdge === "right") {
                // Resize from right edge - change duration
                const newDuration = Math.max(0.1, dragStartDuration.current + deltaTime);
                updateEvent(resizingId, { duration: newDuration });
            } else {
                // Resize from left edge - change start time and duration
                const newStartTime = Math.max(0, dragStartTime.current + deltaTime);
                const timeDelta = newStartTime - dragStartTime.current;
                const newDuration = Math.max(0.1, dragStartDuration.current - timeDelta);
                updateEvent(resizingId, { startTime: newStartTime, duration: newDuration });
            }
        };

        const handleMouseUp = () => {
            setResizingId(null);
            setResizeEdge(null);
            document.body.style.cursor = "";
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizingId, resizeEdge, totalDuration, totalWidth, updateEvent]);

    const getEventColor = (type: string) => {
        switch (type) {
            case "text": return "bg-blue-500";
            case "shape": return "bg-purple-500";
            case "image": return "bg-orange-500";
            case "background": return "bg-slate-600";
            case "audio": return "bg-green-500";
            default: return "bg-gray-500";
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case "text": return "📝";
            case "shape": return "🟦";
            case "image": return "🖼️";
            case "background": return "🎨";
            case "audio": return "🔊";
            default: return "📦";
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
    };

    return (
        <div className="h-full flex flex-col bg-slate-900/50">
            {/* Controls */}
            <div className="h-10 border-b border-white/10 flex items-center px-4 gap-4 shrink-0 bg-slate-800/50">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                    {isPlaying ? (
                        <>
                            <span className="text-xs">⏸</span>
                            <span>Pause</span>
                        </>
                    ) : (
                        <>
                            <span className="text-xs">▶</span>
                            <span>Play</span>
                        </>
                    )}
                </button>
                <button
                    onClick={() => setCurrentTime(0)}
                    className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm rounded-lg transition-colors"
                    title="Reset to start"
                >
                    ⏮
                </button>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-lg border border-white/10">
                    <span className="text-sm font-mono text-purple-400">
                        {formatTime(currentTime)}
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className="text-sm font-mono text-gray-400">
                        {formatTime(totalDuration)}
                    </span>
                </div>
                {/* Selection indicator */}
                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/20 rounded-lg border border-purple-500/30">
                        <span className="text-[10px] text-purple-300 font-medium">
                            {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
                        </span>
                    </div>
                )}
                <div className="flex-1" />
                {/* Zoom controls */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Zoom:</span>
                    <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                        className="w-6 h-6 flex items-center justify-center bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm rounded transition-colors"
                    >
                        −
                    </button>
                    <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-20 accent-purple-500"
                    />
                    <button
                        onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                        className="w-6 h-6 flex items-center justify-center bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm rounded transition-colors"
                    >
                        +
                    </button>
                    <span className="text-xs text-gray-400 w-10">{Math.round(zoom * 100)}%</span>
                </div>
                {onHide && (
                    <button
                        onClick={onHide}
                        className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                        title="Hide Timeline"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Timeline Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Track Labels */}
                <div className="w-24 shrink-0 border-r border-white/10 bg-slate-800/30">
                    {/* Spacer for ruler */}
                    <div className="h-6 border-b border-white/10" />

                    {/* Visual track labels */}
                    {Array.from({ length: maxLayer + 1 }).map((_, layer) => (
                        <div key={layer} className="h-7 flex items-center px-2 border-b border-white/5">
                            <span className="text-[10px] text-gray-500 truncate">Layer {layer + 1}</span>
                        </div>
                    ))}

                    {/* Audio track label */}
                    {audioEvents.length > 0 && (
                        <div className="h-7 flex items-center px-2 border-t border-white/10 bg-green-500/5">
                            <span className="text-[10px] text-green-400 truncate">🔊 Audio</span>
                        </div>
                    )}
                </div>

                {/* Scrollable Timeline */}
                <div
                    ref={tracksRef}
                    className="flex-1 overflow-x-auto overflow-y-auto"
                >
                    <div style={{ width: `${totalWidth}px`, minWidth: "100%" }}>
                        {/* Sticky Ruler */}
                        <div
                            className="h-6 bg-slate-800 border-b border-white/10 cursor-pointer sticky top-0 z-20"
                            onClick={handleProgressClick}
                        >
                            {/* Time markers */}
                            {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute top-0 flex flex-col "
                                    style={{ left: `${(i / totalDuration) * 100}%` }}
                                >
                                    <div className="h-3 w-px bg-gray-600" />
                                    <span className="text-[9px] text-gray-500 ml-0.5 select-none">{i}s</span>
                                </div>
                            ))}

                            {/* Half-second markers */}
                            {Array.from({ length: Math.ceil(totalDuration * 2) }).map((_, i) => {
                                if (i % 2 === 0) return null;
                                return (
                                    <div
                                        key={`half-${i}`}
                                        className="absolute top-0 h-1.5 w-px bg-gray-700 pointer-events-none"
                                        style={{ left: `${(i / 2 / totalDuration) * 100}%` }}
                                    />
                                );
                            })}

                            {/* Playhead in ruler - draggable */}
                            <div
                                className={`absolute top-0 bottom-0 w-0.5 bg-purple-500 z-30 ${isDraggingPlayhead ? 'cursor-ew-resize' : 'cursor-grab'}`}
                                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                                onMouseDown={handlePlayheadMouseDown}
                            >
                                <div
                                    className="absolute -left-2 -top-1 w-4 h-4 cursor-grab hover:scale-110 transition-transform"
                                    onMouseDown={handlePlayheadMouseDown}
                                >
                                    <div className="absolute left-0.5 top-1 w-0 h-0 border-l-[6px] border-r-[6px] border-t-8 border-l-transparent border-r-transparent border-t-purple-500 hover:border-t-purple-400" />
                                </div>
                            </div>
                        </div>

                        {/* Visual Tracks */}
                        <div className="relative py-2" style={{ minHeight: `${(maxLayer + 1) * 28 + 16}px` }}>
                            {visualEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className={`absolute h-6 rounded cursor-grab select-none flex items-center text-xs text-white overflow-hidden whitespace-nowrap transition-all shadow-sm group ${draggingId === event.id || resizingId === event.id ? "opacity-90 shadow-lg scale-[1.02]" : "opacity-90 hover:opacity-100"
                                        } ${selectedIds.has(event.id)
                                            ? "ring-2 ring-purple-400 ring-offset-1 ring-offset-slate-900"
                                            : ""
                                        } ${getEventColor(event.type)}`}
                                    style={{
                                        left: `calc(${(event.startTime / totalDuration) * 100}% + 8px)`,
                                        width: `calc(${Math.max((event.duration / totalDuration) * 100, 1)}% - 4px)`,
                                        top: `${event.layer * 28 + 8}px`,
                                        zIndex: selectedIds.has(event.id) ? 100 : (draggingId === event.id || resizingId === event.id ? 50 : event.layer),
                                    }}
                                    onMouseDown={(e) => handleItemMouseDown(e, event.id, event.startTime, event.layer)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setContextMenu({
                                            x: e.clientX,
                                            y: e.clientY,
                                            eventId: event.id,
                                        });
                                    }}
                                >
                                    {/* Left resize handle */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/0 hover:bg-white/20 transition-colors"
                                        onMouseDown={(e) => handleResizeMouseDown(e, event.id, event.startTime, event.duration, "left")}
                                    />

                                    {/* Content */}
                                    <div className="flex-1 flex items-center px-2 min-w-0">
                                        <span className="mr-1 shrink-0">{getEventIcon(event.type)}</span>
                                        <span className="truncate">
                                            {event.type === "text" && "text" in event.properties
                                                ? ((event.properties as { text?: string }).text?.substring(0, 10) || "Text")
                                                : event.type}
                                        </span>
                                    </div>

                                    {/* Right resize handle */}
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/0 hover:bg-white/20 transition-colors"
                                        onMouseDown={(e) => handleResizeMouseDown(e, event.id, event.startTime, event.duration, "right")}
                                    />
                                </div>
                            ))}

                            {/* Playhead line through tracks */}
                            <div
                                className="absolute top-0 w-0.5 bg-purple-500/50 pointer-events-none z-10"
                                style={{
                                    left: `${(currentTime / totalDuration) * 100}%`,
                                    height: `${(maxLayer + 1) * 28 + 16}px`,
                                }}
                            />
                        </div>

                        {/* Audio Track */}
                        {audioEvents.length > 0 && (
                            <div className="relative h-7 border-t border-white/10 bg-green-500/5">
                                {audioEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className={`absolute h-5 top-1 rounded-sm cursor-grab select-none flex items-center text-xs text-white overflow-hidden whitespace-nowrap group ${draggingId === event.id || resizingId === event.id ? "opacity-90 shadow-lg z-50" : "opacity-80 hover:opacity-100"
                                            } ${selectedIds.has(event.id)
                                                ? "ring-2 ring-green-400"
                                                : ""
                                            } bg-green-600`}
                                        style={{
                                            left: `${(event.startTime / totalDuration) * 100}%`,
                                            width: `${Math.max((event.duration / totalDuration) * 100, 1)}%`,
                                        }}
                                        onMouseDown={(e) => handleItemMouseDown(e, event.id, event.startTime, 0)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setContextMenu({
                                                x: e.clientX,
                                                y: e.clientY,
                                                eventId: event.id,
                                            });
                                        }}
                                    >
                                        {/* Left resize handle */}
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/0 hover:bg-white/20 transition-colors"
                                            onMouseDown={(e) => handleResizeMouseDown(e, event.id, event.startTime, event.duration, "left")}
                                        />

                                        <div className="flex-1 flex items-center px-2 min-w-0">
                                            <span className="mr-1">🔊</span>
                                            <span className="truncate text-[10px]">
                                                {"isVoiceover" in event.properties && (event.properties as { isVoiceover?: boolean }).isVoiceover
                                                    ? "Voiceover"
                                                    : "Audio"}
                                            </span>
                                            {/* Waveform visualization */}
                                            <div className="flex-1 h-3 mx-1 flex items-end gap-px opacity-40">
                                                {Array.from({ length: 20 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex-1 bg-white/60 rounded-t-sm"
                                                        style={{ height: `${20 + Math.sin(i * 0.8) * 30 + Math.random() * 30}%` }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right resize handle */}
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/0 hover:bg-white/20 transition-colors"
                                            onMouseDown={(e) => handleResizeMouseDown(e, event.id, event.startTime, event.duration, "right")}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    eventId={contextMenu.eventId}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
}
