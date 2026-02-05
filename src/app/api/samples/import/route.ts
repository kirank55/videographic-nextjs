import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createProject } from "@/lib/data/projects";
import { getSampleProject } from "@/lib/samples";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sampleId } = body;

    if (!sampleId) {
      return NextResponse.json(
        { error: "Sample ID is required" },
        { status: 400 }
      );
    }

    const sample = getSampleProject(sampleId);
    if (!sample) {
      return NextResponse.json(
        { error: "Sample project not found" },
        { status: 404 }
      );
    }

    const project = await createProject({
      name: sample.project.name,
      description: sample.project.description,
      width: sample.project.width,
      height: sample.project.height,
      fps: sample.project.fps,
      duration: sample.project.duration,
      timeline: sample.project.events as any,
    });

    if (!project) {
        return NextResponse.json(
          { error: "Failed to create project from sample" },
          { status: 500 }
        );
      }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error importing sample:", error);
    return NextResponse.json(
      { error: "Failed to import sample" },
      { status: 500 }
    );
  }
}
