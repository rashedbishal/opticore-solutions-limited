import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface UserRecord {
    id: number;
    name: string;
    email: string;
    phone_number: string | null;
    avatar: string | null;
    role: string;
    email_verified_at: string | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    users: {
        data: UserRecord[];
        links: PaginationLink[];
        total: number;
    };
    auth: {
        user: {
            id: number;
        };
    };
}

const AVATAR_GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-700',
];

function avatarGradient(name: string): string {
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
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

export default function UserIndex({ users, auth }: Props) {
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
            destroy(adminRoutes.users.destroy.url(id));
        });
    };

    const hasPagination = users.links.filter((l) => l.url !== null).length > 2;

    return (
        <div className="space-y-6">
            <CmsDeleteDialog
                open={deleteTarget !== null}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                    {users.total} {users.total === 1 ? 'user' : 'users'}{' '}
                    registered
                </p>
                <Link
                    href={adminRoutes.users.create.url()}
                    className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full"
                >
                    <Plus className="h-4 w-4" />
                    Add User
                </Link>
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                User
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase lg:table-cell">
                                Created
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-6 py-16 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                                        No records found
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            users.data.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                                >
                                    {/* User */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    alt={user.name}
                                                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(user.name)} text-xs font-bold text-white`}
                                                >
                                                    {getInitials(user.name)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate font-medium text-white">
                                                        {user.name}
                                                    </p>
                                                    {auth.user.id ===
                                                        user.id && (
                                                        <span className="hidden shrink-0 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-cyan-400 uppercase sm:inline">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 truncate text-xs text-zinc-500">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Created */}
                                    <td className="hidden px-6 py-4 text-sm whitespace-nowrap text-zinc-500 lg:table-cell">
                                        {formatDate(user.created_at)}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={adminRoutes.users.edit.url(
                                                    user.id,
                                                )}
                                                className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/70 transition-colors hover:text-cyan-300"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">
                                                    Edit
                                                </span>
                                            </Link>
                                            {auth.user.id !== user.id && (
                                                <button
                                                    onClick={() =>
                                                        handleDelete(user.id)
                                                    }
                                                    className="ml-3 inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span className="hidden sm:inline">
                                                        Delete
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {hasPagination && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {users.links.map((link, i) => {
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

UserIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Users">{page}</AdminLayout>
);
