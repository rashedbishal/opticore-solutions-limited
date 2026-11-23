import type { FormEvent, ReactNode } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import {
    CARD,
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
} from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import { badgeClass, dotClass } from '@/lib/leadColors';
import catalog from '@/routes/admin/leads/catalog';

interface TagRow {
    id: string;
    name: string;
    color: string;
    leads_count: number;
}

interface Props {
    tags: TagRow[];
    colorOptions: string[];
}

/**
 * Leads → Tags (managers): the list of colour labels people can put on
 * leads.
 */
export default function Tags({ tags, colorOptions }: Props) {
    const [errors, setErrors] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<TagRow | null>(null);
    const form = useForm({ name: '', color: colorOptions[0] ?? 'blue' });

    const onError = (e: Record<string, string>) =>
        setErrors(Object.values(e).filter(Boolean));

    const reset = () => {
        setEditingId(null);
        form.setData({ name: '', color: colorOptions[0] ?? 'blue' });
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: reset, onError };

        if (editingId) {
            form.put(catalog.tags.update.url(editingId), options);
        } else {
            form.post(catalog.tags.store.url(), options);
        }
    };

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />
            <CmsDeleteDialog
                open={deleting !== null}
                message={`Delete the "${deleting?.name}" tag? It is removed from ${deleting?.leads_count ?? 0} lead(s).`}
                onConfirm={() => {
                    if (deleting) {
                        router.delete(catalog.tags.destroy.url(deleting.id), {
                            preserveScroll: true,
                        });
                    }

                    setDeleting(null);
                }}
                onCancel={() => setDeleting(null)}
            />
            <div>
                <h1 className="text-2xl font-bold text-white">Lead Tags</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Colour labels such as “VIP” or “Hot”. Anyone working a lead
                    can put these on it.
                </p>
            </div>

            <form onSubmit={submit} className={`${CARD} space-y-4`}>
                <label className="block">
                    <span className={LABEL}>
                        {editingId ? 'Edit tag' : 'New tag'}
                    </span>
                    <input
                        className={INPUT}
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="VIP"
                        maxLength={255}
                        required
                    />
                </label>
                <div>
                    <span className={LABEL}>Colour</span>
                    <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color) => (
                            <button
                                key={color}
                                type="button"
                                aria-label={color}
                                onClick={() => form.setData('color', color)}
                                className={`h-7 w-7 rounded-full ${dotClass(color)} ring-offset-2 ring-offset-[#060c1a] transition-transform hover:scale-110 ${form.data.color === color ? 'ring-2 ring-white' : ''}`}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    {editingId && (
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
                        {editingId ? 'Save tag' : 'Add tag'}
                    </button>
                </div>
            </form>

            <section className={CARD}>
                {tags.length === 0 ? (
                    <p className="text-sm text-zinc-500">No tags yet.</p>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {tags.map((tag) => (
                            <li
                                key={tag.id}
                                className="flex items-center justify-between gap-3 py-2.5"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span
                                        className={`rounded-full border px-2.5 py-0.5 text-xs ${badgeClass(tag.color)}`}
                                    >
                                        {tag.name}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        {tag.leads_count} lead
                                        {tag.leads_count === 1 ? '' : 's'}
                                    </span>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <button
                                        type="button"
                                        title="Edit"
                                        onClick={() => {
                                            setEditingId(tag.id);
                                            form.setData({
                                                name: tag.name,
                                                color: tag.color,
                                            });
                                        }}
                                        className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        title="Delete"
                                        onClick={() => setDeleting(tag)}
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

Tags.layout = (page: ReactNode) => (
    <AdminLayout title="Lead Tags">{page}</AdminLayout>
);
