'use client';

import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrambleTextPlugin);

export interface HoverScrambleProps {
    duration?: number;
    speed?: number;
    scrambleChars?: string;
    className?: string;
    children: string;
    triggerOnMount?: boolean;
    trigger?: boolean;
}

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
    const tweenRef = useRef<gsap.core.Tween | null>(null);

    const scramble = () => {
        if (!textRef.current) {
            return;
        }

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

        scramble();
    };

    const handleMouseLeave = () => {
        // We don't necessarily want to stop the animation on leave
        // but we can ensure the text is correct if needed.
    };

    useEffect(() => {
        if (triggerOnMount) {
            // Small delay to ensure the menu opening animation has started
            const timer = setTimeout(() => {
                scramble();
            }, 100);

            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [triggerOnMount, children]);

    const prevTrigger = useRef(trigger);

    useEffect(() => {
        if (trigger !== prevTrigger.current) {
            prevTrigger.current = trigger;
            scramble();
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
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </span>
    );
};

export default HoverScramble;
