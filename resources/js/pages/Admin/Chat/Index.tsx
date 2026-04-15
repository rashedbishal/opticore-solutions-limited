import type { ReactNode } from 'react';
import { useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Trash2,
    User,
    Bot,
    Mail,
    Sparkles,
    ChevronDown,
} from 'lucide-react';
import React, { useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface ChatMessage {
    id: number;
    sender: 'user' | 'ai';
    content: string;
    created_at: string;
}

interface ChatSession {
    id: number;
    session_id: string;
    title: string | null;
    messages_count: number;
    created_at: string;
    messages?: ChatMessage[];
}

interface Props {
    sessions: {
        data: ChatSession[];
        links: any[];
    };
}

export default function ChatIndex({ sessions }: Props) {
    const { delete: destroy } = useForm();
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const handleDelete = (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirm('Are you sure you want to delete this chat session?')) {
            destroy(adminRoutes.chats.destroy.url(id));
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="mb-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
                        <Mail className="h-6 w-6 text-indigo-400" /> Inbox
                        Archive
                    </h1>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-indigo-500/20 bg-[#1a2333] px-3 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur-md">
                    <Sparkles className="h-4 w-4" />
                    <span>{sessions.data.length} threads</span>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0f1523]/90 shadow-2xl backdrop-blur-2xl">
                <div className="divide-y divide-white/5">
                    <AnimatePresence initial={false}>
                        {sessions.data.map((session) => {
                            const isExpanded = expandedId === session.id;

                            return (
                                <motion.div
                                    layout
                                    key={session.id}
                                    className={`group transition-colors duration-200 ${
                                        isExpanded
                                            ? 'bg-white/[0.03]'
                                            : 'hover:bg-white/[0.02]'
                                    }`}
                                >
                                    {/* Email Row */}
                                    <div
                                        className="flex cursor-pointer items-center gap-4 px-6 py-4"
                                        onClick={() => toggleExpand(session.id)}
                                    >
                                        <div className="flex flex-none items-center gap-4">
                                            <div
                                                className={`h-2 w-2 rounded-full transition-colors duration-300 ${isExpanded ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-transparent group-hover:bg-indigo-500/30'}`}
                                            />
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-500/20 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300 shadow-inner">
                                                <User className="h-5 w-5" />
                                            </div>
                                        </div>

                                        <div className="grid min-w-0 flex-1 items-center gap-4 sm:grid-cols-[200px_1fr_auto]">
                                            <div
                                                className={`truncate text-[15px] font-semibold transition-colors ${isExpanded ? 'text-indigo-300' : 'text-white'}`}
                                            >
                                                {session.title ||
                                                    `Session ${session.session_id.substring(0, 8)}`}
                                            </div>

                                            <div className="hidden truncate pr-4 text-sm text-slate-400 sm:block">
                                                <span className="mr-2 rounded border border-white/10 bg-black/40 px-2 py-0.5 text-[11px] font-medium tracking-wider text-slate-300 uppercase">
                                                    {session.messages_count}{' '}
                                                    msgs
                                                </span>
                                                {session.messages?.[
                                                    session.messages.length - 1
                                                ]?.content ||
                                                    'View conversation history...'}
                                            </div>

                                            <div className="flex items-center justify-end gap-4 text-xs font-medium whitespace-nowrap text-slate-500">
                                                <span>
                                                    {new Date(
                                                        session.created_at,
                                                    ).toLocaleDateString(
                                                        undefined,
                                                        {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        },
                                                    )}
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) =>
                                                            handleDelete(
                                                                session.id,
                                                                e,
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-slate-500 opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                                                        title="Delete Thread"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                    <ChevronDown
                                                        className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-400' : 'text-slate-600'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Email Body */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    height: 0,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    height: 'auto',
                                                }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{
                                                    duration: 0.3,
                                                    ease: 'easeInOut',
                                                }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mr-6 ml-16 border-t border-white/5 px-6 pt-2 pb-6">
                                                    <div className="rounded-[20px] border border-white/5 bg-[#080b12]/80 p-8 shadow-inner backdrop-blur-md">
                                                        <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-6">
                                                            <h3 className="text-xl font-bold tracking-tight text-white">
                                                                {session.title ||
                                                                    `Chat Session ${session.session_id.substring(0, 8)}`}
                                                            </h3>
                                                            <span className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-500">
                                                                {new Date(
                                                                    session.created_at,
                                                                ).toLocaleString()}
                                                            </span>
                                                        </div>

                                                        <div className="custom-scrollbar max-h-[60vh] space-y-10 overflow-y-auto pr-4">
                                                            {session.messages?.map(
                                                                (msg) => (
                                                                    <div
                                                                        key={
                                                                            msg.id
                                                                        }
                                                                        className="group/msg flex gap-5"
                                                                    >
                                                                        <div
                                                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-lg ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'}`}
                                                                        >
                                                                            {msg.sender ===
                                                                            'user' ? (
                                                                                <User className="h-5 w-5 text-white" />
                                                                            ) : (
                                                                                <Bot className="h-5 w-5 text-white" />
                                                                            )}
                                                                        </div>
                                                                        <div className="mt-1 flex-1">
                                                                            <div className="mb-2 flex items-center gap-3">
                                                                                <span className="text-[15px] font-bold tracking-tight text-white">
                                                                                    {msg.sender ===
                                                                                    'user'
                                                                                        ? 'Guest User'
                                                                                        : 'Opticore AI Assistant'}
                                                                                </span>
                                                                                <span className="text-xs font-medium text-slate-500">
                                                                                    {new Date(
                                                                                        msg.created_at,
                                                                                    ).toLocaleTimeString(
                                                                                        [],
                                                                                        {
                                                                                            hour: '2-digit',
                                                                                            minute: '2-digit',
                                                                                        },
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-slate-300">
                                                                                {
                                                                                    msg.content
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}

                                                            {(!session.messages ||
                                                                session.messages
                                                                    .length ===
                                                                    0) && (
                                                                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 py-12 text-center text-slate-500">
                                                                    No messages
                                                                    found in
                                                                    this thread.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {sessions.data.length === 0 && (
                        <div className="p-20 text-center">
                            <Mail className="mx-auto mb-6 h-16 w-16 text-slate-700/50" />
                            <h3 className="mb-2 text-xl font-bold text-white">
                                Inbox Empty
                            </h3>
                            <p className="text-sm text-slate-500">
                                No chat threads available. They will appear here
                                when users chat.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

ChatIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Inbox Archieve">{page}</AdminLayout>
);
