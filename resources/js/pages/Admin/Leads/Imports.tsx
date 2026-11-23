import type { FormEvent, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import {
    CARD,
    CARD_TITLE,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
} from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import { formatDateTime } from '@/lib/leadColors';
import importRoutes from '@/routes/admin/leads/imports';

export interface ImportSummary {
    id: string;
    file_name: string;
    status: string;
    status_label: string;
    finished: boolean;
    total_rows: number;
    processed_rows: number;
    imported_count: number;
    duplicate_count: number;
    failed_count: number;
    imported_by_name: string | null;
    error: string | null;
    created_at: string | null;
}

interface Props {
    imports: ImportSummary[];
    columns: string[];
    maxRows: number;
}

/**
 * Leads → Import (managers): upload a CSV or Excel file of leads.
 */
export default function Imports({ imports, columns, maxRows }: Props) {
    const [errors, setErrors] = useState<string[]>([]);
    const form = useForm<{ file: File | null }>({ file: null });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(importRoutes.store.url(), {
            forceFormData: true,
            onError: (x) => setErrors(Object.values(x).filter(Boolean)),
        });
    };

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />
            <div>
                <h1 className="text-2xl font-bold text-white">Import Leads</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Upload a .csv or .xlsx file (up to{' '}
                    {maxRows.toLocaleString()} rows, 10 MB). Rows whose email or
                    phone you already have are skipped. Imported leads
                    don&apos;t send new-lead alerts.
                </p>
            </div>

            <form onSubmit={submit} className={`${CARD} space-y-4`}>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/[0.03] px-4 py-8 text-center transition-colors hover:bg-violet-500/[0.06]">
                    <FileSpreadsheet className="h-8 w-8 text-violet-300" />
                    <span className="text-sm text-white">
                        {form.data.file
                            ? form.data.file.name
                            : 'Choose a .csv or .xlsx file'}
                    </span>
                    <input
                        type="file"
                        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        className="sr-only"
                        onChange={(e) =>
                            form.setData('file', e.target.files?.[0] ?? null)
                        }
                    />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <a
                        href={importRoutes.sample.url()}
                        className={SECONDARY_BUTTON}
                    >
                        <Download className="h-4 w-4" /> Sample file
                    </a>
                    <button
                        type="submit"
                        disabled={form.processing || form.data.file === null}
                        className={PRIMARY_BUTTON}
                    >
                        {form.processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        Import
                    </button>
                </div>
                <div>
                    <p className={`${CARD_TITLE} mb-2`}>Columns</p>
                    <p className="text-xs leading-relaxed text-zinc-400">
                        The first row holds the column names. Only{' '}
                        <code className="text-cyan-300">name</code> is required.
                        Allowed:{' '}
                        {columns.map((c, i) => (
                            <span key={c}>
                                <code className="text-cyan-300">{c}</code>
                                {i < columns.length - 1 ? ', ' : '.'}
                            </span>
                        ))}{' '}
                        Status and tags must match names in the CMS; tags are
                        comma-separated; currencies are codes like BDT or USD;
                        assignee_email must belong to someone with lead access.
                    </p>
                </div>
            </form>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-3`}>Recent imports</p>
                {imports.length === 0 ? (
                    <p className="text-sm text-zinc-500">No imports yet.</p>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {imports.map((imp) => (
                            <li key={imp.id}>
                                <Link
                                    href={importRoutes.show.url(imp.id)}
                                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:bg-white/[0.02]"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-white">
                                            {imp.file_name}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {formatDateTime(imp.created_at)}
                                            {imp.imported_by_name &&
                                                ` · ${imp.imported_by_name}`}
                                        </p>
                                    </div>
                                    <p className="text-xs text-zinc-400">
                                        {imp.status_label} ·{' '}
                                        {imp.imported_count} imported,{' '}
                                        {imp.duplicate_count} duplicate,{' '}
                                        {imp.failed_count} failed
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

Imports.layout = (page: ReactNode) => (
    <AdminLayout title="Import Leads">{page}</AdminLayout>
);
