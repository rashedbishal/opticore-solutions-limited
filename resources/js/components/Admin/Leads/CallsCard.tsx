import type { LeadDetail } from '@/types/leads';
import { PhoneCall } from 'lucide-react';
import { CARD, CARD_TITLE } from '@/components/Admin/Leads/ui';
import { badgeClass, formatDateTime } from '@/lib/leadColors';

function duration(seconds: number | null): string | null {
    if (seconds === null) {
        return null;
    }

    return seconds < 60
        ? `${seconds}s`
        : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
}

/** WhatsApp call history for this lead. Hidden when there are no calls. */
export default function CallsCard({ lead }: { lead: LeadDetail }) {
    if (lead.calls.length === 0) {
        return null;
    }

    return (
        <div className={CARD}>
            <p className={`${CARD_TITLE} mb-3 flex items-center gap-2`}>
                <PhoneCall className="h-3.5 w-3.5" /> WhatsApp calls
            </p>
            <ul className="divide-y divide-white/5">
                {lead.calls.map((call) => (
                    <li
                        key={call.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                        <div className="min-w-0">
                            <p className="text-sm text-zinc-200">
                                {formatDateTime(call.created_at)}
                            </p>
                            <p className="text-xs text-zinc-500">
                                {[
                                    call.direction === 'outbound'
                                        ? `called by ${call.answered_by ?? 'someone'}`
                                        : call.answered_by &&
                                          `answered by ${call.answered_by}`,
                                    duration(call.duration_seconds),
                                    call.direction === 'inbound' &&
                                        !call.answered_by &&
                                        `rang ${call.rang}`,
                                    call.end_reason,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                        <span
                            className={`rounded-full border px-2 py-0.5 text-xs ${badgeClass(call.status_color)}`}
                        >
                            {call.status_label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
