import type { Variants } from 'framer-motion';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Film, FolderOpen } from 'lucide-react';
import MagneticButton from '@/components/UI/MagneticButton';

interface PortfolioItem {
    id: number;
    title: string;
    media_path: string | null;
    media_type: 'image' | 'video';
    alt: string;
}

interface Props {
    category: { slug: string; label: string };
    subCategory: { slug: string; name: string; description: string | null };
    portfolios: PortfolioItem[];
    allCategories: { slug: string; label: string }[];
    siblingSubCategories: { name: string; slug: string }[];
    meta: { title: string; description: string };
}

const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
    },
};

const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const PLACEHOLDER = 'https://placehold.co/600x400/111111/7C3AED?text=Opticore';

export default function PortfolioSubCategoryShow({
    category,
    subCategory,
    portfolios,
    allCategories,
    siblingSubCategories,
    meta,
}: Props) {
    function handleCategoryClick(slug: string) {
        router.visit(`/portfolio/${slug}`, { preserveScroll: false });
    }

    function handleSubCategoryClick(slug: string) {
        router.visit(`/portfolio/${category.slug}/${slug}`, {
            preserveScroll: false,
        });
    }

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

            {/* Hero */}
            <section className="section-shell pt-32 md:pt-36 lg:pt-40">
                <div className="section-inner">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="glass-panel rounded-[2rem] p-5 sm:p-10 lg:p-14"
                    >
                        {/* Breadcrumb */}
                        <nav
                            className="mb-5 flex items-center gap-2 text-sm text-theme-subtle"
                            aria-label="Breadcrumb"
                        >
                            <Link
                                href="/portfolio/graphic-design"
                                className="transition-colors hover:text-theme"
                            >
                                Portfolio
                            </Link>
                            <span>/</span>
                            <Link
                                href={`/portfolio/${category.slug}`}
                                className="transition-colors hover:text-theme"
                            >
                                {category.label}
                            </Link>
                            <span>/</span>
                            <span className="text-theme-muted">
                                {subCategory.name}
                            </span>
                        </nav>

                        <span className="section-kicker">{category.label}</span>
                        <h1 className="text-4xl font-extrabold text-balance text-theme sm:text-5xl md:text-6xl">
                            <span className="gradient-text">
                                {subCategory.name}
                            </span>
                        </h1>
                        {subCategory.description && (
                            <p className="mt-6 max-w-2xl text-base leading-8 text-theme-muted sm:text-lg">
                                {subCategory.description}
                            </p>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Category tabs */}
            <section className="section-shell pt-0">
                <div className="section-inner">
                    <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
                        {allCategories.map((cat) => (
                            <button
                                key={cat.slug}
                                type="button"
                                aria-label={`View ${cat.label} portfolio`}
                                className={`touch-target shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                                    cat.slug === category.slug
                                        ? 'border-violet-500/50 bg-violet-500/15 text-theme dark:border-violet-400/50'
                                        : 'border-theme bg-theme-surface text-theme-muted hover:text-theme'
                                }`}
                                onClick={() => handleCategoryClick(cat.slug)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Sub-category tabs (siblings) */}
                    {siblingSubCategories.length > 1 && (
                        <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                            <Link
                                href={`/portfolio/${category.slug}`}
                                className="touch-target shrink-0 rounded-full border border-theme bg-theme-surface px-3 py-1.5 text-xs font-medium text-theme-subtle transition-all hover:text-theme"
                                aria-label={`Back to ${category.label} sub-categories`}
                            >
                                <ArrowLeft className="mr-1 inline h-3 w-3" />
                                All
                            </Link>
                            {siblingSubCategories.map((s) => (
                                <button
                                    key={s.slug}
                                    type="button"
                                    aria-label={`View ${s.name}`}
                                    className={`touch-target shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                                        s.slug === subCategory.slug
                                            ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:border-cyan-400/40 dark:text-cyan-300'
                                            : 'border-theme bg-theme-surface text-theme-subtle hover:text-theme'
                                    }`}
                                    onClick={() =>
                                        handleSubCategoryClick(s.slug)
                                    }
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Portfolio grid */}
                    {portfolios.length > 0 ? (
                        <motion.div
                            key={subCategory.slug}
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {portfolios.map((item) => (
                                <motion.div
                                    key={item.id}
                                    variants={scaleIn}
                                    className="group glass-panel relative mb-4 block w-full overflow-hidden rounded-[1.5rem]"
                                >
                                    {/* Media thumbnail */}
                                    {item.media_type === 'video' ? (
                                        <video
                                            src={item.media_path ?? undefined}
                                            muted
                                            preload="metadata"
                                            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <img
                                            src={item.media_path ?? PLACEHOLDER}
                                            alt={item.alt}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    PLACEHOLDER;
                                            }}
                                            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    )}

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />
                                    <div className="absolute inset-x-0 bottom-0 p-5">
                                        <p className="text-xs font-semibold tracking-[0.24em] text-cyan-600 uppercase dark:text-cyan-300">
                                            {subCategory.name}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between gap-4">
                                            <h3 className="text-lg font-semibold text-white">
                                                {item.title}
                                            </h3>
                                            <Link
                                                href={`/portfolio-item/${item.id}`}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100 hover:text-white"
                                                aria-label={`View ${item.title} full screen`}
                                            >
                                                {item.media_type === 'video' ? (
                                                    <>
                                                        <Film className="h-4 w-4" />{' '}
                                                        Watch
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowRight className="h-4 w-4" />{' '}
                                                        View
                                                    </>
                                                )}
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="glass-panel mt-10 flex min-h-72 flex-col items-center justify-center rounded-[1.5rem] px-6 py-16 text-center">
                            <FolderOpen className="mb-4 h-10 w-10 text-theme-subtle" />
                            <p className="text-lg font-medium text-theme-muted">
                                No portfolio items in this sub-category yet.
                            </p>
                            <p className="mt-2 text-sm text-theme-subtle">
                                Check back later for new projects and updates.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="section-shell pt-0">
                <div className="section-inner">
                    <div className="glass-panel rounded-[2rem] border-t border-t-violet-400/70 p-6 text-center sm:p-10 lg:p-14">
                        <h2 className="text-3xl font-extrabold text-balance text-theme sm:text-4xl md:text-5xl">
                            Want work like this for your brand?
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-theme-muted sm:text-lg">
                            We create premium identities, campaign systems, and
                            presentation-ready visual assets designed to move
                            perception and performance.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <MagneticButton
                                href="/request-appointment"
                                ariaLabel="Request a project appointment"
                            >
                                Start a Project
                            </MagneticButton>
                            <Link
                                href="/contact"
                                className="touch-target inline-flex items-center justify-center rounded-full border border-theme bg-theme-surface px-6 py-3 text-sm font-semibold text-theme"
                            >
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
