import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';
import { Link, useForm } from '@inertiajs/react';
import { Edit, Layers, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface SubCategory {
    id: number;
    category_slug: string;
    category_label: string;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
    portfolios_count: number;
}

interface Props {
    subCategories: SubCategory[];
}

export default function PortfolioSubCategoryIndex({ subCategories }: Props) {
    const { delete: destroy } = useForm();

    const handleDelete = (slug: string) => {
        if (confirm('Are you sure you want to delete this sub-category? This will only work if no portfolios are assigned to it.')) {
            destroy(adminRoutes.portfolioSubCategories.destroy.url(slug));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Portfolio Sub-Categories</h1>
                <Link
                    href={adminRoutes.portfolioSubCategories.create.url()}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Sub-Category
                </Link>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 tracking-wider">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 tracking-wider">Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 tracking-wider">Items</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {subCategories.map((sub) => (
                            <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{sub.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400">
                                        {sub.category_label}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 font-mono text-xs">{sub.slug}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">{sub.sort_order}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-zinc-400">{sub.portfolios_count} works</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <Link
                                        href={adminRoutes.portfolioSubCategories.edit.url(sub.slug)}
                                        className="text-blue-400 hover:text-blue-300 mr-4 inline-flex items-center gap-1.5"
                                    >
                                        <Edit className="w-4 h-4" /> Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(sub.slug)}
                                        className="text-red-400 hover:text-red-300 inline-flex items-center gap-1.5 disabled:opacity-50"
                                        disabled={sub.portfolios_count > 0}
                                        title={sub.portfolios_count > 0 ? "Cannot delete while portfolios are assigned" : ""}
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {subCategories.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 text-sm">
                                    No sub-categories found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

PortfolioSubCategoryIndex.layout = (page: ReactNode) => <AdminLayout title="Portfolio Sub-Categories">{page}</AdminLayout>;
