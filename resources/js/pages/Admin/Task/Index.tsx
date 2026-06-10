import type { FormEvent, ReactNode } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Briefcase,
    CheckCircle,
    Edit,
    Eye,
    EyeOff,
    Plus,
    Radio,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import RealtimeTableListener from '@/components/Admin/RealtimeTableListener';
import AdminLayout from '@/components/Layout/AdminLayout';
import useEchoReady from '@/hooks/useEchoReady';
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
    const echoReady = useEchoReady();
    const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [deliveryTarget, setDeliveryTarget] = useState<number | null>(null);
    const [showDeliveryPassword, setShowDeliveryPassword] = useState(false);

    const deleteForm = useForm<{ password: string }>({ password: '' });
    const deliveryForm = useForm<{ state: string; password: string }>({
        state: 'delivered',
        password: '',
    });

    const openDeleteFlow = (task: Task) => {
        deleteForm.reset();
        deleteForm.clearErrors();
        setShowPassword(false);
        setDeleteTarget(task);
    };

    const closeDeleteModal = () => {
        setDeleteTarget(null);
        deleteForm.reset();
        deleteForm.clearErrors();
        setShowPassword(false);
    };

    const submitDelete = (e: FormEvent) => {
        e.preventDefault();

        if (!deleteTarget) {
            return;
        }

        deleteForm.delete(adminRoutes.tasks.destroy.url(deleteTarget.id), {
            preserveScroll: true,
            onSuccess: closeDeleteModal,
        });
    };

    const closeDeliveryModal = () => {
        setDeliveryTarget(null);
        deliveryForm.reset();
        deliveryForm.clearErrors();
        setShowDeliveryPassword(false);
    };

    const submitDelivery = (e: FormEvent) => {
        e.preventDefault();

        if (deliveryTarget === null) {
            return;
        }

        deliveryForm.put(adminRoutes.tasks.update.url(deliveryTarget), {
            preserveScroll: true,
            onSuccess: closeDeliveryModal,
        });
    };

    const hasPagination = tasks.links.filter((l) => l.url !== null).length > 2;

    const handleStateChange = (id: number, newState: string) => {
        if (newState === 'delivered') {
            deliveryForm.reset();
            deliveryForm.clearErrors();
            setShowDeliveryPassword(false);
            setDeliveryTarget(id);

            return;
        }

        router.put(
            adminRoutes.tasks.update.url(id),
            { state: newState },
            { preserveScroll: true },
        );
    };

    return (
        <div className="space-y-6">
            {echoReady && (
                <RealtimeTableListener
                    channel="admin.tasks"
                    event="TaskCreated"
                    only={['tasks']}
                />
            )}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">
                        Client Workflow Management
                    </h1>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-emerald-400/60 uppercase">
                        <Radio className="h-3 w-3 animate-pulse" />
                        Live
                    </span>
                </div>
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
                                            onClick={() => openDeleteFlow(task)}
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

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/20 bg-[#060c1a] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">
                                    Delete Task
                                </h3>
                                <p className="text-xs text-zinc-500">
                                    This action is permanent
                                </p>
                            </div>
                        </div>

                        <p className="mb-4 text-sm text-zinc-300">
                            This will permanently delete{' '}
                            <span className="font-semibold text-white">
                                {deleteTarget.task_name}
                            </span>{' '}
                            for {deleteTarget.client_name}. This cannot be
                            undone. Enter the mother admin password to confirm.
                        </p>

                        <form onSubmit={submitDelete}>
                            <div className="relative mb-4">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={deleteForm.data.password}
                                    onChange={(e) =>
                                        deleteForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Mother admin password"
                                    autoFocus
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-10 pl-4 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-red-500/50 focus:bg-red-500/5"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                                {deleteForm.errors.password && (
                                    <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                        {deleteForm.errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        deleteForm.processing ||
                                        !deleteForm.data.password
                                    }
                                    className="relative flex-1 overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-br from-red-600 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(239,68,68,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-red-400/50 hover:from-red-500 hover:to-rose-400 hover:shadow-[0_0_28px_rgba(239,68,68,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] hover:before:translate-x-full disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deleteForm.processing
                                        ? 'Deleting...'
                                        : 'Delete Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deliveryTarget !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/20 bg-[#060c1a] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">
                                    Confirm Delivery
                                </h3>
                                <p className="text-xs text-zinc-500">
                                    This notifies the client
                                </p>
                            </div>
                        </div>

                        <p className="mb-4 text-sm text-zinc-300">
                            Marking this task as delivered will notify the
                            client and start their 24-hour review window. Enter
                            your admin password to confirm.
                        </p>

                        <form onSubmit={submitDelivery}>
                            <div className="relative mb-4">
                                <input
                                    type={
                                        showDeliveryPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={deliveryForm.data.password}
                                    onChange={(e) =>
                                        deliveryForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Your admin password"
                                    autoFocus
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-10 pl-4 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowDeliveryPassword((p) => !p)
                                    }
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                >
                                    {showDeliveryPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                                {deliveryForm.errors.password && (
                                    <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                        {deliveryForm.errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeDeliveryModal}
                                    className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        deliveryForm.processing ||
                                        !deliveryForm.data.password
                                    }
                                    className="relative flex-1 overflow-hidden rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(16,185,129,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-emerald-400/50 hover:from-emerald-500 hover:to-teal-400 hover:shadow-[0_0_28px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] hover:before:translate-x-full disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deliveryForm.processing
                                        ? 'Confirming...'
                                        : 'Mark as Delivered'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

TaskIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Client Workflow Management" fullWidth>
        {page}
    </AdminLayout>
);
