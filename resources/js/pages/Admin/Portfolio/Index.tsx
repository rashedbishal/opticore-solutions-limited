import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';
import { Link, useForm } from '@inertiajs/react';
import { Edit, Film, Image, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface Portfolio {
    id: number;
    title: string;
    category: string;
    media_path: string | null;
    media_type: 'image' | 'video';
}

interface Props {
    portfolios: {
        data: Portfolio[];
        links: unknown[];
    };
}

export default function PortfolioIndex({ portfolios }: Props) {
    const { delete: destroy } = useForm();

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this portfolio?')) {
            destroy(adminRoutes.portfolios.destroy.url(id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Portfolios</h1>
                <Link
                    href={adminRoutes.portfolios.create.url()}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Portfolio
                </Link>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 tracking-wider">Preview</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 tracking-wider">Type</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {portfolios.data.map((portfolio) => (
                            <tr key={portfolio.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {portfolio.media_path ? (
                                        portfolio.media_type === 'video' ? (
                                            <video
                                                src={portfolio.media_path}
                                                muted
                                                preload="metadata"
                                                className="w-14 h-14 rounded object-cover border border-white/10"
                                            />
                                        ) : (
                                            <img
                                                src={portfolio.media_path}
                                                alt={portfolio.title}
                                                className="w-14 h-14 rounded object-cover border border-white/10"
                                            />
                                        )
                                    ) : (
                                        <div className="w-14 h-14 rounded bg-zinc-800 flex items-center justify-center text-zinc-600">
                                            <Image className="w-5 h-5" />
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{portfolio.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 capitalize">
                                    {portfolio.sub_category ? portfolio.sub_category.name : portfolio.category.replace(/-/g, ' ')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        portfolio.media_type === 'video'
                                            ? 'bg-cyan-500/10 text-cyan-400'
                                            : 'bg-violet-500/10 text-violet-400'
                                    }`}>
                                        {portfolio.media_type === 'video'
                                            ? <><Film className="w-3 h-3" /> Video</>
                                            : <><Image className="w-3 h-3" /> Image</>
                                        }
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <Link
                                        href={adminRoutes.portfolios.edit.url(portfolio.id)}
                                        className="text-blue-400 hover:text-blue-300 mr-4 inline-flex items-center gap-1.5"
                                    >
                                        <Edit className="w-4 h-4" /> Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(portfolio.id)}
                                        className="text-red-400 hover:text-red-300 inline-flex items-center gap-1.5"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {portfolios.data.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-sm">
                                    No portfolios found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

PortfolioIndex.layout = (page: ReactNode) => <AdminLayout title="Manage Portfolios">{page}</AdminLayout>;
