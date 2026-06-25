import axios from 'axios';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    AlertTriangle,
    Banknote,
    Calendar,
    Eye,
    EyeOff,
    Loader2,
    Trash2,
    Wallet,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PendingPayment {
    id: string;
    service: string;
    plan: string;
    amount: string;
    currency: string;
    date: string | null;
    checkout_url: string;
}

interface PendingPaymentsModalProps {
    conversationId: number;
    userName: string;
    onClose: () => void;
}

function DeleteConfirmation({
    payment,
    conversationId,
    onCancel,
    onDeleted,
}: {
    payment: PendingPayment;
    conversationId: number;
    onCancel: () => void;
    onDeleted: (id: string) => void;
}) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setError(null);

        try {
            await axios.delete(
                `/admin/api/customer-conversations/${conversationId}/pending-payments/${payment.id}`,
                { data: { password } },
            );
            onDeleted(payment.id);
        } catch (err: unknown) {
            const message =
                (err as any)?.response?.data?.message ??
                'Failed to delete this pending payment.';
            setError(message);
            setProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                style={{
                    backdropFilter: 'blur(4px)',
                    background: 'rgba(0,0,0,0.6)',
                }}
                onClick={onCancel}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="relative w-full max-w-md overflow-hidden rounded-2xl"
                    style={{
                        background: 'linear-gradient(148deg, #0e1225, #090d1b)',
                        border: '1px solid rgba(239,68,68,0.35)',
                        boxShadow:
                            '0 0 0 1px rgba(239,68,68,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(239,68,68,0.14)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

                    <div
                        className="flex items-center justify-between px-4 py-2.5"
                        style={{
                            background:
                                'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(239,68,68,0.05))',
                            borderBottom: '1px solid rgba(239,68,68,0.18)',
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
                                ◈ Security Override
                            </span>
                        </div>
                        <button
                            onClick={onCancel}
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
                                    boxShadow: '0 0 20px rgba(239,68,68,0.12)',
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
                                    Delete Pending Payment
                                </h3>
                                <p className="mt-2 text-xs leading-relaxed text-white/55">
                                    This will permanently delete{' '}
                                    <span className="font-semibold text-white">
                                        {payment.service} ({payment.plan})
                                    </span>
                                    . The client will no longer see it as a
                                    pending payment. This cannot be undone.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-5">
                            <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-red-400/70 uppercase">
                                ◈ Admin Verification
                            </label>
                            <div className="group relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Your admin password"
                                    autoFocus
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-11 pl-4 text-sm text-white placeholder-white/20 transition-all duration-300 outline-none focus:border-red-500/50 focus:bg-red-500/5"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword((p) => !p)}
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

                            {error && (
                                <p className="mt-2 font-mono text-[10px] tracking-[0.1em] text-red-400">
                                    ◈ {error}
                                </p>
                            )}

                            <div className="mt-5 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    type="submit"
                                    disabled={processing || !password}
                                    whileHover={
                                        processing || !password
                                            ? undefined
                                            : { scale: 1.02 }
                                    }
                                    whileTap={
                                        processing || !password
                                            ? undefined
                                            : { scale: 0.98 }
                                    }
                                    className="relative flex-1 overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-br from-red-600 to-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_18px_rgba(239,68,68,0.28),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-red-400/50 hover:from-red-500 hover:to-rose-400 hover:shadow-[0_0_28px_rgba(239,68,68,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {!processing && (
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
                                        {processing ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            'Delete Payment'
                                        )}
                                    </span>
                                </motion.button>
                            </div>
                        </form>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/35 to-transparent" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function PendingPaymentsModal({
    conversationId,
    userName,
    onClose,
}: PendingPaymentsModalProps) {
    const [payments, setPayments] = useState<PendingPayment[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PendingPayment | null>(
        null,
    );

    useEffect(() => {
        let active = true;

        axios
            .get<PendingPayment[]>(
                `/admin/api/customer-conversations/${conversationId}/pending-payments`,
            )
            .then((res) => {
                if (active) {
                    setPayments(res.data);
                }
            })
            .catch(() => {
                if (active) {
                    setLoadError('Failed to load pending payments.');
                }
            });

        return () => {
            active = false;
        };
    }, [conversationId]);

    const handleDeleted = (id: string) => {
        setPayments((prev) => prev?.filter((p) => p.id !== id) ?? prev);
        setDeleteTarget(null);
    };

    const content = (
        <>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl"
                    style={{
                        maxHeight: '85vh',
                        background: 'linear-gradient(148deg, #0e1225, #090d1b)',
                        border: '1px solid rgba(124,58,237,0.35)',
                        boxShadow:
                            '0 0 0 1px rgba(124,58,237,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(124,58,237,0.14)',
                    }}
                >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/70 to-transparent" />

                    {/* Title bar */}
                    <div
                        className="flex shrink-0 items-center justify-between px-4 py-2.5"
                        style={{
                            background:
                                'linear-gradient(90deg, rgba(124,58,237,0.14), rgba(124,58,237,0.05))',
                            borderBottom: '1px solid rgba(124,58,237,0.18)',
                        }}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="flex gap-1.5">
                                <div
                                    className="h-2.5 w-2.5 rounded-full bg-violet-500"
                                    style={{
                                        boxShadow:
                                            '0 0 6px rgba(124,58,237,0.7)',
                                    }}
                                />
                                <div className="h-2.5 w-2.5 rounded-full bg-cyan-500/40" />
                                <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                            </div>
                            <span className="truncate font-mono text-[9px] tracking-[0.25em] text-violet-400/80 uppercase">
                                ◈ Pending Payments — {userName}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-violet-500/30 bg-violet-500/10 text-violet-400/60 transition-all hover:border-violet-400/60 hover:bg-violet-500/20 hover:text-violet-300"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        {payments === null && !loadError && (
                            <div className="flex items-center justify-center gap-2 py-10 text-xs text-white/40">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading…
                            </div>
                        )}

                        {loadError && (
                            <p className="py-10 text-center text-xs text-red-400">
                                {loadError}
                            </p>
                        )}

                        {payments?.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-10 text-center">
                                <Wallet className="h-8 w-8 text-violet-500/30" />
                                <p className="text-xs text-white/40">
                                    No pending payments for {userName}.
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            {payments?.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center gap-3 rounded-xl border border-violet-500/15 bg-white/[0.02] px-3 py-2.5"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                                        <Banknote className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-white">
                                            {payment.service}
                                            <span className="ml-1.5 font-normal text-white/40">
                                                · {payment.plan}
                                            </span>
                                        </p>
                                        <div className="mt-0.5 flex items-center gap-2.5 text-[10px] text-white/40">
                                            <span className="font-mono text-cyan-400/70">
                                                {payment.currency}{' '}
                                                {Number(
                                                    payment.amount,
                                                ).toLocaleString()}
                                            </span>
                                            {payment.date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-2.5 w-2.5" />
                                                    {payment.date}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDeleteTarget(payment)}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400/70 transition-all hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-400"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/35 to-transparent" />
                </motion.div>
            </div>

            {deleteTarget && (
                <DeleteConfirmation
                    payment={deleteTarget}
                    conversationId={conversationId}
                    onCancel={() => setDeleteTarget(null)}
                    onDeleted={handleDeleted}
                />
            )}
        </>
    );

    return createPortal(content, document.body);
}
