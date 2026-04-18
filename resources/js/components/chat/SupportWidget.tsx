import type { SharedPageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Paperclip, Send, X, FileText, Image as ImageIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useEcho } from '@laravel/echo-react';

interface Message {
    id: number;
    sender_type: 'user' | 'admin';
    message: string | null;
    attachment_path: string | null;
    attachment_type: string | null;
    created_at: string;
}

interface Conversation {
    id: number;
    user_id: number;
}

export default function SupportWidget() {
    const { auth } = usePage<SharedPageProps>().props;
    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [unread, setUnread] = useState(0);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize Conversation
    useEffect(() => {
        if (auth.user) {
            axios.post('/user-chat/init').then((res) => {
                setConversation(res.data.conversation);
            }).catch(e => console.error('Failed to init chat', e));
        }
    }, [auth.user]);

    // Fetch Messages
    useEffect(() => {
        if (isOpen && conversation) {
            axios.get(`/user-chat/${conversation.id}/messages`).then((res) => {
                setMessages(res.data.data.reverse());
                scrollToBottom();
                
                if (unread > 0) {
                    axios.post(`/user-chat/${conversation.id}/read`);
                    setUnread(0);
                }
            });
        }
    }, [isOpen, conversation]);

    // Echo listener
    useEcho(
        conversation ? `conversations.${conversation.id}` : '',
        'MessageSent',
        (e: any) => {
            const incoming = e.message;
            setMessages((prev) => [...prev, incoming]);
            if (!isOpen && incoming.sender_type === 'admin') {
                setUnread(u => u + 1);
            } else if (isOpen && incoming.sender_type === 'admin' && conversation) {
                axios.post(`/user-chat/${conversation.id}/read`);
            }
            scrollToBottom();
        }
    );

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !conversation || isSending) return;

        const formData = new FormData();
        if (newMessage.trim()) formData.append('message', newMessage);
        if (attachment) formData.append('attachment', attachment);

        setIsSending(true);
        try {
            const res = await axios.post(`/user-chat/${conversation.id}/message`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
            setAttachment(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            scrollToBottom();
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setIsSending(false);
        }
    };

    if (!auth.user) return null;

    return (
        <div className="fixed bottom-6 left-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 left-0 mb-4 flex h-[500px] w-80 flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10 sm:w-96"
                    >
                        <div className="flex items-center justify-between bg-violet-600 px-4 py-3 text-white">
                            <div>
                                <h3 className="font-semibold">Customer Support</h3>
                                <p className="text-xs text-violet-200">We typically reply in a few minutes</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-white/20">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                                        msg.sender_type === 'user' ? 'bg-violet-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'
                                    }`}>
                                        {msg.attachment_path && (
                                            <a href={`/chat/attachments/${msg.id}/download`} target="_blank" rel="noreferrer" className="flex items-center space-x-2 rounded bg-black/20 p-2 mb-1 hover:bg-black/30">
                                                {msg.attachment_type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
                                                <span className="truncate">View Attachment</span>
                                            </a>
                                        )}
                                        {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        
                        <div className="border-t border-slate-800 bg-slate-900 px-4 py-3">
                            <form onSubmit={handleSend} className="flex flex-col gap-2">
                                {attachment && (
                                    <div className="flex items-center justify-between bg-slate-800 p-2 rounded text-xs text-slate-300">
                                        <span className="truncate">{attachment.name}</span>
                                        <button type="button" onClick={() => setAttachment(null)}><X size={14} /></button>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-violet-400">
                                        <Paperclip size={20} />
                                    </button>
                                    <input 
                                        type="text" 
                                        value={newMessage} 
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type a message..." 
                                        className="flex-1 bg-slate-800 border-none rounded-full px-4 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500" 
                                    />
                                    <button type="submit" disabled={isSending} className="rounded-full bg-violet-600 p-2 text-white hover:bg-violet-500 disabled:opacity-50">
                                        <Send size={18} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-110"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
                {unread > 0 && !isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold ring-2 ring-slate-900">
                        {unread}
                    </span>
                )}
            </button>
        </div>
    );
}
