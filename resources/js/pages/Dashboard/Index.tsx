import type { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Clock,
    AlertCircle,
    Star,
    MessageSquare,
    ChevronRight,
    Bell,
    Settings,
    LayoutDashboard,
    Briefcase,
    CreditCard,
    Zap,
    ArrowRight,
    CheckCircle,
} from 'lucide-react';
import { useState } from 'react';

interface SubCategory {
    id: number;
    name: string;
    slug: string;
}

interface Task {
    id: number;
    task_name: string;
    category: string;
    sub_category: SubCategory | null;
    date: string | null;
    state: 'pending' | 'in progress' | 'delivered';
    can_review: boolean;
    has_review: boolean;
    review_eligible_until: string | null;
    service_url: string | null;
}

interface Props {
    tasks: Task[];
}

const STATE_LABELS: Record<string, string> = {
    pending: 'Pending',
    'in progress': 'In Progress',
    delivered: 'Delivered',
};

function stateClass(task: Task): string {
    if (task.state === 'delivered' && task.can_review) {
        return 'bg-amber-500/20 text-amber-500';
    }

    if (task.state === 'in progress') {
        return 'bg-cyan-500/20 text-cyan-500';
    }

    if (task.state === 'delivered') {
        return 'bg-zinc-800 text-zinc-400';
    }

    return 'bg-zinc-800 text-zinc-500';
}

function stateLabel(task: Task): string {
    if (task.state === 'delivered' && task.can_review) {
        return 'Review Required';
    }

    return STATE_LABELS[task.state] ?? task.state;
}

