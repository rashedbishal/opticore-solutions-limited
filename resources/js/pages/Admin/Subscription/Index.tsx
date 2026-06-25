import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    Mail,
    Send,
    Trash2,
    ImageIcon,
    AlignLeft,
    X,
    AlertTriangle,
    Loader2,
} from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    offerEmail,
    customEmail,
} from '@/actions/App/Http/Controllers/Admin/SubscriptionController';
import AdminLayout from '@/components/Layout/AdminLayout';

interface SubscriptionRecord {
    id: number;
    email: string;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    subscriptions: {
        data: SubscriptionRecord[];
        links: PaginationLink[];
        total: number;
    };
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

export default function SubscriptionIndex({ subscriptions }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<SubscriptionRecord | null>(
        null,
    );

    const { delete: destroyForm, processing } = useForm();

    const hasPagination =
        subscriptions.links.filter((l) => l.url !== null).length > 2;

    function submitDelete() {
        if (!deleteTarget) {
            return;
        }

        destroyForm(destroy.url(deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <div className="space-y-8">
            {/* Action cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                    href={offerEmail.url()}
                    className="group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-[#060c1a]/80 p-6 backdrop-blur-sm transition-all duration-300 hover:border-violet-400/40 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]"
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                    <div className="flex items-start gap-4">
                        <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                background: 'rgba(124,58,237,0.12)',
                                border: '1px solid rgba(124,58,237,0.3)',
                                boxShadow: '0 0 24px rgba(124,58,237,0.15)',
                            }}
                        >
                            <ImageIcon className="h-5 w-5 text-violet-400" />
                        </div>
                        <div className="flex-1">
                            <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-violet-400/60 uppercase">
                                ◈ Broadcast
                            </p>
                            <h3 className="text-sm font-semibold text-white">
                                Prepare Broadcast Email
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                                Send a promotional image to all subscribers via
                                BCC.
                            </p>
                        </div>
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                </Link>

                <Link
                    href={customEmail.url()}
                    className="group relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#060c1a]/80 p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]"
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                    <div className="flex items-start gap-4">
                        <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                            style={{
                                background: 'rgba(6,182,212,0.1)',
                                border: '1px solid rgba(6,182,212,0.28)',
                                boxShadow: '0 0 24px rgba(6,182,212,0.12)',
                            }}
                        >
                            <AlignLeft className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                            <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-cyan-400/60 uppercase">
                                ◈ Compose
                            </p>
                            <h3 className="text-sm font-semibold text-white">
                                Prepare Custom Email
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                                Full email composer with To, CC, BCC, body, and
                                attachments.
                            </p>
                        </div>
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                </Link>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                    {subscriptions.total}{' '}
                    {subscriptions.total === 1 ? 'subscriber' : 'subscribers'}
                </p>
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Email
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase sm:table-cell">
                                Subscribed
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscriptions.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-6 py-16 text-center"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <Send className="h-8 w-8 text-violet-400/20" />
                                        <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                            No subscribers yet
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            subscriptions.data.map((sub) => (
                                <tr
                                    key={sub.id}
                                    className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                                style={{
                                                    background:
                                                        'rgba(124,58,237,0.1)',
                                                    border: '1px solid rgba(124,58,237,0.25)',
                                                }}
                                            >
                                                <Mail className="h-3.5 w-3.5 text-violet-400" />
                                            </div>
                                            <span className="text-sm text-white">
                                                {sub.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="hidden px-6 py-4 text-sm whitespace-nowrap text-zinc-500 sm:table-cell">
                                        {formatDate(sub.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button
                                            onClick={() => setDeleteTarget(sub)}
                                            className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">
                                                Remove
                                            </span>
                                        </button>
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
                    {subscriptions.links.map((link, i) => {
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
                        onClick={() => setDeleteTarget(null)}
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
                                        ◈ Remove Subscriber
                                    </span>
                                </div>
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex h-5 w-5 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-400/60 transition-all hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-300"
                                >
                                    <X size={10} />
                                </button>
                            </div>

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
                                        <AlertTriangle className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-red-400/70 uppercase">
                                            Irreversible Action
                                        </p>
                                        <h3 className="text-sm font-semibold text-white">
                                            Remove Subscriber
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-white/55">
                                            Remove{' '}
                                            <span className="font-semibold text-white">
                                                {deleteTarget.email}
                                            </span>{' '}
                                            from the subscription list?
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(null)}
                                        className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:before:translate-x-full"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        type="button"
                                        onClick={submitDelete}
                                        disabled={processing}
                                        whileHover={
                                            processing
                                                ? undefined
                                                : { scale: 1.02 }
                                        }
                                        whileTap={
                                            processing
                                                ? undefined
                                                : { scale: 0.98 }
                                        }
                                        className="relative flex-1 overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-br from-red-600 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(239,68,68,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:from-red-500 hover:to-rose-400 hover:shadow-[0_0_28px_rgba(239,68,68,0.5)] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span className="relative flex items-center justify-center gap-2">
                                            {processing ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Removing...
                                                </>
                                            ) : (
                                                'Remove'
                                            )}
                                        </span>
                                    </motion.button>
                                </div>
                            </div>

                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/35 to-transparent" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

SubscriptionIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Subscriptions">{page}</AdminLayout>
);
