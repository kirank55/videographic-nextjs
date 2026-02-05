"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface HeroProps {
    isLoggedIn: boolean;
}

export function Hero({ isLoggedIn }: HeroProps) {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 animated-gradient opacity-50" />

            {/* Gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/30 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-gray-300 mb-8">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Now with AI-powered generation
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
                >
                    Create Stunning Videos
                    <br />
                    <span className="gradient-text">From Text</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xl text-gray-300 max-w-2xl mx-auto mb-10"
                >
                    Transform your ideas into professional videos in seconds.
                    Just describe what you want, and our AI handles the rest.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        href={isLoggedIn ? "/dashboard" : "/login"}
                        className="group px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:opacity-90 transition-all glow flex items-center gap-2"
                    >
                        Start Creating Free
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                    <Link
                        href="#how-it-works"
                        className="px-8 py-4 glass text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors"
                    >
                        Watch Demo
                    </Link>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex items-center justify-center gap-12 mt-16 pt-16 border-t border-white/10"
                >
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white">10K+</div>
                        <div className="text-gray-400">Videos Created</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white">5K+</div>
                        <div className="text-gray-400">Happy Users</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white">4.9/5</div>
                        <div className="text-gray-400">User Rating</div>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-1.5 h-1.5 bg-white rounded-full"
                    />
                </div>
            </motion.div>
        </section>
    );
}
