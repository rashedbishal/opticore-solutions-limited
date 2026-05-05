import type { Variants } from 'framer-motion';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Film, FolderOpen } from 'lucide-react';
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
    meta: { title: string; description: string };
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

const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

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

            <section className="section-shell pt-32 md:pt-36 lg:pt-40">
                <div className="section-inner">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="glass-panel rounded-[2rem] p-6 sm:p-10 lg:p-14"
                    >
                        <nav
                            className="mb-5 flex items-center gap-2 text-sm text-theme-subtle"
                            aria-label="Breadcrumb"
                        >
                            <Link
                                href={portfolio.url()}
                                className="transition-colors hover:text-theme"
                            >
                                Portfolio
                            </Link>
                            <span>/</span>
                            <span className="text-theme-muted">
                                {category.label}
                            </span>
                        </nav>

                        <span className="section-kicker">
                            Portfolio Category
                        </span>
                        <h1 className="text-4xl font-extrabold text-balance text-theme sm:text-5xl md:text-6xl">
                            <span className="gradient-text">
                                {category.label}
                            </span>
                        </h1>
                        <p className="mt-6 max-w-3xl text-base leading-8 text-theme-muted sm:text-lg">
                            {category.description}
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <div className="mb-4">
                        <Link
                            href={portfolio.url()}
                            className="inline-flex items-center gap-2 rounded-full border border-theme bg-theme-surface px-4 py-2 text-sm font-medium text-theme-muted transition-colors hover:bg-theme-surface-hover"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            All categories
                        </Link>
                    </div>

                    {subCategories.length > 0 ? (
                        <>
                            <div className="mt-10 no-scrollbar flex items-center gap-3 overflow-x-auto pb-4 lg:flex-wrap">
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
                                            className={`touch-target shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                                                isActive
                                                    ? 'border-violet-400/50 bg-violet-500/15 text-theme dark:border-violet-400/50'
                                                    : 'border-theme bg-theme-surface text-theme-subtle hover:text-theme'
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
                                    className="mt-8 rounded-[1.5rem] border border-theme bg-theme-surface p-6"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold tracking-[0.24em] text-cyan-500 uppercase dark:text-cyan-300">
                                                Selected sub-category
                                            </p>
                                            <h2 className="mt-3 text-2xl font-bold text-theme sm:text-3xl">
                                                {selectedSubCategory.name}
                                            </h2>
                                            {selectedSubCategory.description && (
                                                <p className="mt-3 max-w-2xl text-sm leading-7 text-theme-muted">
                                                    {
                                                        selectedSubCategory.description
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-sm font-medium text-theme-subtle">
                                            {
                                                selectedSubCategory.portfolios_count
                                            }{' '}
                                            {selectedSubCategory.portfolios_count ===
                                            1
                                                ? 'work'
                                                : 'works'}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <motion.div
                                key={selectedSubCategory?.slug ?? category.slug}
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
                                        {item.media_type === 'video' ? (
                                            <video
                                                src={
                                                    item.media_path ?? undefined
                                                }
                                                muted
                                                preload="metadata"
                                                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <img
                                                src={
                                                    item.media_path ??
                                                    PLACEHOLDER
                                                }
                                                alt={item.alt}
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        PLACEHOLDER;
                                                }}
                                                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        )}

                                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />
                                        <div className="absolute inset-x-0 bottom-0 p-5">
                                            <p className="text-xs font-semibold tracking-[0.24em] text-cyan-600 uppercase dark:text-cyan-300">
                                                {selectedSubCategory?.name ??
                                                    category.label}
                                            </p>
                                            <div className="mt-2 flex items-center justify-between gap-4">
                                                <h3 className="text-lg font-semibold text-white">
                                                    {item.title}
                                                </h3>
                                                <Link
                                                    href={portfolioPreview.url(
                                                        item.id,
                                                    )}
                                                    className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100 hover:text-white"
                                                    aria-label={`View ${item.title} full screen`}
                                                >
                                                    {item.media_type ===
                                                    'video' ? (
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

                                {portfolios.length === 0 && (
                                    <div className="glass-panel flex min-h-72 flex-col items-center justify-center rounded-[1.5rem] px-6 py-16 text-center">
                                        <FolderOpen className="mb-4 h-10 w-10 text-theme-subtle" />
                                        <p className="text-lg font-medium text-theme-muted">
                                            No portfolio items in this
                                            sub-category yet.
                                        </p>
                                        <p className="mt-2 text-sm text-theme-subtle">
                                            Add items from the CMS and they will
                                            appear here automatically.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            className="glass-panel mt-10 rounded-[1.5rem] py-20 text-center"
                        >
                            <FolderOpen className="mx-auto mb-4 h-10 w-10 text-theme-subtle" />
                            <p className="text-lg font-medium text-theme-muted">
                                No sub-categories yet.
                            </p>
                            <p className="mt-1 text-sm text-theme-subtle">
                                Check back later for new categories and updates.
                            </p>
                            <p className="mt-1 text-sm text-theme-subtle">
                                Sub-categories will appear here once added via
                                the CMS.
                            </p>
                        </motion.div>
                    )}
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <div className="glass-panel rounded-[2rem] border-t border-t-violet-400/70 p-8 text-center sm:p-10 lg:p-14">
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
                                className="touch-target inline-flex items-center justify-center rounded-full border border-theme bg-theme-surface px-6 py-3 text-sm font-semibold text-theme transition-colors hover:bg-theme-surface-hover"
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
