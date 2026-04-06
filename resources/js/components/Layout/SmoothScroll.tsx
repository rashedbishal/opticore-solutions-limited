import Lenis from '@studio-freight/lenis';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

export default function SmoothScroll({ children }: { children: ReactNode }) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis(
            {
                duration: 1.4,
                easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothTouch: false,
                touchMultiplier: 2,
            } as unknown as ConstructorParameters<typeof Lenis>[0],
        );

        lenisRef.current = lenis;

        lenis.on('scroll', () => {
            window.dispatchEvent(new Event('scroll'));
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        const rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
}
