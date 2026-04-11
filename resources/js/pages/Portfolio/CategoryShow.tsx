import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowRight, FolderOpen } from 'lucide-react';
import MagneticButton from '@/components/UI/MagneticButton';

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

interface Props {
    category: Category;
    subCategories: SubCategory[];
    allCategories: { slug: string; label: string }[];
    meta: { title: string; description: string };
}

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const staggerGrid: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const cardVariant: Variants = {
    hidden: { opacity: 0, y: 28, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function PortfolioCategoryShow({ category, subCategories, allCategories, meta }: Props) {
    function handleCategoryClick(slug: string) {
        router.visit(`/portfolio/${slug}`, { preserveScroll: false });
    }

    return (
        <>
            <Head>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta property="og:title" content={meta.title} />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            {/* Hero */}
            <section className="section-shell pt-32 md:pt-36 lg:pt-40">
                <div className="section-inner">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="glass-panel rounded-[2rem] p-8 sm:p-10 lg:p-14"
                    >
                        <span className="section-kicker">Portfolio</span>
                        <h1 className="text-4xl font-extrabold text-balance text-white sm:text-5xl md:text-6xl">
                            <span className="gradient-text">{category.label}</span>
                        </h1>
                        <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                            {category.description}
                        </p>
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
                                        ? 'border-violet-400/50 bg-violet-500/15 text-white'
                                        : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                                }`}
                                onClick={() => handleCategoryClick(cat.slug)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Sub-category grid */}
                    {subCategories.length > 0 ? (
                        <motion.div
                            key={category.slug}
                            initial="hidden"
                            animate="visible"
                            variants={staggerGrid}
                            className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {subCategories.map((sub) => (
                                <motion.div key={sub.id} variants={cardVariant}>
                                    <Link
                                        href={`/portfolio/${category.slug}/${sub.slug}`}
                                        className="group glass-panel flex h-full flex-col rounded-[1.5rem] p-7 transition-all hover:border-violet-400/40 hover:bg-violet-500/5"
                                        aria-label={`Browse ${sub.name} portfolios`}
                                    >
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-400/20 transition-colors group-hover:bg-violet-500/25">
                                                <FolderOpen className="h-5 w-5" />
                                            </div>
                                            <span className="text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase">
                                                {sub.portfolios_count} {sub.portfolios_count === 1 ? 'work' : 'works'}
                                            </span>
                                        </div>

                                        <h2 className="text-xl font-bold text-white transition-colors group-hover:text-violet-200">
                                            {sub.name}
                                        </h2>

                                        {sub.description && (
                                            <p className="mt-2 flex-1 text-sm leading-7 text-zinc-400">
                                                {sub.description}
                                            </p>
                                        )}

                                        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-violet-400 transition-colors group-hover:text-violet-300">
                                            View Works
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            className="mt-10 glass-panel rounded-[1.5rem] py-20 text-center"
                        >
                            <FolderOpen className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
                            <p className="text-lg font-medium text-zinc-400">No sub-categories yet.</p>
                            <p className="mt-1 text-sm text-zinc-600">
                                Sub-categories will appear here once added via the CMS.
                            </p>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="section-shell pt-0">
                <div className="section-inner">
                    <div className="glass-panel rounded-[2rem] border-t border-t-violet-400/70 p-8 text-center sm:p-10 lg:p-14">
                        <h2 className="text-3xl font-extrabold text-balance text-white sm:text-4xl md:text-5xl">
                            Want work like this for your brand?
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                            We create premium identities, campaign systems, and presentation-ready visual assets designed to move perception and performance.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <MagneticButton href="/request-appointment" ariaLabel="Request a project appointment">
                                Start a Project
                            </MagneticButton>
                            <Link
                                href="/contact"
                                className="touch-target inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white"
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
