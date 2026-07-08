"use client"

import { m as motion } from "framer-motion";
import React from "react";
import { cn } from "@/lib/utils";

interface GlowingKickerProps {
    children: React.ReactNode;
    className?: string;
}

const GlowingKicker: React.FC<GlowingKickerProps> = ({ children, className }) => {
    // Generate a fixed number of particles
    const [particles, setParticles] = React.useState<any[]>([]);

    React.useEffect(() => {
        setParticles(Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2,
        })));
    }, []);

    return (
        <div className={cn("relative inline-flex mb-4", className)}>
            {/* The Glow Effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-violet-500/20 to-cyan-500/20 blur-md rounded-full opacity-50 animate-pulse" />
            
            {/* The Capsule */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] text-white uppercase backdrop-blur-sm overflow-hidden"
            >
                {/* Text Content */}
                <span className="relative z-10">{children}</span>

                {/* Shimmer effect */}
                <motion.div
                    animate={{
                        x: ['-100%', '200%'],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 1
                    }}
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent z-0"
                />

                {/* Tiny Particles */}
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="absolute bg-white rounded-full opacity-20 pointer-events-none"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                        }}
                        animate={{
                            y: [0, -15, 0],
                            opacity: [0, 0.4, 0],
                            scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            delay: p.delay,
                            ease: "easeInOut",
                            times: [0, 0.5, 1]
                        }}                    />
                ))}
            </motion.div>
        </div>
    );
};

export default GlowingKicker;
