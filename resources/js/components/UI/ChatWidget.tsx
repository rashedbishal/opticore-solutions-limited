"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Clock, Shield, Loader2, X } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import ImmersiveChatTrigger from "./ImmersiveChatTrigger";

interface Message {
    role: "user" | "assistant";
    content: string;
    sentAt: Date;
}

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

interface ChatWidgetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ChatWidget({ isOpen, onOpenChange }: ChatWidgetProps) {
    const [showTeaser, setShowTeaser] = useState(false);
    const [teaserText, setTeaserText] = useState("");
    const [isDancing, setIsDancing] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hi! I'm your Opticore AI assistant. I can help you with project inquiries, technical details, or any questions about our services. How can I assist you today?",
            sentAt: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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

        if (!messageToSend.trim() || isLoading) {
return;
}

        setMessages((prev) => [...prev, { role: "user", content: messageToSend, sentAt: new Date() }]);

        if (!textOverride) {
setInput("");
}

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

            if (!response.ok) {
throw new Error("Failed to send message");
}

            const data = await response.json();

            if (data.session_id) {
setSessionId(data.session_id);
}

            setMessages((prev) => [...prev, { role: "assistant", content: data.reply, sentAt: new Date() }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "I apologize, but I'm having trouble connecting right now. Please try again or contact us directly.",
                    sentAt: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed right-2 bottom-2 z-50 sm:right-5 flex flex-col items-end gap-4">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        data-lenis-prevent
                        className="border-theme bg-background flex max-h-[min(calc(100dvh-88px),640px)] w-[calc(100vw-32px)] sm:w-[380px] md:w-[420px] flex-col overflow-hidden rounded-3xl border shadow-[0_0_50px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]"
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
                                        <div className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-violet-600 bg-green-400 shadow-lg" />
                                    </div>

                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-white tracking-tight">
                                            Opticore Hub
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                                            <span className="text-[11px] font-medium text-white/90">Online now</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 backdrop-blur-md">
                                        <Sparkles size={11} className="text-yellow-300" />
                                        <span className="text-[11px] font-bold tracking-wider text-white uppercase">AI Powered</span>
                                    </div>
                                    <button
                                        onClick={() => onOpenChange(false)}
                                        className="p-1 text-white/50 hover:text-white transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            className="flex-1 overflow-y-auto bg-theme-surface p-4 scroll-smooth"
                        >
                            {messages.length === 1 && (
                                <div className="border-theme bg-theme-surface-hover mb-4 rounded-2xl border p-4 backdrop-blur-sm">
                                    <p className="text-theme-subtle mb-3 text-[11px] font-bold tracking-wider uppercase">
                                        Suggested Inquiries
                                    </p>
                                    <div className="space-y-2">
                                        {suggestedQuestions.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(q)}
                                                className="border-theme bg-theme-surface w-full rounded-xl border px-4 py-3 text-left text-xs text-theme transition-all hover:border-violet-500/50 hover:bg-violet-500/10 dark:hover:bg-violet-500/10 group"
                                            >
                                                <span className="flex items-center justify-between">
                                                    {q}
                                                    <Send size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-500" />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col">
                                {messages.map((msg, i) => {
                                    const isUser = msg.role === "user";
                                    const prevSame = i > 0 && messages[i - 1].role === msg.role;
                                    const nextSame = i < messages.length - 1 && messages[i + 1].role === msg.role;
                                    const isFirstInGroup = !prevSame;
                                    const isLastInGroup = !nextSame;

                                    return (
                                        <React.Fragment key={i}>
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ delay: i === messages.length - 1 ? 0.05 : 0 }}
                                                className={cn(
                                                    "flex items-end gap-2",
                                                    isUser ? "justify-end" : "justify-start",
                                                    i === 0 ? "" : isFirstInGroup ? "mt-3" : "mt-0.5"
                                                )}
                                            >
                                                {!isUser && (
                                                    <div className={cn("h-8 w-8 flex-shrink-0", !isLastInGroup && "invisible")}>
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
                                                            <Bot size={16} className="text-violet-500" />
                                                        </div>
                                                    </div>
                                                )}

                                                <div
                                                    className={cn(
                                                        "max-w-[80%] rounded-[20px] px-4 py-3 text-sm leading-relaxed shadow-sm",
                                                        isUser
                                                            ? cn(
                                                                "bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-violet-500/10",
                                                                isFirstInGroup && "rounded-tr-none"
                                                            )
                                                            : cn(
                                                                "border border-theme bg-background text-theme backdrop-blur-xl",
                                                                isFirstInGroup && "rounded-tl-none"
                                                            )
                                                    )}
                                                >
                                                    {msg.content}
                                                </div>

                                                {isUser && (
                                                    <div className={cn("h-8 w-8 flex-shrink-0", !isLastInGroup && "invisible")}>
                                                        <div className="border-theme bg-theme-surface flex h-8 w-8 items-center justify-center rounded-xl border">
                                                            <User size={16} className="text-theme-subtle" />
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                            {isLastInGroup && (
                                                <p className={cn(
                                                    "mt-1 mb-1 text-[10px] text-theme-subtle/60 px-1",
                                                    isUser ? "text-right pr-11" : "text-left pl-11"
                                                )}>
                                                    {msg.sentAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={cn(
                                            "flex items-end gap-2 justify-start",
                                            messages.length > 0 && messages[messages.length - 1].role === "assistant" ? "mt-0.5" : "mt-3"
                                        )}
                                    >
                                        <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
                                            <Bot size={16} className="text-violet-500" />
                                        </div>
                                        <div className="border-theme bg-background flex items-center gap-1.5 rounded-[20px] rounded-tl-none border px-5 py-4 backdrop-blur-xl shadow-sm">
                                            <motion.div
                                                className="h-1.5 w-1.5 rounded-full bg-violet-500"
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0, times: [0, 0.5, 1] }}
                                            />
                                            <motion.div
                                                className="h-1.5 w-1.5 rounded-full bg-violet-500"
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2, times: [0, 0.5, 1] }}
                                            />
                                            <motion.div
                                                className="h-1.5 w-1.5 rounded-full bg-violet-500"
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4, times: [0, 0.5, 1] }}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={bottomRef} className="h-2" />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="border-theme bg-background border-t p-4 shrink-0">
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        placeholder="Type your message..."
                                        className="border-theme bg-theme-surface text-theme placeholder:text-theme-subtle w-full rounded-2xl border pl-4 pr-16 py-3.5 text-sm outline-none transition-all focus:border-violet-500/50 focus:bg-theme-surface-hover focus:ring-1 focus:ring-violet-500/10"
                                    />
                                    <div className="text-theme-subtle/40 pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[11px] font-bold tracking-wider transition-colors group-focus-within:text-violet-500/60 uppercase">
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
                                <div className="text-theme-subtle/70 flex items-center gap-1.5 text-[11px] font-semibold">
                                    <Shield size={12} className="text-violet-500/60" />
                                    <span>Encrypted Chat</span>
                                </div>
                                <div className="text-theme-subtle/70 flex items-center gap-1.5 text-[11px] font-semibold">
                                    <Clock size={12} className="text-cyan-500/60" />
                                    <span>Instant Response</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Row */}
            <div className="relative group/chat flex flex-row-reverse items-center gap-3">
                {/* Teaser Bubble */}
                <AnimatePresence>
                    {showTeaser && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="border-theme bg-theme-surface/90 absolute bottom-full right-0 mb-3 w-56 rounded-2xl border p-4 shadow-[0_0_30px_rgba(0,0,0,0.2)] backdrop-blur-xl pointer-events-none"
                        >
                            <div className="relative">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Bot size={12} className="text-violet-500 dark:text-violet-400" />
                                    <span className="text-theme-subtle text-[11px] font-bold tracking-wider uppercase">Opticore Assistant</span>
                                </div>
                                <p className="text-theme text-[13px] font-medium leading-relaxed">
                                    {teaserText}
                                </p>
                                {/* Arrow */}
                                <div className="border-theme bg-theme-surface absolute top-full right-6 w-2 h-2 border-r border-b rotate-45 -translate-y-1" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ImmersiveChatTrigger
                    onClick={() => onOpenChange(!isOpen)}
                    isOpen={isOpen}
                    isDancing={isDancing}
                />
                {/* Hover label */}
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="border-theme bg-theme-surface/90 hidden sm:flex items-center gap-1.5 rounded-full border px-4 py-2 shadow-[0_0_20px_rgba(124,58,237,0.1)] backdrop-blur-xl pointer-events-none opacity-0 group-hover/chat:opacity-100 transition-all duration-300 -translate-x-1 group-hover/chat:translate-x-0"
                    >
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                        <span className="text-theme text-xs font-semibold whitespace-nowrap">Chat with AI</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
