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
} from 'lucide-react';
import { useEffect, useRef, useMemo, useState } from 'react';
import AnimatedCounter from '@/components/UI/AnimatedCounter';
import GradientOrb from '@/components/UI/GradientOrb';
import MagneticButton from '@/components/UI/MagneticButton';
import Marquee from '@/components/UI/Marquee';
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
import ScannedServiceCard, {
    ServiceCarousel,
} from '@/components/UI/ScannedServiceCard';
import Section2 from '@/components/Robot/Section2';
import Section3 from '@/components/Robot/Section3';
import Section4 from '@/components/Robot/Section4';
import Section5 from '@/components/Robot/Section5';
import RobotScene3D from '@/components/Robot/RobotScene3D';

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
    const headlineRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        let timelineInstance: any;

        const run = async () => {
            const anime =
                (await import('animejs')).default ?? (await import('animejs'));

            const el = headlineRef.current;
            if (!el) return;

            // Build HTML: wrap each letter in a span, preserving gradient-text per word
            const words =
                'We Build Brands That Leave a Lasting Impression'.split(' ');
            el.innerHTML = words
                .map((word, wi) => {
                    const isGradient = wi > 1;
                    const letters = word
                        .split('')
                        .map(
                            (char) =>
                                `<span class='anime-letter${isGradient ? ' gradient-text' : ''}'>${char}</span>`,
                        )
                        .join('');
                    return `<span class='anime-word'>${letters}</span>`;
                })
                .join(' ');

            timelineInstance = (anime as any)
                .timeline({ loop: true })
                .add({
                    targets: '.anime-letter',
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
                    delay: 1000,
                });
        };

        run();

        return () => {
            if (timelineInstance?.pause) timelineInstance.pause();
        };
    }, []);

    return (
        <>
            <style>{`
                .anime-letter {
                    display: inline-block;
                    line-height: 1em;
                }
                .anime-word {
                    display: inline-block;
                    white-space: nowrap;
                }
            `}</style>
            <h1
                ref={headlineRef}
                className="pb-2 text-4xl leading-[1.12] font-extrabold text-balance text-white sm:text-5xl md:text-6xl lg:text-7xl"
            >
                We Build Brands That Leave a Lasting Impression
            </h1>
        </>
    );
}

export default function HomeIndex() {
    const desktop = useMediaQuery('(min-width: 1024px)');
    const [isPaused, setIsPaused] = useState(false);
    const handlePointerEnter = () => setIsPaused(true);
    const handlePointerLeave = () => setIsPaused(false);
    const handlePointerDown = () => setIsPaused(true);

    const statVariants = useMemo(() => [slideLeft, fadeUp, slideRight], []);

    return (
        <>
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

            <RobotScene3D />

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
                        className="mx-auto mt-8 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg md:text-xl"
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
                            href="/portfolio/logo-identity"
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
                                        className={`absolute ${className} flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/4 text-violet-300/80 backdrop-blur-md`}
                                        animate={animation}
                                        transition={{
                                            duration: 6,
                                            repeat: Number.POSITIVE_INFINITY,
                                            ease: 'easeInOut',
                                        }}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </motion.div>
                                ),
                            )}
                        </div>
                    ) : null}

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.75 }}
                        className="mt-16 flex flex-col items-center gap-2 text-zinc-400"
                    >
                        <span className="text-xs font-semibold tracking-[0.24em] uppercase">
                            Scroll
                        </span>
                        <ArrowDown className="h-5 w-5 animate-bounce text-cyan-300" />
                    </motion.div>
                </div>
            </section>

            <div className="robot-3d-trigger relative">
                <Section2 />
                <Section3 />
                <Section4 />
                <Section5 />
            </div>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Services"
                        title="What We Do Best"
                        description="Opticore combines premium creative direction with production discipline so every deliverable looks refined and performs with intent."
                    />

                    <div className="mt-10 -mx-4 sm:-mx-6 lg:-mx-8">
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
                                className={`glass-panel overflow-hidden rounded-[1.75rem] ${index === 0 || index === 3 ? 'translate-y-0 md:translate-y-6' : ''}`}
                            >
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
