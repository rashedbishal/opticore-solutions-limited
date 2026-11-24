import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { FileText, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import {
    CARD,
    CARD_TITLE,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
} from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import { formatDateTime } from '@/lib/leadColors';
import storageCleanup from '@/routes/admin/storage-cleanup';
import bin from '@/routes/admin/storage-cleanup/bin';

interface UnusedFile {
    disk: string;
    path: string;
    folder: string;
    name: string;
    size: number;
    modified_at: string;
    is_image: boolean;
}

interface RecycledFile {
    id: string;
    disk: string;
    path: string;
    name: string;
    size: number;
    deleted_by: string | null;
    deleted_at: string | null;
    expires_at: string;
    is_image: boolean;
}

interface Props {
    usage: { disk: string; folder: string; files: number; size: number }[];
    unused: UnusedFile[];
    unusedTotal: { files: number; size: number };
    recycle: RecycledFile[];
    keepDays: number;
}

const FOLDER_LABELS: Record<string, string> = {
    blogs: 'Blog images',
    brands: 'Brand logos',
    categories: 'Category images',
    portfolios: 'Portfolio media',
    'sub-categories': 'Sub-category images',
    subcategories: 'Sub-category images (old)',
    testimonials: 'Testimonial photos',
    reviews: 'Client review photos',
    services: 'Service images (old)',
    tasks: 'Task images',
    task_uploads: 'Task files',
    resumes: 'Job application CVs',
    chat_attachments: 'Chat files',
    invoices: 'Invoices',
    temp: 'Temporary email files',
    leads: 'Lead files',
    'calling-app': 'Calling app download',
    'storage-recycle': 'Recycle bin',
    checkout: 'Checkout uploads',
};

function folderLabel(folder: string): string {
    return FOLDER_LABELS[folder] ?? folder;
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

function key(file: { disk: string; path: string }): string {
    return `${file.disk}:${file.path}`;
}

/**
 * Storage clean-up (mother admin): what uses space, files nothing uses any
 * more, and the 7-day recycle bin.
 */
export default function StorageCleanup({
    usage,
    unused,
    unusedTotal,
    recycle,
    keepDays,
}: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [folder, setFolder] = useState<string>('all');
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState<
        { kind: 'delete'; item: RecycledFile } | { kind: 'empty' } | null
    >(null);

    const folders = Array.from(new Set(unused.map((f) => f.folder))).sort();
    const shown =
        folder === 'all' ? unused : unused.filter((f) => f.folder === folder);
    const allShownSelected =
        shown.length > 0 && shown.every((f) => selected.has(key(f)));
    const selectedFiles = unused.filter((f) => selected.has(key(f)));
    const selectedSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const totalUsed = usage.reduce((sum, row) => sum + row.size, 0);
    const binSize = recycle.reduce((sum, f) => sum + f.size, 0);

    const toggle = (file: UnusedFile) => {
        const next = new Set(selected);

        if (next.has(key(file))) {
            next.delete(key(file));
        } else {
            next.add(key(file));
        }

        setSelected(next);
    };

    const toggleAllShown = () => {
        const next = new Set(selected);
        shown.forEach((f) =>
            allShownSelected ? next.delete(key(f)) : next.add(key(f)),
        );
        setSelected(next);
    };

    const options = {
        preserveScroll: true,
        onStart: () => setBusy(true),
        onFinish: () => setBusy(false),
    };

    const moveToBin = () =>
        router.post(
            storageCleanup.recycle.url(),
            {
                files: selectedFiles.map((f) => ({
                    disk: f.disk,
                    path: f.path,
                })),
            },
            { ...options, onSuccess: () => setSelected(new Set()) },
        );

    return (
        <div className="relative space-y-6">
            <CmsDeleteDialog
                open={confirm !== null}
                message={
                    confirm?.kind === 'empty'
                        ? `Delete all ${recycle.length} file(s) in the recycle bin for good? They can't be restored.`
                        : `Delete “${confirm?.kind === 'delete' ? confirm.item.name : ''}” for good? It can't be restored.`
                }
                onCancel={() => setConfirm(null)}
                onConfirm={() => {
                    if (confirm?.kind === 'empty') {
                        router.delete(storageCleanup.empty.url(), options);
                    } else if (confirm?.kind === 'delete') {
                        router.delete(
                            bin.destroy.url(confirm.item.id),
                            options,
                        );
                    }

                    setConfirm(null);
                }}
            />

            <div>
                <h1 className="text-2xl font-bold text-white">
                    Storage clean-up
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Find pictures and files nothing on the website uses any
                    more, and remove them. Removed files stay in the recycle bin
                    for {keepDays} days so you can restore them.
                </p>
            </div>

            <section className={CARD}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className={CARD_TITLE}>
                        Space used · {formatSize(totalUsed)}
                    </p>
                    <button
                        type="button"
                        disabled={busy}
                        className={SECONDARY_BUTTON}
                        onClick={() =>
                            router.post(storageCleanup.run.url(), {}, options)
                        }
                    >
                        <Sparkles className="h-4 w-4" /> Run automatic clean-up
                        now
                    </button>
                </div>
                <p className="mb-3 text-xs text-zinc-500">
                    Every night the CMS removes leftover temporary files, and
                    the files of WhatsApp/Messenger messages that failed to send
                    over 7 days ago. The button above does the same right away.
                </p>
                <div className="space-y-2">
                    {usage.map((row) => (
                        <div key={`${row.disk}:${row.folder}`}>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-300">
                                    {folderLabel(row.folder)}{' '}
                                    <span className="text-xs text-zinc-600">
                                        ({row.files} file
                                        {row.files === 1 ? '' : 's'})
                                    </span>
                                </span>
                                <span className="font-mono text-xs text-zinc-400">
                                    {formatSize(row.size)}
                                </span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-white/5">
                                <div
                                    className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                                    style={{
                                        width: `${totalUsed > 0 ? Math.max(1, (row.size / totalUsed) * 100) : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                    {usage.length === 0 && (
                        <p className="text-sm text-zinc-500">No files.</p>
                    )}
                </div>
            </section>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-1`}>
                    Unused files · {unusedTotal.files} ·{' '}
                    {formatSize(unusedTotal.size)}
                </p>
                <p className="mb-3 text-xs text-zinc-500">
                    Nothing on the website or in the CMS uses these files. Files
                    added in the last 24 hours are never listed.
                    {unusedTotal.files > unused.length &&
                        ` Showing the ${unused.length} largest.`}
                </p>

                {unused.length === 0 ? (
                    <p className="text-sm text-zinc-400">
                        Nothing to clean up. 🎉
                    </p>
                ) : (
                    <>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <select
                                value={folder}
                                onChange={(e) => setFolder(e.target.value)}
                                className="rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white [color-scheme:dark] [&_option]:bg-[#0b1024]"
                            >
                                <option value="all">All folders</option>
                                {folders.map((f) => (
                                    <option key={f} value={f}>
                                        {folderLabel(f)}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className={SECONDARY_BUTTON}
                                onClick={toggleAllShown}
                            >
                                {allShownSelected
                                    ? 'Unselect all'
                                    : 'Select all'}
                            </button>
                            <button
                                type="button"
                                disabled={busy || selectedFiles.length === 0}
                                className={PRIMARY_BUTTON}
                                onClick={moveToBin}
                            >
                                <Trash2 className="h-4 w-4" /> Move{' '}
                                {selectedFiles.length} to recycle bin (
                                {formatSize(selectedSize)})
                            </button>
                        </div>

                        <ul className="divide-y divide-white/5">
                            {shown.map((file) => (
                                <li
                                    key={key(file)}
                                    className="flex items-center gap-3 py-2"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.has(key(file))}
                                        onChange={() => toggle(file)}
                                        className="h-4 w-4 shrink-0 accent-violet-500"
                                        aria-label={`Select ${file.name}`}
                                    />
                                    <a
                                        href={storageCleanup.preview.url({
                                            query: {
                                                disk: file.disk,
                                                path: file.path,
                                            },
                                        })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/5"
                                    >
                                        {file.is_image ? (
                                            <img
                                                src={storageCleanup.preview.url(
                                                    {
                                                        query: {
                                                            disk: file.disk,
                                                            path: file.path,
                                                        },
                                                    },
                                                )}
                                                alt=""
                                                loading="lazy"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <FileText className="h-5 w-5 text-zinc-500" />
                                        )}
                                    </a>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-zinc-200">
                                            {file.name}
                                        </p>
                                        <p className="font-mono text-[10px] text-zinc-500">
                                            {folderLabel(file.folder)} · added{' '}
                                            {formatDateTime(file.modified_at)}
                                        </p>
                                    </div>
                                    <span className="shrink-0 font-mono text-xs text-zinc-400">
                                        {formatSize(file.size)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </section>

            <section className={CARD}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className={CARD_TITLE}>
                        Recycle bin · {recycle.length} · {formatSize(binSize)}
                    </p>
                    {recycle.length > 0 && (
                        <button
                            type="button"
                            disabled={busy}
                            className={SECONDARY_BUTTON}
                            onClick={() => setConfirm({ kind: 'empty' })}
                        >
                            <Trash2 className="h-4 w-4" /> Empty recycle bin
                        </button>
                    )}
                </div>
                <p className="mb-3 text-xs text-zinc-500">
                    Files here are deleted for good automatically after{' '}
                    {keepDays} days.
                </p>

                {recycle.length === 0 ? (
                    <p className="text-sm text-zinc-400">
                        The recycle bin is empty.
                    </p>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {recycle.map((item) => (
                            <li
                                key={item.id}
                                className="flex flex-wrap items-center gap-3 py-2"
                            >
                                <a
                                    href={bin.preview.url(item.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/5"
                                >
                                    {item.is_image ? (
                                        <img
                                            src={bin.preview.url(item.id)}
                                            alt=""
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <FileText className="h-5 w-5 text-zinc-500" />
                                    )}
                                </a>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm text-zinc-200">
                                        {item.name}{' '}
                                        <span className="font-mono text-xs text-zinc-500">
                                            {formatSize(item.size)}
                                        </span>
                                    </p>
                                    <p className="font-mono text-[10px] text-zinc-500">
                                        Removed{' '}
                                        {item.deleted_at
                                            ? formatDateTime(item.deleted_at)
                                            : ''}
                                        {item.deleted_by
                                            ? ` by ${item.deleted_by}`
                                            : ''}{' '}
                                        · deleted for good{' '}
                                        {formatDateTime(item.expires_at)}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <button
                                        type="button"
                                        disabled={busy}
                                        className={SECONDARY_BUTTON}
                                        onClick={() =>
                                            router.post(
                                                bin.restore.url(item.id),
                                                {},
                                                options,
                                            )
                                        }
                                    >
                                        <RotateCcw className="h-4 w-4" />{' '}
                                        Restore
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy}
                                        className={SECONDARY_BUTTON}
                                        onClick={() =>
                                            setConfirm({
                                                kind: 'delete',
                                                item,
                                            })
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                        now
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

StorageCleanup.layout = (page: ReactNode) => (
    <AdminLayout title="Storage clean-up">{page}</AdminLayout>
);
