import type { SharedPageProps } from '@/types';
import type { Variants } from 'framer-motion';

import { Head, Link, usePage } from '@inertiajs/react';
import { LazyMotion, m } from 'framer-motion';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { lazy, useEffect, useRef, useState, Suspense } from 'react';

const NebulaCluster = lazy(
    () => import('@/components/HomeRedesign/NebulaCluster'),
);
const SpotlightCarousel = lazy(
    () => import('@/components/HomeRedesign/SpotlightCarousel'),
);
import GradientOrb from '@/components/UI/GradientOrb';
import LazySection from '@/components/UI/LazySection';
import MagneticButton from '@/components/UI/MagneticButton';
import Marquee from '@/components/UI/Marquee';
import Modal, { ModalBody, ModalFooter } from '@/components/UI/Modal';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
    resolveCategoryColor,
    resolveCategoryIcon,
} from '@/lib/categoryVisuals';
import { clientLogos } from '@/lib/site';
import { portfolio } from '@/routes';

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
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.9, ease: easing },
    },
};

const FLOATING_POSITIONS = [
    // Positions strictly alternate left/right so any number of categories stays balanced.
    {
        className: 'top-[10%] left-[4%]',
        animation: { x: [0, 8, 0], y: [0, -12, 0], rotate: [0, 4, 0] },
    }, // 1 L
    {
        className: 'top-[14%] right-[5%]',
        animation: { x: [0, -10, 0], y: [0, 10, 0], rotate: [0, -4, 0] },
    }, // 2 R
    {
        className: 'bottom-[24%] left-[6%]',
        animation: { x: [0, 12, 0], y: [0, -8, 0], rotate: [0, 5, 0] },
    }, // 3 L
    {
        className: 'right-[8%] bottom-[20%]',
        animation: { x: [0, -12, 0], y: [0, 8, 0], rotate: [0, -5, 0] },
    }, // 4 R
    {
        className: 'top-[42%] left-[3%]',
        animation: { x: [0, 6, 0], y: [0, -10, 0], rotate: [0, -3, 0] },
    }, // 5 L
    {
        className: 'top-[42%] right-[3%]',
        animation: { x: [0, -8, 0], y: [0, 8, 0], rotate: [0, 4, 0] },
    }, // 6 R
    {
        className: 'bottom-[8%] left-[14%]',
        animation: { x: [0, 10, 0], y: [0, -6, 0], rotate: [0, 3, 0] },
    }, // 7 L
    {
        className: 'bottom-[8%] right-[14%]',
        animation: { x: [0, -6, 0], y: [0, -6, 0], rotate: [0, -3, 0] },
    }, // 8 R
];

// duplicatedServices removed due to being unused

// Temporarily disabled for testing — set back to true to re-enable the
// letter-by-letter arrival animation on the hero headline.
const HERO_TEXT_ANIMATION_ENABLED = true;

