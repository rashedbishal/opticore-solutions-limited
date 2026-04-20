import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    MessageSquare,
    Star,
    Zap,
    Shield,
    Clock,
    User,
    ArrowRight,
    X,
    Send,
    Users,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import Modal from '@/components/UI/Modal';

export default function SubCategoryShow({
    subcategory,
}: {
    category: string;
    subcategory: string;
}) {
    const [selectedPlan, setSelectedPlan] = useState('standard');
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        {
            role: 'team',
            content:
                'Hi there! We are the specialized team for this category. How can we help you with your project today?',
            time: '10:00 AM',
        },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const subName = subcategory.replace(/-/g, ' ');

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isChatOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim()) {
            return;
        }

        const time = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        setChatMessages([
            ...chatMessages,
            { role: 'user', content: newMessage, time },
        ]);
        setNewMessage('');

        // Mock auto-response
        setTimeout(() => {
            setChatMessages((prev) => [
                ...prev,
                {
                    role: 'team',
                    content:
                        'Thanks for reaching out! A member of our design team will review your message and get back to you shortly. Feel free to leave more details about your vision.',
                    time: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                },
            ]);
        }, 1500);
    };

    const plans = [
        {
            id: 'basic',
            name: 'Basic',
            price: '500 BDT',
            delivery: '2 Days',
            features: [
                '1 Initial Concept',
                '2 Revisions',
                'High Res JPG/PNG',
                'Commercial Use',
            ],
            icon: Zap,
            color: 'text-zinc-400',
        },
        {
            id: 'standard',
            name: 'Standard',
            price: '1000 BDT',
            delivery: '4 Days',
            features: [
                '2 Initial Concepts',
                '5 Revisions',
                'Source Files',
                'Commercial Use',
                'Priority Support',
            ],
            icon: Star,
            color: 'text-cyan-400',
            popular: true,
        },
        {
            id: 'premium',
            name: 'Premium',
            price: '2500 BDT',
            delivery: '7 Days',
            features: [
                '4 Initial Concepts',
                'Unlimited Revisions',
                'Full Brand Kit',
                'Source Files',
                'Commercial Use',
                'VIP Support',
            ],
            icon: Shield,
            color: 'text-violet-400',
        },
    ];

    return (
        <AppLayout>
            <Head title={`${subName} - Hire Opticore`} />

            <div className="relative min-h-screen bg-zinc-950 px-4 pt-32 pb-24">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_0.7fr]">
                        {/* Main Content */}
                        <div className="space-y-12">
                            {/* Header */}
                            <div>
                                <h1 className="mb-4 text-4xl font-black tracking-tight text-white capitalize md:text-5xl">
                                    {subName}
                                </h1>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-1.5 text-amber-400">
                                        <Star className="h-5 w-5 fill-current" />
                                        <span className="font-bold">5.0</span>
                                        <span className="text-sm font-medium text-zinc-500">
                                            (124 Reviews)
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-zinc-500">
                                        10 Orders in Queue
                                    </div>
                                </div>
                            </div>

                            {/* Demo Media */}
                            <div className="group relative aspect-video w-full overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900">
                                <img
                                    src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200"
                                    className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                                    alt="Work Demo"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                    <button className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-black">
                                        View Full Portfolio
                                    </button>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="glass-panel space-y-6 rounded-[2rem] border border-white/5 p-8 md:p-12">
                                <h3 className="text-2xl font-bold text-white">
                                    Service Description
                                </h3>
                                <p className="text-lg leading-relaxed text-zinc-400">
                                    We provide high-quality, professional{' '}
                                    {subName} tailored specifically to your
                                    brand's voice and goals. Our team of experts
                                    focuses on delivering visually stunning and
                                    commercially effective results that stand
                                    out in today's crowded digital landscape.
                                </p>
                                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {[
                                        'Custom Designs',
                                        'Fast Turnaround',
                                        'Expert Consultation',
                                        'Source File Inclusion',
                                    ].map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-center gap-3 text-zinc-300"
                                        >
                                            <Check className="h-5 w-5 text-cyan-400" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Review System Demo */}
                            <div className="space-y-8">
                                <h3 className="text-2xl font-bold text-white">
                                    Client Reviews
                                </h3>
                                <div className="space-y-6">
                                    {[
                                        {
                                            user: 'Alex M.',
                                            review: 'Exceptional work! The communication was great and the final result exceeded my expectations. Will definitely hire again.',
                                            rating: 5,
                                        },
                                        {
                                            user: 'Sarah K.',
                                            review: 'The team really understood my vision. The social media posts were exactly what I needed to boost my engagement.',
                                            rating: 5,
                                        },
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            className="rounded-3xl border border-white/10 bg-white/5 p-6"
                                        >
                                            <div className="mb-4 flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                                                    <User className="h-6 w-6 text-zinc-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-white">
                                                        {item.user}
                                                    </h4>
                                                    <div className="flex text-amber-400">
                                                        {[1, 2, 3, 4, 5].map(
                                                            (s) => (
                                                                <Star
                                                                    key={s}
                                                                    className={`h-3 w-3 ${s <= item.rating ? 'fill-current' : ''}`}
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-zinc-400 italic">
                                                "{item.review}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Pricing */}
                        <div className="sticky top-32 h-fit space-y-6">
                            <div className="glass-panel rounded-[2.5rem] border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
                                {/* Tab-like Plan Switcher */}
                                <div className="mb-8 flex rounded-2xl bg-black/40 p-1.5">
                                    {plans.map((plan) => (
                                        <button
                                            key={plan.id}
                                            onClick={() =>
                                                setSelectedPlan(plan.id)
                                            }
                                            className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${selectedPlan === plan.id ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            {plan.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Active Plan Details */}
                                {plans.map(
                                    (plan) =>
                                        plan.id === selectedPlan && (
                                            <motion.div
                                                key={plan.id}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <plan.icon
                                                            className={`h-6 w-6 ${plan.color}`}
                                                        />
                                                        <span className="text-2xl font-black text-white">
                                                            {plan.price}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                                                        <Clock className="h-4 w-4" />
                                                        {plan.delivery}
                                                    </div>
                                                </div>

                                                <p className="text-sm text-zinc-400">
                                                    Professional solution for
                                                    brands looking for
                                                    high-impact {subName}.
                                                </p>

                                                <ul className="space-y-3">
                                                    {plan.features.map((f) => (
                                                        <li
                                                            key={f}
                                                            className="flex items-center gap-3 text-sm text-zinc-300"
                                                        >
                                                            <Check className="h-4 w-4 shrink-0 text-cyan-400" />
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>

                                                <button className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-black tracking-widest text-black uppercase transition-colors hover:bg-cyan-400">
                                                    Hire Now{' '}
                                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        setIsContactModalOpen(
                                                            true,
                                                        )
                                                    }
                                                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-4 font-bold text-white transition-colors hover:bg-white/5"
                                                >
                                                    <MessageSquare className="h-4 w-4" />{' '}
                                                    Custom Quote
                                                </button>
                                            </motion.div>
                                        ),
                                )}
                            </div>

                            {/* Guarantee Box */}
                            <div className="rounded-[2rem] border border-cyan-500/20 bg-cyan-500/10 p-6">
                                <h4 className="mb-2 flex items-center gap-2 font-bold text-cyan-400">
                                    <Shield className="h-4 w-4" /> Secure
                                    Purchase
                                </h4>
                                <p className="text-xs text-zinc-500">
                                    Your payment is held securely and only
                                    released when you are satisfied with the
                                    final delivery.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FLOATING TEAM CHAT --- */}
                <div className="fixed right-8 bottom-8 z-[60] flex flex-col items-end">
                    <AnimatePresence>
                        {isChatOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                className="glass-panel mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 shadow-2xl"
                            >
                                {/* Chat Header */}
                                <div className="flex items-center justify-between border-b border-white/5 bg-zinc-800/50 p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">
                                                Category Team
                                            </h4>
                                            <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                                                Online
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsChatOpen(false)}
                                        className="text-zinc-500 transition-colors hover:text-white"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Chat Content */}
                                <div className="scrollbar-hide flex-1 space-y-6 overflow-y-auto p-6">
                                    {chatMessages.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                                                    msg.role === 'user'
                                                        ? 'rounded-tr-none bg-white text-black'
                                                        : 'rounded-tl-none border border-white/5 bg-white/5 text-zinc-300'
                                                }`}
                                            >
                                                {msg.content}
                                            </div>
                                            <span className="mt-2 text-[10px] font-medium text-zinc-600">
                                                {msg.time}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input */}
                                <form
                                    onSubmit={handleSendMessage}
                                    className="border-t border-white/5 bg-black/20 p-4"
                                >
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) =>
                                                setNewMessage(e.target.value)
                                            }
                                            placeholder="Ask about this service..."
                                            className="w-full rounded-xl border-none bg-zinc-800 py-3 pr-12 pl-4 text-sm text-white focus:ring-1 focus:ring-cyan-500/50"
                                        />
                                        <button
                                            type="submit"
                                            className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-cyan-500 text-white transition-all hover:bg-cyan-400"
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className="mt-3 text-center text-[9px] font-bold tracking-[0.2em] text-zinc-600 uppercase">
                                        Direct Sub-Category Chat
                                    </p>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Chat Toggle Button */}
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`group flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-500 ${
                            isChatOpen
                                ? 'rotate-90 bg-zinc-800 text-white'
                                : 'bg-white text-black hover:scale-110'
                        }`}
                    >
                        {isChatOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <MessageSquare className="h-6 w-6 transition-transform group-hover:scale-110" />
                        )}
                        {!isChatOpen && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 animate-ping rounded-full bg-cyan-500" />
                        )}
                    </button>
                </div>
            </div>

            {/* Contact Modal */}
            <Modal
                open={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                title="Discuss Your Project"
            >
                <div className="space-y-6 p-6">
                    <p className="text-zinc-400">
                        Tell us more about your custom requirements for{' '}
                        <span className="font-bold text-white">{subName}</span>.
                    </p>
                    <div className="space-y-4">
                        <textarea
                            placeholder="Describe what you need..."
                            className="h-32 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white transition-colors focus:border-cyan-500 focus:outline-none"
                        />
                        <button className="w-full rounded-2xl bg-cyan-500 py-4 font-black tracking-widest text-white uppercase transition-colors hover:bg-cyan-600">
                            Send Message
                        </button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
