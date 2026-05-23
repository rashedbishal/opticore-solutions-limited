import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface SubCategory {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    categories: Record<string, string>;
    subCategoriesByCategory: Record<string, SubCategory[]>;
}

export default function PortfolioCreate({
    categories,
    subCategoriesByCategory,
}: Props) {
    const categoryKeys = Object.keys(categories);
    const [selectedCategory, setSelectedCategory] = useState(
        categoryKeys[0] ?? '',
    );

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        sub_category_id: '' as string | number,
        alt: '',
        media: null as File | null,
    });

    const currentSubCategories =
        subCategoriesByCategory[selectedCategory] || [];

    // Reset sub_category_id when category changes if the current one is not in the new category
    useEffect(() => {
        if (currentSubCategories.length > 0) {
            // Pick first sub-category by default if none selected or if switching categories
            const exists = currentSubCategories.some(
                (s) => s.id === data.sub_category_id,
            );

            if (!exists) {
                setData('sub_category_id', currentSubCategories[0].id);
            }
        } else {
            setData('sub_category_id', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(adminRoutes.portfolios.store.url());
    };

    return (
        <div className="max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold text-white">
                Create Portfolio
            </h1>
            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-6 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <form onSubmit={submit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Title
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                            required
                        />
                        {errors.title && (
                            <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    {/* Category Selection (UI only, to filter sub-categories) */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Category
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) =>
                                setSelectedCategory(e.target.value)
                            }
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                        >
                            {Object.entries(categories).map(([slug, label]) => (
                                <option key={slug} value={slug}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sub-Category Selection (Actual field sent to server) */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Sub-Category
                        </label>
                        <select
                            value={data.sub_category_id}
                            onChange={(e) =>
                                setData('sub_category_id', e.target.value)
                            }
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                            required
                        >
                            <option value="">Select a sub-category</option>
                            {currentSubCategories.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                        {currentSubCategories.length === 0 && (
                            <p className="mt-1 text-xs text-amber-400">
                                No sub-categories found for this category.
                                Please{' '}
                                <Link
                                    href={adminRoutes.subCategories.create.url()}
                                    className="underline"
                                >
                                    create one first
                                </Link>
                                .
                            </p>
                        )}
                        {errors.sub_category_id && (
                            <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                {errors.sub_category_id}
                            </p>
                        )}
                    </div>

                    {/* Alt / Description */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Alt / Description
                        </label>
                        <input
                            type="text"
                            value={data.alt}
                            onChange={(e) => setData('alt', e.target.value)}
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                    </div>

                    {/* Media Upload */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Media{' '}
                            <span className="font-normal normal-case text-zinc-500">
                                (Image or Video)
                            </span>
                        </label>
                        <p className="mb-2 text-xs text-zinc-500">
                            Accepted: JPG, PNG, WEBP, GIF, MP4, MOV, AVI, WEBM ·
                            Max 100MB
                        </p>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-msvideo,video/webm"
                            onChange={(e) =>
                                setData('media', e.target.files?.[0] || null)
                            }
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-violet-600/80 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500 outline-none"
                            required
                        />
                        {errors.media && (
                            <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                {errors.media}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-4 border-t border-violet-500/10 pt-4">
                        <button
                            disabled={processing}
                            type="submit"
                            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                    Saving...
                                </>
                            ) : (
                                'Save Portfolio'
                            )}
                        </button>
                        <Link
                            href={adminRoutes.portfolios.index.url()}
                            className="rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/8 hover:text-white"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

PortfolioCreate.layout = (page: ReactNode) => (
    <AdminLayout title="Add Portfolio">{page}</AdminLayout>
);
