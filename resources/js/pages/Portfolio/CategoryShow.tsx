import type { Variants } from 'framer-motion';
import { Head, Link } from '@inertiajs/react';
import { m as motion } from 'framer-motion';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PortfolioGallery from '@/components/Portfolio/PortfolioGallery';
import GradientOrb from '@/components/UI/GradientOrb';
import MagneticButton from '@/components/UI/MagneticButton';
import { portfolio, portfolioCategory, portfolioSubCategory } from '@/routes';

interface Category {
    slug: string;
    label: string;
    description: string;
    meta_title: string | null;
    meta_description: string | null;
    og_title: string | null;
    og_description: string | null;
}

interface SubCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    portfolios_count: number;
    meta_title: string | null;
    meta_description: string | null;
    og_title: string | null;
    og_description: string | null;
}

interface PortfolioItem {
    id: number;
    title: string;
    media_path: string | null;
    media_type: 'image' | 'video' | 'youtube';
    youtube_video_id: string | null;
    alt: string;
}

interface HeadMeta {
    title: string;
    ogTitle: string | null;
    description: string;
    ogDescription: string | null;
}

interface Props {
    category: Category;
    subCategories: SubCategory[];
    selectedSubCategory: SubCategory | null;
    portfoliosBySubCategory: Record<string, PortfolioItem[]>;
    meta: HeadMeta;
}

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
};

function metaForSubCategory(
    category: Category,
    subCategory: SubCategory | null,
): HeadMeta {
    if (!subCategory) {
        return {
            title: category.meta_title ?? category.label,
            ogTitle: category.og_title,
            description: category.meta_description ?? category.description,
            ogDescription: category.og_description,
        };
    }

    return {
        title: subCategory.meta_title ?? subCategory.name,
        ogTitle: subCategory.og_title,
        description:
            subCategory.meta_description ??
            subCategory.description ??
            category.description,
        ogDescription: subCategory.og_description,
    };
}

export default function PortfolioCategoryShow({
    category,
    subCategories,
    selectedSubCategory,
    portfoliosBySubCategory,
    meta,
}: Props) {
    // Tabs switch purely from data already sent with the page — no
    // request, no Inertia navigation, so nothing can touch the scroll
    // position or re-run the page-level entrance animations. The URL is
    // kept in sync with plain History API calls so deep links and
    // browser back/forward keep working.
    const [activeSlug, setActiveSlug] = useState<string | null>(
        selectedSubCategory?.slug ?? null,
    );
    const [headMeta, setHeadMeta] = useState<HeadMeta>(meta);

    const activeSubCategory = useMemo(
        () => subCategories.find((sub) => sub.slug === activeSlug) ?? null,
        [subCategories, activeSlug],
    );

    useEffect(() => {
        const categoryPath = portfolioCategory.url([category.slug]);
        const subCategoryPrefix = `${categoryPath}/`;

        function syncFromLocation() {
            const { pathname } = window.location;
            const isSubCategoryUrl = pathname.startsWith(subCategoryPrefix);
            const slugFromUrl = isSubCategoryUrl
                ? pathname.slice(subCategoryPrefix.length).split('/')[0]
                : null;

            const matched = slugFromUrl
                ? (subCategories.find((sub) => sub.slug === slugFromUrl) ??
                  null)
                : null;

            setActiveSlug(matched?.slug ?? null);
            setHeadMeta(metaForSubCategory(category, matched));
        }

        window.addEventListener('popstate', syncFromLocation);

        return () => window.removeEventListener('popstate', syncFromLocation);
    }, [category, subCategories]);

    function selectSubCategory(sub: SubCategory) {
        if (sub.slug === activeSlug) {
            return;
        }

        setActiveSlug(sub.slug);
        setHeadMeta(metaForSubCategory(category, sub));
        window.history.pushState(
            {},
            '',
            portfolioSubCategory.url([category.slug, sub.slug]),
        );
    }

    const portfolios = activeSlug
        ? (portfoliosBySubCategory[activeSlug] ?? [])
        : [];

    return (
        <>
            <Head>
                <title>{headMeta.title}</title>
                <meta name="description" content={headMeta.description} />
                <meta
                    property="og:title"
                    content={
                        headMeta.ogTitle ??
                        `${headMeta.title} — Opticore Solutions Limited`
                    }
                />
                {headMeta.ogDescription && (
                    <meta
                        property="og:description"
                        content={headMeta.ogDescription}
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
                                <div className="mb-10 flex flex-wrap justify-center gap-x-6 gap-y-1 sm:gap-y-3">
                                    {subCategories.map((sub) => {
                                        const isActive =
                                            sub.slug === activeSlug;

                                        return (
                                            <button
                                                key={sub.id}
                                                type="button"
                                                onClick={() =>
                                                    selectSubCategory(sub)
                                                }
                                                className={`touch-target flex shrink-0 items-center rounded-full px-6 py-2.5 text-[13px] font-bold tracking-wide transition-all ${
                                                    isActive
                                                        ? 'neo-btn-primary scale-[1.03]'
                                                        : 'neo-btn-ghost hover:scale-[1.03]'
                                                }`}
                                            >
                                                {sub.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                {activeSubCategory && (
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
                                                    {activeSubCategory.name}
                                                </h2>
                                                {activeSubCategory.description && (
                                                    <p className="mt-4 text-sm leading-relaxed font-medium text-theme-muted">
                                                        {
                                                            activeSubCategory.description
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2 text-xs font-black tracking-widest text-theme-subtle uppercase">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-theme-surface shadow-[0_2px_0_rgba(0,0,0,0.15)] ring-1 ring-white/10 dark:bg-white/5 dark:shadow-[0_2px_0_rgba(0,0,0,0.4)]">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-primary drop-shadow-[0_0_2px_rgba(139,92,246,0.8)]" />
                                                </div>
                                                {
                                                    activeSubCategory.portfolios_count
                                                }{' '}
                                                {activeSubCategory.portfolios_count ===
                                                1
                                                    ? 'Exhibit'
                                                    : 'Exhibits'}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <PortfolioGallery
                                    portfolios={portfolios}
                                    label={
                                        activeSubCategory?.name ??
                                        category.label
                                    }
                                    galleryKey={
                                        activeSubCategory?.slug ?? category.slug
                                    }
                                />
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
