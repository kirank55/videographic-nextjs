"use client";

import { useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import type { TimelineEvent } from "@/lib/schemas/timeline";

interface AddElementToolbarProps {
    onAIClick?: () => void;
}

export function AddElementToolbar({ onAIClick }: AddElementToolbarProps) {
    const { project, addEvent, currentTime } = useEditorStore();
    const [showMenu, setShowMenu] = useState(false);

    if (!project) return null;

    const addText = () => {
        const event: TimelineEvent = {
            id: `text-${Date.now()}`,
            type: "text",
            startTime: currentTime,
            duration: 2,
            layer: project.events.length,
            properties: {
                text: "New Text",
                fontSize: 64,
                fontFamily: "Inter",
                fontWeight: "bold",
                fontStyle: "normal",
                fill: "#ffffff",
                x: project.width / 2,
                y: project.height / 2,
                textAlign: "center",
                opacity: 1,
                rotation: 0,
            },
        };
        addEvent(event);
        setShowMenu(false);
    };

    const addShape = (shapeType: "rect" | "circle") => {
        const event: TimelineEvent = {
            id: `shape-${Date.now()}`,
            type: "shape",
            startTime: currentTime,
            duration: 2,
            layer: project.events.length,
            properties: {
                shapeType,
                x: project.width / 2,
                y: project.height / 2,
                width: 150,
                height: 150,
                radius: 75,
                fill: "#8b5cf6",
                opacity: 1,
                rotation: 0,
            },
        };
        addEvent(event);
        setShowMenu(false);
    };

    const addImage = () => {
        const event: TimelineEvent = {
            id: `image-${Date.now()}`,
            type: "image",
            startTime: currentTime,
            duration: 3,
            layer: project.events.length,
            properties: {
                src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format",
                x: project.width / 2,
                y: project.height / 2,
                width: 400,
                height: 300,
                opacity: 1,
                rotation: 0,
                fit: "cover",
            },
        };
        addEvent(event);
        setShowMenu(false);
    };

    const addAudio = () => {
        const event: TimelineEvent = {
            id: `audio-${Date.now()}`,
            type: "audio",
            startTime: currentTime,
            duration: 5,
            layer: -1, // Audio tracks are separate
            properties: {
                volume: 1,
                isVoiceover: false,
                isMuted: false,
            },
        };
        addEvent(event);
        setShowMenu(false);
    };

    const addBackground = () => {
        const event: TimelineEvent = {
            id: `bg-${Date.now()}`,
            type: "background",
            startTime: 0,
            duration: project.duration,
            layer: 0,
            properties: {
                type: "solid",
                color: "#1a1a2e",
            },
        };
        addEvent(event);
        setShowMenu(false);
    };

    const elements = [
        { icon: "📝", label: "Text", action: addText, description: "Add text element" },
        { icon: "⬜", label: "Rectangle", action: () => addShape("rect"), description: "Add rectangle shape" },
        { icon: "⚪", label: "Circle", action: () => addShape("circle"), description: "Add circle shape" },
        { icon: "🖼️", label: "Image", action: addImage, description: "Add image element" },
        { icon: "🔊", label: "Audio", action: addAudio, description: "Add audio track" },
        { icon: "🎨", label: "Background", action: addBackground, description: "Add background" },
    ];

    return (
        <div className="absolute top-4 left-4 z-10">
            {/* Main Add Button */}
            <div className="relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={`group p-3 backdrop-blur-sm border rounded-xl transition-all duration-200 text-lg flex items-center gap-2 ${showMenu
                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                        : "bg-slate-800/80 border-white/10 hover:bg-slate-700/80 hover:border-white/20"
                        }`}
                    title="Add Element"
                >
                    <span className={`transition-transform duration-200 ${showMenu ? "rotate-45" : ""}`}>+</span>
                    <span className="text-sm font-medium">Add Element</span>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0"
                            onClick={() => setShowMenu(false)}
                        />

                        {/* Menu */}
                        <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-y-scroll animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-2 space-y-1 h-75">
                                <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                    Visual Elements
                                </div>
                                {elements.slice(0, 4).map((element) => (
                                    <button
                                        key={element.label}
                                        onClick={element.action}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                                    >
                                        <span className="text-lg">{element.icon}</span>
                                        <div className="text-left">
                                            <div className="text-sm text-white font-medium">{element.label}</div>
                                            <div className="text-[10px] text-gray-500">{element.description}</div>
                                        </div>
                                    </button>
                                ))}

                                <div className="h-px bg-white/10 my-2" />

                                <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                    Media & Background
                                </div>
                                {elements.slice(4).map((element) => (
                                    <button
                                        key={element.label}
                                        onClick={element.action}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                                    >
                                        <span className="text-lg">{element.icon}</span>
                                        <div className="text-left">
                                            <div className="text-sm text-white font-medium">{element.label}</div>
                                            <div className="text-[10px] text-gray-500">{element.description}</div>
                                        </div>
                                    </button>
                                ))}

                                {/* AI Magic Section */}
                                {onAIClick && (
                                    <>
                                        <div className="h-px bg-white/10 my-2" />
                                        <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                            AI Generation
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                onAIClick();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-linear-to-r hover:from-violet-600/20 hover:to-fuchsia-600/20 transition-colors group border border-transparent hover:border-violet-500/30"
                                        >
                                            <span className="text-lg">✨</span>
                                            <div className="text-left">
                                                <div className="text-sm font-medium bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">AI Magic</div>
                                                <div className="text-[10px] text-gray-500">Generate with AI</div>
                                            </div>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Quick Action Buttons (visible when menu is closed) */}
            {/* {!showMenu && (
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={addText}
                        className="p-2.5 bg-slate-800/80 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-slate-700/80 hover:border-white/20 transition-all text-sm"
                        title="Add Text"
                    >
                        📝
                    </button>
                    <button
                        onClick={() => addShape("rect")}
                        className="p-2.5 bg-slate-800/80 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-slate-700/80 hover:border-white/20 transition-all text-sm"
                        title="Add Rectangle"
                    >
                        ⬜
                    </button>
                    <button
                        onClick={() => addShape("circle")}
                        className="p-2.5 bg-slate-800/80 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-slate-700/80 hover:border-white/20 transition-all text-sm"
                        title="Add Circle"
                    >
                        ⚪
                    </button>
                </div>
            )} */}
        </div>
    );
}
