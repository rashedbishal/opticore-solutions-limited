/**
 * Literal class strings per status/priority colour, so Tailwind's scanner
 * keeps every one of them.
 */
export const DOT: Record<string, string> = {
    blue: 'bg-blue-400',
    sky: 'bg-sky-400',
    indigo: 'bg-indigo-400',
    amber: 'bg-amber-400',
    orange: 'bg-orange-400',
    green: 'bg-green-400',
    red: 'bg-red-400',
    zinc: 'bg-zinc-400',
    emerald: 'bg-emerald-400',
    purple: 'bg-purple-400',
    teal: 'bg-teal-400',
    pink: 'bg-pink-400',
};

export const BADGE: Record<string, string> = {
    blue: 'border-blue-400/30 bg-blue-500/10 text-blue-300',
    sky: 'border-sky-400/30 bg-sky-500/10 text-sky-300',
    indigo: 'border-indigo-400/30 bg-indigo-500/10 text-indigo-300',
    amber: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
    orange: 'border-orange-400/30 bg-orange-500/10 text-orange-300',
    green: 'border-green-400/30 bg-green-500/10 text-green-300',
    red: 'border-red-400/30 bg-red-500/10 text-red-300',
    zinc: 'border-zinc-400/30 bg-zinc-500/10 text-zinc-300',
    emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    purple: 'border-purple-400/30 bg-purple-500/10 text-purple-300',
    teal: 'border-teal-400/30 bg-teal-500/10 text-teal-300',
    pink: 'border-pink-400/30 bg-pink-500/10 text-pink-300',
};

export const COLUMN: Record<string, string> = {
    blue: 'border-blue-400/20 bg-blue-500/[0.04]',
    sky: 'border-sky-400/20 bg-sky-500/[0.04]',
    indigo: 'border-indigo-400/20 bg-indigo-500/[0.04]',
    amber: 'border-amber-400/20 bg-amber-500/[0.04]',
    orange: 'border-orange-400/20 bg-orange-500/[0.04]',
    green: 'border-green-400/20 bg-green-500/[0.04]',
    red: 'border-red-400/20 bg-red-500/[0.04]',
    zinc: 'border-zinc-400/20 bg-zinc-500/[0.04]',
    emerald: 'border-emerald-400/20 bg-emerald-500/[0.04]',
    purple: 'border-purple-400/20 bg-purple-500/[0.04]',
    teal: 'border-teal-400/20 bg-teal-500/[0.04]',
    pink: 'border-pink-400/20 bg-pink-500/[0.04]',
};

export function badgeClass(color: string | undefined): string {
    return BADGE[color ?? 'zinc'] ?? BADGE.zinc;
}

export function dotClass(color: string | undefined): string {
    return DOT[color ?? 'zinc'] ?? DOT.zinc;
}

export function columnClass(color: string | undefined): string {
    return COLUMN[color ?? 'zinc'] ?? COLUMN.zinc;
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    return new Date(
        iso.length === 10 ? `${iso}T00:00:00` : iso,
    ).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
