import type { Variants } from 'framer-motion';
import { Head, Link } from '@inertiajs/react';
import { m as motion, useInView } from 'framer-motion';
import { ArrowLeft, ArrowRight, Film, FolderOpen } from 'lucide-react';
import { useRef } from 'react';
import GradientOrb from '@/components/UI/GradientOrb';
import MagneticButton from '@/components/UI/MagneticButton';
import { portfolio, portfolioPreview, portfolioSubCategory } from '@/routes';

interface Category {
    slug: string;
    label: string;
    description: string;
}

interface SubCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    portfolios_count: number;
}

interface PortfolioItem {
    id: number;
    title: string;
    media_path: string | null;
    media_type: 'image' | 'video';
    alt: string;
}

interface Props {
    category: Category;
    subCategories: SubCategory[];
    selectedSubCategory: SubCategory | null;
    portfolios: PortfolioItem[];
    meta: {
        title: string;
        ogTitle: string | null;
        description: string;
        ogDescription: string | null;
    };
}

const PLACEHOLDER = 'https://placehold.co/600x400/111111/7C3AED?text=Opticore';

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
};

function MasonryCard({
    item,
    label,
    index,
}: {
    item: PortfolioItem;
    label: string;
    index: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, {
        once: true,
        margin: '0px 0px -80px 0px',
    });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            transition={{
                duration: 0.55,
                delay: Math.min(index * 0.07, 0.42),
                ease: [0.22, 1, 0.36, 1],
            }}
            className="group neo-panel relative mb-6 w-full break-inside-avoid overflow-hidden shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
            style={{ willChange: 'transform, opacity' }}
        >
            <div className="relative aspect-auto overflow-hidden">
                {item.media_type === 'video' ? (
                    <video
                        src={item.media_path ?? undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                ) : (
                    <img
                        src={item.media_path ?? PLACEHOLDER}
                        alt={item.alt}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                            e.currentTarget.src = PLACEHOLDER;
                        }}
                        className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                )}

                {/* Gradient Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity duration-500 sm:opacity-0 sm:group-hover:opacity-100" />

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 translate-y-0 transform p-5 opacity-100 transition-all duration-500 sm:translate-y-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
                        {label}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-4">
                        <h3 className="line-clamp-2 text-sm leading-tight font-bold text-white">
                            {item.title}
                        </h3>
                        <Link
                            href={portfolioPreview.url(item.id)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                            aria-label={`View ${item.title} full screen`}
                        >
                            {item.media_type === 'video' ? (
                                <>
                                    <Film className="h-3 w-3" /> Watch
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="h-3 w-3" /> View
                                </>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function PortfolioCategoryShow({
    category,
    subCategories,
    selectedSubCategory,
    portfolios,
    meta,
}: Props) {
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

            <div className="relative overflow-hidden">
                {/* Atmospheric Glows */}
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
                            <nav
                                className="mb-6 flex items-center gap-2 text-xs font-bold tracking-wider text-theme-subtle uppercase"
                                aria-label="Breadcrumb"
                            >
                                <Link
                                    href={portfolio.url()}
                                    className="transition-colors hover:text-primary"
                                >
                                    Portfolio
                                </Link>
                                <span className="opacity-30">/</span>
                                <span className="text-theme-muted">
                                    {category.label}
                                </span>
                            </nav>

                            <span className="section-kicker">Case Studies</span>
                            <h1 className="text-4xl font-black text-balance text-theme sm:text-5xl md:text-6xl lg:text-7xl">
                                <span className="gradient-text">
                                    {category.label}
                                </span>
                            </h1>
                            <p className="mt-8 max-w-3xl text-base leading-relaxed font-medium text-theme-muted sm:text-lg">
                                {category.description}
                            </p>
                        </motion.div>
                    </div>
                </section>

                <section className="section-shell relative z-10 pt-0">
                    <div className="section-inner">
                        <div className="mb-10">
                            <Link
                                href={portfolio.url()}
                                className="neo-btn-ghost group inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-xs font-bold tracking-wide text-theme-muted transition-all hover:text-primary"
                            >
                                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                BACK TO CATEGORIES
                            </Link>
                        </div>

                        {subCategories.length > 0 ? (
                            <>
                                <div className="mb-10 flex flex-wrap justify-center gap-4">
                                    <div className="inline-flex flex-wrap items-center gap-2 rounded-[2rem] border border-slate-300 bg-linear-to-b from-slate-200 to-slate-100 p-2 shadow-[0_4px_12px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,1)] backdrop-blur-md dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
                                        {subCategories.map((sub) => {
                                            const isActive =
                                                sub.slug ===
                                                selectedSubCategory?.slug;

                                            return (
                                                <Link
                                                    key={sub.id}
                                                    href={portfolioSubCategory.url(
                                                        [
                                                            category.slug,
                                                            sub.slug,
                                                        ],
                                                    )}
                                                    className={`touch-target flex shrink-0 items-center rounded-full px-6 py-2.5 text-[13px] font-bold tracking-wide transition-all ${
                                                        isActive
                                                            ? 'neo-btn-primary scale-105'
                                                            : 'neo-btn-ghost hover:scale-105'
                                                    }`}
                                                >
                                                    {sub.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>

                                {selectedSubCategory && (
                                    <motion.div
                                        initial="hidden"
                                        animate="visible"
                                        variants={fadeUp}
                                        className="neo-panel mt-8 p-8"
                                    >
                                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                            <div className="max-w-3xl">
                                                <p className="text-[10px] font-black tracking-[0.3em] text-cyan-600 uppercase dark:text-cyan-400">
                                                    Current Perspective
                                                </p>
                                                <h2 className="mt-4 text-3xl font-black text-theme sm:text-4xl">
                                                    {selectedSubCategory.name}
                                                </h2>
                                                {selectedSubCategory.description && (
                                                    <p className="mt-4 text-sm leading-relaxed font-medium text-theme-muted">
                                                        {
                                                            selectedSubCategory.description
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2 text-xs font-black tracking-widest text-theme-subtle uppercase">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-theme-surface shadow-[0_2px_0_rgba(0,0,0,0.15)] ring-1 ring-white/10 dark:bg-white/5 dark:shadow-[0_2px_0_rgba(0,0,0,0.4)]">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-primary drop-shadow-[0_0_2px_rgba(139,92,246,0.8)]" />
                                                </div>
                                                {
                                                    selectedSubCategory.portfolios_count
                                                }{' '}
                                                {selectedSubCategory.portfolios_count ===
                                                1
                                                    ? 'Exhibit'
                                                    : 'Exhibits'}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {portfolios.length > 0 ? (
                                    <div
                                        key={
                                            selectedSubCategory?.slug ??
                                            category.slug
                                        }
                                        className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4"
                                    >
                                        {portfolios.map((item, index) => (
                                            <MasonryCard
                                                key={item.id}
                                                item={item}
                                                label={
                                                    selectedSubCategory?.name ??
                                                    category.label
                                                }
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="neo-panel mt-12 flex min-h-72 flex-col items-center justify-center p-16 text-center">
                                        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-theme-surface shadow-[0_6px_0_rgba(0,0,0,0.15),0_12px_24px_rgba(0,0,0,0.1)] ring-1 ring-white/10 dark:bg-white/5 dark:shadow-[0_6px_0_rgba(0,0,0,0.4),0_12px_24px_rgba(0,0,0,0.3)]">
                                            <FolderOpen className="h-9 w-9 text-theme-subtle drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                                        </div>
                                        <p className="text-xl font-bold text-theme">
                                            Vault is empty
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-theme-muted">
                                            No portfolio items in this
                                            sub-category yet.
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={fadeUp}
                                className="neo-panel mt-10 flex flex-col items-center py-20 text-center"
                            >
                                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-theme-surface shadow-[0_6px_0_rgba(0,0,0,0.15),0_12px_24px_rgba(0,0,0,0.1)] ring-1 ring-white/10 dark:bg-white/5 dark:shadow-[0_6px_0_rgba(0,0,0,0.4),0_12px_24px_rgba(0,0,0,0.3)]">
                                    <FolderOpen className="h-9 w-9 text-theme-subtle drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                                </div>
                                <p className="text-xl font-bold text-theme">
                                    No Collections Found
                                </p>
                                <p className="mt-2 max-w-xs text-sm font-medium text-theme-muted">
                                    Check back later for new categories and
                                    updates.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </section>

                <section className="section-shell relative z-10 pt-0">
                    <div className="section-inner">
                        <div className="neo-panel p-8 text-center sm:p-12 lg:p-16">
                            <div className="mx-auto mb-8 h-px w-24 bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />
                            <h2 className="text-3xl font-black text-balance text-theme sm:text-4xl md:text-5xl">
                                Elevated Results For Your Brand
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
