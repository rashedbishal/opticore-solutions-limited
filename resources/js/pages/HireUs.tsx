import { Link, Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, PenTool, Globe, Film, Box, Code2, ChevronRight, Star, Zap, Users } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/components/Layout/AppLayout'; // Import Link, Head, and router
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Define services with their IDs, names, icons, and colors
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

// Define sub-categories for each service, including slugs for navigation
const subCategories: Record<string, any[]> = {
    'graphic-design': [
        { name: 'Social Media Post', slug: 'social-media-post', price: '500 BDT', rating: 4.9, reviews: 128, image: '/images/demo/social-post-1.png' },
        { name: 'YouTube Thumbnail', slug: 'youtube-thumbnail', price: '300 BDT', rating: 5.0, reviews: 84, image: '/images/demo/youtube-thumb-1.png' },
        { name: 'Brochure Design', slug: 'brochure-design', price: '1500 BDT', rating: 4.8, reviews: 42, image: '/images/demo/brochure-1.png' },
        { name: 'Logo Design', slug: 'logo-design', price: '2500 BDT', rating: 5.0, reviews: 156, image: '/images/demo/logo-1.png' },
    ],
    '3d-production': [
        { name: '3D Modeling', slug: '3d-modeling', price: '2000 BDT', rating: 4.8, reviews: 55, image: '/images/demo/3d-model-1.png' },
        { name: 'Product Visualization', slug: 'product-visualization', price: '1000 BDT', rating: 5.0, reviews: 34, image: '/images/demo/product-viz-1.png' },
        { name: '3D Animation', slug: '3d-animation', price: '10000 BDT', rating: 4.9, reviews: 18, image: '/images/demo/3d-anim-1.png' },
    ],
    'web-development': [
        { name: 'Frontend Development', slug: 'frontend-development', price: '15000 BDT', rating: 4.9, reviews: 67, image: '/images/demo/frontend-1.png' },
        { name: 'Backend Development', slug: 'backend-development', price: '20000 BDT', rating: 4.7, reviews: 45, image: '/images/demo/backend-1.png' },
        { name: 'Fullstack Development', slug: 'fullstack-development', price: '50000 BDT', rating: 5.0, reviews: 29, image: '/images/demo/fullstack-1.png' },
        { name: 'E-commerce Development', slug: 'e-commerce-dev', price: '25000 BDT', rating: 5.0, reviews: 30, image: '/images/demo/ecommerce-1.png' },
    ],
    'digital-marketing': [ // Added placeholder data for Digital Marketing
        { name: 'SEO Optimization', slug: 'seo-optimization', price: '8000 BDT', rating: 4.8, reviews: 72, image: '/images/demo/seo-1.png' },
        { name: 'Content Marketing', slug: 'content-marketing', price: '12000 BDT', rating: 4.9, reviews: 58, image: '/images/demo/content-1.png' },
        { name: 'Social Media Management', slug: 'social-media-management', price: '10000 BDT', rating: 4.7, reviews: 99, image: '/images/demo/social-mng-1.png' },
        { name: 'Paid Advertising (PPC)', slug: 'paid-advertising', price: 'Custom Quote', rating: 4.9, reviews: 61, image: '/images/demo/ppc-1.png' },
    ],
    'video-editing': [ // Added placeholder data for Video Editing
        { name: 'Promotional Videos', slug: 'promotional-videos', price: '15000 BDT', rating: 4.8, reviews: 52, image: '/images/demo/promo-vid-1.png' },
        { name: 'Social Media Videos', slug: 'social-media-videos', price: '8000 BDT', rating: 4.9, reviews: 115, image: '/images/demo/sm-vid-1.png' },
        { name: 'Explainer Videos', slug: 'explainer-videos', price: '25000 BDT', rating: 4.7, reviews: 39, image: '/images/demo/explainer-vid-1.png' },
        { name: 'Corporate Videos', slug: 'corporate-videos', price: '35000 BDT', rating: 4.8, reviews: 22, image: '/images/demo/corp-vid-1.png' },
    ],
};

