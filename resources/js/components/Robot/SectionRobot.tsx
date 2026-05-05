import { lazy, Suspense, useRef, useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// All three/gsap/fiber imports live inside this chunk — never in the initial bundle.
const SectionRobotCanvas = lazy(() => import('./SectionRobotCanvas'));

interface SectionRobotProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    animation?: string;
    className?: string;
}

function SectionRobotFallback() {
    return (
        <div
            aria-hidden="true"
            className="h-full w-full rounded-full bg-radial from-violet-500/10 via-cyan-500/5 to-transparent"
        />
    );
}

export default function SectionRobot({
    position = 'bottom-right',
    animation,
    className = '',
}: SectionRobotProps) {
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [selectedAnimation, setSelectedAnimation] = useState(
        animation || 'idle',
    );

    useEffect(() => {
        if (!animation) {
            const animations = ['idle', 'dance', 'punch', 'jump'];
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedAnimation(
                animations[Math.floor(Math.random() * animations.length)],
            );
        }
    }, [animation]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.1 },
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const getPositionClasses = () => {
        switch (position) {
            case 'top-left':
                return 'top-4 left-4';
            case 'top-right':
                return 'top-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'bottom-right':
                return 'bottom-4 right-4';
            default:
                return 'bottom-4 right-4';
        }
    };

    return (
        <div
            ref={containerRef}
            className={`absolute ${getPositionClasses()} pointer-events-none z-20 h-48 w-48 ${className}`}
            style={{ minHeight: '150px' }}
        >
            {!isDesktop ? (
                <SectionRobotFallback />
            ) : isVisible ? (
                <Suspense fallback={null}>
                    <SectionRobotCanvas animation={selectedAnimation} />
                </Suspense>
            ) : null}
        </div>
    );
}
