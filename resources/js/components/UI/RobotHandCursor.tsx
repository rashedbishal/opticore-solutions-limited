"use client"

import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function RobotHandCursor() {
    const finePointer = useMediaQuery('(pointer: fine)');
    const [isClicking, setIsClicking] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [fingerExtension, setFingerExtension] = useState(0);

    const x = useMotionValue(-100);
    const y = useMotionValue(-100);

    // Fast spring for responsive following
    const springConfig = { stiffness: 900, damping: 30, mass: 0.15 };
    const handSpringConfig = { stiffness: 600, damping: 28, mass: 0.4 };
    const fingerSpringConfig = { stiffness: 400, damping: 25, mass: 0.3 };

    const cursorX = useSpring(x, springConfig);
    const cursorY = useSpring(y, springConfig);
    const handX = useSpring(x, handSpringConfig);
    const handY = useSpring(y, handSpringConfig);

    useEffect(() => {
        if (!finePointer) {
            document.documentElement.classList.remove('has-robot-cursor');
            return;
        }

        document.documentElement.classList.add('has-robot-cursor');

        const onMove = (event: MouseEvent) => {
            x.set(event.clientX);
            y.set(event.clientY);
        };

        const onPointerOver = (event: Event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const hovering = !!target.closest('a, button, input, textarea, select, [data-cursor="interactive"]');
            setIsHovering(hovering);
            setFingerExtension(hovering ? 1 : 0);
        };

        const onMouseDown = () => {
            setIsClicking(true);
            setFingerExtension(0.3);
        };
        const onMouseUp = () => {
            setIsClicking(false);
            setFingerExtension(isHovering ? 1 : 0);
        };

        window.addEventListener('mousemove', onMove);
        document.addEventListener('mouseover', onPointerOver);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            document.documentElement.classList.remove('has-robot-cursor');
            window.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseover', onPointerOver);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [finePointer, x, y, isHovering]);

    if (!finePointer) return null;

    return (
        <>
            {/* Robot hand base - mechanical palm */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed top-0 left-0 z-[92]"
                style={{
                    x: handX,
                    y: handY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            >
                {/* Mechanical palm structure */}
                <motion.div
                    className="relative"
                    animate={{
                        scale: isClicking ? 0.9 : isHovering ? 1.15 : 1,
                        rotate: isClicking ? 5 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                    {/* Palm base - hexagonal shape */}
                    <div className="relative flex items-center justify-center">
                        {/* Hexagon palm */}
                        <div className="relative h-10 w-10">
                            <svg viewBox="0 0 40 40" className="h-full w-full">
                                {/* Outer hexagon */}
                                <polygon
                                    points="20,2 36,11 36,29 20,38 4,29 4,11"
                                    fill="none"
                                    stroke="#06b6d4"
                                    strokeWidth="1.5"
                                    className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                                />
                                {/* Inner hexagon */}
                                <polygon
                                    points="20,8 30,14 30,26 20,32 10,26 10,14"
                                    fill="rgba(6,182,212,0.15)"
                                    stroke="#8b5cf6"
                                    strokeWidth="1"
                                />
                                {/* Center core */}
                                <circle cx="20" cy="20" r="3" fill="#06b6d4" className="drop-shadow-[0_0_6px_rgba(6,182,212,1)]" />
                                {/* Corner indicators */}
                                <circle cx="20" cy="8" r="1" fill="#8b5cf6" />
                                <circle cx="30" cy="14" r="1" fill="#8b5cf6" />
                                <circle cx="30" cy="26" r="1" fill="#8b5cf6" />
                                <circle cx="20" cy="32" r="1" fill="#8b5cf6" />
                                <circle cx="10" cy="26" r="1" fill="#8b5cf6" />
                                <circle cx="10" cy="14" r="1" fill="#8b5cf6" />
                            </svg>
                        </div>

                        {/* Joint indicators around palm */}
                        <div className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                        <div className="absolute top-1/2 -right-1 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                        <div className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                        <div className="absolute top-1/2 -left-1 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                    </div>
                </motion.div>
            </motion.div>

            {/* Mechanical fingers - 3 prong design */}
            {[0, 120, 240].map((rotation, index) => (
                <motion.div
                    key={index}
                    aria-hidden="true"
                    className="pointer-events-none fixed top-0 left-0 z-[91]"
                    style={{
                        x: handX,
                        y: handY,
                        translateX: '-50%',
                        translateY: '-50%',
                        rotate: rotation,
                    }}
                >
                    <motion.div
                        className="relative"
                        animate={{
                            y: fingerExtension * (index === 0 ? -14 : index === 1 ? 12 : 12),
                            x: fingerExtension * (index === 0 ? 0 : index === 1 ? 12 : -12),
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                        {/* Finger segment 1 */}
                        <div
                            className="absolute top-[-22px] left-1/2 h-5 w-1.5 -translate-x-1/2 rounded-full"
                            style={{
                                background: 'linear-gradient(to top, #8b5cf6 0%, #06b6d4 100%)',
                                boxShadow: '0 0 8px rgba(139,92,246,0.6)',
                            }}
                        />
                        {/* Finger segment 2 */}
                        <div
                            className="absolute top-[-30px] left-1/2 h-4 w-1 -translate-x-1/2 rounded-full"
                            style={{
                                background: 'linear-gradient(to top, #06b6d4 0%, rgba(6,182,212,0.3) 100%)',
                            }}
                        />
                        {/* Finger tip */}
                        <motion.div
                            className="absolute top-[-34px] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300"
                            style={{
                                boxShadow: '0 0 10px rgba(103,232,249,0.9)',
                            }}
                            animate={{
                                scale: isClicking ? 0.8 : 1,
                            }}
                        />
                        {/* Joint */}
                        <div className="absolute top-[-18px] left-1/2 h-1.5 w-2 -translate-x-1/2 rounded-full bg-violet-500/80" />
                    </motion.div>
                </motion.div>
            ))}

            {/* Central cursor point */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed top-0 left-0 z-[93]"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            >
                <motion.div
                    className="relative"
                    animate={{
                        scale: isClicking ? 0.7 : isHovering ? 1.4 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 600, damping: 20 }}
                >
                    {/* Target crosshair center */}
                    <div className="h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,1)]" />

                    {/* Crosshair lines on hover */}
                    {isHovering && (
                        <>
                            <motion.div
                                className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-violet-400 to-transparent"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                            />
                            <motion.div
                                className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-violet-400 to-transparent"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                            />
                        </>
                    )}
                </motion.div>
            </motion.div>

            {/* Scanner ring */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed top-0 left-0 z-[90]"
                style={{
                    x: handX,
                    y: handY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            >
                <motion.div
                    className="h-20 w-20 rounded-full border border-cyan-400/20"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.1, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </motion.div>

            {/* Click energy burst */}
            {isClicking && (
                <motion.div
                    aria-hidden="true"
                    className="pointer-events-none fixed top-0 left-0 z-[94]"
                    style={{
                        x: cursorX,
                        y: cursorY,
                        translateX: '-50%',
                        translateY: '-50%',
                    }}
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <div className="h-8 w-8 rounded-full border-2 border-cyan-400/60" />
                </motion.div>
            )}

            {/* Data readout effect on hover */}
            {isHovering && (
                <motion.div
                    aria-hidden="true"
                    className="pointer-events-none fixed top-0 left-0 z-[89]"
                    style={{
                        x: cursorX,
                        y: cursorY,
                        translateX: '10px',
                        translateY: '-30px',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="font-mono text-[8px] text-cyan-400/70">
                        <div>TARGET: LOCKED</div>
                        <div>X:{Math.round(cursorX.get())}</div>
                    </div>
                </motion.div>
            )}
        </>
    );
}
