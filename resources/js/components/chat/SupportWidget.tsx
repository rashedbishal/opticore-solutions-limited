import type { SharedPageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Download,
    FileText,
    Image as ImageIcon,
    MessageSquare,
    Paperclip,
    Send,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

interface Message {
    id: number;
    sender_type: 'user' | 'admin';
    message: string | null;
    attachment_path: string | null;
    attachment_name: string | null;
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
    const [attachmentError, setAttachmentError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isOpenRef = useRef(isOpen);
    isOpenRef.current = isOpen;

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    // Initialize Conversation
    useEffect(() => {
        if (auth.user) {
            axios
                .post('/user-chat/init')
                .then((res) => {
                    setConversation(res.data.conversation);
                })
                .catch((e) => console.error('Failed to init chat', e));
        }
    }, [auth.user]);

    // Fetch Messages
    useEffect(() => {
        if (isOpen && conversation) {
            axios.get(`/user-chat/${conversation.id}/messages`).then((res) => {
                setMessages(res.data.data.reverse());
                scrollToBottom();

                setUnread((prev) => {
                    if (prev > 0) {
                        axios.post(`/user-chat/${conversation.id}/read`);
                    }

                    return 0;
                });
            });
        }
    }, [isOpen, conversation, scrollToBottom]);

    // Ping server while chat window is open so admin knows user is online
    useEffect(() => {
        if (!isOpen || !conversation) {
            return;
        }

        const ping = () => axios.post('/user-chat/ping').catch(() => {});
        ping();
        const interval = setInterval(ping, 60_000);

        return () => clearInterval(interval);
    }, [isOpen, conversation]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (!file) {
            return;
        }

        if (file.size > MAX_FILE_BYTES) {
            setAttachmentError(
                `File too large. Maximum size is 15MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
            );
            setAttachment(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            return;
        }

        setAttachmentError(null);
        setAttachment(file);
    };

    const handleRemoveAttachment = () => {
        setAttachment(null);
        setAttachmentError(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if ((!newMessage.trim() && !attachment) || !conversation || isSending) {
            return;
        }

        const formData = new FormData();

        if (newMessage.trim()) {
            formData.append('message', newMessage);
        }

        if (attachment) {
            formData.append('attachment', attachment);
        }

        setIsSending(true);

        try {
            const res = await axios.post(
                `/user-chat/${conversation.id}/message`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                },
            );
            setMessages((prev) => {
                if (prev.some((m) => m.id === res.data.id)) {
                    return prev;
                }

                return [...prev, res.data];
            });
            setNewMessage('');
            handleRemoveAttachment();
            scrollToBottom();
        } catch (error: any) {
            const msg =
                error?.response?.data?.message || 'Failed to send message.';
            setAttachmentError(msg);
        } finally {
            setIsSending(false);
        }
    };

    if (!auth.user) {
        return null;
    }

    return (
        <div className="fixed bottom-3 left-3 z-50 sm:bottom-6 sm:left-6">
            {conversation && (
                <SupportWidgetEchoListener
                    conversation={conversation}
                    setMessages={setMessages}
                    setUnread={setUnread}
                    isOpenRef={isOpenRef}
                    scrollToBottom={scrollToBottom}
                />
            )}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 left-0 mb-2 flex max-h-[min(100dvh-90px,520px)] w-[min(100vw-24px,24rem)] flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10 sm:mb-4"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between bg-violet-600 px-4 py-3 text-white">
                            <div>
                                <h3 className="font-semibold">
                                    Customer Support
                                </h3>
                                <p className="text-xs text-violet-200">
                                    We typically reply in a few minutes
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-1 hover:bg-white/20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-900/50 p-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                                            msg.sender_type === 'user'
                                                ? 'rounded-br-none bg-violet-600 text-white'
                                                : 'rounded-bl-none bg-slate-800 text-slate-200'
                                        }`}
                                    >
                                        {msg.attachment_path && (
                                            <a
                                                href={`/chat/attachments/${msg.id}/download`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className="group mb-1.5 flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 transition hover:bg-black/40"
                                            >
                                                <span className="shrink-0">
                                                    {msg.attachment_type ===
                                                    'image' ? (
                                                        <ImageIcon size={15} />
                                                    ) : (
                                                        <FileText size={15} />
                                                    )}
                                                </span>
                                                <span className="flex-1 truncate text-xs underline underline-offset-2">
                                                    Download Attachment
                                                </span>
                                                <Download
                                                    size={13}
                                                    className="shrink-0 opacity-60 group-hover:opacity-100"
                                                />
                                            </a>
                                        )}
                                        {msg.message && (
                                            <p className="break-words whitespace-pre-wrap">
                                                {msg.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-slate-800 bg-slate-900 px-4 py-3">
                            <form
                                onSubmit={handleSend}
                                className="flex flex-col gap-2"
                            >
                                {/* Error notification */}
                                <AnimatePresence>
                                    {attachmentError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs text-red-400"
                                        >
                                            <span className="flex-1">
                                                {attachmentError}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAttachmentError(null)
                                                }
                                                className="mt-0.5 shrink-0 hover:text-red-300"
                                            >
                                                <X size={12} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Attachment preview */}
                                <AnimatePresence>
                                    {attachment && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2"
                                        >
                                            <Paperclip
                                                size={13}
                                                className="shrink-0 text-violet-400"
                                            />
                                            <span className="flex-1 truncate text-xs text-slate-300">
                                                {attachment.name}
                                            </span>
                                            <span className="shrink-0 text-[10px] text-slate-500">
                                                {(
                                                    attachment.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(1)}{' '}
                                                MB
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleRemoveAttachment}
                                                className="shrink-0 text-slate-400 transition hover:text-red-400"
                                            >
                                                <X size={14} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Message bar */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className={`shrink-0 transition-colors ${attachment ? 'text-violet-400' : 'text-slate-400 hover:text-violet-400'}`}
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) =>
                                            setNewMessage(e.target.value)
                                        }
                                        placeholder="Type a message..."
                                        className="flex-1 rounded-full border-none bg-slate-800 px-4 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={
                                            isSending ||
                                            (!newMessage.trim() && !attachment)
                                        }
                                        className="shrink-0 rounded-full bg-violet-600 p-2 text-white transition hover:bg-violet-500 disabled:opacity-40"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle button */}
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

interface EchoListenerProps {
    conversation: Conversation;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setUnread: React.Dispatch<React.SetStateAction<number>>;
    isOpenRef: React.MutableRefObject<boolean>;
    scrollToBottom: () => void;
}

function SupportWidgetEchoListener({
    conversation,
    setMessages,
    setUnread,
    isOpenRef,
    scrollToBottom,
}: EchoListenerProps) {
    useEcho(
        `conversations.${conversation.id}`,
        'MessageSent',
        useCallback(
            (e: any) => {
                const incoming = e.message;
                setMessages((prev) => {
                    if (prev.some((m) => m.id === incoming.id)) {
                        return prev;
                    }

                    return [...prev, incoming];
                });

                if (incoming.sender_type === 'admin') {
                    if (!isOpenRef.current) {
                        setUnread((u) => u + 1);
                    } else {
                        axios.post(`/user-chat/${conversation.id}/read`);
                    }
                }

                scrollToBottom();
            },
            [
                conversation.id,
                isOpenRef,
                scrollToBottom,
                setMessages,
                setUnread,
            ],
        ),
    );

    return null;
}
