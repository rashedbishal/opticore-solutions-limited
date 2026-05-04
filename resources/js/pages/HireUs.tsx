import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    ArrowRight,
    PenTool,
    Globe,
    Film,
    Box,
    Code2,
    Star,
    Zap,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface HireUsSubCategory {
    name: string;
    slug: string;
    price: string;
    rating: number;
    reviews: number;
    image: string;
}

interface Props {
    subCategories: Record<string, HireUsSubCategory[]>;
}

const services = [
    {
        id: 'graphic-design',
        name: 'GFX Design',
        icon: PenTool,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
    },
    {
        id: '3d-production',
        name: '3D Production',
        icon: Box,
        color: 'text-violet-500',
        bg: 'bg-violet-500/10',
    },
    {
        id: 'web-development',
        name: 'Web Development',
        icon: Code2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
    },
    {
        id: 'digital-marketing',
        name: 'Digital Marketing',
        icon: Globe,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
    },
    {
        id: 'video-editing',
        name: 'Video Editing',
        icon: Film,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
    },
];

const HireUsPage = ({ subCategories = {} }: Props) => {
    // Initialize activeTab with the first service's id from the 'services' array.
    const [activeTab, setActiveTab] = useState(services[0].id);

    return (
        <>
            <Head title="Hire Opticore | Digital Services Marketplace" />

            <div className="relative min-h-screen overflow-hidden px-4 pt-32 pb-24">
                {/* Background Glows */}
                <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />

                <div className="relative z-10 mx-auto max-w-7xl">
                    {/* Hero Section */}
                    <section className="mb-24 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto max-w-4xl"
                        >
                            <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-theme bg-theme-surface px-4 py-2 text-sm font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">
                                <Zap className="h-4 w-4 fill-current" /> Premium
                                Solutions
                            </span>
                            <h1 className="mb-8 text-5xl leading-tight font-black tracking-tighter text-theme uppercase md:text-8xl">
                                Expert{' '}
                                <span className="bg-gradient-to-r from-cyan-500 to-violet-600 bg-clip-text text-transparent">
                                    On Demand
                                </span>
                            </h1>
                            <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-theme-muted">
                                Select a category to explore our professional
                                sub-categories and start your project with the
                                industry's finest talent.
                            </p>
                        </motion.div>
                    </section>

                    {/* Service Tabs */}
                    <div className="neo-tab-list mx-auto mb-20 flex w-fit flex-wrap justify-center gap-2 p-2">
                        {services.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => setActiveTab(service.id)}
                                data-state={activeTab === service.id ? 'active' : 'inactive'}
                                className="neo-tab-item flex items-center gap-3 px-6 py-4 text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--neo-shadow-btn-hover)] active:translate-y-0"
                            >
                                <service.icon
                                    className={`h-4 w-4 ${activeTab === service.id ? 'text-white' : service.color}`}
                                />
                                {service.name}
                            </button>
                        ))}
                    </div>

                    {/* Sub-Category Grid */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {subCategories[activeTab]?.map((sub) => (
                                <Link
                                    key={sub.slug}
                                    href={`/hire-us/${activeTab}/${sub.slug}`}
                                    className="neo-panel-elevated group relative flex flex-col overflow-hidden transition-all duration-500 hover:-translate-y-2"
                                >
                                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                                        <img
                                            src={sub.image}
                                            alt={sub.name}
                                            className="h-full w-full object-cover grayscale transition-transform duration-700 group-hover:scale-110 group-hover:grayscale-0"
                                        />
                                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10" />
                                    </div>
                                    <div className="p-8">
                                        <div className="mb-4 flex items-start justify-between">
                                            <h3 className="text-2xl leading-tight font-black tracking-tight text-theme uppercase transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                                                {sub.name}
                                            </h3>
                                            <div className="neo-row flex items-center gap-1 px-2 py-1 font-bold text-amber-500">
                                                <Star className="h-3 w-3 fill-current drop-shadow-[0_2px_4px_rgba(245,158,11,0.4)]" />
                                                <span className="text-xs">
                                                    {sub.rating}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-8 flex items-center justify-between border-t border-theme/50 pt-6">
                                            <div>
                                                <p className="mb-1 text-[10px] font-bold tracking-widest text-theme-subtle uppercase">
                                                    Starting At
                                                </p>
                                                <p className="text-xl font-black text-theme drop-shadow-sm">
                                                    {sub.price}
                                                </p>
                                            </div>
                                            <div className="neo-btn-accent flex h-12 w-12 items-center justify-center rounded-2xl">
                                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {/* Display "Coming Soon" if no sub-categories for the active tab */}
                            {(!subCategories[activeTab] ||
                                subCategories[activeTab].length === 0) && (
                                    <div className="neo-panel col-span-full py-24 text-center">
                                        <Sparkles className="mx-auto mb-6 h-12 w-12 text-theme-subtle animate-float" />
                                        <h3 className="text-2xl font-bold tracking-widest text-theme-muted uppercase">
                                            Coming Soon
                                        </h3>
                                        <p className="mt-2 text-theme-subtle">
                                            We're onboarding expert talent for this
                                            category.
                                        </p>
                                    </div>
                                )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Trust Section */}
                    <div className="mt-32 grid grid-cols-1 gap-8 border-t border-theme/50 pt-24 md:grid-cols-3">
                        {[
                            {
                                icon: Zap,
                                title: 'Instant Start',
                                desc: 'Projects kicked off immediately after purchase.',
                            },
                            {
                                icon: Users,
                                title: 'Direct Access',
                                desc: 'Chat directly with the creative team working on your task.',
                            },
                            {
                                icon: Star,
                                title: 'Quality First',
                                desc: 'Premium results guaranteed or your money back.',
                            },
                        ].map((item, i) => (
                            <div key={i} className="neo-panel flex gap-6 p-6">
                                <div className="neo-btn-ghost flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-cyan-600 dark:text-cyan-400">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="mb-2 text-lg font-bold text-theme">
                                        {item.title}
                                    </h4>
                                    <p className="text-sm leading-relaxed text-theme-subtle">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default HireUsPage;
