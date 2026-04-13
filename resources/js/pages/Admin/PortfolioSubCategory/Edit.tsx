import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';
import { Link, useForm } from '@inertiajs/react';
import type { FormEventHandler, ReactNode } from 'react';

interface SubCategory {
    id: number;
    category_slug: string;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
}

interface Props {
    subCategory: SubCategory;
    categories: Record<string, string>;
}

export default function PortfolioSubCategoryEdit({
    subCategory,
    categories,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        category_slug: subCategory.category_slug,
        name: subCategory.name,
        slug: subCategory.slug,
        description: subCategory.description || '',
        sort_order: subCategory.sort_order,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(adminRoutes.portfolioSubCategories.update.url(subCategory.slug));
    };

    return (
        <div className="max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold text-white">
                Edit Sub-Category
            </h1>
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <form onSubmit={submit} className="space-y-6">
                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Parent Category
                        </label>
                        <select
                            value={data.category_slug}
                            onChange={(e) =>
                                setData('category_slug', e.target.value)
                            }
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                            required
                        >
                            {Object.entries(categories).map(([slug, label]) => (
                                <option key={slug} value={slug}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        {errors.category_slug && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.category_slug}
                            </p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Name
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                            required
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Slug
                        </label>
                        <input
                            type="text"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                            required
                        />
                        {errors.slug && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.slug}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Description
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Sort Order */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Sort Order
                        </label>
                        <input
                            type="number"
                            value={data.sort_order}
                            onChange={(e) =>
                                setData(
                                    'sort_order',
                                    Number.parseInt(e.target.value) || 0,
                                )
                            }
                            className="mt-1 block w-64 rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                        />
                        {errors.sort_order && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.sort_order}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-4 border-t border-white/10 pt-4">
                        <button
                            disabled={processing}
                            type="submit"
                            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                        >
                            Update Sub-Category
                        </button>
                        <Link
                            href={adminRoutes.portfolioSubCategories.index.url()}
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

PortfolioSubCategoryEdit.layout = (page: ReactNode) => (
    <AdminLayout title="Edit Sub-Category">{page}</AdminLayout>
);
