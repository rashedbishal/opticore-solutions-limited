import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Loader2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

const INPUT =
    'block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5';
const LABEL =
    'mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase';

interface CategoryData {
    id: number;
    slug: string;
    label: string;
    description: string | null;
    sort_order: number;
}

interface Props {
    category: CategoryData;
}

export function CategoryForm({ category }: Partial<Props>) {
    const isEditing = Boolean(category);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const { data, setData, post, processing } = useForm({
        ...(isEditing ? { _method: 'PUT' } : {}),
        slug: category?.slug ?? '',
        label: category?.label ?? '',
        description: category?.description ?? '',
        sort_order: category?.sort_order ?? 0,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(
            isEditing
                ? adminRoutes.categories.update.url(category!.id)
                : adminRoutes.categories.store.url(),
            {
                onError: (errs) =>
                    setErrorMessages(
                        Object.values(errs).filter(Boolean) as string[],
                    ),
            },
        );
    };

    return (
        <>
            <CmsErrorDialog
                messages={errorMessages}
                onClose={() => setErrorMessages([])}
            />
            <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
                <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-8 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                    <div className="grid gap-6">
                        <div>
                            <label className={LABEL}>Slug</label>
                            <input
                                type="text"
                                value={data.slug}
                                onChange={(e) =>
                                    setData('slug', e.target.value)
                                }
                                placeholder="e.g. graphic-design"
                                disabled={isEditing}
                                className={`${INPUT} ${isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
                            />
                            {isEditing && (
                                <p className="mt-1.5 text-xs text-zinc-500">
                                    The slug cannot be changed after creation.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={LABEL}>Label</label>
                            <input
                                type="text"
                                value={data.label}
                                onChange={(e) =>
                                    setData('label', e.target.value)
                                }
                                placeholder="e.g. Graphic Design"
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Description</label>
                            <textarea
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                rows={4}
                                placeholder="Short description shown for this category."
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Sort Order</label>
                            <input
                                type="number"
                                min={0}
                                value={data.sort_order}
                                onChange={(e) =>
                                    setData(
                                        'sort_order',
                                        Number(e.target.value),
                                    )
                                }
                                className={INPUT}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        disabled={processing}
                        type="submit"
                        className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />{' '}
                                {isEditing ? 'Update Category' : 'Save Category'}
                            </>
                        )}
                    </button>
                    <Link
                        href={adminRoutes.categories.index.url()}
                        className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                    >
                        <X className="h-4 w-4" /> Cancel
                    </Link>
                </div>
            </form>
        </>
    );
}

export default function CategoryCreate() {
    return <CategoryForm />;
}

CategoryCreate.layout = (page: ReactNode) => (
    <AdminLayout title="Add Category">{page}</AdminLayout>
);
