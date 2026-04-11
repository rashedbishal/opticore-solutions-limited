import { Head, Link } from '@inertiajs/react';
import { portfolioShow } from '@/routes';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
    ArrowDown,
    ArrowRight,
    Box,
    Clapperboard,
    CodeXml,
    Megaphone,
    Palette,
    Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useMemo, useState } from 'react';
import Section2 from '@/components/Robot/Section2';
import Section3 from '@/components/Robot/Section3';
import Section4 from '@/components/Robot/Section4';
import Section5 from '@/components/Robot/Section5';
import AnimatedCounter from '@/components/UI/AnimatedCounter';
import GradientOrb from '@/components/UI/GradientOrb';
import MagneticButton from '@/components/UI/MagneticButton';
import Marquee from '@/components/UI/Marquee';
import ScannedServiceCard, {
    ServiceCarousel,
} from '@/components/UI/ScannedServiceCard';
import SectionHeader from '@/components/UI/SectionHeader';
import ServiceCard from '@/components/UI/ServiceCard';
import TestimonialCard from '@/components/UI/TestimonialCard';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
    aboutBentoImages,
    clientLogos,
    homeStats,
    services,
    testimonials,
} from '@/lib/site';

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
        icon: Palette,
        className: 'top-[10%] left-[4%]',
        animation: { x: [0, 8, 0], y: [0, -12, 0], rotate: [0, 4, 0] },
    },
    {
        icon: Megaphone,
        className: 'top-[14%] right-[5%]',
        animation: { x: [0, -10, 0], y: [0, 10, 0], rotate: [0, -4, 0] },
    },
    {
        icon: Clapperboard,
        className: 'bottom-[24%] left-[6%]',
        animation: { x: [0, 12, 0], y: [0, -8, 0], rotate: [0, 5, 0] },
    },
    {
        icon: Box,
        className: 'right-[8%] bottom-[20%]',
        animation: { x: [0, -12, 0], y: [0, 8, 0], rotate: [0, -5, 0] },
    },
    {
        icon: CodeXml,
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
    }, [index]);

    const currentPhrase = phrases[index];

    return (
        <>
            <style>{`
                .anime-letter {
                    display: inline-block;
                    line-height: 1.1em;
                }
                .anime-word {
                    display: inline-block;
                    white-space: nowrap;
                    margin-right: 0.15em;
                }
            `}</style>
            <motion.h1
                layout
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="pb-2 text-[2rem] leading-[1.2] font-extrabold text-white sm:text-5xl sm:leading-[1.12] md:text-6xl lg:text-7xl"
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


export default function HomeIndex() {
    const glowDelays = [0, 3, 2, 1];
    const bentoOrder = [0, 3, 2, 1];
    const desktop = useMediaQuery('(min-width: 1024px)');
    const [isPaused, setIsPaused] = useState(false);
    const handlePointerEnter = () => setIsPaused(true);
    const handlePointerLeave = () => setIsPaused(false);
    const handlePointerDown = () => setIsPaused(true);

    const statVariants = useMemo(() => [slideLeft, fadeUp, slideRight], []);

    useEffect(() => {
        const measure = () => {
            const cards = document.querySelectorAll<HTMLElement>('.bento-card');
            cards.forEach((card) => {
                const rect = card.querySelector<SVGRectElement>('.trace-rect');

                if (!rect) {
                    return;
                }

                const w = card.offsetWidth;
                const h = card.offsetHeight;
                const r = 26;
                const perim = 2 * (w + h) - 8 * r + 2 * Math.PI * r;
                card.style.setProperty('--perim', `${perim}px`);
                rect.setAttribute('width', `${w - 2.5}`);
                rect.setAttribute('height', `${h - 2.5}`);
            });
        };

        measure(); // run immediately
        window.addEventListener('resize', measure); // re-run on resize

        return () => window.removeEventListener('resize', measure); // cleanup
    }, []);

    return (
        <>
            <style>{`
    .bento-card {
        position: relative;
    }
    .bento-card svg.glow-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
        border-radius: inherit;
        overflow: visible;
    }
    .bento-card svg.glow-svg .trace-rect {
        fill: none;
        stroke-width: 2.5;
        stroke-linecap: round;
    }


    @keyframes traceAnim {
        0%   { stroke-dashoffset: var(--perim); opacity: 1; }
        25%  { stroke-dashoffset: 0;            opacity: 1; }
        26%  { opacity: 0; }
        100% { stroke-dashoffset: 0;            opacity: 0; }
    }

    .bento-card[data-order="0"] .trace-rect {
        stroke: url(#glowGrad0);
        stroke-dasharray: var(--perim);
        stroke-dashoffset: var(--perim);
        opacity: 0;
        animation: traceAnim 16s linear infinite;
        animation-delay: 0s;
    }
    .bento-card[data-order="1"] .trace-rect {
        stroke: url(#glowGrad1);
        stroke-dasharray: var(--perim);
        stroke-dashoffset: var(--perim);
        opacity: 0;
        animation: traceAnim 16s linear infinite;
        animation-delay: 12s;
    }
    .bento-card[data-order="2"] .trace-rect {
        stroke: url(#glowGrad2);
        stroke-dasharray: var(--perim);
        stroke-dashoffset: var(--perim);
        opacity: 0;
        animation: traceAnim 16s linear infinite;
        animation-delay: 8s;
    }
    .bento-card[data-order="3"] .trace-rect {
        stroke: url(#glowGrad3);
        stroke-dasharray: var(--perim);
        stroke-dashoffset: var(--perim);
        opacity: 0;
        animation: traceAnim 16s linear infinite;
        animation-delay: 4s;
    }

    /* Hover particle glow */
    .bento-card:hover .trace-rect {
        animation: none !important;
        stroke-dashoffset: 0 !important;
        opacity: 1 !important;
        filter: drop-shadow(0 0 6px #7c3aed) drop-shadow(0 0 12px #06b6d4);
    }
    .bento-card:hover .glow-particles circle {
        opacity: 1 !important;
        animation: particleDrift 1.5s ease-in-out infinite alternate !important;
    }
    @keyframes particleDrift {
        0%   { transform: translate(0, 0) scale(1); }
        100% { transform: translate(var(--dx), var(--dy)) scale(1.8); }
    }
    .glow-particles circle {
        opacity: 0;
        transition: opacity 0.3s;
    }
`}</style>
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient
                        id="glowGrad0"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
                        <stop offset="40%" stopColor="#7c3aed" />
                        <stop offset="60%" stopColor="#06b6d4" />
                        <stop
                            offset="100%"
                            stopColor="#06b6d4"
                            stopOpacity="0"
                        />
                    </linearGradient>
                    <linearGradient
                        id="glowGrad1"
                        x1="100%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                        <stop offset="40%" stopColor="#06b6d4" />
                        <stop offset="60%" stopColor="#7c3aed" />
                        <stop
                            offset="100%"
                            stopColor="#7c3aed"
                            stopOpacity="0"
                        />
                    </linearGradient>
                    <linearGradient
                        id="glowGrad2"
                        x1="0%"
                        y1="100%"
                        x2="100%"
                        y2="0%"
                    >
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
                        <stop offset="40%" stopColor="#a855f7" />
                        <stop offset="60%" stopColor="#06b6d4" />
                        <stop
                            offset="100%"
                            stopColor="#06b6d4"
                            stopOpacity="0"
                        />
                    </linearGradient>
                    <linearGradient
                        id="glowGrad3"
                        x1="100%"
                        y1="100%"
                        x2="0%"
                        y2="0%"
                    >
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                        <stop offset="40%" stopColor="#06b6d4" />
                        <stop offset="60%" stopColor="#a855f7" />
                        <stop
                            offset="100%"
                            stopColor="#a855f7"
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>
            </svg>
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
                            href={portfolioShow.url({ type: 'graphic-design' })}
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

            <Section2 />
            <Section3 />
            <Section4 />
            <Section5 />

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Services"
                        title="What We Do Best"
                        description="Opticore combines premium creative direction with production discipline so every deliverable looks refined and performs with intent."
                    />

                    <div className="-mx-4 mt-10 sm:-mx-6 lg:-mx-8">
                        <ServiceCarousel services={duplicatedServices} />
                    </div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={desktop ? slideLeft : fadeUp}
                    >
                        <span className="section-kicker">About Opticore</span>
                        <h2 className="text-3xl font-extrabold text-balance text-white sm:text-4xl md:text-5xl">
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
                        className="grid grid-cols-2 gap-3 md:gap-4"
                    >
                        {aboutBentoImages.map((image, index) => (
                            <div
                                key={image.src}
                                data-order={bentoOrder[index]}
                                className={`bento-card glass-panel overflow-hidden rounded-[1.75rem] ${index === 0 || index === 3 ? 'translate-y-0 md:translate-y-6' : ''}`}
                            >
                                {/*
                SVG overlay — stroke-dashoffset animation travels
                along the exact rounded-rect path, hugging every corner.
                --perim is set by the JS below via ResizeObserver.
            */}
                                <svg className="glow-svg" aria-hidden="true">
                                    <rect
                                        className="trace-rect"
                                        x="1.25"
                                        y="1.25"
                                        width="calc(100% - 2.5px)"
                                        height="calc(100% - 2.5px)"
                                        rx="26"
                                        ry="26"
                                    />
                                    {/* Hover particles scattered around the border */}
                                    <g className="glow-particles">
                                        {[
                                            {
                                                cx: '15%',
                                                cy: '0%',
                                                dx: '0px',
                                                dy: '-6px',
                                                c: '#7c3aed',
                                            },
                                            {
                                                cx: '50%',
                                                cy: '0%',
                                                dx: '4px',
                                                dy: '-8px',
                                                c: '#06b6d4',
                                            },
                                            {
                                                cx: '85%',
                                                cy: '0%',
                                                dx: '0px',
                                                dy: '-6px',
                                                c: '#a855f7',
                                            },
                                            {
                                                cx: '100%',
                                                cy: '30%',
                                                dx: '6px',
                                                dy: '0px',
                                                c: '#06b6d4',
                                            },
                                            {
                                                cx: '100%',
                                                cy: '70%',
                                                dx: '8px',
                                                dy: '4px',
                                                c: '#7c3aed',
                                            },
                                            {
                                                cx: '85%',
                                                cy: '100%',
                                                dx: '0px',
                                                dy: '6px',
                                                c: '#06b6d4',
                                            },
                                            {
                                                cx: '50%',
                                                cy: '100%',
                                                dx: '-4px',
                                                dy: '8px',
                                                c: '#a855f7',
                                            },
                                            {
                                                cx: '15%',
                                                cy: '100%',
                                                dx: '0px',
                                                dy: '6px',
                                                c: '#7c3aed',
                                            },
                                            {
                                                cx: '0%',
                                                cy: '70%',
                                                dx: '-6px',
                                                dy: '0px',
                                                c: '#06b6d4',
                                            },
                                            {
                                                cx: '0%',
                                                cy: '30%',
                                                dx: '-8px',
                                                dy: '-4px',
                                                c: '#a855f7',
                                            },
                                        ].map((p, i) => (
                                            <circle
                                                key={i}
                                                cx={p.cx}
                                                cy={p.cy}
                                                r="3"
                                                fill={p.c}
                                                style={
                                                    {
                                                        '--dx': p.dx,
                                                        '--dy': p.dy,
                                                        animationDelay: `${i * 0.15}s`,
                                                    } as React.CSSProperties
                                                }
                                            />
                                        ))}
                                    </g>
                                </svg>

                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            'https://placehold.co/600x400/111111/7C3AED?text=Opticore';
                                    }}
                                    className="aspect-square w-full object-cover"
                                />
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
                        description="From identity overhauls to growth campaigns and production-heavy launches, our clients come to us when the work needs to feel sharp."
                        align="center"
                    />
                    <div className="mt-6 flex justify-center">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200">
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
                    <Marquee items={clientLogos} />
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
