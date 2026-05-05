import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, FolderKanban, Layers3 } from 'lucide-react';
import MagneticButton from '@/components/UI/MagneticButton';
import GradientOrb from '@/components/UI/GradientOrb';
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

const staggerGrid = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const cardVariant = {
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

            <div className="relative min-h-screen overflow-hidden">
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
                            <span className="section-kicker">Showcase</span>
                            <h1 className="text-4xl font-black text-balance text-theme sm:text-5xl md:text-6xl lg:text-7xl">
                                <span className="gradient-text">
                                    Explore Work By Category
                                </span>
                            </h1>
                            <p className="mt-8 max-w-3xl text-base font-medium leading-relaxed text-theme-muted sm:text-lg">
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
                            {categories.map((category) => (
                                <motion.div
                                    key={category.slug}
                                    variants={cardVariant}
                                >
                                    <Link
                                        href={portfolioCategory.url(
                                            category.slug,
                                        )}
                                        className="group neo-panel flex h-full flex-col p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl dark:border-white/5"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inset transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                                                <FolderKanban className="h-6 w-6" />
                                            </div>
                                            <div className="flex gap-2 text-[10px] font-black tracking-[0.25em] text-cyan-600 uppercase dark:text-cyan-400">
                                                <span>
                                                    {
                                                        category.sub_categories_count
                                                    }{' '}
                                                    TABS
                                                </span>
                                                <span className="opacity-30">
                                                    /
                                                </span>
                                                <span>
                                                    {category.portfolios_count}{' '}
                                                    EXHIBITS
                                                </span>
                                            </div>
                                        </div>

                                        <h2 className="mt-10 text-2xl font-black text-theme transition-colors group-hover:text-primary">
                                            {category.label}
                                        </h2>

                                        <p className="mt-5 flex-1 text-sm font-medium leading-relaxed text-theme-muted">
                                            {category.description}
                                        </p>

                                        <div className="mt-10 flex items-center justify-between border-t border-theme pt-6">
                                            <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-wide text-theme-subtle">
                                                <Layers3 className="h-4 w-4" />
                                                SUB-CATEGORIES
                                            </div>
                                            <span className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-primary transition-colors group-hover:text-cyan-500">
                                                OPEN
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                                            </span>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
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
                            <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-theme-muted sm:text-lg">
                                We create premium identities, campaign systems,
                                and presentation-ready visual assets designed to
                                move perception and performance.
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
