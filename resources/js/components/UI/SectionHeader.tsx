import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useEffect, useState, useRef, useLayoutEffect } from 'react';

interface SectionHeaderProps {
    eyebrow?: string;
    title: string;
    titles?: string[];
    description?: string;
    align?: 'left' | 'center';
    variant?: 'default' | 'scanned';
    animationType?: 'capabilities' | 'why-opticore' | 'process' | 'selected-work';
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

// --- UNIQUE ANIMATION COMPONENTS ---

/** Type A: Capabilities - Character Bounce-In with Tech Gradient */
function CapabilitiesTitle({ text }: { text: string }) {
    const words = text.split(' ');
    return (
        <span className="inline-flex flex-wrap items-center leading-[1.1] py-4">
            {words.map((word, wordIndex) => (
                <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.22em]">
                    {word.split('').map((char, charIndex) => (
                        <motion.span
                            key={charIndex}
                            variants={{
                                hidden: { scale: 0, opacity: 0, y: 20 },
                                visible: { 
                                    scale: [0, 1.25, 1], 
                                    opacity: 1, 
                                    y: 0 
                                },
                            }}
                            transition={{ 
                                type: 'spring', 
                                stiffness: 260, 
                                damping: 20, 
                                delay: (wordIndex * 5 + charIndex) * 0.02 
                            }}
                            className="inline-block bg-linear-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent px-[0.03em] py-2"
                            style={{ backgroundAttachment: 'fixed' }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </span>
            ))}
        </span>
    );
}

/** Type B: Why Opticore - High-Tech Wipe with Premium Gradient */
function WhyOpticoreTitle({ text }: { text: string }) {
    return (
        <span className="block overflow-visible py-4 leading-[1.1]">
            <motion.span
                variants={{
                    hidden: { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
                    visible: { 
                        clipPath: 'inset(0 0% 0 0)', 
                        opacity: 1 
                    },
                }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block bg-linear-to-r from-violet-400 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent"
                style={{ backgroundAttachment: 'fixed' }}
            >
                {text}
            </motion.span>
        </span>
    );
}

/** Type C: Process - Staggered Word Slide-Up with Flow Gradient */
function ProcessTitle({ text }: { text: string }) {
    return (
        <span className="inline-flex flex-wrap overflow-visible py-4 leading-[1.1]">
            {text.split(' ').map((word, i) => (
                <span key={i} className="mr-[0.25em] overflow-hidden py-2">
                    <motion.span
                        variants={{
                            hidden: { y: '120%', rotate: 8, opacity: 0 },
                            visible: { y: 0, rotate: 0, opacity: 1 },
                        }}
                        transition={{ 
                            duration: 0.8, 
                            delay: i * 0.08, 
                            ease: [0.22, 1, 0.36, 1] 
                        }}
                        className="inline-block origin-bottom-left bg-linear-to-r from-emerald-400 via-teal-500 to-cyan-600 bg-clip-text text-transparent"
                        style={{ backgroundAttachment: 'fixed' }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    );
}

/** Type D: Selected Work - Elastic Blur Stretch with Impact Gradient */
function SelectedWorkTitle({ text }: { text: string }) {
    return (
        <span className="block overflow-visible py-4 leading-[1.1]">
            <motion.span
                variants={{
                    hidden: { opacity: 0, filter: 'blur(20px)', scaleX: 0.6 },
                    visible: { 
                        opacity: 1, 
                        filter: 'blur(0px)', 
                        scaleX: 1 
                    },
                }}
                transition={{ 
                    duration: 1.4, 
                    type: 'spring', 
                    bounce: 0.5 
                }}
                className="inline-block origin-left bg-linear-to-r from-orange-400 via-rose-500 to-pink-600 bg-clip-text text-transparent"
                style={{ backgroundAttachment: 'fixed' }}
            >
                {text}
            </motion.span>
        </span>
    );
}

// Unique class per mount to avoid selector collisions with other SectionHeaders
let instanceCounter = 0;

function AnimatedTitle({
    title,
    titles,
}: {
    title: string;
    titles?: string[];
}) {
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
                    loop: isPool,
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

        // Align gradients across letters
        const containerWidth = el.offsetWidth;
        const letters = el.querySelectorAll<HTMLElement>(`.${letterClass}`);

        letters.forEach((letter) => {
            el.classList.add('relative');
            letter.style.backgroundSize = `${containerWidth}px 100%`;
            letter.style.backgroundPosition = `-${letter.offsetLeft}px 0`;
        });

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

import ScannedTitle from '@/components/text-animations/scanned-title';

export default function SectionHeader({
    eyebrow,
    title,
    titles,
    description,
    align = 'left',
    variant = 'default',
    animationType,
}: SectionHeaderProps) {
    const h2Ref = useRef<HTMLHeadingElement>(null);

    // This effect ensures that even when text is split into multiple spans 
    // for animation, the gradient appears as one seamless transition.
    useLayoutEffect(() => {
        const container = h2Ref.current;
        if (!container) {
            return;
        }

        const containerWidth = container.offsetWidth;
        // Find all span elements that carry a gradient (those with bg-clip-text or .gradient-text)
        const gradientElements = container.querySelectorAll<HTMLElement>('[class*="bg-clip-text"], .gradient-text');

        gradientElements.forEach((el) => {
            // We use offsetLeft because it's relative to the nearest positioned parent (h2)
            // and is invariant to CSS transforms like scale or translate.
            el.style.backgroundSize = `${containerWidth}px 100%`;
            el.style.backgroundPosition = `-${el.offsetLeft}px 0`;
        });
    }, [title, titles, animationType, variant]);

    const renderTitle = () => {
        if (variant === 'scanned') {
            return <ScannedTitle text={title} />;
        }

        switch (animationType) {
            case 'capabilities':
                return <CapabilitiesTitle text={title} />;
            case 'why-opticore':
                return <WhyOpticoreTitle text={title} />;
            case 'process':
                return <ProcessTitle text={title} />;
            case 'selected-work':
                return <SelectedWorkTitle text={title} />;
            default:
                return (
                    <span className="text-white">
                        <AnimatedTitle title={title} titles={titles} />
                    </span>
                );
        }
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={blurReveal}
            className={
                align === 'center'
                    ? 'mx-auto max-w-3xl text-center'
                    : 'max-w-3xl'
            }
        >
            {eyebrow ? <span className="section-kicker">{eyebrow}</span> : null}
            <h2 
                ref={h2Ref}
                className="relative text-balance text-3xl font-extrabold sm:text-4xl md:text-5xl lg:text-6xl"
            >
                {renderTitle()}
            </h2>
            {description ? (
                <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                    {description}
                </p>
            ) : null}
        </motion.div>
    );
}