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

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default function CategoryCreate() {
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [slugEditedManually, setSlugEditedManually] = useState(false);
    const { data, setData, post, processing } = useForm({
        slug: '',
        label: '',
        description: '',
        sort_order: 0,
        meta_title: '',
        meta_description: '',
        og_title: '',
        og_description: '',
    });

    const updateLabel = (value: string) => {
        setData((current) => ({
            ...current,
            label: value,
            slug: slugEditedManually ? current.slug : slugify(value),
        }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(adminRoutes.categories.store.url(), {
            onError: (errs) =>
                setErrorMessages(
                    Object.values(errs).filter(Boolean) as string[],
                ),
        });
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
                            <label className={LABEL}>Label</label>
                            <input
                                type="text"
                                value={data.label}
                                onChange={(e) => updateLabel(e.target.value)}
                                placeholder="e.g. Graphic Design"
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>
                                Slug{' '}
                                <span className="font-normal text-zinc-500 normal-case">
                                    (auto-generated from the label — edit to
                                    customize)
                                </span>
                            </label>
                            <input
                                type="text"
                                value={data.slug}
                                onChange={(e) => {
                                    setSlugEditedManually(true);
                                    setData('slug', e.target.value);
                                }}
                                placeholder="e.g. graphic-design"
                                className={`${INPUT} font-mono`}
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

                <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-8 backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                    <p className={`${LABEL} mb-4`}>SEO / Meta</p>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label className={LABEL}>
                                Meta Title{' '}
                                <span className="font-normal text-zinc-500 normal-case">
                                    (max 160 chars)
                                </span>
                            </label>
                            <input
                                type="text"
                                value={data.meta_title}
                                onChange={(e) =>
                                    setData('meta_title', e.target.value)
                                }
                                maxLength={160}
                                placeholder="Leave blank to use the category label"
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>
                                OG Title{' '}
                                <span className="font-normal text-zinc-500 normal-case">
                                    (max 160 chars)
                                </span>
                            </label>
                            <input
                                type="text"
                                value={data.og_title}
                                onChange={(e) =>
                                    setData('og_title', e.target.value)
                                }
                                maxLength={160}
                                placeholder="Leave blank to use meta title"
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>
                                Meta Description{' '}
                                <span className="font-normal text-zinc-500 normal-case">
                                    (max 320 chars)
                                </span>
                            </label>
                            <textarea
                                value={data.meta_description}
                                onChange={(e) =>
                                    setData('meta_description', e.target.value)
                                }
                                maxLength={320}
                                rows={3}
                                placeholder="Leave blank to use the category description"
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>
                                OG Description{' '}
                                <span className="font-normal text-zinc-500 normal-case">
                                    (max 320 chars)
                                </span>
                            </label>
                            <textarea
                                value={data.og_description}
                                onChange={(e) =>
                                    setData('og_description', e.target.value)
                                }
                                maxLength={320}
                                rows={3}
                                placeholder="Leave blank to use meta description"
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
                                <Save className="h-4 w-4" /> Save Category
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

CategoryCreate.layout = (page: ReactNode) => (
    <AdminLayout title="Add Category">{page}</AdminLayout>
);
