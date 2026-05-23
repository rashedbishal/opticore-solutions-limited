import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
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
        image: null as File | null,
        sort_order: 0,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(adminRoutes.subCategories.store.url(), { forceFormData: true });
    };

    return (
        <div className="max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold text-white">
                Create Sub-Category
            </h1>
            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-6 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <form onSubmit={submit} className="space-y-6">
                    {/* Category */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Parent Category
                        </label>
                        <select
                            value={data.category_slug}
                            onChange={(e) =>
                                setData('category_slug', e.target.value)
                            }
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                            required
                        >
                            {Object.entries(categories).map(([slug, label]) => (
                                <option key={slug} value={slug}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        {errors.category_slug && (
                            <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                {errors.category_slug}
                            </p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Name
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Logo & Identity"
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                            required
                        />
                        {errors.name && (
                            <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Slug{' '}
                            <span className="font-normal normal-case text-zinc-500">
                                (Leave empty to auto-generate)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            placeholder="e.g. logo-identity"
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 font-mono text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                        {errors.slug && (
                            <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                {errors.slug}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Description
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            rows={3}
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                        {errors.description && (
                            <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Starting Price
                        </label>
                        <input
                            type="text"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            placeholder="e.g. 500 BDT"
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                        {errors.price && (
                            <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                {errors.price}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
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
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                            />
                            {errors.rating && (
                                <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                    {errors.rating}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
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
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                            />
                            {errors.reviews_count && (
                                <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                    {errors.reviews_count}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Image
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData('image', e.target.files?.[0] ?? null)
                            }
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-violet-600/80 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500 outline-none"
                        />
                        {errors.image && (
                            <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                {errors.image}
                            </p>
                        )}
                    </div>

                    {/* Sort Order */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
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
                            className="block w-64 rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                        {errors.sort_order && (
                            <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                {errors.sort_order}
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
                                    Creating...
                                </>
                            ) : (
                                'Create Sub-Category'
                            )}
                        </button>
                        <Link
                            href={adminRoutes.subCategories.index.url()}
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

PortfolioSubCategoryCreate.layout = (page: ReactNode) => (
    <AdminLayout title="Add Sub-Category">{page}</AdminLayout>
);
