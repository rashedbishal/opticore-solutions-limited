import { Head, Link } from '@inertiajs/react';
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
    Star,
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
import { portfolioShow } from '@/routes';
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
                    clipPath: { duration: 1.2, delay: 0.6, ease: "easeInOut" },
                    rotate: { 
                        duration: 8, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        times: [0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 0.95, 1] 
                    },
                    scale: { 
                        duration: 8, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        times: [0, 0.2, 0.4, 0.6, 0.8, 1]
                    }
                }}
                className="absolute inset-0 flex items-center justify-center text-amber-400"
            >
                <Star strokeWidth={0} className="h-4 w-4 fill-current drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
            </motion.div>

            {/* The Recurring Sparkle */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                    scale: [0, 1.8, 0, 0, 0], 
                    opacity: [0, 1, 0, 0, 0], 
                    rotate: [0, 45, 90, 90, 90] 
                }}
                transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    repeatDelay: 1,
                    ease: "circOut",
                    times: [0, 0.15, 0.3, 0.6, 1]
                }}
                className="absolute -top-1 -right-1 pointer-events-none"
            >
                <Sparkles strokeWidth={0} className="h-3 w-3 fill-current text-white shadow-[0_0_10px_white]" />
            </motion.div>
        </div>
    );
}

interface HomeIndexProps {
    featuredPortfolios: Record<string, PortfolioItem[]>;
    brands?: string[];
}

