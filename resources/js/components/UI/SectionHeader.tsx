import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface SectionHeaderProps {
    eyebrow?: string;
    title: string;
    titles?: string[];
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

function AnimatedTitle({ title, titles }: { title: string; titles?: string[] }) {
    const titleRef = useRef<HTMLSpanElement>(null);
    const classRef = useRef(`sh-title-${++instanceCounter}`);
    const timelineRef = useRef<any>(null);
    const [index, setIndex] = useState(0);

    const titleList = titles && titles.length > 0 ? titles : [title];
    const currentTitle = titleList[index];
    const isPool = titleList.length > 1;

    useEffect(() => {
        const el = titleRef.current;

        if (!el) {
            return;
        }

        const uniqueClass = classRef.current;
        const letterClass = `${uniqueClass}-letter`;

        // Wrap every non-space character in a span, preserving gradient-text
        const words = currentTitle.split(' ');
        el.innerHTML = words
            .map(
                (word) =>
                    `<span class="sh-word">${word
                        .split('')
                        .map(
                            (char) =>
                                `<span class="${letterClass} gradient-text">${char}</span>`,
                        )
                        .join('')}</span>`,
            )
            .join(' ');

        const run = async () => {
            const anime =
                (await import('animejs')).default ?? (await import('animejs'));

            // If it's a pool, we handle looping manually through state
            // If it's a single title, we use native animejs looping for maximum stability
            timelineRef.current = (anime as any)
                .timeline({
                    loop: !isPool,
                    complete: () => {
                        if (isPool) {
                            setIndex((prev) => (prev + 1) % titleList.length);
                        }
                    },
                })
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
                    // Pool uses a longer individual sentence dwell time
                    delay: (_el: Element, i: number) =>
                        (isPool ? 3000 : 100) + 30 * i,
                });
        };

        run();

        return () => {
            if (timelineRef.current?.pause) {
                timelineRef.current.pause();
            }
        };
    }, [currentTitle, isPool, titleList.length]);

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
    titles,
    description,
    align = 'left',
}: SectionHeaderProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={blurReveal}
            className={
                align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'
            }
        >
            {eyebrow ? <span className="section-kicker">{eyebrow}</span> : null}
            <h2 className="text-balance text-3xl font-extrabold text-white sm:text-4xl md:text-5xl lg:text-6xl">
                <AnimatedTitle title={title} titles={titles} />
            </h2>
            {description ? (
                <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                    {description}
                </p>
            ) : null}
        </motion.div>
    );
}