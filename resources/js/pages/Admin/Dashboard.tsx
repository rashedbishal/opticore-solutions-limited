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
            name: 'Chat Sessions', 
            count: stats.chat_sessions, 
            icon: MessageSquare, 
            href: '/admin/chats', 
            color: 'text-blue-400', 
            bg: 'bg-blue-400/10',
            glow: 'hover:shadow-[0_0_30px_rgba(96,165,250,0.15)]',
        },
        { 
            name: 'Contacts', 
            count: stats.contacts, 
            icon: Mail, 
            href: '/admin/contacts', 
            color: 'text-rose-400', 
            bg: 'bg-rose-400/10',
            glow: 'hover:shadow-[0_0_30px_rgba(251,113,133,0.15)]',
        },
        { 
            name: 'Users', 
            count: stats.users, 
            icon: Users, 
            href: '/admin/users', 
            color: 'text-indigo-400', 
            bg: 'bg-indigo-400/10',
            glow: 'hover:shadow-[0_0_30px_rgba(129,140,248,0.15)]',
        },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.name}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
                        className={`relative overflow-hidden rounded-[24px] border border-white/5 bg-white/5 p-6 backdrop-blur-xl flex flex-col justify-between group hover:border-white/10 hover:bg-white/10 transition-all duration-300 ${card.glow}`}
                    >
                        <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${card.bg} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

                        <div className="relative z-10 flex items-start justify-between mb-4">
                            <div className={`rounded-2xl p-3 ${card.bg} border border-white/5 shadow-inner`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className="text-sm font-medium text-slate-400 tracking-wide">{card.name}</h3>
                            <div className="mt-1 flex items-baseline gap-2">
                                <p className="text-4xl font-bold text-white tracking-tight">{card.count}</p>
                            </div>
                        </div>
                        
                        <div className="relative z-10 mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                            <Link 
                                href={card.href} 
                                className="text-sm text-slate-400 hover:text-cyan-400 font-medium flex items-center gap-1.5 transition-colors group/link"
                            >
                                View Details
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

Dashboard.layout = (page: ReactNode) => <AdminLayout title="Dashboard Overview">{page}</AdminLayout>;
