import type { Variants } from 'framer-motion';
import type { ReactNode } from 'react';

import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Box,
    Film,
    Code2,
    Globe,
    PenTool,
    Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState, Suspense } from 'react';

import KineticBento from '@/components/HomeRedesign/KineticBento';
import LiquidShuffle from '@/components/HomeRedesign/LiquidShuffle';
import NebulaCluster from '@/components/HomeRedesign/NebulaCluster';
import OrbitingShowcase from '@/components/HomeRedesign/OrbitingShowcase';
import PortalLoop from '@/components/HomeRedesign/PortalLoop';
import SpotlightCarousel from '@/components/HomeRedesign/SpotlightCarousel';
import MagneticButton from '@/components/UI/MagneticButton';

const easing = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: easing },
    },
};
const blurReveal: Variants = {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 30 },
    visible: {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        transition: { duration: 0.9, ease: easing },
    },
};

const floatingIcons = [
    {
        icon: PenTool,
        className: 'top-[10%] left-[4%]',
        animation: { x: [0, 8, 0], y: [0, -12, 0], rotate: [0, 4, 0] },
        times: [0, 0.5, 1],
    },
    {
        icon: Globe,
        className: 'top-[14%] right-[5%]',
        animation: { x: [0, -10, 0], y: [0, 10, 0], rotate: [0, -4, 0] },
        times: [0, 0.5, 1],
    },
    {
        icon: Film,
        className: 'bottom-[24%] left-[6%]',
        animation: { x: [0, 12, 0], y: [0, -8, 0], rotate: [0, 5, 0] },
        times: [0, 0.5, 1],
    },
    {
        icon: Box,
        className: 'right-[8%] bottom-[20%]',
        animation: { x: [0, -12, 0], y: [0, 8, 0], rotate: [0, -5, 0] },
        times: [0, 0.5, 1],
    },
    {
        icon: Code2,
        className: 'bottom-[8%] left-[14%]',
        animation: { x: [0, 10, 0], y: [0, -6, 0], rotate: [0, 3, 0] },
        times: [0, 0.5, 1],
    },
];

// duplicatedServices removed due to being unused

function LazySection({
    minHeightClassName = 'min-h-[60vh]',
    children,
}: {
    minHeightClassName?: string;
    children: ReactNode;
}) {
    const [isVisible, setIsVisible] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '400px 0px' },
        );

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={sentinelRef}>
            {isVisible ? (
                <Suspense
                    fallback={
                        <div
                            className={`flex ${minHeightClassName} items-center justify-center text-sm text-zinc-500`}
                        >
                            Loading section...
                        </div>
                    }
                >
                    {children}
                </Suspense>
            ) : (
                <div className={minHeightClassName} aria-hidden="true" />
            )}
        </div>
    );
}

function HeroHeadline() {
    const phrases = [
        'deliver creative <br/> graphic design solutions <br/> for businesses',
        'drive strategic <br/> digital marketing <br/> campaigns with results',
        'create engaging <br/> video editing content <br/> with storytelling',
        'produce high-quality <br/> 3D production visuals <br/> for projects',
        'design responsive <br/> websites with seamless <br/> user experience',
    ];

    const [index, setIndex] = useState(0);
    const phraseRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let animeInstance: any;

        const run = async () => {
            const anime =
                (await import('animejs')).default ?? (await import('animejs'));
            const el = phraseRef.current;

            if (!el) {
                return;
            }

            // Reset container opacity for new phrase
            el.style.opacity = '1';

            // Align gradients across letters
            requestAnimationFrame(() => {
                const containerWidth = el.offsetWidth;
                const containerRect = el.getBoundingClientRect();
                const letters =
                    el.querySelectorAll<HTMLElement>('.anime-letter');

                letters.forEach((letter) => {
                    const letterRect = letter.getBoundingClientRect();
                    const offsetLeft = letterRect.left - containerRect.left;
                    letter.style.backgroundSize = `${containerWidth}px 100%`;
                    letter.style.backgroundPosition = `-${offsetLeft}px 0`;
                });
            });

            animeInstance = (anime as any)
                .timeline({
                    complete: () => {
                        setIndex((prev) => (prev + 1) % phrases.length);
                    },
                })
                .add({
                    targets: el.querySelectorAll('.anime-letter'),
                    scale: [4, 1],
                    opacity: [0, 1],
                    translateZ: 0,
                    easing: 'easeOutExpo',
                    duration: 950,
                    delay: (_el: Element, i: number) => 70 * i,
                })
                .add({
                    targets: el,
                    opacity: 0,
                    duration: 1000,
                    easing: 'easeOutExpo',
                    delay: 2000,
                });
        };

        run();

        return () => {
            if (animeInstance?.pause) {
                animeInstance.pause();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index]);

    const currentPhrase = phrases[index];

    return (
        <>
            <style>{`
                .anime-letter {
                    display: inline-block;
                    line-height: 1.2;
                    vertical-align: top;
                    padding-bottom: 0.1em;
                }
                .anime-word {
                    display: inline-block;
                    white-space: nowrap;
                    margin-right: 0.25em;
                }
            `}</style>
            <motion.h1
                layout
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="pb-4 text-[2rem] leading-[1.3] font-extrabold text-white sm:text-4xl sm:leading-[1.2] md:text-5xl lg:text-6xl"
            >
                <motion.span layout className="inline-block">
                    We
                </motion.span>{' '}
                <span ref={phraseRef} className="inline">
                    {currentPhrase.split(' ').map((word, wi) => {
                        if (word === '<br/>') {
                            return <br key={`br-${wi}`} />;
                        }

                        return (
                            <span key={`word-${wi}`} className="anime-word">
                                {word.split('').map((char, ci) => (
                                    <span
                                        key={`char-${ci}`}
                                        className="anime-letter gradient-text"
                                        style={{ opacity: 0 }}
                                    >
                                        {char}
                                    </span>
                                ))}
                            </span>
                        );
                    })}
                </span>
            </motion.h1>
        </>
    );
}

