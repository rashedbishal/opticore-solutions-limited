"use client"

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hi! I\'m your Opticore assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ message: userMessage }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
                        className="mb-6 w-[92vw] sm:w-[420px] h-[600px] bg-zinc-950/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col ring-1 ring-white/5"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-violet-500/40 blur-xl rounded-full animate-pulse" />
                                    <div className="relative p-2.5 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-400/20 rounded-2xl">
                                        <Bot className="h-5 w-5 text-violet-400" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-zinc-950 border-2 border-zinc-900 flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-tight">Opticore Intelligence</h3>
                                    <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Always active</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2.5 hover:bg-white/5 rounded-xl transition-all duration-300 text-zinc-500 hover:text-white group"
                            >
                                <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none"
                        >
                            {messages.map((msg, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx}
                                    className={cn(
                                        "flex gap-4 max-w-[88%]",
                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className={cn(
                                        "h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500",
                                        msg.role === 'assistant' 
                                            ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border-violet-400/20 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]" 
                                            : "bg-white/5 border-white/10 text-zinc-400"
                                    )}>
                                        {msg.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-[1.5rem] text-[13px] leading-relaxed shadow-sm",
                                        msg.role === 'assistant' 
                                            ? "bg-white/[0.03] text-zinc-300 rounded-tl-none border border-white/5 backdrop-blur-md" 
                                            : "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-tr-none shadow-lg shadow-violet-600/20"
                                    )}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-4 max-w-[85%]">
                                    <div className="h-9 w-9 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center animate-pulse">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <div className="bg-white/5 text-zinc-300 p-4 rounded-[1.5rem] rounded-tl-none border border-white/5">
                                        <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative flex items-center"
                            >
                                <input 
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask me anything..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/40 focus:ring-4 focus:ring-violet-500/5 transition-all duration-300 backdrop-blur-md"
                                />
                                <button 
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:hover:bg-violet-600 rounded-xl transition-all duration-300 text-white shadow-xl shadow-violet-600/20 group"
                                >
                                    <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            </form>
                            <p className="mt-3 text-[10px] text-center text-zinc-600 font-medium tracking-wide">
                                Powered by Opticore Intelligence v2.0
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-violet-500/50 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                        "relative h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 border shadow-2xl overflow-hidden",
                        isOpen 
                            ? "bg-zinc-900 border-white/10 text-white" 
                            : "bg-gradient-to-br from-violet-600 to-fuchsia-600 border-violet-400/30 text-white shadow-violet-600/40"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ opacity: 0, rotate: -90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <X className="h-7 w-7" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="open"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.5 }}
                                className="relative flex items-center justify-center"
                            >
                                <div className="absolute inset-0 bg-white/20 blur-md rounded-full animate-pulse" />
                                <Bot className="h-8 w-8 relative z-10" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );
}
