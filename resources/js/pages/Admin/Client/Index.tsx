import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    EyeOff,
    Loader2,
    MessageSquare,
    Phone,
    Trash2,
    UserX,
    Workflow,
    X,
} from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface ClientRecord {
    id: number;
    name: string;
    email: string;
    original_email: string | null;
    phone_number: string | null;
    avatar: string | null;
    role: string;
    created_at: string;
    email_verified_at: string | null;
    deleted_at: string | null;
    conversations_count: number;
    tasks_count: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    clients: {
        data: ClientRecord[];
        links: PaginationLink[];
        total: number;
    };
}

const AVATAR_GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-700',
];

function avatarGradient(name: string): string {
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
}

type DeleteStep = 'warning' | 'password';

interface DeleteState {
    client: ClientRecord;
    step: DeleteStep;
}

export default function ClientIndex({ clients }: Props) {
    const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const {
        delete: destroy,
        data,
        setData,
        processing,
        errors,
        reset,
    } = useForm({ password: '' });

    const hasPagination =
        clients.links.filter((l) => l.url !== null).length > 2;

    function openDeleteFlow(client: ClientRecord) {
        reset();
        setShowPassword(false);
        const hasRelated =
            client.conversations_count > 0 || client.tasks_count > 0;
        setDeleteState({ client, step: hasRelated ? 'warning' : 'password' });
    }

    function closeModal() {
        setDeleteState(null);
        reset();
        setShowPassword(false);
    }

    function proceedToPassword() {
        if (deleteState) {
            setDeleteState({ ...deleteState, step: 'password' });
        }
    }

    function submitDelete(e: React.FormEvent) {
        e.preventDefault();

        if (!deleteState) {
            return;
        }

        destroy(adminRoutes.clients.destroy.url(deleteState.client.id), {
            onSuccess: closeModal,
        });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                    {clients.total} {clients.total === 1 ? 'client' : 'clients'}{' '}
                    registered
                </p>
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Client
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase md:table-cell">
                                Phone
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase sm:table-cell">
                                Activity
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase sm:table-cell">
                                Status
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase lg:table-cell">
                                Joined
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-16 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                        No records found
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            clients.data.map((client) => (
                                <tr
                                    key={client.id}
                                    className={`border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5 ${client.deleted_at ? 'opacity-60' : ''}`}
                                >
                                    {/* Client */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {client.avatar ? (
                                                <img
                                                    src={client.avatar}
                                                    alt={client.name}
                                                    loading="lazy"
                                                    decoding="async"
                                                    width={36}
                                                    height={36}
                                                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(client.name)} text-xs font-bold text-white`}
                                                >
                                                    {getInitials(client.name)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-white">
                                                    {client.name}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-zinc-500">
                                                    {client.original_email ??
                                                        client.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Phone */}
                                    <td className="hidden px-6 py-4 md:table-cell">
                                        {client.phone_number ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-zinc-300">
                                                <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                                {client.phone_number}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    {/* Activity */}
                                    <td className="hidden px-6 py-4 sm:table-cell">
                                        <div className="flex flex-wrap gap-2">
                                            {client.conversations_count > 0 && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400">
                                                    <MessageSquare className="h-3 w-3" />
                                                    {client.conversations_count}{' '}
                                                    chat
                                                    {client.conversations_count !==
                                                        1 && 's'}
                                                </span>
                                            )}
                                            {client.tasks_count > 0 && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400">
                                                    <Workflow className="h-3 w-3" />
                                                    {client.tasks_count}{' '}
                                                    workflow
                                                    {client.tasks_count !== 1 &&
                                                        's'}
                                                </span>
                                            )}
                                            {client.conversations_count === 0 &&
                                                client.tasks_count === 0 && (
                                                    <span className="text-xs text-zinc-600">
                                                        No activity
                                                    </span>
                                                )}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="hidden px-6 py-4 sm:table-cell">
                                        <div className="flex flex-col gap-1.5">
                                            {client.deleted_at && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                                                    <UserX className="h-3 w-3" />
                                                    Deleted
                                                </span>
                                            )}
                                            {!client.deleted_at &&
                                                (client.email_verified_at ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                                                        <Clock className="h-3 w-3" />
                                                        Unverified
                                                    </span>
                                                ))}
                                        </div>
                                    </td>

                                    {/* Joined */}
                                    <td className="hidden px-6 py-4 text-sm whitespace-nowrap text-zinc-500 lg:table-cell">
                                        {formatDate(client.created_at)}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link
                                                href={adminRoutes.clients.show.url(
                                                    client.id,
                                                )}
                                                className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-violet-400/70 transition-colors hover:text-violet-300"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">
                                                    View
                                                </span>
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    openDeleteFlow(client)
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {hasPagination && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {clients.links.map((link, i) => {
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
                            <a
                                key={i}
                                href={link.url}
                                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                                    link.active
                                        ? 'border border-violet-500/30 bg-violet-500/10 text-violet-300'
                                        : 'border border-white/8 bg-white/4 text-zinc-400 hover:bg-white/8'
                                }`}
                            >
                                {label}
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Delete Modal */}
            <AnimatePresence>
                {deleteState && (
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
                        onClick={closeModal}
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
                                border:
                                    deleteState.step === 'warning'
                                        ? '1px solid rgba(245,158,11,0.35)'
                                        : '1px solid rgba(239,68,68,0.35)',
                                boxShadow:
                                    deleteState.step === 'warning'
                                        ? '0 0 0 1px rgba(245,158,11,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(245,158,11,0.14)'
                                        : '0 0 0 1px rgba(239,68,68,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(239,68,68,0.14)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Top scan accent */}
                            <div
                                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
                                    deleteState.step === 'warning'
                                        ? 'via-amber-500/70'
                                        : 'via-red-500/70'
                                }`}
                            />

                            {/* Title bar */}
                            <div
                                className="flex items-center justify-between px-4 py-2.5"
                                style={{
                                    background:
                                        deleteState.step === 'warning'
                                            ? 'linear-gradient(90deg, rgba(245,158,11,0.14), rgba(245,158,11,0.05))'
                                            : 'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(239,68,68,0.05))',
                                    borderBottom:
                                        deleteState.step === 'warning'
                                            ? '1px solid rgba(245,158,11,0.18)'
                                            : '1px solid rgba(239,68,68,0.18)',
                                }}
                            >
                                <div className="flex items-center gap-2.5">
                                    {/* Traffic lights */}
                                    <div className="flex gap-1.5">
                                        <div
                                            className={`h-2.5 w-2.5 rounded-full ${
                                                deleteState.step === 'warning'
                                                    ? 'bg-amber-500'
                                                    : 'bg-red-500'
                                            }`}
                                            style={{
                                                boxShadow:
                                                    deleteState.step ===
                                                    'warning'
                                                        ? '0 0 6px rgba(245,158,11,0.7)'
                                                        : '0 0 6px rgba(239,68,68,0.7)',
                                            }}
                                        />
                                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                                    </div>
                                    <span
                                        className={`font-mono text-[9px] tracking-[0.25em] uppercase ${
                                            deleteState.step === 'warning'
                                                ? 'text-amber-400/80'
                                                : 'text-red-400/80'
                                        }`}
                                    >
                                        {deleteState.step === 'warning'
                                            ? '◈ Data Loss Warning'
                                            : '◈ Security Override'}
                                    </span>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                                        deleteState.step === 'warning'
                                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400/60 hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-amber-300'
                                            : 'border-red-500/30 bg-red-500/10 text-red-400/60 hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-300'
                                    }`}
                                >
                                    <X size={10} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-5 py-5">
                                {deleteState.step === 'warning' ? (
                                    <>
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                                style={{
                                                    background:
                                                        'rgba(245,158,11,0.1)',
                                                    border: '1px solid rgba(245,158,11,0.28)',
                                                    boxShadow:
                                                        '0 0 20px rgba(245,158,11,0.12)',
                                                }}
                                            >
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.12, 1],
                                                    }}
                                                    transition={{
                                                        duration: 1.8,
                                                        repeat: Infinity,
                                                        ease: 'easeInOut',
                                                    }}
                                                >
                                                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                                                </motion.div>
                                            </div>

                                            <div className="flex-1">
                                                <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-amber-400/70 uppercase">
                                                    Cascading Deletion
                                                </p>
                                                <h3 className="text-sm font-semibold text-white">
                                                    Delete Client
                                                </h3>
                                                <p className="mt-0.5 font-mono text-xs text-zinc-500">
                                                    {deleteState.client.name}
                                                </p>
                                                <p className="mt-2 text-xs leading-relaxed text-white/55">
                                                    This client has existing
                                                    data that will also be
                                                    permanently deleted:
                                                </p>
                                            </div>
                                        </div>

                                        <ul className="mt-4 space-y-2">
                                            {deleteState.client
                                                .conversations_count > 0 && (
                                                <li className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300">
                                                    <MessageSquare className="h-4 w-4 shrink-0" />
                                                    {
                                                        deleteState.client
                                                            .conversations_count
                                                    }{' '}
                                                    chat conversation
                                                    {deleteState.client
                                                        .conversations_count !==
                                                        1 && 's'}{' '}
                                                    (including all messages and
                                                    offers)
                                                </li>
                                            )}
                                            {deleteState.client.tasks_count >
                                                0 && (
                                                <li className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-300">
                                                    <Workflow className="h-4 w-4 shrink-0" />
                                                    {
                                                        deleteState.client
                                                            .tasks_count
                                                    }{' '}
                                                    workflow
                                                    {deleteState.client
                                                        .tasks_count !== 1 &&
                                                        's'}
                                                </li>
                                            )}
                                        </ul>

                                        <p className="mt-4 font-mono text-[9px] tracking-[0.22em] text-amber-400/60 uppercase">
                                            ◈ This action cannot be reversed
                                        </p>

                                        <div className="mt-5 flex gap-3">
                                            <button
                                                onClick={closeModal}
                                                className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                                            >
                                                Cancel
                                            </button>
                                            <motion.button
                                                onClick={proceedToPassword}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="relative flex-1 overflow-hidden rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-600 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(245,158,11,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-amber-400/50 hover:from-amber-500 hover:to-orange-400 hover:shadow-[0_0_28px_rgba(245,158,11,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]"
                                            >
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
                                                <span className="relative">
                                                    Proceed Anyway
                                                </span>
                                            </motion.button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                                style={{
                                                    background:
                                                        'rgba(239,68,68,0.1)',
                                                    border: '1px solid rgba(239,68,68,0.28)',
                                                    boxShadow:
                                                        '0 0 20px rgba(239,68,68,0.12)',
                                                }}
                                            >
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.12, 1],
                                                    }}
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
                                                    Delete Client
                                                </h3>
                                                <p className="mt-2 text-xs leading-relaxed text-white/55">
                                                    Enter your admin password to
                                                    permanently delete{' '}
                                                    <span className="font-semibold text-white">
                                                        {
                                                            deleteState.client
                                                                .name
                                                        }
                                                    </span>{' '}
                                                    and all associated data.
                                                </p>
                                            </div>
                                        </div>

                                        <form
                                            onSubmit={submitDelete}
                                            className="mt-5"
                                        >
                                            <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-red-400/70 uppercase">
                                                ◈ Admin Cipher Key
                                            </label>
                                            <div className="group relative">
                                                <input
                                                    type={
                                                        showPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    value={data.password}
                                                    onChange={(e) =>
                                                        setData(
                                                            'password',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Your admin password"
                                                    autoFocus
                                                    className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-11 pl-4 text-sm text-white placeholder-white/20 transition-all duration-300 outline-none focus:border-red-500/50 focus:bg-red-500/5"
                                                />
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    onClick={() =>
                                                        setShowPassword(
                                                            (p) => !p,
                                                        )
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

                                            {errors.password && (
                                                <p className="mt-2 font-mono text-[10px] tracking-[0.1em] text-red-400">
                                                    ◈ {errors.password}
                                                </p>
                                            )}

                                            <div className="mt-5 flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={closeModal}
                                                    className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                                                >
                                                    Abort
                                                </button>
                                                <motion.button
                                                    type="submit"
                                                    disabled={
                                                        processing ||
                                                        !data.password
                                                    }
                                                    whileHover={
                                                        processing ||
                                                        !data.password
                                                            ? undefined
                                                            : { scale: 1.02 }
                                                    }
                                                    whileTap={
                                                        processing ||
                                                        !data.password
                                                            ? undefined
                                                            : { scale: 0.98 }
                                                    }
                                                    className="relative flex-1 overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-br from-red-600 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(239,68,68,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-red-400/50 hover:from-red-500 hover:to-rose-400 hover:shadow-[0_0_28px_rgba(239,68,68,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {!processing && (
                                                        <motion.div
                                                            animate={{
                                                                x: [
                                                                    '-120%',
                                                                    '220%',
                                                                ],
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
                                                        {processing ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Purging...
                                                            </>
                                                        ) : (
                                                            'Delete Client'
                                                        )}
                                                    </span>
                                                </motion.button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>

                            {/* Bottom accent */}
                            <div
                                className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent ${
                                    deleteState.step === 'warning'
                                        ? 'via-amber-500/35'
                                        : 'via-red-500/35'
                                }`}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

ClientIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Clients">{page}</AdminLayout>
);
