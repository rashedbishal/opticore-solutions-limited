import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Edit, Film, Image, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Portfolio {
    id: number;
    title: string;
    category: string;
    sub_category?: {
        id: number;
        name: string;
    } | null;
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
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Portfolios</h1>
                <Link
                    href={adminRoutes.portfolios.create.url()}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                    <Plus className="h-4 w-4" /> Add Portfolio
                </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Preview
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Type
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-zinc-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {portfolios.data.map((portfolio) => (
                            <tr
                                key={portfolio.id}
                                className="transition-colors hover:bg-white/5"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {portfolio.media_path ? (
                                        portfolio.media_type === 'video' ? (
                                            <video
                                                src={portfolio.media_path}
                                                muted
                                                preload="metadata"
                                                className="h-14 w-14 rounded border border-white/10 object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={portfolio.media_path}
                                                alt={portfolio.title}
                                                className="h-14 w-14 rounded border border-white/10 object-cover"
                                            />
                                        )
                                    ) : (
                                        <div className="flex h-14 w-14 items-center justify-center rounded bg-zinc-800 text-zinc-600">
                                            <Image className="h-5 w-5" />
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-white">
                                    {portfolio.title}
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-400 capitalize">
                                    {portfolio.sub_category
                                        ? portfolio.sub_category.name
                                        : portfolio.category.replace(/-/g, ' ')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            portfolio.media_type === 'video'
                                                ? 'bg-cyan-500/10 text-cyan-400'
                                                : 'bg-violet-500/10 text-violet-400'
                                        }`}
                                    >
                                        {portfolio.media_type === 'video' ? (
                                            <>
                                                <Film className="h-3 w-3" />{' '}
                                                Video
                                            </>
                                        ) : (
                                            <>
                                                <Image className="h-3 w-3" />{' '}
                                                Image
                                            </>
                                        )}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                    <Link
                                        href={adminRoutes.portfolios.edit.url(
                                            portfolio.id,
                                        )}
                                        className="mr-4 inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
                                    >
                                        <Edit className="h-4 w-4" /> Edit
                                    </Link>
                                    <button
                                        onClick={() =>
                                            handleDelete(portfolio.id)
                                        }
                                        className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {portfolios.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-6 py-8 text-center text-sm text-zinc-500"
                                >
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

PortfolioIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Manage Portfolios">{page}</AdminLayout>
);
