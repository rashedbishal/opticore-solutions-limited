import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileText,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import DeleteLogFileDialog from '@/components/Admin/ApplicationLog/DeleteLogFileDialog';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import {
    CARD,
    CARD_TITLE,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
} from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import applicationLog from '@/routes/admin/application-log';

interface LogEntry {
    id: string;
    datetime: string | null;
    environment: string | null;
    level: string;
    message: string;
    details: string;
    truncated: boolean;
    size: number;
}

interface LogFile {
    name: string;
    size: number;
    modified_at: string;
    date: string | null;
    is_today: boolean;
    can_delete: boolean;
}

interface Props {
    files: LogFile[];
    totalSize: number;
    file: (LogFile & { entries: number }) | null;
    entries: LogEntry[];
    pagination: {
        page: number;
        lastPage: number;
        total: number;
        perPage: number;
    };
    levels: Record<string, number>;
    level: string | null;
}

type Confirm =
    | { kind: 'one'; entry: LogEntry }
    | { kind: 'selected' }
    | { kind: 'all' }
    | null;

// Literal class strings so Tailwind's scanner picks them up.
const LEVEL_STYLES: Record<string, string> = {
    emergency: 'border-red-500/40 bg-red-500/15 text-red-300',
    alert: 'border-red-500/40 bg-red-500/15 text-red-300',
    critical: 'border-red-500/40 bg-red-500/15 text-red-300',
    error: 'border-rose-500/35 bg-rose-500/10 text-rose-300',
    warning: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
    notice: 'border-sky-500/35 bg-sky-500/10 text-sky-300',
    info: 'border-cyan-500/35 bg-cyan-500/10 text-cyan-300',
    debug: 'border-zinc-500/35 bg-zinc-500/10 text-zinc-300',
};

const UNKNOWN_LEVEL_STYLE = 'border-white/15 bg-white/5 text-zinc-400';

