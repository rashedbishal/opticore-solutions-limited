import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
    ArrowRight,
    Box,
    Film,
    Code2,
    Globe,
    PenTool,
    Sparkles,
    Star,
} from 'lucide-react';
import { useEffect, useRef, useState, lazy, Suspense } from 'react';

const Section2 = lazy(() => import('@/components/Robot/Section2'));
const Section3 = lazy(() => import('@/components/Robot/Section3'));
const Section4 = lazy(() => import('@/components/Robot/Section4'));
const Section5 = lazy(() => import('@/components/Robot/Section5'));

import GradientOrb from '@/components/UI/GradientOrb';
import MagneticButton from '@/components/UI/MagneticButton';
import Marquee from '@/components/UI/Marquee';
import {
    ServiceCarousel,
} from '@/components/UI/ScannedServiceCard';
import SectionHeader from '@/components/UI/SectionHeader';

import TestimonialCard from '@/components/UI/TestimonialCard';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
    aboutBentoImages,
    clientLogos,
    services,
    testimonials,
} from '@/lib/site';
import { portfolio } from '@/routes';
import type { PortfolioItem } from '@/types';

const easing = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: easing },
    },
};

const slideLeft: Variants = {
    hidden: { opacity: 0, x: -80 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.8, ease: easing },
    },
};

const slideRight: Variants = {
    hidden: { opacity: 0, x: 80 },
    visible: {
        opacity: 1,
        x: 0,
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

const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const floatingIcons = [
    {
        icon: PenTool,
        className: 'top-[10%] left-[4%]',
        animation: { x: [0, 8, 0], y: [0, -12, 0], rotate: [0, 4, 0] },
    },
    {
        icon: Globe,
        className: 'top-[14%] right-[5%]',
        animation: { x: [0, -10, 0], y: [0, 10, 0], rotate: [0, -4, 0] },
    },
    {
        icon: Film,
        className: 'bottom-[24%] left-[6%]',
        animation: { x: [0, 12, 0], y: [0, -8, 0], rotate: [0, 5, 0] },
    },
    {
        icon: Box,
        className: 'right-[8%] bottom-[20%]',
        animation: { x: [0, -12, 0], y: [0, 8, 0], rotate: [0, -5, 0] },
    },
    {
        icon: Code2,
        className: 'bottom-[8%] left-[14%]',
        animation: { x: [0, 10, 0], y: [0, -6, 0], rotate: [0, 3, 0] },
    },
];

const duplicatedServices = [...services, ...services];

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
                const letters = el.querySelectorAll<HTMLElement>('.anime-letter');
                
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

function CharmingStar() {
    return (
        <div className="relative mr-2.5 flex items-center justify-center">
            {/* The "Shell" star - reduced opacity to be almost invisible guidewires */}
            <Star strokeWidth={1} className="h-4 w-4 text-white/5" />

            {/* The "Filling" star with Idle Dance & Spin */}
            <motion.div
                initial={{ clipPath: 'inset(100% 0 0 0)', scale: 0.2 }}
                whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
                animate={{
                    rotate: [0, 0, 360, 360, 10, -10, 10, 0, 0],
                    scale: [1, 1.1, 1, 1.2, 1, 1],
                }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                    clipPath: { duration: 1.2, delay: 0.6, ease: 'easeInOut' },
                    rotate: {
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        times: [0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 0.95, 1],
                    },
                    scale: {
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                    },
                }}
                className="absolute inset-0 flex items-center justify-center text-amber-400"
            >
                <Star
                    strokeWidth={0}
                    className="h-4 w-4 fill-current drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                />
            </motion.div>

            {/* The Recurring Sparkle */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: [0, 1.8, 0, 0, 0],
                    opacity: [0, 1, 0, 0, 0],
                    rotate: [0, 45, 90, 90, 90],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: 'circOut',
                    times: [0, 0.15, 0.3, 0.6, 1],
                }}
                className="pointer-events-none absolute -top-1 -right-1"
            >
                <Sparkles
                    strokeWidth={0}
                    className="h-3 w-3 fill-current text-white shadow-[0_0_10px_white]"
                />
            </motion.div>
        </div>
    );
}

interface HomeIndexProps {
    featuredPortfolios: Record<string, PortfolioItem[]>;
    brands?: string[];
}

