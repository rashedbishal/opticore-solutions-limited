import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface SubCategory {
    id: number;
    category_slug: string;
    category_label: string;
    name: string;
    slug: string;
    description: string | null;
    price: string | null;
    rating: number | null;
    reviews_count: number;
    image: string | null;
    sort_order: number;
    portfolios_count: number;
}

interface Props {
    subCategories: SubCategory[];
}

export default function PortfolioSubCategoryIndex({ subCategories }: Props) {
    const { delete: destroy } = useForm();

    const handleDelete = (slug: string) => {
        if (
            confirm(
                'Are you sure you want to delete this sub-category? This will only work if no portfolios are assigned to it.',
            )
        ) {
            destroy(
                adminRoutes.portfolioSubCategories.destroy.url(slug),
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">
                    Portfolio Sub-Categories
                </h1>
                <Link
                    href={adminRoutes.portfolioSubCategories.create.url()}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                    <Plus className="h-4 w-4" /> Add Sub-Category
                </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Slug
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Order
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Items
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-zinc-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {subCategories.map((sub) => (
                            <tr
                                key={sub.id}
                                className="transition-colors hover:bg-white/5"
                            >
                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-white">
                                    {sub.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400">
                                        {sub.category_label}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-zinc-400">
                                    {sub.slug}
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-400">
                                    {sub.sort_order}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-zinc-400">
                                        {sub.portfolios_count} works
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                    <Link
                                        href={adminRoutes.portfolioSubCategories.edit.url(
                                            sub.slug,
                                        )}
                                        className="mr-4 inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
                                    >
                                        <Edit className="h-4 w-4" /> Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(sub.slug)}
                                        className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 disabled:opacity-50"
                                        disabled={sub.portfolios_count > 0}
                                        title={
                                            sub.portfolios_count > 0
                                                ? 'Cannot delete while portfolios are assigned'
                                                : ''
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {subCategories.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-8 text-center text-sm text-zinc-500"
                                >
                                    No sub-categories found. Create one to get
                                    started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

PortfolioSubCategoryIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Portfolio Sub-Categories">{page}</AdminLayout>
);
