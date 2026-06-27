import type { ElementType, ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    Briefcase,
    Calendar,
    ChevronLeft,
    Download,
    FileText,
    Paperclip,
    ShoppingBag,
    Tag,
    User,
} from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import useEchoReady from '@/hooks/useEchoReady';
import adminRoutes from '@/routes/admin';

interface TaskAttachment {
    id: number;
    original_name: string;
    mime_type: string | null;
    size: number;
    download_url: string;
}

interface Task {
    id: number;
    client_name: string;
    client_email: string | null;
    category: string;
    sub_category: { id: number; name: string } | null;
    task_name: string;
    date: string | null;
    state: 'pending' | 'in progress' | 'delivered';
    order_number: string | null;
    image_url: string | null;
    notes: string | null;
    attachments: TaskAttachment[];
    created_at: string | null;
}

interface Props {
    task: Task;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATE_STYLES = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'in progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function TaskEchoListener({
    taskId,
    onStateChange,
}: {
    taskId: number;
    onStateChange: (state: Task['state']) => void;
}) {
    useEcho(
        'admin.tasks',
        'TaskUpdated',
        (e: { task: { id: number; state: Task['state'] } }) => {
            if (e.task.id === taskId) {
                onStateChange(e.task.state);
            }
        },
        [taskId, onStateChange],
    );

    return null;
}

export default function ShowTask({ task }: Props) {
    const echoReady = useEchoReady();
    const [state, setState] = useState<Task['state']>(task.state);

    return (
        <div className="space-y-6">
            {echoReady && (
                <TaskEchoListener taskId={task.id} onStateChange={setState} />
            )}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href={adminRoutes.tasks.index.url()}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-slate-400 transition-colors hover:bg-violet-500/10 hover:text-violet-400"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">
                        Task Details
                    </h1>
                </div>
                <Link
                    href={adminRoutes.tasks.edit.url(task.id)}
                    className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full"
                >
                    Edit Task
                </Link>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

                {/* Header strip */}
                <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5">
                    <div>
                        <p className="mb-1 font-mono text-[10px] tracking-[0.2em] text-violet-400/50 uppercase">
                            Task #{task.id}
                        </p>
                        <h2 className="text-lg font-semibold text-white">
                            {task.task_name}
                        </h2>
                    </div>
                    <span
                        className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase ${STATE_STYLES[state]}`}
                    >
                        {state}
                    </span>
                </div>

                <div className="space-y-6 p-6">
                    {/* Core fields grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {task.order_number && (
                            <Detail
                                icon={ShoppingBag}
                                label="Order Number"
                                value={task.order_number}
                                mono
                            />
                        )}
                        <Detail
                            icon={User}
                            label="Client"
                            value={task.client_name}
                            sub={task.client_email ?? undefined}
                        />
                        <Detail
                            icon={Tag}
                            label="Category"
                            value={task.category.replace(/-/g, ' ')}
                            sub={task.sub_category?.name}
                            capitalize
                        />
                        <Detail
                            icon={Calendar}
                            label="Date"
                            value={task.date ?? '—'}
                        />
                        {task.created_at && (
                            <Detail
                                icon={Calendar}
                                label="Created"
                                value={task.created_at}
                            />
                        )}
                    </div>

                    {/* Delivery image */}
                    {task.image_url && (
                        <div>
                            <SectionLabel
                                icon={Briefcase}
                                label="Delivery Image"
                            />
                            <img
                                src={task.image_url}
                                alt="Task delivery"
                                className="mt-2 h-48 w-auto rounded-lg object-cover"
                            />
                        </div>
                    )}

                    {/* Notes */}
                    {task.notes && (
                        <div>
                            <SectionLabel
                                icon={FileText}
                                label="Client Notes"
                            />
                            <div className="mt-2 rounded-lg border border-white/8 bg-white/4 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
                                {task.notes}
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {task.attachments.length > 0 && (
                        <div>
                            <SectionLabel
                                icon={Paperclip}
                                label={`Attachments (${task.attachments.length})`}
                            />
                            <ul className="mt-2 space-y-1.5">
                                {task.attachments.map((a) => (
                                    <li
                                        key={a.id}
                                        className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/4 px-4 py-2.5"
                                    >
                                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-violet-400/60" />
                                        <span className="flex-1 truncate text-sm text-zinc-300">
                                            {a.original_name}
                                        </span>
                                        <span className="shrink-0 text-xs text-zinc-500">
                                            {formatBytes(a.size)}
                                        </span>
                                        <a
                                            href={a.download_url}
                                            download
                                            className="shrink-0 rounded-md p-1 text-violet-400/60 transition-colors hover:bg-violet-500/10 hover:text-violet-400"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {!task.notes && task.attachments.length === 0 && (
                        <p className="font-mono text-xs tracking-[0.15em] text-violet-400/30 uppercase">
                            No notes or attachments submitted for this task.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionLabel({
    icon: Icon,
    label,
}: {
    icon: ElementType<{ className?: string }>;
    label: string;
}) {
    return (
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
            <Icon className="h-3 w-3" />
            {label}
        </div>
    );
}

function Detail({
    icon: Icon,
    label,
    value,
    sub,
    capitalize,
    mono,
}: {
    icon: ElementType<{ className?: string }>;
    label: string;
    value: string;
    sub?: string;
    capitalize?: boolean;
    mono?: boolean;
}) {
    return (
        <div className="rounded-lg border border-white/8 bg-white/4 px-4 py-3">
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] text-violet-400/50 uppercase">
                <Icon className="h-3 w-3" />
                {label}
            </div>
            <p
                className={`text-sm font-medium text-white ${capitalize ? 'capitalize' : ''} ${mono ? 'font-mono text-xs' : ''}`}
            >
                {value}
            </p>
            {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
        </div>
    );
}

ShowTask.layout = (page: ReactNode) => (
    <AdminLayout title="Task Details">{page}</AdminLayout>
);
