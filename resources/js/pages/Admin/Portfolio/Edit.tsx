import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';
import { Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import type { FormEventHandler, ReactNode } from 'react';

interface SubCategory {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    portfolio: {
        id: number;
        title: string;
        category: string;
        sub_category_id: number | null;
        alt: string | null;
        media_path: string | null;
        media_type: 'image' | 'video';
    };
    categories: Record<string, string>;
    subCategoriesByCategory: Record<string, SubCategory[]>;
}

export default function PortfolioEdit({
    portfolio,
    categories,
    subCategoriesByCategory,
}: Props) {
    const [selectedCategory, setSelectedCategory] = useState(
        portfolio.category || Object.keys(categories)[0],
    );

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        title: portfolio.title,
        sub_category_id: portfolio.sub_category_id || ('' as string | number),
        alt: portfolio.alt || '',
        media: null as File | null,
    });

    const currentSubCategories =
        subCategoriesByCategory[selectedCategory] || [];

    // Reset sub_category_id when category changes if the current one is not in the new category
    useEffect(() => {
        if (currentSubCategories.length > 0) {
            const exists = currentSubCategories.some(
                (s) => s.id === Number(data.sub_category_id),
            );
            if (!exists) {
                setData('sub_category_id', currentSubCategories[0].id);
            }
        } else {
            setData('sub_category_id', '');
        }
    }, [selectedCategory]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(adminRoutes.portfolios.update.url(portfolio.id));
    };

    return (
        <div className="max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold text-white">
                Edit Portfolio
            </h1>
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <form onSubmit={submit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Title
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                            required
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    {/* Category Selection (UI only, to filter sub-categories) */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Category
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) =>
                                setSelectedCategory(e.target.value)
                            }
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
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
                        <label className="block text-sm font-medium text-zinc-300">
                            Sub-Category
                        </label>
                        <select
                            value={data.sub_category_id}
                            onChange={(e) =>
                                setData('sub_category_id', e.target.value)
                            }
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
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
                                    href={adminRoutes.portfolioSubCategories.create.url()}
                                    className="underline"
                                >
                                    create one first
                                </Link>
                                .
                            </p>
                        )}
                        {errors.sub_category_id && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.sub_category_id}
                            </p>
                        )}
                    </div>

                    {/* Alt / Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Alt / Description
                        </label>
                        <input
                            type="text"
                            value={data.alt}
                            onChange={(e) => setData('alt', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                        />
                    </div>

                    {/* Current Media Preview */}
                    {portfolio.media_path && (
                        <div>
                            <p className="mb-1 text-xs font-medium tracking-wider text-zinc-400 uppercase">
                                Current Media
                            </p>
                            {portfolio.media_type === 'video' ? (
                                <video
                                    src={portfolio.media_path}
                                    muted
                                    preload="metadata"
                                    className="h-24 w-40 rounded-lg border border-white/10 object-cover"
                                />
                            ) : (
                                <img
                                    src={portfolio.media_path}
                                    alt="Current"
                                    className="h-24 w-40 rounded-lg border border-white/10 object-cover"
                                />
                            )}
                        </div>
                    )}

                    {/* Media Upload */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Replace Media{' '}
                            <span className="font-normal text-zinc-500">
                                (Leave empty to keep current)
                            </span>
                        </label>
                        <p className="mt-0.5 text-xs text-zinc-500">
                            Accepted: JPG, PNG, WEBP, GIF, MP4, MOV, AVI, WEBM ·
                            Max 100MB
                        </p>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-msvideo,video/webm"
                            onChange={(e) =>
                                setData('media', e.target.files?.[0] || null)
                            }
                            className="mt-2 block w-full text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-violet-500"
                        />
                        {errors.media && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.media}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-4 border-t border-white/10 pt-4">
                        <button
                            disabled={processing}
                            type="submit"
                            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                        >
                            Update Portfolio
                        </button>
                        <Link
                            href={adminRoutes.portfolios.index.url()}
                            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

PortfolioEdit.layout = (page: ReactNode) => (
    <AdminLayout title="Edit Portfolio">{page}</AdminLayout>
);
