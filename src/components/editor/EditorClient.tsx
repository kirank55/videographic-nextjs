"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useEditorStore } from "@/stores/editor-store";
import { Canvas } from "@/components/editor/Canvas";
import { Timeline } from "@/components/editor/Timeline";
import { PropertyPanel } from "@/components/editor/PropertyPanel";
import { AddElementToolbar } from "@/components/editor/AddElementToolbar";
import { ExportModal } from "@/components/editor/ExportModal";
import { AIGenerateModal } from "@/components/editor/AIGenerateModal";
import { ContextMenu } from "@/components/editor/ContextMenu";
import { useResizable } from "@/components/editor/hooks/useResizable";
import { UserButton } from "@/components/auth/user-button";
import type { VideoProject as EditorVideoProject } from "@/lib/schemas/timeline";

// DB project shape adapted for editor
interface EditorProjectInput {
    id: string;
    name: string;
    description?: string;
    width: number;
    height: number;
    fps: number;
    duration: number;
    backgroundColor: string;
    events: EditorVideoProject["events"];
}

// Floating Play Button Component for when Timeline is hidden
function FloatingPlayButton() {
    const { currentTime, setCurrentTime, isPlaying, setIsPlaying, project } = useEditorStore();
    const totalDuration = project?.duration || 10;

    // Playback loop (mirrors Timeline's logic)
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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-white/10 shadow-xl">
            <button
                onClick={() => setCurrentTime(0)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Reset"
            >
                ⏮
            </button>
            <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-colors shadow-lg shadow-purple-500/30"
                title={isPlaying ? "Pause" : "Play"}
            >
                <span className="text-lg">{isPlaying ? "⏸" : "▶"}</span>
            </button>
            <div className="flex items-center gap-1.5 text-sm font-mono">
                <span className="text-purple-400">{formatTime(currentTime)}</span>
                <span className="text-gray-600">/</span>
                <span className="text-gray-400">{formatTime(totalDuration)}</span>
            </div>
            {/* Mini progress bar */}
            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-purple-500 transition-all duration-100"
                    style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                />
            </div>
        </div>
    );
}

interface EditorClientProps {
    project: EditorProjectInput;
}

