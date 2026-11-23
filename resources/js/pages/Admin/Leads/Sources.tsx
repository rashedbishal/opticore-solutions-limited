import type { FormEvent, ReactNode } from 'react';
import { router, useForm } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    AlertTriangle,
    Check,
    Copy,
    Edit,
    KeyRound,
    Loader2,
    Plug,
    Plus,
    Power,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import {
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
    SELECT,
} from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import { formatDateTime } from '@/lib/leadColors';
import sourceSettings from '@/routes/admin/lead-settings/sources';

interface ConfigField {
    key: string;
    label: string;
    type: 'text' | 'password' | 'select';
    sensitive: boolean;
    options?: Record<string, string>;
}

interface HealthProblem {
    problem: string;
    label: string;
    serious: boolean;
    detail: string;
}

interface Source {
    id: string;
    name: string;
    type: string;
    type_label: string;
    is_active: boolean;
    built_in: boolean;
    leads_count: number;
    last_activity_at: string | null;
    health: { problems: HealthProblem[]; info: string | null };
    webhook_url?: string | null;
    config?: Record<string, string | null | { saved: boolean }>;
    missing_app_secret?: boolean;
    calling?: {
        enabled: boolean;
        meta_status: string | null;
        checked_at: string | null;
        blocked_reason: string | null;
    };
}

interface Props {
    sources: Source[];
    canManage: boolean;
    types: { value: string; label: string; fields: ConfigField[] }[];
}

interface PermissionResult {
    is_valid?: boolean;
    expires_at?: number;
    required_scopes?: Record<string, boolean>;
    error?: string;
}

const META_TYPES = [
    'facebook_messenger',
    'facebook_lead_ads',
    'instagram',
    'whatsapp',
];

const TH =
    'px-4 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase';

/**
 * Leads → Lead Sources. Everyone sees where leads come from and whether a
 * channel is healthy; the mother admin also sets channels up here.
 */
