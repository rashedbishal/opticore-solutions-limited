import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Edit, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Testimonial {
    id: number;
    name: string;
    company: string;
    role: string;
    rating: number;
    comment: string;
    sort_order: number;
    is_active: boolean;
    image_url: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    testimonials: {
        data: Testimonial[];
        links: PaginationLink[];
    };
}

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
}

export default function TestimonialIndex({ testimonials }: Props) {
    const { delete: destroy } = useForm();
    const [deleteTarget, setDeleteTarget] = useState<(() => void) | null>(null);
    const requestDelete = (action: () => void) => setDeleteTarget(() => action);
    const confirmDelete = () => {
        deleteTarget?.();
        setDeleteTarget(null);
    };
    const cancelDelete = () => setDeleteTarget(null);

    const handleDelete = (id: number) => {
        requestDelete(() => {
            destroy(adminRoutes.testimonials.destroy.url(id));
        });
    };

    const hasPagination =
        testimonials.links.filter((l) => l.url !== null).length > 2;

    return (
        <div className="space-y-6">
            <CmsDeleteDialog
                open={deleteTarget !== null}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Testimonials</h1>
                <Link
                    href={adminRoutes.testimonials.create.url()}
                    className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full"
                >
                    <Plus className="h-4 w-4" /> Add Testimonial
                </Link>
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Person
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Rating
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Comment
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {testimonials.data.map((t) => (
                            <tr
                                key={t.id}
                                className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                            >
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        {t.image_url ? (
                                            <img
                                                src={t.image_url}
                                                alt={t.name}
                                                loading="lazy"
                                                decoding="async"
                                                width={36}
                                                height={36}
                                                className="h-9 w-9 rounded-full border border-white/10 object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                                                {t.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {t.name}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {t.role} · {t.company}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className={`h-3.5 w-3.5 ${s <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                                            />
                                        ))}
                                    </div>
                                </td>
                                <td className="max-w-xs px-6 py-3">
                                    <p className="truncate text-sm text-zinc-400">
                                        {t.comment}
                                    </p>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <span
                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-wide ${
                                            t.is_active
                                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                                : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-500'
                                        }`}
                                    >
                                        {t.is_active ? 'Active' : 'Hidden'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right text-sm whitespace-nowrap">
                                    <Link
                                        href={adminRoutes.testimonials.edit.url(
                                            t.id,
                                        )}
                                        className="mr-4 inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/70 transition-colors hover:text-cyan-300"
                                    >
                                        <Edit className="h-4 w-4" /> Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {testimonials.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-6 py-16 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                        No testimonials found
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {hasPagination && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {testimonials.links.map((link, i) => {
                        const label = decodePaginationLabel(link.label);

                        if (!link.url) {
                            return (
                                <span
                                    key={i}
                                    className="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm text-zinc-600"
                                >
                                    {label}
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={i}
                                href={link.url}
                                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                                    link.active
                                        ? 'border border-violet-500/30 bg-violet-500/10 text-violet-300'
                                        : 'border border-white/8 bg-white/4 text-zinc-400 hover:bg-white/8'
                                }`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

TestimonialIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Testimonials">{page}</AdminLayout>
);
