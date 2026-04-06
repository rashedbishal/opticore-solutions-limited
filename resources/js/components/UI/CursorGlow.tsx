import { motion, useSpring } from 'framer-motion';
import { useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function CursorGlow() {
    const finePointer = useMediaQuery('(pointer: fine)');
    const expanded = useSpring(1, { stiffness: 100, damping: 24 });
    const x = useSpring(-100, { stiffness: 100, damping: 28 });
    const y = useSpring(-100, { stiffness: 100, damping: 28 });
    const glowX = useSpring(-100, { stiffness: 80, damping: 26 });
    const glowY = useSpring(-100, { stiffness: 80, damping: 26 });

    useEffect(() => {
        if (!finePointer) {
            document.documentElement.classList.remove('has-fine-pointer');

            return;
        }

        document.documentElement.classList.add('has-fine-pointer');

        const onMove = (event: MouseEvent) => {
            x.set(event.clientX);
            y.set(event.clientY);
            glowX.set(event.clientX);
            glowY.set(event.clientY);
        };

        const onPointerOver = (event: Event) => {
            const target = event.target;

            if (!(target instanceof Element)) {
                return;
            }

            expanded.set(target.closest('a, button, input, textarea, select, [data-cursor="interactive"]') ? 2.5 : 1);
        };

        window.addEventListener('mousemove', onMove);
        document.addEventListener('mouseover', onPointerOver);

        return () => {
            document.documentElement.classList.remove('has-fine-pointer');
            window.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseover', onPointerOver);
        };
    }, [expanded, finePointer, glowX, glowY, x, y]);

    if (!finePointer) {
        return null;
    }

    return (
        <>
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed top-0 left-0 z-[90] h-3 w-3 rounded-full bg-violet-400 mix-blend-screen"
                style={{
                    x,
                    y,
                    translateX: '-50%',
                    translateY: '-50%',
                    scale: expanded,
                }}
            />
            <motion.div
                aria-hidden="true"
                className="pointer-events-none fixed top-0 left-0 z-[89] h-14 w-14 rounded-full bg-violet-500/25 blur-xl"
                style={{
                    x: glowX,
                    y: glowY,
                    translateX: '-50%',
                    translateY: '-50%',
                    scale: expanded,
                }}
            />
        </>
    );
}
