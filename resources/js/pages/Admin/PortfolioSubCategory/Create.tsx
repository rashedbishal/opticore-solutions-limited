import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Props {
    categories: Record<string, string>;
}

export default function PortfolioSubCategoryCreate({ categories }: Props) {
    const categoryKeys = Object.keys(categories);

    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const { data, setData, post, processing } = useForm({
        category_slug: categoryKeys[0] ?? '',
        name: '',
        slug: '',
        description: '',
        price: '',
        rating: '5.0',
        reviews_count: 0,
        image: null as File | null,
        sort_order: 0,
        meta_title: '',
        meta_description: '',
        og_title: '',
        og_description: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const v: string[] = [];

        if (!data.category_slug) {
            v.push('Please select a parent category.');
        }

        if (!data.name.trim()) {
            v.push('Sub-category name is required.');
        }

        if (v.length > 0) {
            setErrorMessages(v);

            return;
        }

        post(adminRoutes.subCategories.store.url(), {
            forceFormData: true,
            onError: (errs) =>
                setErrorMessages(
                    Object.values(errs).filter(Boolean) as string[],
                ),
        });
    };

    return (
        <div className="max-w-2xl">
            <CmsErrorDialog
                messages={errorMessages}
                onClose={() => setErrorMessages([])}
            />
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
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        >
                            {Object.entries(categories).map(([slug, label]) => (
                                <option key={slug} value={slug}>
                                    {label}
                                </option>
                            ))}
                        </select>
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
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Slug{' '}
                            <span className="font-normal text-zinc-500 normal-case">
                                (Leave empty to auto-generate)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            placeholder="e.g. logo-identity"
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 font-mono text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
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
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
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
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
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
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                            />
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
                                className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                            />
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
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-zinc-400 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-violet-600/80 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500"
                        />
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
                            className="block w-64 rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                    </div>

                    {/* SEO / Meta */}
                    <div className="border-t border-violet-500/10 pt-6">
                        <p className="mb-4 font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            SEO / Meta
                        </p>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
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
                                    placeholder="Leave blank to use the sub-category name"
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
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
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                    Meta Description{' '}
                                    <span className="font-normal text-zinc-500 normal-case">
                                        (max 320 chars)
                                    </span>
                                </label>
                                <textarea
                                    value={data.meta_description}
                                    onChange={(e) =>
                                        setData(
                                            'meta_description',
                                            e.target.value,
                                        )
                                    }
                                    maxLength={320}
                                    rows={3}
                                    placeholder="Leave blank to use the description"
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
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
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 border-t border-violet-500/10 pt-4">
                        <button
                            disabled={processing}
                            type="submit"
                            className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full disabled:opacity-50"
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
                            className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
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
