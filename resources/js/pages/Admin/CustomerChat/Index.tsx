import type { Offer, OfferMessage } from '@/components/Offer/CreateOfferModal';
import type { ReactNode } from 'react';
import { echo, useEcho } from '@laravel/echo-react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    ExternalLink,
    FileText,
    Image as ImageIcon,
    Layers,
    MessageSquare,
    Package,
    Paperclip,
    Search,
    Send,
    Trash2,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { CATEGORY_LABELS } from '@/components/Offer/CreateOfferModal';
import CreateOfferModal from '@/components/Offer/CreateOfferModal';
import useEchoReady from '@/hooks/useEchoReady';

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

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
    is_online?: boolean;
}

// Extends OfferMessage so the union is complete
type Message = OfferMessage;

interface MessageStatusPayload {
    messages: Array<{
        id: number;
        delivered_at: string | null;
        read_at: string | null;
    }>;
}

interface UserPresencePayload {
    user_id: number;
    online: boolean;
}

function renderMessage(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const pattern = /\[\[here:([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        parts.push(
            <a
                key={match.index}
                href={match[1]}
                className="font-bold underline"
            >
                here
            </a>,
        );
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
}

function applyMessageStatuses(
    currentMessages: Message[],
    statuses: MessageStatusPayload['messages'],
): Message[] {
    if (statuses.length === 0) {
        return currentMessages;
    }

    const statusesById = new Map(statuses.map((status) => [status.id, status]));

    return currentMessages.map((message) => {
        const status = statusesById.get(message.id);

        if (!status) {
            return message;
        }

        return {
            ...message,
            delivered_at: status.delivered_at,
            read_at: status.read_at,
        };
    });
}

function getLatestOutgoingMessageId(messages: Message[]): number | null {
    for (let index = messages.length - 1; index >= 0; index--) {
        if (messages[index].sender_type === 'admin') {
            return messages[index].id;
        }
    }

    return null;
}

function getMessageStatusLabel(
    message: Message,
): 'Sent' | 'Delivered' | 'Seen' {
    if (message.read_at) {
        return 'Seen';
    }

    if (message.delivered_at) {
        return 'Delivered';
    }

    return 'Sent';
}

const STATUS_BADGE: Record<
    Offer['status'],
    { label: string; className: string }
> = {
    pending: {
        label: 'Pending',
        className: 'bg-yellow-500/15 text-yellow-400',
    },
    accepted: {
        label: 'Accepted',
        className: 'bg-green-500/15 text-green-400',
    },
    declined: {
        label: 'Declined',
        className: 'bg-red-500/15 text-red-400',
    },
    expired: {
        label: 'Expired',
        className: 'bg-slate-500/15 text-slate-400',
    },
};

function OfferCard({
    offer,
    messageId,
    conversationId,
    onDeleted,
}: {
    offer: Offer;
    messageId: number;
    conversationId: number;
    onDeleted: (messageId: number) => void;
}) {
    const [isDeleting, setIsDeleting] = useState(false);

    const totalPrice =
        offer.payment_type === 'single'
            ? parseFloat(offer.price ?? '0')
            : offer.milestones.reduce(
                  (sum: number, m: any) => sum + parseFloat(m.price),
                  0,
              );

    const totalDays =
        offer.payment_type === 'single'
            ? (offer.delivery_days ?? 0)
            : offer.milestones.reduce(
                  (sum: number, m: any) => sum + m.delivery_days,
                  0,
              );

    const badge = STATUS_BADGE[offer.status];

    const handleDelete = async () => {
        if (
            !window.confirm(
                'Delete this offer? The client will no longer see it.',
            )
        ) {
            return;
        }

        setIsDeleting(true);

        try {
            await axios.delete(
                `/admin/api/customer-conversations/${conversationId}/offer/${messageId}`,
            );
            onDeleted(messageId);
        } catch {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-full max-w-72 overflow-hidden rounded-xl border border-violet-500/20 bg-[#060c1a]/95 shadow-2xl backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
            {/* Header */}
            <div className="flex items-center justify-between border-b border-violet-500/10 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                    <Package size={13} className="text-cyan-400" />
                    <span className="text-[11px] font-semibold tracking-wide text-cyan-400 uppercase">
                        Service Offer
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                    >
                        {badge.label}
                    </span>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        title="Delete offer"
                        className="rounded p-0.5 text-slate-500 transition hover:text-red-400 disabled:opacity-40"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-4">
                {/* Category / sub-category */}
                {(offer.sub_category || offer.category_slug) && (
                    <p className="mb-1 text-sm font-semibold text-white">
                        {offer.sub_category?.name ??
                            CATEGORY_LABELS[offer.category_slug ?? ''] ??
                            offer.category_slug}
                    </p>
                )}

                {/* Description preview */}
                <p className="mb-3 line-clamp-2 text-xs text-slate-400">
                    {offer.description}
                </p>

                {/* Stats */}
                <div className="mb-3 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                        <DollarSign size={11} className="text-green-400" />
                        <span className="font-semibold text-white">
                            ${totalPrice.toFixed(2)}
                        </span>
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {totalDays} day{totalDays !== 1 ? 's' : ''}
                    </span>
                    {offer.payment_type === 'milestone' ? (
                        <span className="flex items-center gap-1">
                            <Layers size={11} />
                            {offer.milestones.length} milestone
                            {offer.milestones.length !== 1 ? 's' : ''}
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <CreditCard size={11} />
                            Full Payment
                        </span>
                    )}
                </div>

                {/* CTA */}
                <a
                    href={`/offer/${offer.offer_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 py-2 text-xs font-semibold text-white transition before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:from-violet-500 hover:to-cyan-500 hover:before:translate-x-full"
                >
                    View Offer Details
                    <ExternalLink size={11} />
                </a>
            </div>
        </div>
    );
}

export default function Index() {
    const echoReady = useEchoReady();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<
        Conversation[]
    >([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentError, setAttachmentError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [isUserTyping, setIsUserTyping] = useState(false);
    const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    // userId → timestamp of last received presence ping (ms). Used for green dot.
    const [onlineUsers, setOnlineUsers] = useState<Record<number, number>>({});
    const latestOutgoingMessageId = getLatestOutgoingMessageId(messages);

    // Ref to always have the latest activeConv inside the Echo callback (avoids stale closure)
    const activeConvRef = useRef<Conversation | null>(null);
    activeConvRef.current = activeConv;

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Ping admin online every 60 seconds
    useEffect(() => {
        const ping = () =>
            axios
                .post('/admin/api/customer-conversations/ping')
                .catch(() => {});
        ping();
        const interval = setInterval(ping, 60_000);

        return () => clearInterval(interval);
    }, []);

    // Fetch initial conversations list and seed online status from server
    useEffect(() => {
        axios.get('/admin/api/customer-conversations').then((res) => {
            const data: Conversation[] = res.data.data;
            setConversations(data);
            setFilteredConversations(data);

            const initial: Record<number, number> = {};
            data.forEach((conv) => {
                if (conv.is_online) {
                    initial[conv.user_id] = Date.now();
                }
            });
            setOnlineUsers(initial);
        });
    }, []);

    // Sweep stale online entries every 30 s.
    // A user is considered offline if no presence ping was received in the last 150 s
    // (the client pings every 60 s so 150 s = 2.5× the ping interval).
    useEffect(() => {
        const THRESHOLD_MS = 150_000;
        const sweep = () => {
            const cutoff = Date.now() - THRESHOLD_MS;
            setOnlineUsers((prev) => {
                const next = { ...prev };
                let changed = false;

                for (const key in next) {
                    if (next[key] < cutoff) {
                        delete next[key];
                        changed = true;
                    }
                }

                return changed ? next : prev;
            });
        };
        const interval = setInterval(sweep, 30_000);

        return () => clearInterval(interval);
    }, []);

    // Search filter (client-side since list is paginated at 50)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredConversations(conversations);
        } else {
            const q = searchQuery.toLowerCase();
            setFilteredConversations(
                conversations.filter((c) =>
                    c.user.name.toLowerCase().includes(q),
                ),
            );
        }
    }, [searchQuery, conversations]);

    // Fetch messages for active conversation
    useEffect(() => {
        if (activeConv) {
            axios
                .get(
                    `/admin/api/customer-conversations/${activeConv.id}/messages`,
                )
                .then((res) => {
                    setMessages(res.data.data.reverse());
                    scrollToBottom();

                    if (activeConv.unread_count > 0) {
                        axios.post(
                            `/admin/api/customer-conversations/${activeConv.id}/read`,
                        );
                        setConversations((prev) =>
                            prev.map((c) =>
                                c.id === activeConv.id
                                    ? { ...c, unread_count: 0 }
                                    : c,
                            ),
                        );
                    }
                });
        }
    }, [activeConv]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        setIsUserTyping(false);
    }, [activeConv?.id]);

    useEffect(() => {
        if (isUserTyping) {
            scrollToBottom();
        }
    }, [isUserTyping]);

    const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (!activeConv) {
            return;
        }

        try {
            echo()
                .private(`conversations.${activeConv.id}`)
                .whisper('typing', { typing: true });
        } catch {
            // noop
        }

        if (adminTypingTimeoutRef.current) {
            clearTimeout(adminTypingTimeoutRef.current);
        }

        adminTypingTimeoutRef.current = setTimeout(() => {
            try {
                if (activeConv) {
                    echo()
                        .private(`conversations.${activeConv.id}`)
                        .whisper('typing', { typing: false });
                }
            } catch {
                // noop
            }
        }, 2000);
    };

    const handleSelectConv = (conv: Conversation) => {
        setActiveConv(conv);
        // Optimistically clear unread badge
        setConversations((prev) =>
            prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c)),
        );
    };

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

        if ((!newMessage.trim() && !attachment) || !activeConv || isSending) {
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
                `/admin/api/customer-conversations/${activeConv.id}/message`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                },
            );
            // Admin's own message: add immediately (broadcast is toOthers)
            setMessages((prev) => {
                if (prev.some((m) => m.id === res.data.id)) {
                    return prev;
                }

                return [...prev, res.data];
            });

            const sentText = attachment ? 'Sent an attachment' : newMessage;

            // Update the conversation preview and instantly sort to the top
            setConversations((prev) => {
                const updatedList = prev.map((c) =>
                    c.id === activeConv.id
                        ? {
                              ...c,
                              last_message: sentText,
                              last_message_at: res.data.created_at,
                          }
                        : c,
                );

                return updatedList.sort((a, b) => {
                    const timeA = a.last_message_at
                        ? new Date(a.last_message_at).getTime()
                        : 0;
                    const timeB = b.last_message_at
                        ? new Date(b.last_message_at).getTime()
                        : 0;

                    return timeB - timeA;
                });
            });

            setNewMessage('');
            handleRemoveAttachment();
            scrollToBottom();

            try {
                echo()
                    .private(`conversations.${activeConv.id}`)
                    .whisper('typing', { typing: false });
            } catch {
                // noop
            }

            if (adminTypingTimeoutRef.current) {
                clearTimeout(adminTypingTimeoutRef.current);
                adminTypingTimeoutRef.current = null;
            }
        } catch (error: unknown) {
            const msg =
                (error as any)?.response?.data?.message ||
                'Failed to send message.';
            setAttachmentError(msg);
        } finally {
            setIsSending(false);
        }
    };

    const handleOfferSent = (message: Message) => {
        if (!activeConv) {
            return;
        }

        // Ensure the message has the offer data for rendering
        setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) {
                return prev;
            }

            return [...prev, message];
        });

        setConversations((prev) => {
            const updatedList = prev.map((c) =>
                c.id === activeConv.id
                    ? {
                          ...c,
                          last_message: 'Sent an offer',
                          last_message_at: message.created_at,
                      }
                    : c,
            );

            return updatedList.sort((a, b) => {
                const timeA = a.last_message_at
                    ? new Date(a.last_message_at).getTime()
                    : 0;
                const timeB = b.last_message_at
                    ? new Date(b.last_message_at).getTime()
                    : 0;

                return timeB - timeA;
            });
        });

        scrollToBottom();
    };

    return (
        <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-violet-500/15 bg-[#060c1a]/80 shadow-2xl backdrop-blur-xl md:h-[calc(100vh-12rem)]">
            {echoReady && (
                <AdminConversationEchoListener
                    activeConvRef={activeConvRef}
                    scrollToBottom={scrollToBottom}
                    setConversations={setConversations}
                    setFilteredConversations={setFilteredConversations}
                    setMessages={setMessages}
                    setOnlineUsers={setOnlineUsers}
                    setIsUserTyping={setIsUserTyping}
                />
            )}
            {echoReady && activeConv && (
                <AdminTypingEchoListener
                    key={activeConv.id}
                    conversationId={activeConv.id}
                    setIsUserTyping={setIsUserTyping}
                />
            )}

            {/* Offer Modal */}
            <AnimatePresence>
                {showOfferModal && activeConv && (
                    <CreateOfferModal
                        conversationId={activeConv.id}
                        userName={activeConv.user.name}
                        onOfferSent={handleOfferSent}
                        onClose={() => setShowOfferModal(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar List — full-width on mobile, 1/3 on desktop */}
            <div
                className={`${activeConv ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-violet-500/10 bg-[#060c1a]/60 md:w-1/3`}
            >
                {/* Sidebar header */}
                <div className="relative border-b border-violet-500/10 px-4 pt-4 pb-3">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                    <p className="mb-0.5 font-mono text-[9px] tracking-[0.28em] text-violet-400/40 uppercase">
                        Neural Comms
                    </p>
                    <h2 className="mb-3 text-sm font-semibold tracking-wide text-white">
                        Customer Channels
                    </h2>
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-violet-400/40" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search channels..."
                            className="w-full rounded-lg border border-white/8 bg-white/4 py-2 pr-4 pl-9 font-mono text-xs text-white placeholder-violet-400/30 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {/* The list uses layout animations so when one gets bumped to the top, it smoothly transitions over */}
                    {filteredConversations.map((conv) => (
                        <motion.button
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={conv.id}
                            onClick={() => handleSelectConv(conv)}
                            className={`relative mb-1 flex w-full items-center gap-3 overflow-hidden rounded-lg p-3 text-left transition-all ${
                                activeConv?.id === conv.id
                                    ? 'border border-violet-500/25 bg-violet-500/8'
                                    : 'border border-transparent hover:border-violet-500/10 hover:bg-violet-500/5'
                            }`}
                        >
                            {/* Active left accent bar */}
                            {activeConv?.id === conv.id && (
                                <div className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400" />
                            )}

                            {/* Initials avatar */}
                            <div className="relative shrink-0">
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${
                                        activeConv?.id === conv.id
                                            ? 'bg-gradient-to-br from-violet-600/60 to-cyan-600/40 text-white'
                                            : 'bg-violet-500/10 text-violet-300'
                                    }`}
                                >
                                    {conv.user.name.charAt(0).toUpperCase()}
                                </div>
                                {onlineUsers[conv.user_id] !== undefined && (
                                    <span
                                        className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#060c1a] bg-green-400"
                                        style={{
                                            boxShadow:
                                                '0 0 6px rgba(74,222,128,0.9)',
                                        }}
                                    />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="mb-0.5 flex items-center justify-between gap-2">
                                    <span className="truncate text-sm font-medium text-slate-200">
                                        {conv.user.name}
                                    </span>
                                    {conv.last_message_at && (
                                        <span className="shrink-0 font-mono text-[9px] text-violet-400/40">
                                            {new Date(
                                                conv.last_message_at,
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate font-mono text-[11px] text-slate-500">
                                        {conv.last_message || 'No messages yet'}
                                    </p>
                                    {conv.unread_count > 0 && (
                                        <span
                                            className="shrink-0 rounded-full bg-violet-500 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white"
                                            style={{
                                                boxShadow:
                                                    '0 0 8px rgba(139,92,246,0.5)',
                                            }}
                                        >
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.button>
                    ))}
                    {filteredConversations.length === 0 && (
                        <div className="p-6 text-center">
                            <MessageSquare className="mx-auto mb-2 h-6 w-6 text-violet-500/20" />
                            <p className="font-mono text-[10px] tracking-[0.2em] text-violet-400/30 uppercase">
                                {searchQuery
                                    ? 'No channels found'
                                    : 'No active channels'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Window — hidden on mobile until a conversation is selected */}
            <div
                className={`${activeConv ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#060c1a]/30`}
            >
                {activeConv ? (
                    <>
                        {/* Chat Header */}
                        <div className="relative flex items-center justify-between border-b border-violet-500/10 bg-[#060c1a]/60 px-4 py-3">
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                            <div className="flex min-w-0 items-center gap-3">
                                {/* Back to list — mobile only */}
                                <button
                                    onClick={() => setActiveConv(null)}
                                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white md:hidden"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                {/* User avatar */}
                                <div className="relative hidden shrink-0 sm:block">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/50 to-cyan-600/30 text-sm font-bold text-white">
                                        {activeConv.user.name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    {onlineUsers[activeConv.user_id] !==
                                        undefined && (
                                        <span
                                            className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#060c1a] bg-green-400"
                                            style={{
                                                boxShadow:
                                                    '0 0 6px rgba(74,222,128,0.9)',
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="truncate text-sm font-semibold text-white">
                                        {activeConv.user.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <p className="truncate font-mono text-[10px] text-violet-400/50">
                                            {activeConv.user.email}
                                        </p>
                                        {onlineUsers[activeConv.user_id] !==
                                            undefined && (
                                            <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] tracking-wider text-green-400">
                                                <span
                                                    className="h-1.5 w-1.5 rounded-full bg-green-400"
                                                    style={{
                                                        boxShadow:
                                                            '0 0 5px rgba(74,222,128,0.8)',
                                                    }}
                                                />
                                                Online
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowOfferModal(true)}
                                className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition hover:border-violet-500/50 hover:bg-violet-500/20"
                            >
                                <Package size={13} />
                                Create an Offer
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-3 md:p-6">
                            {messages.map((msg, idx) => (
                                <div
                                    key={`${msg.id}-${idx}`}
                                    className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className="max-w-[75%]">
                                        {msg.offer ? (
                                            <OfferCard
                                                offer={msg.offer}
                                                messageId={msg.id}
                                                conversationId={activeConv.id}
                                                onDeleted={(id) =>
                                                    setMessages((prev) =>
                                                        prev.filter(
                                                            (m) => m.id !== id,
                                                        ),
                                                    )
                                                }
                                            />
                                        ) : (
                                            <div
                                                className={`rounded-2xl px-5 py-3 text-sm shadow-sm ${
                                                    msg.sender_type === 'admin'
                                                        ? 'rounded-br-none bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-[0_4px_20px_rgba(124,58,237,0.25)]'
                                                        : 'rounded-bl-none border border-violet-500/10 bg-[#060c1a]/80 text-slate-200'
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
                                                                <ImageIcon
                                                                    size={15}
                                                                />
                                                            ) : (
                                                                <FileText
                                                                    size={15}
                                                                />
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
                                                        {renderMessage(
                                                            msg.message,
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {msg.sender_type === 'admin' &&
                                            msg.id ===
                                                latestOutgoingMessageId && (
                                                <p className="mt-1 px-1 text-right font-mono text-[10px] tracking-wide text-violet-400/40">
                                                    {getMessageStatusLabel(msg)}
                                                </p>
                                            )}
                                    </div>
                                </div>
                            ))}
                            {isUserTyping && (
                                <div className="flex justify-start">
                                    <div className="max-w-[75%]">
                                        <div className="flex items-center gap-1 rounded-2xl rounded-bl-none border border-violet-500/10 bg-[#060c1a]/80 px-5 py-3 text-sm text-slate-200 shadow-sm">
                                            <span
                                                className="h-2 w-2 animate-bounce rounded-full bg-violet-400"
                                                style={{
                                                    animationDelay: '0ms',
                                                    boxShadow:
                                                        '0 0 4px rgba(167,139,250,0.8)',
                                                }}
                                            />
                                            <span
                                                className="h-2 w-2 animate-bounce rounded-full bg-violet-400"
                                                style={{
                                                    animationDelay: '160ms',
                                                    boxShadow:
                                                        '0 0 4px rgba(167,139,250,0.8)',
                                                }}
                                            />
                                            <span
                                                className="h-2 w-2 animate-bounce rounded-full bg-violet-400"
                                                style={{
                                                    animationDelay: '320ms',
                                                    boxShadow:
                                                        '0 0 4px rgba(167,139,250,0.8)',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="border-t border-violet-500/10 bg-[#060c1a]/60 p-4">
                            <form
                                onSubmit={handleSend}
                                className="relative flex flex-col gap-2"
                            >
                                {/* Error notification */}
                                <AnimatePresence>
                                    {attachmentError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            className="absolute -top-14 left-0 z-20 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs text-red-400 shadow-xl"
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
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute -top-12 left-0 z-10 flex w-fit items-center justify-between gap-4 rounded-lg border border-violet-500/20 bg-[#060c1a]/95 px-3 py-1.5 text-xs text-slate-300 shadow-xl backdrop-blur-sm"
                                        >
                                            <Paperclip
                                                size={13}
                                                className="shrink-0 text-cyan-400"
                                            />
                                            <span className="max-w-[200px] truncate">
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
                                                className="text-slate-400 hover:text-red-400"
                                            >
                                                <X size={14} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 p-1.5 transition-colors focus-within:border-violet-500/50">
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
                                        className={`ml-2 rounded-full p-2 transition ${attachment ? 'text-cyan-400' : 'text-slate-400 hover:bg-white/5 hover:text-cyan-400'}`}
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={handleAdminInputChange}
                                        placeholder={`Reply to ${activeConv.user.name}...`}
                                        className="flex-1 border-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-0"
                                    />
                                    <button
                                        type="submit"
                                        disabled={
                                            isSending ||
                                            (!newMessage.trim() && !attachment)
                                        }
                                        className="relative transform overflow-hidden rounded-full border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 p-2.5 text-white transition before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:from-violet-500 hover:to-cyan-500 hover:before:translate-x-full active:scale-95 disabled:opacity-50"
                                        style={{
                                            boxShadow:
                                                '0 0 16px rgba(124,58,237,0.4)',
                                        }}
                                    >
                                        <Send
                                            size={18}
                                            className="translate-x-0.5"
                                        />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3">
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/5">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600/10 to-cyan-600/5" />
                            <MessageSquare
                                size={28}
                                className="relative text-violet-400/40"
                            />
                        </div>
                        <div className="text-center">
                            <p className="font-mono text-[10px] tracking-[0.25em] text-violet-400/40 uppercase">
                                No Channel Selected
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                                Select a customer channel to begin
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

interface AdminConversationEchoListenerProps {
    activeConvRef: React.MutableRefObject<Conversation | null>;
    scrollToBottom: () => void;
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    setFilteredConversations: React.Dispatch<
        React.SetStateAction<Conversation[]>
    >;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setOnlineUsers: React.Dispatch<
        React.SetStateAction<Record<number, number>>
    >;
    setIsUserTyping: React.Dispatch<React.SetStateAction<boolean>>;
}

function AdminConversationEchoListener({
    activeConvRef,
    scrollToBottom,
    setConversations,
    setFilteredConversations,
    setMessages,
    setOnlineUsers,
    setIsUserTyping,
}: AdminConversationEchoListenerProps) {
    useEcho(
        'admin.conversations',
        'MessageSent',
        useCallback(
            (e: any) => {
                const incoming: Message = e.message;
                const currentConv = activeConvRef.current;
                const isActive = currentConv?.id === incoming.conversation_id;

                setConversations((prev) => {
                    const exists = prev.some(
                        (c) => c.id === incoming.conversation_id,
                    );
                    let updatedList = [];

                    if (exists) {
                        updatedList = prev.map((c) => {
                            if (c.id !== incoming.conversation_id) {
                                return c;
                            }

                            return {
                                ...c,
                                last_message: incoming.offer_id
                                    ? 'Sent an offer'
                                    : incoming.attachment_path
                                      ? 'Sent an attachment'
                                      : incoming.message,
                                last_message_at: incoming.created_at,
                                unread_count: isActive
                                    ? 0
                                    : c.unread_count +
                                      (incoming.sender_type === 'user' ? 1 : 0),
                            };
                        });
                    } else {
                        const convData = (incoming as any).conversation;

                        if (!convData) {
                            axios
                                .get('/admin/api/customer-conversations')
                                .then((res) => {
                                    setConversations(res.data.data);
                                    setFilteredConversations(res.data.data);
                                });

                            return prev;
                        }

                        const newConv: Conversation = {
                            id: convData.id,
                            user_id: convData.user_id,
                            user: convData.user,
                            last_message: incoming.offer_id
                                ? 'Sent an offer'
                                : incoming.attachment_path
                                  ? 'Sent an attachment'
                                  : incoming.message,
                            last_message_at: incoming.created_at,
                            unread_count:
                                incoming.sender_type === 'user' ? 1 : 0,
                            is_online: convData.is_online ?? false,
                        };

                        updatedList = [newConv, ...prev];
                    }

                    return updatedList.sort((a, b) => {
                        const timeA = a.last_message_at
                            ? new Date(a.last_message_at).getTime()
                            : 0;
                        const timeB = b.last_message_at
                            ? new Date(b.last_message_at).getTime()
                            : 0;

                        return timeB - timeA;
                    });
                });

                if (isActive) {
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === incoming.id)) {
                            return prev;
                        }

                        return [...prev, incoming];
                    });
                    scrollToBottom();

                    if (incoming.sender_type === 'user') {
                        setIsUserTyping(false);

                        axios.post(
                            `/admin/api/customer-conversations/${currentConv!.id}/read`,
                        );
                    }
                }
            },
            [
                activeConvRef,
                scrollToBottom,
                setConversations,
                setFilteredConversations,
                setIsUserTyping,
                setMessages,
            ],
        ),
    );

    useEcho<MessageStatusPayload>(
        'admin.conversations',
        'MessageStatusUpdated',
        useCallback(
            (e) => {
                setMessages((prev) => applyMessageStatuses(prev, e.messages));
            },
            [setMessages],
        ),
    );

    useEcho<UserPresencePayload>(
        'admin.conversations',
        'UserPresenceUpdated',
        useCallback(
            (e) => {
                if (e.online) {
                    setOnlineUsers((prev) => ({
                        ...prev,
                        [e.user_id]: Date.now(),
                    }));
                } else {
                    setOnlineUsers((prev) => {
                        const next = { ...prev };
                        delete next[e.user_id];

                        return next;
                    });
                }
            },
            [setOnlineUsers],
        ),
    );

    useEcho<{ offer_id: number; status: Offer['status'] }>(
        'admin.conversations',
        'OfferStatusChanged',
        useCallback(
            (e) => {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.offer?.id === e.offer_id
                            ? {
                                  ...msg,
                                  offer: { ...msg.offer!, status: e.status },
                              }
                            : msg,
                    ),
                );
            },
            [setMessages],
        ),
    );

    useEcho<{ message_id: number; conversation_id: number }>(
        'admin.conversations',
        'OfferDeleted',
        useCallback(
            (e) => {
                setMessages((prev) =>
                    prev.filter((m) => m.id !== e.message_id),
                );
            },
            [setMessages],
        ),
    );

    useEcho<{ offer: Offer }>(
        'admin.conversations',
        'OfferUpdated',
        useCallback(
            (e) => {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.offer?.id === e.offer.id
                            ? { ...msg, offer: e.offer }
                            : msg,
                    ),
                );
            },
            [setMessages],
        ),
    );

    return null;
}

function AdminTypingEchoListener({
    conversationId,
    setIsUserTyping,
}: {
    conversationId: number;
    setIsUserTyping: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        try {
            const channel = echo().private(`conversations.${conversationId}`);

            channel.listenForWhisper('typing', (e: { typing: boolean }) => {
                setIsUserTyping(e.typing);

                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                if (e.typing) {
                    timeoutRef.current = setTimeout(
                        () => setIsUserTyping(false),
                        3000,
                    );
                }
            });

            return () => {
                try {
                    channel.stopListeningForWhisper('typing');
                    echo().leave(`conversations.${conversationId}`);
                } catch {
                    // noop
                }

                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        } catch {
            return;
        }
    }, [conversationId, setIsUserTyping]);

    return null;
}

Index.layout = (page: ReactNode) => (
    <AdminLayout title="Customer Support">{page}</AdminLayout>
);
