import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface SectionHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
    align?: 'left' | 'center';
}

const blurReveal: Variants = {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 30 },
    visible: {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
    },
};

// Unique class per mount to avoid selector collisions with other SectionHeaders
let instanceCounter = 0;

function AnimatedTitle({ title }: { title: string }) {
    const titleRef = useRef<HTMLSpanElement>(null);
    const classRef = useRef(`sh-title-${++instanceCounter}`);
    const timelineRef = useRef<any>(null);

    useEffect(() => {
        const el = titleRef.current;

        if (!el) {
return;
}

        const uniqueClass = classRef.current;
        const letterClass = `${uniqueClass}-letter`;

        // Wrap every non-space character in a span, preserving gradient-text
        const words = title.split(' ');
        el.innerHTML = words
            .map((word) =>
                `<span class="sh-word">${word
                    .split('')
                    .map((char) => `<span class="${letterClass} gradient-text">${char}</span>`)
                    .join('')}</span>`,
            )
            .join(' ');

        const run = async () => {
            const anime = (await import('animejs')).default ?? (await import('animejs'));

            timelineRef.current = (anime as any).timeline({ loop: true })
                .add({
                    targets: `.${letterClass}`,
                    translateX: [40, 0],
                    translateZ: 0,
                    opacity: [0, 1],
                    easing: 'easeOutExpo',
                    duration: 1200,
                    delay: (_el: Element, i: number) => 500 + 30 * i,
                })
                .add({
                    targets: `.${letterClass}`,
                    translateX: [0, -30],
                    opacity: [1, 0],
                    easing: 'easeInExpo',
                    duration: 1100,
                    delay: (_el: Element, i: number) => 100 + 30 * i,
                });
        };

        run();

        return () => {
            if (timelineRef.current?.pause) {
timelineRef.current.pause();
}
        };
    }, [title]);

    return (
        <>
            <style>{`
                .sh-word {
                    display: inline-block;
                    white-space: nowrap;
                }
                [class$="-letter"] {
                    display: inline-block;
                    line-height: 1em;
                }
            `}</style>
            <span ref={titleRef}>{title}</span>
        </>
    );
}

export default function SectionHeader({
                                          eyebrow,
                                          title,
                                          description,
                                          align = 'left',
                                      }: SectionHeaderProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={blurReveal}
            className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}
        >
            {eyebrow ? <span className="section-kicker">{eyebrow}</span> : null}
            <h2 className="text-balance text-3xl font-extrabold text-white sm:text-4xl md:text-5xl lg:text-6xl">
                <AnimatedTitle title={title} />
            </h2>
            {description ? (
                <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                    {description}
                </p>
            ) : null}
        </motion.div>
    );
}