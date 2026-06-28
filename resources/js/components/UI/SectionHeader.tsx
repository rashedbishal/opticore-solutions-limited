import type { Variants } from 'framer-motion';
import { m as motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface SectionHeaderProps {
    eyebrow?: string;
    title: string;
    titles?: string[];
    description?: string;
    align?: 'left' | 'center';
    variant?: 'default' | 'scanned';
    animationType?: 'capabilities' | 'why-opticore' | 'process' | 'selected-work' | 'testimonials';
}

const blurReveal: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
    },
};

// --- UNIQUE ANIMATION COMPONENTS ---

/** Type E: Testimonials - Continuous Floating with Shifting Gradient */
function TestimonialsTitle({ text }: { text: string }) {
    return (
        <span className="inline-block py-2 leading-[1.25]">
            <motion.span
                animate={{
                    y: [0, -10, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    times: [0, 0.5, 1],
                }}                className="inline-block"
            >
                <motion.span
                    animate={{
                        backgroundPosition: ['0% center', '200% center'],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    className="inline-block bg-[linear-gradient(110deg,#a855f7,45%,#ec4899,55%,#a855f7)] bg-[length:200%_100%] bg-clip-text text-transparent py-1"
                >
                    {text}
                </motion.span>
            </motion.span>
        </span>
    );
}

/** Type A: Capabilities - Character Bounce-In with Tech Gradient */
function CapabilitiesTitle({ text }: { text: string }) {
    const words = text.split(' ');

    return (
        <span className="inline-flex flex-wrap items-center leading-[1.15] py-2">
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
                                delay: (wordIndex * 5 + charIndex) * 0.02,
                                times: [0, 0.6, 1]
                            }}                            className="inline-block bg-linear-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent px-[0.03em] py-1.5"
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
        <span className="block overflow-visible py-2 leading-[1.15]">
            <motion.span
                variants={{
                    hidden: { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
                    visible: { 
                        clipPath: 'inset(0 0% 0 0)', 
                        opacity: 1 
                    },
                }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block bg-linear-to-r from-violet-400 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent py-1"
            >
                {text}
            </motion.span>
        </span>
    );
}

/** Type C: Process - Staggered Word Slide-Up with Flow Gradient */
function ProcessTitle({ text }: { text: string }) {
    return (
        <span className="inline-flex flex-wrap overflow-visible py-2 leading-[1.15]">
            {text.split(' ').map((word, i) => (
                <span key={i} className="mr-[0.25em] overflow-hidden py-1">
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
                        className="inline-block origin-bottom-left bg-linear-to-r from-emerald-400 via-teal-500 to-cyan-600 bg-clip-text text-transparent py-1"
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
        <span className="block overflow-visible py-2 leading-[1.15]">
            <motion.span
                variants={{
                    hidden: { opacity: 0, scaleX: 0.6, x: -20 },
                    visible: { opacity: 1, scaleX: 1, x: 0 },
                }}
                transition={{
                    duration: 1.4,
                    type: 'spring',
                    bounce: 0.5
                }}
                className="inline-block origin-left bg-linear-to-r from-orange-400 via-rose-500 to-pink-600 bg-clip-text text-transparent py-1"
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
                    `<span class="sh-word text-transparent">${word
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

            const tl = (anime as any)
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
                });

            // Exit animation only for cycling pools — single titles stay visible.
            if (isPool) {
                tl.add({
                    targets: `.${letterClass}`,
                    translateX: [0, -30],
                    opacity: [1, 0],
                    easing: 'easeInExpo',
                    duration: 1100,
                    delay: (_el: Element, i: number) => 3000 + 30 * i,
                });
            }

            timelineRef.current = tl;
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
                    padding: 0.2em 0;
                }
                [class$="-letter"] {
                    display: inline-block;
                    line-height: 1.25em;
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

    // Aligns gradient spans so they appear as one seamless gradient across
    // the full h2 width, regardless of how the text is split into child spans.
    // useEffect (post-paint) is correct here — measurements are stable after
    // the browser has laid out the text, and there is no rAF loop to maintain.
    useEffect(() => {
        const container = h2Ref.current;

        if (!container) {
            return;
        }

        const containerWidth = container.offsetWidth;
        const containerRect = container.getBoundingClientRect();
        const gradientElements = container.querySelectorAll<HTMLElement>('[class*="bg-clip-text"], .gradient-text');

        gradientElements.forEach((el) => {
            const elRect = el.getBoundingClientRect();
            const offsetLeft = elRect.left - containerRect.left;
            el.style.backgroundSize = `${containerWidth}px 100%`;
            el.style.backgroundPosition = `-${offsetLeft}px 0`;
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
            case 'testimonials':
                return <TestimonialsTitle text={title} />;
            default:
                return (
                    <span className="text-theme">
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
                <p className="mt-5 max-w-2xl text-base leading-8 text-theme-muted sm:text-lg">
                    {description}
                </p>
            ) : null}
        </motion.div>
    );
}