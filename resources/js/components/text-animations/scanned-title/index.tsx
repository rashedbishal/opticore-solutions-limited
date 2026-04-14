'use client';

import { motion, useInView } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}';

export default function ScannedTitle({
    text,
    className,
}: {
    text: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'relative flex flex-wrap gap-x-[0.25em] py-1',
                className,
            )}
        >
            {text.split(' ').map((word, i) => (
                <Word key={i} word={word} wordIndex={i} />
            ))}
        </span>
    );
}

function Word({ word, wordIndex }: { word: string; wordIndex: number }) {
    return (
        <span className="inline-block whitespace-nowrap">
            {word.split('').map((char, i) => (
                <Letter key={i} char={char} index={i + wordIndex * 5} />
            ))}
        </span>
    );
}

function Letter({ char, index }: { char: string; index: number }) {
    const [displayChar, setDisplayChar] = useState(char);
    const [isLocked, setIsLocked] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '1px' });

    useEffect(() => {
        if (!inView) {
return;
}

        let iterations = 0;
        const maxIterations = 8 + Math.floor(Math.random() * 12);
        const delay = 300 + index * 40;

        const timeout = setTimeout(() => {
            const interval = setInterval(() => {
                setDisplayChar(CHARS[Math.floor(Math.random() * CHARS.length)]);
                iterations += 1;

                if (iterations >= maxIterations) {
                    setDisplayChar(char);
                    setIsLocked(true);
                    clearInterval(interval);
                }
            }, 50);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(timeout);
    }, [inView, char, index]);

    return (
        <span ref={ref} className="relative inline-block px-[1px]">
            <motion.span
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                className={cn(
                    'inline-block transition-all duration-300',
                    isLocked
                        ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]'
                        : 'font-mono text-cyan-400 opacity-70',
                )}
            >
                {displayChar}
            </motion.span>

            {/* Resolution flash effect */}
            {isLocked && (
                <motion.span
                    initial={{ opacity: 0.8, scale: 1.5 }}
                    animate={{ opacity: 0, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center text-cyan-500 blur-sm"
                >
                    {char}
                </motion.span>
            )}
        </span>
    );
}
