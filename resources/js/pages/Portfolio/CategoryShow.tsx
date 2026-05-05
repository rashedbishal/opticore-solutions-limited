import { Head, Link } from '@inertiajs/react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowLeft, ArrowRight, Film, FolderOpen } from 'lucide-react';
import MagneticButton from '@/components/UI/MagneticButton';
import GradientOrb from '@/components/UI/GradientOrb';
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
    meta: { title: string; description: string };
}

const PLACEHOLDER = 'https://placehold.co/600x400/111111/7C3AED?text=Opticore';

const fadeUp = {
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
    const isInView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' });

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
                <div className="absolute inset-x-0 bottom-0 p-5 opacity-100 transition-all duration-500 transform translate-y-0 sm:opacity-0 sm:translate-y-4 sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
                        {label}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-4">
                        <h3 className="text-sm font-bold leading-tight text-white line-clamp-2">
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
                <meta property="og:title" content={meta.title} />
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

                            <span className="section-kicker">
                                Case Studies
                            </span>
                            <h1 className="text-4xl font-black text-balance text-theme sm:text-5xl md:text-6xl lg:text-7xl">
                                <span className="gradient-text">
                                    {category.label}
                                </span>
                            </h1>
                            <p className="mt-8 max-w-3xl text-base font-medium leading-relaxed text-theme-muted sm:text-lg">
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
                                <div className="no-scrollbar flex items-center gap-3 overflow-x-auto pb-6 lg:flex-wrap">
                                    {subCategories.map((sub) => {
                                        const isActive =
                                            sub.slug === selectedSubCategory?.slug;

                                        return (
                                            <Link
                                                key={sub.id}
                                                href={portfolioSubCategory.url([
                                                    category.slug,
                                                    sub.slug,
                                                ])}
                                                className={`touch-target shrink-0 rounded-full px-5 py-3 text-[13px] font-bold tracking-wide transition-all ${
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

                                {selectedSubCategory && (
                                    <motion.div
                                        initial="hidden"
                                        animate="visible"
                                        variants={fadeUp}
                                        className="mt-8 neo-panel p-8"
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
                                                    <p className="mt-4 text-sm font-medium leading-relaxed text-theme-muted">
                                                        {
                                                            selectedSubCategory.description
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2 text-xs font-black tracking-widest text-theme-subtle uppercase">
                                                <span className="h-1 w-1 rounded-full bg-primary" />
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
                                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-surface shadow-inset">
                                            <FolderOpen className="h-8 w-8 text-theme-subtle" />
                                        </div>
                                        <p className="text-xl font-bold text-theme">
                                            Vault is empty
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-theme-muted">
                                            No portfolio items in this sub-category yet.
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
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-surface shadow-inset">
                                    <FolderOpen className="h-8 w-8 text-theme-subtle" />
                                </div>
                                <p className="text-xl font-bold text-theme">
                                    No Collections Found
                                </p>
                                <p className="mt-2 max-w-xs text-sm font-medium text-theme-muted">
                                    Check back later for new categories and updates.
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
                            <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-theme-muted sm:text-lg">
                                We create premium identities, campaign systems, and
                                presentation-ready visual assets designed to move
                                perception and performance.
                            </p>
                            <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
                                <MagneticButton
                                    href="/request-appointment"
                                    ariaLabel="Request a project appointment"
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