// Mock serviceDetails for all sub-categories (consolidated and detailed)
const serviceDetails = {
    'social-media-post': { name: 'Social Media Post Design', description: 'Eye-catching social media posts optimized for engagement.', demos: ['/images/demo/social-post-1.png', '/images/demo/social-post-2.png'], pricing: [{ tier: 'Basic', description: 'Single post design', price: '500 BDT' }, { tier: 'Standard', description: '5 posts package', price: '2000 BDT' }, { tier: 'Premium', description: '10 posts package + analytics insights', price: '3500 BDT' }] },
    'youtube-thumbnail': { name: 'YouTube Thumbnail Design', description: 'Click-worthy thumbnails to boost your video views.', demos: ['/images/demo/youtube-thumb-1.png', '/images/demo/youtube-thumb-2.png'], pricing: [{ tier: 'Basic', description: 'Single thumbnail design', price: '700 BDT' }, { tier: 'Standard', description: '5 thumbnails package', price: '3000 BDT' }, { tier: 'Premium', description: '10 thumbnails package + A/B testing suggestions', price: '5000 BDT' }] },
    'brochure-design': { name: 'Brochure Design', description: 'Professional brochures to effectively communicate your message.', demos: ['/images/demo/brochure-1.png'], pricing: [{ tier: 'Basic', description: 'Single-fold brochure', price: '1500 BDT' }, { tier: 'Standard', description: 'Bi-fold brochure', price: '2500 BDT' }, { tier: 'Premium', description: 'Tri-fold brochure + print-ready files', price: '4000 BDT' }] },
    'logo-design': { name: 'Logo Design', description: 'Memorable logos that define your brand identity.', demos: ['/images/demo/logo-1.png'], pricing: [{ tier: 'Concept', description: '3 initial logo concepts', price: '3000 BDT' }, { tier: 'Standard', description: 'Final logo + Brand Guidelines', price: '6000 BDT' }, { tier: 'Premium', description: 'Full Brand Identity Kit', price: '10000 BDT' }] },
    '3d-modeling': { name: '3D Modeling', description: 'Creating detailed 3D models for various applications.', demos: ['/images/demo/3d-model-1.png'], pricing: [{ tier: 'Basic', description: 'Simple object model', price: '2000 BDT' }, { tier: 'Standard', description: 'Complex object model', price: '5000 BDT' }, { tier: 'Premium', description: 'High-poly detailed model', price: '8000 BDT' }] },
    'product-visualization': { name: 'Product Visualization', description: 'Realistic 3D renders of your products.', demos: ['/images/demo/product-viz-1.png'], pricing: [{ tier: 'Basic', description: 'Single render', price: '1000 BDT' }, { tier: 'Standard', description: '5 renders package', price: '4500 BDT' }, { tier: 'Premium', description: '360° product view', price: '7000 BDT' }] },
    '3d-animation': { name: '3D Animation', description: 'Bringing your products and ideas to life with 3D animation.', demos: ['/images/demo/3d-anim-1.png'], pricing: [{ tier: 'Short Clip', description: 'Up to 15 seconds', price: '10000 BDT' }, { tier: 'Product Explainer', description: 'Up to 60 seconds', price: '25000 BDT' }, { tier: 'Full Animation', description: 'Custom length', price: 'Custom Quote' }] },
    'frontend-development': { name: 'Frontend Development', description: 'Crafting intuitive and responsive user interfaces.', demos: ['/images/demo/frontend-1.png'], pricing: [{ tier: 'Landing Page', description: 'Single page site', price: '15000 BDT' }, { tier: 'Complex UI', description: 'Multi-page application', price: '40000 BDT' }, { tier: 'Web App', description: 'Interactive web application', price: 'Custom Quote' }] },
    'backend-development': { name: 'Backend Development', description: 'Building robust server-side logic and APIs.', demos: ['/images/demo/backend-1.png'], pricing: [{ tier: 'API Development', description: 'RESTful API creation', price: '20000 BDT' }, { tier: 'Database Integration', description: 'Complex database setup', price: '30000 BDT' }, { tier: 'Server Logic', description: 'Custom server-side features', price: 'Custom Quote' }] },
    'fullstack-development': { name: 'Fullstack Development', description: 'End-to-end web development services.', demos: ['/images/demo/fullstack-1.png'], pricing: [{ tier: 'Standard App', description: 'Integrated frontend & backend', price: '50000 BDT' }, { tier: 'Enterprise Solution', description: 'Scalable web applications', price: 'Custom Quote' }] },
    'e-commerce-dev': { name: 'E-commerce Development', description: 'Building powerful and user-friendly online stores.', demos: ['/images/demo/ecommerce-1.png'], pricing: [{ tier: 'Basic Store', description: 'Shopify/WooCommerce setup', price: '25000 BDT' }, { tier: 'Custom Platform', description: 'Bespoke e-commerce solution', price: '60000 BDT' }] },
    'seo-optimization': { name: 'SEO Optimization', description: 'Improve your search engine rankings and drive organic traffic.', demos: ['/images/demo/seo-1.png'], pricing: [{ tier: 'Audit', description: 'Comprehensive SEO audit', price: '8000 BDT' }, { tier: 'On-Page', description: 'On-page optimization (up to 10 pages)', price: '20000 BDT' }, { tier: 'Monthly Management', description: 'Ongoing SEO strategy & execution', price: '30000 BDT/month' }] },
    'content-marketing': { name: 'Content Marketing', description: 'Engaging content to attract and retain customers.', demos: ['/images/demo/content-1.png'], pricing: [{ tier: 'Blog Posts', description: '4 high-quality blog posts', price: '12000 BDT' }, { tier: 'Article Creation', description: 'In-depth articles', price: '5000 BDT/article' }, { tier: 'Content Strategy', description: 'Full content plan', price: '18000 BDT' }] },
    'social-media-management': { name: 'Social Media Management', description: 'Boost your brand presence across social platforms.', demos: ['/images/demo/social-mng-1.png'], pricing: [{ tier: 'Basic', description: '2 platforms, 12 posts/month', price: '10000 BDT' }, { tier: 'Standard', description: '3 platforms, 20 posts/month + engagement', price: '18000 BDT' }, { tier: 'Premium', description: '4+ platforms, daily posts, ads management', price: '30000 BDT/month' }] },
    'paid-advertising': { name: 'Paid Advertising (PPC)', description: 'Targeted campaigns for maximum ROI on ad spend.', demos: ['/images/demo/ppc-1.png'], pricing: [{ tier: 'Setup Fee', description: 'Campaign setup & strategy', price: '15000 BDT' }, { tier: 'Management Fee', description: 'Monthly ad spend % or flat fee', price: '20% ad spend / 25000 BDT' }] },
    'promotional-videos': { name: 'Promotional Videos', description: 'Engaging videos to showcase your products or services.', demos: ['/images/demo/promo-vid-1.png'], pricing: [{ tier: 'Short Ad', description: '15-30 seconds', price: '15000 BDT' }, { tier: 'Product Demo', description: '1-2 minutes', price: '30000 BDT' }] },
    'social-media-videos': { name: 'Social Media Videos', description: 'Short, attention-grabbing videos for social platforms.', demos: ['/images/demo/sm-vid-1.png'], pricing: [{ tier: 'Reel/TikTok', description: '15-60 seconds', price: '8000 BDT' }, { tier: 'Short Story', description: 'Up to 30 seconds', price: '5000 BDT' }] },
    'explainer-videos': { name: 'Explainer Videos', description: 'Clearly explain complex concepts or products.', demos: ['/images/demo/explainer-vid-1.png'], pricing: [{ tier: 'Animated', description: 'Up to 60 seconds', price: '25000 BDT' }, { tier: 'Live Action', description: 'Up to 90 seconds', price: '40000 BDT' }] },
    'corporate-videos': { name: 'Corporate Videos', description: 'Professional videos for company profiles, training, or events.', demos: ['/images/demo/corp-vid-1.png'], pricing: [{ tier: 'Company Profile', description: '1-3 minutes', price: '35000 BDT' }, { tier: 'Event Coverage', description: 'Highlights reel', price: 'Custom Quote' }] },
};


const defaultHeroVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const HireUsPage = () => {
    // Initialize activeTab with the first service's id from the 'services' array.
    const [activeTab, setActiveTab] = useState(services[0].id);
    // Removed unused states and handlers (selectedService, isContactModalOpen, customDealMessage, customDealService, handleCustomDealClick, handleSendMessage)
    // as they are not directly related to displaying services or navigation.

    // Updated handleTabChange to correctly set the active tab
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    return (
        // Using AppLayout and Head from Inertia
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
                            <h1 className="mb-8 text-5xl leading-tight font-bold tracking-tighter text-white uppercase md:text-8xl">
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

                    {/* Service Tabs - Using the consolidated 'services' array */}
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
                            {subCategories[activeTab]?.map((sub) => (
                                <Link
                                    key={sub.slug}
                                    // Navigation using Inertia's Link component
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

                            {/* Display "Coming Soon" if no sub-categories for the active tab */}
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

                    {/* Trust Section - kept as is */}
                    <div className="mt-32 grid grid-cols-1 gap-12 border-t border-white/5 pt-24 md:grid-cols-3">
                        {[
                            { icon: Zap, title: 'Instant Start', desc: 'Projects kicked off immediately after purchase.' },
                            { icon: Users, title: 'Direct Access', desc: 'Chat directly with the creative team working on your task.' },
                            { icon: Star, title: 'Quality First', desc: 'Premium results guaranteed or your money back.' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-6">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-400">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="mb-2 text-lg font-bold text-white">{item.title}</h4>
                                    <p className="text-sm leading-relaxed text-zinc-500">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default HireUsPage;
