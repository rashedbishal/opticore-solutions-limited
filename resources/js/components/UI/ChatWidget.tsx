"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Clock, Shield, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ImmersiveChatTrigger from "./ImmersiveChatTrigger";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [showTeaser, setShowTeaser] = useState(false);
    const [teaserText, setTeaserText] = useState("");
    const [isDancing, setIsDancing] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hi! I'm your Opticore AI assistant. I can help you with project inquiries, technical details, or any questions about our services. How can I assist you today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const teasers = [
        "Expert guidance for your next project.",
        "Inquiry? I'm here to assist you.",
        "Explore our precision 3D solutions.",
        "Tailored support for your vision.",
        "Let's architect something amazing.",
    ];

    const suggestedQuestions = [
        "What services do you offer?",
        "Tell me about your 3D work",
        "How can I get a quote?",
    ];

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
            setShowTeaser(false);
            setIsDancing(false);
        } else {
            // Dance and Teaser logic when closed
            const danceInterval = setInterval(() => {
                setIsDancing(true);
                setTimeout(() => setIsDancing(false), 1000);
            }, 6000);

            const triggerTeaser = () => {
                const randomTeaser = teasers[Math.floor(Math.random() * teasers.length)];
                setTeaserText(randomTeaser);
                setShowTeaser(true);
                setIsDancing(true);

                setTimeout(() => {
                    setShowTeaser(false);
                    setIsDancing(false);
                }, 5000);
            };

            const initialTimeout = setTimeout(triggerTeaser, 4000);
            const teaserInterval = setInterval(triggerTeaser, 20000);

            return () => {
                clearTimeout(initialTimeout);
                clearInterval(teaserInterval);
                clearInterval(danceInterval);
            };
        }
    }, [isOpen]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSend = async (textOverride?: string) => {
        const messageToSend = textOverride || input;
        if (!messageToSend.trim() || isLoading) return;

        setMessages((prev) => [...prev, { role: "user", content: messageToSend }]);
        if (!textOverride) setInput("");
        setIsLoading(true);

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "";

            const response = await fetch("/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ message: messageToSend, session_id: sessionId }),
            });

            if (!response.ok) throw new Error("Failed to send message");

            const data = await response.json();
            if (data.session_id) setSessionId(data.session_id);
            setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "I apologize, but I'm having trouble connecting right now. Please try again or contact us directly.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-0 right-0 z-50">
            {/* Teaser Bubble */}
            <AnimatePresence>
                {showTeaser && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute bottom-20 sm:bottom-24 right-4 sm:right-8 mb-4 w-52 p-4 rounded-2xl bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] pointer-events-none"
                    >
                        <div className="relative">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Bot size={10} className="text-violet-400" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Opticore Assistant</span>
                            </div>
                            <p className="text-xs font-medium text-white/90 leading-relaxed">
                                {teaserText}
                            </p>
                            {/* Arrow */}
                            <div className="absolute top-full right-6 w-2 h-2 bg-zinc-950/90 border-r border-b border-white/10 rotate-45 -translate-y-1" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Immersive Trigger Button */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
                <ImmersiveChatTrigger
                    onClick={() => setIsOpen(!isOpen)}
                    isOpen={isOpen}
                    isDancing={isDancing}
                />
            </div>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute bottom-20 sm:bottom-24 right-2 sm:right-6 w-[calc(100vw-16px)] sm:w-[340px] max-w-[340px] overflow-hidden rounded-3xl border border-white/10 bg-[#0d1320]/95 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl max-h-[calc(100vh-120px)] sm:max-h-[500px] flex flex-col"
                    >
                        {/* Header */}
                        <div className="relative bg-linear-to-r from-violet-600 via-indigo-500 to-cyan-500 px-5 py-5 shrink-0">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 h-full w-1/2 bg-linear-to-l from-white/10 to-transparent" />

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-white/30 bg-white/10 shadow-inner">
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Bot size={22} className="text-white" />
                                        </div>
                                        {/* Status indicator */}
                                        <div className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-[#0d1320] bg-green-400 shadow-lg" />
                                    </div>

                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-white tracking-tight">
                                            Opticore Hub
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                                            <span className="text-[10px] font-medium text-white/80">Online now</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 backdrop-blur-md">
                                        <Sparkles size={10} className="text-yellow-300" />
                                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">AI Powered</span>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 text-white/50 hover:text-white transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                            data-lenis-prevent
                            className="flex-1 overflow-y-auto bg-black/20 p-4 space-y-4 scroll-smooth"
                        >
                            {messages.length === 1 && (
                                <div className="mb-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm">
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                                        Suggested Inquiries
                                    </p>
                                    <div className="space-y-2">
                                        {suggestedQuestions.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(q)}
                                                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left text-xs text-white/80 transition-all hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white group"
                                            >
                                                <span className="flex items-center justify-between">
                                                    {q}
                                                    <Send size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-400" />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: i === messages.length - 1 ? 0.05 : 0 }}
                                        className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                                    >
                                        {msg.role === "assistant" && (
                                            <div className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/20">
                                                <Bot size={16} className="text-violet-400" />
                                            </div>
                                        )}

                                        <div
                                            className={cn(
                                                "max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-relaxed shadow-lg",
                                                msg.role === "user"
                                                    ? "bg-linear-to-br from-violet-600 to-indigo-600 text-white rounded-tr-none"
                                                    : "border border-white/10 bg-zinc-900/50 text-white/90 backdrop-blur-xl rounded-tl-none"
                                            )}
                                        >
                                            {msg.content}
                                        </div>

                                        {msg.role === "user" && (
                                            <div className="ml-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/10">
                                                <User size={16} className="text-zinc-400" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex justify-start"
                                    >
                                        <div className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/20">
                                            <Bot size={16} className="text-violet-400" />
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-zinc-900/50 px-5 py-4 backdrop-blur-xl">
                                            <motion.div
                                                className="h-1.5 w-1.5 rounded-full bg-violet-400"
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                            />
                                            <motion.div
                                                className="h-1.5 w-1.5 rounded-full bg-violet-400"
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                            />
                                            <motion.div
                                                className="h-1.5 w-1.5 rounded-full bg-violet-400"
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={bottomRef} className="h-2" />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-white/10 bg-[#0d1320] p-4 shrink-0">
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        placeholder="Type your message..."
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-4 pr-16 py-3.5 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.08] focus:ring-1 focus:ring-violet-500/20"
                                    />
                                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-white/10 group-focus-within:text-violet-400/30 transition-colors">
                                        Enter
                                    </div>
                                </div>
                                <motion.button
                                    onClick={() => handleSend()}
                                    disabled={isLoading || !input.trim()}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </motion.button>
                            </div>

                            {/* Trust indicators */}
                            <div className="mt-4 flex items-center justify-center gap-6">
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/20">
                                    <Shield size={12} className="text-violet-500/40" />
                                    <span>Encrypted Chat</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/20">
                                    <Clock size={12} className="text-cyan-500/40" />
                                    <span>Instant Response</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
