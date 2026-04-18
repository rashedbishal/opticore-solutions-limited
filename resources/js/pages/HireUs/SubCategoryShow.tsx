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
    Bot
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/Layout/AppLayout';
import Modal from '@/components/UI/Modal';

export default function SubCategoryShow({ subcategory }: { category: string, subcategory: string }) {
    const [selectedPlan, setSelectedPlan] = useState('standard');
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { role: 'team', content: 'Hi there! We are the specialized team for this category. How can we help you with your project today?', time: '10:00 AM' }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const subName = subcategory.replace(/-/g, ' ');

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isChatOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMessages([...chatMessages, { role: 'user', content: newMessage, time }]);
        setNewMessage('');

        // Mock auto-response
        setTimeout(() => {
            setChatMessages(prev => [...prev, { 
                role: 'team', 
                content: "Thanks for reaching out! A member of our design team will review your message and get back to you shortly. Feel free to leave more details about your vision.", 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            }]);
        }, 1500);
    };

    const plans = [
        {
            id: 'basic',
            name: 'Basic',
            price: '500 BDT',
            delivery: '2 Days',
            features: ['1 Initial Concept', '2 Revisions', 'High Res JPG/PNG', 'Commercial Use'],
            icon: Zap,
            color: 'text-zinc-400'
        },
        {
            id: 'standard',
            name: 'Standard',
            price: '1000 BDT',
            delivery: '4 Days',
            features: ['2 Initial Concepts', '5 Revisions', 'Source Files', 'Commercial Use', 'Priority Support'],
            icon: Star,
            color: 'text-cyan-400',
            popular: true
        },
        {
            id: 'premium',
            name: 'Premium',
            price: '2500 BDT',
            delivery: '7 Days',
            features: ['4 Initial Concepts', 'Unlimited Revisions', 'Full Brand Kit', 'Source Files', 'Commercial Use', 'VIP Support'],
            icon: Shield,
            color: 'text-violet-400'
        }
    ];

    return (
        <AppLayout>
            <Head title={`${subName} - Hire Opticore`} />
            
            <div className="bg-zinc-950 min-h-screen pt-32 pb-24 px-4 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-12">
                        
                        {/* Main Content */}
                        <div className="space-y-12">
                            {/* Header */}
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-white capitalize mb-4 tracking-tight">{subName}</h1>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-1.5 text-amber-400">
                                        <Star className="w-5 h-5 fill-current" />
                                        <span className="font-bold">5.0</span>
                                        <span className="text-zinc-500 font-medium text-sm">(124 Reviews)</span>
                                    </div>
                                    <div className="text-zinc-500 text-sm font-medium">10 Orders in Queue</div>
                                </div>
                            </div>

                            {/* Demo Media */}
                            <div className="aspect-video w-full rounded-[2rem] overflow-hidden border border-white/10 bg-zinc-900 group relative">
                                <img 
                                    src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200" 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                    alt="Work Demo"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                     <button className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2">
                                        View Full Portfolio
                                     </button>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="glass-panel p-8 md:p-12 rounded-[2rem] border border-white/5 space-y-6">
                                <h3 className="text-2xl font-bold text-white">Service Description</h3>
                                <p className="text-zinc-400 text-lg leading-relaxed">
                                    We provide high-quality, professional {subName} tailored specifically to your brand's voice and goals. 
                                    Our team of experts focuses on delivering visually stunning and commercially effective results that stand out in today's crowded digital landscape.
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['Custom Designs', 'Fast Turnaround', 'Expert Consultation', 'Source File Inclusion'].map((item) => (
                                        <li key={item} className="flex items-center gap-3 text-zinc-300">
                                            <Check className="w-5 h-5 text-cyan-400" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Review System Demo */}
                            <div className="space-y-8">
                                <h3 className="text-2xl font-bold text-white">Client Reviews</h3>
                                <div className="space-y-6">
                                    {[
                                        { user: 'Alex M.', review: "Exceptional work! The communication was great and the final result exceeded my expectations. Will definitely hire again.", rating: 5 },
                                        { user: 'Sarah K.', review: "The team really understood my vision. The social media posts were exactly what I needed to boost my engagement.", rating: 5 }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                                    <User className="w-6 h-6 text-zinc-500" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-lg">{item.user}</h4>
                                                    <div className="flex text-amber-400">
                                                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= item.rating ? 'fill-current' : ''}`} />)}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-zinc-400 italic">"{item.review}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Pricing */}
                        <div className="sticky top-32 space-y-6 h-fit">
                            <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
                                {/* Tab-like Plan Switcher */}
                                <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8">
                                    {plans.map((plan) => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${selectedPlan === plan.id ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            {plan.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Active Plan Details */}
                                {plans.map((plan) => plan.id === selectedPlan && (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <plan.icon className={`w-6 h-6 ${plan.color}`} />
                                                <span className="text-2xl font-black text-white">{plan.price}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                                                <Clock className="w-4 h-4" />
                                                {plan.delivery}
                                            </div>
                                        </div>

                                        <p className="text-zinc-400 text-sm">Professional solution for brands looking for high-impact {subName}.</p>
                                        
                                        <ul className="space-y-3">
                                            {plan.features.map((f) => (
                                                <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                                                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>

                                        <button className="w-full bg-white text-black py-4 rounded-2xl font-black hover:bg-cyan-400 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2 group">
                                            Hire Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>

                                        <button 
                                            onClick={() => setIsContactModalOpen(true)}
                                            className="w-full border border-white/10 text-white py-4 rounded-2xl font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare className="w-4 h-4" /> Custom Quote
                                        </button>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Guarantee Box */}
                            <div className="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-[2rem]">
                                 <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> Secure Purchase
                                 </h4>
                                 <p className="text-zinc-500 text-xs">Your payment is held securely and only released when you are satisfied with the final delivery.</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- FLOATING TEAM CHAT --- */}
                <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end">
                    <AnimatePresence>
                        {isChatOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                className="mb-4 w-[350px] h-[500px] glass-panel border border-white/10 bg-zinc-900 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
                            >
                                {/* Chat Header */}
                                <div className="bg-zinc-800/50 p-6 flex items-center justify-between border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-sm">Category Team</h4>
                                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsChatOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Chat Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                                                msg.role === 'user' 
                                                ? 'bg-white text-black rounded-tr-none' 
                                                : 'bg-white/5 text-zinc-300 border border-white/5 rounded-tl-none'
                                            }`}>
                                                {msg.content}
                                            </div>
                                            <span className="text-[10px] text-zinc-600 mt-2 font-medium">{msg.time}</span>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input */}
                                <form onSubmit={handleSendMessage} className="p-4 bg-black/20 border-t border-white/5">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Ask about this service..."
                                            className="w-full bg-zinc-800 border-none rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:ring-1 focus:ring-cyan-500/50"
                                        />
                                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-400 transition-all">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-zinc-600 text-center mt-3 font-bold uppercase tracking-[0.2em]">Direct Sub-Category Chat</p>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Chat Toggle Button */}
                    <button 
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 group ${
                            isChatOpen ? 'bg-zinc-800 text-white rotate-90' : 'bg-white text-black hover:scale-110'
                        }`}
                    >
                        {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                        {!isChatOpen && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full animate-ping" />
                        )}
                    </button>
                </div>
            </div>

            {/* Contact Modal */}
            <Modal open={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} title="Discuss Your Project">
                <div className="p-6 space-y-6">
                    <p className="text-zinc-400">Tell us more about your custom requirements for <span className="text-white font-bold">{subName}</span>.</p>
                    <div className="space-y-4">
                        <textarea 
                            placeholder="Describe what you need..." 
                            className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                        <button className="w-full bg-cyan-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-600 transition-colors">
                            Send Message
                        </button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
