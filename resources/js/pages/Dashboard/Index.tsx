import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Star, 
    MessageSquare, 
    ChevronRight,
    Search,
    Bell,
    Settings,
    LayoutDashboard,
    Briefcase,
    CreditCard,
    Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/Layout/AppLayout';

const mockOrders = [
    { 
        id: 'ORD-7721', 
        service: 'YouTube Thumbnail Design', 
        category: 'Graphic Design',
        status: 'In Progress', 
        deadline: '2026-04-18', 
        price: '300 BDT',
        progress: 65,
        team: 'Visuals Team A'
    },
    { 
        id: 'ORD-7718', 
        service: 'Social Media Post Pack', 
        category: 'Graphic Design',
        status: 'Review Required', 
        deadline: '2026-04-16', 
        price: '500 BDT',
        progress: 100,
        team: 'Marketing Team B',
        deliveredAt: '2026-04-16T10:00:00Z'
    },
    { 
        id: 'ORD-7692', 
        service: 'Product 3D Render', 
        category: '3D Production',
        status: 'Completed', 
        deadline: '2026-04-10', 
        price: '3500 BDT',
        progress: 100,
        team: '3D Studio 1',
        rating: 5
    }
];

export default function UserDashboard() {
    const [activeTab, setActiveTab] = useState('active');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedOrderForReview, setSelectedOrderForReview] = useState<any>(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    const filteredOrders = mockOrders.filter(order => {
        if (activeTab === 'active') return order.status === 'In Progress' || order.status === 'Review Required';
        if (activeTab === 'completed') return order.status === 'Completed';
        return true;
    });

    return (
        <AppLayout>
            <Head title="Client Dashboard | Opticore Solutions Ltd." />
            
            <div className="bg-black min-h-screen pt-32 pb-24 px-4">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Dashboard Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">My Workspace</h1>
                            <p className="text-zinc-500 font-medium">Track your active projects and manage your deliveries.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-3 right-3 w-2 h-2 bg-cyan-500 rounded-full" />
                            </button>
                            <button className="px-6 py-3 rounded-2xl bg-white text-black font-bold flex items-center gap-2 hover:bg-cyan-400 transition-colors">
                                <Zap className="w-4 h-4 fill-current" /> New Project
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
                        
                        {/* Sidebar Navigation */}
                        <aside className="space-y-2">
                            {[
                                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                                { id: 'orders', label: 'My Orders', icon: Package },
                                { id: 'messages', label: 'Messages', icon: MessageSquare },
                                { id: 'billing', label: 'Payments', icon: CreditCard },
                                { id: 'settings', label: 'Settings', icon: Settings },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${item.id === 'orders' ? 'bg-white/5 text-cyan-400 border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            ))}
                        </aside>

                        {/* Main Content Area */}
                        <main className="space-y-8">
                            
                            {/* Stats Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: 'Active Orders', value: '02', icon: Package, color: 'text-cyan-400' },
                                    { label: 'Awaiting Review', value: '01', icon: Clock, color: 'text-amber-400' },
                                    { label: 'Total Invested', value: '4,300 BDT', icon: CreditCard, color: 'text-violet-400' }
                                ].map((stat, i) => (
                                    <div key={i} className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-zinc-900/40">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                                                <stat.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Lifetime</span>
                                        </div>
                                        <p className="text-zinc-500 text-sm font-medium mb-1">{stat.label}</p>
                                        <h3 className="text-2xl font-black text-white">{stat.value}</h3>
                                    </div>
                                ))}
                            </div>

                            {/* Orders Table-like View */}
                            <div className="glass-panel rounded-[2.5rem] border border-white/5 bg-zinc-900/20 overflow-hidden">
                                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex bg-black/40 p-1 rounded-xl">
                                        <button 
                                            onClick={() => setActiveTab('active')}
                                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            Active
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('completed')}
                                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            Completed
                                        </button>
                                    </div>
                                    <div className="relative hidden md:block">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <input 
                                            type="text" 
                                            placeholder="Search orders..." 
                                            className="bg-black/40 border border-white/5 rounded-xl py-2 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all w-64"
                                        />
                                    </div>
                                </div>

                                <div className="p-0">
                                    {filteredOrders.length > 0 ? (
                                        <div className="divide-y divide-white/5">
                                            {filteredOrders.map((order) => (
                                                <div key={order.id} className="p-8 hover:bg-white/[0.02] transition-colors group">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="flex gap-6">
                                                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                                <Briefcase className="w-6 h-6 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <h4 className="font-bold text-white text-lg">{order.service}</h4>
                                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                                        order.status === 'Review Required' ? 'bg-amber-500/20 text-amber-500' : 
                                                                        order.status === 'In Progress' ? 'bg-cyan-500/20 text-cyan-500' : 'bg-zinc-800 text-zinc-500'
                                                                    }`}>
                                                                        {order.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                                                                    ID: {order.id} • {order.category}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-8 md:gap-12">
                                                            <div>
                                                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Price</p>
                                                                <p className="text-white font-bold">{order.price}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Deadline</p>
                                                                <p className="text-white font-bold">{order.deadline}</p>
                                                            </div>
                                                            <div className="w-32">
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Progress</p>
                                                                    <span className="text-[10px] font-bold text-white">{order.progress}%</span>
                                                                </div>
                                                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                    <motion.div 
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${order.progress}%` }}
                                                                        className={`h-full ${order.status === 'Review Required' ? 'bg-amber-500' : 'bg-cyan-500'}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {order.status === 'Review Required' ? (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setSelectedOrderForReview(order);
                                                                            setIsReviewModalOpen(true);
                                                                        }}
                                                                        className="px-6 py-3 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-colors flex items-center gap-2"
                                                                    >
                                                                        Review Now <ArrowRight className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/30 transition-all">
                                                                        <ChevronRight className="w-5 h-5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-24 text-center">
                                            <Package className="w-12 h-12 text-zinc-800 mx-auto mb-6" />
                                            <h3 className="text-xl font-bold text-zinc-600 uppercase tracking-widest">No orders found</h3>
                                            <p className="text-zinc-700 mt-2">Try switching tabs or start a new project.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </main>
                    </div>
                </div>
            </div>

            {/* Review Submission Modal Demo */}
            <AnimatePresence>
                {isReviewModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsReviewModalOpen(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl glass-panel rounded-[3rem] border border-white/10 bg-zinc-900 p-8 md:p-12 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
                            
                            <div className="mb-8">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Submit Your Review</h3>
                                <p className="text-zinc-500">How was your experience with <span className="text-white font-bold">{selectedOrderForReview?.service}</span>?</p>
                            </div>

                            <div className="space-y-8">
                                {/* Rating Logic Demo */}
                                <div className="flex flex-col items-center py-6 bg-white/5 rounded-3xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">Your Rating</p>
                                    <div className="flex gap-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button 
                                                key={star}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(star)}
                                                className="transition-transform hover:scale-125"
                                            >
                                                <Star 
                                                    className={`w-12 h-12 transition-colors ${
                                                        (hoverRating || rating) >= star ? 'text-amber-400 fill-current' : 'text-zinc-700'
                                                    }`} 
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-6 text-sm font-bold text-amber-500 uppercase tracking-widest h-4">
                                        {rating === 5 ? 'Exceptional!' : rating === 4 ? 'Great Work' : rating === 3 ? 'Good' : rating === 2 ? 'Needs Improvement' : rating === 1 ? 'Poor' : ''}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-4">Detailed Feedback</p>
                                    <textarea 
                                        placeholder="Tell us about the quality, communication, and speed..."
                                        className="w-full h-40 bg-black/40 border border-white/10 rounded-[2rem] p-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                                    />
                                </div>

                                {/* Review System Rule Info */}
                                <div className="flex gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        <span className="text-amber-500 font-bold uppercase">Important:</span> You have <span className="text-white font-bold underline">24 hours</span> to provide a review after delivery. Once submitted, reviews <span className="text-white font-bold">cannot be edited</span>.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button 
                                        onClick={() => setIsReviewModalOpen(false)}
                                        className="flex-1 px-8 py-5 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                                    >
                                        Skip for now
                                    </button>
                                    <button 
                                        onClick={() => {
                                            alert("Demo: Review Submitted Successfully! (This review is now locked)");
                                            setIsReviewModalOpen(false);
                                        }}
                                        className="flex-[2] px-8 py-5 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl"
                                    >
                                        Submit Locked Review
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </AppLayout>
    );
}
