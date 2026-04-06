import { motion, useScroll, useTransform } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface GradientOrbProps {
    className?: string;
    color: string;
    speed?: 'slow' | 'medium';
    direction?: 'down' | 'up';
}

export default function GradientOrb({
    className,
    color,
    speed = 'slow',
    direction = 'down',
}: GradientOrbProps) {
    const desktop = useMediaQuery('(min-width: 1024px)');
    const { scrollY } = useScroll();
    const travel = direction === 'down' ? 150 : -80;
    const y = useTransform(scrollY, [0, 500], [0, desktop ? travel : 0]);

    return (
        <motion.div
            aria-hidden="true"
            className={cn('orb-surface absolute rounded-full blur-3xl', className)}
            style={{
                y,
                ['--orb-color' as string]: color,
                animationDuration: speed === 'slow' ? '10s' : '7s',
            }}
        />
    );
}
