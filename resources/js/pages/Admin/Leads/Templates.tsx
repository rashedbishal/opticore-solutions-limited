import type { FormEvent, ReactNode } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Loader2, Plus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import {
    CARD,
    CARD_TITLE,
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SELECT,
} from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import templateRoutes from '@/routes/admin/leads/templates';

interface Source {
    id: string;
    name: string;
}

interface WhatsAppTemplate {
    id: string;
    name: string;
    language: string;
    variable_count: number;
    is_active: boolean;
    source_id: string;
    source_name: string;
}

interface MessengerTemplate {
    id: string;
    name: string;
    language: string;
    variable_count: number;
    body_text: string;
    source_id: string;
    source_name: string;
}

interface Props {
    whatsappSources: Source[];
    messengerSources: Source[];
    whatsappTemplates: WhatsAppTemplate[];
    messengerTemplates: MessengerTemplate[];
    exampleMessengerBody: string;
}

/**
 * Leads → Templates (managers): messages that can be sent after the
 * 24-hour reply window closes.
 */
export default function Templates({
    whatsappSources,
    messengerSources,
    whatsappTemplates,
    messengerTemplates,
    exampleMessengerBody,
}: Props) {
    const [errors, setErrors] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<{
        url: string;
        label: string;
    } | null>(null);
    const onError = (e: Record<string, string>) =>
        setErrors(Object.values(e).filter(Boolean));

    const whatsapp = useForm({
        source_id: whatsappSources[0]?.id ?? '',
        name: '',
        language: 'en_US',
        variable_count: '0',
    });
    const messenger = useForm({
        source_id: messengerSources[0]?.id ?? '',
        name: '',
        language: 'en_US',
        body_text: '',
    });

    const addWhatsapp = (e: FormEvent) => {
        e.preventDefault();
        whatsapp.post(templateRoutes.whatsapp.store.url(), {
            preserveScroll: true,
            onSuccess: () => whatsapp.reset('name'),
            onError,
        });
    };

    const addMessenger = (e: FormEvent) => {
        e.preventDefault();
        messenger.post(templateRoutes.messenger.store.url(), {
            preserveScroll: true,
            onSuccess: () => messenger.reset('name', 'body_text'),
            onError,
        });
    };

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />
            <CmsDeleteDialog
                open={deleteTarget !== null}
                message={deleteTarget?.label}
                onConfirm={() => {
                    if (deleteTarget) {
                        router.delete(deleteTarget.url, {
                            preserveScroll: true,
                        });
                    }

                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
            <div>
                <h1 className="text-2xl font-bold text-white">
                    Message Templates
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                    After 24 hours without a message from a lead, WhatsApp and
                    Messenger only allow pre-approved templates.
                </p>
            </div>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-1`}>WhatsApp</p>
                <p className="mb-4 text-sm text-zinc-500">
                    Create and get the template approved in Meta&apos;s WhatsApp
                    Manager first, then add it here with exactly the same name
                    and language.
                </p>
                {whatsappSources.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                        No WhatsApp channel yet.
                    </p>
                ) : (
                    <form
                        onSubmit={addWhatsapp}
                        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-5"
                    >
                        <label className="block sm:col-span-1">
                            <span className={LABEL}>Number</span>
                            <select
                                className={SELECT}
                                value={whatsapp.data.source_id}
                                onChange={(e) =>
                                    whatsapp.setData(
                                        'source_id',
                                        e.target.value,
                                    )
                                }
                            >
                                {whatsappSources.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block sm:col-span-2">
                            <span className={LABEL}>Template name</span>
                            <input
                                className={`${INPUT} font-mono`}
                                value={whatsapp.data.name}
                                onChange={(e) =>
                                    whatsapp.setData('name', e.target.value)
                                }
                                placeholder="order_update"
                            />
                        </label>
                        <label className="block">
                            <span className={LABEL}>Language</span>
                            <input
                                className={`${INPUT} font-mono`}
                                value={whatsapp.data.language}
                                onChange={(e) =>
                                    whatsapp.setData('language', e.target.value)
                                }
                            />
                        </label>
                        <label className="block">
                            <span className={LABEL}>Blanks</span>
                            <input
                                type="number"
                                min={0}
                                max={10}
                                className={INPUT}
                                value={whatsapp.data.variable_count}
                                onChange={(e) =>
                                    whatsapp.setData(
                                        'variable_count',
                                        e.target.value,
                                    )
                                }
                            />
                        </label>
                        <div className="flex justify-end sm:col-span-5">
                            <button
                                type="submit"
                                disabled={whatsapp.processing}
                                className={PRIMARY_BUTTON}
                            >
                                <Plus className="h-4 w-4" /> Add WhatsApp
                                template
                            </button>
                        </div>
                    </form>
                )}
                <TemplateList
                    rows={whatsappTemplates.map((t) => ({
                        id: t.id,
                        title: `${t.name} (${t.language})`,
                        detail: `${t.source_name} · ${t.variable_count} blank${t.variable_count === 1 ? '' : 's'}${t.is_active ? '' : ' · Off'}`,
                        active: t.is_active,
                        onToggle: () =>
                            router.post(
                                templateRoutes.whatsapp.toggle.url(t.id),
                                {},
                                { preserveScroll: true },
                            ),
                        onDelete: () =>
                            setDeleteTarget({
                                url: templateRoutes.whatsapp.destroy.url(t.id),
                                label: `Remove the "${t.name}" template from the CMS? (It stays in WhatsApp Manager.)`,
                            }),
                    }))}
                />
            </section>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-1`}>Messenger</p>
                <p className="mb-4 text-sm text-zinc-500">
                    Written here and created with Meta directly. One per Page.
                    It must read as an update about something the person already
                    has with you — not an offer. Approved templates can&apos;t
                    be edited: delete and create a new one.
                </p>
                {messengerSources.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                        No Messenger channel yet.
                    </p>
                ) : (
                    <form
                        onSubmit={addMessenger}
                        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4"
                    >
                        <label className="block">
                            <span className={LABEL}>Page</span>
                            <select
                                className={SELECT}
                                value={messenger.data.source_id}
                                onChange={(e) =>
                                    messenger.setData(
                                        'source_id',
                                        e.target.value,
                                    )
                                }
                            >
                                {messengerSources.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block sm:col-span-2">
                            <span className={LABEL}>Template name</span>
                            <input
                                className={`${INPUT} font-mono`}
                                value={messenger.data.name}
                                onChange={(e) =>
                                    messenger.setData('name', e.target.value)
                                }
                                placeholder="inquiry_update"
                            />
                        </label>
                        <label className="block">
                            <span className={LABEL}>Language</span>
                            <input
                                className={`${INPUT} font-mono`}
                                value={messenger.data.language}
                                onChange={(e) =>
                                    messenger.setData(
                                        'language',
                                        e.target.value,
                                    )
                                }
                            />
                        </label>
                        <label className="block sm:col-span-4">
                            <span className={LABEL}>
                                Text — use {'{{1}}'}, {'{{2}}'} for blanks
                            </span>
                            <textarea
                                rows={3}
                                maxLength={1024}
                                className={INPUT}
                                value={messenger.data.body_text}
                                onChange={(e) =>
                                    messenger.setData(
                                        'body_text',
                                        e.target.value,
                                    )
                                }
                                placeholder={exampleMessengerBody}
                            />
                        </label>
                        <div className="flex flex-wrap justify-between gap-2 sm:col-span-4">
                            <button
                                type="button"
                                onClick={() =>
                                    messenger.setData(
                                        'body_text',
                                        exampleMessengerBody,
                                    )
                                }
                                className="text-xs text-cyan-300 hover:underline"
                            >
                                Use the example text
                            </button>
                            <button
                                type="submit"
                                disabled={messenger.processing}
                                className={PRIMARY_BUTTON}
                            >
                                {messenger.processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}{' '}
                                Create with Meta
                            </button>
                        </div>
                    </form>
                )}
                <TemplateList
                    rows={messengerTemplates.map((t) => ({
                        id: t.id,
                        title: `${t.name} (${t.language})`,
                        detail: `${t.source_name} · ${t.body_text}`,
                        onDelete: () =>
                            setDeleteTarget({
                                url: templateRoutes.messenger.destroy.url(t.id),
                                label: `Delete the "${t.name}" template? It's deleted with Meta too.`,
                            }),
                    }))}
                />
            </section>
        </div>
    );
}

function TemplateList({
    rows,
}: {
    rows: {
        id: string;
        title: string;
        detail: string;
        active?: boolean;
        onToggle?: () => void;
        onDelete: () => void;
    }[];
}) {
    if (rows.length === 0) {
        return <p className="text-sm text-zinc-500">No templates yet.</p>;
    }

    return (
        <ul className="divide-y divide-white/5">
            {rows.map((row) => (
                <li
                    key={row.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                >
                    <div className="min-w-0">
                        <p className="font-mono text-sm text-white">
                            {row.title}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                            {row.detail}
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                        {row.onToggle && (
                            <button
                                type="button"
                                onClick={row.onToggle}
                                title={row.active ? 'Turn off' : 'Turn on'}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-white/5"
                            >
                                <Power
                                    className={`h-4 w-4 ${row.active ? 'text-emerald-400' : ''}`}
                                />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={row.onDelete}
                            title="Delete"
                            className="rounded-lg p-2 text-red-400/70 hover:bg-red-500/10"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
}

Templates.layout = (page: ReactNode) => (
    <AdminLayout title="Message Templates">{page}</AdminLayout>
);
