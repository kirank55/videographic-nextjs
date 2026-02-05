"use client";

import { motion } from "framer-motion";

const steps = [
    {
        number: "01",
        title: "Describe Your Video",
        description: "Type a description of the video you want to create. Be as detailed or simple as you like.",
        image: "📝",
    },
    {
        number: "02",
        title: "AI Generates Your Scene",
        description: "Our AI analyzes your prompt and creates a complete video scene with animations and effects.",
        image: "🤖",
    },
    {
        number: "03",
        title: "Customize in Editor",
        description: "Fine-tune colors, text, timing, and animations in our intuitive studio editor.",
        image: "🎨",
    },
    {
        number: "04",
        title: "Export & Share",
        description: "Download your video as a high-quality MP4 file, ready to share anywhere.",
        image: "🚀",
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-muted/30">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Create Videos in <span className="gradient-text">4 Simple Steps</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        From idea to finished video in minutes
                    </p>
                </motion.div>

                <div className="relative">
                    {/* Connection line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-linear-to-r from-purple-600 to-pink-600 -translate-y-1/2" />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                className="relative"
                            >
                                {/* Step card */}
                                <div className="glass rounded-2xl p-6 text-center">
                                    {/* Number badge */}
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-linear-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                                        {index + 1}
                                    </div>

                                    {/* Icon */}
                                    <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center text-4xl mx-auto mb-6 mt-4">
                                        {step.image}
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mb-3">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
