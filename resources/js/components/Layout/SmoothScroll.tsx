import type { ReactNode } from 'react';
import Lenis from '@studio-freight/lenis';
import { createContext, useEffect, useState } from 'react';

export const LenisContext = createContext<Lenis | null>(null);

export default function SmoothScroll({ children }: { children: ReactNode }) {
    const [lenis, setLenis] = useState<Lenis | null>(null);

    useEffect(() => {
        const instance = new Lenis({
            duration: 1.4,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothTouch: false,
            touchMultiplier: 2,
        } as unknown as ConstructorParameters<typeof Lenis>[0]);

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLenis(instance);

        function raf(time: number) {
            instance.raf(time);
            requestAnimationFrame(raf);
        }

        const rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            instance.destroy();
            setLenis(null);
        };
    }, []);

    return (
        <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
    );
}
