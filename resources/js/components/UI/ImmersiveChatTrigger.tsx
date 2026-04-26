"use client";

import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { Bot, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImmersiveChatTriggerProps {
    onClick: () => void;
    isOpen: boolean;
    isDancing?: boolean;
    className?: string;
}

export default function ImmersiveChatTrigger({ 
    onClick, 
    isOpen, 
    isDancing = false,
    className 
}: ImmersiveChatTriggerProps) {

    // Subtle scaling pulse animation variants
    const attentionVariants: Variants = {
        idle: { scale: 1, y: 0, rotate: 0 },
        attention: {
            scale: [1, 1.18, 1],
            transition: {
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1],
            }
        }
        };

        return (
        <div className={cn("relative group", className)}>
            {/* AI Pulse Glow */}
            {!isOpen && (
                <motion.div
                    animate={isDancing ? { scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] } : {
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: isDancing ? 1.2 : 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.5, 1],
                    }}                    className="absolute inset-0 rounded-full bg-linear-to-tr from-violet-600 to-cyan-500 blur-xl"
                />
            )}

            <motion.button
                onClick={onClick}
                variants={attentionVariants}
                animate={isDancing && !isOpen ? "attention" : "idle"}
                whileHover={{ scale: 1.1, rotate: isOpen ? 90 : 0 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                    "relative h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center text-white shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all duration-500",
                    isOpen
                        ? "bg-zinc-900 ring-1 ring-inset ring-white/5 rounded-full"
                        : "bg-linear-to-br from-violet-600 via-violet-500 to-cyan-500 ring-1 ring-inset ring-violet-400/30 rounded-full"
                )}
            >
                {/* Background effects (Clipped) */}
                <div className="absolute -inset-px rounded-full overflow-hidden pointer-events-none">
                    {!isOpen && (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(255,255,255,0.4)_360deg)] opacity-40"
                            />
                            <div className="absolute inset-0 bg-radial-to-br from-white/20 to-transparent" />
                        </>
                    )}
                    <motion.div 
                        initial={false}
                        className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </div>

                {/* Button Content */}
                <div className="relative z-10 flex items-center justify-center h-full w-full">
                    {isOpen ? (
                        <X className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-400" />
                    ) : (
                        <div className="relative">
                            <Bot className="h-8 w-8 sm:h-12 sm:w-12 text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.2)]" />
                            {/* AI Badge - Now Overflowing */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-3.5 -right-2.5 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white text-[10px] sm:text-[11px] font-black text-violet-600 shadow-lg border border-violet-100 z-20"
                            >
                                AI
                            </motion.div>
                        </div>
                    )}
                </div>
            </motion.button>
        </div>
    );
}
