import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserProjects } from "@/lib/data/projects";
import { UserButton } from "@/components/auth/user-button";
import { ProjectGrid } from "@/components/dashboard/project-grid";
import { NewProjectButton } from "@/components/dashboard/new-project-button";
import { SampleProjectList } from "@/components/dashboard/sample-project-list";

export const runtime = "nodejs";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const projects = await getUserProjects();

    return (
        <div className="min-h-screen bg-slate-900">
            <header className="border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Videographic
                    </h1>
                    <UserButton />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white">
                            Welcome back, {session.user.name?.split(" ")[0]}! 👋
                        </h2>
                        <p className="text-gray-400 mt-2">
                            {projects.length === 0
                                ? "Create your first video project"
                                : `You have ${projects.length} project${projects.length === 1 ? "" : "s"}`}
                        </p>
                    </div>
                    <NewProjectButton />
                </div>

                {/* Samples Section */}
                {/* <div className="mb-12">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>✨</span> Start with a Template
                    </h3>
                    <SampleProjectList />
                </div> */}

                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Your Projects</h3>
                </div>

                <ProjectGrid projects={projects} />

                {/* <div className="mt-12 pt-8 border-t border-white/5">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-2xl font-bold text-white">{projects.length}</p>
                            <p className="text-xs text-gray-400">Total Projects</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-2xl font-bold text-white">0</p>
                            <p className="text-xs text-gray-400">Videos Rendered</p>
                        </div>
                    </div>
                </div> */}
            </main>
        </div>
    );
}
