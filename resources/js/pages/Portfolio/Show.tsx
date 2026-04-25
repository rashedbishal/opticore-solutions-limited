import type { Variants } from 'framer-motion';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, FolderKanban, Layers3 } from 'lucide-react';
import MagneticButton from '@/components/UI/MagneticButton';
import { portfolioCategory } from '@/routes';

interface Category {
    slug: string;
    label: string;
    description: string;
    sub_categories_count: number;
    portfolios_count: number;
}

interface Props {
    categories: Category[];
    meta: { title: string; description: string };
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

export default function PortfolioShow({ categories, meta }: Props) {
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
                        <span className="section-kicker">Portfolio</span>
                        <h1 className="text-4xl font-extrabold text-balance text-white sm:text-5xl md:text-6xl">
                            <span className="gradient-text">
                                Explore Work By Category
                            </span>
                        </h1>
                        <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
                            Start with the discipline you need. Each category
                            opens into its own sub-category tabs so you can
                            drill straight into relevant work.
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerGrid}
                        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                    >
                        {categories.map((category) => (
                            <motion.div
                                key={category.slug}
                                variants={cardVariant}
                            >
                                <Link
                                    href={portfolioCategory.url(category.slug)}
                                    className="group glass-panel flex h-full flex-col rounded-[1.75rem] p-7 transition-all hover:border-violet-400/40 hover:bg-violet-500/5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20">
                                            <FolderKanban className="h-5 w-5" />
                                        </div>
                                        <div className="flex gap-2 text-[11px] font-semibold tracking-[0.2em] text-cyan-300 uppercase">
                                            <span>
                                                {category.sub_categories_count}{' '}
                                                tabs
                                            </span>
                                            <span className="text-zinc-600">
                                                /
                                            </span>
                                            <span>
                                                {category.portfolios_count}{' '}
                                                works
                                            </span>
                                        </div>
                                    </div>

                                    <h2 className="mt-8 text-2xl font-bold text-white transition-colors group-hover:text-violet-200">
                                        {category.label}
                                    </h2>

                                    <p className="mt-4 flex-1 text-sm leading-7 text-zinc-400">
                                        {category.description}
                                    </p>

                                    <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                                        <div className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400">
                                            <Layers3 className="h-4 w-4" />
                                            View sub-categories
                                        </div>
                                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 transition-colors group-hover:text-violet-300">
                                            Open
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <div className="glass-panel rounded-[2rem] border-t border-t-violet-400/70 p-8 text-center sm:p-10 lg:p-14">
                        <h2 className="text-3xl font-extrabold text-balance text-white sm:text-4xl md:text-5xl">
                            Want work like this for your brand?
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
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
