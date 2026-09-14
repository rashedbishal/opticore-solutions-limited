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
        let started = false;
        let idleHandle: number | ReturnType<typeof setTimeout> | undefined;

        const start = () => {
            if (started) {
                return;
            }

            started = true;

            // Dynamically imported so the lenis bundle isn't fetched/parsed
            // as part of the initial render — it's only needed after first
            // paint. Starting it itself is further deferred (below) to the
            // first real scroll signal or idle time, so the continuous
            // rAF loop it runs for the rest of the session doesn't compete
            // with hydration/first-paint work.
            void import('@studio-freight/lenis').then(
                ({ default: LenisCtor }) => {
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
                },
            );
        };

        // Nothing needs smoothing before the user has scrolled, so wait for
        // the first real scroll signal (matches the interaction-deferred
        // widget-mount pattern in AppLayout.tsx). A short idle-time fallback
        // still guarantees Lenis exists soon enough for the Inertia
        // navigate-reset effect below, even if the user never scrolls.
        window.addEventListener('wheel', start, { once: true, passive: true });
        window.addEventListener('touchstart', start, {
            once: true,
            passive: true,
        });
        window.addEventListener('scroll', start, {
            once: true,
            passive: true,
        });

        if (typeof window.requestIdleCallback === 'function') {
            idleHandle = window.requestIdleCallback(start, { timeout: 2000 });
        } else {
            idleHandle = setTimeout(start, 2000);
        }

        return () => {
            cancelled = true;

            window.removeEventListener('wheel', start);
            window.removeEventListener('touchstart', start);
            window.removeEventListener('scroll', start);

            if (idleHandle !== undefined) {
                if (typeof window.cancelIdleCallback === 'function') {
                    window.cancelIdleCallback(idleHandle as number);
                } else {
                    clearTimeout(idleHandle as ReturnType<typeof setTimeout>);
                }
            }

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

        // Visits that explicitly opt into Inertia's preserveScroll (e.g. the
        // portfolio sub-category tabs) must keep the viewport exactly where
        // it was — track that intent from `start` so the `navigate` handler
        // below knows not to override it.
        let preserveScrollForNextNavigation = false;

        const removeStartListener = router.on('start', (event) => {
            preserveScrollForNextNavigation = Boolean(
                event.detail.visit.preserveScroll,
            );
        });

        // Inertia swaps page content in place, so the browser keeps the old
        // scroll position. If the new page is shorter, that leaves Lenis
        // stuck near the bottom (e.g. the footer) instead of the top.
        const removeNavigateListener = router.on('navigate', () => {
            if (preserveScrollForNextNavigation) {
                preserveScrollForNextNavigation = false;

                return;
            }

            lenis.scrollTo(0, { immediate: true });
        });

        return () => {
            removeStartListener();
            removeNavigateListener();
        };
    }, [lenis]);

    return (
        <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
    );
}
