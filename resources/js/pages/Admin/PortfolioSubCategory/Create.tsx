import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Props {
    categories: Record<string, string>;
}

export default function PortfolioSubCategoryCreate({ categories }: Props) {
    const categoryKeys = Object.keys(categories);

    const { data, setData, post, processing, errors } = useForm({
        category_slug: categoryKeys[0] ?? '',
        name: '',
        slug: '',
        description: '',
        price: '',
        rating: '5.0',
        reviews_count: 0,
        image: '',
        sort_order: 0,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(adminRoutes.portfolioSubCategories.store.url());
    };

    return (
        <div className="max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold text-white">
                Create Sub-Category
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
                            placeholder="e.g. Logo & Identity"
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
                            Slug{' '}
                            <span className="font-normal text-zinc-500">
                                (Leave empty to auto-generate)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            placeholder="e.g. logo-identity"
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-white focus:border-violet-500 focus:outline-none sm:text-sm"
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

                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Starting Price
                        </label>
                        <input
                            type="text"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            placeholder="e.g. 500 BDT"
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                        />
                        {errors.price && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.price}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300">
                                Rating
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                value={data.rating}
                                onChange={(e) =>
                                    setData('rating', e.target.value)
                                }
                                className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                            />
                            {errors.rating && (
                                <p className="mt-1 text-sm text-red-400">
                                    {errors.rating}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300">
                                Reviews Count
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.reviews_count}
                                onChange={(e) =>
                                    setData(
                                        'reviews_count',
                                        Number.parseInt(e.target.value) || 0,
                                    )
                                }
                                className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                            />
                            {errors.reviews_count && (
                                <p className="mt-1 text-sm text-red-400">
                                    {errors.reviews_count}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Image URL
                        </label>
                        <input
                            type="url"
                            value={data.image}
                            onChange={(e) => setData('image', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none sm:text-sm"
                        />
                        {errors.image && (
                            <p className="mt-1 text-sm text-red-400">
                                {errors.image}
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
                            Create Sub-Category
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

PortfolioSubCategoryCreate.layout = (page: ReactNode) => (
    <AdminLayout title="Add Sub-Category">{page}</AdminLayout>
);
