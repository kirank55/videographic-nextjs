"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function NewProjectButton() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [projectName, setProjectName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (showModal && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [showModal]);

    const handleOpenModal = () => {
        setProjectName("Untitled Project");
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setProjectName("");
    };

    const handleCreate = async () => {
        if (!projectName.trim()) return;

        setIsCreating(true);
        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: projectName.trim(),
                    timeline: [],
                }),
            });

            if (!response.ok) throw new Error("Failed to create project");

            const project = await response.json();
            setShowModal(false);
            router.push(`/editor/${project.id}`);
        } catch (error) {
            console.error("Create failed:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && projectName.trim()) {
            handleCreate();
        } else if (e.key === "Escape") {
            handleCloseModal();
        }
    };

    return (
        <>
            <button
                onClick={handleOpenModal}
                className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
                <span>✨</span>
                New Project
            </button>

            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold text-white mb-4">
                            Create New Project
                        </h2>

                        <div className="mb-6">
                            <label htmlFor="project-name" className="block text-sm text-gray-400 mb-2">
                                Project Name
                            </label>
                            <input
                                ref={inputRef}
                                id="project-name"
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter project name..."
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isCreating || !projectName.trim()}
                                className="flex items-center gap-2 px-5 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                            >
                                {isCreating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Project"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
