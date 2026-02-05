"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface NavbarProps {
    isLoggedIn: boolean;
}

export function Navbar({ isLoggedIn }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-3" : "bg-transparent py-6"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <span className="text-xl">🎬</span>
                    </div>
                    <span className="text-xl font-bold gradient-text">Videographic</span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                        Features
                    </Link>
                    <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                        How it Works
                    </Link>
                    <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                        Pricing
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <Link
                            href="/dashboard"
                            className="px-6 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="px-6 py-2.5 text-gray-300 hover:text-white transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/login"
                                className="px-6 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Get Started Free
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}
