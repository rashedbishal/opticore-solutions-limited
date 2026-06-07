import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Edit, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Faq {
    id: number;
    question: string;
    answer: string;
    sort_order: number;
    is_active: boolean;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    faqs: {
        data: Faq[];
        links: PaginationLink[];
    };
}

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
}

export default function FaqIndex({ faqs }: Props) {
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
            destroy(adminRoutes.faqs.destroy.url(id));
        });
    };

    const hasPagination =
        faqs.links.filter((link) => link.url !== null).length > 2;

    return (
        <div className="space-y-6">
            <CmsDeleteDialog
                open={deleteTarget !== null}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">FAQs</h1>
                <Link
                    href={adminRoutes.faqs.create.url()}
                    className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full"
                >
                    <Plus className="h-4 w-4" /> Add FAQ
                </Link>
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Question
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Sort
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
                        {faqs.data.map((faq) => (
                            <tr
                                key={faq.id}
                                className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                            >
                                <td className="max-w-xl px-6 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                                            <HelpCircle className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white">
                                                {faq.question}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-400">
                                    {faq.sort_order}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-wide ${
                                            faq.is_active
                                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                                : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-500'
                                        }`}
                                    >
                                        {faq.is_active ? 'Active' : 'Hidden'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                    <Link
                                        href={adminRoutes.faqs.edit.url(faq.id)}
                                        className="mr-4 inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/70 transition-colors hover:text-cyan-300"
                                    >
                                        <Edit className="h-4 w-4" /> Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(faq.id)}
                                        className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {faqs.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-16 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                        No FAQs found
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {hasPagination && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {faqs.links.map((link, index) => {
                        const label = decodePaginationLabel(link.label);

                        if (!link.url) {
                            return (
                                <span
                                    key={index}
                                    className="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm text-zinc-600"
                                >
                                    {label}
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={index}
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

FaqIndex.layout = (page: ReactNode) => (
    <AdminLayout title="FAQs">{page}</AdminLayout>
);
