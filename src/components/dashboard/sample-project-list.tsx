"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SAMPLE_PROJECTS } from "@/lib/samples";
import { motion } from "framer-motion";

export function SampleProjectList() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleCreateFromSample = (sampleId: string) => {
        startTransition(async () => {
            try {
                const response = await fetch("/api/samples/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sampleId }),
                });

                if (!response.ok) throw new Error("Failed to import sample");

                const project = await response.json();
                router.push(`/editor/${project.id}`);
                router.refresh();
            } catch (error) {
                console.error(error);
                alert("Failed to create project from sample");
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_PROJECTS.map((sample, index) => (
                <motion.button
                    key={sample.id}
                    onClick={() => handleCreateFromSample(sample.id)}
                    disabled={isPending}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group text-left h-full bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all rounded-xl overflow-hidden"
                >
                    <div className="aspect-video bg-linear-to-br from-purple-900/50 to-indigo-900/50 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-500">
                        <div className="text-4xl">🎬</div>
                        {/* Simple preview overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white font-medium text-sm px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">Use Template</span>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-white truncate">{sample.name}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/10 text-gray-400">
                                {sample.category}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2">{sample.description}</p>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}
