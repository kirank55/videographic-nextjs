"use client";

import { useState, useEffect, useCallback } from "react";
import { VideoProject, CreateProjectInput, UpdateProjectInput } from "@/lib/types/project";

export function useProjects() {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create project
  const createProject = useCallback(async (input: CreateProjectInput) => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Failed to create project");
    const project = await response.json();
    setProjects((prev) => [project, ...prev]);
    return project;
  }, []);

  // Update project
  const updateProject = useCallback(async (id: string, input: UpdateProjectInput) => {
    const response = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Failed to update project");
    const project = await response.json();
    setProjects((prev) => prev.map((p) => (p.id === id ? project : p)));
    return project;
  }, []);

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete project");
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Duplicate project
  const duplicateProject = useCallback(async (id: string) => {
    const response = await fetch(`/api/projects/${id}/duplicate`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to duplicate project");
    const project = await response.json();
    setProjects((prev) => [project, ...prev]);
    return project;
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    refresh: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
  };
}
