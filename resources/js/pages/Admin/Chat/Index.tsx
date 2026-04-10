import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';
import { Link, useForm } from '@inertiajs/react';
import { MessageSquare, Trash2, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface ChatSession {
    id: number;
    session_id: string;
    title: string | null;
    messages_count: number;
    created_at: string;
}

interface Props {
    sessions: {
        data: ChatSession[];
        links: any[];
    };
}

export default function ChatIndex({ sessions }: Props) {
    const { delete: destroy } = useForm();

    const handleDelete = (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this chat session?')) {
            destroy(adminRoutes.chats.destroy.url(id));
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">AI Chat Archive</h1>

            <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
                <ul className="divide-y divide-white/10">
                    {sessions.data.map((session) => (
                        <li key={session.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-white/5 sm:px-6 transition-colors">
                            <div className="flex min-w-0 gap-x-4 items-center">
                                <div className="h-10 w-10 flex-none rounded-full bg-violet-600/20 text-violet-500 flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-auto">
                                    <p className="text-sm font-semibold leading-6 text-white">
                                        <Link href={adminRoutes.chats.show.url(session.id)}>
                                            <span className="absolute inset-x-0 -top-px bottom-0" />
                                            {session.title || `Session ${session.session_id.substring(0, 8)}...`}
                                        </Link>
                                    </p>
                                    <p className="mt-1 flex text-xs leading-5 text-zinc-400">
                                        {session.messages_count} messages • Started {new Date(session.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-x-4">
                                <button
                                    onClick={(e) => handleDelete(session.id, e)}
                                    className="relative z-10 text-red-400 hover:text-red-300 p-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <ChevronRight className="h-5 w-5 flex-none text-zinc-400" aria-hidden="true" />
                            </div>
                        </li>
                    ))}
                    {sessions.data.length === 0 && (
                        <li className="px-6 py-8 text-center text-zinc-500 text-sm">No chat sessions archived.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}

ChatIndex.layout = (page: ReactNode) => <AdminLayout title="Chat Archive">{page}</AdminLayout>;