export default function HomeIndex({ featuredPortfolios, brands }: HomeIndexProps) {
    const categoriesMapped = [
        'graphic-design',
        'digital-marketing',
        '3d-production',
        'web-development',
    ];
    const bentoOrder = [0, 3, 2, 1];
    const desktop = useMediaQuery('(min-width: 1024px)');
    const [isPaused, setIsPaused] = useState(false);
    const handlePointerEnter = () => setIsPaused(true);
    const handlePointerLeave = () => setIsPaused(false);
    const handlePointerDown = () => setIsPaused(true);

    const statVariants = useMemo(() => [slideLeft, fadeUp, slideRight], []);

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                const card = entry.target as HTMLElement;
                const rect = card.querySelector<SVGRectElement>('.trace-rect');

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
                    0% { transform: translate(0, 0) scale(1.5); opacity: 0; }
                    15% { opacity: 1; }
                    100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
                }

                @keyframes pulsateGlow {
                    0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.4)); }
                    50% { opacity: 1; filter: drop-shadow(0 0 25px rgba(168, 85, 247, 0.8)); }
                }

                .border-glow-hover {
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }
                
                .group:hover .border-glow-hover {
                    animation: spin 2.5s linear infinite;
                    opacity: 1 !important;
                }

                .group:hover .particle-dot {
                    animation: particleShoot 1.3s ease-out infinite;
                }
                
                .group:hover .aura-glow {
                    animation: pulsateGlow 2.5s ease-in-out infinite;
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
                        {aboutBentoImages.map((image, index) => {
                            const categorySlug = categoriesMapped[index];
                            const portfolios = featuredPortfolios?.[categorySlug] || [];
                            const portfolio = portfolios[0] || null;
                            const service = services.find((s) => s.key === categorySlug);

                            const categoryHighlights: Record<string, string[]> = {
                                'graphic-design': ['Pixel Perfect', 'Brand Ready', 'High Contrast'],
                                'digital-marketing': ['ROI Focused', 'Growth Tracked', 'Data Driven'],
                                '3d-production': ['Ultra-Realistic', 'Sim-Optimized', '4K Render'],
                                'web-development': ['Core Vitals', 'UX Polished', 'Responsive'],
                            };

                            const highlights = categoryHighlights[categorySlug] || [];

                            const denseParticles = Array.from({ length: 240 }).map((_, i) => {
                                const side = Math.floor(i / 60);
                                const offset = (i % 60) / 59;

                                let top, left, tx, ty;
                                const spread = Math.sin(i * 123.45) * 60;
                                const dist = 20 + Math.abs(Math.cos(i * 321.45) * 70);

                                if (side === 0) {
                                    top = '-1%'; left = `${offset * 100}%`;
                                    ty = -dist; tx = spread;
                                } else if (side === 2) {
                                    top = '101%'; left = `${offset * 100}%`;
                                    ty = dist; tx = spread;
                                } else if (side === 1) {
                                    left = '101%'; top = `${offset * 100}%`;
                                    tx = dist; ty = spread;
                                } else {
                                    left = '-1%'; top = `${offset * 100}%`;
                                    tx = -dist; ty = spread;
                                }

                                const isCyan = i % 2 === 0;

                                return {
                                    top, left, tx, ty,
                                    size: 'h-[1px] w-[1px]',
                                    color: isCyan ? 'bg-cyan-400' : 'bg-violet-400',
                                    shadow: '',
                                    delay: Math.abs(Math.sin(i * 555)) * 0.6,
                                    duration: 0.5 + Math.abs(Math.cos(i * 777)) * 1.5,
                                };
                            });

                            return (
                                <div
                                    key={image.src}
                                    data-order={bentoOrder[index]}
                                    className={`bento-card glass-panel group relative flex flex-col overflow-hidden rounded-[1.75rem] p-5 transition-all duration-500 md:p-6 lg:p-7 ${index === 0 || index === 3 ? 'translate-y-0 md:translate-y-6' : ''}`}
                                >
                                    {/* SVG Trace Layer */}
                                    <svg className="glow-svg pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                                        <rect
                                            className="trace-rect"
                                            x="1.25"
                                            y="1.25"
                                            width="calc(100% - 2.5px)"
                                            height="calc(100% - 2.5px)"
                                            rx="26"
                                            ry="26"
                                        />
                                        <g className="glow-particles">
                                            {[
                                                { cx: '15%', cy: '0%', dx: '0px', dy: '-6px', c: '#7c3aed' },
                                                { cx: '50%', cy: '0%', dx: '4px', dy: '-8px', c: '#06b6d4' },
                                                { cx: '85%', cy: '0%', dx: '0px', dy: '-6px', c: '#a855f7' },
                                            ].map((p, i) => (
                                                <circle
                                                    key={i}
                                                    cx={p.cx}
                                                    cy={p.cy}
                                                    r="2.5"
                                                    fill={p.c}
                                                    style={{
                                                        '--dx': p.dx,
                                                        '--dy': p.dy,
                                                        animationDelay: `${i * 0.15}s`,
                                                    } as React.CSSProperties}
                                                />
                                            ))}
                                        </g>
                                    </svg>

                                    {/* Dashboard Content */}
                                    <div className="relative z-10 flex h-full flex-col">
                                        {/* Header */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
                                                    {service?.name || categorySlug.replace(/-/g, ' ')}
                                                </h3>
                                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                            </div>
                                            <p className="mt-1 text-[11px] font-medium text-zinc-400 line-clamp-1">
                                                {service?.tagline || 'Premium digital solutions'}
                                            </p>
                                        </div>

                                        {/* Main Demo Frame */}
                                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-950/50 ring-1 ring-white/10 group-hover:ring-cyan-500/30 transition-all duration-500">
                                            {portfolio ? (
                                                <>
                                                    {portfolio.media_type === 'video' ? (
                                                        <video
                                                            src={portfolio.media_path ?? undefined}
                                                            muted autoPlay loop playsInline
                                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={portfolio.media_path ?? 'https://placehold.co/600x400/111111/7C3AED?text=Opticore'}
                                                            alt={portfolio.alt}
                                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500" />
                                                    <div className="absolute inset-x-0 bottom-0 p-3 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition-all duration-500">
                                                        <p className="text-[10px] font-bold text-white line-clamp-1">{portfolio.title}</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <img
                                                    src={image.src}
                                                    alt={image.alt}
                                                    className="h-full w-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110 grayscale"
                                                />
                                            )}
                                        </div>

                                        {/* Info Grid / Stats */}
                                        <div className="mt-auto pt-4">
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {highlights.map((h, i) => (
                                                    <div key={i} className={`flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 transition-colors group-hover:bg-white/[0.05] ${i === 2 ? 'sm:col-span-2' : ''}`}>
                                                        <div className="h-1 w-1 rounded-full bg-violet-400" />
                                                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{h}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                                                <span className="text-[9px] font-bold tracking-widest text-zinc-600 uppercase">System Active</span>
                                                <span className="text-[9px] font-bold tracking-widest text-zinc-600 uppercase">Opticore v3.0</span>
                                            </div>
                                        </div>

                                    {/* Spreading Particles on hover */}
                                    <div className="pointer-events-none absolute inset-0 z-20">
                                        {denseParticles.map((p, i) => (
                                            <div
                                                key={i}
                                                className={`particle-dot absolute ${p.size} rounded-full ${p.color} opacity-0 mix-blend-screen`}
                                                style={{
                                                    '--tx': `${p.tx}px`,
                                                    '--ty': `${p.ty}px`,
                                                    top: p.top,
                                                    left: p.left,
                                                    animationDelay: `${p.delay}s`,
                                                    animationDuration: `${p.duration}s`,
                                                } as React.CSSProperties}
                                            />
                                        ))}
                                    </div>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Testimonials"
                        title="Trusted by Brands That Expect More"
                        titles={[
                            'Trusted by Brands That Expect More',
                            'Real Stories from Exceptional Partners',
                            'Building Trust Through Design Excellence',
                            'Proven Results for Visionary Brands',
                            'What Our Partners Say About Opticore',
                        ]}
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
                    <Marquee items={(brands && brands.length > 0) ? brands : clientLogos} />
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
