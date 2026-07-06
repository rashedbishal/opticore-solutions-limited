import type { MotionValue } from 'framer-motion';
import { m as motion, useScroll, useTransform } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface GradientOrbProps {
    className?: string;
    color: string;
    speed?: 'slow' | 'medium';
    direction?: 'down' | 'up';
}

interface OrbVisualProps {
    className?: string;
    color: string;
    speed: 'slow' | 'medium';
    y: MotionValue<number> | number;
}

function OrbVisual({ className, color, speed, y }: OrbVisualProps) {
    return (
        <motion.div
            aria-hidden="true"
            className={cn(
                'orb-surface pointer-events-none absolute rounded-full blur-[120px] md:blur-[160px]',
                className,
            )}
            style={{
                y,
                ['--orb-color' as string]: color,
                animationDuration: speed === 'slow' ? '10s' : '7s',
            }}
        />
    );
}

interface ScrollLinkedOrbVisualProps {
    className?: string;
    color: string;
    speed: 'slow' | 'medium';
    travel: number;
}

// Only mounted on desktop, where the scroll-linked parallax is actually
// visible — this is the only place useScroll/useTransform get subscribed,
// so mobile viewports never pay the per-scroll-frame recompute cost for an
// output that would be constant anyway (see GradientOrb below).
function ScrollLinkedOrbVisual({
    className,
    color,
    speed,
    travel,
}: ScrollLinkedOrbVisualProps) {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, travel]);

    return <OrbVisual className={className} color={color} speed={speed} y={y} />;
}

export default function GradientOrb({
    className,
    color,
    speed = 'slow',
    direction = 'down',
}: GradientOrbProps) {
    const desktop = useMediaQuery('(min-width: 1024px)');
    const travel = direction === 'down' ? 150 : -80;

    // Below lg, `y` was always resolving to a constant 0 (the previous
    // `desktop ? travel : 0` ternary) — meaning every mobile viewport was
    // still paying for a live useScroll/useTransform subscription (a
    // scroll-event listener plus an interpolation callback firing on every
    // scroll tick) to produce a value that never changed. Skipping the
    // subscription entirely below lg removes that dead work with no change
    // in rendered output: y is still exactly 0 on every frame.
    if (!desktop) {
        return (
            <OrbVisual className={className} color={color} speed={speed} y={0} />
        );
    }

    return (
        <ScrollLinkedOrbVisual
            className={className}
            color={color}
            speed={speed}
            travel={travel}
        />
    );
}
