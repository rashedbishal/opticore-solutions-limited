import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';
import { Link, useForm } from '@inertiajs/react';
import { MessageSquare, Trash2, Calendar, User, Bot, Mail, Sparkles, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Mail className="w-6 h-6 text-indigo-400" /> Inbox Archive
                    </h1>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a2333] text-indigo-300 rounded-full border border-indigo-500/20 text-xs font-medium backdrop-blur-md">
                    <Sparkles className="w-4 h-4" />
                    <span>{sessions.data.length} threads</span>
                </div>
            </div>

            <div className="bg-[#0f1523]/90 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
                <div className="divide-y divide-white/5">
                    <AnimatePresence initial={false}>
                        {sessions.data.map((session) => {
                            const isExpanded = expandedId === session.id;
                            
                            return (
                                <motion.div 
                                    layout
                                    key={session.id} 
                                    className={`group transition-colors duration-200 ${
                                        isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
                                    }`}
                                >
                                    {/* Email Row */}
                                    <div 
                                        className="px-6 py-4 cursor-pointer flex items-center gap-4"
                                        onClick={() => toggleExpand(session.id)}
                                    >
                                        <div className="flex-none flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isExpanded ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-transparent group-hover:bg-indigo-500/30'}`} />
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-300 shadow-inner">
                                                <User className="w-5 h-5" />
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 grid sm:grid-cols-[200px_1fr_auto] gap-4 items-center">
                                            <div className={`font-semibold truncate text-[15px] transition-colors ${isExpanded ? 'text-indigo-300' : 'text-white'}`}>
                                                {session.title || `Session ${session.session_id.substring(0, 8)}`}
                                            </div>
                                            
                                            <div className="text-sm text-slate-400 truncate pr-4 hidden sm:block">
                                                <span className="font-medium text-slate-300 mr-2 border border-white/10 px-2 py-0.5 rounded text-[11px] bg-black/40 uppercase tracking-wider">
                                                    {session.messages_count} msgs
                                                </span>
                                                {session.messages?.[session.messages.length - 1]?.content || 'View conversation history...'}
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium whitespace-nowrap justify-end">
                                                <span>{new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => handleDelete(session.id, e)}
                                                        className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Delete Thread"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-400' : 'text-slate-600'}`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Email Body */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-6 pt-2 ml-16 mr-6 border-t border-white/5">
                                                    <div className="bg-[#080b12]/80 backdrop-blur-md rounded-[20px] border border-white/5 p-8 shadow-inner">
                                                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                                                            <h3 className="text-xl font-bold text-white tracking-tight">
                                                                {session.title || `Chat Session ${session.session_id.substring(0, 8)}`}
                                                            </h3>
                                                            <span className="text-sm font-medium text-slate-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                                {new Date(session.created_at).toLocaleString()}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-10 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                                                            {session.messages?.map((msg, idx) => (
                                                                <div key={msg.id} className="flex gap-5 group/msg">
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                                                                        {msg.sender === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                                                                    </div>
                                                                    <div className="flex-1 mt-1">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <span className="font-bold text-[15px] text-white tracking-tight">
                                                                                {msg.sender === 'user' ? 'Guest User' : 'Opticore AI Assistant'}
                                                                            </span>
                                                                            <span className="text-xs font-medium text-slate-500">
                                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                                            {msg.content}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {(!session.messages || session.messages.length === 0) && (
                                                                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5 text-slate-500">
                                                                    No messages found in this thread.
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
                            <Mail className="w-16 h-16 text-slate-700/50 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-white mb-2">Inbox Empty</h3>
                            <p className="text-slate-500 text-sm">No chat threads available. They will appear here when users chat.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

ChatIndex.layout = (page: ReactNode) => <AdminLayout title="Inbox Archieve">{page}</AdminLayout>;
