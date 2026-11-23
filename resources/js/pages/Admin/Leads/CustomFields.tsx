import type { FormEvent, ReactNode } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Lock, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import {
    CARD,
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
    SELECT,
} from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import catalog from '@/routes/admin/leads/catalog';

interface FieldRow {
    id: string;
    name: string;
    type: string;
    type_label: string;
    options: string[];
    is_required: boolean;
    is_active: boolean;
    sort_order: number;
    values_count: number;
}

interface Props {
    fields: FieldRow[];
    typeOptions: { value: string; label: string }[];
}

const EMPTY = {
    name: '',
    type: 'text',
    options_text: '',
    is_required: false,
    is_active: true,
    sort_order: '0',
};

/**
 * Leads → Custom Fields (managers): extra details recorded on every lead,
 * e.g. "Event date" or "Number of pages".
 */
export default function CustomFields({ fields, typeOptions }: Props) {
    const [errors, setErrors] = useState<string[]>([]);
    const [editing, setEditing] = useState<FieldRow | null>(null);
    const [deleting, setDeleting] = useState<FieldRow | null>(null);
    const form = useForm(EMPTY);
    const locked = editing !== null && editing.values_count > 0;

    const onError = (e: Record<string, string>) =>
        setErrors(Object.values(e).filter(Boolean));

    const reset = () => {
        setEditing(null);
        form.setData(EMPTY);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: reset, onError };

        if (editing) {
            form.put(catalog.fields.update.url(editing.id), options);
        } else {
            form.post(catalog.fields.store.url(), options);
        }
    };

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />
            <CmsDeleteDialog
                open={deleting !== null}
                message={`Delete "${deleting?.name}"? Its value on ${deleting?.values_count ?? 0} lead(s) is deleted too.`}
                onConfirm={() => {
                    if (deleting) {
                        router.delete(catalog.fields.destroy.url(deleting.id), {
                            preserveScroll: true,
                        });
                    }

                    setDeleting(null);
                }}
                onCancel={() => setDeleting(null)}
            />
            <div>
                <h1 className="text-2xl font-bold text-white">Custom Fields</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Extra details to record on every lead. They appear in the
                    “More details” card on each lead.
                </p>
            </div>

            <form
                onSubmit={submit}
                className={`${CARD} grid grid-cols-1 gap-4 sm:grid-cols-2`}
            >
                <label className="block">
                    <span className={LABEL}>
                        {editing ? 'Edit field' : 'New field'}
                    </span>
                    <input
                        className={INPUT}
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Event date"
                        maxLength={255}
                        required
                    />
                </label>
                <label className="block">
                    <span className={LABEL}>Type</span>
                    <select
                        className={SELECT}
                        value={form.data.type}
                        disabled={locked}
                        onChange={(e) => form.setData('type', e.target.value)}
                    >
                        {typeOptions.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </label>
                {form.data.type === 'select' && (
                    <label className="block sm:col-span-2">
                        <span className={LABEL}>Choices (one per line)</span>
                        <textarea
                            rows={4}
                            className={INPUT}
                            value={form.data.options_text}
                            disabled={locked}
                            onChange={(e) =>
                                form.setData('options_text', e.target.value)
                            }
                            placeholder={'Small\nMedium\nLarge'}
                        />
                    </label>
                )}
                {locked && (
                    <p className="flex items-center gap-2 text-xs text-amber-300 sm:col-span-2">
                        <Lock className="h-3.5 w-3.5" /> Some leads already have
                        a value, so the type and choices can no longer change.
                    </p>
                )}
                <label className="block">
                    <span className={LABEL}>Order</span>
                    <input
                        type="number"
                        min={0}
                        max={9999}
                        className={INPUT}
                        value={form.data.sort_order}
                        onChange={(e) =>
                            form.setData('sort_order', e.target.value)
                        }
                    />
                </label>
                <div className="flex flex-wrap items-end gap-4">
                    <label className="flex items-center gap-2 text-sm text-zinc-300">
                        <input
                            type="checkbox"
                            checked={form.data.is_required}
                            onChange={(e) =>
                                form.setData('is_required', e.target.checked)
                            }
                        />
                        Must be filled in
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-300">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(e) =>
                                form.setData('is_active', e.target.checked)
                            }
                        />
                        Turned on
                    </label>
                </div>
                <div className="flex justify-end gap-2 sm:col-span-2">
                    {editing && (
                        <button
                            type="button"
                            onClick={reset}
                            className={SECONDARY_BUTTON}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={form.processing}
                        className={PRIMARY_BUTTON}
                    >
                        <Plus className="h-4 w-4" />
                        {editing ? 'Save field' : 'Add field'}
                    </button>
                </div>
            </form>

            <section className={CARD}>
                {fields.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                        No custom fields yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {fields.map((field) => (
                            <li
                                key={field.id}
                                className="flex items-center justify-between gap-3 py-2.5"
                            >
                                <div className="min-w-0">
                                    <p
                                        className={`text-sm ${field.is_active ? 'text-white' : 'text-zinc-500'}`}
                                    >
                                        {field.name}
                                        {field.is_required && ' *'}
                                    </p>
                                    <p className="truncate text-xs text-zinc-500">
                                        {[
                                            field.type_label,
                                            field.options.length > 0 &&
                                                field.options.join(', '),
                                            `${field.values_count} lead${field.values_count === 1 ? '' : 's'} filled`,
                                            !field.is_active && 'Off',
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <button
                                        type="button"
                                        title={
                                            field.is_active
                                                ? 'Turn off'
                                                : 'Turn on'
                                        }
                                        onClick={() =>
                                            router.post(
                                                catalog.fields.toggle.url(
                                                    field.id,
                                                ),
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="rounded-lg p-2 text-zinc-400 hover:bg-white/5"
                                    >
                                        <Power
                                            className={`h-4 w-4 ${field.is_active ? 'text-emerald-400' : ''}`}
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        title="Edit"
                                        onClick={() => {
                                            setEditing(field);
                                            form.setData({
                                                name: field.name,
                                                type: field.type,
                                                options_text:
                                                    field.options.join('\n'),
                                                is_required: field.is_required,
                                                is_active: field.is_active,
                                                sort_order: String(
                                                    field.sort_order,
                                                ),
                                            });
                                        }}
                                        className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        title="Delete"
                                        onClick={() => setDeleting(field)}
                                        className="rounded-lg p-2 text-red-400/70 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
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

CustomFields.layout = (page: ReactNode) => (
    <AdminLayout title="Custom Fields">{page}</AdminLayout>
);
