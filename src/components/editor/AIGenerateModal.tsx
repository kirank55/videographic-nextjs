"use client";

import { useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import type { TimelineEvent } from "@/lib/schemas/timeline";

interface AIGenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    appendMode?: boolean; // If true, append events to existing project instead of replacing
    isInline?: boolean; // If true, render without modal overlay
}

type StyleOption = "minimal" | "corporate" | "playful" | "cinematic";
type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";

const STYLE_OPTIONS: { value: StyleOption; label: string; icon: string }[] = [
    { value: "minimal", label: "Minimal", icon: "◯" },
    { value: "corporate", label: "Corporate", icon: "◼" },
    { value: "playful", label: "Playful", icon: "★" },
    { value: "cinematic", label: "Cinematic", icon: "◈" },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string; dims: { w: number; h: number } }[] = [
    { value: "16:9", label: "16:9 Landscape", dims: { w: 1920, h: 1080 } },
    { value: "9:16", label: "9:16 Portrait", dims: { w: 1080, h: 1920 } },
    { value: "1:1", label: "1:1 Square", dims: { w: 1080, h: 1080 } },
    { value: "4:3", label: "4:3 Standard", dims: { w: 1440, h: 1080 } },
];

const DURATION_OPTIONS: { value: number; label: string; desc: string }[] = [
    { value: 5, label: "5s", desc: "Quick intro" },
    { value: 10, label: "10s", desc: "Short intro" },
    { value: 15, label: "15s", desc: "Short promo" },
    { value: 30, label: "30s", desc: "Explainer" },
];


export function AIGenerateModal({ isOpen, onClose, appendMode = false, isInline = false }: AIGenerateModalProps) {
    const { setProject, project, addEvent, currentTime } = useEditorStore();
    const [prompt, setPrompt] = useState("");
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<string>("");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [duration, setDuration] = useState<number>(5);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt describing your video");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setProgress("✨ Generating with MiniMax...");

        // Build enhanced prompt with aspect ratio
        const selectedAspect = ASPECT_RATIOS.find(ar => ar.value === aspectRatio);
        const enhancedPrompt = appendMode
            ? prompt // For append mode, use prompt as-is since we're adding to existing canvas
            : `${prompt}\nUse ${selectedAspect?.dims.w}x${selectedAspect?.dims.h} resolution (${aspectRatio} aspect ratio).`;

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: enhancedPrompt,
                    duration: duration,
                    saveProject: false,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to generate video");
            }

            // Success! Apply the generated content
            setProgress("🎬 Applying to editor...");

            if (appendMode && project) {
                // Append mode: Add new events to existing project
                const newEvents = data.project.events as TimelineEvent[];

                // Calculate the max layer and end time of existing events
                const maxLayer = project.events.length > 0
                    ? Math.max(...project.events.map(e => e.layer)) + 1
                    : 0;

                // Offset new events to start after existing content
                newEvents.forEach((event, index) => {
                    // Generate new unique IDs
                    const newEvent: TimelineEvent = {
                        ...event,
                        id: `ai-${Date.now()}-${index}`,
                        layer: event.layer + maxLayer,
                    };
                    addEvent(newEvent);
                });

                // Update project duration if new content extends beyond current
                const newMaxEndTime = Math.max(
                    project.duration,
                    ...newEvents.map(e => e.startTime + e.duration)
                );
                if (newMaxEndTime > project.duration) {
                    setProject({
                        ...project,
                        duration: newMaxEndTime,
                        events: [...project.events],
                    });
                }
            } else {
                // Replace mode: Set entire project
                const generatedProject = {
                    ...data.project,
                    id: project?.id || data.project.id,
                };
                setProject(generatedProject);
            }

            setProgress("✅ Complete!");
            setTimeout(() => {
                if (!isInline) {
                    onClose();
                }
                setIsGenerating(false);
                setProgress("");
                setPrompt("");
            }, 800);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Generation failed");
            setIsGenerating(false);
            setProgress("");
        }
    };

    if (!isOpen) return null;

    const content = (
        <div className={`bg-slate-900 ${isInline ? '' : 'border border-white/10 rounded-2xl'} p-6 w-full max-w-lg shadow-2xl shadow-purple-500/10 ${isInline ? '' : 'max-h-[90vh] overflow-y-auto'}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                    ✨
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-white">
                        {isInline ? "Create Your Video" : appendMode ? "Add AI Content" : "AI Video Generator"}
                    </h3>
                    <p className="text-sm text-gray-400">
                        {isInline ? "Describe the video you want to create" : "Powered by MiniMax"}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {isGenerating ? (
                <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                        <div className="absolute inset-2 rounded-full bg-linear-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-2xl">
                            ✨
                        </div>
                    </div>
                    <p className="text-gray-300 font-medium">{progress}</p>
                    <p className="text-gray-500 text-sm mt-3">This may take a few seconds...</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Prompt Input */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-medium">Describe your content</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="A product launch intro with animated text and logo reveal..."
                            className="w-full h-28 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                        />
                    </div>

                    {/* Aspect Ratio - only show for non-append mode */}
                    {!appendMode && (
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 font-medium">Aspect Ratio</label>
                            <div className="grid grid-cols-4 gap-2">
                                {ASPECT_RATIOS.map((ar) => (
                                    <button
                                        key={ar.value}
                                        onClick={() => setAspectRatio(ar.value)}
                                        className={`p-2 rounded-xl border text-center transition-all ${aspectRatio === ar.value
                                            ? "bg-purple-600/20 border-purple-500 text-purple-300"
                                            : "bg-slate-800/50 border-white/10 text-gray-400 hover:border-white/20"
                                            }`}
                                    >
                                        <div className="text-xs font-medium">{ar.value}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Duration Selector - only show for non-append mode */}
                    {!appendMode && (
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 font-medium">Duration</label>
                            <div className="grid grid-cols-4 gap-2">
                                {DURATION_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setDuration(opt.value)}
                                        className={`p-2 rounded-xl border text-center transition-all ${duration === opt.value
                                            ? "bg-purple-600/20 border-purple-500 text-purple-300"
                                            : "bg-slate-800/50 border-white/10 text-gray-400 hover:border-white/20"
                                            }`}
                                    >
                                        <div className="text-xs font-medium">{opt.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-3">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                        >
                            {isGenerating ? "✨ Generating..." : "✨ Generate Video"}
                        </button>

                        <button
                            onClick={() => {
                                if (isGenerating) return;
                                setError(null);
                                onClose();
                            }}
                            className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    if (isInline) {
        return content;
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            {content}
        </div>
    );
}