export default function LeadSources({ sources, canManage, types }: Props) {
    const [editing, setEditing] = useState<Source | null>(null);
    const [creating, setCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Source | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [testing, setTesting] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<{
        source: Source;
        result: PermissionResult | null;
    } | null>(null);

    const test = (source: Source) => {
        setTesting(source.id);
        router.post(
            sourceSettings.test.url(source.id),
            {},
            { preserveScroll: true, onFinish: () => setTesting(null) },
        );
    };

    const checkPermissions = async (source: Source) => {
        setPermissions({ source, result: null });

        try {
            const response = await fetch(
                sourceSettings.permissions.url(source.id),
                { headers: { Accept: 'application/json' } },
            );
            setPermissions({ source, result: await response.json() });
        } catch {
            setPermissions({
                source,
                result: { error: 'Could not check the permissions.' },
            });
        }
    };

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />
            <CmsDeleteDialog
                open={deleteTarget !== null}
                message={
                    deleteTarget
                        ? `Delete "${deleteTarget.name}"? A source that already brought in leads can only be turned off.`
                        : undefined
                }
                onConfirm={() => {
                    if (deleteTarget) {
                        router.delete(
                            sourceSettings.destroy.url(deleteTarget.id),
                            { preserveScroll: true },
                        );
                    }

                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Lead Sources
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Where your leads come from
                        {canManage
                            ? ', and how each channel is connected.'
                            : '. Channels are set up by the mother admin.'}
                    </p>
                </div>
                {canManage && (
                    <button
                        type="button"
                        onClick={() => setCreating(true)}
                        className={PRIMARY_BUTTON}
                    >
                        <Plus className="h-4 w-4" /> Add Channel
                    </button>
                )}
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className={TH}>Source</th>
                            <th className={`${TH} hidden sm:table-cell`}>
                                Health
                            </th>
                            <th className={`${TH} hidden md:table-cell`}>
                                Last activity
                            </th>
                            <th className={`${TH} text-right`}>Leads</th>
                            {canManage && (
                                <th className={`${TH} text-right`}>Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {sources.map((source) => (
                            <tr
                                key={source.id}
                                className="border-b border-white/4 align-top last:border-0"
                            >
                                <td className="px-4 py-4">
                                    <p className="flex items-center gap-2 text-sm font-medium text-white">
                                        {source.name}
                                        {!source.is_active && (
                                            <span className="rounded-full border border-zinc-400/30 px-1.5 text-[10px] text-zinc-400">
                                                Off
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {source.type_label}
                                    </p>
                                    {canManage && source.webhook_url && (
                                        <WebhookUrl url={source.webhook_url} />
                                    )}
                                    {canManage && source.missing_app_secret && (
                                        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-300">
                                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            No App Secret saved, so webhook
                                            signatures aren&apos;t being
                                            checked.
                                        </p>
                                    )}
                                    {canManage && source.calling && (
                                        <CallingControls
                                            sourceId={source.id}
                                            calling={source.calling}
                                        />
                                    )}
                                    <div className="mt-2 sm:hidden">
                                        <HealthBadges
                                            health={source.health}
                                            showDetail={canManage}
                                        />
                                    </div>
                                </td>
                                <td className="hidden px-4 py-4 sm:table-cell">
                                    <HealthBadges
                                        health={source.health}
                                        showDetail={canManage}
                                    />
                                </td>
                                <td className="hidden px-4 py-4 text-sm whitespace-nowrap text-zinc-400 md:table-cell">
                                    {source.built_in
                                        ? '—'
                                        : formatDateTime(
                                              source.last_activity_at,
                                          )}
                                </td>
                                <td className="px-4 py-4 text-right font-mono text-sm text-zinc-300">
                                    {source.leads_count}
                                </td>
                                {canManage && (
                                    <td className="px-4 py-4">
                                        {!source.built_in && (
                                            <div className="flex flex-wrap justify-end gap-1">
                                                <IconButton
                                                    title="Test connection"
                                                    onClick={() => test(source)}
                                                >
                                                    {testing === source.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Plug className="h-4 w-4" />
                                                    )}
                                                </IconButton>
                                                {META_TYPES.includes(
                                                    source.type,
                                                ) && (
                                                    <IconButton
                                                        title="Check Meta permissions"
                                                        onClick={() =>
                                                            checkPermissions(
                                                                source,
                                                            )
                                                        }
                                                    >
                                                        <ShieldCheck className="h-4 w-4" />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    title="Edit"
                                                    onClick={() =>
                                                        setEditing(source)
                                                    }
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </IconButton>
                                                <IconButton
                                                    title={
                                                        source.is_active
                                                            ? 'Turn off'
                                                            : 'Turn on'
                                                    }
                                                    onClick={() =>
                                                        router.post(
                                                            sourceSettings.toggle.url(
                                                                source.id,
                                                            ),
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    <Power
                                                        className={`h-4 w-4 ${source.is_active ? 'text-emerald-400' : ''}`}
                                                    />
                                                </IconButton>
                                                <IconButton
                                                    title="Delete"
                                                    danger
                                                    onClick={() =>
                                                        setDeleteTarget(source)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </IconButton>
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {canManage && (
                <SourceForm
                    key={editing?.id ?? (creating ? 'new' : 'closed')}
                    open={creating || editing !== null}
                    source={editing}
                    types={types}
                    onClose={() => {
                        setCreating(false);
                        setEditing(null);
                    }}
                    onErrors={setErrors}
                />
            )}

            <PermissionsDialog
                state={permissions}
                onClose={() => setPermissions(null)}
            />
        </div>
    );
}

function IconButton({
    title,
    onClick,
    danger = false,
    children,
}: {
    title: string;
    onClick: () => void;
    danger?: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            className={`rounded-lg p-2 transition-colors hover:bg-white/5 ${
                danger
                    ? 'text-red-400/70 hover:text-red-300'
                    : 'text-zinc-400 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

function WebhookUrl({ url }: { url: string }) {
    const [copied, setCopied] = useState(false);

    return (
        <button
            type="button"
            onClick={() => {
                void navigator.clipboard?.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }}
            className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-cyan-300/80 hover:text-cyan-200"
            title="Copy webhook URL"
        >
            {copied ? (
                <Check className="h-3 w-3 shrink-0" />
            ) : (
                <Copy className="h-3 w-3 shrink-0" />
            )}
            <span className="truncate">{url}</span>
        </button>
    );
}

function HealthBadges({
    health,
    showDetail,
}: {
    health: Source['health'];
    showDetail: boolean;
}) {
    if (health.problems.length === 0) {
        return health.info ? (
            <span className="text-xs text-zinc-500">{health.info}</span>
        ) : (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-300/80">
                <Check className="h-3.5 w-3.5" /> OK
            </span>
        );
    }

    return (
        <div className="space-y-1.5">
            {health.problems.map((p) => (
                <div key={p.problem}>
                    <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${
                            p.serious
                                ? 'border-red-400/30 bg-red-500/10 text-red-300'
                                : 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                        }`}
                    >
                        {p.label}
                    </span>
                    {showDetail && (
                        <p className="mt-0.5 max-w-xs text-xs text-zinc-500">
                            {p.detail}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

function initialConfig(
    fields: ConfigField[],
    source: Source | null,
): Record<string, string> {
    return Object.fromEntries(
        fields.map((field) => {
            const saved = source?.config?.[field.key];

            if (!field.sensitive && typeof saved === 'string') {
                return [field.key, saved];
            }

            return [
                field.key,
                field.type === 'select'
                    ? (Object.keys(field.options ?? {})[0] ?? '')
                    : '',
            ];
        }),
    );
}

/**
 * Add/edit a channel. Mounted fresh (via `key`) each time it opens, so its
 * fields always start from the chosen source.
 */
function SourceForm({
    open,
    source,
    types,
    onClose,
    onErrors,
}: {
    open: boolean;
    source: Source | null;
    types: Props['types'];
    onClose: () => void;
    onErrors: (e: string[]) => void;
}) {
    const fieldsFor = (type: string) =>
        types.find((t) => t.value === type)?.fields ?? [];
    const startType = source?.type ?? types[0]?.value ?? '';

    const form = useForm({
        type: startType,
        name: source?.name ?? '',
        config: initialConfig(fieldsFor(startType), source),
    });

    const fields = fieldsFor(form.data.type);

    const setConfig = (key: string, value: string) =>
        form.setData('config', { ...form.data.config, [key]: value });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (errs: Record<string, string>) =>
                onErrors(Object.values(errs).filter(Boolean)),
        };

        if (source) {
            form.put(sourceSettings.update.url(source.id), options);
        } else {
            form.post(sourceSettings.store.url(), options);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 20 }}
                        className="relative my-8 w-full max-w-lg rounded-2xl border border-violet-500/20 bg-[#060c1a] p-6 shadow-2xl"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {source ? `Edit ${source.name}` : 'Add Channel'}
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-zinc-400 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="space-y-4">
                            {!source && (
                                <label className="block">
                                    <span className={LABEL}>Channel</span>
                                    <select
                                        className={SELECT}
                                        value={form.data.type}
                                        onChange={(e) =>
                                            form.setData({
                                                ...form.data,
                                                type: e.target.value,
                                                config: initialConfig(
                                                    fieldsFor(e.target.value),
                                                    null,
                                                ),
                                            })
                                        }
                                    >
                                        {types.map((t) => (
                                            <option
                                                key={t.value}
                                                value={t.value}
                                            >
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                            <label className="block">
                                <span className={LABEL}>Name</span>
                                <input
                                    className={INPUT}
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    placeholder="e.g. Opticore Facebook Page"
                                />
                            </label>
                            {fields.map((field) => {
                                const saved = source?.config?.[field.key];
                                const isSaved =
                                    typeof saved === 'object' &&
                                    saved !== null &&
                                    saved.saved;

                                return (
                                    <label key={field.key} className="block">
                                        <span className={LABEL}>
                                            {field.label}
                                        </span>
                                        {field.type === 'select' ? (
                                            <select
                                                className={SELECT}
                                                value={
                                                    form.data.config[
                                                        field.key
                                                    ] ?? ''
                                                }
                                                onChange={(e) =>
                                                    setConfig(
                                                        field.key,
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                {Object.entries(
                                                    field.options ?? {},
                                                ).map(([value, label]) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="relative">
                                                {field.sensitive && (
                                                    <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                                                )}
                                                <input
                                                    type={
                                                        field.sensitive
                                                            ? 'password'
                                                            : 'text'
                                                    }
                                                    autoComplete="off"
                                                    className={`${INPUT} ${field.sensitive ? 'pl-9' : ''}`}
                                                    placeholder={
                                                        isSaved
                                                            ? 'Saved — leave blank to keep'
                                                            : ''
                                                    }
                                                    value={
                                                        form.data.config[
                                                            field.key
                                                        ] ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        setConfig(
                                                            field.key,
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                        )}
                                    </label>
                                );
                            })}
                            <div className="flex justify-end gap-3 border-t border-violet-500/10 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={SECONDARY_BUTTON}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className={PRIMARY_BUTTON}
                                >
                                    {form.processing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Save'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function PermissionsDialog({
    state,
    onClose,
}: {
    state: { source: Source; result: PermissionResult | null } | null;
    onClose: () => void;
}) {
    return (
        <AnimatePresence>
            {state && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-2xl border border-violet-500/20 bg-[#060c1a] p-6"
                    >
                        <h2 className="mb-4 text-lg font-bold text-white">
                            Meta permissions — {state.source.name}
                        </h2>
                        {state.result === null ? (
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-400" />
                        ) : state.result.error ? (
                            <p className="text-sm text-red-300">
                                {state.result.error}
                            </p>
                        ) : (
                            <ul className="space-y-1.5">
                                {Object.entries(
                                    state.result.required_scopes ?? {},
                                ).map(([scope, granted]) => (
                                    <li
                                        key={scope}
                                        className="flex items-center justify-between font-mono text-xs"
                                    >
                                        <span className="text-zinc-300">
                                            {scope}
                                        </span>
                                        {granted ? (
                                            <Check className="h-4 w-4 text-emerald-400" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-400" />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className={SECONDARY_BUTTON}
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function CallingControls({
    sourceId,
    calling,
}: {
    sourceId: string;
    calling: NonNullable<Source['calling']>;
}) {
    const [busy, setBusy] = useState(false);
    const post = (url: string) => {
        setBusy(true);
        router.post(
            url,
            {},
            { preserveScroll: true, onFinish: () => setBusy(false) },
        );
    };
    const meta =
        calling.meta_status === 'ENABLED'
            ? 'on'
            : calling.meta_status === 'DISABLED'
              ? 'off'
              : 'not checked yet';

    return (
        <div className="mt-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
            <p className="text-xs text-zinc-300">
                Calling:{' '}
                <span
                    className={
                        calling.enabled ? 'text-emerald-300' : 'text-zinc-400'
                    }
                >
                    {calling.enabled ? 'On' : 'Off'}
                </span>
                <span className="text-zinc-500">
                    {' '}
                    · WhatsApp says {meta}
                    {calling.checked_at &&
                        ` (${formatDateTime(calling.checked_at)})`}
                </span>
            </p>
            {!calling.enabled && calling.blocked_reason && (
                <p className="mt-1 text-[11px] text-amber-300">
                    {calling.blocked_reason}
                </p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
                {calling.enabled ? (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                            post(sourceSettings.calling.disable.url(sourceId))
                        }
                        className="text-red-300 hover:underline disabled:opacity-50"
                    >
                        Turn off
                    </button>
                ) : (
                    <button
                        type="button"
                        disabled={busy || calling.blocked_reason !== null}
                        onClick={() =>
                            post(sourceSettings.calling.enable.url(sourceId))
                        }
                        className="text-emerald-300 hover:underline disabled:opacity-50"
                    >
                        Turn on
                    </button>
                )}
                <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                        post(sourceSettings.calling.check.url(sourceId))
                    }
                    className="text-cyan-300 hover:underline disabled:opacity-50"
                >
                    Check with Meta
                </button>
            </div>
        </div>
    );
}

LeadSources.layout = (page: ReactNode) => (
    <AdminLayout title="Lead Sources">{page}</AdminLayout>
);