function levelStyle(level: string): string {
    return LEVEL_STYLES[level] ?? UNKNOWN_LEVEL_STYLE;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatModified(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Application Log (mother admin): the log files in storage/logs
 * (laravel.log and the dated laravel-YYYY-MM-DD.log files) and the entries
 * of the chosen one, newest first. Removing entries only changes a file's
 * contents; a past dated file can be deleted as a whole after the
 * password is entered twice.
 */
export default function ApplicationLog({
    files,
    totalSize,
    entries,
    pagination,
    levels,
    level,
    file,
}: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState<Confirm>(null);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);

    const allSelected =
        entries.length > 0 && entries.every((e) => selected.has(e.id));
    const selectedIds = entries
        .filter((e) => selected.has(e.id))
        .map((e) => e.id);

    const toggleIn = (set: Set<string>, id: string): Set<string> => {
        const next = new Set(set);

        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }

        return next;
    };

    const visit = (query: {
        file?: string | null;
        level?: string | null;
        page?: number;
    }) => {
        setSelected(new Set());
        setExpanded(new Set());
        router.get(
            applicationLog.index.url({
                query: {
                    file: query.file ?? file?.name ?? undefined,
                    level: query.level ?? undefined,
                    page: query.page && query.page > 1 ? query.page : undefined,
                },
            }),
            {},
            { preserveScroll: true },
        );
    };

    const options = {
        preserveScroll: true,
        onStart: () => setBusy(true),
        onFinish: () => setBusy(false),
        onSuccess: () => {
            setSelected(new Set());
            setExpanded(new Set());
        },
    };

    const remove = (ids: string[]) =>
        router.delete(applicationLog.destroy.url(), {
            ...options,
            data: { file: file?.name, ids },
        });

    const confirmMessage = (): string => {
        if (confirm?.kind === 'all') {
            return `Remove all ${file?.entries ?? 0} entries from ${file?.name ?? 'this file'}? The file stays, but it will be empty. This can't be undone.`;
        }

        if (confirm?.kind === 'selected') {
            return `Remove ${selectedIds.length} selected log entr${selectedIds.length === 1 ? 'y' : 'ies'}? This can't be undone.`;
        }

        return "Remove this log entry? This can't be undone.";
    };

    const levelNames = Object.keys(levels);
    const firstShown =
        pagination.total === 0
            ? 0
            : (pagination.page - 1) * pagination.perPage + 1;
    const lastShown = firstShown === 0 ? 0 : firstShown + entries.length - 1;

    return (
        <div className="relative space-y-6">
            <CmsDeleteDialog
                open={confirm !== null}
                message={confirmMessage()}
                onCancel={() => setConfirm(null)}
                onConfirm={() => {
                    if (confirm?.kind === 'all') {
                        router.delete(applicationLog.clear.url(), {
                            ...options,
                            data: { file: file?.name },
                        });
                    } else if (confirm?.kind === 'selected') {
                        remove(selectedIds);
                    } else if (confirm?.kind === 'one') {
                        remove([confirm.entry.id]);
                    }

                    setConfirm(null);
                }}
            />

            {deletingFile !== null && (
                <DeleteLogFileDialog
                    key={deletingFile}
                    fileName={deletingFile}
                    onClose={() => setDeletingFile(null)}
                />
            )}

            <div>
                <h1 className="text-2xl font-bold text-white">
                    Application Log
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                    What the website writes to its log files. The live site
                    starts a new dated file every day. Pick a file, then click
                    an entry to see its details. Removing entries keeps the
                    file; it only removes those lines. Files from before today
                    can be deleted as a whole.
                </p>
            </div>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-3`}>
                    Log files · {files.length} · {formatSize(totalSize)}
                </p>

                {files.length === 0 ? (
                    <p className="text-sm text-zinc-400">
                        There are no log files yet.
                    </p>
                ) : (
                    <ul className="max-h-80 divide-y divide-white/5 overflow-y-auto">
                        {files.map((f) => {
                            const isCurrent = f.name === file?.name;

                            return (
                                <li
                                    key={f.name}
                                    className={`flex items-center gap-2 rounded-lg px-2 ${
                                        isCurrent ? 'bg-violet-500/10' : ''
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            visit({ file: f.name, level: null })
                                        }
                                        aria-current={isCurrent}
                                        className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left"
                                    >
                                        <FileText
                                            className={`h-4 w-4 shrink-0 ${
                                                isCurrent
                                                    ? 'text-violet-300'
                                                    : 'text-zinc-500'
                                            }`}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span
                                                className={`block truncate font-mono text-sm ${
                                                    isCurrent
                                                        ? 'text-white'
                                                        : 'text-zinc-300'
                                                }`}
                                            >
                                                {f.name}
                                                {f.is_today && (
                                                    <span className="ml-2 rounded border border-emerald-500/35 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300 uppercase">
                                                        Today
                                                    </span>
                                                )}
                                            </span>
                                            <span className="block font-mono text-[10px] text-zinc-500">
                                                Last written{' '}
                                                {formatModified(f.modified_at)}
                                            </span>
                                        </span>
                                        <span className="shrink-0 font-mono text-xs text-zinc-400">
                                            {formatSize(f.size)}
                                        </span>
                                    </button>
                                    {f.can_delete ? (
                                        <button
                                            type="button"
                                            className="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                                            onClick={() =>
                                                setDeletingFile(f.name)
                                            }
                                            aria-label={`Delete ${f.name}`}
                                            title="Delete this file"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <span
                                            className="w-7 shrink-0"
                                            aria-hidden
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {file !== null && (
                <section className={CARD}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className={CARD_TITLE}>
                            {file.name} · {file.entries} entr
                            {file.entries === 1 ? 'y' : 'ies'} ·{' '}
                            {formatSize(file.size)}
                        </p>
                        {file.entries > 0 && (
                            <button
                                type="button"
                                disabled={busy}
                                className={SECONDARY_BUTTON}
                                onClick={() => setConfirm({ kind: 'all' })}
                            >
                                <Trash2 className="h-4 w-4" /> Delete all
                            </button>
                        )}
                    </div>

                    {levelNames.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => visit({ level: null })}
                                className={`rounded-full border px-3 py-1 font-mono text-xs ${
                                    level === null
                                        ? 'border-violet-400/50 bg-violet-500/15 text-white'
                                        : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white'
                                }`}
                            >
                                All · {file.entries}
                            </button>
                            {levelNames.map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => visit({ level: name })}
                                    className={`rounded-full border px-3 py-1 font-mono text-xs uppercase ${levelStyle(name)} ${
                                        level === name
                                            ? 'ring-1 ring-violet-400/60'
                                            : 'opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    {name} · {levels[name]}
                                </button>
                            ))}
                        </div>
                    )}

                    {entries.length === 0 ? (
                        <p className="text-sm text-zinc-400">
                            This file is empty. 🎉
                        </p>
                    ) : (
                        <>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    className={SECONDARY_BUTTON}
                                    onClick={() =>
                                        setSelected(
                                            allSelected
                                                ? new Set()
                                                : new Set(
                                                      entries.map((e) => e.id),
                                                  ),
                                        )
                                    }
                                >
                                    {allSelected
                                        ? 'Unselect all'
                                        : 'Select all on this page'}
                                </button>
                                <button
                                    type="button"
                                    disabled={busy || selectedIds.length === 0}
                                    className={PRIMARY_BUTTON}
                                    onClick={() =>
                                        setConfirm({ kind: 'selected' })
                                    }
                                >
                                    <Trash2 className="h-4 w-4" /> Delete
                                    selected ({selectedIds.length})
                                </button>
                            </div>

                            <ul className="divide-y divide-white/5">
                                {entries.map((entry) => {
                                    const isOpen = expanded.has(entry.id);

                                    return (
                                        <li key={entry.id} className="py-2">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(
                                                        entry.id,
                                                    )}
                                                    onChange={() =>
                                                        setSelected(
                                                            toggleIn(
                                                                selected,
                                                                entry.id,
                                                            ),
                                                        )
                                                    }
                                                    className="mt-1 h-4 w-4 shrink-0 accent-violet-500"
                                                    aria-label="Select this entry"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpanded(
                                                            toggleIn(
                                                                expanded,
                                                                entry.id,
                                                            ),
                                                        )
                                                    }
                                                    aria-expanded={isOpen}
                                                    className="flex min-w-0 flex-1 items-start gap-2 text-left"
                                                >
                                                    <ChevronDown
                                                        className={`mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
                                                            isOpen
                                                                ? ''
                                                                : '-rotate-90'
                                                        }`}
                                                    />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex flex-wrap items-center gap-2">
                                                            <span
                                                                className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${levelStyle(entry.level)}`}
                                                            >
                                                                {entry.level}
                                                            </span>
                                                            <span className="font-mono text-[11px] text-zinc-500">
                                                                {entry.datetime ??
                                                                    '—'}
                                                                {entry.environment
                                                                    ? ` · ${entry.environment}`
                                                                    : ''}
                                                            </span>
                                                        </span>
                                                        <span
                                                            className={`mt-1 block text-sm break-words text-zinc-200 ${
                                                                isOpen
                                                                    ? ''
                                                                    : 'line-clamp-2'
                                                            }`}
                                                        >
                                                            {entry.message ||
                                                                '(no message)'}
                                                        </span>
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    className="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                                                    onClick={() =>
                                                        setConfirm({
                                                            kind: 'one',
                                                            entry,
                                                        })
                                                    }
                                                    aria-label="Delete this entry"
                                                    title="Delete this entry"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {isOpen && (
                                                <div className="mt-2 ml-7">
                                                    <pre className="max-h-[32rem] overflow-auto rounded-lg border border-white/8 bg-black/40 p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-zinc-300">
                                                        {entry.details}
                                                    </pre>
                                                    <p className="mt-1 font-mono text-[10px] text-zinc-500">
                                                        {formatSize(entry.size)}
                                                        {entry.truncated &&
                                                            ' · very long entry, only the beginning is shown'}
                                                    </p>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                                <p className="font-mono text-xs text-zinc-500">
                                    {firstShown}–{lastShown} of{' '}
                                    {pagination.total}
                                </p>
                                {pagination.lastPage > 1 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={pagination.page <= 1}
                                            className={SECONDARY_BUTTON}
                                            onClick={() =>
                                                visit({
                                                    level,
                                                    page: pagination.page - 1,
                                                })
                                            }
                                        >
                                            <ChevronLeft className="h-4 w-4" />{' '}
                                            Newer
                                        </button>
                                        <span className="font-mono text-xs text-zinc-400">
                                            Page {pagination.page} of{' '}
                                            {pagination.lastPage}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={
                                                pagination.page >=
                                                pagination.lastPage
                                            }
                                            className={SECONDARY_BUTTON}
                                            onClick={() =>
                                                visit({
                                                    level,
                                                    page: pagination.page + 1,
                                                })
                                            }
                                        >
                                            Older{' '}
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}

ApplicationLog.layout = (page: ReactNode) => (
    <AdminLayout title="Application Log">{page}</AdminLayout>
);
