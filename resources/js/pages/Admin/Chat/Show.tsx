import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Trash2, ArrowLeft, Bot, User } from 'lucide-react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

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
    created_at: string;
    messages: ChatMessage[];
}

interface Props {
    chatSession: ChatSession;
    sessions: Array<ChatSession & { messages_count: number }>;
}

export default function ChatShow({ chatSession, sessions }: Props) {
    const { delete: destroy } = useForm();

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this chat session?')) {
            destroy(adminRoutes.chats.destroy.url(id));
        }
    };

    return (
        <div className="flex h-[calc(100vh-130px)] overflow-hidden rounded-xl border border-white/10 bg-black">
            {/* Mailbox Left Sidebar */}
            <div className="flex w-1/3 flex-col border-r border-white/10 bg-zinc-950">
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <h2 className="text-lg font-semibold text-white">
                        History
                    </h2>
                    <Link
                        href={adminRoutes.chats.index.url()}
                        className="p-2 text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sessions.map((session) => (
                        <Link
                            key={session.id}
                            href={adminRoutes.chats.show.url(session.id)}
                            className={`block border-b border-white/5 p-4 transition-colors hover:bg-white/5 ${chatSession.id === session.id ? 'border-l-2 border-l-violet-500 bg-violet-600/10' : ''}`}
                        >
                            <p
                                className={`truncate text-sm font-semibold ${chatSession.id === session.id ? 'text-violet-400' : 'text-zinc-300'}`}
                            >
                                {session.title ||
                                    `Session ${session.session_id.substring(0, 8)}`}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                                {session.messages_count} messages •{' '}
                                {new Date(
                                    session.created_at,
                                ).toLocaleDateString()}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col bg-zinc-900/50">
                {/* Chat Header */}
                <div className="z-10 flex items-center justify-between border-b border-white/10 bg-zinc-950/50 p-4 shadow-sm">
                    <div>
                        <h2 className="text-lg font-bold text-white">
                            {chatSession.title ||
                                `Session: ${chatSession.session_id}`}
                        </h2>
                        <p className="text-xs text-zinc-400">
                            Started at{' '}
                            {new Date(chatSession.created_at).toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={() => handleDelete(chatSession.id)}
                        className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/20"
                    >
                        <Trash2 className="h-4 w-4" /> Delete
                    </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 space-y-6 overflow-y-auto p-6">
                    {chatSession.messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.sender === 'user' ? 'bg-violet-600/20 text-violet-400' : 'bg-emerald-600/20 text-emerald-400'}`}
                            >
                                {msg.sender === 'user' ? (
                                    <User className="h-5 w-5" />
                                ) : (
                                    <Bot className="h-5 w-5" />
                                )}
                            </div>
                            <div
                                className={`max-w-[75%] rounded-2xl p-4 text-sm ${msg.sender === 'user' ? 'rounded-tr-sm bg-violet-600 text-white' : 'rounded-tl-sm border border-white/5 bg-zinc-800 text-zinc-200'}`}
                            >
                                <p className="whitespace-pre-wrap">
                                    {msg.content}
                                </p>
                                <p
                                    className={`mt-2 text-[10px] opacity-50 ${msg.sender === 'user' ? 'text-right text-violet-200' : 'text-left text-zinc-400'}`}
                                >
                                    {new Date(
                                        msg.created_at,
                                    ).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    {chatSession.messages.length === 0 && (
                        <div className="mt-20 text-center text-zinc-500">
                            No messages in this session.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

ChatShow.layout = (page: ReactNode) => (
    <AdminLayout title="Chat Details">{page}</AdminLayout>
);
