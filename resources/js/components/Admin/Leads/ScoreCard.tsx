import type { LeadDetail } from '@/types/leads';
import { Link, router } from '@inertiajs/react';
import { Gauge, RefreshCw, SlidersHorizontal } from 'lucide-react';
import {
    CARD,
    CARD_TITLE,
    SECONDARY_BUTTON,
} from '@/components/Admin/Leads/ui';
import leadRoutes from '@/routes/admin/leads';
import scoreRoutes from '@/routes/admin/leads/score';

export function scoreLevel(score: number): {
    label: string;
    className: string;
} {
    if (score >= 70) {
        return {
            label: 'High',
            className:
                'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
        };
    }

    if (score >= 40) {
        return {
            label: 'Medium',
            className: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
        };
    }

    return {
        label: 'Low',
        className: 'border-red-400/30 bg-red-500/10 text-red-300',
    };
}

/** Small score pill for list rows and board cards; nothing when unscored. */
export function ScoreBadge({ score }: { score: number | null }) {
    if (score === null) {
        return null;
    }

    return (
        <span
            title="Lead score"
            className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-px font-mono text-[10px] ${scoreLevel(score).className}`}
        >
            <Gauge className="h-3 w-3" />
            {score}
        </span>
    );
}

/** "Why is this lead scored X?" */
export default function ScoreCard({ lead }: { lead: LeadDetail }) {
    const { value, raw_total, matched, can_manage } = lead.score;

    return (
        <div className={CARD}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className={`${CARD_TITLE} flex items-center gap-2`}>
                    <Gauge className="h-3.5 w-3.5" /> Lead score
                </p>
                {can_manage && (
                    <div className="flex gap-2">
                        <Link
                            href={leadRoutes.scoring.index.url()}
                            className={`${SECONDARY_BUTTON} py-1.5 text-xs`}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" /> Rules
                        </Link>
                        <button
                            type="button"
                            onClick={() =>
                                router.post(
                                    scoreRoutes.recalculate.url(lead.id),
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                            className={`${SECONDARY_BUTTON} py-1.5 text-xs`}
                        >
                            <RefreshCw className="h-3.5 w-3.5" /> Recalculate
                        </button>
                    </div>
                )}
            </div>
            {value === null ? (
                <p className="rounded-lg border border-dashed border-white/10 p-3 text-center text-sm text-zinc-500">
                    Not scored — there are no active scoring rules yet.
                </p>
            ) : (
                <>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-white">
                            {value}
                        </span>
                        <span
                            className={`rounded-full border px-2 py-0.5 text-xs ${scoreLevel(value).className}`}
                        >
                            {scoreLevel(value).label}
                        </span>
                        {raw_total !== null && raw_total !== value && (
                            <span className="text-xs text-zinc-500">
                                (rules add up to {raw_total}; kept within 0–100)
                            </span>
                        )}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                            style={{ width: `${value}%` }}
                        />
                    </div>
                    {matched.length === 0 ? (
                        <p className="mt-3 text-xs text-zinc-500">
                            No rule matched this lead.
                        </p>
                    ) : (
                        <ul className="mt-3 space-y-1">
                            {matched.map((m, i) => (
                                <li
                                    key={`${m.rule}-${i}`}
                                    className="flex justify-between gap-3 text-sm"
                                >
                                    <span className="text-zinc-300">
                                        {m.rule}
                                    </span>
                                    <span
                                        className={`font-mono ${m.points >= 0 ? 'text-emerald-300' : 'text-red-300'}`}
                                    >
                                        {m.points >= 0 ? '+' : ''}
                                        {m.points}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}
