import type Lenis from '@studio-freight/lenis';
import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { createContext, useEffect, useState } from 'react';

export const LenisContext = createContext<Lenis | null>(null);

export default function SmoothScroll({ children }: { children: ReactNode }) {
    const [lenis, setLenis] = useState<Lenis | null>(null);

    useEffect(() => {
        let instance: Lenis | undefined;
        let rafId: number | undefined;
        let cancelled = false;

        // Dynamically imported so the lenis bundle isn't fetched/parsed as
        // part of the initial render — it's only needed after first paint.
        void import('@studio-freight/lenis').then(({ default: LenisCtor }) => {
            if (cancelled) {
                return;
            }

            instance = new LenisCtor({
                duration: 1.4,
                easing: (t: number) =>
                    Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothTouch: false,
                touchMultiplier: 2,
            } as unknown as ConstructorParameters<typeof LenisCtor>[0]);

            setLenis(instance);

            function raf(time: number) {
                instance!.raf(time);
                rafId = requestAnimationFrame(raf);
            }

            rafId = requestAnimationFrame(raf);
        });

        return () => {
            cancelled = true;

            if (rafId !== undefined) {
                cancelAnimationFrame(rafId);
            }

            instance?.destroy();
            setLenis(null);
        };
    }, []);

    useEffect(() => {
        if (!lenis) {
            return;
        }

        // Inertia swaps page content in place, so the browser keeps the old
        // scroll position. If the new page is shorter, that leaves Lenis
        // stuck near the bottom (e.g. the footer) instead of the top.
        return router.on('navigate', () => {
            lenis.scrollTo(0, { immediate: true });
        });
    }, [lenis]);

    return (
        <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
    );
}
