import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProjectById } from "@/lib/data/projects";
import { EditorClient } from "@/components/editor/EditorClient";

export const runtime = "nodejs";

interface EditorPageProps {
    params: Promise<{ projectId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { projectId } = await params;
    const project = await getProjectById(projectId);

    if (!project) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
                <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
                <Link href="/dashboard" className="text-purple-400 hover:underline">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    // Convert database VideoProject to editor VideoProject format
    // DB uses 'timeline' array, editor uses 'events' array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorProject: any = {
        id: project.id,
        name: project.name,
        description: project.description || undefined,
        width: project.width,
        height: project.height,
        fps: project.fps,
        duration: project.duration,
        backgroundColor: "#000000",
        events: project.timeline.map((event, index) => ({
            ...event,
            layer: index,
            properties: event.properties,
            animations: event.animations || [],
        })),
    };

    return <EditorClient project={editorProject} />;
}
