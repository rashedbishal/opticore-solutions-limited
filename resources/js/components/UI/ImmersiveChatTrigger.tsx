"use client";

import { motion } from "framer-motion";
import { Bot, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImmersiveChatTriggerProps {
    onClick: () => void;
    isOpen: boolean;
    className?: string;
}

export default function ImmersiveChatTrigger({ onClick, isOpen, className }: ImmersiveChatTriggerProps) {
    return (
        <div className={cn("relative group", className)}>
            {/* AI Pulse Glow */}
            {!isOpen && (
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-0 rounded-full bg-linear-to-tr from-violet-600 to-cyan-500 blur-xl"
                />
            )}

            <motion.button
                onClick={onClick}
                whileHover={{ scale: 1.1, rotate: isOpen ? 90 : 0 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                    "relative h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all duration-500 overflow-hidden",
                    isOpen
                        ? "bg-zinc-900 border border-white/5"
                        : "bg-linear-to-br from-violet-600 via-violet-500 to-cyan-500 border border-violet-400/30 ring-1 ring-white/10 ring-inset"
                )}
            >
                {/* Rotating Shine Effect (only when closed) */}
                {!isOpen && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(255,255,255,0.4)_360deg)] opacity-40"
                    />
                )}

                {/* Button Content */}
                <div className="relative z-10 flex items-center justify-center ">
                    {isOpen ? (
                        <X className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-400" />
                    ) : (
                        <div className="relative">
                            <Bot className="h-8 w-8 sm:h-9 sm:w-9 text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.2)]" />
                            {/* AI Badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-white text-[7px] sm:text-[8px] font-black text-violet-600 shadow-lg border border-violet-100"
                            >
                                AI
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Internal Radial Glow */}
                {!isOpen && (
                    <div className="absolute inset-0 bg-radial-to-br from-white/20 to-transparent pointer-events-none" />
                )}
                
                {/* Magnetic Hover Effect Background */}
                <motion.div 
                    initial={false}
                    className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                />
            </motion.button>
        </div>
    );
}
