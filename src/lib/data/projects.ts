import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { 
  CreateProjectInput, 
  UpdateProjectInput, 
  VideoProject,
  TimelineEvent 
} from "@/lib/types/project";
import { ProjectStatus } from "@prisma/client";

export async function createProject(data: CreateProjectInput): Promise<VideoProject | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const project = await db.project.create({
    data: {
      name: data.name,
      description: data.description,
      width: data.width || 1920,
      height: data.height || 1080,
      fps: data.fps || 30,
      duration: data.duration || 5.0,
      timeline: (data.timeline || []) as any, // Cast JSON compatibility
      userId: session.user.id,
      status: ProjectStatus.DRAFT,
    },
  });

  return {
    ...project,
    timeline: project.timeline as unknown as TimelineEvent[],
  };
}

export async function getUserProjects(): Promise<VideoProject[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const projects = await db.project.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return projects.map((p) => ({
    ...p,
    timeline: p.timeline as unknown as TimelineEvent[],
  }));
}

export async function getProjectById(
  id: string
): Promise<VideoProject | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const project = await db.project.findUnique({
    where: {
      id,
      userId: session.user.id, // Ensure ownership
    },
  });

  if (!project) return null;

  return {
    ...project,
    timeline: project.timeline as unknown as TimelineEvent[],
  };
}

export async function updateProject(
  id: string,
  data: UpdateProjectInput
): Promise<VideoProject | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const project = await db.project.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        ...data,
        timeline: data.timeline ? (data.timeline as any) : undefined,
      },
    });

    return {
      ...project,
      timeline: project.timeline as unknown as TimelineEvent[],
    };
  } catch (error) {
    return null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  try {
    await db.project.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function duplicateProject(id: string): Promise<VideoProject | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const original = await db.project.findFirst({
    where: { 
      id, 
      userId: session.user.id 
    },
  });

  if (!original) return null;

  const project = await db.project.create({
    data: {
      name: `${original.name} (Copy)`,
      description: original.description,
      width: original.width,
      height: original.height,
      fps: original.fps,
      duration: original.duration,
      timeline: original.timeline as any,
      userId: session.user.id,
      status: ProjectStatus.DRAFT,
    },
  });

  return {
    ...project,
    timeline: project.timeline as unknown as TimelineEvent[],
  };
}