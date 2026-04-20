import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Clock,
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
    Zap,
    ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
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
        team: 'Visuals Team A',
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
        deliveredAt: '2026-04-16T10:00:00Z',
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
        rating: 5,
    },
];

export default function UserDashboard() {
    const [activeTab, setActiveTab] = useState('active');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedOrderForReview, setSelectedOrderForReview] =
        useState<any>(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    const filteredOrders = mockOrders.filter((order) => {
        if (activeTab === 'active') {
            return (
                order.status === 'In Progress' ||
                order.status === 'Review Required'
            );
        }

        if (activeTab === 'completed') {
            return order.status === 'Completed';
        }

        return true;
    });

    return (
        <AppLayout>
            <Head title="Client Dashboard | Opticore Solutions Ltd." />

            <div className="min-h-screen bg-black px-4 pt-32 pb-24">
                <div className="mx-auto max-w-7xl">
                    {/* Dashboard Header */}
                    <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                        <div>
                            <h1 className="mb-2 text-4xl font-black tracking-tighter text-white uppercase">
                                My Workspace
                            </h1>
                            <p className="font-medium text-zinc-500">
                                Track your active projects and manage your
                                deliveries.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:text-white">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-cyan-500" />
                            </button>
                            <button className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-black transition-colors hover:bg-cyan-400">
                                <Zap className="h-4 w-4 fill-current" /> New
                                Project
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr]">
                        {/* Sidebar Navigation */}
                        <aside className="space-y-2">
                            {[
                                {
                                    id: 'dashboard',
                                    label: 'Dashboard',
                                    icon: LayoutDashboard,
                                },
                                {
                                    id: 'orders',
                                    label: 'My Orders',
                                    icon: Package,
                                },
                                {
                                    id: 'messages',
                                    label: 'Messages',
                                    icon: MessageSquare,
                                },
                                {
                                    id: 'billing',
                                    label: 'Payments',
                                    icon: CreditCard,
                                },
                                {
                                    id: 'settings',
                                    label: 'Settings',
                                    icon: Settings,
                                },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    className={`flex w-full items-center gap-4 rounded-2xl px-6 py-4 font-bold transition-all ${item.id === 'orders' ? 'border border-white/10 bg-white/5 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </button>
                            ))}
                        </aside>

                        {/* Main Content Area */}
                        <main className="space-y-8">
                            {/* Stats Summary */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {[
                                    {
                                        label: 'Active Orders',
                                        value: '02',
                                        icon: Package,
                                        color: 'text-cyan-400',
                                    },
                                    {
                                        label: 'Awaiting Review',
                                        value: '01',
                                        icon: Clock,
                                        color: 'text-amber-400',
                                    },
                                    {
                                        label: 'Total Invested',
                                        value: '4,300 BDT',
                                        icon: CreditCard,
                                        color: 'text-violet-400',
                                    },
                                ].map((stat, i) => (
                                    <div
                                        key={i}
                                        className="glass-panel rounded-[2rem] border border-white/5 bg-zinc-900/40 p-6"
                                    >
                                        <div className="mb-4 flex items-center justify-between">
                                            <div
                                                className={`rounded-xl bg-white/5 p-3 ${stat.color}`}
                                            >
                                                <stat.icon className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-black tracking-widest text-zinc-600 uppercase">
                                                Lifetime
                                            </span>
                                        </div>
                                        <p className="mb-1 text-sm font-medium text-zinc-500">
                                            {stat.label}
                                        </p>
                                        <h3 className="text-2xl font-black text-white">
                                            {stat.value}
                                        </h3>
                                    </div>
                                ))}
                            </div>

                            {/* Orders Table-like View */}
                            <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/20">
                                <div className="flex items-center justify-between border-b border-white/5 p-8">
                                    <div className="flex rounded-xl bg-black/40 p-1">
                                        <button
                                            onClick={() =>
                                                setActiveTab('active')
                                            }
                                            className={`rounded-lg px-6 py-2 text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            Active
                                        </button>
                                        <button
                                            onClick={() =>
                                                setActiveTab('completed')
                                            }
                                            className={`rounded-lg px-6 py-2 text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            Completed
                                        </button>
                                    </div>
                                    <div className="relative hidden md:block">
                                        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                        <input
                                            type="text"
                                            placeholder="Search orders..."
                                            className="w-64 rounded-xl border border-white/5 bg-black/40 py-2 pr-4 pl-12 text-sm text-white transition-all focus:border-cyan-500/50 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-0">
                                    {filteredOrders.length > 0 ? (
                                        <div className="divide-y divide-white/5">
                                            {filteredOrders.map((order) => (
                                                <div
                                                    key={order.id}
                                                    className="group p-8 transition-colors hover:bg-white/[0.02]"
                                                >
                                                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                                                        <div className="flex gap-6">
                                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                                                                <Briefcase className="h-6 w-6 text-zinc-500 transition-colors group-hover:text-cyan-400" />
                                                            </div>
                                                            <div>
                                                                <div className="mb-1 flex items-center gap-3">
                                                                    <h4 className="text-lg font-bold text-white">
                                                                        {
                                                                            order.service
                                                                        }
                                                                    </h4>
                                                                    <span
                                                                        className={`rounded-md px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                                                                            order.status ===
                                                                            'Review Required'
                                                                                ? 'bg-amber-500/20 text-amber-500'
                                                                                : order.status ===
                                                                                    'In Progress'
                                                                                  ? 'bg-cyan-500/20 text-cyan-500'
                                                                                  : 'bg-zinc-800 text-zinc-500'
                                                                        }`}
                                                                    >
                                                                        {
                                                                            order.status
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
                                                                    ID:{' '}
                                                                    {order.id} •{' '}
                                                                    {
                                                                        order.category
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-8 md:gap-12">
                                                            <div>
                                                                <p className="mb-1 text-[10px] font-black tracking-widest text-zinc-600 uppercase">
                                                                    Price
                                                                </p>
                                                                <p className="font-bold text-white">
                                                                    {
                                                                        order.price
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="mb-1 text-[10px] font-black tracking-widest text-zinc-600 uppercase">
                                                                    Deadline
                                                                </p>
                                                                <p className="font-bold text-white">
                                                                    {
                                                                        order.deadline
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div className="w-32">
                                                                <div className="mb-1.5 flex items-center justify-between">
                                                                    <p className="text-[10px] font-black tracking-widest text-zinc-600 uppercase">
                                                                        Progress
                                                                    </p>
                                                                    <span className="text-[10px] font-bold text-white">
                                                                        {
                                                                            order.progress
                                                                        }
                                                                        %
                                                                    </span>
                                                                </div>
                                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                                                    <motion.div
                                                                        initial={{
                                                                            width: 0,
                                                                        }}
                                                                        animate={{
                                                                            width: `${order.progress}%`,
                                                                        }}
                                                                        className={`h-full ${order.status === 'Review Required' ? 'bg-amber-500' : 'bg-cyan-500'}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {order.status ===
                                                                'Review Required' ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedOrderForReview(
                                                                                order,
                                                                            );
                                                                            setIsReviewModalOpen(
                                                                                true,
                                                                            );
                                                                        }}
                                                                        className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-amber-400"
                                                                    >
                                                                        Review
                                                                        Now{' '}
                                                                        <ArrowRight className="h-4 w-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-zinc-500 transition-all hover:border-white/30 hover:text-white">
                                                                        <ChevronRight className="h-5 w-5" />
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
                                            <Package className="mx-auto mb-6 h-12 w-12 text-zinc-800" />
                                            <h3 className="text-xl font-bold tracking-widest text-zinc-600 uppercase">
                                                No orders found
                                            </h3>
                                            <p className="mt-2 text-zinc-700">
                                                Try switching tabs or start a
                                                new project.
                                            </p>
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
                            className="glass-panel relative w-full max-w-2xl overflow-hidden rounded-[3rem] border border-white/10 bg-zinc-900 p-8 md:p-12"
                        >
                            <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

                            <div className="mb-8">
                                <h3 className="mb-2 text-3xl font-black tracking-tighter text-white uppercase">
                                    Submit Your Review
                                </h3>
                                <p className="text-zinc-500">
                                    How was your experience with{' '}
                                    <span className="font-bold text-white">
                                        {selectedOrderForReview?.service}
                                    </span>
                                    ?
                                </p>
                            </div>

                            <div className="space-y-8">
                                {/* Rating Logic Demo */}
                                <div className="flex flex-col items-center rounded-3xl border border-white/5 bg-white/5 py-6">
                                    <p className="mb-6 text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                                        Your Rating
                                    </p>
                                    <div className="flex gap-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onMouseEnter={() =>
                                                    setHoverRating(star)
                                                }
                                                onMouseLeave={() =>
                                                    setHoverRating(0)
                                                }
                                                onClick={() => setRating(star)}
                                                className="transition-transform hover:scale-125"
                                            >
                                                <Star
                                                    className={`h-12 w-12 transition-colors ${
                                                        (hoverRating ||
                                                            rating) >= star
                                                            ? 'fill-current text-amber-400'
                                                            : 'text-zinc-700'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-6 h-4 text-sm font-bold tracking-widest text-amber-500 uppercase">
                                        {rating === 5
                                            ? 'Exceptional!'
                                            : rating === 4
                                              ? 'Great Work'
                                              : rating === 3
                                                ? 'Good'
                                                : rating === 2
                                                  ? 'Needs Improvement'
                                                  : rating === 1
                                                    ? 'Poor'
                                                    : ''}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <p className="px-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                                        Detailed Feedback
                                    </p>
                                    <textarea
                                        placeholder="Tell us about the quality, communication, and speed..."
                                        className="h-40 w-full resize-none rounded-[2rem] border border-white/10 bg-black/40 p-6 text-white transition-all placeholder:text-zinc-700 focus:border-amber-500/50 focus:outline-none"
                                    />
                                </div>

                                {/* Review System Rule Info */}
                                <div className="flex gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                                    <p className="text-xs leading-relaxed text-zinc-400">
                                        <span className="font-bold text-amber-500 uppercase">
                                            Important:
                                        </span>{' '}
                                        You have{' '}
                                        <span className="font-bold text-white underline">
                                            24 hours
                                        </span>{' '}
                                        to provide a review after delivery. Once
                                        submitted, reviews{' '}
                                        <span className="font-bold text-white">
                                            cannot be edited
                                        </span>
                                        .
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <button
                                        onClick={() =>
                                            setIsReviewModalOpen(false)
                                        }
                                        className="flex-1 rounded-2xl bg-white/5 px-8 py-5 font-bold text-white transition-colors hover:bg-white/10"
                                    >
                                        Skip for now
                                    </button>
                                    <button
                                        onClick={() => {
                                            alert(
                                                'Demo: Review Submitted Successfully! (This review is now locked)',
                                            );
                                            setIsReviewModalOpen(false);
                                        }}
                                        className="flex-[2] rounded-2xl bg-amber-500 px-8 py-5 font-black tracking-widest text-black uppercase shadow-xl transition-all hover:bg-amber-400"
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
