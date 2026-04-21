import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/UI/dialog';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/tabs';
import { Textarea } from '@/components/UI/textarea';

import { cn } from '@/lib/utils';

// Define services with their IDs, names, icons, and colors
const services = [
    {
        id: 'graphic-design',
        name: 'GFX Design',
        description:
            'Creative visual solutions to elevate your brand identity.',
        subCategories: [
            {
                id: 'social-media-post',
                name: 'Social Media Post Design',
                icon: '🎨',
                description: '',
            },
            {
                id: 'youtube-thumbnail',
                name: 'YouTube Thumbnail Design',
                icon: '📺',
                description: '',
            },
            {
                id: 'brochure-design',
                name: 'Brochure Design',
                icon: '📄',
                description: '',
            },
            {
                id: 'logo-design',
                name: 'Logo Design',
                icon: '💡',
                description: '',
            },
        ],
    },
    {
        id: '3d-production',
        name: '3D Production',
        description:
            'Stunning 3D visualizations and animations for immersive experiences.',
        subCategories: [
            {
                id: '3d-modeling',
                name: '3D Modeling',
                icon: '🧊',
                description: '',
            },
            {
                id: 'product-visualization',
                name: 'Product Visualization',
                icon: '📦',
                description: '',
            },
            {
                id: '3d-animation',
                name: '3D Animation',
                icon: '🎬',
                description: '',
            },
        ],
    },
    {
        id: 'web-development',
        name: 'Web Development',
        description:
            'Robust and dynamic web solutions tailored to your business needs.',
        subCategories: [
            {
                id: 'frontend-development',
                name: 'Frontend Development',
                icon: '💻',
                description: '',
            },
            {
                id: 'backend-development',
                name: 'Backend Development',
                icon: '⚙️',
                description: '',
            },
            {
                id: 'fullstack-development',
                name: 'Fullstack Development',
                icon: '🌐',
                description: '',
            },
            {
                id: 'e-commerce-dev',
                name: 'E-commerce Development',
                icon: '🛍️',
                description: '',
            },
        ],
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

const defaultHeroVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const HireUsPage = () => {
    const [activeTab, setActiveTab] = useState('gfx-design');
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [customDealMessage, setCustomDealMessage] = useState('');
    const [customDealService, setCustomDealService] = useState('');

    const handleHireNow = (serviceName: string) => {
        console.log(`Initiating hire for: ${serviceName}`);
        // In a real app, this would navigate to a checkout or confirmation page
        // For demo purposes, we'll simulate by potentially opening modal
        // Optionally open a confirmation dialog or navigate
    };

    const handleCustomDealClick = (serviceName: string) => {
        setCustomDealService(serviceName);
        setIsContactModalOpen(true);
    };

    const handleSendMessage = () => {
        console.log('Sending custom deal message:', {
            service: customDealService,
            message: customDealMessage,
        });
        // Here, you'd typically send the message via an API call
        alert('Message sent! We will get back to you shortly.');
        setIsContactModalOpen(false);
        setCustomDealMessage('');
        setCustomDealService('');
    };

    // Updated handleTabChange to correctly set the active tab
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black text-white">
            {/* Hero Section */}
            <section className="relative flex h-[70vh] items-center justify-center overflow-hidden bg-gradient-to-br from-violet-600/10 via-indigo-600/10 to-transparent p-8">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-violet-500/5 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/5 to-transparent" />
                    <div className="absolute top-[18%] right-[-10rem] h-72 w-72 rounded-full bg-violet-500/12 blur-[130px]" />
                    <div className="absolute bottom-[10%] left-[-8rem] h-72 w-72 rounded-full bg-cyan-400/12 blur-[130px]" />
                </div>
                <div className="z-10 text-center">
                    <motion.h1
                        variants={defaultHeroVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-5xl font-bold text-transparent md:text-7xl"
                    >
                        Turn Your Vision into Reality
                    </motion.h1>
                    <motion.p
                        variants={defaultHeroVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="mx-auto mb-8 max-w-3xl text-xl font-light text-white/80 md:text-2xl"
                    >
                        From concept to completion, we provide bespoke digital
                        solutions tailored to your unique needs. Let's build
                        something extraordinary together.
                    </motion.p>
                    <motion.div
                        variants={defaultHeroVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <Button
                            onClick={() =>
                                document
                                    .getElementById('services-section')
                                    ?.scrollIntoView({ behavior: 'smooth' })
                            }
                            className="transform rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-lg font-semibold shadow-lg shadow-violet-500/30 transition-all duration-300 hover:scale-105 hover:from-violet-700 hover:to-indigo-700"
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

            {/* Services Section */}
            <section id="services-section" className="px-8 py-20">
                <div className="mx-auto max-w-6xl">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-16 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-center text-4xl font-bold text-transparent"
                    >
                        Our Services
                    </motion.h2>

                    <Tabs
                        value={activeTab}
                        onValueChange={(value: string) =>
                            handleTabChange(value)
                        }
                        className="w-full"
                    >
                        <TabsList className="mb-12 grid w-full grid-cols-3 gap-4 rounded-full border border-white/10 bg-gray-800/50 px-4 py-3 shadow-inner backdrop-blur-lg">
                            {Object.keys(servicesData).map((key) => (
                                <TabsTrigger
                                    key={key}
                                    value={key}
                                    className={cn(
                                        'data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/30',
                                        'text-gray-300 transition-all duration-300 hover:text-white data-[state=active]:transition-all data-[state=active]:duration-300',
                                        'rounded-full px-6 py-3 text-lg font-semibold',
                                    )}
                                >
                                    {
                                        servicesData[
                                            key as keyof typeof servicesData
                                        ].name
                                    }
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {Object.keys(servicesData).map((key) => (
                            <TabsContent key={key} value={key} className="mt-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
                                >
                                    {servicesData[
                                        key as keyof typeof servicesData
                                    ].subCategories.map((subCat) => (
                                        <Card
                                            key={subCat.id}
                                            className="cursor-pointer rounded-xl border border-white/5 bg-gray-800/30 backdrop-blur-lg transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20"
                                            onClick={() =>
                                                handleHireNow(subCat.name)
                                            } // This would navigate to a detail page or open a modal in a real app
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-xl font-bold text-white">
                                                        {subCat.name}
                                                    </CardTitle>
                                                    <span className="text-2xl">
                                                        {subCat.icon}
                                                    </span>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="mb-4 text-sm text-gray-300">
                                                    {subCat.description ||
                                                        'Details coming soon!'}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent card click
                                                            handleCustomDealClick(
                                                                subCat.name,
                                                            );
                                                        }}
                                                        variant="outline"
                                                        className="border-violet-500/40 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
                                                    >
                                                        Custom Deal
                                                    </Button>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent card click
                                                            handleHireNow(
                                                                subCat.name,
                                                            ); // Simulate navigation/selection
                                                        }}
                                                        className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/25"
                                                    >
                                                        View Details
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </motion.div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </section>

            {/* Custom Deal Contact Modal */}
            <Dialog
                open={isContactModalOpen}
                onOpenChange={setIsContactModalOpen}
            >
                <DialogContent className="border-white/10 bg-gray-900 backdrop-blur-lg sm:max-w-[425px]">
                    <DialogTrigger asChild>
                        {/* This trigger is not directly used here as the modal is controlled by state */}
                        <Button variant="outline" className="hidden">
                            Open Modal
                        </Button>
                    </DialogTrigger>
                    <div className="relative">
                        <button
                            onClick={() => setIsContactModalOpen(false)}
                            className="absolute top-3 right-3 p-1 text-gray-500 transition-colors hover:text-gray-300"
                        >
                            <X size={18} />
                        </button>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white">
                                Discuss Custom Deal
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Describe your needs for "{customDealService}"
                                and we'll get back to you.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-6 space-y-4">
                            <div>
                                <Label
                                    htmlFor="custom-deal-service"
                                    className="text-gray-300"
                                >
                                    Service
                                </Label>
                                <Input
                                    id="custom-deal-service"
                                    value={customDealService}
                                    readOnly
                                    className="mt-1 border-gray-700 bg-gray-800/50"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="custom-deal-message"
                                    className="text-gray-300"
                                >
                                    Your Message
                                </Label>
                                <Textarea
                                    id="custom-deal-message"
                                    value={customDealMessage}
                                    onChange={(e) =>
                                        setCustomDealMessage(e.target.value)
                                    }
                                    placeholder="Tell us about your project requirements..."
                                    className="mt-1 min-h-[120px] border-gray-700 bg-gray-800/50"
                                />
                            </div>
                            <Button
                                onClick={handleSendMessage}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
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
