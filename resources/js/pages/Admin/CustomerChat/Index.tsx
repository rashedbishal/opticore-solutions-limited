import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEcho } from '@laravel/echo-react';
import { MessageSquare, Search, Send, Paperclip, FileText, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Conversation {
    id: number;
    user_id: number;
    user: User;
    last_message: string | null;
    last_message_at: string | null;
    unread_count: number;
}

interface Message {
    id: number;
    sender_type: 'user' | 'admin';
    message: string | null;
    attachment_path: string | null;
    attachment_type: string | null;
    created_at: string;
}

export default function Index() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch initial conversations list
    useEffect(() => {
        axios.get('/admin/api/customer-conversations').then(res => {
            setConversations(res.data.data);
        });
    }, []);

    // Fetch messages for active conversation
    useEffect(() => {
        if (activeConv) {
            axios.get(`/admin/api/customer-conversations/${activeConv.id}/messages`).then(res => {
                setMessages(res.data.data.reverse());
                scrollToBottom();

                if (activeConv.unread_count > 0) {
                    axios.post(`/admin/api/customer-conversations/${activeConv.id}/read`);
                    setConversations(prev => 
                        prev.map(c => c.id === activeConv.id ? { ...c, unread_count: 0 } : c)
                    );
                }
            });
        }
    }, [activeConv]);

    // Admin Echo listener for all conversations
    useEcho(
        'admin.conversations',
        'MessageSent',
        (e: any) => {
            const incoming = e.message;
            if (activeConv && activeConv.id === incoming.conversation_id) {
                setMessages(prev => [...prev, incoming]);
                scrollToBottom();
                if (incoming.sender_type === 'user') {
                    axios.post(`/admin/api/customer-conversations/${activeConv.id}/read`);
                }
            } else {
                if (incoming.sender_type === 'user') {
                    setConversations(prev => 
                        prev.map(c => c.id === incoming.conversation_id ? { 
                            ...c, 
                            unread_count: c.unread_count + 1,
                            last_message: incoming.attachment_path ? 'Sent an attachment' : incoming.message,
                            last_message_at: incoming.created_at
                        } : c)
                    );
                }
            }
        }
    );

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !activeConv || isSending) return;

        const formData = new FormData();
        if (newMessage.trim()) formData.append('message', newMessage);
        if (attachment) formData.append('attachment', attachment);

        setIsSending(true);
        try {
            const res = await axios.post(`/admin/api/customer-conversations/${activeConv.id}/message`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
            setAttachment(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            setConversations(prev => 
                prev.map(c => c.id === activeConv.id ? { 
                    ...c, 
                    last_message: attachment ? 'Sent an attachment' : newMessage,
                    last_message_at: res.data.created_at
                } : c)
            );
            
            scrollToBottom();
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border border-white/5 bg-white/5 shadow-2xl backdrop-blur-xl">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-white/5 flex flex-col bg-slate-900/50">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-lg font-semibold text-white mb-4">Customer Chats</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full rounded-xl border border-white/10 bg-black/20 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {conversations.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => setActiveConv(conv)}
                            className={`w-full flex items-center p-3 rounded-xl mb-1 text-left transition-colors ${
                                activeConv?.id === conv.id ? 'bg-cyan-500/20 border border-cyan-500/30' : 'hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-slate-200 truncate">{conv.user.name}</span>
                                    {conv.last_message_at && (
                                        <span className="text-xs text-slate-500 shrink-0 ml-2">
                                            {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-slate-400 truncate pr-2">{conv.last_message || 'No messages yet'}</p>
                                    {conv.unread_count > 0 && (
                                        <span className="shrink-0 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                    {conversations.length === 0 && (
                        <div className="p-4 text-center text-sm text-slate-500">No conversations yet</div>
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col bg-slate-900/30">
                {activeConv ? (
                    <>
                        <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center">
                            <div>
                                <h3 className="font-semibold text-white">{activeConv.user.name}</h3>
                                <p className="text-xs text-slate-400">{activeConv.user.email}</p>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm shadow-sm ${
                                        msg.sender_type === 'admin' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'
                                    }`}>
                                        {msg.attachment_path && (
                                            <a href={`/chat/attachments/${msg.id}/download`} target="_blank" rel="noreferrer" className="flex items-center space-x-2 rounded bg-black/20 p-2 mb-2 hover:bg-black/40 transition">
                                                {msg.attachment_type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
                                                <span className="truncate underline outline-offset-4">Attachment</span>
                                            </a>
                                        )}
                                        {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-slate-900/50 border-t border-white/5">
                            <form onSubmit={handleSend} className="flex flex-col gap-2 relative">
                                {attachment && (
                                    <AnimatePresence>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-12 left-0 flex items-center justify-between bg-slate-800 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-slate-300 shadow-xl z-10 w-fit gap-4">
                                            <span className="truncate max-w-[200px]">{attachment.name}</span>
                                            <button type="button" onClick={() => setAttachment(null)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                                        </motion.div>
                                    </AnimatePresence>
                                )}
                                <div className="flex items-center gap-3 bg-black/20 p-1.5 rounded-full border border-white/10 focus-within:border-cyan-500/50 transition-colors">
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="ml-2 text-slate-400 hover:text-cyan-400 p-2 rounded-full hover:bg-white/5 transition">
                                        <Paperclip size={20} />
                                    </button>
                                    <input 
                                        type="text" 
                                        value={newMessage} 
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder={`Reply to ${activeConv.user.name}...`}
                                        className="flex-1 bg-transparent border-none px-2 py-2 text-sm text-white focus:ring-0 placeholder:text-slate-500" 
                                    />
                                    <button type="submit" disabled={isSending || (!newMessage.trim() && !attachment)} className="rounded-full bg-cyan-600 p-2.5 text-white hover:bg-cyan-500 disabled:opacity-50 transition transform active:scale-95">
                                        <Send size={18} className="translate-x-0.5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <MessageSquare size={48} className="mb-4 opacity-50 text-cyan-500/50" />
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}

Index.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
