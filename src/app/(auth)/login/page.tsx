import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const session = await auth();

    // Redirect if already logged in
    if (session?.user) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Videographic
                    </h1>
                    <p className="text-gray-400 mt-2">Sign in to continue</p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