export default function UserDashboard({ tasks }: Props) {
    const [activeTab, setActiveTab] = useState('active');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [hoverRating, setHoverRating] = useState(0);

    const { data, setData, post, processing, errors, reset } = useForm({
        task_id: 0,
        rating: 0,
        comment: '',
        price_range: '',
        work_duration: '',
    });

    const openReview = (task: Task) => {
        setSelectedTask(task);
        reset();
        setData('task_id', task.id);
        setIsReviewModalOpen(true);
    };

    const closeReview = () => {
        setIsReviewModalOpen(false);
        setSelectedTask(null);
        setHoverRating(0);
    };

    const submitReview: FormEventHandler = (e) => {
        e.preventDefault();
        post('/reviews', {
            onSuccess: () => {
                closeReview();
            },
        });
    };

    const filteredTasks = tasks.filter((t) => {
        if (activeTab === 'active') {
            return (
                t.state === 'pending' ||
                t.state === 'in progress' ||
                (t.state === 'delivered' && t.can_review)
            );
        }

        if (activeTab === 'completed') {
            return t.state === 'delivered' && !t.can_review;
        }

        return true;
    });

    const activeCount = tasks.filter(
        (t) =>
            t.state === 'pending' ||
            t.state === 'in progress' ||
            (t.state === 'delivered' && t.can_review),
    ).length;
    const reviewCount = tasks.filter((t) => t.can_review).length;

    return (
        <>
            <Head title="Client Dashboard | Opticore Solutions Ltd." />

            <div className="min-h-screen bg-black px-4 pt-32 pb-24">
                <div className="mx-auto max-w-7xl">
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
                                {reviewCount > 0 && (
                                    <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-amber-500" />
                                )}
                            </button>
                            <Link
                                href="/hire-us"
                                className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-black transition-colors hover:bg-cyan-400"
                            >
                                <Zap className="h-4 w-4 fill-current" /> New
                                Project
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr]">
                        <aside className="space-y-2">
                            {[
                                {
                                    id: 'dashboard',
                                    label: 'Dashboard',
                                    icon: LayoutDashboard,
                                    href: '/dashboard',
                                },
                                {
                                    id: 'messages',
                                    label: 'Messages',
                                    icon: MessageSquare,
                                    href: '#chat',
                                },
                                {
                                    id: 'settings',
                                    label: 'Settings',
                                    icon: Settings,
                                    href: '/profile',
                                },
                            ].map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`flex w-full items-center gap-4 rounded-2xl px-6 py-4 font-bold transition-all ${item.id === 'dashboard' ? 'border border-white/10 bg-white/5 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            ))}
                        </aside>

                        <main className="space-y-8">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {[
                                    {
                                        label: 'Active Orders',
                                        value: activeCount.toString(),
                                        icon: Package,
                                        color: 'text-cyan-400',
                                    },
                                    {
                                        label: 'Awaiting Review',
                                        value: reviewCount.toString(),
                                        icon: Clock,
                                        color: 'text-amber-400',
                                    },
                                    {
                                        label: 'Total Tasks',
                                        value: tasks.length.toString(),
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
                                        <button
                                            onClick={() => setActiveTab('all')}
                                            className={`rounded-lg px-6 py-2 text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            All
                                        </button>
                                    </div>
                                </div>

                                <div className="p-0">
                                    {filteredTasks.length > 0 ? (
                                        <div className="divide-y divide-white/5">
                                            {filteredTasks.map((task) => (
                                                <div
                                                    key={task.id}
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
                                                                            task.task_name
                                                                        }
                                                                    </h4>
                                                                    <span
                                                                        className={`rounded-md px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${stateClass(task)}`}
                                                                    >
                                                                        {stateLabel(
                                                                            task,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
                                                                    {task.sub_category
                                                                        ? task
                                                                              .sub_category
                                                                              .name
                                                                        : task.category}{' '}
                                                                    {task.date &&
                                                                        `• ${task.date}`}
                                                                </p>
                                                                {task.has_review && (
                                                                    <p className="mt-1 flex items-center gap-1 text-xs text-green-500">
                                                                        <CheckCircle className="h-3 w-3" />
                                                                        Review
                                                                        submitted
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-8 md:gap-12">
                                                            {task.service_url && (
                                                                <Link
                                                                    href={
                                                                        task.service_url
                                                                    }
                                                                    className="text-xs text-zinc-500 underline hover:text-cyan-400"
                                                                >
                                                                    View Service
                                                                </Link>
                                                            )}
                                                            <div className="flex items-center gap-3">
                                                                {task.can_review ? (
                                                                    <button
                                                                        onClick={() =>
                                                                            openReview(
                                                                                task,
                                                                            )
                                                                        }
                                                                        className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-amber-400"
                                                                    >
                                                                        Review
                                                                        Now{' '}
                                                                        <ArrowRight className="h-4 w-4" />
                                                                    </button>
                                                                ) : (
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-zinc-500">
                                                                        <ChevronRight className="h-5 w-5" />
                                                                    </div>
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

            <AnimatePresence>
                {isReviewModalOpen && selectedTask && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeReview}
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
                                        {selectedTask.task_name}
                                    </span>
                                    ?
                                </p>
                                {selectedTask.service_url && (
                                    <Link
                                        href={selectedTask.service_url}
                                        className="mt-2 block text-sm text-cyan-400 hover:underline"
                                    >
                                        View service page →
                                    </Link>
                                )}
                            </div>

                            <form onSubmit={submitReview} className="space-y-8">
                                <div className="flex flex-col items-center rounded-3xl border border-white/5 bg-white/5 py-6">
                                    <p className="mb-6 text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                                        Your Rating
                                    </p>
                                    <div className="flex gap-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onMouseEnter={() =>
                                                    setHoverRating(star)
                                                }
                                                onMouseLeave={() =>
                                                    setHoverRating(0)
                                                }
                                                onClick={() =>
                                                    setData('rating', star)
                                                }
                                                className="transition-transform hover:scale-125"
                                            >
                                                <Star
                                                    className={`h-12 w-12 transition-colors ${
                                                        (hoverRating ||
                                                            data.rating) >= star
                                                            ? 'fill-current text-amber-400'
                                                            : 'text-zinc-700'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-6 h-4 text-sm font-bold tracking-widest text-amber-500 uppercase">
                                        {data.rating === 5
                                            ? 'Exceptional!'
                                            : data.rating === 4
                                              ? 'Great Work'
                                              : data.rating === 3
                                                ? 'Good'
                                                : data.rating === 2
                                                  ? 'Needs Improvement'
                                                  : data.rating === 1
                                                    ? 'Poor'
                                                    : ''}
                                    </p>
                                    {errors.rating && (
                                        <p className="mt-2 text-sm text-red-400">
                                            {errors.rating}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <p className="px-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                                        Detailed Feedback
                                    </p>
                                    <textarea
                                        value={data.comment}
                                        onChange={(e) =>
                                            setData('comment', e.target.value)
                                        }
                                        placeholder="Tell us about the quality, communication, and speed..."
                                        className="h-40 w-full resize-none rounded-[2rem] border border-white/10 bg-black/40 p-6 text-white transition-all placeholder:text-zinc-700 focus:border-amber-500/50 focus:outline-none"
                                        required
                                    />
                                    {errors.comment && (
                                        <p className="text-sm text-red-400">
                                            {errors.comment}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="mb-2 px-1 text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                                            Price Range{' '}
                                            <span className="text-zinc-600 normal-case">
                                                (optional)
                                            </span>
                                        </p>
                                        <input
                                            type="text"
                                            value={data.price_range}
                                            onChange={(e) =>
                                                setData(
                                                    'price_range',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. 1000–3000 BDT"
                                            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-zinc-700 focus:border-amber-500/50 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <p className="mb-2 px-1 text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                                            Work Duration{' '}
                                            <span className="text-zinc-600 normal-case">
                                                (optional)
                                            </span>
                                        </p>
                                        <input
                                            type="text"
                                            value={data.work_duration}
                                            onChange={(e) =>
                                                setData(
                                                    'work_duration',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. 3 days"
                                            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-zinc-700 focus:border-amber-500/50 focus:outline-none"
                                        />
                                    </div>
                                </div>

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
                                        type="button"
                                        onClick={closeReview}
                                        className="flex-1 rounded-2xl bg-white/5 px-8 py-5 font-bold text-white transition-colors hover:bg-white/10"
                                    >
                                        Skip for now
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={
                                            processing || data.rating === 0
                                        }
                                        className="flex-[2] rounded-2xl bg-amber-500 px-8 py-5 font-black tracking-widest text-black uppercase shadow-xl transition-all hover:bg-amber-400 disabled:opacity-50"
                                    >
                                        {processing
                                            ? 'Submitting...'
                                            : 'Submit Review'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
