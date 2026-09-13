import type { Variants } from 'framer-motion';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    m as motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from 'framer-motion';
import { ArrowRight, Layers3 } from 'lucide-react';
import GradientOrb from '@/components/UI/GradientOrb';
import MagneticButton from '@/components/UI/MagneticButton';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
    resolveCategoryColor,
    resolveCategoryIcon,
} from '@/lib/categoryVisuals';
import { cn } from '@/lib/utils';
import { portfolioCategory } from '@/routes';

interface Category {
    slug: string;
    label: string;
    description: string;
    icon: string | null;
    color: string | null;
    cover: string | null;
    previews?: string[] | null;
    sub_categories_count: number;
    portfolios_count: number;
}

interface Props {
    categories: Category[];
    meta: {
        title: string;
        ogTitle: string | null;
        description: string;
        ogDescription: string | null;
    };
}

const staggerGrid: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const cardVariant: Variants = {
    hidden: { opacity: 0, y: 28, scale: 0.96 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
};

function CoverMosaic({
    cover,
    previews,
    label,
    featured,
    Icon,
    color,
}: {
    cover: string | null;
    previews?: string[] | null;
    label: string;
    featured: boolean;
    Icon: ReturnType<typeof resolveCategoryIcon>;
    color: ReturnType<typeof resolveCategoryColor>;
}) {
    const supportsHover = useMediaQuery('(pointer: fine)');
    const shouldReduceMotion = useReducedMotion();
    const pointerX = useMotionValue(0);
    const pointerY = useMotionValue(0);
    const springX = useSpring(pointerX, { stiffness: 130, damping: 22 });
    const springY = useSpring(pointerY, { stiffness: 130, damping: 22 });
    const foregroundX = useTransform(springX, [-0.5, 0.5], [-18, 18]);
    const foregroundY = useTransform(springY, [-0.5, 0.5], [-12, 12]);
    const sideX = useTransform(springX, [-0.5, 0.5], [11, -11]);
    const sideY = useTransform(springY, [-0.5, 0.5], [8, -8]);

    const previewShots = Array.isArray(previews) ? previews : [];
    const shots = [cover, ...previewShots].filter((src): src is string =>
        Boolean(src),
    );

    if (shots.length === 0) {
        return (
            <div
                className={cn(
                    'relative flex overflow-hidden',
                    featured
                        ? 'aspect-[16/9] md:aspect-[21/9]'
                        : 'aspect-[16/10]',
                    color.bg,
                )}
            >
                <div className="absolute inset-0 bg-linear-to-br from-white/50 via-transparent to-black/10 dark:from-white/10 dark:to-black/40" />
                <Icon
                    className={cn(
                        'absolute top-1/2 left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 opacity-40',
                        color.text,
                    )}
                />
            </div>
        );
    }

    const hero = shots[0];
    const secondary = shots[1] ?? hero;
    const tertiary = shots[2] ?? secondary;
    const interactionEnabled = supportsHover && !shouldReduceMotion;

    const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
        if (!interactionEnabled) {
            return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
        pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
    };

    const resetFocus = () => {
        pointerX.set(0);
        pointerY.set(0);
    };

    return (
        <div
            onMouseMove={handleMouseMove}
            onMouseLeave={resetFocus}
            className={cn(
                'relative isolate overflow-hidden bg-black [perspective:900px]',
                featured ? 'aspect-[16/9] md:aspect-[21/9]' : 'aspect-[16/10]',
            )}
        >
            <motion.img
                src={hero}
                alt={`${label} cover`}
                loading="lazy"
                decoding="async"
                style={{ x: foregroundX, y: foregroundY }}
                className="absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)] max-w-none object-cover opacity-75 saturate-75 transition duration-700 ease-out group-hover:scale-105 group-hover:saturate-100 motion-reduce:transform-none"
            />
            <div className="absolute inset-0 bg-linear-to-br from-black/15 via-transparent to-black/70" />
            <motion.div
                style={{ x: sideX, y: sideY, rotate: -4 }}
                className="absolute -top-8 -right-[20%] h-[130%] w-[55%] overflow-hidden border-x border-white/25 bg-black/20 shadow-[-24px_0_50px_rgba(0,0,0,0.35)] transition-transform duration-700 group-hover:rotate-[-1deg]"
            >
                <img
                    src={secondary}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full scale-125 object-cover opacity-80 grayscale-[0.2]"
                />
            </motion.div>
            <motion.div
                style={{ x: foregroundX, y: foregroundY, rotate: 3 }}
                className="absolute -bottom-[32%] -left-[8%] h-[64%] w-[64%] overflow-hidden border border-white/30 bg-black/20 shadow-[16px_-16px_45px_rgba(0,0,0,0.4)] transition-transform duration-700 group-hover:translate-x-3 group-hover:-translate-y-3"
            >
                <img
                    src={tertiary}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full scale-125 object-cover opacity-85"
                />
            </motion.div>
            <div className="pointer-events-none absolute inset-x-5 bottom-5 flex items-end justify-between border-t border-white/35 pt-2.5 text-[9px] font-black tracking-[0.32em] text-white/90 uppercase">
                <span>Focus / {String(shots.length).padStart(2, '0')}</span>
                <span className="text-white/55">{label}</span>
            </div>
        </div>
    );
}

export default function PortfolioShow({ categories, meta }: Props) {
    return (
        <>
            <Head>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta
                    property="og:title"
                    content={
                        meta.ogTitle ??
                        `${meta.title} — Opticore Solutions Limited`
                    }
                />
                {meta.ogDescription && (
                    <meta
                        property="og:description"
                        content={meta.ogDescription}
                    />
                )}
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>

            <div className="relative min-h-screen overflow-hidden">
                <GradientOrb
                    className="top-0 right-0 h-[600px] w-[600px] translate-x-1/4 -translate-y-1/4"
                    color="rgb(6 182 212 / 0.12)"
                />
                <GradientOrb
                    className="bottom-0 left-0 h-[500px] w-[500px] -translate-x-1/4 translate-y-1/4"
                    color="rgb(124 58 237 / 0.12)"
                />

                <section className="section-shell relative z-10 pt-32 md:pt-36 lg:pt-40">
                    <div className="section-inner">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            className="neo-panel p-6 sm:p-10 lg:p-14"
                        >
                            <span className="section-kicker">Showcase</span>
                            <h1 className="text-4xl font-black text-balance text-theme sm:text-5xl md:text-6xl lg:text-7xl">
                                <span className="gradient-text">
                                    Explore Work By Category
                                </span>
                            </h1>
                            <p className="mt-8 max-w-3xl text-base leading-relaxed font-medium text-theme-muted sm:text-lg">
                                Start with the discipline you need. Each
                                category opens into its own sub-category tabs so
                                you can drill straight into relevant work.
                            </p>
                        </motion.div>
                    </div>
                </section>

                <section className="section-shell relative z-10 pt-0">
                    <div className="section-inner">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerGrid}
                            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                        >
                            {categories.map((category, index) => {
                                const featured = index === 0;
                                const Icon = resolveCategoryIcon(category.icon);
                                const color = resolveCategoryColor(
                                    category.color,
                                );

                                return (
                                    <motion.div
                                        key={category.slug}
                                        variants={cardVariant}
                                        className={cn(
                                            featured && 'md:col-span-2',
                                        )}
                                    >
                                        <Link
                                            href={portfolioCategory.url(
                                                category.slug,
                                            )}
                                            className="group neo-panel relative flex h-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-xl dark:border-white/5"
                                        >
                                            <div className="relative">
                                                <CoverMosaic
                                                    cover={category.cover}
                                                    previews={category.previews}
                                                    label={category.label}
                                                    featured={featured}
                                                    Icon={Icon}
                                                    color={color}
                                                />
                                                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                                                <div
                                                    className={cn(
                                                        'absolute top-4 left-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.25)] ring-1 ring-white/25 backdrop-blur-md',
                                                        color.bg,
                                                        color.text,
                                                    )}
                                                >
                                                    <Icon className="h-6 w-6 drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" />
                                                </div>
                                                <div className="absolute top-4 right-4 flex flex-wrap justify-end gap-1.5">
                                                    <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-black tracking-[0.22em] text-white uppercase backdrop-blur-sm">
                                                        {
                                                            category.sub_categories_count
                                                        }{' '}
                                                        tabs
                                                    </span>
                                                    <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-black tracking-[0.22em] text-white uppercase backdrop-blur-sm">
                                                        {
                                                            category.portfolios_count
                                                        }{' '}
                                                        exhibits
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-1 flex-col p-7 sm:p-8">
                                                <h2 className="text-2xl font-black text-theme transition-colors group-hover:text-primary">
                                                    {category.label}
                                                </h2>

                                                <p className="mt-4 flex-1 text-sm leading-relaxed font-medium text-theme-muted">
                                                    {category.description}
                                                </p>

                                                <div className="mt-8 flex items-center justify-between border-t border-theme pt-5">
                                                    <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-wide text-theme-subtle">
                                                        <Layers3 className="h-4 w-4" />
                                                        SUB-CATEGORIES
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase transition-colors',
                                                            color.text,
                                                        )}
                                                    >
                                                        Open
                                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </section>

                <section className="section-shell relative z-10 pt-0">
                    <div className="section-inner">
                        <div className="neo-panel p-8 text-center sm:p-12 lg:p-16">
                            <div className="mx-auto mb-8 h-px w-24 bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />
                            <h2 className="text-3xl font-black text-balance text-theme sm:text-4xl md:text-5xl">
                                Want work like this for your brand?
                            </h2>
                            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed font-medium text-theme-muted sm:text-lg">
                                We create premium identities, campaign systems,
                                and presentation-ready visual assets designed to
                                move perception and performance.
                            </p>
                            <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
                                <MagneticButton
                                    href="/contact"
                                    ariaLabel="Contact us about a project"
                                >
                                    Start a Project
                                </MagneticButton>
                                <Link
                                    href="/contact"
                                    className="neo-btn-ghost group relative flex h-12 items-center justify-center rounded-full px-8 text-sm font-black tracking-widest text-theme uppercase transition-all hover:scale-105"
                                >
                                    Contact Us
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
