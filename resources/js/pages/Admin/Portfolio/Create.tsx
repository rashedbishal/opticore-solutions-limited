import { Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import type { FormEventHandler, ReactNode } from 'react';
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

                    {/* Media Upload */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Media{' '}
                            <span className="font-normal text-zinc-500">
                                (Image or Video)
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
                            required
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
                            Save Portfolio
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

PortfolioCreate.layout = (page: ReactNode) => (
    <AdminLayout title="Add Portfolio">{page}</AdminLayout>
);
