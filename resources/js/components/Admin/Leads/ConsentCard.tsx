import type { LeadDetail } from '@/types/leads';
import { router } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import {
    CARD,
    CARD_TITLE,
    SECONDARY_BUTTON,
} from '@/components/Admin/Leads/ui';
import { formatDateTime } from '@/lib/leadColors';
import consentRoutes from '@/routes/admin/leads/consents';

const TYPES = [
    { value: 'privacy', label: 'Privacy / data processing' },
    { value: 'marketing', label: 'Marketing / communication' },
];

/**
 * Privacy and Marketing consent: current state, Grant / Withdraw, and the
 * permanent history. Withdrawn privacy consent blocks all messaging.
 */
export default function ConsentCard({ lead }: { lead: LeadDetail }) {
    const change = (type: string, status: 'granted' | 'withdrawn') =>
        router.post(
            consentRoutes.update.url([lead.id, type, status]),
            {},
            { preserveScroll: true },
        );

    return (
        <div className={CARD}>
            <p className={`${CARD_TITLE} mb-3 flex items-center gap-2`}>
                <ShieldCheck className="h-3.5 w-3.5" /> Consent
            </p>
            <div className="space-y-2">
                {TYPES.map((type) => {
                    const current = lead.consents.current[type.value];
                    const granted = current?.status === 'granted';

                    return (
                        <div
                            key={type.value}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 px-3 py-2"
                        >
                            <div>
                                <p className="text-sm text-zinc-200">
                                    {type.label}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    {current ? (
                                        <>
                                            <span
                                                className={
                                                    granted
                                                        ? 'text-emerald-300'
                                                        : 'text-red-300'
                                                }
                                            >
                                                {granted
                                                    ? 'Granted'
                                                    : 'Withdrawn'}
                                            </span>
                                            {' · '}
                                            {current.source} ·{' '}
                                            {formatDateTime(
                                                current.occurred_at,
                                            )}
                                        </>
                                    ) : (
                                        'Not recorded'
                                    )}
                                </p>
                            </div>
                            {lead.can.update && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        change(
                                            type.value,
                                            granted ? 'withdrawn' : 'granted',
                                        )
                                    }
                                    className={SECONDARY_BUTTON}
                                >
                                    {granted ? 'Withdraw' : 'Grant'}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            {lead.consents.history.length > 0 && (
                <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-zinc-400 hover:text-white">
                        History ({lead.consents.history.length})
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                        {lead.consents.history.map((event, i) => (
                            <li key={i} className="text-xs text-zinc-400">
                                <span
                                    className={
                                        event.status === 'granted'
                                            ? 'text-emerald-300'
                                            : 'text-red-300'
                                    }
                                >
                                    {event.status === 'granted'
                                        ? 'Granted'
                                        : 'Withdrawn'}
                                </span>{' '}
                                {event.type_label} — {event.source}
                                {event.by && ` by ${event.by}`}
                                {event.policy_version &&
                                    `, policy ${event.policy_version}`}
                                {event.ip_address && `, IP ${event.ip_address}`}{' '}
                                · {formatDateTime(event.occurred_at)}
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}
