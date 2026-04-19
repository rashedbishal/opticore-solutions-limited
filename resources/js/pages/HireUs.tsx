import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Assuming these UI components exist or will be created
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming these UI components exist or will be created
import { Button } from '@/components/ui/button'; // Assuming this UI component exists
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Bot, User, Send, X } from 'lucide-react'; // Assuming these icons are available
import { cn } from '@/lib/utils'; // Utility for class names

// Mock data for services, sub-categories, and pricing
const servicesData = {
    'gfx-design': {
        name: 'GFX Design',
        description: 'Creative visual solutions to elevate your brand identity.',
        subCategories: [
            { id: 'social-media-post', name: 'Social Media Post Design', icon: '🎨' },
            { id: 'youtube-thumbnail', name: 'YouTube Thumbnail Design', icon: '📺' },
            { id: 'brochure-design', name: 'Brochure Design', icon: '📄' },
            { id: 'logo-design', name: 'Logo Design', icon: '💡' },
        ],
    },
    '3d-production': {
        name: '3D Production',
        description: 'Stunning 3D visualizations and animations for immersive experiences.',
        subCategories: [
            { id: '3d-modeling', name: '3D Modeling', icon: '🧊' },
            { id: 'product-visualization', name: 'Product Visualization', icon: '📦' },
            { id: '3d-animation', name: '3D Animation', icon: '🎬' },
        ],
    },
    'web-development': {
        name: 'Web Development',
        description: 'Robust and dynamic web solutions tailored to your business needs.',
        subCategories: [
            { id: 'frontend-development', name: 'Frontend Development', icon: '💻' },
            { id: 'backend-development', name: 'Backend Development', icon: '⚙️' },
            { id: 'fullstack-development', name: 'Fullstack Development', icon: '🌐' },
            { id: 'e-commerce-dev', name: 'E-commerce Development', icon: '🛍️' },
        ],
    },
};

const serviceDetails = {
    'social-media-post': {
        name: 'Social Media Post Design',
        description: 'Eye-catching social media posts optimized for engagement.',
        demos: [
            '/images/demo/social-post-1.png',
            '/images/demo/social-post-2.png',
        ],
        pricing: [
            { tier: 'Basic', description: 'Single post design', price: '500 BDT' },
            { tier: 'Standard', description: '5 posts package', price: '2000 BDT' },
            { tier: 'Premium', description: '10 posts package + analytics insights', price: '3500 BDT' },
        ],
    },
    'youtube-thumbnail': {
        name: 'YouTube Thumbnail Design',
        description: 'Click-worthy thumbnails to boost your video views.',
        demos: [
            '/images/demo/youtube-thumb-1.png',
            '/images/demo/youtube-thumb-2.png',
        ],
        pricing: [
            { tier: 'Basic', description: 'Single thumbnail design', price: '700 BDT' },
            { tier: 'Standard', description: '5 thumbnails package', price: '3000 BDT' },
            { tier: 'Premium', description: '10 thumbnails package + A/B testing suggestions', price: '5000 BDT' },
        ],
    },
    'brochure-design': {
        name: 'Brochure Design',
        description: 'Professional brochures to effectively communicate your message.',
        demos: [
            '/images/demo/brochure-1.png',
        ],
        pricing: [
            { tier: 'Basic', description: 'Single-fold brochure', price: '1500 BDT' },
            { tier: 'Standard', description: 'Bi-fold brochure', price: '2500 BDT' },
            { tier: 'Premium', description: 'Tri-fold brochure + print-ready files', price: '4000 BDT' },
        ],
    },
    // Add details for other sub-categories as needed
};

const defaultHeroVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const HireUsPage = () => {
    const [activeTab, setActiveTab] = useState('gfx-design');
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [customDealMessage, setCustomDealMessage] = useState('');
    const [customDealService, setCustomDealService] = useState('');

    const handleHireNow = (serviceName: string) => {
        console.log(`Initiating hire for: ${serviceName}`);
        // In a real app, this would navigate to a checkout or confirmation page
        // For demo purposes, we'll simulate by setting a selected service and potentially opening modal
        setSelectedService(serviceName);
        // Optionally open a confirmation dialog or navigate
    };

    const handleCustomDealClick = (serviceName: string) => {
        setCustomDealService(serviceName);
        setIsContactModalOpen(true);
    };

    const handleSendMessage = () => {
        console.log('Sending custom deal message:', { service: customDealService, message: customDealMessage });
        // Here, you'd typically send the message via an API call
        alert('Message sent! We will get back to you shortly.');
        setIsContactModalOpen(false);
        setCustomDealMessage('');
        setCustomDealService('');
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSelectedService(null); // Reset selected service when tab changes
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black text-white">
            {/* Hero Section */}
            <section className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-600/10 via-indigo-600/10 to-transparent p-8">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-violet-500/5 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/5 to-transparent" />
                    <div className="absolute top-[18%] right-[-10rem] h-72 w-72 rounded-full bg-violet-500/12 blur-[130px]" />
                    <div className="absolute bottom-[10%] left-[-8rem] h-72 w-72 rounded-full bg-cyan-400/12 blur-[130px]" />
                </div>
                <div className="text-center z-10">
                    <motion.h1
                        variants={defaultHeroVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-5xl md:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300"
                    >
                        Turn Your Vision into Reality
                    </motion.h1>
                    <motion.p
                        variants={defaultHeroVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-xl md:text-2xl font-light mb-8 text-white/80 max-w-3xl mx-auto"
                    >
                        From concept to completion, we provide bespoke digital solutions tailored to your unique needs. Let's build something extraordinary together.
                    </motion.p>
                    <motion.div
                        variants={defaultHeroVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <Button
                            onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 text-lg font-semibold rounded-full shadow-lg shadow-violet-500/30 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300"
                        >
                            Explore Services
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services-section" className="py-20 px-8">
                <div className="max-w-6xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300"
                    >
                        Our Services
                    </motion.h2>

                    <Tabs value={activeTab} onValueChange={(value: string) => handleTabChange(value)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 gap-4 mb-12 px-4 py-3 bg-gray-800/50 backdrop-blur-lg border border-white/10 rounded-full shadow-inner">
                            {Object.keys(servicesData).map((key) => (
                                <TabsTrigger
                                    key={key}
                                    value={key}
                                    className={cn(
                                        'data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/30',
                                        'text-gray-300 hover:text-white transition-all duration-300 data-[state=active]:transition-all data-[state=active]:duration-300',
                                        'py-3 px-6 rounded-full font-semibold text-lg'
                                    )}
                                >
                                    {servicesData[key as keyof typeof servicesData].name}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {Object.keys(servicesData).map((key) => (
                            <TabsContent key={key} value={key} className="mt-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                >
                                    {servicesData[key as keyof typeof servicesData].subCategories.map((subCat) => (
                                        <Card
                                            key={subCat.id}
                                            className="bg-gray-800/30 backdrop-blur-lg border border-white/5 rounded-xl hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-300 cursor-pointer"
                                            onClick={() => handleHireNow(subCat.name)} // This would navigate to a detail page or open a modal in a real app
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-xl font-bold text-white">
                                                        {subCat.name}
                                                    </CardTitle>
                                                    <span className="text-2xl">{subCat.icon}</span>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-300 mb-4">{subCat.description || 'Details coming soon!'}</p>
                                                <div className="flex justify-between items-center">
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent card click
                                                            handleCustomDealClick(subCat.name);
                                                        }}
                                                        variant="outline"
                                                        className="text-violet-400 border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
                                                    >
                                                        Custom Deal
                                                    </Button>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent card click
                                                            handleHireNow(subCat.name); // Simulate navigation/selection
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
            <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-gray-900 border-white/10 backdrop-blur-lg">
                    <DialogTrigger asChild>
                        {/* This trigger is not directly used here as the modal is controlled by state */}
                        <Button variant="outline" className="hidden">Open Modal</Button>
                    </DialogTrigger>
                    <div className="relative">
                        <button
                            onClick={() => setIsContactModalOpen(false)}
                            className="absolute top-3 right-3 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white">
                                Discuss Custom Deal
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Describe your needs for "{customDealService}" and we'll get back to you.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-6 space-y-4">
                            <div>
                                <Label htmlFor="custom-deal-service" className="text-gray-300">Service</Label>
                                <Input
                                    id="custom-deal-service"
                                    value={customDealService}
                                    readOnly
                                    className="bg-gray-800/50 border-gray-700 mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="custom-deal-message" className="text-gray-300">Your Message</Label>
                                <Textarea
                                    id="custom-deal-message"
                                    value={customDealMessage}
                                    onChange={(e) => setCustomDealMessage(e.target.value)}
                                    placeholder="Tell us about your project requirements..."
                                    className="bg-gray-800/50 border-gray-700 mt-1 min-h-[120px]"
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
