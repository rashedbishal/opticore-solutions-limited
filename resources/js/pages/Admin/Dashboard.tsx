import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    FileText,
    FileUser,
    Image,
    Loader2,
    Radio,
} from 'lucide-react';
import RealtimeTableListener from '@/components/Admin/RealtimeTableListener';
import AdminLayout from '@/components/Layout/AdminLayout';
import useEchoReady from '@/hooks/useEchoReady';

interface DashboardProps {
    stats: {
        portfolios: number;
        blogs: number;
        job_applications: number;
    };
    workflow: {
        pending: number;
        processing: number;
        deliveredThisMonth: number;
    };
}

export default function Dashboard({ stats, workflow }: DashboardProps) {
    const echoReady = useEchoReady();

    const cards = [
        {
            name: 'Portfolios',
            count: stats.portfolios,
            icon: Image,
            href: '/admin/portfolios',
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/10',
            glow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]',
        },
        {
            name: 'Blogs',
            count: stats.blogs,
            icon: FileText,
            href: '/admin/blogs',
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            glow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]',
        },
        {
            name: 'Job Applications',
            count: stats.job_applications,
            icon: FileUser,
            href: '/admin/job-applications',
            color: 'text-violet-400',
            bg: 'bg-violet-400/10',
            glow: 'hover:shadow-[0_0_30px_rgba(167,139,250,0.15)]',
        },
    ];

    const workflowCards = [
        {
            name: 'Pending',
            count: workflow.pending,
            subtitle: 'Awaiting Action',
            icon: Clock,
            spin: false,
            color: 'text-amber-400',
            subtitleColor: 'text-amber-400/50',
            bg: 'bg-amber-400/10',
            border: 'border-amber-500/15',
            hoverBorder: 'hover:border-amber-500/30',
            glow: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]',
            accent: 'via-amber-500/40',
            dot: 'bg-amber-400',
            dotShadow: '0 0 8px rgba(251,191,36,0.8)',
        },
        {
            name: 'Processing',
            count: workflow.processing,
            subtitle: 'In Progress',
            icon: Loader2,
            spin: true,
            color: 'text-cyan-400',
            subtitleColor: 'text-cyan-400/50',
            bg: 'bg-cyan-400/10',
            border: 'border-cyan-500/15',
            hoverBorder: 'hover:border-cyan-500/30',
            glow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]',
            accent: 'via-cyan-500/40',
            dot: 'bg-cyan-400',
            dotShadow: '0 0 8px rgba(34,211,238,0.8)',
        },
        {
            name: 'Delivered This Month',
            count: workflow.deliveredThisMonth,
            subtitle: 'Tasks Completed',
            icon: CheckCircle2,
            spin: false,
            color: 'text-emerald-400',
            subtitleColor: 'text-emerald-400/50',
            bg: 'bg-emerald-400/10',
            border: 'border-emerald-500/15',
            hoverBorder: 'hover:border-emerald-500/30',
            glow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]',
            accent: 'via-emerald-500/40',
            dot: 'bg-emerald-400',
            dotShadow: '0 0 8px rgba(52,211,153,0.8)',
        },
    ];

    return (
        <div className="space-y-8">
            {echoReady && (
                <>
                    <RealtimeTableListener
                        channel="admin.tasks"
                        event="TaskCreated"
                        only={['workflow']}
                    />
                    <RealtimeTableListener
                        channel="admin.tasks"
                        event="TaskUpdated"
                        only={['workflow']}
                    />
                </>
            )}

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.name}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            duration: 0.4,
                            delay: index * 0.1,
                            ease: 'easeOut',
                        }}
                        className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-6 backdrop-blur-sm transition-all hover:border-violet-500/30 ${card.glow}`}
                    >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

                        <div
                            className={`absolute -top-8 -right-8 h-32 w-32 rounded-full ${card.bg} pointer-events-none opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
                        ></div>

                        <div className="relative z-10 mb-4 flex items-start justify-between">
                            <div
                                className={`rounded-2xl p-3 ${card.bg} border border-white/5 shadow-inner`}
                            >
                                <card.icon
                                    className={`h-6 w-6 ${card.color}`}
                                />
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-sm font-medium tracking-wide text-zinc-400">
                                {card.name}
                            </h3>
                            <div className="mt-1 flex items-baseline gap-2">
                                <p className="text-4xl font-bold tracking-tight text-white">
                                    {card.count}
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 mt-6 flex items-center justify-between border-t border-violet-500/10 pt-5">
                            <Link
                                href={card.href}
                                className="group/link flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/60 transition-colors hover:text-cyan-300"
                            >
                                View Details
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Client Workflow ── */}
            <div>
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold tracking-wide text-white">
                            Client Workflow
                        </h2>
                        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-emerald-400/60 uppercase">
                            <Radio className="h-3 w-3 animate-pulse" />
                            Live
                        </span>
                    </div>
                    <Link
                        href="/admin/tasks"
                        className="group/link flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/60 transition-colors hover:text-cyan-300"
                    >
                        View Tasks
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {workflowCards.map((card, index) => (
                        <motion.div
                            key={card.name}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                                duration: 0.4,
                                delay: 0.3 + index * 0.1,
                                ease: 'easeOut',
                            }}
                            className={`group relative flex flex-col overflow-hidden rounded-xl border ${card.border} bg-[#060c1a]/80 p-6 backdrop-blur-sm transition-all ${card.hoverBorder} ${card.glow}`}
                        >
                            <div
                                className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${card.accent} to-transparent`}
                            />
                            <div
                                className={`pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full ${card.bg} opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
                            ></div>

                            <div className="relative z-10 mb-4 flex items-start justify-between">
                                <div
                                    className={`rounded-2xl border border-white/5 ${card.bg} p-3 shadow-inner`}
                                >
                                    <card.icon
                                        className={`h-6 w-6 ${card.color} ${card.spin ? 'animate-spin' : ''}`}
                                    />
                                </div>
                                <motion.span
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{
                                        duration: 1.8,
                                        repeat: Infinity,
                                    }}
                                    className={`h-2 w-2 rounded-full ${card.dot}`}
                                    style={{ boxShadow: card.dotShadow }}
                                />
                            </div>

                            <div className="relative z-10 flex-1">
                                <h3 className="text-sm font-medium tracking-wide text-zinc-400">
                                    {card.name}
                                </h3>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <p className="text-5xl font-bold tracking-tight text-white">
                                        {card.count}
                                    </p>
                                </div>
                                <p
                                    className={`mt-2 font-mono text-[10px] tracking-[0.15em] uppercase ${card.subtitleColor}`}
                                >
                                    {card.subtitle}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

Dashboard.layout = (page: ReactNode) => (
    <AdminLayout title="Dashboard Overview">{page}</AdminLayout>
);
