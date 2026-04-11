import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';
import { Link, useForm } from '@inertiajs/react';
import type { FormEventHandler, ReactNode } from 'react';

interface Props {
    portfolio: {
        id: number;
        title: string;
        category: string;
        alt: string | null;
        media_path: string | null;
        media_type: 'image' | 'video';
    };
    categories: Record<string, string>;
}

export default function PortfolioEdit({ portfolio, categories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        title: portfolio.title,
        category: portfolio.category,
        alt: portfolio.alt || '',
        media: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(adminRoutes.portfolios.update.url(portfolio.id));
    };

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white mb-6">Edit Portfolio</h1>
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <form onSubmit={submit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">Title</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 text-white px-3 py-2 focus:border-violet-500 focus:outline-none sm:text-sm"
                            required
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">Category</label>
                        <select
                            value={data.category}
                            onChange={e => setData('category', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 text-white px-3 py-2 focus:border-violet-500 focus:outline-none sm:text-sm"
                        >
                            {Object.entries(categories).map(([slug, label]) => (
                                <option key={slug} value={slug}>{label}</option>
                            ))}
                        </select>
                        {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category}</p>}
                    </div>

                    {/* Alt / Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">Alt / Description</label>
                        <input
                            type="text"
                            value={data.alt}
                            onChange={e => setData('alt', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 text-white px-3 py-2 focus:border-violet-500 focus:outline-none sm:text-sm"
                        />
                    </div>

                    {/* Current Media Preview */}
                    {portfolio.media_path && (
                        <div>
                            <p className="mb-1 text-xs font-medium text-zinc-400 uppercase tracking-wider">Current Media</p>
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
                            Replace Media <span className="text-zinc-500 font-normal">(Leave empty to keep current)</span>
                        </label>
                        <p className="mt-0.5 text-xs text-zinc-500">Accepted: JPG, PNG, WEBP, GIF, MP4, MOV, AVI, WEBM · Max 100MB</p>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-msvideo,video/webm"
                            onChange={e => setData('media', e.target.files?.[0] || null)}
                            className="mt-2 block w-full text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-violet-500"
                        />
                        {errors.media && <p className="mt-1 text-sm text-red-400">{errors.media}</p>}
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/10">
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

PortfolioEdit.layout = (page: ReactNode) => <AdminLayout title="Edit Portfolio">{page}</AdminLayout>;
