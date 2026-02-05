"use client";

import { useState } from "react";
import { VideoExporter } from "@/lib/core";
import type { ExportProgress } from "@/lib/core";
import { useEditorStore } from "@/stores/editor-store";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    saveProject: () => void;
}

type QualityPreset = "standard" | "high" | "ultra";

interface QualityConfig {
    label: string;
    bitrate: number;
    description: string;
}

const QUALITY_PRESETS: Record<QualityPreset, QualityConfig> = {
    standard: {
        label: "Standard",
        bitrate: 5_000_000,
        description: "Good balance of quality and file size"
    },
    high: {
        label: "High",
        bitrate: 10_000_000,
        description: "Higher quality, larger file size"
    },
    ultra: {
        label: "Ultra",
        bitrate: 20_000_000,
        description: "Maximum quality, largest file size"
    }
};

export function ExportModal({ isOpen, onClose, saveProject }: ExportModalProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState<ExportProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check if browser is Firefox
    const isFirefox = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("firefox");

    // Quality preset
    const [quality, setQuality] = useState<QualityPreset>("high");

    // Trim options
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [showTrimOptions, setShowTrimOptions] = useState(false);

    const project = useEditorStore((state) => state.project);

    // Calculate effective duration
    const projectDuration = project?.duration || 0;
    const effectiveStart = Math.max(0, Math.min(trimStart, projectDuration));
    const effectiveEnd = Math.max(0, Math.min(trimEnd, projectDuration - effectiveStart));
    const effectiveDuration = projectDuration - effectiveStart - effectiveEnd;

    // Estimated file size (rough approximation based on bitrate)
    const estimatedSizeMB = (QUALITY_PRESETS[quality].bitrate * effectiveDuration / 8 / 1_000_000).toFixed(1);

    const handleExport = async () => {
        if (!project) return;

        if (!VideoExporter.isSupported()) {
            setError("WebCodecs API is not supported in this browser. Please use Chrome 94+ or Edge 94+.");
            return;
        }

        saveProject();
        setIsExporting(true);
        setError(null);
        setProgress(null);

        try {
            const exporter = new VideoExporter();

            // Create a modified project with trim applied
            const trimmedProject = {
                ...project,
                duration: effectiveDuration,
                // Adjust events to account for trim start
                events: project.events
                    .map(event => ({
                        ...event,
                        startTime: event.startTime - effectiveStart,
                    }))
                    .filter(event => {
                        // Keep events that overlap with the trimmed duration
                        const eventEnd = event.startTime + event.duration;
                        return eventEnd > 0 && event.startTime < effectiveDuration;
                    })
                    .map(event => ({
                        ...event,
                        // Clamp start time to 0
                        startTime: Math.max(0, event.startTime),
                        // Adjust duration if event extends beyond trim
                        duration: Math.min(
                            event.duration,
                            effectiveDuration - Math.max(0, event.startTime)
                        ),
                    })),
            };

            await exporter.exportAndDownload({
                project: trimmedProject,
                config: {
                    bitrate: QUALITY_PRESETS[quality].bitrate,
                },
                filename: `${project.name.replace(/\s+/g, "-").toLowerCase()}.mp4`,
                onProgress: (p) => {
                    setProgress(p);
                },
            });

            // Close modal after successful export
            setTimeout(() => {
                onClose();
                setIsExporting(false);
                setProgress(null);
                // Reset options
                setTrimStart(0);
                setTrimEnd(0);
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Export failed");
            setIsExporting(false);
        }
    };

    const getProgressMessage = () => {
        if (!progress) return "";

        switch (progress.phase) {
            case "preparing":
                return "🔧 Initializing encoder...";
            case "rendering":
                return "🎨 Rendering frames...";
            case "encoding":
                return `🎬 Encoding: ${progress.percentage}%`;
            case "muxing":
                return "📦 Creating MP4 file...";
            case "complete":
                return "✅ Export complete!";
            case "error":
                return `❌ Error: ${progress.message}`;
            default:
                return progress.message || "";
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold text-white mb-4">
                    {error ? "Export Failed" : isExporting ? "Exporting Video" : "Export Video"}
                </h3>

                {error ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                            {error}
                        </div>
                        <button
                            onClick={() => {
                                setError(null);
                                onClose();
                            }}
                            className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : isExporting ? (
                    <div className="space-y-4">
                        {/* Progress bar */}
                        <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-0 bg-linear-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-300"
                                style={{
                                    width: `${progress?.percentage || 0}%`,
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmer 2s linear infinite'
                                }}
                            />
                        </div>

                        {/* Progress message */}
                        <p className="text-gray-300 text-sm text-center font-medium">{getProgressMessage()}</p>

                        {/* Frame counter */}
                        {progress && progress.totalFrames > 0 && (
                            <p className="text-gray-500 text-xs text-center">
                                Frame {progress.currentFrame} of {progress.totalFrames}
                            </p>
                        )}

                        {/* Duration info */}
                        <p className="text-gray-600 text-xs text-center">
                            Exporting {formatTime(effectiveDuration)} at {QUALITY_PRESETS[quality].label} quality
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {isFirefox && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
                                ⚠️ For best export quality, we recommend using Chrome or Edge browsers. Firefox may produce lower quality exports due to limited WebCodecs support.
                            </div>
                        )}
                        <p className="text-gray-400 text-sm">
                            Export your video as a high-quality MP4 file using H.264 encoding.
                        </p>

                        {/* Duration Info */}
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                            <span className="text-sm text-gray-400">Video Duration</span>
                            <span className="text-sm text-white font-mono">
                                {formatTime(effectiveDuration)}
                            </span>
                        </div>

                        {/* Quality Selection */}
                        <div className="space-y-2">
                            <span className="text-sm text-gray-400">Quality Preset</span>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.entries(QUALITY_PRESETS) as [QualityPreset, QualityConfig][]).map(([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() => setQuality(key)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${quality === key
                                            ? "bg-linear-to-r from-purple-600 to-pink-600 text-white"
                                            : "bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white"
                                            }`}
                                    >
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">
                                {QUALITY_PRESETS[quality].description} • ~{estimatedSizeMB} MB
                            </p>
                        </div>

                        {/* Trim Options Toggle */}
                        <button
                            onClick={() => setShowTrimOptions(!showTrimOptions)}
                            className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 border border-dashed border-white/10 rounded-lg hover:border-white/20"
                        >
                            <span>✂️</span>
                            <span>{showTrimOptions ? "Hide Trim Options" : "Trim Video"}</span>
                            <span>{showTrimOptions ? "▼" : "▶"}</span>
                        </button>

                        {/* Trim Options */}
                        {showTrimOptions && (
                            <div className="space-y-3 p-4 bg-slate-800/30 rounded-lg border border-white/5">
                                <p className="text-xs text-gray-500">
                                    Skip time from the start or end of the video
                                </p>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 flex justify-between">
                                        <span>Skip from Start</span>
                                        <span className="text-purple-400">{formatTime(trimStart)}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max={projectDuration - trimEnd - 0.1}
                                        step="0.1"
                                        value={trimStart}
                                        onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                                        className="w-full accent-purple-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 flex justify-between">
                                        <span>Skip from End</span>
                                        <span className="text-purple-400">{formatTime(trimEnd)}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max={projectDuration - trimStart - 0.1}
                                        step="0.1"
                                        value={trimEnd}
                                        onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                                        className="w-full accent-purple-500"
                                    />
                                </div>

                                <div className="flex justify-between text-xs pt-2 border-t border-white/10">
                                    <span className="text-gray-500">Original: {formatTime(projectDuration)}</span>
                                    <span className="text-green-400">Final: {formatTime(effectiveDuration)}</span>
                                </div>

                                {(trimStart > 0 || trimEnd > 0) && (
                                    <button
                                        onClick={() => {
                                            setTrimStart(0);
                                            setTrimEnd(0);
                                        }}
                                        className="w-full py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                                    >
                                        Reset Trim
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={effectiveDuration <= 0}
                                className="flex-1 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-500 hover:to-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Export MP4
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Shimmer animation for progress bar */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
