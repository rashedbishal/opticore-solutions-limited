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
        image: string | null;
    }
}

export default function PortfolioEdit({ portfolio }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        title: portfolio.title,
        category: portfolio.category,
        alt: portfolio.alt || '',
        image: null as File | null,
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
                    <div>
                        <label className="block text-sm font-medium text-zinc-300">Title</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 text-white px-3 py-2 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            required
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300">Category</label>
                        <select
                            value={data.category}
                            onChange={e => setData('category', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 text-white px-3 py-2 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                        >
                            <option value="logo-identity">Logo & Identity</option>
                            <option value="packaging-design">Packaging Design</option>
                            <option value="social-media-graphics">Social Media Graphics</option>
                            <option value="print-design">Print Design</option>
                            <option value="photoshop-editing">Photoshop Editing</option>
                        </select>
                        {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300">Alt/Description</label>
                        <input
                            type="text"
                            value={data.alt}
                            onChange={e => setData('alt', e.target.value)}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 text-white px-3 py-2 focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300">Image (Leave empty to keep current)</label>
                        {portfolio.image && (
                            <div className="mb-2">
                                <img src={portfolio.image} alt="Current" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                            </div>
                        )}
                        <input
                            type="file"
                            onChange={e => setData('image', e.target.files?.[0] || null)}
                            className="mt-1 block w-full text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-violet-500"
                        />
                        {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/10">
                        <button disabled={processing} type="submit" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50">
                            Update Portfolio
                        </button>
                        <Link href={adminRoutes.portfolios.index.url()} className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

PortfolioEdit.layout = (page: ReactNode) => <AdminLayout title="Edit Portfolio">{page}</AdminLayout>;
