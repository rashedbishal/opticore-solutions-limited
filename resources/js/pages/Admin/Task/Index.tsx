import type { FormEvent, ReactNode } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    Briefcase,
    CheckCircle,
    Edit,
    Eye,
    EyeOff,
    Loader2,
    Plus,
    Radio,
    Trash2,
    X,
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

            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{
                            backdropFilter: 'blur(4px)',
                            background: 'rgba(0,0,0,0.6)',
                        }}
                        onClick={closeDeleteModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -10 }}
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 30,
                            }}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl"
                            style={{
                                background:
                                    'linear-gradient(148deg, #0e1225, #090d1b)',
                                border: '1px solid rgba(239,68,68,0.35)',
                                boxShadow:
                                    '0 0 0 1px rgba(239,68,68,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(239,68,68,0.14)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Top scan accent */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

                            {/* Title bar */}
                            <div
                                className="flex items-center justify-between px-4 py-2.5"
                                style={{
                                    background:
                                        'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(239,68,68,0.05))',
                                    borderBottom:
                                        '1px solid rgba(239,68,68,0.18)',
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    {/* Traffic lights */}
                                    <div className="flex gap-1.5">
                                        <div
                                            className="h-2.5 w-2.5 rounded-full bg-red-500"
                                            style={{
                                                boxShadow:
                                                    '0 0 6px rgba(239,68,68,0.7)',
                                            }}
                                        />
                                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                                    </div>
                                    <span className="font-mono text-[9px] tracking-[0.25em] text-red-400/80 uppercase">
                                        ◈ Security Override
                                    </span>
                                </div>
                                <button
                                    onClick={closeDeleteModal}
                                    className="flex h-5 w-5 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-400/60 transition-all hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-300"
                                >
                                    <X size={10} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-5 py-5">
                                <div className="flex items-start gap-4">
                                    <div
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                        style={{
                                            background: 'rgba(239,68,68,0.1)',
                                            border: '1px solid rgba(239,68,68,0.28)',
                                            boxShadow:
                                                '0 0 20px rgba(239,68,68,0.12)',
                                        }}
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.12, 1] }}
                                            transition={{
                                                duration: 1.8,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                        >
                                            <AlertTriangle className="h-5 w-5 text-red-400" />
                                        </motion.div>
                                    </div>

                                    <div className="flex-1">
                                        <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-red-400/70 uppercase">
                                            Irreversible Action
                                        </p>
                                        <h3 className="text-sm font-semibold text-white">
                                            Delete Task
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-white/55">
                                            This will permanently delete{' '}
                                            <span className="font-semibold text-white">
                                                {deleteTarget.task_name}
                                            </span>{' '}
                                            for {deleteTarget.client_name}. This
                                            cannot be undone.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={submitDelete} className="mt-5">
                                    <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-red-400/70 uppercase">
                                        ◈ Master Cipher Key
                                    </label>
                                    <div className="group relative">
                                        <input
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={deleteForm.data.password}
                                            onChange={(e) =>
                                                deleteForm.setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Mother admin password"
                                            autoFocus
                                            className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-11 pl-4 text-sm text-white placeholder-white/20 transition-all duration-300 outline-none focus:border-red-500/50 focus:bg-red-500/5"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() =>
                                                setShowPassword((p) => !p)
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-white/25 transition-colors hover:text-red-400"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-0 bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500 group-focus-within:w-full" />
                                    </div>

                                    {deleteForm.errors.password && (
                                        <p className="mt-2 font-mono text-[10px] tracking-[0.1em] text-red-400">
                                            ◈ {deleteForm.errors.password}
                                        </p>
                                    )}

                                    <div className="mt-5 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={closeDeleteModal}
                                            className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                                        >
                                            Abort
                                        </button>
                                        <motion.button
                                            type="submit"
                                            disabled={
                                                deleteForm.processing ||
                                                !deleteForm.data.password
                                            }
                                            whileHover={
                                                deleteForm.processing ||
                                                !deleteForm.data.password
                                                    ? undefined
                                                    : { scale: 1.02 }
                                            }
                                            whileTap={
                                                deleteForm.processing ||
                                                !deleteForm.data.password
                                                    ? undefined
                                                    : { scale: 0.98 }
                                            }
                                            className="relative flex-1 overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-br from-red-600 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(239,68,68,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-red-400/50 hover:from-red-500 hover:to-rose-400 hover:shadow-[0_0_28px_rgba(239,68,68,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {!deleteForm.processing && (
                                                <motion.div
                                                    animate={{
                                                        x: ['-120%', '220%'],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        repeatDelay: 1,
                                                        ease: 'easeInOut',
                                                    }}
                                                    className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                />
                                            )}
                                            <span className="relative flex items-center justify-center gap-2">
                                                {deleteForm.processing ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Purging...
                                                    </>
                                                ) : (
                                                    'Delete Task'
                                                )}
                                            </span>
                                        </motion.button>
                                    </div>
                                </form>
                            </div>

                            {/* Bottom accent */}
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/35 to-transparent" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
