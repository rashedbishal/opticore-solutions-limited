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
import GradientOrb from '@/components/UI/GradientOrb';

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
                <GradientOrb
                    className="top-0 right-0 h-[600px] w-[600px] translate-x-1/4 -translate-y-1/4"
                    color="rgb(6 182 212 / 0.12)"
                />
                <GradientOrb
                    className="bottom-0 left-0 h-[600px] w-[600px] -translate-x-1/4 translate-y-1/4"
                    color="rgb(124 58 237 / 0.12)"
                />

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
                                creative and digital services tailored for your
                                business.
                            </p>
                        </motion.div>
                    </section>

                    {/* Services Tabs */}
                    <section className="mb-20">
                        <div className="hide-scrollbar flex items-center justify-center gap-4 overflow-x-auto pb-4">
                            {services.map((service) => {
                                const Icon = service.icon;
                                const isActive = activeTab === service.id;
                                return (
                                    <button
                                        key={service.id}
                                        type="button"
                                        onClick={() => setActiveTab(service.id)}
                                        className={`flex shrink-0 items-center gap-3 rounded-2xl border px-6 py-4 transition-all duration-300 ${
                                            isActive
                                                ? 'border-violet-500/50 bg-violet-500/10 text-theme'
                                                : 'border-theme bg-theme-surface text-theme-muted hover:border-theme-hover hover:text-theme'
                                        }`}
                                    >
                                        <div
                                            className={`rounded-xl p-2 ${service.bg} ${service.color}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <span className="font-bold whitespace-nowrap">
                                            {service.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Marketplace Grid */}
                    <AnimatePresence mode="wait">
                        <motion.section
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {(subCategories[activeTab] || []).map(
                                (item, idx) => (
                                    <motion.div
                                        key={item.slug}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group glass-panel overflow-hidden rounded-[2.5rem] border border-theme transition-all duration-500 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/10"
                                    >
                                        <Link
                                            href={`/hire-us/${activeTab}/${item.slug}`}
                                        >
                                            {/* Image */}
                                            <div className="relative h-64 overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                                                <div className="absolute top-4 right-4 rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                                                    Starts at {item.price}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="p-8">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-amber-400">
                                                        <Star className="h-4 w-4 fill-current" />
                                                        <span className="text-sm font-bold text-theme">
                                                            {item.rating}
                                                        </span>
                                                        <span className="text-xs text-theme-muted">
                                                            ({item.reviews})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-theme-muted">
                                                        <Users className="h-4 w-4" />
                                                        <span className="text-xs">
                                                            24 Active
                                                        </span>
                                                    </div>
                                                </div>
                                                <h3 className="mb-6 text-2xl font-black tracking-tight text-theme group-hover:text-violet-500 transition-colors">
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-theme-muted group-hover:text-theme transition-colors">
                                                        View Marketplace
                                                    </span>
                                                    <div className="rounded-full bg-theme-surface p-3 text-theme group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                                                        <ArrowRight className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ),
                            )}
                        </motion.section>
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

export default HireUsPage;