export function EditorClient({ project: dbProject }: EditorClientProps) {
    const { project, setProject, selectedIds, selectedId, toggleSelectedId, clearSelection, canvas, undo, redo, canUndo, canRedo, saveToHistory, reorderLayers, deleteSelectedEvents, duplicateSelectedEvents, historyIndex, centerSelectedEvents } =
        useEditorStore();
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const lastSavedEventsRef = useRef<string | null>(null);
    const isInitializedRef = useRef(false);

    // Drag and drop state for layers
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; eventId: string | null } | null>(null);

    // Panel visibility states
    const [showLayers, setShowLayers] = useState(true);
    const [showProperties, setShowProperties] = useState(true);
    const [showTimeline, setShowTimeline] = useState(true);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Store previous panel states for preview mode toggle
    const prevPanelStatesRef = useRef({ layers: true, properties: true, timeline: true });

    // Toggle preview mode
    const togglePreviewMode = useCallback(() => {
        if (isPreviewMode) {
            // Exit preview mode - restore previous states
            setShowLayers(prevPanelStatesRef.current.layers);
            setShowProperties(prevPanelStatesRef.current.properties);
            setShowTimeline(prevPanelStatesRef.current.timeline);
            setIsPreviewMode(false);
        } else {
            // Enter preview mode - save current states and hide all panels
            prevPanelStatesRef.current = {
                layers: showLayers,
                properties: showProperties,
                timeline: showTimeline,
            };
            setShowLayers(false);
            setShowProperties(false);
            setShowTimeline(false);
            setIsPreviewMode(true);
        }
    }, [isPreviewMode, showLayers, showProperties, showTimeline]);

    // Resizable timeline
    const { height: timelineHeight, handleMouseDown: handleTimelineDrag } = useResizable(
        200,
        100,
        600
    );

    // Check if project is empty
    const isProjectEmpty = project?.events.length === 0;

    // Load project into store on mount
    useEffect(() => {
        // Convert the input format to the full VideoProject format
        const videoProject: EditorVideoProject = {
            id: dbProject.id,
            name: dbProject.name,
            description: dbProject.description,
            width: dbProject.width,
            height: dbProject.height,
            fps: dbProject.fps,
            duration: dbProject.duration,
            backgroundColor: dbProject.backgroundColor,
            events: dbProject.events,
        };
        setProject(videoProject);
        // Initialize the saved state reference
        lastSavedEventsRef.current = JSON.stringify(videoProject.events);
        isInitializedRef.current = true;
    }, [dbProject, setProject]);

    // Save to database - convert back to timeline format
    const saveProject = useCallback(async () => {
        if (!project) return;
        setIsSaving(true);
        try {
            // Convert events back to timeline for DB
            const timeline = project.events.map((event) => ({
                id: event.id,
                type: event.type,
                startTime: event.startTime,
                duration: event.duration,
                properties: event.properties,
                animations: event.animations,
            }));

            await fetch(`/api/projects/${project.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: project.name,
                    duration: project.duration,
                    timeline,
                }),
            });
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            lastSavedEventsRef.current = JSON.stringify(project.events);
        } catch (err) {
            console.error("Failed to save project:", err);
        } finally {
            setIsSaving(false);
        }
    }, [project]);

    // Track unsaved changes
    useEffect(() => {
        if (!project || !isInitializedRef.current) return;
        const currentEvents = JSON.stringify(project.events);
        if (lastSavedEventsRef.current !== null && currentEvents !== lastSavedEventsRef.current) {
            setHasUnsavedChanges(true);
        }
    }, [project?.events]);

    // Auto-save after 2 seconds of inactivity
    useEffect(() => {
        if (!hasUnsavedChanges || !project) return;

        const autoSaveTimeout = setTimeout(() => {
            saveProject();
        }, 2000);

        return () => clearTimeout(autoSaveTimeout);
    }, [hasUnsavedChanges, project?.events, saveProject]);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
                return e.returnValue;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + S = Save
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                saveProject();
            }
            // Ctrl/Cmd + Z = Undo
            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
            if (
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
                ((e.ctrlKey || e.metaKey) && e.key === "y")
            ) {
                e.preventDefault();
                redo();
            }
            // Ctrl/Cmd + D = Duplicate selected
            if ((e.ctrlKey || e.metaKey) && e.key === "d") {
                e.preventDefault();
                if (selectedIds.size > 0) {
                    duplicateSelectedEvents();
                }
            }
            // Delete/Backspace = Delete selected
            if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size > 0) {
                const target = e.target as HTMLElement;
                if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
                    e.preventDefault();
                    deleteSelectedEvents();
                }
            }
            // Escape = Deselect
            if (e.key === "Escape") {
                clearSelection();
            }
            // Ctrl/Cmd + E = Center selected
            if ((e.ctrlKey || e.metaKey) && e.key === "e") {
                e.preventDefault();
                if (selectedIds.size > 0) {
                    centerSelectedEvents();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIds, clearSelection, undo, redo, saveProject, deleteSelectedEvents, duplicateSelectedEvents]);

    // Save history on property changes (debounced effect)
    useEffect(() => {
        const timeout = setTimeout(() => {
            const { project, isUndoRedoing } = useEditorStore.getState();
            // Don't save to history if we're in the middle of undo/redo
            if (project && !isUndoRedoing) {
                saveToHistory();
            }
        }, 500);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.events]);

    // Sync selection from layers panel to canvas
    useEffect(() => {
        if (!canvas || !selectedId) return;

        // Find the object in canvas with matching id (only sync first selected)
        const objects = canvas.getObjects();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const targetObject = objects.find((obj: any) => obj.data?.id === selectedId);

        if (targetObject) {
            canvas.setActiveObject(targetObject);
            canvas.requestRenderAll();
        }
    }, [selectedId, canvas]);

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-400">Loading project...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-white/10 bg-slate-900/50 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        ←
                    </Link>
                    <div>
                        <h1 className="text-sm font-semibold text-white">{project.name}</h1>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            {isSaving ? (
                                <>
                                    <span className="animate-pulse">●</span>
                                    <span>Saving...</span>
                                </>
                            ) : hasUnsavedChanges ? (
                                <>
                                    <span className="text-orange-400">●</span>
                                    <span>Unsaved changes</span>
                                </>
                            ) : lastSaved ? (
                                <>
                                    <span className="text-green-400">●</span>
                                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                                </>
                            ) : (
                                <span>Not saved yet</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Panel toggles */}
                    <div className="flex items-center gap-1 mr-2 border-r border-white/10 pr-3">
                        <button
                            onClick={() => setShowLayers(!showLayers)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${showLayers
                                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                                : 'bg-slate-800/80 text-gray-400 hover:text-white hover:bg-slate-700/80 border border-white/10'}`}
                            title="Toggle Layers Panel"
                        >
                            <span>📑</span>
                            <span className="hidden sm:inline">Layers</span>
                        </button>
                        <button
                            onClick={() => setShowTimeline(!showTimeline)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${showTimeline
                                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                                : 'bg-slate-800/80 text-gray-400 hover:text-white hover:bg-slate-700/80 border border-white/10'}`}
                            title="Toggle Timeline Panel"
                        >
                            <span>🎬</span>
                            <span className="hidden sm:inline">Timeline</span>
                        </button>
                        <button
                            onClick={() => setShowProperties(!showProperties)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${showProperties
                                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                                : 'bg-slate-800/80 text-gray-400 hover:text-white hover:bg-slate-700/80 border border-white/10'}`}
                            title="Toggle Properties Panel"
                        >
                            <span>⚙️</span>
                            <span className="hidden sm:inline">Properties</span>
                        </button>
                    </div>

                    {/* Undo/Redo buttons */}
                    {/* <div className="flex items-center gap-1 mr-2 border-r border-white/10 pr-3">
                        <button
                            onClick={undo}
                            disabled={!canUndo()}
                            className="p-1.5 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800/80 text-gray-400 hover:text-white hover:bg-slate-700/80 border border-white/10"
                            title="Undo (Ctrl+Z)"
                        >
                            undo
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo()}
                            className="p-1.5 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800/80 text-gray-400 hover:text-white hover:bg-slate-700/80 border border-white/10"
                            title="Redo (Ctrl+Shift+Z)"
                        >
                            redo
                        </button>
                    </div> */}
                    <button
                        onClick={saveProject}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors border border-white/5"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                    {!isProjectEmpty && (
                        <button
                            onClick={() => setIsExportOpen(true)}
                            className="px-4 py-1.5 bg-linear-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-500 hover:to-pink-500 transition-colors"
                        >
                            Export
                        </button>
                    )}
                    <UserButton />
                </div>
            </header>

            {/* Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Layers */}
                {showLayers && (
                    <div className="w-60 border-r border-white/10 bg-slate-900/30 flex flex-col shrink-0">
                        <div className="p-3 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Layers
                                </h3>
                                {selectedIds.size > 1 && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-600/30 text-purple-300 rounded">
                                        {selectedIds.size} selected
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500" title="Total layers">{project.events.length}</span>
                                <button
                                    onClick={() => setShowLayers(false)}
                                    className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                                    title="Hide Layers"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        {/* Multi-select hint */}
                        {project.events.length > 0 && selectedIds.size === 0 && (
                            <div className="px-3 py-1.5 text-[10px] text-gray-500 bg-slate-800/30 border-b border-white/5">
                                💡 Ctrl+Click to multi-select
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {project.events.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <div className="text-3xl mb-2">🎨</div>
                                    <p className="text-gray-500 text-xs">
                                        No elements yet. Add some or use AI Magic!
                                    </p>
                                </div>
                            ) : (
                                [...project.events].reverse().map((event, idx) => {
                                    const actualIdx = project.events.length - 1 - idx;
                                    const getIcon = () => {
                                        switch (event.type) {
                                            case "text": return "📝";
                                            case "shape": return "🟦";
                                            case "image": return "🖼️";
                                            case "audio": return "🔊";
                                            case "background": return "🎨";
                                            default: return "📦";
                                        }
                                    };
                                    // Use stable naming based on creation order (extracted from ID timestamp)
                                    const getLabel = () => {
                                        if (event.type === "text" && "text" in event.properties) {
                                            const text = (event.properties as { text?: string }).text;
                                            return text?.substring(0, 15) || "Text";
                                        }
                                        // Get same-type events and sort by ID (which contains creation timestamp)
                                        // This ensures consistent naming regardless of layer reordering
                                        const sameTypeEvents = project.events
                                            .filter(e => e.type === event.type)
                                            .sort((a, b) => a.id.localeCompare(b.id));
                                        const orderIndex = sameTypeEvents.findIndex(e => e.id === event.id) + 1;
                                        return `${event.type} ${orderIndex}`;
                                    };
                                    const isDragging = draggingIndex === actualIdx;
                                    const isDragOver = dragOverIndex === actualIdx;
                                    return (
                                        <div
                                            key={event.id}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData("text/plain", String(actualIdx));
                                                e.dataTransfer.effectAllowed = "move";
                                                setDraggingIndex(actualIdx);
                                                // Delay to allow drag image to be created
                                                setTimeout(() => {
                                                    const target = e.target as HTMLElement;
                                                    target.style.opacity = "0.4";
                                                }, 0);
                                            }}
                                            onDragEnd={(e) => {
                                                const target = e.target as HTMLElement;
                                                target.style.opacity = "1";
                                                setDraggingIndex(null);
                                                setDragOverIndex(null);
                                                setDropPosition(null);
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.dataTransfer.dropEffect = "move";
                                                if (draggingIndex !== actualIdx) {
                                                    // Determine if dropping above or below based on mouse position
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const midpoint = rect.top + rect.height / 2;
                                                    const isAbove = e.clientY < midpoint;
                                                    setDragOverIndex(actualIdx);
                                                    setDropPosition(isAbove ? "above" : "below");
                                                }
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const fromIdx = parseInt(e.dataTransfer.getData("text/plain"));
                                                if (!isNaN(fromIdx) && fromIdx !== actualIdx) {
                                                    // Adjust target index based on drop position
                                                    let targetIdx = actualIdx;
                                                    if (fromIdx < actualIdx) {
                                                        // Moving UP (to higher index)
                                                        targetIdx = dropPosition === "above" ? actualIdx : actualIdx - 1;
                                                    } else {
                                                        // Moving DOWN (to lower index)
                                                        targetIdx = dropPosition === "above" ? actualIdx + 1 : actualIdx;
                                                    }
                                                    reorderLayers(fromIdx, targetIdx);
                                                }
                                                setDragOverIndex(null);
                                                setDraggingIndex(null);
                                                setDropPosition(null);
                                            }}
                                            onClick={(e) => toggleSelectedId(event.id, e.ctrlKey || e.metaKey)}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setContextMenu({
                                                    x: e.clientX,
                                                    y: e.clientY,
                                                    eventId: event.id,
                                                });
                                            }}
                                            className={`group p-2 rounded-lg cursor-grab text-sm flex items-center gap-2 transition-all relative ${selectedIds.has(event.id)
                                                ? "bg-purple-600/30 border border-purple-500/50 text-white"
                                                : "bg-slate-800/50 border border-transparent hover:border-white/10 text-gray-300"
                                                } ${isDragging ? "opacity-40" : ""}`}
                                        >
                                            {/* Drop indicator line - above */}
                                            {isDragOver && dropPosition === "above" && (
                                                <div className="absolute -top-1 left-0 right-0 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] z-50 pointer-events-none" />
                                            )}
                                            {/* Drop indicator line - below */}
                                            {isDragOver && dropPosition === "below" && (
                                                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] z-50 pointer-events-none" />
                                            )}
                                            <span className="shrink-0 cursor-grab" title="Drag to reorder">⋮⋮</span>
                                            <span className="shrink-0">{getIcon()}</span>
                                            <span className="truncate flex-1 capitalize">
                                                {getLabel()}
                                            </span>
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (actualIdx < project.events.length - 1) {
                                                            reorderLayers(actualIdx, actualIdx + 1);
                                                        }
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded text-xs"
                                                    title="Move up"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (actualIdx > 0) {
                                                            reorderLayers(actualIdx, actualIdx - 1);
                                                        }
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded text-xs"
                                                    title="Move down"
                                                >
                                                    ↓
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Center - Canvas & Timeline */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Canvas Area */}
                    <div className="flex-1 relative overflow-hidden">
                        {isProjectEmpty ? (
                            // Show inline AI modal when project is empty
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 overflow-y-auto py-8">
                                <div className="max-w-lg w-full px-4 my-auto">
                                    <AIGenerateModal
                                        isOpen={true}
                                        onClose={() => { }}
                                        isInline={true}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <AddElementToolbar onAIClick={!isProjectEmpty ? () => setIsAIOpen(true) : undefined} />
                                {/* Preview mode toggle button */}
                                <button
                                    onClick={togglePreviewMode}
                                    className={`absolute top-3 right-3 z-20 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shadow-lg ${isPreviewMode
                                        ? 'bg-purple-600 text-white hover:bg-purple-500'
                                        : 'bg-slate-800/90 text-gray-300 hover:text-white hover:bg-slate-700/90 border border-white/10'}`}
                                    title={isPreviewMode ? "Exit Preview Mode" : "Preview Mode (hide all panels)"}
                                >
                                    <span>{isPreviewMode ? '✕' : '👁️'}</span>
                                    <span>{isPreviewMode ? 'Exit Preview' : 'Preview'}</span>
                                </button>
                                <Canvas />
                            </>
                        )}
                    </div>

                    {/* Timeline Resize Handle */}
                    {showTimeline && (
                        <div
                            className="h-1.5 bg-slate-800 cursor-ns-resize flex items-center justify-center hover:bg-slate-700 transition-colors"
                            onMouseDown={handleTimelineDrag}
                        >
                            <div className="w-10 h-1 bg-slate-600 rounded-full" />
                        </div>
                    )}

                    {/* Timeline */}
                    {showTimeline && (
                        <div
                            className="border-t border-white/10 shrink-0"
                            style={{ height: `${timelineHeight}px` }}
                        >
                            <Timeline onHide={() => setShowTimeline(false)} />
                        </div>
                    )}

                    {/* Floating Play Button when Timeline is hidden */}
                    {!showTimeline && !isProjectEmpty && (
                        <FloatingPlayButton />
                    )}
                </div>

                {/* Right Sidebar - Properties */}
                {showProperties && (
                    <div className="w-72 border-l border-white/10 bg-slate-900/30 shrink-0">
                        <PropertyPanel onHide={() => setShowProperties(false)} />
                    </div>
                )}
            </div>

            {/* Export Modal */}
            <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} saveProject={saveProject} />

            {/* AI Generate Modal (for non-empty projects) */}
            {
                !isProjectEmpty && (
                    <>
                        <AIGenerateModal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} appendMode={true} />
                    </>
                )
            }

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    eventId={contextMenu.eventId}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div >
    );
}
