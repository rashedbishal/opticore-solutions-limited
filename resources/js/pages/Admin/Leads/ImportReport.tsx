import type { ImportSummary } from '@/pages/Admin/Leads/Imports';
import type { ReactNode } from 'react';
import { Link, usePoll } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { CARD } from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import leadRoutes from '@/routes/admin/leads';
import importRoutes from '@/routes/admin/leads/imports';

interface Row {
    row_number: number;
    status: 'imported' | 'duplicate' | 'failed';
    name: string | null;
    email: string | null;
    phone: string | null;
    errors: string[];
    lead_id: string | null;
}

interface Props {
    import: ImportSummary;
    filter: string;
    rows: {
        data: Row[];
        links: { url: string | null; label: string; active: boolean }[];
    };
}

const FILTERS = [
    { value: 'problems', label: 'Problems' },
    { value: 'failed', label: 'Failed' },
    { value: 'duplicate', label: 'Duplicates' },
    { value: 'imported', label: 'Imported' },
];

const STATUS_CLASS: Record<string, string> = {
    imported: 'text-emerald-300',
    duplicate: 'text-amber-300',
    failed: 'text-red-300',
};

/**
 * One import's progress and per-row report. Refreshes itself while the
 * import is still running.
 */
export default function ImportReport({ import: imp, filter, rows }: Props) {
    usePoll(3000, { only: ['import', 'rows'] }, { autoStart: !imp.finished });
    const percent =
        imp.total_rows > 0
            ? Math.min(
                  100,
                  Math.round((imp.processed_rows / imp.total_rows) * 100),
              )
            : 0;

    return (
        <div className="relative space-y-6">
            <Link
                href={importRoutes.index.url()}
                className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"
            >
                <ArrowLeft className="h-4 w-4" /> All imports
            </Link>
            <div>
                <h1 className="truncate text-2xl font-bold text-white">
                    {imp.file_name}
                </h1>
                <p className="mt-1 text-sm text-zinc-500">{imp.status_label}</p>
            </div>

            <div className={`${CARD} space-y-4`}>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${imp.finished ? 100 : percent}%` }}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Rows" value={imp.total_rows} />
                    <Stat
                        label="Imported"
                        value={imp.imported_count}
                        className="text-emerald-300"
                    />
                    <Stat
                        label="Duplicates"
                        value={imp.duplicate_count}
                        className="text-amber-300"
                    />
                    <Stat
                        label="Failed"
                        value={imp.failed_count}
                        className="text-red-300"
                    />
                </div>
                {imp.error && (
                    <p className="text-sm text-red-300">{imp.error}</p>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <Link
                        key={f.value}
                        href={importRoutes.show.url(imp.id, {
                            query: { show: f.value },
                        })}
                        preserveScroll
                        className={`rounded-lg border px-3 py-1.5 text-sm ${
                            filter === f.value
                                ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
                                : 'border-white/10 text-zinc-400 hover:text-white'
                        }`}
                    >
                        {f.label}
                    </Link>
                ))}
            </div>

            <div className={CARD}>
                {rows.data.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nothing to show.</p>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {rows.data.map((row) => (
                            <li key={row.row_number} className="py-2.5">
                                <p className="text-sm text-white">
                                    <span className="mr-2 font-mono text-xs text-zinc-500">
                                        Row {row.row_number}
                                    </span>
                                    {row.lead_id ? (
                                        <Link
                                            href={leadRoutes.show.url(
                                                row.lead_id,
                                            )}
                                            className="text-cyan-300 hover:underline"
                                        >
                                            {row.name ?? '—'}
                                        </Link>
                                    ) : (
                                        (row.name ?? '—')
                                    )}
                                    <span
                                        className={`ml-2 text-xs ${STATUS_CLASS[row.status]}`}
                                    >
                                        {row.status}
                                    </span>
                                </p>
                                <p className="text-xs text-zinc-500">
                                    {[row.email, row.phone]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                                {row.errors.length > 0 && (
                                    <ul className="mt-1 list-inside list-disc text-xs text-red-300/90">
                                        {row.errors.map((error) => (
                                            <li key={error}>{error}</li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
                {rows.links.filter((l) => l.url !== null).length > 2 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-1">
                        {rows.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    preserveScroll
                                    className={`rounded-lg border px-3 py-1.5 text-sm ${link.active ? 'border-violet-500/40 text-violet-200' : 'border-white/10 text-zinc-400'}`}
                                >
                                    {link.label
                                        .replace(/&laquo;/g, '«')
                                        .replace(/&raquo;/g, '»')}
                                </Link>
                            ) : null,
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Stat({
    label,
    value,
    className = 'text-white',
}: {
    label: string;
    value: number;
    className?: string;
}) {
    return (
        <div className="rounded-lg border border-white/8 px-3 py-2">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`text-xl font-semibold ${className}`}>
                {value.toLocaleString()}
            </p>
        </div>
    );
}

ImportReport.layout = (page: ReactNode) => (
    <AdminLayout title="Import Report">{page}</AdminLayout>
);
