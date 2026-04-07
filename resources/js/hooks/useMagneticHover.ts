import { useSpring } from 'framer-motion';
import type { MouseEvent as ReactMouseEvent, RefObject } from 'react';
import { useRef } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface MagneticHoverResult<T extends HTMLElement> {
    ref: RefObject<T | null>;
    x: ReturnType<typeof useSpring>;
    y: ReturnType<typeof useSpring>;
    handleMouseMove: (event: ReactMouseEvent<T>) => void;
    handleMouseLeave: () => void;
    enabled: boolean;
}

export function useMagneticHover<
    T extends HTMLElement,
>(): MagneticHoverResult<T> {
    const ref = useRef<T | null>(null);
    const x = useSpring(0, { stiffness: 150, damping: 20 });
    const y = useSpring(0, { stiffness: 150, damping: 20 });
    const enabled = useMediaQuery('(pointer: fine)');

    const handleMouseMove = (event: React.MouseEvent<T>) => {
        if (!enabled || !ref.current) {
            return;
        }

        const rect = ref.current.getBoundingClientRect();
        const relativeX = event.clientX - rect.left - rect.width / 2;
        const relativeY = event.clientY - rect.top - rect.height / 2;

        x.set(Math.max(-15, Math.min(15, relativeX * 0.18)));
        y.set(Math.max(-8, Math.min(8, relativeY * 0.18)));
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return { ref, x, y, handleMouseMove, handleMouseLeave, enabled };
}
