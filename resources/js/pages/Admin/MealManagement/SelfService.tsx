import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { m as motion } from 'framer-motion';
import {
    CalendarOff,
    CheckCircle2,
    Clock,
    Loader2,
    ThumbsDown,
    ThumbsUp,
    UtensilsCrossed,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import MealManagementController from '@/actions/App/Http/Controllers/Admin/MealManagementController';
import AdminLayout from '@/components/Layout/AdminLayout';

interface Props {
    today: string;
    todaysItem: string | null;
    blockedReason: string | null;
    isConfigured: boolean;
    isOpen: boolean;
    isLocked: boolean;
    acceptStartTime: string | null;
    lockTime: string | null;
    selection: {
        status: 'accepted' | 'declined';
        is_auto_declined: boolean;
        decided_at: string | null;
    } | null;
}

const CARD =
    'relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-8 backdrop-blur-sm';
const CARD_ACCENT =
    'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent';
const LABEL =
    'mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase';

function formatTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    const [h, m] = value.split(':');
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;

    return `${displayHour}:${m} ${suffix}`;
}

export default function MealManagementSelfService({
    todaysItem,
    blockedReason,
    isConfigured,
    isOpen,
    selection,
    acceptStartTime,
    lockTime,
}: Props) {
    const [pendingStatus, setPendingStatus] = useState<
        'accepted' | 'declined' | null
    >(null);

    const submit = (status: 'accepted' | 'declined') => {
        setPendingStatus(status);
        router.post(
            MealManagementController.select.url(),
            { status },
            {
                preserveScroll: true,
                onFinish: () => setPendingStatus(null),
            },
        );
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className={CARD}>
                <div className={CARD_ACCENT} />
                <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold text-white">
                    <UtensilsCrossed className="h-4 w-4 text-violet-400" />{' '}
                    Today&rsquo;s Lunch
                </h2>

                {blockedReason ? (
                    <div className="flex items-start gap-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
                        <CalendarOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                        <div>
                            <p className="text-sm font-semibold text-amber-200">
                                No lunch selection today
                            </p>
                            <p className="mt-1 text-xs text-amber-300/70">
                                {blockedReason}
                            </p>
                        </div>
                    </div>
                ) : !isConfigured ? (
                    <p className="text-sm text-zinc-400">
                        Mother admin hasn&rsquo;t configured the selection
                        window yet. Check back later.
                    </p>
                ) : (
                    <>
                        <div className="mb-6">
                            <span className={LABEL}>Meal Item</span>
                            <p className="text-lg font-semibold text-white">
                                {todaysItem || 'Not set yet'}
                            </p>
                        </div>

                        <div className="mb-6 flex items-center gap-2 text-xs text-zinc-500">
                            <Clock className="h-3.5 w-3.5" />
                            Selection window: {formatTime(acceptStartTime)}{' '}
                            &ndash; {formatTime(lockTime)}
                        </div>

                        {selection ? (
                            <div
                                className={`flex items-center gap-3 rounded-lg border p-5 ${
                                    selection.status === 'accepted'
                                        ? 'border-emerald-500/25 bg-emerald-500/5'
                                        : 'border-red-500/25 bg-red-500/5'
                                }`}
                            >
                                {selection.status === 'accepted' ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-400" />
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        You{' '}
                                        {selection.status === 'accepted'
                                            ? 'accepted'
                                            : 'declined'}{' '}
                                        today&rsquo;s lunch
                                    </p>
                                    {selection.is_auto_declined && (
                                        <p className="mt-1 text-xs text-red-300/70">
                                            Automatically declined — the
                                            selection window closed before you
                                            responded.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : isOpen ? (
                            <div className="flex gap-3">
                                <motion.button
                                    type="button"
                                    disabled={pendingStatus !== null}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => submit('accepted')}
                                    className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg border border-emerald-400/30 bg-gradient-to-br from-emerald-600 to-emerald-500 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(16,185,129,0.35)] transition-all duration-300 hover:border-emerald-300/60 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-[0_0_42px_rgba(16,185,129,0.75)] disabled:opacity-50"
                                >
                                    {pendingStatus === 'accepted' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ThumbsUp className="h-4 w-4" />
                                    )}
                                    Accept
                                </motion.button>
                                <motion.button
                                    type="button"
                                    disabled={pendingStatus !== null}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => submit('declined')}
                                    className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg border border-red-400/30 bg-gradient-to-br from-red-600 to-rose-500 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(239,68,68,0.3)] transition-all duration-300 hover:border-red-300/60 hover:from-red-500 hover:to-rose-400 hover:shadow-[0_0_42px_rgba(239,68,68,0.7)] disabled:opacity-50"
                                >
                                    {pendingStatus === 'declined' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ThumbsDown className="h-4 w-4" />
                                    )}
                                    Decline
                                </motion.button>
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-400">
                                Selection isn&rsquo;t open right now. It opens
                                at {formatTime(acceptStartTime)} and locks at{' '}
                                {formatTime(lockTime)}.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

MealManagementSelfService.layout = (page: ReactNode) => (
    <AdminLayout title="Meal Management">{page}</AdminLayout>
);