interface HomeIndexProps {
    brands?: string[];
}

export default function HomeIndex({ brands }: HomeIndexProps) {
    const desktop = useMediaQuery('(min-width: 1024px)');

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            requestAnimationFrame(() => {
                entries.forEach((entry) => {
                    const card = entry.target as HTMLElement;
                    const rect = card.querySelector<SVGRectElement>('.trace-rect');
                    const beam = card.querySelector<SVGRectElement>('.beam-rect');

                    if (!rect) {
                        return;
                    }

                    const box = card.getBoundingClientRect();
                    const w = Math.round(box.width);
                    const h = Math.round(box.height);

                    // Skip if dimensions haven't significantly changed
                    if (card.dataset.lastW === `${w}` && card.dataset.lastH === `${h}`) {
                        return;
                    }

                    card.dataset.lastW = `${w}`;
                    card.dataset.lastH = `${h}`;

                    const r = 26;
                    const perim = 2 * (w + h) - 8 * r + 2 * Math.PI * r;

                    card.style.setProperty('--perim', `${perim}px`);
                    rect.setAttribute('width', `${w - 2.5}`);
                    rect.setAttribute('height', `${h - 2.5}`);

                    if (beam) {
                        beam.setAttribute('width', `${w - 2.5}`);
                        beam.setAttribute('height', `${h - 2.5}`);
                    }
                });
            });
        });

        const cards = document.querySelectorAll('.bento-card');
        cards.forEach((card) => observer.observe(card));

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <style>{`
                @keyframes particleShoot {
                    0% { transform: translate(0, 0) scale(0); opacity: 0; }
                    15% { opacity: 1; scale: 1.8; }
                    100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
                }

                @keyframes pulsateGlow {
                    0%, 100% { opacity: 0.3; filter: drop-shadow(0 0 15px rgba(6, 182, 212, 0.3)); }
                    50% { opacity: 0.7; filter: drop-shadow(0 0 30px rgba(168, 85, 247, 0.6)); }
                }

                @keyframes borderTrace {
                    0% { stroke-dashoffset: var(--perim); }
                    100% { stroke-dashoffset: 0; }
                }

                @keyframes beamRun {
                    0% { stroke-dashoffset: var(--perim); }
                    100% { stroke-dashoffset: calc(var(--perim) * -1); }
                }

                .trace-rect {
                    fill: none;
                    stroke-width: 2;
                    stroke-dasharray: var(--perim);
                    stroke-dashoffset: var(--perim);
                    opacity: 0;
                    transition: opacity 0.4s ease, stroke-dashoffset 0.8s ease;
                }

                .beam-rect {
                    fill: none;
                    stroke: white;
                    stroke-width: 3;
                    stroke-dasharray: 100 calc(var(--perim) - 100);
                    stroke-dashoffset: var(--perim);
                    filter: blur(2px);
                    opacity: 0;
                    mix-blend-mode: overlay;
                }

                .group:hover .trace-rect {
                    opacity: 1;
                    stroke-dashoffset: 0;
                }

                .group:hover .beam-rect {
                    opacity: 0.6;
                    animation: beamRun 3s linear infinite;
                }

                .group:hover .particle-dot {
                    animation: particleShoot 1.5s ease-out infinite;
                }

                .aura-glow {
                    position: absolute;
                    inset: -10px;
                    border-radius: 2rem;
                    background: radial-gradient(circle at center, rgba(124, 58, 237, 0.15) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.6s ease;
                    pointer-events: none;
                    z-index: 0;
                }

                .group:hover .aura-glow {
                    opacity: 1;
                    animation: pulsateGlow 3s ease-in-out infinite;
                }
            `}</style>
            <Head>
                <title>Opticore Solutions Ltd. — Premium Digital Agency</title>
                <meta
                    name="description"
                    content="From graphic design to web development, Opticore Solutions Ltd. creates premium digital experiences that help brands grow."
                />
                <meta
                    property="og:title"
                    content="Opticore Solutions Ltd. — Premium Digital Agency"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>

            <section className="hero-noise relative flex min-h-screen items-center overflow-hidden px-4 pt-28 pb-16 sm:px-6 lg:px-8">
                <GradientOrb
                    className="top-20 left-[-4rem] h-64 w-64 md:h-80 md:w-80"
                    color="rgb(124 58 237 / 0.55)"
                    direction="down"
                />
                <GradientOrb
                    className="top-[20%] right-[-2rem] h-60 w-60 md:h-72 md:w-72"
                    color="rgb(6 182 212 / 0.45)"
                    direction="up"
                    speed="medium"
                />
                <GradientOrb
                    className="bottom-10 left-[30%] h-56 w-56 md:h-72 md:w-72"
                    color="rgb(139 92 246 / 0.4)"
                    direction="down"
                />

                <div className="section-inner relative z-10 flex flex-col items-center justify-center text-center">
                    <motion.span
                        variants={blurReveal}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-200 sm:text-sm"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                        <span className="[animation:shimmer_2.5s_linear_infinite] bg-[linear-gradient(120deg,rgba(255,255,255,0.5),rgba(255,255,255,1),rgba(255,255,255,0.5))] bg-[length:200%_100%] bg-clip-text text-transparent">
                            ✦ Premium Digital Agency
                        </span>
                    </motion.span>

                    <div className="mt-8 max-w-5xl">
                        <HeroHeadline />
                    </div>

                    <motion.p
                        variants={blurReveal}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.4 }}
                        className="mx-auto mt-12 max-w-2xl text-base leading-8 text-zinc-300 sm:mt-8 sm:text-lg md:text-xl"
                    >
                        From stunning visuals to powerful digital strategies —
                        Opticore Solutions Ltd. turns your vision into results.
                    </motion.p>

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.55 }}
                        className="mt-10 flex w-full max-w-md flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center"
                    >
                        <MagneticButton
                            href="/request-appointment"
                            ariaLabel="Start a project with Opticore Solutions Ltd."
                        >
                            Start a Project
                        </MagneticButton>
                        <Link
                            href={portfolio.url()}
                            className="touch-target inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                        >
                            See Our Work
                        </Link>
                    </motion.div>

                    {desktop ? (
                        <div className="pointer-events-none absolute inset-0 hidden xl:block">
                            {floatingIcons.map(
                                ({ icon: Icon, className, animation }) => (
                                    <motion.div
                                        key={className}
                                        className={`absolute ${className} flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/4 text-violet-300/80 backdrop-blur-md`}
                                        animate={animation.animation}
                                        transition={{
                                           duration: 6,
                                           repeat: Number.POSITIVE_INFINITY,
                                           ease: 'easeInOut',
                                           times: animation.times,
                                        }}
                                    >
                                        <Icon className="h-8 w-8" />
                                    </motion.div>
                                ),
                            )}
                        </div>
                    ) : null}

                    {/*<motion.div*/}
                    {/*    variants={fadeUp}*/}
                    {/*    initial="hidden"*/}
                    {/*    animate="visible"*/}
                    {/*    transition={{ delay: 0.75 }}*/}
                    {/*    className="mt-16 flex flex-col items-center gap-2 text-zinc-400"*/}
                    {/*>*/}
                    {/*    <span className="text-xs font-semibold tracking-[0.24em] uppercase">*/}
                    {/*        Scroll*/}
                    {/*    </span>*/}
                    {/*    <ArrowDown className="h-5 w-5 animate-bounce text-cyan-300" />*/}
                    {/*</motion.div>*/}
                </div>
            </section>

            <Suspense
                fallback={
                    <div className="flex h-96 w-full items-center justify-center text-sm text-zinc-500">
                        Loading sections...
                    </div>
                }
            >
                {/*<Section2 />*/}
                {/*<Section3 />*/}
                {/*<Section4 />*/}
                {/*<Section5 />*/}
            </Suspense>

            <div className="relative z-10">
                <section className="bg-black py-20">
                    <div className="mx-auto max-w-7xl px-4 text-center">
                        <span className="mb-4 block text-sm font-bold tracking-widest text-cyan-400 uppercase">
                            Portfolio Concept 1
                        </span>
                        <h2 className="text-4xl font-black tracking-tighter text-white uppercase md:text-6xl">
                            Portal Loop
                        </h2>
                        <p className="mt-4 text-zinc-500">
                            Scroll down to experience the zoom motion
                        </p>
                    </div>
                </section>
                <LazySection minHeightClassName="min-h-[90vh]">
                    <PortalLoop />
                </LazySection>

                <section className="border-t border-white/5 bg-zinc-950 py-20">
                    <div className="mx-auto max-w-7xl px-4 text-center">
                        <span className="mb-4 block text-sm font-bold tracking-widest text-violet-400 uppercase">
                            Portfolio Concept 2
                        </span>
                        <h2 className="text-4xl font-black tracking-tighter text-white uppercase md:text-6xl">
                            Nebula Cluster
                        </h2>
                        <p className="mt-4 text-zinc-500">
                            Move your mouse to interact with the cluster
                        </p>
                    </div>
                </section>
                <LazySection minHeightClassName="min-h-[90vh]">
                    <NebulaCluster />
                </LazySection>

                <section className="border-t border-white/5 bg-black py-20">
                    <div className="mx-auto max-w-7xl px-4 text-center">
                        <span className="mb-4 block text-sm font-bold tracking-widest text-emerald-400 uppercase">
                            Portfolio Concept 3
                        </span>
                        <h2 className="text-4xl font-black tracking-tighter text-white uppercase md:text-6xl">
                            Kinetic Bento
                        </h2>
                    </div>
                </section>
                <LazySection minHeightClassName="min-h-[90vh]">
                    <KineticBento />
                </LazySection>

                <section className="border-t border-white/5 bg-zinc-950 py-20">
                    <div className="mx-auto max-w-7xl px-4 text-center">
                        <span className="mb-4 block text-sm font-bold tracking-widest text-pink-400 uppercase">
                            Testimonial Concept 1
                        </span>
                        <h2 className="text-4xl font-black tracking-tighter text-white uppercase md:text-6xl">
                            Liquid Shuffle
                        </h2>
                    </div>
                </section>
                <LazySection minHeightClassName="min-h-[70vh]">
                    <LiquidShuffle />
                </LazySection>

                <section className="border-t border-white/5 bg-black py-20">
                    <div className="mx-auto max-w-7xl px-4 text-center">
                        <span className="mb-4 block text-sm font-bold tracking-widest text-cyan-400 uppercase">
                            Testimonial Concept 2
                        </span>
                        <h2 className="text-4xl font-black tracking-tighter text-white uppercase md:text-6xl">
                            Orbiting Showcase
                        </h2>
                    </div>
                </section>
                <LazySection minHeightClassName="min-h-[90vh]">
                    <OrbitingShowcase />
                </LazySection>

                <section className="border-t border-white/5 bg-zinc-950 py-20">
                    <div className="mx-auto max-w-7xl px-4 text-center">
                        <span className="mb-4 block text-sm font-bold tracking-widest text-violet-400 uppercase">
                            Testimonial Concept 3
                        </span>
                        <h2 className="text-4xl font-black tracking-tighter text-white uppercase md:text-6xl">
                            Spotlight Carousel
                        </h2>
                    </div>
                </section>
                <LazySection minHeightClassName="min-h-[70vh]">
                    <SpotlightCarousel />
                </LazySection>
            </div>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <Marquee
                        items={
                            brands && brands.length > 0 ? brands : clientLogos
                        }
                    />
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <div className="glass-panel rounded-[2rem] border-t border-t-cyan-400/70 p-8 text-center sm:p-10 lg:p-14">
                        <p className="section-kicker">Ready to Scale?</p>
                        <h2 className="text-3xl font-extrabold text-balance text-white sm:text-4xl md:text-5xl">
                            Hire the Industry's Finest Talent
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                            Whether you need a full brand system, campaign
                            creative, motion production, or a web experience
                            that performs, we can shape the right scope with
                            you.
                        </p>
                        <div className="mt-8 flex justify-center">
                            <MagneticButton
                                href="/hire-us"
                                ariaLabel="Hire Opticore Solutions Ltd. now"
                                fullWidth={!desktop}
                            >
                                Hire Us <ArrowRight className="ml-2 h-4 w-4" />
                            </MagneticButton>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
