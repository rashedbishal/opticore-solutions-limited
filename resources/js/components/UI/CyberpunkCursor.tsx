import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function CyberpunkCursor() {
    const finePointer = useMediaQuery('(pointer: fine)');
    const [isClicking, setIsClicking] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });

    const x = useMotionValue(-100);
    const y = useMotionValue(-100);

    const springConfig = { stiffness: 800, damping: 35, mass: 0.2 };
    const glowSpringConfig = { stiffness: 400, damping: 30, mass: 0.5 };
    const ringSpringConfig = { stiffness: 300, damping: 25, mass: 0.8 };

    const cursorX = useSpring(x, springConfig);
    const cursorY = useSpring(y, springConfig);
    const glowX = useSpring(x, glowSpringConfig);
    const glowY = useSpring(y, glowSpringConfig);
    const ringX = useSpring(x, ringSpringConfig);
    const ringY = useSpring(y, ringSpringConfig);

    // Glitch effect on fast movement
    useEffect(() => {
        if (!finePointer) return;

        let lastX = 0;
        let lastY = 0;
        let timeout: ReturnType<typeof setTimeout> | null = null;

        const unsubscribeX = x.on("change", (latest) => {
            const velocity = Math.abs(latest - lastX);
            if (velocity > 30 && Math.random() > 0.7) {
                setGlitchOffset({
                    x: (Math.random() - 0.5) * 8,
                    y: (Math.random() - 0.5) * 4
                });
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(() => setGlitchOffset({ x: 0, y: 0 }), 50);
            }
            lastX = latest;
        });

        const unsubscribeY = y.on("change", (latest) => {
            const velocity = Math.abs(latest - lastY);
            if (velocity > 30) {
                lastY = latest;
            }
        });

        return () => {
            unsubscribeX();
            unsubscribeY();
            if (timeout) clearTimeout(timeout);
        };
    }, [finePointer, x, y]);

    useEffect(() => {
        if (!finePointer) {
            document.documentElement.classList.remove('has-cyber-cursor');
            return;
        }

        document.documentElement.classList.add('has-cyber-cursor');

        const onMove = (event: MouseEvent) => {
            x.set(event.clientX);
            y.set(event.clientY);
        };

        const onPointerOver = (event: Event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            setIsHovering(!!target.closest('a, button, input, textarea, select, [data-cursor="interactive"]'));
        };

        const onMouseDown = () => setIsClicking(true);
        const onMouseUp = () => setIsClicking(false);

        window.addEventListener('mousemove', onMove);
        document.addEventListener('mouseover', onPointerOver);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            document.documentElement.classList.remove('has-cyber-cursor');
            window.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseover', onPointerOver);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [finePointer, x, y]);

    if (!finePointer) return null;

    return (
        <>
            {/* Outer rotating ring */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed top-0 left-0 z-[92]"
                style={{
                    x: ringX,
                    y: ringY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            >
                <motion.div
                    className="relative h-10 w-10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                    {/* Ring segments */}
                    <div className="absolute inset-0 rounded-full border border-cyan-400/60 border-t-transparent border-r-transparent" />
                    <div
                        className="absolute inset-0 rounded-full border border-violet-500/40 border-b-transparent border-l-transparent"
                        style={{ transform: 'rotate(45deg)' }}
                    />
                    {/* Corner accents */}
                    <div className="absolute -top-0.5 left-1/2 h-1.5 w-0.5 -translate-x-1/2 bg-cyan-400" />
                    <div className="absolute -bottom-0.5 left-1/2 h-1.5 w-0.5 -translate-x-1/2 bg-violet-500" />
                    <div className="absolute -left-0.5 top-1/2 h-0.5 w-1.5 -translate-y-1/2 bg-violet-500" />
                    <div className="absolute -right-0.5 top-1/2 h-0.5 w-1.5 -translate-y-1/2 bg-cyan-400" />
                </motion.div>
            </motion.div>

            {/* Inner pulsing core with glitch */}
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
                    className="relative flex items-center justify-center"
                    animate={{
                        scale: isClicking ? 0.7 : isHovering ? 1.3 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                    {/* Core dot */}
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />

                    {/* Glitch duplicates */}
                    {glitchOffset.x !== 0 && (
                        <>
                            <div
                                className="absolute h-1 w-1 rounded-full bg-violet-400/80"
                                style={{ transform: `translate(${glitchOffset.x}px, ${glitchOffset.y}px)` }}
                            />
                            <div
                                className="absolute h-0.5 w-0.5 rounded-full bg-red-400/60"
                                style={{ transform: `translate(${-glitchOffset.x}px, ${-glitchOffset.y}px)` }}
                            />
                        </>
                    )}
                </motion.div>
            </motion.div>

            {/* Scan line that sweeps down */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed left-0 z-[91] h-px w-8 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                style={{
                    x: glowX,
                    translateX: '-50%',
                }}
                initial={{ y: -100, opacity: 0 }}
                animate={{
                    y: [-20, 20],
                    opacity: [0, 1, 0],
                }}
                transition={{
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
            />

            {/* Glow effects */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed top-0 left-0 z-[90] h-16 w-16 rounded-full"
                style={{
                    x: glowX,
                    y: glowY,
                    translateX: '-50%',
                    translateY: '-50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(6,182,212,0.1) 50%, transparent 70%)',
                }}
            />

            {/* Click shockwave */}
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
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <div className="h-6 w-6 rounded-full border border-cyan-400/80" />
                </motion.div>
            )}

            {/* Hover target brackets */}
            {isHovering && (
                <motion.div
                    aria-hidden="true"
                    className="pointer-events-none fixed top-0 left-0 z-[95]"
                    style={{
                        x: cursorX,
                        y: cursorY,
                        translateX: '-50%',
                        translateY: '-50%',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                >
                    <div className="relative h-8 w-8">
                        {/* Corner brackets */}
                        <div className="absolute -left-0.5 -top-0.5 h-2 w-2 border-l-2 border-t-2 border-violet-400" />
                        <div className="absolute -right-0.5 -top-0.5 h-2 w-2 border-r-2 border-t-2 border-violet-400" />
                        <div className="absolute -left-0.5 -bottom-0.5 h-2 w-2 border-l-2 border-b-2 border-violet-400" />
                        <div className="absolute -right-0.5 -bottom-0.5 h-2 w-2 border-r-2 border-b-2 border-violet-400" />
                    </div>
                </motion.div>
            )}
        </>
    );
}
