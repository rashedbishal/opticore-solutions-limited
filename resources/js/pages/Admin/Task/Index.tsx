import type { ReactNode } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { Edit, Plus, Trash2, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Task {
    id: number;
    client_name: string;
    client_email: string | null;
    category: string;
    sub_category?: {
        id: number;
        name: string;
    } | null;
    task_name: string;
    date: string | null;
    state: 'pending' | 'in progress' | 'delivered';
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    tasks: {
        data: Task[];
        links: PaginationLink[];
    };
}

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
}

export default function TaskIndex({ tasks }: Props) {
    const { delete: destroy } = useForm();
    const [deleteTarget, setDeleteTarget] = useState<(() => void) | null>(null);
    const requestDelete = (action: () => void) => setDeleteTarget(() => action);
    const confirmDelete = () => {
        deleteTarget?.();
        setDeleteTarget(null);
    };
    const cancelDelete = () => setDeleteTarget(null);

    const handleDelete = (id: number) => {
        requestDelete(() => {
            destroy(adminRoutes.tasks.destroy.url(id));
        });
    };

    const hasPagination = tasks.links.filter((l) => l.url !== null).length > 2;

    const handleStateChange = (id: number, newState: string) => {
        router.put(
            adminRoutes.tasks.update.url(id),
            { state: newState },
            { preserveScroll: true },
        );
    };

    return (
        <div className="space-y-6">
            <CmsDeleteDialog
                open={deleteTarget !== null}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">
                    Client Workflow Management
                </h1>
                <Link
                    href={adminRoutes.tasks.create.url()}
                    className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full"
                >
                    <Plus className="h-4 w-4" /> Add Task
                </Link>
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Client
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Task Info
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.data.map((task) => (
                            <tr
                                key={task.id}
                                className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white">
                                            {task.client_name}
                                        </span>
                                        <span className="text-xs text-zinc-400">
                                            {task.client_email}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-zinc-500" />
                                        <span className="text-sm text-white">
                                            {task.task_name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-zinc-300 capitalize">
                                            {task.category.replace(/-/g, ' ')}
                                        </span>
                                        {task.sub_category && (
                                            <span className="text-xs text-zinc-500">
                                                {task.sub_category.name}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-300">
                                    {task.date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={task.state}
                                        onChange={(e) =>
                                            handleStateChange(
                                                task.id,
                                                e.target.value,
                                            )
                                        }
                                        className={`w-32 rounded-lg border border-white/8 bg-[#060c1a] px-3 py-1.5 text-sm font-medium outline-none focus:border-violet-500/50 ${
                                            task.state === 'pending'
                                                ? 'text-yellow-400'
                                                : task.state === 'in progress'
                                                  ? 'text-blue-400'
                                                  : 'text-emerald-400'
                                        }`}
                                    >
                                        <option
                                            value="pending"
                                            className="text-white"
                                        >
                                            Pending
                                        </option>
                                        <option
                                            value="in progress"
                                            className="text-white"
                                        >
                                            In Progress
                                        </option>
                                        <option
                                            value="delivered"
                                            className="text-white"
                                        >
                                            Delivered
                                        </option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link
                                            href={adminRoutes.tasks.edit.url(
                                                task.id,
                                            )}
                                            className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/70 transition-colors hover:text-cyan-300"
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">
                                                Edit
                                            </span>
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleDelete(task.id)
                                            }
                                            className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">
                                                Delete
                                            </span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {tasks.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-16 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                        No tasks found
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {hasPagination && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {tasks.links.map((link, i) => {
                        const label = decodePaginationLabel(link.label);

                        if (!link.url) {
                            return (
                                <span
                                    key={i}
                                    className="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm text-zinc-600"
                                >
                                    {label}
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={i}
                                href={link.url}
                                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                                    link.active
                                        ? 'border border-violet-500/30 bg-violet-500/10 text-violet-300'
                                        : 'border border-white/8 bg-white/4 text-zinc-400 hover:bg-white/8'
                                }`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

TaskIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Client Workflow Management">{page}</AdminLayout>
);
