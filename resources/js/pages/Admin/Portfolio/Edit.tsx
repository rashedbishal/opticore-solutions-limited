import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

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

    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const { data, setData, post, processing } = useForm({
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const v: string[] = [];

        if (!data.sub_category_id) {
            v.push('Please select a sub-category.');
        }

        if (v.length > 0) {
            setErrorMessages(v);

            return;
        }

        post(adminRoutes.portfolios.update.url(portfolio.id), {
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
                Edit Portfolio
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
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
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
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
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
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
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
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                        />
                    </div>

                    {/* Current Media Preview */}
                    {portfolio.media_path && (
                        <div>
                            <p className="mb-1.5 font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
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
                                    loading="lazy"
                                    decoding="async"
                                    width={160}
                                    height={96}
                                    className="h-24 w-40 rounded-lg border border-white/10 object-cover"
                                />
                            )}
                        </div>
                    )}

                    {/* Media Upload */}
                    <div>
                        <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                            Replace Media{' '}
                            <span className="font-normal text-zinc-500 normal-case">
                                (Leave empty to keep current)
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
                            className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-zinc-400 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-violet-600/80 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500"
                        />
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
                                    Updating...
                                </>
                            ) : (
                                'Update Portfolio'
                            )}
                        </button>
                        <Link
                            href={adminRoutes.portfolios.index.url()}
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

PortfolioEdit.layout = (page: ReactNode) => (
    <AdminLayout title="Edit Portfolio">{page}</AdminLayout>
);
