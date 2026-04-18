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
    ChevronRight,
    Star,
    Zap,
    Users
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import SectionHeader from '@/components/UI/SectionHeader';

const services = [
    { id: 'graphic-design', name: 'Graphic Design', icon: PenTool, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { id: 'video-editing', name: 'Video Editing', icon: Film, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { id: '3d-production', name: '3D Production', icon: Box, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { id: 'web-development', name: 'Web Dev', icon: Code2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'digital-marketing', name: 'Marketing', icon: Globe, color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

const subCategories: Record<string, any[]> = {
    'graphic-design': [
        { name: 'Social Media Post', slug: 'social-media-post-design', price: '500 BDT', rating: 4.9, reviews: 128, image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800' },
        { name: 'YouTube Thumbnail', slug: 'youtube-thumbnail-design', price: '300 BDT', rating: 5.0, reviews: 84, image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=800' },
        { name: 'Brochure Design', slug: 'brochure-design', price: '1500 BDT', rating: 4.8, reviews: 42, image: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=800' },
        { name: 'Logo Identity', slug: 'logo-identity-design', price: '2500 BDT', rating: 5.0, reviews: 156, image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800' },
    ],
    'video-editing': [
        { name: 'Reels & Shorts', slug: 'reels-shorts-editing', price: '800 BDT', rating: 4.9, reviews: 210, image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800' },
        { name: 'YouTube Video', slug: 'youtube-video-editing', price: '2000 BDT', rating: 4.7, reviews: 95, image: 'https://images.unsplash.com/photo-1622737133809-d95047b9e673?q=80&w=800' },
    ],
    '3d-production': [
        { name: 'Product Render', slug: 'product-rendering', price: '3500 BDT', rating: 5.0, reviews: 34, image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800' },
        { name: '3D Animation', slug: '3d-animation', price: '8000 BDT', rating: 4.9, reviews: 18, image: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?q=80&w=800' },
    ],
    'web-development': [
        { name: 'Landing Page', slug: 'landing-page-dev', price: '5000 BDT', rating: 4.9, reviews: 67, image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800' },
        { name: 'E-commerce Site', slug: 'ecommerce-dev', price: '15000 BDT', rating: 5.0, reviews: 29, image: 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=800' },
    ]
};

export default function HireUs() {
    const [activeTab, setActiveTab] = useState('graphic-design');

    return (
        <AppLayout>
            <Head title="Hire Opticore | Digital Services Marketplace" />
            
            <div className="bg-black min-h-screen pt-32 pb-24 px-4 overflow-hidden relative">
                {/* Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px]" />

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Hero Section */}
                    <section className="text-center mb-24">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto"
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-sm font-bold tracking-widest uppercase mb-8">
                                <Zap className="w-4 h-4 fill-current" /> Premium Solutions
                            </span>
                            <h1 className="text-5xl md:text-8xl font-black text-white leading-tight mb-8 uppercase tracking-tighter">
                                Expert <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-600">On Demand</span>
                            </h1>
                            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                                Select a category to explore our professional sub-categories and start your project with the industry's finest talent.
                            </p>
                        </motion.div>
                    </section>

                    {/* Service Tabs */}
                    <div className="flex flex-wrap justify-center gap-4 mb-20">
                        {services.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => setActiveTab(service.id)}
                                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 border ${
                                    activeTab === service.id 
                                    ? `bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]` 
                                    : 'bg-zinc-900/50 text-zinc-400 border-white/5 hover:border-white/20'
                                }`}
                            >
                                <service.icon className={`w-5 h-5 ${activeTab === service.id ? 'text-black' : service.color}`} />
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
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {subCategories[activeTab]?.map((sub, idx) => (
                                <Link 
                                    key={idx} 
                                    href={`/hire-us/${activeTab}/${sub.slug}`}
                                    className="group relative bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-cyan-500/50 transition-all duration-500"
                                >
                                    <div className="aspect-[4/3] overflow-hidden">
                                        <img 
                                            src={sub.image} 
                                            alt={sub.name} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                                        />
                                    </div>
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight leading-tight">
                                                {sub.name}
                                            </h3>
                                            <div className="flex items-center gap-1 text-amber-400 font-bold">
                                                <Star className="w-4 h-4 fill-current" />
                                                <span className="text-sm">{sub.rating}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Starting At</p>
                                                <p className="text-xl font-black text-white">{sub.price}</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            
                            {(!subCategories[activeTab] || subCategories[activeTab].length === 0) && (
                                <div className="col-span-full py-24 text-center glass-panel rounded-[3rem] border-white/5">
                                     <Sparkles className="w-12 h-12 text-zinc-700 mx-auto mb-6" />
                                     <h3 className="text-2xl font-bold text-zinc-500 uppercase tracking-widest">Coming Soon</h3>
                                     <p className="text-zinc-600 mt-2">We're onboarding expert talent for this category.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Trust Section */}
                    <div className="mt-32 pt-24 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { icon: Zap, title: 'Instant Start', desc: 'Projects kicked off immediately after purchase.' },
                            { icon: Users, title: 'Direct Access', desc: 'Chat directly with the creative team working on your task.' },
                            { icon: Star, title: 'Quality First', desc: 'Premium results guaranteed or your money back.' }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-6">
                                <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
