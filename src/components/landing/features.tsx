"use client";

import { motion } from "framer-motion";

const features = [
    {
        icon: "✨",
        title: "AI-Powered Generation",
        description: "Describe your video in plain text and watch AI bring it to life with stunning visuals and animations.",
    },
    {
        icon: "🎨",
        title: "Professional Templates",
        description: "Start with beautiful pre-built templates or create your own custom designs from scratch.",
    },
    {
        icon: "⚡",
        title: "Lightning Fast",
        description: "Export videos in seconds using cutting-edge WebCodecs technology - all in your browser.",
    },
    {
        icon: "🎬",
        title: "Studio Editor",
        description: "Fine-tune every detail with our powerful timeline editor, animations, and property controls.",
    },
    {
        icon: "☁️",
        title: "Cloud Projects",
        description: "Your projects are saved securely in the cloud. Access them from any device, anytime.",
    },
    {
        icon: "🔒",
        title: "Private & Secure",
        description: "All processing happens locally in your browser. Your content stays private.",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-background">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Everything You Need to Create
                        <span className="gradient-text"> Amazing Videos</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Powerful features that make video creation effortless
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300"
                        >
                            <div className="w-14 h-14 rounded-xl bg-linear-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
