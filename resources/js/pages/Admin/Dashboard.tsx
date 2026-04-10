import AdminLayout from '@/components/Layout/AdminLayout';
import { motion } from 'framer-motion';
import { Image, FileText, MessageSquare, Mail, Users, ArrowRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface DashboardProps {
    stats: {
        portfolios: number;
        blogs: number;
        chat_sessions: number;
        contacts: number;
        users: number;
    };
}

export default function Dashboard({ stats }: DashboardProps) {
    const cards = [
        { name: 'Portfolios', count: stats.portfolios, icon: Image, href: '/admin/portfolios', color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { name: 'Blogs', count: stats.blogs, icon: FileText, href: '/admin/blogs', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { name: 'Chat Sessions', count: stats.chat_sessions, icon: MessageSquare, href: '/admin/chats', color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { name: 'Contacts', count: stats.contacts, icon: Mail, href: '/admin/contacts', color: 'text-rose-400', bg: 'bg-rose-400/10' },
        { name: 'Users', count: stats.users, icon: Users, href: '/admin/users', color: 'text-violet-400', bg: 'bg-violet-400/10' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <p className="text-zinc-400 text-sm mb-1 mt-2">Welcome back to</p>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Opticore CMS Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 flex flex-col justify-between"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`rounded-xl p-3 ${card.bg}`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-400">{card.name}</p>
                                <p className="text-3xl font-bold text-white">{card.count}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <Link href={card.href} className="text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 group">
                                Manage {card.name}
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

Dashboard.layout = (page: ReactNode) => <AdminLayout title="Dashboard">{page}</AdminLayout>;
