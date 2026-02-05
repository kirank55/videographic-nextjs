"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export function UserButton() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!session?.user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
            >
                <div className="text-right hidden sm:block mr-2">
                    <p className="text-sm font-medium text-white leading-none">{session.user.name}</p>
                </div>
                {session.user.image ? (
                    <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={36}
                        height={36}
                        className="rounded-full ring-2 ring-white/10"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold ring-2 ring-white/10">
                        {session.user.name?.[0] || "U"}
                    </div>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-2xl py-2 z-50 overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                            <p className="text-sm font-semibold text-white truncate">
                                {session.user.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-1">
                                {session.user.email}
                            </p>
                        </div>

                        <div className="p-1">
                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 rounded-lg transition-colors"
                            >
                                <span>🚪</span>
                                Sign out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
