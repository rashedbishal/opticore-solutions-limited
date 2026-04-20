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
import AppLayout from '@/components/Layout/AppLayout';

const services = [
    {
        id: 'graphic-design',
        name: 'Graphic Design',
        icon: PenTool,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
    },
    {
        id: 'video-editing',
        name: 'Video Editing',
        icon: Film,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
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
        name: 'Web Dev',
        icon: Code2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
    },
    {
        id: 'digital-marketing',
        name: 'Marketing',
        icon: Globe,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
    },
];

const subCategories: Record<string, any[]> = {
    'graphic-design': [
        {
            name: 'Social Media Post',
            slug: 'social-media-post-design',
            price: '500 BDT',
            rating: 4.9,
            reviews: 128,
            image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800',
        },
        {
            name: 'YouTube Thumbnail',
            slug: 'youtube-thumbnail-design',
            price: '300 BDT',
            rating: 5.0,
            reviews: 84,
            image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=800',
        },
        {
            name: 'Brochure Design',
            slug: 'brochure-design',
            price: '1500 BDT',
            rating: 4.8,
            reviews: 42,
            image: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=800',
        },
        {
            name: 'Logo Identity',
            slug: 'logo-identity-design',
            price: '2500 BDT',
            rating: 5.0,
            reviews: 156,
            image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800',
        },
    ],
    'video-editing': [
        {
            name: 'Reels & Shorts',
            slug: 'reels-shorts-editing',
            price: '800 BDT',
            rating: 4.9,
            reviews: 210,
            image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800',
        },
        {
            name: 'YouTube Video',
            slug: 'youtube-video-editing',
            price: '2000 BDT',
            rating: 4.7,
            reviews: 95,
            image: 'https://images.unsplash.com/photo-1622737133809-d95047b9e673?q=80&w=800',
        },
    ],
    '3d-production': [
        {
            name: 'Product Render',
            slug: 'product-rendering',
            price: '3500 BDT',
            rating: 5.0,
            reviews: 34,
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800',
        },
        {
            name: '3D Animation',
            slug: '3d-animation',
            price: '8000 BDT',
            rating: 4.9,
            reviews: 18,
            image: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?q=80&w=800',
        },
    ],
    'web-development': [
        {
            name: 'Landing Page',
            slug: 'landing-page-dev',
            price: '5000 BDT',
            rating: 4.9,
            reviews: 67,
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800',
        },
        {
            name: 'E-commerce Site',
            slug: 'ecommerce-dev',
            price: '15000 BDT',
            rating: 5.0,
            reviews: 29,
            image: 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=800',
        },
    ],
};

export default function HireUs() {
    const [activeTab, setActiveTab] = useState('graphic-design');

    return (
        <AppLayout>
            <Head title="Hire Opticore | Digital Services Marketplace" />

            <div className="relative min-h-screen overflow-hidden bg-black px-4 pt-32 pb-24">
                {/* Background Glows */}
                <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
                <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[120px]" />

                <div className="relative z-10 mx-auto max-w-7xl">
                    {/* Hero Section */}
                    <section className="mb-24 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto max-w-4xl"
                        >
                            <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold tracking-widest text-cyan-400 uppercase">
                                <Zap className="h-4 w-4 fill-current" /> Premium
                                Solutions
                            </span>
                            <h1 className="mb-8 text-5xl leading-tight font-black tracking-tighter text-white uppercase md:text-8xl">
                                Expert{' '}
                                <span className="bg-gradient-to-r from-cyan-400 to-violet-600 bg-clip-text text-transparent">
                                    On Demand
                                </span>
                            </h1>
                            <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-zinc-400">
                                Select a category to explore our professional
                                sub-categories and start your project with the
                                industry's finest talent.
                            </p>
                        </motion.div>
                    </section>

                    {/* Service Tabs */}
                    <div className="mb-20 flex flex-wrap justify-center gap-4">
                        {services.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => setActiveTab(service.id)}
                                className={`flex items-center gap-3 rounded-2xl border px-6 py-4 font-bold transition-all duration-300 ${
                                    activeTab === service.id
                                        ? `border-white bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]`
                                        : 'border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-white/20'
                                }`}
                            >
                                <service.icon
                                    className={`h-5 w-5 ${activeTab === service.id ? 'text-black' : service.color}`}
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
                            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {subCategories[activeTab]?.map((sub, idx) => (
                                <Link
                                    key={idx}
                                    href={`/hire-us/${activeTab}/${sub.slug}`}
                                    className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/40 transition-all duration-500 hover:border-cyan-500/50"
                                >
                                    <div className="aspect-[4/3] overflow-hidden">
                                        <img
                                            src={sub.image}
                                            alt={sub.name}
                                            className="h-full w-full object-cover grayscale transition-transform duration-700 group-hover:scale-110 group-hover:grayscale-0"
                                        />
                                    </div>
                                    <div className="p-8">
                                        <div className="mb-4 flex items-start justify-between">
                                            <h3 className="text-2xl leading-tight font-black tracking-tight text-white uppercase transition-colors group-hover:text-cyan-400">
                                                {sub.name}
                                            </h3>
                                            <div className="flex items-center gap-1 font-bold text-amber-400">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span className="text-sm">
                                                    {sub.rating}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                                            <div>
                                                <p className="mb-1 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                                                    Starting At
                                                </p>
                                                <p className="text-xl font-black text-white">
                                                    {sub.price}
                                                </p>
                                            </div>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white transition-all group-hover:bg-cyan-500 group-hover:text-white">
                                                <ArrowRight className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {(!subCategories[activeTab] ||
                                subCategories[activeTab].length === 0) && (
                                <div className="glass-panel col-span-full rounded-[3rem] border-white/5 py-24 text-center">
                                    <Sparkles className="mx-auto mb-6 h-12 w-12 text-zinc-700" />
                                    <h3 className="text-2xl font-bold tracking-widest text-zinc-500 uppercase">
                                        Coming Soon
                                    </h3>
                                    <p className="mt-2 text-zinc-600">
                                        We're onboarding expert talent for this
                                        category.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Trust Section */}
                    <div className="mt-32 grid grid-cols-1 gap-12 border-t border-white/5 pt-24 md:grid-cols-3">
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
                            <div key={i} className="flex gap-6">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-400">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="mb-2 text-lg font-bold text-white">
                                        {item.title}
                                    </h4>
                                    <p className="text-sm leading-relaxed text-zinc-500">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
