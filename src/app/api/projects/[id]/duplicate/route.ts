import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { duplicateProject } from "@/lib/data/projects";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/projects/:id/duplicate - Duplicate project
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;
    const project = await duplicateProject(id);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error duplicating project:", error);
    return NextResponse.json(
      { error: "Failed to duplicate project" },
      { status: 500 }
    );
  }
}
