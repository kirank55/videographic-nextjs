"use client";

import { useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import type { Animation } from "@/lib/schemas/timeline";

interface PropertyPanelProps {
    onHide?: () => void;
}

const ANIMATION_TYPES = [
    { value: "opacity", label: "Fade" },
    { value: "scale", label: "Scale" },
    { value: "x", label: "Slide X" },
    { value: "y", label: "Slide Y" },
    { value: "rotation", label: "Rotate" },
];

const EASING_OPTIONS = [
    { value: "linear", label: "Linear" },
    { value: "easeIn", label: "Ease In" },
    { value: "easeOut", label: "Ease Out" },
    { value: "easeInOut", label: "Ease In/Out" },
    { value: "bounce", label: "Bounce" },
];

const TRANSITION_TYPES = [
    { value: "none", label: "None" },
    { value: "fade", label: "Fade" },
    { value: "slideLeft", label: "Slide Left" },
    { value: "slideRight", label: "Slide Right" },
    { value: "slideUp", label: "Slide Up" },
    { value: "slideDown", label: "Slide Down" },
    { value: "scale", label: "Scale" },
    { value: "blur", label: "Blur" },
];

export function PropertyPanel({ onHide }: PropertyPanelProps) {
    const { project, selectedIds, updateEventProperty, updateEvent, deleteEvent, saveToHistory, updateProjectBackgroundColor, centerSelectedEventsHorizontally, centerSelectedEventsVertically } =
        useEditorStore();
    const [showAnimations, setShowAnimations] = useState(true);
    const [showTransitions, setShowTransitions] = useState(false);

    // Get the first selected ID (for single selection)
    const selectedId = selectedIds.size > 0 ? Array.from(selectedIds)[0] : null;
    const selectedEvent = project?.events.find((e) => e.id === selectedId);

    // When nothing is selected, show project-level settings
    if (!selectedEvent) {
        return (
            <div className="h-full overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Project Settings
                    </h3>
                    {onHide && (
                        <button
                            onClick={onHide}
                            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                            title="Hide Properties"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Background Color */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-500">Canvas Background</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={project?.backgroundColor || "#000000"}
                            onChange={(e) => updateProjectBackgroundColor(e.target.value)}
                            className="w-12 h-10 bg-slate-800/50 border border-white/10 rounded cursor-pointer"
                        />
                        <input
                            type="text"
                            value={project?.backgroundColor || "#000000"}
                            onChange={(e) => updateProjectBackgroundColor(e.target.value)}
                            className="flex-1 bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none uppercase"
                            placeholder="#000000"
                        />
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                    <label className="text-xs text-gray-500">Quick Presets</label>
                    <div className="grid grid-cols-4 gap-2">
                        {["#000000", "#0a0a0a", "#1a1a2e", "#16213e", "#0f0e17", "#1f2937", "#111827", "#030712"].map((color) => (
                            <button
                                key={color}
                                onClick={() => updateProjectBackgroundColor(color)}
                                className={`w-full h-8 rounded border transition-all ${project?.backgroundColor === color ? "border-purple-500 ring-2 ring-purple-500/20" : "border-white/10 hover:border-white/20"}`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>

                {/* Project Info */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Resolution</span>
                        <span className="text-gray-300">{project?.width} × {project?.height}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Duration</span>
                        <span className="text-gray-300">{project?.duration}s</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">FPS</span>
                        <span className="text-gray-300">{project?.fps}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Elements</span>
                        <span className="text-gray-300">{project?.events.length || 0}</span>
                    </div>
                </div>

                <div className="pt-4 text-center">
                    <div className="text-3xl mb-2">👆</div>
                    <p className="text-gray-500 text-xs">Select an element to edit its properties</p>
                </div>
            </div>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = selectedEvent.properties as any;

    const handleChange = (property: string, value: unknown) => {
        // If changing a property that has an active animation, update the animation's target values first
        // This prevents animations from overriding manual property changes
        if (selectedEvent.animations && selectedEvent.animations.length > 0) {
            const hasAnimationForProperty = selectedEvent.animations.some(anim => anim.property === property);
            
            if (hasAnimationForProperty && typeof value === 'number') {
                const updatedAnimations = selectedEvent.animations.map(anim => {
                    if (anim.property === property) {
                        // Update both from and to values to the new value
                        // This effectively "freezes" the animation at the new value
                        return { ...anim, from: value, to: value };
                    }
                    return anim;
                });
                updateEvent(selectedEvent.id, { animations: updatedAnimations });
            }
        }
        
        // Then update the property itself
        updateEventProperty(selectedEvent.id, property, value);
    };

    const handleBlur = () => {
        saveToHistory();
    };

    const handleTimingChange = (field: "startTime" | "duration", value: number) => {
        updateEvent(selectedEvent.id, { [field]: value });
    };

    const handleAnimationChange = (index: number, field: keyof Animation, value: unknown) => {
        const animations = [...(selectedEvent.animations || [])];
        animations[index] = { ...animations[index], [field]: value };
        updateEvent(selectedEvent.id, { animations });
    };

    const addAnimation = () => {
        const animations = [...(selectedEvent.animations || [])];
        animations.push({
            property: "opacity",
            from: 0,
            to: 1,
            easing: "easeOut",
        });
        updateEvent(selectedEvent.id, { animations });
        saveToHistory();
    };

    const removeAnimation = (index: number) => {
        const animations = [...(selectedEvent.animations || [])];
        animations.splice(index, 1);
        updateEvent(selectedEvent.id, { animations });
        saveToHistory();
    };

    const handleTransitionChange = (field: string, value: unknown) => {
        const transition = { ...(selectedEvent.transition || { type: "none", duration: 0.5, easing: "easeInOut" }), [field]: value };
        updateEvent(selectedEvent.id, { transition });
    };

    return (
        <div className="h-full overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="capitalize">{selectedEvent.type}</span>
                    <span className="text-purple-400">Properties</span>
                </h3>
                {onHide && (
                    <button
                        onClick={onHide}
                        className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                        title="Hide Properties"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Type badge */}
            <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${selectedEvent.type === "text" ? "bg-blue-500/20 text-blue-400" :
                    selectedEvent.type === "shape" ? "bg-purple-500/20 text-purple-400" :
                        selectedEvent.type === "audio" ? "bg-green-500/20 text-green-400" :
                            selectedEvent.type === "image" ? "bg-orange-500/20 text-orange-400" :
                                "bg-gray-500/20 text-gray-400"
                    }`}>
                    {selectedEvent.type}
                </span>
                <span className="text-xs text-gray-500 truncate">{selectedEvent.id}</span>
            </div>

            {/* Timing */}
            <div className="space-y-2">
                <label className="text-xs text-gray-500 font-medium">Timing</label>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-600">Start (s)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={selectedEvent.startTime}
                            onChange={(e) => handleTimingChange("startTime", parseFloat(e.target.value) || 0)}
                            onBlur={handleBlur}
                            className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-600">Duration (s)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={selectedEvent.duration}
                            onChange={(e) => handleTimingChange("duration", parseFloat(e.target.value) || 0.1)}
                            onBlur={handleBlur}
                            className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Position (for visual elements) */}
            {selectedEvent.type !== "audio" && (
                <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-medium">Position</label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-600">X</label>
                            <input
                                type="number"
                                value={Math.round(props.x || 0)}
                                onChange={(e) => handleChange("x", parseFloat(e.target.value))}
                                onBlur={handleBlur}
                                className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-600">Y</label>
                            <input
                                type="number"
                                value={Math.round(props.y || 0)}
                                onChange={(e) => handleChange("y", parseFloat(e.target.value))}
                                onBlur={handleBlur}
                                className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    {/* Center buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => centerSelectedEventsHorizontally()}
                            className="flex-1 py-1.5 bg-slate-800/50 border border-white/10 rounded text-xs text-gray-400 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center justify-center gap-1"
                            title="Center horizontally"
                        >
                            <span>↔</span>
                            <span>Center X</span>
                        </button>
                        <button
                            onClick={() => centerSelectedEventsVertically()}
                            className="flex-1 py-1.5 bg-slate-800/50 border border-white/10 rounded text-xs text-gray-400 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center justify-center gap-1"
                            title="Center vertically"
                        >
                            <span>↕</span>
                            <span>Center Y</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Opacity (for visual elements) */}
            {selectedEvent.type !== "audio" && (
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-medium">
                        Opacity: {((props.opacity ?? 1) * 100).toFixed(0)}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={props.opacity ?? 1}
                        onChange={(e) => handleChange("opacity", parseFloat(e.target.value))}
                        onMouseUp={handleBlur}
                        className="w-full accent-purple-500"
                    />
                </div>
            )}

            {/* Text-specific properties */}
            {selectedEvent.type === "text" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                    <label className="text-xs text-gray-500 font-medium">Text Properties</label>
                    <div className="space-y-2">
                        <textarea
                            value={props.text || ""}
                            onChange={(e) => handleChange("text", e.target.value)}
                            onBlur={handleBlur}
                            rows={3}
                            placeholder="Enter your text..."
                            className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-600">Font Size</label>
                            <input
                                type="number"
                                min="8"
                                value={props.fontSize || 48}
                                onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
                                onBlur={handleBlur}
                                className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-600">Font Weight</label>
                            <select
                                value={props.fontWeight || "normal"}
                                onChange={(e) => handleChange("fontWeight", e.target.value)}
                                className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                                <option value="100">Thin</option>
                                <option value="300">Light</option>
                                <option value="500">Medium</option>
                                <option value="600">Semibold</option>
                                <option value="800">Extra Bold</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-600">Color</label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={props.fill || "#ffffff"}
                                onChange={(e) => handleChange("fill", e.target.value)}
                                onBlur={handleBlur}
                                className="w-12 h-10 bg-slate-800/50 border border-white/10 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={props.fill || "#ffffff"}
                                onChange={(e) => handleChange("fill", e.target.value)}
                                onBlur={handleBlur}
                                className="flex-1 bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none uppercase"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-600">Text Align</label>
                        <div className="grid grid-cols-3 gap-1">
                            {["left", "center", "right"].map((align) => (
                                <button
                                    key={align}
                                    onClick={() => handleChange("textAlign", align)}
                                    className={`py-2 rounded text-xs ${props.textAlign === align ? "bg-purple-600 text-white" : "bg-slate-800/50 text-gray-400 hover:bg-slate-700/50"}`}
                                >
                                    {align === "left" ? "◀" : align === "center" ? "◆" : "▶"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Shape-specific properties */}
            {selectedEvent.type === "shape" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                    <label className="text-xs text-gray-500 font-medium">Shape Properties</label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-600">Width</label>
                            <input
                                type="number"
                                min="1"
                                value={props.width || 100}
                                onChange={(e) => handleChange("width", parseInt(e.target.value))}
                                onBlur={handleBlur}
                                className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-600">Height</label>
                            <input
                                type="number"
                                min="1"
                                value={props.height || 100}
                                onChange={(e) => handleChange("height", parseInt(e.target.value))}
                                onBlur={handleBlur}
                                className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-600">Corner Radius</label>
                        <input
                            type="number"
                            min="0"
                            value={props.cornerRadius || 0}
                            onChange={(e) => handleChange("cornerRadius", parseInt(e.target.value))}
                            onBlur={handleBlur}
                            className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-600">Fill Color</label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={props.fill || "#8b5cf6"}
                                onChange={(e) => handleChange("fill", e.target.value)}
                                onBlur={handleBlur}
                                className="w-12 h-10 bg-slate-800/50 border border-white/10 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={props.fill || "#8b5cf6"}
                                onChange={(e) => handleChange("fill", e.target.value)}
                                onBlur={handleBlur}
                                className="flex-1 bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none uppercase"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Audio-specific properties */}
            {selectedEvent.type === "audio" && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                    <label className="text-xs text-gray-500 font-medium">Audio Properties</label>
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-600">Source URL</label>
                            <input
                                type="text"
                                value={props.src || ""}
                                onChange={(e) => handleChange("src", e.target.value)}
                                onBlur={handleBlur}
                                placeholder="https://example.com/audio.mp3"
                                className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-600">
                                Volume: {((props.volume ?? 1) * 100).toFixed(0)}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={props.volume ?? 1}
                                onChange={(e) => handleChange("volume", parseFloat(e.target.value))}
                                onMouseUp={handleBlur}
                                className="w-full accent-green-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isVoiceover"
                                checked={props.isVoiceover || false}
                                onChange={(e) => handleChange("isVoiceover", e.target.checked)}
                                className="accent-purple-500"
                            />
                            <label htmlFor="isVoiceover" className="text-xs text-gray-400">Is Voiceover</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isMuted"
                                checked={props.isMuted || false}
                                onChange={(e) => handleChange("isMuted", e.target.checked)}
                                className="accent-purple-500"
                            />
                            <label htmlFor="isMuted" className="text-xs text-gray-400">Muted</label>
                        </div>
                    </div>
                </div>
            )}

            {/* Animations Section */}
            <div className="pt-2 border-t border-white/10">
                <button
                    onClick={() => setShowAnimations(!showAnimations)}
                    className="w-full flex items-center justify-between py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                    <span>Animations ({selectedEvent.animations?.length || 0})</span>
                    <span>{showAnimations ? "▼" : "▶"}</span>
                </button>

                {showAnimations && (
                    <div className="space-y-3 mt-2">
                        {(selectedEvent.animations || []).map((anim, idx) => (
                            <div key={idx} className="bg-slate-800/30 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-purple-400">Animation {idx + 1}</span>
                                    <button
                                        onClick={() => removeAnimation(idx)}
                                        className="text-red-400 hover:text-red-300 text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={anim.property}
                                        onChange={(e) => handleAnimationChange(idx, "property", e.target.value)}
                                        className="bg-slate-700/50 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                                    >
                                        {ANIMATION_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={anim.easing || "easeOut"}
                                        onChange={(e) => handleAnimationChange(idx, "easing", e.target.value)}
                                        className="bg-slate-700/50 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                                    >
                                        {EASING_OPTIONS.map((e) => (
                                            <option key={e.value} value={e.value}>{e.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-600">From</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={anim.from as number}
                                            onChange={(e) => handleAnimationChange(idx, "from", parseFloat(e.target.value))}
                                            className="w-full bg-slate-700/50 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-gray-600">To</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={anim.to as number}
                                            onChange={(e) => handleAnimationChange(idx, "to", parseFloat(e.target.value))}
                                            className="w-full bg-slate-700/50 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={addAnimation}
                            className="w-full py-2 border border-dashed border-white/20 rounded-lg text-xs text-gray-400 hover:text-white hover:border-white/40 transition-colors"
                        >
                            + Add Animation
                        </button>
                    </div>
                )}
            </div>

            {/* Transitions Section */}
            <div className="pt-2 border-t border-white/10">
                <button
                    onClick={() => setShowTransitions(!showTransitions)}
                    className="w-full flex items-center justify-between py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                    <span>Transition</span>
                    <span>{showTransitions ? "▼" : "▶"}</span>
                </button>

                {showTransitions && (
                    <div className="space-y-3 mt-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-600">Type</label>
                            <select
                                value={selectedEvent.transition?.type || "none"}
                                onChange={(e) => handleTransitionChange("type", e.target.value)}
                                className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            >
                                {TRANSITION_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        {selectedEvent.transition?.type !== "none" && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-600">Duration (s)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={selectedEvent.transition?.duration || 0.5}
                                        onChange={(e) => handleTransitionChange("duration", parseFloat(e.target.value))}
                                        className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-600">Easing</label>
                                    <select
                                        value={selectedEvent.transition?.easing || "easeInOut"}
                                        onChange={(e) => handleTransitionChange("easing", e.target.value)}
                                        className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                    >
                                        {EASING_OPTIONS.filter(e => e.value !== "bounce").map((e) => (
                                            <option key={e.value} value={e.value}>{e.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Delete button */}
            <button
                onClick={() => {
                    if (confirm("Delete this element?")) {
                        deleteEvent(selectedEvent.id);
                    }
                }}
                className="w-full py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium mt-4"
            >
                Delete Element
            </button>
        </div>
    );
}
