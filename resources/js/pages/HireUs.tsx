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

// Mock data for services, sub-categories, and pricing
const servicesData = {
    'gfx-design': {
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
    '3d-production': {
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
    'web-development': {
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
                            Explore Services
                        </Button>
                    </motion.div>
                </div>
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
                                Send Message
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Placeholder for Service Detail Pages - Navigation would be handled by Inertia router */}
            {/* When a sub-category is clicked, it would typically navigate to a route like /hire-us/gfx-design/social-media-post */}
            {/* This page would then fetch its specific details from a backend or mock data */}

            {/* Placeholder for Authentication Pages (Sign Up/Sign In) - These would be separate Inertia pages */}
            {/* Example: <AuthLayout><SignUpForm /></AuthLayout> */}

            {/* Placeholder for User Dashboard - This would be another Inertia page */}
            {/* Example: <AuthenticatedLayout><Dashboard /></AuthenticatedLayout> */}
        </div>
    );
};

export default HireUsPage;