export default function HomeIndex({
    featuredPortfolios,
    brands,
}: HomeIndexProps) {

    const desktop = useMediaQuery('(min-width: 1024px)');

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                const card = entry.target as HTMLElement;
                const rect = card.querySelector<SVGRectElement>('.trace-rect');
                const beam = card.querySelector<SVGRectElement>('.beam-rect');

                if (!rect) {
                    return;
                }

                const box = card.getBoundingClientRect();
                const w = box.width;
                const h = box.height;

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
                                        animate={animation}
                                        transition={{
                                            duration: 6,
                                            repeat: Number.POSITIVE_INFINITY,
                                            ease: 'easeInOut',
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

            <Suspense fallback={<div className="flex h-96 w-full items-center justify-center text-sm text-zinc-500">Loading sections...</div>}>
                <Section2 />
                <Section3 />
                <Section4 />
                <Section5 />
            </Suspense>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Services"
                        title="What We Do Best"
                        description="Opticore combines premium creative direction with production discipline so every deliverable looks refined and performs with intent."
                        variant="scanned"
                    />

                    <div className="-mx-4 mt-10 sm:-mx-6 lg:-mx-8">
                        <ServiceCarousel
                            services={duplicatedServices}
                            featuredPortfolios={featuredPortfolios}
                        />
                    </div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner grid grid-cols-1 items-center gap-4 xl:grid-cols-[0.7fr_1.3fr] xl:gap-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={desktop ? slideLeft : fadeUp}
                        className="max-w-lg lg:max-w-none "
                    >
                        <span className="section-kicker">About Opticore</span>
                        <h2 className="max-w-xl text-3xl font-extrabold text-balance text-white sm:text-4xl lg:text-[2.45rem] xl:text-[2.2rem]">
                            We blend bold creative thinking with polished
                            execution to help modern brands grow, earn trust,
                            and stand apart.
                        </h2>
                        <p className="mt-6 text-base leading-8 text-zinc-400 sm:text-lg">
                            Opticore Solutions Ltd. is a multidisciplinary
                            digital agency built for businesses that want more
                            than generic creative. We create visual identities,
                            campaigns, video, 3D assets, and digital experiences
                            that feel premium, coherent, and commercially
                            effective.
                        </p>
                        <p className="mt-4 text-base leading-8 text-zinc-400 sm:text-lg">
                            Our work is defined by craft, clarity, and momentum.
                            We move from strategy to execution with one goal in
                            mind: deliver digital work that looks exceptional
                            and performs with intention.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={desktop ? slideRight : fadeUp}
                        className="flex flex-col gap-2 md:flex-row xl:gap-4"
                    >
                        {/* Define Card Groups */}
                        {[
                            { items: services.slice(0, 2), className: 'flex-1' },
                            {
                                items: services.slice(2, 3),
                                className: 'flex-1 flex flex-col justify-center',
                            },
                            { items: services.slice(3, 5), className: 'flex-1' },
                        ].map((group, groupIndex) => (
                            <div
                                key={groupIndex}
                                className={`flex flex-col gap-2 xl:gap-4 ${group.className}`}
                            >
                                {group.items.map((service) => {
                                    const index = services.indexOf(service);
                                    const categorySlug = service.key;
                                    const portfolios =
                                        featuredPortfolios?.[categorySlug] ||
                                        [];
                                    const portfolio = portfolios[0] || null;
                                    const fallbackImages: Record<
                                        string,
                                        { src: string; alt: string }
                                    > = {
                                        'graphic-design': {
                                            src: '/images/portfolio/identity.svg',
                                            alt: 'Graphic design showcase',
                                        },
                                        'digital-marketing': {
                                            src: '/images/portfolio/marketing.svg',
                                            alt: 'Digital marketing showcase',
                                        },
                                        'video-editing': {
                                            src: '/images/portfolio/video.svg',
                                            alt: 'Video editing showcase',
                                        },
                                        '3d-production': {
                                            src: '/images/portfolio/three-d.svg',
                                            alt: '3D production showcase',
                                        },
                                        'web-development': {
                                            src: '/images/portfolio/web.svg',
                                            alt: 'Web development showcase',
                                        },
                                    };

                                    const fallbackImage =
                                        fallbackImages[categorySlug];

                                    const categoryHighlights: Record<
                                        string,
                                        string[]
                                    > = {
                                        'graphic-design': [
                                            'Pixel Perfect',
                                            'Brand Ready',
                                            'High Contrast',
                                        ],
                                        'digital-marketing': [
                                            'ROI Focused',
                                            'Growth Tracked',
                                            'Data Driven',
                                        ],
                                        'video-editing': [
                                            'Narrative Tight',
                                            'Motion Polished',
                                            'Retention Ready',
                                        ],
                                        '3d-production': [
                                            'Ultra-Realistic',
                                            'Sim-Optimized',
                                            '4K Render',
                                        ],
                                        'web-development': [
                                            'Core Vitals',
                                            'UX Polished',
                                            'Responsive',
                                        ],
                                    };

                                    const highlights =
                                        categoryHighlights[categorySlug] || [];

                                    const denseParticles = Array.from({
                                        length: 240,
                                    }).map((_, i) => {
                                        const side = Math.floor(i / 60);
                                        const offset = (i % 60) / 59;

                                        let top, left, tx, ty;
                                        const spread =
                                            Math.sin(i * 123.45) * 60;
                                        const dist =
                                            20 +
                                            Math.abs(Math.cos(i * 321.45) * 70);

                                        if (side === 0) {
                                            top = '-1%';
                                            left = `${offset * 100}%`;
                                            ty = -dist;
                                            tx = spread;
                                        } else if (side === 2) {
                                            top = '101%';
                                            left = `${offset * 100}%`;
                                            ty = dist;
                                            tx = spread;
                                        } else if (side === 1) {
                                            left = '101%';
                                            top = `${offset * 100}%`;
                                            tx = dist;
                                            ty = spread;
                                        } else {
                                            left = '-1%';
                                            top = `${offset * 100}%`;
                                            tx = -dist;
                                            ty = spread;
                                        }

                                        const isCyan = i % 2 === 0;

                                        return {
                                            top,
                                            left,
                                            tx,
                                            ty,
                                            size: 'h-[1px] w-[1px]',
                                            color: isCyan
                                                ? 'bg-cyan-400'
                                                : 'bg-violet-400',
                                            shadow: '',
                                            delay:
                                                Math.abs(Math.sin(i * 555)) *
                                                0.6,
                                            duration:
                                                0.5 +
                                                Math.abs(Math.cos(i * 777)) *
                                                    1.5,
                                        };
                                    });

                                    return (
                                        <div
                                            key={service.key}
                                            className={`bento-card glass-panel bg-black group relative flex flex-col overflow-hidden rounded-[1.75rem] p-4 transition-all duration-500 sm:p-5 lg:p-6 ${service.key === 'video-editing' ? 'shadow-[0_0_45px_rgba(34,211,238,0.12)]' : ''}`}
                                        >
                                            {/* Background Aura Glow */}
                                            <div className="aura-glow" />

                                            {/* SVG Trace Layer */}
                                            <svg
                                                className="glow-svg pointer-events-none absolute inset-0 h-full w-full"
                                                aria-hidden="true"
                                                style={{ overflow: 'visible' }}
                                            >
                                                <defs>
                                                    <linearGradient
                                                        id={`card-gradient-${index}`}
                                                        x1="0%"
                                                        y1="0%"
                                                        x2="100%"
                                                        y2="100%"
                                                    >
                                                        <stop
                                                            offset="0%"
                                                            stopColor="#06b6d4"
                                                        />
                                                        <stop
                                                            offset="50%"
                                                            stopColor="#7c3aed"
                                                        />
                                                        <stop
                                                            offset="100%"
                                                            stopColor="#a855f7"
                                                        />
                                                    </linearGradient>
                                                </defs>
                                                <rect
                                                    className="trace-rect"
                                                    x="1.25"
                                                    y="1.25"
                                                    width="calc(100% - 2.5px)"
                                                    height="calc(100% - 2.5px)"
                                                    rx="26"
                                                    ry="26"
                                                    style={{
                                                        stroke: `url(#card-gradient-${index})`,
                                                    }}
                                                />
                                                <rect
                                                    className="beam-rect"
                                                    x="1.25"
                                                    y="1.25"
                                                    width="calc(100% - 2.5px)"
                                                    height="calc(100% - 2.5px)"
                                                    rx="26"
                                                    ry="26"
                                                />
                                            </svg>

                                            {/* Dashboard Content */}
                                            <div className="relative z-10 flex h-full flex-col gap-4">
                                                {/* 1. Header: Title & Description */}
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-[13px] font-extrabold tracking-[0.15em] text-cyan-400 uppercase drop-shadow-sm">
                                                            {service?.name ||
                                                                categorySlug.replace(
                                                                    /-/g,
                                                                    ' ',
                                                                )}
                                                        </h3>
                                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 border border-cyan-400/20">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,1)]" />
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] font-medium leading-relaxed text-zinc-400 line-clamp-2">
                                                        {service?.tagline ||
                                                            'Premium digital solutions'}
                                                    </p>
                                                </div>

                                                {/* Main Demo Frame */}
                                                <div className="relative w-full flex-1 min-h-[7rem] overflow-hidden rounded-xl bg-zinc-950/60 ring-1 ring-white/10 transition-all duration-500 group-hover:ring-cyan-500/20 shadow-inner">
                                                    {portfolio ? (
                                                        <>
                                                            {portfolio.media_type ===
                                                            'video' ? (
                                                                <video
                                                                    src={
                                                                        portfolio.media_path ??
                                                                        undefined
                                                                    }
                                                                    muted
                                                                    autoPlay
                                                                    loop
                                                                    playsInline
                                                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={
                                                                        portfolio.media_path ??
                                                                        'https://placehold.co/600x400/111111/7C3AED?text=Opticore'
                                                                    }
                                                                    alt={
                                                                        portfolio.alt
                                                                    }
                                                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                                                />
                                                            )}
                                                            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/90 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                                                            <div className="absolute inset-x-0 bottom-0 p-3 pt-6 translate-y-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                                                                <p className="text-[10px] font-bold tracking-wider text-white line-clamp-1 drop-shadow-md">
                                                                    {portfolio.title}
                                                                </p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <img
                                                            src={
                                                                fallbackImage?.src ??
                                                                aboutBentoImages[
                                                                    index %
                                                                        aboutBentoImages.length
                                                                ].src
                                                            }
                                                            alt={
                                                                fallbackImage?.alt ??
                                                                aboutBentoImages[
                                                                    index %
                                                                        aboutBentoImages.length
                                                                ].alt
                                                            }
                                                            className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-[1.03] grayscale group-hover:grayscale-0 group-hover:opacity-60 saturate-50"
                                                        />
                                                    )}
                                                </div>

                                                {/* Info Grid / Stats */}
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {highlights.map((h, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-1.5 transition-colors group-hover:bg-white/[0.05] group-hover:border-white/10"
                                                        >
                                                            <div className="h-1 w-1 rounded-full bg-violet-400 shadow-[0_0_5px_rgba(167,139,250,0.8)]" />
                                                            <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">
                                                                {h}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
                                                    <span className="text-[8.5px] font-bold tracking-[0.15em] text-zinc-600 uppercase transition-colors group-hover:text-zinc-500">
                                                        System Active
                                                    </span>
                                                    <span className="text-[8.5px] font-bold tracking-[0.15em] text-zinc-600 uppercase transition-colors group-hover:text-zinc-500">
                                                        Opticore v3.0
                                                    </span>
                                                </div>

                                                {/* Spreading Particles on hover */}
                                                <div className="pointer-events-none absolute inset-0 z-20">
                                                    {denseParticles.map(
                                                        (p, i) => (
                                                            <div
                                                                key={i}
                                                                className={`particle-dot absolute ${p.size} rounded-full ${p.color} opacity-0 mix-blend-screen`}
                                                                style={
                                                                    {
                                                                        '--tx': `${p.tx}px`,
                                                                        '--ty': `${p.ty}px`,
                                                                        top: p.top,
                                                                        left: p.left,
                                                                        animationDelay: `${p.delay}s`,
                                                                        animationDuration: `${p.duration}s`,
                                                                    } as React.CSSProperties
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Testimonials"
                        title="Trusted by Brands That Expect More"
                        animationType="testimonials"
                        description="From identity overhauls to growth campaigns and production-heavy launches, our clients come to us when the work needs to feel sharp."
                        align="center"
                    />
                    <div className="mt-6 flex justify-center">
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200">
                            <CharmingStar />
                            4.9-star client satisfaction
                        </span>
                    </div>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={staggerContainer}
                        className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
                    >
                        {testimonials.map((testimonial) => (
                            <TestimonialCard
                                key={`${testimonial.name}-${testimonial.company}`}
                                testimonial={testimonial}
                            />
                        ))}
                    </motion.div>
                </div>
            </section>

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
                        <p className="section-kicker">Let’s Talk</p>
                        <h2 className="text-3xl font-extrabold text-balance text-white sm:text-4xl md:text-5xl">
                            Ready to Build Something Amazing?
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                            Whether you need a full brand system, campaign
                            creative, motion production, or a web experience
                            that performs, we can shape the right scope with
                            you.
                        </p>
                        <div className="mt-8 flex justify-center">
                            <MagneticButton
                                href="/request-appointment"
                                ariaLabel="Request an appointment with Opticore Solutions Ltd."
                                fullWidth={!desktop}
                            >
                                Start a Project{' '}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </MagneticButton>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
