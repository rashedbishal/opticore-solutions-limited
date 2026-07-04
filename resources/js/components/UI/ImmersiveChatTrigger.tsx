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

    // High-fidelity 3D interaction variants
    const buttonVariants: Variants = {
        idle: { 
            y: 0,
            scale: 1,
            rotate: 0,
            boxShadow: isOpen 
                ? "0 4px 0 rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2)" 
                : "0 6px 0 rgba(124,58,237,0.4), 0 12px 24px rgba(124,58,237,0.3)"
        },
        hover: { 
            y: -4,
            scale: 1.02,
            rotate: isOpen ? 90 : 0,
            boxShadow: isOpen
                ? "0 8px 0 rgba(0,0,0,0.3), 0 12px 24px rgba(0,0,0,0.2)"
                : "0 10px 0 rgba(124,58,237,0.4), 0 16px 32px rgba(124,58,237,0.3)"
        },
        tap: { 
            y: 4,
            scale: 0.98,
            boxShadow: isOpen
                ? "0 1px 0 rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)"
                : "0 2px 0 rgba(124,58,237,0.4), 0 4px 8px rgba(124,58,237,0.3)"
        },
        attention: {
            scale: [1, 1.1, 1],
            y: [0, -8, 0],
            transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
            }
        }
    };

    const buttonTransition = { type: "spring", stiffness: 500, damping: 30, mass: 0.5 } as const;

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
                variants={buttonVariants}
                initial="idle"
                animate={isDancing && !isOpen ? "attention" : "idle"}
                whileHover="hover"
                whileTap="tap"
                transition={buttonTransition}
                className={cn(
                    "relative h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center text-white transition-colors duration-200",
                    isOpen
                        ? "bg-zinc-900 ring-1 ring-inset ring-white/10 rounded-full"
                        : "bg-linear-to-br from-violet-600 via-violet-500 to-cyan-500 ring-1 ring-inset ring-violet-400/40 rounded-full"
                )}
            >
                {/* Surface Shine/Reflections */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent opacity-50" />
                    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-white/30 blur-[0.5px]" />
                </div>
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
                        <X className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-400 drop-shadow-md" />
                    ) : (
                        <div className="relative">
                            <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />
                            {/* AI Badge - Elevated 3D Pill */}
                            <motion.div
                                initial={{ scale: 0, y: 5 }}
                                animate={{ scale: 1, y: 0 }}
                                className="absolute -top-4 -right-3 flex h-5 w-8 sm:h-6 sm:w-10 items-center justify-center rounded-full bg-white text-[9px] sm:text-[10px] font-black text-violet-600 shadow-[0_2px_0_#ddd,0_4px_8px_rgba(0,0,0,0.2)] border border-violet-100 z-20"
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
