"use client"

import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function RobotCursor() {
    const finePointer = useMediaQuery('(pointer: fine)');
    const [isHovering, setIsHovering] = useState(false);

    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    const springConfig = { stiffness: 1000, damping: 40, mass: 0.1 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    useEffect(() => {
        if (!finePointer) {
            document.documentElement.classList.remove('has-robot-cursor');
            return;
        }

        document.documentElement.classList.add('has-robot-cursor');

        const onMove = (event: MouseEvent) => {
            mouseX.set(event.clientX);
            mouseY.set(event.clientY);
        };

        const onPointerOver = (event: Event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const hovering = !!target.closest('a, button, input, textarea, select, [role="button"], [data-cursor="interactive"]');
            setIsHovering(hovering);
        };

        // Ensure we catch pointer leave events to reset state
        const onPointerOut = (event: Event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (target.closest('a, button, input, textarea, select, [role="button"], [data-cursor="interactive"]')) {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', onMove);
        document.addEventListener('mouseover', onPointerOver);
        document.addEventListener('mouseout', onPointerOut);

        return () => {
            document.documentElement.classList.remove('has-robot-cursor');
            window.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseover', onPointerOver);
            document.removeEventListener('mouseout', onPointerOut);
        };
    }, [finePointer, mouseX, mouseY]);

    if (!finePointer) return null;

    return (
        <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed top-0 left-0 z-[9999]"
            style={{
                x,
                y,
                translateX: '-20%',
                translateY: '-20%',
            }}
        >
            <motion.img
                src="/cursors/robo-cursor.cur"
                alt=""
                className="block"
                animate={{
                    // Reduced size for better usability
                    scale: isHovering ? 0.4 : 0.3,
                    filter: isHovering ? 'drop-shadow(0 0 6px rgba(6,182,212,0.8))' : 'none',
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{
                    width: '64px',
                    height: 'auto',
                }}
            />
        </motion.div>
    );
}
