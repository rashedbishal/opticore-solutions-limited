import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Edit, Film, Image, Plus, Trash2, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
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
    media_type: 'image' | 'video' | 'youtube';
    youtube_video_id: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    portfolios: {
        data: Portfolio[];
        links: PaginationLink[];
    };
}

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
}

export default function PortfolioIndex({ portfolios }: Props) {
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
            destroy(adminRoutes.portfolios.destroy.url(id));
        });
    };

    const hasPagination =
        portfolios.links.filter((l) => l.url !== null).length > 2;

    return (
        <div className="space-y-6">
            <CmsDeleteDialog
                open={deleteTarget !== null}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Portfolios</h1>
                <Link
                    href={adminRoutes.portfolios.create.url()}
                    className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full"
                >
                    <Plus className="h-4 w-4" /> Add Portfolio
                </Link>
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Preview
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Type
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {portfolios.data.map((portfolio) => (
                            <tr
                                key={portfolio.id}
                                className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                            >
                                <td className="px-6 py-2 whitespace-nowrap">
                                    {portfolio.media_type === 'youtube' &&
                                    portfolio.youtube_video_id ? (
                                        <img
                                            src={`https://img.youtube.com/vi/${portfolio.youtube_video_id}/mqdefault.jpg`}
                                            alt={portfolio.title}
                                            loading="lazy"
                                            width={40}
                                            height={40}
                                            className="h-10 w-10 rounded border border-white/10 object-cover"
                                        />
                                    ) : portfolio.media_path ? (
                                        portfolio.media_type === 'video' ? (
                                            <video
                                                src={portfolio.media_path}
                                                muted
                                                preload="metadata"
                                                className="h-10 w-10 rounded border border-white/10 object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={portfolio.media_path}
                                                alt={portfolio.title}
                                                loading="lazy"
                                                decoding="async"
                                                width={40}
                                                height={40}
                                                className="h-10 w-10 rounded border border-white/10 object-cover"
                                            />
                                        )
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded bg-zinc-800 text-zinc-600">
                                            <Image className="h-4 w-4" />
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-2 text-sm whitespace-nowrap text-white">
                                    {portfolio.title}
                                </td>
                                <td className="px-6 py-2 text-sm whitespace-nowrap text-zinc-400 capitalize">
                                    {portfolio.sub_category
                                        ? portfolio.sub_category.name
                                        : portfolio.category.replace(/-/g, ' ')}
                                </td>
                                <td className="px-6 py-2 whitespace-nowrap">
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-wide ${
                                            portfolio.media_type === 'youtube'
                                                ? 'border-red-500/20 bg-red-500/10 text-red-400'
                                                : portfolio.media_type === 'video'
                                                  ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400'
                                                  : 'border-violet-500/20 bg-violet-500/10 text-violet-400'
                                        }`}
                                    >
                                        {portfolio.media_type === 'youtube' ? (
                                            <>
                                                <PlayCircle className="h-3 w-3" />{' '}
                                                YouTube
                                            </>
                                        ) : portfolio.media_type === 'video' ? (
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
                                <td className="px-6 py-2 text-right text-sm whitespace-nowrap">
                                    <Link
                                        href={adminRoutes.portfolios.edit.url(
                                            portfolio.id,
                                        )}
                                        className="mr-4 inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/70 transition-colors hover:text-cyan-300"
                                    >
                                        <Edit className="h-4 w-4" /> Edit
                                    </Link>
                                    <button
                                        onClick={() =>
                                            handleDelete(portfolio.id)
                                        }
                                        className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
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
                                    className="px-6 py-16 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                        No records found
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {hasPagination && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {portfolios.links.map((link, i) => {
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

PortfolioIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Manage Portfolios">{page}</AdminLayout>
);
