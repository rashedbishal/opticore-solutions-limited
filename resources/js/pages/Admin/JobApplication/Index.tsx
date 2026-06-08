import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Download, ExternalLink, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface JobApplication {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    portfolio_url: string | null;
    resume_original_name: string;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    jobApplications: {
        data: JobApplication[];
        links: PaginationLink[];
        total: number;
    };
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
}

export default function JobApplicationIndex({ jobApplications }: Props) {
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
            destroy(adminRoutes.jobApplications.destroy.url(id));
        });
    };

    const hasPagination =
        jobApplications.links.filter((link) => link.url !== null).length > 2;

    return (
        <div className="space-y-6">
            <CmsDeleteDialog
                open={deleteTarget !== null}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                message="This will permanently delete the application and its uploaded resume file."
            />

            <p className="text-sm text-zinc-500">
                {jobApplications.total}{' '}
                {jobApplications.total === 1 ? 'application' : 'applications'}{' '}
                received
            </p>

            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Applicant
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase sm:table-cell">
                                Role
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase md:table-cell">
                                Phone
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase lg:table-cell">
                                Portfolio
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase sm:table-cell">
                                Applied
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobApplications.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-16 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                        No applications found
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            jobApplications.data.map((application) => (
                                <tr
                                    key={application.id}
                                    className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                                >
                                    {/* Applicant */}
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-white">
                                            {application.name}
                                        </p>
                                        <p className="mt-0.5 max-w-[14rem] truncate text-xs text-zinc-500 sm:max-w-none">
                                            {application.email}
                                        </p>
                                    </td>

                                    {/* Role */}
                                    <td className="hidden px-6 py-4 sm:table-cell">
                                        <span className="block max-w-[12rem] truncate text-sm text-zinc-300">
                                            {application.role}
                                        </span>
                                    </td>

                                    {/* Phone */}
                                    <td className="hidden px-6 py-4 text-sm whitespace-nowrap text-zinc-400 md:table-cell">
                                        {application.phone}
                                    </td>

                                    {/* Portfolio */}
                                    <td className="hidden px-6 py-4 lg:table-cell">
                                        {application.portfolio_url ? (
                                            <a
                                                href={application.portfolio_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-sm text-cyan-400/80 transition-colors hover:text-cyan-300"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                <span className="max-w-[12rem] truncate">
                                                    {application.portfolio_url}
                                                </span>
                                            </a>
                                        ) : (
                                            <span className="text-zinc-600">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    {/* Applied date */}
                                    <td className="hidden px-6 py-4 text-sm whitespace-nowrap text-zinc-500 sm:table-cell">
                                        {formatDate(application.created_at)}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-4">
                                            <a
                                                href={adminRoutes.jobApplications.resume.url(
                                                    application.id,
                                                )}
                                                title={`Download ${application.resume_original_name}`}
                                                className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/70 transition-colors hover:text-cyan-300"
                                            >
                                                <Download className="h-4 w-4" />{' '}
                                                Resume
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(application.id)
                                                }
                                                title="Delete application"
                                                className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
                                            >
                                                <Trash2 className="h-4 w-4" />{' '}
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {hasPagination && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {jobApplications.links.map((link, index) => {
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

JobApplicationIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Job Applications">{page}</AdminLayout>
);