// The "We" word's smooth reposition as the phrase next to it changes width
// relies on framer-motion's `layout` prop (FLIP animation), which needs the
// `layout` feature — not included in `domAnimation`, the feature set
// AppLayout's site-wide LazyMotion loads. Scoping a `domMax` LazyMotion to
// just this component (dynamically imported, same idiom as AppLayout's own
// `loadFramerFeatures`) restores the smooth transition without adding the
// drag/layout engine to every other page's bundle.
const loadDomMax = () => import('framer-motion').then((mod) => mod.domMax);

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
    // The preload hint in app.blade.php only speeds up the font *fetch* — it
    // doesn't guarantee Metropolis-ExtraBold (weight 800) has finished
    // loading before this component's first paint. "We" renders immediately
    // (unlike the phrase text, which stays at opacity 0 until anime.js
    // reveals it well after hydration), so it's the one piece of text that
    // can visibly flash in the browser's fallback font/weight. Holding it
    // invisible until the Font Loading API confirms the weight is actually
    // ready avoids that flash; the timeout is a safety net if the API is
    // unsupported or the font fails to load.
    const [weFontReady, setWeFontReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        if (typeof document === 'undefined' || !('fonts' in document)) {
            setWeFontReady(true);
            return;
        }

        const fallback = setTimeout(() => {
            if (!cancelled) {
                setWeFontReady(true);
            }
        }, 500);

        document.fonts
            .load('800 1em Metropolis')
            .then(() => document.fonts.ready)
            .then(() => {
                if (!cancelled) {
                    clearTimeout(fallback);
                    setWeFontReady(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setWeFontReady(true);
                }
            });

        return () => {
            cancelled = true;
            clearTimeout(fallback);
        };
    }, []);

    useEffect(() => {
        if (!HERO_TEXT_ANIMATION_ENABLED) {
            const el = phraseRef.current;

            if (el) {
                el.style.opacity = '1';
                el.querySelectorAll<HTMLElement>('.anime-letter').forEach(
                    (letter) => {
                        letter.style.opacity = '1';
                    },
                );
            }

            return;
        }

        let animeInstance: any;
        let cancelled = false;

        const run = async () => {
            const anime =
                (await import('animejs')).default ?? (await import('animejs'));
            const el = phraseRef.current;

            if (!el || cancelled) {
                return;
            }

            // Reset container opacity for new phrase
            el.style.opacity = '1';

            // Align gradients across letters. All layout reads
            // (getBoundingClientRect) are batched before any style writes so
            // the browser doesn't recalculate layout once per letter.
            requestAnimationFrame(() => {
                const containerWidth = el.offsetWidth;
                const containerRect = el.getBoundingClientRect();
                const letters = Array.from(
                    el.querySelectorAll<HTMLElement>('.anime-letter'),
                );

                const offsets = letters.map(
                    (letter) =>
                        letter.getBoundingClientRect().left -
                        containerRect.left,
                );

                letters.forEach((letter, i) => {
                    letter.style.backgroundSize = `${containerWidth}px 100%`;
                    letter.style.backgroundPosition = `-${offsets[i]}px 0`;
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

        // Deferred to idle time (matching the pattern already used for
        // Reverb init in app.tsx) so the animejs module fetch and the
        // getBoundingClientRect measurement pass below don't compete with
        // the browser for main-thread time in the first frames after
        // hydration, when the hero paragraph's own enter animation is
        // trying to run. The letter-reveal sequence itself is unchanged —
        // only its start is pushed to whenever the thread is actually free.
        let idleHandle: number | ReturnType<typeof setTimeout>;

        if (typeof window.requestIdleCallback === 'function') {
            idleHandle = window.requestIdleCallback(() => void run(), {
                timeout: 300,
            });
        } else {
            idleHandle = setTimeout(() => void run(), 0);
        }

        return () => {
            cancelled = true;

            if (typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idleHandle as number);
            } else {
                clearTimeout(idleHandle as ReturnType<typeof setTimeout>);
            }

            if (animeInstance?.pause) {
                animeInstance.pause();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index]);

    const currentPhrase = phrases[index];

    return (
        <LazyMotion features={loadDomMax}>
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
            <m.h1
                layout
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                // An arbitrary-value weight (not the `font-extrabold`
                // utility) so this heading's weight is independent of the
                // sitewide --font-weight-extrabold override in app.css
                // (scoped to .site-typography) — bumping it here doesn't
                // change any other extrabold text on the site.
                className="pb-4 text-[2rem] leading-[1.3] font-[800] text-theme sm:text-4xl sm:leading-[1.2] md:text-5xl lg:text-6xl"
            >
                <m.span
                    layout
                    className="inline-block"
                    style={{ opacity: weFontReady ? 1 : 0 }}
                >
                    We
                </m.span>{' '}
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
                                        style={{
                                            opacity: HERO_TEXT_ANIMATION_ENABLED
                                                ? 0
                                                : 1,
                                        }}
                                    >
                                        {char}
                                    </span>
                                ))}
                            </span>
                        );
                    })}
                </span>
            </m.h1>
        </LazyMotion>
    );
}

