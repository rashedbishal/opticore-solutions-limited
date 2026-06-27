import axios from 'axios';
import { m as motion } from 'framer-motion';
import {
    Briefcase,
    ExternalLink,
    Hash,
    Loader2,
    ShoppingBag,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CurrentOrder {
    id: number;
    task_name: string;
    order_number: string | null;
    state: 'pending' | 'in progress';
    date: string | null;
}

interface CurrentOrdersModalProps {
    conversationId: number;
    userName: string;
    onClose: () => void;
}

const STATE_STYLES = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'in progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
} as const;

export default function CurrentOrdersModal({
    conversationId,
    userName,
    onClose,
}: CurrentOrdersModalProps) {
    const [orders, setOrders] = useState<CurrentOrder[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        axios
            .get<CurrentOrder[]>(
                `/admin/api/customer-conversations/${conversationId}/current-orders`,
            )
            .then((res) => {
                if (active) {
                    setOrders(res.data);
                }
            })
            .catch(() => {
                if (active) {
                    setLoadError('Failed to load current orders.');
                }
            });

        return () => {
            active = false;
        };
    }, [conversationId]);

    const content = (
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
                    border: '1px solid rgba(56,189,248,0.35)',
                    boxShadow:
                        '0 0 0 1px rgba(56,189,248,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(56,189,248,0.12)',
                }}
            >
                {/* Top scan line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

                {/* Title bar */}
                <div
                    className="flex shrink-0 items-center justify-between px-4 py-2.5"
                    style={{
                        background:
                            'linear-gradient(90deg, rgba(56,189,248,0.12), rgba(56,189,248,0.04))',
                        borderBottom: '1px solid rgba(56,189,248,0.15)',
                    }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="flex gap-1.5">
                            <div
                                className="h-2.5 w-2.5 rounded-full bg-cyan-400"
                                style={{
                                    boxShadow: '0 0 6px rgba(56,189,248,0.8)',
                                }}
                            />
                            <div className="h-2.5 w-2.5 rounded-full bg-violet-500/40" />
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                        </div>
                        <span className="truncate font-mono text-[9px] tracking-[0.25em] text-cyan-400/80 uppercase">
                            ◈ Current Orders — {userName}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400/60 transition-all hover:border-cyan-400/60 hover:bg-cyan-500/20 hover:text-cyan-300"
                    >
                        <X size={10} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {orders === null && !loadError && (
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

                    {orders?.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                            <ShoppingBag className="h-8 w-8 text-cyan-500/30" />
                            <p className="text-xs text-white/40">
                                No active orders for {userName}.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        {orders?.map((order) => (
                            <a
                                key={order.id}
                                href={`/admin/tasks/${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 rounded-xl border border-cyan-500/15 bg-white/[0.02] px-3 py-2.5 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                                    <Briefcase className="h-4 w-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-white">
                                        {order.task_name}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-2.5 text-[10px] text-white/40">
                                        {order.order_number ? (
                                            <span className="flex items-center gap-1 font-mono text-cyan-400/70">
                                                <Hash className="h-2.5 w-2.5" />
                                                {order.order_number}
                                            </span>
                                        ) : (
                                            <span className="text-white/25 italic">
                                                Manual task
                                            </span>
                                        )}
                                        {order.date && (
                                            <span>{order.date}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <span
                                        className={`rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-wider capitalize ${STATE_STYLES[order.state]}`}
                                    >
                                        {order.state}
                                    </span>
                                    <ExternalLink className="h-3.5 w-3.5 text-cyan-400/40 transition-colors group-hover:text-cyan-400/70" />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Bottom scan line */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent" />
            </motion.div>
        </div>
    );

    return createPortal(content, document.body);
}
