import type { SharedPageProps } from '@/types';
import type { Variants } from 'framer-motion';
import { usePage } from '@inertiajs/react';
import { echo, useEcho } from '@laravel/echo-react';
import axios from 'axios';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
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
    Send,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { resolveCategoryLabel } from '@/components/Offer/CreateOfferModal';
import useEchoReady from '@/hooks/useEchoReady';
import { cn } from '@/lib/utils';

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

export interface OfferMilestone {
    id: number;
    offer_id: number;
    name: string;
    description: string | null;
    revisions: number;
    delivery_days: number;
    price: string;
    sort_order: number;
}

export interface Offer {
    id: number;
    conversation_id: number;
    sub_category_id: number | null;
    category_slug: string | null;
    payment_type: 'single' | 'milestone';
    description: string;
    request_requirements: boolean;
    price: string | null;
    delivery_days: number | null;
    revisions: number | null;
    expires_at: string | null;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    offer_token: string;
    sub_category: {
        id: number;
        name: string;
        image: string | null;
        category_slug: string;
    } | null;
    milestones: OfferMilestone[];
    created_at: string;
}

interface Message {
    id: number;
    sender_type: 'user' | 'admin';
    message: string | null;
    attachment_path: string | null;
    attachment_name: string | null;
    attachment_type: string | null;
    offer_id: number | null;
    offer: Offer | null;
    delivered_at: string | null;
    read_at: string | null;
    created_at: string;
}

const STATUS_BADGE: Record<
    Offer['status'],
    { label: string; className: string }
> = {
    pending: {
        label: 'Pending',
        className: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    },
    accepted: {
        label: 'Accepted',
        className: 'bg-green-500/15 text-green-600 dark:text-green-400',
    },
    declined: {
        label: 'Declined',
        className: 'bg-red-500/15 text-red-600 dark:text-red-400',
    },
    expired: {
        label: 'Expired',
        className: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
    },
};

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

function OfferCard({ offer }: { offer: Offer }) {
    const { categories } = usePage<SharedPageProps>().props;
    const totalPrice =
        offer.payment_type === 'single'
            ? parseFloat(offer.price ?? '0')
            : offer.milestones.reduce((sum, m) => sum + parseFloat(m.price), 0);

    const totalDays =
        offer.payment_type === 'single'
            ? (offer.delivery_days ?? 0)
            : offer.milestones.reduce((sum, m) => sum + m.delivery_days, 0);

    const badge = STATUS_BADGE[offer.status];

    return (
        <div className="mb-2 w-full max-w-[280px] overflow-hidden rounded-xl border border-theme bg-card-surface shadow-sm sm:max-w-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-theme px-3 py-2">
                <div className="flex items-center gap-1.5">
                    <Package size={12} className="text-violet-400" />
                    <span className="text-[10px] font-semibold tracking-wide text-violet-400 uppercase">
                        Service Offer
                    </span>
                </div>
                <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${badge.className}`}
                >
                    {badge.label}
                </span>
            </div>

            {/* Body */}
            <div className="p-3">
                {/* Category / sub-category */}
                {(offer.sub_category || offer.category_slug) && (
                    <p className="mb-1 text-sm font-semibold text-theme">
                        {offer.sub_category?.name ??
                            resolveCategoryLabel(
                                offer.category_slug,
                                categories,
                            )}
                    </p>
                )}

                {/* Description preview */}
                <p className="mb-3 line-clamp-2 text-xs text-theme-muted">
                    {offer.description}
                </p>

                {/* Stats */}
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-theme-muted">
                    <span className="flex items-center gap-1">
                        <DollarSign
                            size={10}
                            className="text-green-500 dark:text-green-400"
                        />
                        <span className="font-semibold text-theme">
                            ${totalPrice.toFixed(2)}
                        </span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px]">
                        <Clock size={10} />
                        {totalDays}d
                    </span>
                    {offer.payment_type === 'milestone' ? (
                        <span className="flex items-center gap-1 text-[10px]">
                            <Layers size={10} />
                            {offer.milestones.length}m
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px]">
                            <CreditCard size={10} />
                            Full
                        </span>
                    )}
                </div>

                {/* CTA */}
                <a
                    href={`/offer/${offer.offer_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500"
                >
                    View Offer
                    <ExternalLink size={10} />
                </a>
            </div>
        </div>
    );
}

interface Conversation {
    id: number;
    user_id: number;
}

interface MessageStatusPayload {
    messages: Array<{
        id: number;
        delivered_at: string | null;
        read_at: string | null;
    }>;
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
        if (messages[index].sender_type === 'user') {
            return messages[index].id;
        }
    }

    return null;
}

function formatMessageTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

    const time = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    if (isToday) {
        return time;
    }

    return (
        date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ' · ' +
        time
    );
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

interface SupportWidgetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SupportWidget({
    isOpen,
    onOpenChange,
}: SupportWidgetProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const echoReady = useEchoReady();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [unread, setUnread] = useState(0);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentError, setAttachmentError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isAdminTyping, setIsAdminTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isOpenRef = useRef(isOpen);
    isOpenRef.current = isOpen;

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    // Initialize Conversation and seed unread count from server so the badge
    // is correct even for messages received while the user was offline.
    useEffect(() => {
        if (auth.user) {
            axios
                .post('/user-chat/init')
                .then((res) => {
                    setConversation(res.data.conversation);
                    setUnread(res.data.unread_count ?? 0);
                })
                .catch((e) => console.error('Failed to init chat', e));
        }
    }, [auth.user]);

    // Fetch Messages — always mark as read when opening so admin sees "Seen"
    // regardless of whether the local unread counter was tracking those messages.
    useEffect(() => {
        if (isOpen && conversation) {
            axios.get(`/user-chat/${conversation.id}/messages`).then((res) => {
                setMessages(res.data.data.reverse());
                setUnread(0);
                scrollToBottom();
                // Always call markAsRead; server is idempotent (no-ops if nothing to mark).
                axios
                    .post(`/user-chat/${conversation.id}/read`)
                    .catch(() => {});
            });
        }
    }, [isOpen, conversation, scrollToBottom]);

    // Ping server whenever the user is authenticated so admin knows they're online
    // and deferred delivery upgrades happen as soon as the user lands on the page.
    useEffect(() => {
        if (!conversation) {
            return;
        }

        const ping = () => axios.post('/user-chat/ping').catch(() => {});
        ping();
        const interval = setInterval(ping, 60_000);

        return () => clearInterval(interval);
    }, [conversation]);

    // Broadcast "offline" instantly on tab close, logout redirect, or Inertia navigation.
    // Uses sendBeacon so the request survives page unload; CSRF token is sent as form data.
    useEffect(() => {
        if (!conversation) {
            return;
        }

        const sendOffline = () => {
            const token =
                document.head
                    .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                    ?.getAttribute('content') ?? '';
            const body = new FormData();
            body.append('_token', token);
            navigator.sendBeacon('/user-chat/offline', body);
        };

        window.addEventListener('beforeunload', sendOffline);

        return () => {
            window.removeEventListener('beforeunload', sendOffline);
            // Also fire on Inertia navigation (component unmounts without beforeunload).
            sendOffline();
        };
    }, [conversation]);

    useEffect(() => {
        if (isAdminTyping) {
            scrollToBottom();
        }
    }, [isAdminTyping, scrollToBottom]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (!conversation) {
            return;
        }

        try {
            echo()
                .private(`conversations.${conversation.id}`)
                .whisper('typing', { typing: true });
        } catch {
            // noop
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            try {
                echo()
                    .private(`conversations.${conversation.id}`)
                    .whisper('typing', { typing: false });
            } catch {
                // noop
            }
        }, 2000);
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

            try {
                echo()
                    .private(`conversations.${conversation!.id}`)
                    .whisper('typing', { typing: false });
            } catch {
                // noop
            }

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
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

    const buttonVariants: Variants = {
        idle: {
            y: 0,
            scale: 1,
            rotate: 0,
            boxShadow: isOpen
                ? '0 4px 0 rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2)'
                : '0 6px 0 rgba(8,145,178,0.4), 0 12px 24px rgba(8,145,178,0.3)',
        },
        hover: {
            y: -4,
            scale: 1.05,
            rotate: isOpen ? 90 : 0,
            boxShadow: isOpen
                ? '0 8px 0 rgba(0,0,0,0.3), 0 12px 24px rgba(0,0,0,0.2)'
                : '0 10px 0 rgba(8,145,178,0.4), 0 16px 32px rgba(8,145,178,0.3)',
        },
        tap: {
            y: 4,
            scale: 0.95,
            boxShadow: isOpen
                ? '0 1px 0 rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
                : '0 2px 0 rgba(8,145,178,0.4), 0 4px 8px rgba(8,145,178,0.3)',
        },
    };

    const latestOutgoingMessageId = getLatestOutgoingMessageId(messages);

    return (
        <div className="fixed bottom-2 left-2 z-[55] flex flex-col items-start sm:left-5">
            {conversation && echoReady && (
                <SupportWidgetEchoListener
                    conversation={conversation}
                    setConversation={setConversation}
                    setMessages={setMessages}
                    setUnread={setUnread}
                    isOpenRef={isOpenRef}
                    scrollToBottom={scrollToBottom}
                    setIsAdminTyping={setIsAdminTyping}
                />
            )}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{
                            duration: 0.3,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        data-lenis-prevent
                        className="glass-panel mb-4 flex h-[min(520px,calc(100dvh-9rem))] w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-[2rem] border border-cyan-200/40 bg-background [background-image:linear-gradient(135deg,rgba(6,182,212,0.025)_0%,transparent_50%)] shadow-[0_0_0_1px_rgba(6,182,212,0.08),0_8px_24px_rgba(0,0,0,0.1),0_32px_64px_rgba(0,0,0,0.06)] sm:w-[360px] dark:border-cyan-800/25 dark:[background-image:linear-gradient(135deg,rgba(6,182,212,0.05)_0%,transparent_50%)] dark:shadow-[0_0_0_1px_rgba(6,182,212,0.15),0_8px_24px_rgba(0,0,0,0.45),0_32px_64px_rgba(0,0,0,0.3)]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-theme bg-theme-surface px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-500">
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-theme">
                                        Customer Support
                                    </h3>
                                    <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                                        Typically replies in minutes
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="text-theme-muted transition-colors hover:text-theme"
                                aria-label="Close chat"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto bg-theme-surface [background-image:linear-gradient(to_bottom,rgba(6,182,212,0.05)_0%,transparent_45%)] p-5 shadow-[inset_0_4px_10px_rgba(0,0,0,0.03)] dark:[background-image:linear-gradient(to_bottom,rgba(6,182,212,0.08)_0%,transparent_45%)] dark:shadow-[inset_0_4px_10px_rgba(0,0,0,0.12)]">
                            {messages.length === 0 && (
                                <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10">
                                        <MessageSquare className="h-6 w-6 text-cyan-500/60" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-theme">
                                            Start a conversation
                                        </p>
                                        <p className="mt-1 text-xs text-theme-muted">
                                            Our team typically replies in
                                            minutes.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {messages.map((msg, i) => {
                                const isOffer = !!msg.offer;
                                const isUser = msg.sender_type === 'user';
                                const prevMsg = messages[i - 1];
                                const nextMsg = messages[i + 1];
                                const isFirstInGroup =
                                    i === 0 ||
                                    isOffer ||
                                    !!prevMsg?.offer ||
                                    prevMsg?.sender_type !== msg.sender_type;
                                const isLastInGroup =
                                    i === messages.length - 1 ||
                                    isOffer ||
                                    !!nextMsg?.offer ||
                                    nextMsg?.sender_type !== msg.sender_type;

                                return (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            'flex flex-col',
                                            isUser
                                                ? 'items-end'
                                                : 'items-start',
                                            i === 0
                                                ? ''
                                                : isFirstInGroup
                                                  ? 'mt-3'
                                                  : 'mt-0.5',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                !msg.offer && 'max-w-[85%]',
                                            )}
                                        >
                                            {msg.offer ? (
                                                <OfferCard offer={msg.offer} />
                                            ) : (
                                                <div
                                                    className={cn(
                                                        '[max-width:fit-content] rounded-[18px] p-2.5 text-sm',
                                                        isUser
                                                            ? cn(
                                                                  'bg-linear-to-br from-cyan-500 via-cyan-600 to-indigo-500 text-white',
                                                                  'shadow-[0_2px_0_rgba(6,148,162,0.4),0_4px_10px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.25)]',
                                                                  !isFirstInGroup &&
                                                                      'rounded-tr-[5px]',
                                                                  !isLastInGroup &&
                                                                      'rounded-br-[5px]',
                                                              )
                                                            : cn(
                                                                  'border border-cyan-200/50 bg-cyan-50/70 text-theme dark:border-cyan-900/40 dark:bg-cyan-950/25',
                                                                  'shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]',
                                                                  !isFirstInGroup &&
                                                                      'rounded-tl-[5px]',
                                                                  !isLastInGroup &&
                                                                      'rounded-bl-[5px]',
                                                              ),
                                                    )}
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
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <FileText
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                )}
                                                            </span>
                                                            <span className="flex-1 truncate text-xs underline underline-offset-2">
                                                                Download
                                                                Attachment
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
                                        </div>
                                        {msg.sender_type === 'user' &&
                                        msg.id === latestOutgoingMessageId ? (
                                            <p className="mt-1 px-1 text-[11px] text-theme-subtle">
                                                {getMessageStatusLabel(msg)} ·{' '}
                                                {formatMessageTime(
                                                    msg.created_at,
                                                )}
                                            </p>
                                        ) : (
                                            isLastInGroup && (
                                                <p className="text-theme-subtle/60 mt-1 px-1 text-[10px]">
                                                    {formatMessageTime(
                                                        msg.created_at,
                                                    )}
                                                </p>
                                            )
                                        )}
                                    </div>
                                );
                            })}
                            {isAdminTyping && (
                                <div className="mt-3 flex flex-col items-start">
                                    <div className="[max-width:fit-content] rounded-[18px] rounded-tl-[5px] border border-cyan-200/50 bg-cyan-50/70 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-cyan-900/40 dark:bg-cyan-950/25 dark:shadow-[0_1px_4px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]">
                                        <div className="flex items-center gap-1">
                                            <span
                                                className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                                                style={{
                                                    animationDelay: '0ms',
                                                }}
                                            />
                                            <span
                                                className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                                                style={{
                                                    animationDelay: '160ms',
                                                }}
                                            />
                                            <span
                                                className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                                                style={{
                                                    animationDelay: '320ms',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-theme bg-theme-surface-hover p-4">
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
                                            className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2"
                                        >
                                            <Paperclip
                                                size={13}
                                                className="shrink-0 text-cyan-500"
                                            />
                                            <span className="flex-1 truncate text-xs text-theme-muted">
                                                {attachment.name}
                                            </span>
                                            <span className="shrink-0 text-[10px] text-theme-subtle">
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
                                                className="shrink-0 text-theme-muted transition hover:text-red-400"
                                            >
                                                <X size={14} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Message bar */}
                                <div className="relative">
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
                                        className={`absolute top-1/2 left-3 -translate-y-1/2 transition-colors ${attachment ? 'text-cyan-500' : 'text-theme-muted hover:text-cyan-500'}`}
                                    >
                                        <Paperclip size={18} />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={handleInputChange}
                                        placeholder="Type a message..."
                                        className="placeholder-theme-subtle w-full rounded-xl border border-theme bg-theme-surface py-3 pr-12 pl-10 text-sm text-theme focus:border-cyan-500/50 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={
                                            isSending ||
                                            (!newMessage.trim() && !attachment)
                                        }
                                        className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-cyan-500 text-white transition-colors hover:bg-cyan-600 disabled:opacity-40"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="mt-1 text-center text-[9px] font-bold tracking-[0.2em] text-theme-subtle uppercase">
                                    Direct Team Chat
                                </p>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle button */}
            <motion.button
                type="button"
                onClick={() => onOpenChange(!isOpen)}
                variants={buttonVariants}
                initial="idle"
                animate="idle"
                whileHover="hover"
                whileTap="tap"
                className={cn(
                    'relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 sm:h-16 sm:w-16',
                    isOpen
                        ? 'bg-foreground text-background ring-1 ring-white/10 ring-inset'
                        : 'bg-linear-to-br from-cyan-500 via-cyan-600 to-indigo-600 text-white ring-1 ring-cyan-400/40 ring-inset',
                )}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                {/* Surface Shine */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                    <div className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent opacity-50" />
                    <div className="absolute top-0 right-1/4 left-1/4 h-px bg-white/30 blur-[0.5px]" />
                </div>

                <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                        <motion.span
                            key="close-icon"
                            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                            transition={{
                                duration: 0.18,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="flex items-center justify-center"
                        >
                            <X className="h-6 w-6 drop-shadow-md sm:h-7 sm:w-7" />
                        </motion.span>
                    ) : (
                        <motion.span
                            key="chat-icon"
                            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                            transition={{
                                duration: 0.18,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="flex items-center justify-center"
                        >
                            <MessageSquare className="h-6 w-6 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] sm:h-7 sm:w-7" />
                        </motion.span>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {unread > 0 && !isOpen && (
                        <motion.span
                            key="unread-badge"
                            initial={{ scale: 0, y: 5 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0, y: 5 }}
                            transition={{
                                duration: 0.2,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="absolute -top-1.5 -right-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-[11px] font-black text-white shadow-[0_3px_0_#991b1b,0_6px_12px_rgba(239,68,68,0.4)] ring-2 ring-background"
                        >
                            {unread}
                        </motion.span>
                    )}
                    {unread === 0 && !isOpen && (
                        <motion.span
                            key="ping-dot"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 0.75, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute -top-0.5 -right-0.5 h-4 w-4 animate-ping rounded-full bg-cyan-400"
                        />
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}

interface EchoListenerProps {
    conversation: Conversation;
    setConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setUnread: React.Dispatch<React.SetStateAction<number>>;
    isOpenRef: React.MutableRefObject<boolean>;
    scrollToBottom: () => void;
    setIsAdminTyping: React.Dispatch<React.SetStateAction<boolean>>;
}

function SupportWidgetEchoListener({
    conversation,
    setConversation,
    setMessages,
    setUnread,
    isOpenRef,
    scrollToBottom,
    setIsAdminTyping,
}: EchoListenerProps) {
    const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    useEffect(() => {
        try {
            const channel = echo().private(`conversations.${conversation.id}`);

            channel.listenForWhisper('typing', (e: { typing: boolean }) => {
                setIsAdminTyping(e.typing);

                if (adminTypingTimeoutRef.current) {
                    clearTimeout(adminTypingTimeoutRef.current);
                }

                if (e.typing) {
                    adminTypingTimeoutRef.current = setTimeout(
                        () => setIsAdminTyping(false),
                        3000,
                    );
                }
            });

            return () => {
                try {
                    channel.stopListeningForWhisper('typing');
                } catch {
                    // noop
                }

                if (adminTypingTimeoutRef.current) {
                    clearTimeout(adminTypingTimeoutRef.current);
                }
            };
        } catch {
            // noop
        }
    }, [conversation.id, setIsAdminTyping]);

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
                    setIsAdminTyping(false);

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
                setIsAdminTyping,
                setMessages,
                setUnread,
            ],
        ),
    );

    useEcho<MessageStatusPayload>(
        `conversations.${conversation.id}`,
        'MessageStatusUpdated',
        useCallback(
            (e) => {
                setMessages((prev) => applyMessageStatuses(prev, e.messages));
            },
            [setMessages],
        ),
    );

    useEcho<{
        offer_id: number;
        status: Offer['status'];
        conversation_id: number;
    }>(
        `conversations.${conversation.id}`,
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
        `conversations.${conversation.id}`,
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
        `conversations.${conversation.id}`,
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

    // Admin deleted this conversation's history — clear it locally and start
    // a fresh conversation so the user can continue chatting.
    useEcho<{ conversation_id: number }>(
        `conversations.${conversation.id}`,
        'ConversationDeleted',
        useCallback(
            (e) => {
                if (e.conversation_id !== conversation.id) {
                    return;
                }

                setMessages([]);
                setUnread(0);

                axios
                    .post('/user-chat/init')
                    .then((res) => {
                        setConversation(res.data.conversation);
                    })
                    .catch(() => {});
            },
            [conversation.id, setConversation, setMessages, setUnread],
        ),
    );

    return null;
}
