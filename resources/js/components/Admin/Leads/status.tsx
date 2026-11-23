import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';

/** Sending / Sent / Delivered / Read / Failed, as small ticks. */
export function MessageStatusIcon({
    status,
}: {
    status: string | null | undefined;
}) {
    switch (status) {
        case 'pending':
            return (
                <Clock className="h-3 w-3 text-zinc-400" aria-label="Sending" />
            );
        case 'sent':
            return (
                <Check className="h-3 w-3 text-zinc-400" aria-label="Sent" />
            );
        case 'delivered':
            return (
                <CheckCheck
                    className="h-3 w-3 text-zinc-400"
                    aria-label="Delivered"
                />
            );
        case 'read':
            return (
                <CheckCheck
                    className="h-3 w-3 text-cyan-300"
                    aria-label="Read"
                />
            );
        case 'failed':
            return (
                <AlertCircle
                    className="h-3 w-3 text-red-400"
                    aria-label="Failed"
                />
            );
        default:
            return null;
    }
}

export const STATUS_LABEL: Record<string, string> = {
    pending: 'Sending',
    sent: 'Sent',
    delivered: 'Delivered',
    read: 'Read',
    failed: 'Failed',
};
