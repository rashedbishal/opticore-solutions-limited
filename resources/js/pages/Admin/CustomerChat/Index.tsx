import type { ReactNode } from 'react';
import { useEcho } from '@laravel/echo-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    FileText,
    Image as ImageIcon,
    MessageSquare,
    Search,
    Send,
    Paperclip,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
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

interface Message {
    id: number;
    conversation_id: number;
    sender_type: 'user' | 'admin';
    message: string | null;
    attachment_path: string | null;
    attachment_type: string | null;
    delivered_at: string | null;
    read_at: string | null;
    created_at: string;
}

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
        } catch (error: any) {
            const msg =
                error?.response?.data?.message || 'Failed to send message.';
            setAttachmentError(msg);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border border-white/5 bg-white/5 shadow-2xl backdrop-blur-xl">
            {echoReady && (
                <AdminConversationEchoListener
                    activeConvRef={activeConvRef}
                    scrollToBottom={scrollToBottom}
                    setConversations={setConversations}
                    setFilteredConversations={setFilteredConversations}
                    setMessages={setMessages}
                    setOnlineUsers={setOnlineUsers}
                />
            )}
            {/* Sidebar List */}
            <div className="flex w-1/3 flex-col border-r border-white/5 bg-slate-900/50">
                <div className="border-b border-white/5 p-4">
                    <h2 className="mb-4 text-lg font-semibold text-white">
                        Customer Chats
                    </h2>
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="w-full rounded-xl border border-white/10 bg-black/20 py-2 pr-4 pl-10 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
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
                            className={`mb-1 flex w-full items-center rounded-xl p-3 text-left transition-colors ${
                                activeConv?.id === conv.id
                                    ? 'border border-cyan-500/30 bg-cyan-500/20'
                                    : 'border border-transparent hover:bg-white/5'
                            }`}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="flex min-w-0 items-center gap-1.5">
                                        {onlineUsers[conv.user_id] !==
                                            undefined && (
                                            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500" />
                                        )}
                                        <span className="truncate font-medium text-slate-200">
                                            {conv.user.name}
                                        </span>
                                    </span>
                                    {conv.last_message_at && (
                                        <span className="ml-2 shrink-0 text-xs text-slate-500">
                                            {new Date(
                                                conv.last_message_at,
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="truncate pr-2 text-sm text-slate-400">
                                        {conv.last_message || 'No messages yet'}
                                    </p>
                                    {conv.unread_count > 0 && (
                                        <span className="shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.button>
                    ))}
                    {filteredConversations.length === 0 && (
                        <div className="p-4 text-center text-sm text-slate-500">
                            {searchQuery
                                ? 'No users match your search'
                                : 'No conversations yet'}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex flex-1 flex-col bg-slate-900/30">
                {activeConv ? (
                    <>
                        <div className="flex items-center border-b border-white/5 bg-slate-900/50 p-4">
                            <div>
                                <h3 className="font-semibold text-white">
                                    {activeConv.user.name}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {activeConv.user.email}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            {messages.map((msg, idx) => (
                                <div
                                    key={`${msg.id}-${idx}`}
                                    className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className="max-w-[70%]">
                                        <div
                                            className={`rounded-2xl px-5 py-3 text-sm shadow-sm ${
                                                msg.sender_type === 'admin'
                                                    ? 'rounded-br-none bg-cyan-600 text-white'
                                                    : 'rounded-bl-none border border-white/5 bg-slate-800 text-slate-200'
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
                                                    {msg.message}
                                                </p>
                                            )}
                                        </div>
                                        {msg.sender_type === 'admin' &&
                                            msg.id ===
                                                latestOutgoingMessageId && (
                                                <p className="mt-1 px-1 text-right text-[11px] text-slate-500">
                                                    {getMessageStatusLabel(msg)}
                                                </p>
                                            )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="border-t border-white/5 bg-slate-900/50 p-4">
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
                                            className="absolute -top-12 left-0 z-10 flex w-fit items-center justify-between gap-4 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 shadow-xl"
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

                                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 p-1.5 transition-colors focus-within:border-cyan-500/50">
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
                                        onChange={(e) =>
                                            setNewMessage(e.target.value)
                                        }
                                        placeholder={`Reply to ${activeConv.user.name}...`}
                                        className="flex-1 border-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-0"
                                    />
                                    <button
                                        type="submit"
                                        disabled={
                                            isSending ||
                                            (!newMessage.trim() && !attachment)
                                        }
                                        className="transform rounded-full bg-cyan-600 p-2.5 text-white transition hover:bg-cyan-500 active:scale-95 disabled:opacity-50"
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
                    <div className="flex flex-1 flex-col items-center justify-center text-slate-500">
                        <MessageSquare
                            size={48}
                            className="mb-4 text-cyan-500/50 opacity-50"
                        />
                        <p>Select a conversation to start chatting</p>
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
}

function AdminConversationEchoListener({
    activeConvRef,
    scrollToBottom,
    setConversations,
    setFilteredConversations,
    setMessages,
    setOnlineUsers,
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
                                last_message: incoming.attachment_path
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
                            last_message: incoming.attachment_path
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

    return null;
}

Index.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
