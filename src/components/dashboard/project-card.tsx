"use client";

import { VideoProject } from "@/lib/types/project";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProjectCardProps {
    project: VideoProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this project?")) return;

        setIsDeleting(true);
        try {
            await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
            router.refresh();
        } catch (error) {
            console.error("Delete failed:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDuplicate = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`/api/projects/${project.id}/duplicate`, { method: "POST" });
            router.refresh();
        } catch (error) {
            console.error("Duplicate failed:", error);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div
            onClick={() => router.push(`/editor/${project.id}`)}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-purple-500/50 hover:bg-white/10 transition-all group"
        >
            {/* Thumbnail */}
            <div className="aspect-video bg-linear-to-br from-purple-900/50 to-pink-900/50 relative">
                {project.thumbnail ? (
                    <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-50">🎬</span>
                    </div>
                )}

                {/* Status badge */}
                <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400"
                            : project.status === "RENDERING"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-white/10 text-gray-400"
                        }`}>
                        {project.status.toLowerCase()}
                    </span>
                </div>

                {/* Menu button */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className="p-2 bg-black/50 rounded-lg hover:bg-black/70 cursor-pointer text-white"
                    >
                        ⋮
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-10">
                            <button
                                onClick={handleDuplicate}
                                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-white/5 cursor-pointer"
                            >
                                📋 Duplicate
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/5 cursor-pointer"
                            >
                                {isDeleting ? "Deleting..." : "🗑️ Delete"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="font-semibold text-white truncate">{project.name}</h3>
                <p className="text-sm text-gray-400 mt-1">
                    {project.duration}s • {project.width}×{project.height}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    Updated {formatDate(project.updatedAt)}
                </p>
            </div>
        </div>
    );
}
