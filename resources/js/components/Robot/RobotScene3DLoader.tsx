import { lazy, Suspense } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const RobotScene3D = lazy(() => import('./RobotScene3D'));

function RobotScene3DFallback() {
    return (
        <div
            aria-hidden="true"
            className="robot-3d-container pointer-events-none fixed inset-0 z-50"
        />
    );
}

/**
 * Gate for RobotScene3D:
 * - Mobile/SSR (< 1024px): renders nothing — zero WebGL cost.
 * - Desktop: lazy-loads RobotScene3D so three/gsap stay out of the initial bundle.
 *
 * Hydration safety: useMediaQuery returns `false` on the server (third arg to
 * useSyncExternalStore), so both SSR and the first client render agree on
 * "not desktop", preventing any hydration mismatch.
 */
export default function RobotScene3DLoader() {
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    if (!isDesktop) {
        return null;
    }

    return (
        <Suspense fallback={<RobotScene3DFallback />}>
            <RobotScene3D />
        </Suspense>
    );
}
