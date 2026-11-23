import type { LeadDetail } from '@/types/leads';
import { router } from '@inertiajs/react';
import { Phone, RefreshCw, Send } from 'lucide-react';
import { startLeadCall } from '@/components/Admin/Calling/OutboundSession';
import { SECONDARY_BUTTON } from '@/components/Admin/Leads/ui';
import { formatDate, formatDateTime } from '@/lib/leadColors';
import permissionRoutes from '@/routes/admin/leads/call-permission';

const ALLOWED = ['temporary', 'permanent'];

const TONE: Record<string, string> = {
    temporary: 'text-emerald-300',
    permanent: 'text-emerald-300',
    requested: 'text-amber-300',
    rejected: 'text-red-300',
};

/**
 * "Call on WhatsApp", with the lead's call permission (Meta only lets us
 * call people who allowed it). Shown to the lead's person and managers when
 * the lead's WhatsApp number has calling on.
 */
export default function CallLeadCard({ lead }: { lead: LeadDetail }) {
    const calling = lead.calling;

    if (!calling || !calling.can_call) {
        return null;
    }

    const allowed = ALLOWED.includes(calling.status);
    const post = (url: string) =>
        router.post(url, {}, { preserveScroll: true, preserveState: true });

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3">
            <div className="min-w-0 text-sm">
                <p className="text-zinc-200">
                    Call permission:{' '}
                    <span className={TONE[calling.status] ?? 'text-zinc-400'}>
                        {calling.status_label}
                    </span>
                    {calling.status === 'temporary' &&
                        calling.expires_at &&
                        ` until ${formatDate(calling.expires_at)}`}
                </p>
                <p className="text-xs text-zinc-500">
                    {calling.last_requested_at &&
                        `Asked ${formatDateTime(calling.last_requested_at)} · `}
                    {calling.checked_at
                        ? `checked ${formatDateTime(calling.checked_at)}`
                        : 'not checked with WhatsApp yet'}
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => post(permissionRoutes.check.url(lead.id))}
                    className={`${SECONDARY_BUTTON} py-1.5 text-xs`}
                >
                    <RefreshCw className="h-3.5 w-3.5" /> Check
                </button>
                {!allowed && (
                    <button
                        type="button"
                        onClick={() =>
                            post(permissionRoutes.request.url(lead.id))
                        }
                        className={`${SECONDARY_BUTTON} py-1.5 text-xs`}
                    >
                        <Send className="h-3.5 w-3.5" /> Ask permission
                    </button>
                )}
                <button
                    type="button"
                    disabled={!allowed}
                    title={
                        allowed
                            ? 'Call on WhatsApp'
                            : 'The lead has to allow calls first'
                    }
                    onClick={() => startLeadCall(lead.id, lead.name)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Phone className="h-3.5 w-3.5" /> Call
                </button>
            </div>
        </div>
    );
}
