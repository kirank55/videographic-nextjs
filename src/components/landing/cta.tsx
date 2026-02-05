"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface CTAProps {
    isLoggedIn: boolean;
}

export function CTA({ isLoggedIn }: CTAProps) {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-linear-to-r from-purple-900/50 to-pink-900/50" />
            <div className="absolute inset-0 animated-gradient opacity-30" />

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-bold text-white mb-6"
                >
                    Ready to Create Your First Video?
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-gray-300 mb-10"
                >
                    Join thousands of creators making stunning content with Videographic.
                    Start for free, no credit card required.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <Link
                        href={isLoggedIn ? "/dashboard" : "/login"}
                        className="inline-flex px-8 py-4 bg-white text-purple-900 font-bold rounded-2xl hover:bg-gray-100 transition-colors shadow-xl"
                    >
                        Start Creating Now
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
