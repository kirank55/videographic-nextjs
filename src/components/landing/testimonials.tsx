"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const testimonials = [
    {
        name: "Sarah Johnson",
        role: "Content Creator",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
        content: "Videographic has completely transformed how I create content. What used to take hours now takes minutes!",
    },
    {
        name: "Michael Chen",
        role: "Marketing Manager",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
        content: "The AI generation is incredible. I just describe what I want and it creates exactly what I imagined.",
    },
    {
        name: "Emily Davis",
        role: "Freelance Designer",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
        content: "Finally, a video tool that's both powerful and easy to use. My clients are amazed by the results.",
    },
];

export function Testimonials() {
    return (
        <section className="py-24 bg-background">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Loved by <span className="gradient-text">Creators</span>
                    </h2>
                    <p className="text-xl text-gray-400">
                        See what our users are saying
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="glass rounded-2xl p-8"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <Image
                                    src={testimonial.image}
                                    alt={testimonial.name}
                                    width={48}
                                    height={48}
                                    className="rounded-full"
                                />
                                <div>
                                    <div className="font-semibold text-white">{testimonial.name}</div>
                                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                                </div>
                            </div>
                            <p className="text-gray-300 leading-relaxed">"{testimonial.content}"</p>
                            <div className="flex gap-1 mt-4">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="text-yellow-400">★</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
