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
            destroy(adminRoutes.subCategories.destroy.url(slug));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">
                    Sub Categories
                </h1>
                <Link
                    href={adminRoutes.subCategories.create.url()}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:from-violet-500 hover:to-cyan-500"
                >
                    <Plus className="h-4 w-4" /> Add Sub-Category
                </Link>
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Slug
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Order
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Items
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {subCategories.map((sub) => (
                            <tr
                                key={sub.id}
                                className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                            >
                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-white">
                                    {sub.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 font-mono text-[10px] tracking-wide text-violet-400">
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
                                        href={adminRoutes.subCategories.edit.url(
                                            sub.slug,
                                        )}
                                        className="mr-4 inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/70 transition-colors hover:text-cyan-300"
                                    >
                                        <Edit className="h-4 w-4" /> Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(sub.slug)}
                                        className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
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
                                <td colSpan={6} className="px-6 py-16 text-center">
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">No records found</p>
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
    <AdminLayout title="Sub Categories">{page}</AdminLayout>
);
