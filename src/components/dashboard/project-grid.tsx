"use client";

import { VideoProject } from "@/lib/types/project";
import { ProjectCard } from "./project-card";

interface ProjectGridProps {
    projects: VideoProject[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
    if (projects.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🎬</span>
                </div>
                <h3 className="text-xl text-white font-semibold">No projects yet</h3>
                <p className="text-gray-400 mt-2">
                    Create your first video to get started
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
}
