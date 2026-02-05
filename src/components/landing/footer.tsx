"use client";

import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-black/40 border-t border-white/5 py-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <span className="text-lg">🎬</span>
                            </div>
                            <span className="text-xl font-bold text-white">Videographic</span>
                        </Link>
                        <p className="text-gray-400 max-w-sm">
                            The easiest way to create professional videos from text.
                            Powered by AI, built for creators.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Product</h4>
                        <ul className="space-y-2">
                            <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Videographic. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="text-gray-500 hover:text-white transition-colors">Twitter</a>
                        <a href="#" className="text-gray-500 hover:text-white transition-colors">GitHub</a>
                        <a href="#" className="text-gray-500 hover:text-white transition-colors">Discord</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
