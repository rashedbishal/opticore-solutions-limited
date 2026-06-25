'use client';

import type { gsap as GsapType } from 'gsap';
import { useEffect, useRef, useState } from 'react';

export interface HoverScrambleProps {
    duration?: number;
    speed?: number;
    scrambleChars?: string;
    className?: string;
    children: string;
    triggerOnMount?: boolean;
    trigger?: boolean;
}

type GsapCore = typeof GsapType;

let gsapPromise: Promise<GsapCore> | null = null;

const getGsap = (): Promise<GsapCore> => {
    if (!gsapPromise) {
        gsapPromise = (async () => {
            const [{ gsap }, { ScrambleTextPlugin }] = await Promise.all([
                import('gsap'),
                import('gsap/ScrambleTextPlugin'),
            ]);

            gsap.registerPlugin(ScrambleTextPlugin);

            return gsap;
        })();
    }

    return gsapPromise;
};

const HoverScramble: React.FC<HoverScrambleProps> = ({
    duration = 0.8,
    speed = 0.6,
    scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    className = '',
    children,
    triggerOnMount = false,
    trigger = false,
}) => {
    const textRef = useRef<HTMLSpanElement>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const tweenRef = useRef<any>(null);

    const scramble = async () => {
        if (!textRef.current) {
            return;
        }

        const gsap = await getGsap();

        setIsAnimating(true);

        tweenRef.current = gsap.to(textRef.current, {
            duration,
            scrambleText: {
                text: children,
                chars: scrambleChars,
                speed,
                revealDelay: 0,
            },
            ease: 'none',
            onComplete: () => setIsAnimating(false),
        });
    };

    const handleMouseEnter = () => {
        if (isAnimating) {
            return;
        }

        void scramble();
    };

    useEffect(() => {
        if (triggerOnMount) {
            const timer = setTimeout(() => {
                void scramble();
            }, 100);

            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [triggerOnMount, children]);

    const prevTrigger = useRef(trigger);

    useEffect(() => {
        if (trigger !== prevTrigger.current) {
            prevTrigger.current = trigger;
            void scramble();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger]);

    useEffect(() => {
        return () => {
            if (tweenRef.current) {
                tweenRef.current.kill();
            }
        };
    }, []);

    return (
        <span
            ref={textRef}
            className={`inline-block font-mono tracking-tight ${className}`}
            style={{ minWidth: `${children.length}ch` }}
            onMouseEnter={handleMouseEnter}
        >
            {children}
        </span>
    );
};

export default HoverScramble;