interface HomeTestimonial {
    id: string;
    name: string;
    company: string;
    role: string;
    rating: number;
    comment: string;
    image?: string | null;
}

interface FloatingCardData {
    id: number;
    category: string;
    title: string;
    description: string;
    image: string;
    thumb: string;
    href: string;
}

interface HomeIndexProps {
    brands?: string[];
    testimonials?: HomeTestimonial[];
    floatingCards?: FloatingCardData[];
}

export default function HomeIndex({
    brands,
    testimonials,
    floatingCards,
}: HomeIndexProps) {
    const { flash, categories } = usePage<SharedPageProps>().props;
    const [errorModalOpen, setErrorModalOpen] = useState(
        !!flash?.payment_error,
    );
    const desktop = useMediaQuery('(min-width: 1024px)');

    const heroIcons = Object.values(categories)
        .slice(0, FLOATING_POSITIONS.length)
        .map((cat, index) => ({
            Icon: resolveCategoryIcon(cat.icon),
            colorClass: resolveCategoryColor(cat.color).text,
            ...FLOATING_POSITIONS[index],
        }));

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            requestAnimationFrame(() => {
                // Batch all getBoundingClientRect reads before any style/attribute
                // writes below, so resizing several cards at once doesn't force a
                // layout recalculation per card.
                const updates = entries.map((entry) => {
                    const card = entry.target as HTMLElement;
                    const box = card.getBoundingClientRect();

                    return {
                        card,
                        w: Math.round(box.width),
                        h: Math.round(box.height),
                    };
                });

                updates.forEach(({ card, w, h }) => {
                    const rect =
                        card.querySelector<SVGRectElement>('.trace-rect');
                    const beam =
                        card.querySelector<SVGRectElement>('.beam-rect');

                    if (!rect) {
                        return;
                    }

                    // Skip if dimensions haven't significantly changed
                    if (
                        card.dataset.lastW === `${w}` &&
                        card.dataset.lastH === `${h}`
                    ) {
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

                /* Split into two opacity-only layers (this element's base
                   background plus the ::after accent below) instead of
                   animating filter: drop-shadow, which most browsers can't
                   composite off the main thread. */
                @keyframes pulsateGlow {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.7; }
                }

                @keyframes pulsateGlowAccent {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 1; }
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
                    background: radial-gradient(circle at center, rgba(6, 182, 212, 0.3) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.6s ease;
                    pointer-events: none;
                    z-index: 0;
                }

                .aura-glow::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: radial-gradient(circle at center, rgba(168, 85, 247, 0.6) 0%, transparent 70%);
                    opacity: 0;
                }

                .group:hover .aura-glow {
                    opacity: 1;
                    animation: pulsateGlow 3s ease-in-out infinite;
                }

                .group:hover .aura-glow::after {
                    animation: pulsateGlowAccent 3s ease-in-out infinite;
                }
            `}</style>
            <Head>
                <title>
                    Opticore Solutions Limited — Affordable Services for All
                </title>
                <meta
                    name="description"
                    content="From graphic design to web development, Opticore Solutions Limited creates premium digital experiences that help brands grow."
                />
                <meta
                    property="og:title"
                    content="Opticore Solutions Limited — Affordable Services for All"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>

            <section className="hero-noise relative flex min-h-svh items-center overflow-hidden px-4 pt-28 pb-16 sm:px-6 lg:px-8">
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
                    <m.span
                        variants={blurReveal}
                        initial="hidden"
                        animate="visible"
                        className="neo-btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-black tracking-widest uppercase sm:text-sm"
                    >
                        <Sparkles className="drop-icon h-4 w-4 text-violet-500 dark:text-violet-400" />
                        <span className="[animation:shimmer_2.5s_linear_infinite] bg-[linear-gradient(120deg,var(--theme-text-muted),var(--theme-text),var(--theme-text-muted))] bg-[length:200%_100%] bg-clip-text text-transparent dark:bg-[linear-gradient(120deg,rgba(255,255,255,0.5),rgba(255,255,255,1),rgba(255,255,255,0.5))]">
                            Premium Creative & Digital Solutions
                        </span>
                    </m.span>

                    <div className="mt-8 max-w-5xl">
                        <HeroHeadline />
                    </div>

                    <p className="mx-auto mt-12 max-w-2xl text-base leading-8 text-theme-muted sm:mt-8 sm:text-lg md:text-xl">
                        We help businesses transform ideas into powerful digital
                        experiences through creative design, cinematic video
                        production, immersive 3D visualization, strategic
                        marketing, and modern web development.
                    </p>

                    <m.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.55 }}
                        className="mt-10 flex w-full max-w-md flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center"
                    >
                        <MagneticButton
                            href="/hire-us"
                            ariaLabel="Start a project with Opticore Solutions Limited"
                            className="neo-btn-primary min-w-[180px] rounded-full px-8 py-4 text-base font-black shadow-lg transition-all hover:scale-105"
                        >
                            Start Your Project
                        </MagneticButton>
                        <Link
                            href={portfolio.url()}
                            className="neo-btn-ghost touch-target inline-flex min-w-[180px] items-center justify-center rounded-full px-8 py-4 text-base font-black text-theme transition-all hover:scale-105 hover:bg-theme-surface-hover"
                        >
                            Explore Our Work
                        </Link>
                    </m.div>

                    {desktop ? (
                        <div className="pointer-events-none absolute inset-0 hidden xl:block">
                            {heroIcons.map(
                                ({
                                    Icon,
                                    className,
                                    animation,
                                    colorClass,
                                }) => (
                                    <m.div
                                        key={className}
                                        className={`absolute ${className} flex h-16 w-16 items-center justify-center rounded-2xl border border-theme bg-theme-surface ${colorClass} backdrop-blur-md`}
                                        animate={animation}
                                        transition={{
                                            duration: 6,
                                            repeat: Number.POSITIVE_INFINITY,
                                            ease: 'easeInOut',
                                            times: [0, 0.5, 1],
                                        }}
                                    >
                                        <Icon className="h-8 w-8" />
                                    </m.div>
                                ),
                            )}
                        </div>
                    ) : null}
                </div>
            </section>

            <Suspense
                fallback={
                    <div className="flex h-96 w-full items-center justify-center text-sm text-zinc-500">
                        Loading sections...
                    </div>
                }
            ></Suspense>

            <div className="relative z-10">
                {/* Nebula Cluster */}
                <div className="relative overflow-hidden">
                    <GradientOrb
                        className="top-0 right-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3"
                        color="rgb(139 92 246 / 0.18)"
                    />
                    <GradientOrb
                        className="bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/3 translate-y-1/3"
                        color="rgb(6 182 212 / 0.14)"
                    />
                    <LazySection minHeightClassName="min-h-[90vh]">
                        <NebulaCluster cards={floatingCards} />
                    </LazySection>
                </div>

                {/* Spotlight Carousel */}
                <div className="relative overflow-hidden">
                    <GradientOrb
                        className="top-0 left-0 h-[480px] w-[480px] -translate-x-1/3 -translate-y-1/3"
                        color="rgb(124 58 237 / 0.15)"
                    />
                    <GradientOrb
                        className="right-0 bottom-0 h-[480px] w-[480px] translate-x-1/3 translate-y-1/3"
                        color="rgb(6 182 212 / 0.12)"
                    />

                    <LazySection minHeightClassName="min-h-[70vh]">
                        <SpotlightCarousel testimonials={testimonials} />
                    </LazySection>
                </div>
            </div>

            {/* Marquee */}
            <section className="section-shell pt-0 pb-6">
                <div className="section-inner flex flex-col items-center">
                    <span className="neo-btn-ghost mb-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-[10px] font-black tracking-widest text-theme-muted uppercase sm:text-[11px]">
                        <Sparkles className="drop-icon h-4 w-4 text-violet-500 dark:text-violet-400" />
                        Trusted by Industry Leaders
                    </span>
                    <div className="w-full">
                        <Marquee
                            items={
                                brands && brands.length > 0
                                    ? brands
                                    : clientLogos
                            }
                        />
                    </div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <div className="neo-panel-elevated relative overflow-hidden px-6 py-12 text-center sm:px-10 sm:py-16 lg:px-14">
                        {/* Background Gradients */}
                        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/5" />
                        <div className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/5" />

                        <div className="relative z-10 flex flex-col items-center">
                            <span className="neo-btn-ghost mb-8 inline-flex items-center gap-2 rounded-full px-5 py-2 text-[10px] font-black tracking-widest text-theme-muted uppercase sm:text-[11px]">
                                <Sparkles className="drop-icon h-4 w-4 text-violet-500 dark:text-violet-400" />
                                Ready to Scale?
                            </span>

                            <h2 className="text-3xl font-black tracking-tight text-balance text-theme sm:text-4xl md:text-5xl lg:text-6xl">
                                Hire the Industry's{' '}
                                <br className="hidden sm:block" />
                                <span className="text-violet-600 dark:text-violet-400">
                                    Finest Talent
                                </span>
                            </h2>

                            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-theme-muted sm:text-lg">
                                Whether you need a full brand system, campaign
                                creative, motion production, or a web experience
                                that performs, we can shape the right scope with
                                you.
                            </p>

                            <div className="mt-12 flex justify-center">
                                <div className="flex items-center rounded-full border border-slate-300 bg-linear-to-b from-slate-100 to-slate-200 p-2 shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950 dark:shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
                                    <MagneticButton
                                        href="/hire-us"
                                        ariaLabel="Hire Us — contact Opticore Solutions Limited now"
                                        className="neo-btn-primary rounded-full px-10 py-4 text-base font-black tracking-tight shadow-xl"
                                    >
                                        Hire Us{' '}
                                        <ArrowRight className="drop-icon ml-2 h-5 w-5" />
                                    </MagneticButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Payment Failure / Cancel Modal */}
            {flash?.payment_error && (
                <Modal
                    accent="red"
                    open={errorModalOpen}
                    title="Payment Unsuccessful"
                    onClose={() => setErrorModalOpen(false)}
                >
                    <ModalBody>
                        <div className="flex flex-col items-center gap-5 text-center">
                            <m.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                    rotate: [0, -6, 5, -3, 0],
                                }}
                                transition={{
                                    scale: {
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 20,
                                    },
                                    opacity: { duration: 0.3 },
                                    rotate: {
                                        duration: 0.5,
                                        delay: 0.15,
                                        ease: 'easeOut',
                                    },
                                }}
                                className="relative flex h-18 w-18 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30"
                            >
                                <m.span
                                    aria-hidden
                                    className="absolute inset-0 rounded-full bg-red-500/20"
                                    animate={{
                                        scale: [1, 1.5, 1.5],
                                        opacity: [0.5, 0, 0],
                                    }}
                                    transition={{
                                        duration: 1.8,
                                        repeat: Infinity,
                                        ease: 'easeOut',
                                    }}
                                />
                                <AlertCircle className="relative h-9 w-9 text-red-500" />
                            </m.div>
                            <div>
                                <p className="text-lg font-bold text-theme">
                                    Something went wrong
                                </p>
                                <p className="mt-1.5 text-sm text-theme-muted">
                                    {flash.payment_error}
                                </p>
                            </div>
                        </div>
                    </ModalBody>

                    <ModalFooter className="sm:justify-center">
                        {flash.checkout_url && (
                            <Link
                                href={flash.checkout_url}
                                className="neo-btn-primary flex-1 rounded-xl px-6 py-2.5 text-center text-sm font-semibold transition-all hover:scale-[1.02]"
                                onClick={() => setErrorModalOpen(false)}
                            >
                                Try Again
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={() => setErrorModalOpen(false)}
                            className="neo-btn-ghost flex-1 rounded-xl px-6 py-2.5 text-sm font-semibold text-theme transition-all hover:scale-[1.02]"
                        >
                            Dismiss
                        </button>
                    </ModalFooter>
                </Modal>
            )}
        </>
    );
}
