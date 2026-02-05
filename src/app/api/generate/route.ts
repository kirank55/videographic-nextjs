import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateWithOpenRouter, OPENROUTER_MODELS, GenerationResult } from "@/lib/ai";
import { createProject } from "@/lib/data/projects";

export const runtime = "nodejs";

interface GenerateRequest {
  prompt: string;
  duration?: number; // Video duration in seconds
  saveProject?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();

    if (!body.prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Use MiniMax model from OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured. Add OPENROUTER_API_KEY to your .env.local file." },
        { status: 500 }
      );
    }

    const duration = body.duration || 5;
    const model = OPENROUTER_MODELS["minimax-m2.1"];

    const result: GenerationResult = await generateWithOpenRouter(
      body.prompt,
      apiKey,
      model,
      duration
    );

    if (!result.success || !result.project) {
      return NextResponse.json(
        { error: result.error || "Failed to generate project" },
        { status: 500 }
      );
    }

    // Automatically save project if requested
    if (body.saveProject) {
      const savedProject = await createProject({
        name: result.project.name || "Generated Project",
        description: result.project.description,
        width: result.project.width,
        height: result.project.height,
        fps: result.project.fps,
        duration: result.project.duration,
        timeline: result.project.events as any,
      });

      if (!savedProject) {
         return NextResponse.json(
            { error: "Failed to save generated project to database" },
            { status: 500 }
         );
      }

      return NextResponse.json({ ...result, project: savedProject });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
