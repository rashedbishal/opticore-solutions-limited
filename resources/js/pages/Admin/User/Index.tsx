import type { FormEvent, ReactNode } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import LeadTransferDeleteDialog from '@/components/Admin/Leads/LeadTransferDeleteDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface UserRecord {
    id: number;
    name: string;
    email: string;
    is_super_admin: boolean;
    full_access: boolean;
    permissions: string[] | null;
    email_verified_at: string | null;
    created_at: string;
    owned_leads_count: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Filters {
    search?: string;
}

interface Props {
    users: {
        data: UserRecord[];
        links: PaginationLink[];
        total: number;
    };
    filters: Filters;
    leadReceivers: { id: number; name: string }[];
    auth: {
        user: {
            id: number;
            is_super_admin: boolean;
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

export default function UserIndex({
    users,
    filters,
    leadReceivers,
    auth,
}: Props) {
    const { delete: destroy } = useForm();
    const [deleteTarget, setDeleteTarget] = useState<(() => void) | null>(null);
    const requestDelete = (action: () => void) => setDeleteTarget(() => action);
    const confirmDelete = () => {
        deleteTarget?.();
        setDeleteTarget(null);
    };
    const cancelDelete = () => setDeleteTarget(null);

    const [transferTarget, setTransferTarget] = useState<UserRecord | null>(
        null,
    );

    const handleDelete = (user: UserRecord) => {
        // Someone who still owns leads needs a receiver picked first.
        if (user.owned_leads_count > 0) {
            setTransferTarget(user);

            return;
        }

        requestDelete(() => {
            destroy(adminRoutes.users.destroy.url(user.id));
        });
    };

    const [search, setSearch] = useState(filters.search ?? '');
    const hasActiveFilters = Boolean(filters.search);

    function applyFilters(e: FormEvent) {
        e.preventDefault();
        const params: Record<string, string> = {};

        if (search.trim()) {
            params.search = search.trim();
        }

        router.get(adminRoutes.users.index.url(), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function resetFilters() {
        setSearch('');
        router.get(
            adminRoutes.users.index.url(),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    const hasPagination = users.links.filter((l) => l.url !== null).length > 2;

    return (
        <div className="space-y-6">
            <LeadTransferDeleteDialog
                admin={transferTarget}
                receivers={leadReceivers}
                onConfirm={(receiverId) => {
                    if (transferTarget) {
                        router.delete(
                            adminRoutes.users.destroy.url(transferTarget.id),
                            { data: { transfer_to: receiverId } },
                        );
                    }

                    setTransferTarget(null);
                }}
                onCancel={() => setTransferTarget(null)}
            />
            <CmsDeleteDialog
                open={deleteTarget !== null}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                    {users.total} {users.total === 1 ? 'admin' : 'admins'}{' '}
                    registered
                </p>
                {auth.user.is_super_admin && (
                    <Link
                        href={adminRoutes.users.create.url()}
                        className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full"
                    >
                        <Plus className="h-4 w-4" />
                        Add Admin
                    </Link>
                )}
            </div>

            {/* Search bar */}
            <div className="rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-3 backdrop-blur-sm sm:p-4">
                <form
                    onSubmit={applyFilters}
                    className="flex flex-wrap items-end gap-2"
                >
                    <div className="min-w-48 flex-1">
                        <label className="mb-0.5 block font-mono text-[10px] tracking-[0.18em] text-violet-400/60 uppercase">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Admin name or email"
                                className="block w-full rounded-lg border border-white/8 bg-white/4 py-1.5 pr-3 pl-8 text-xs text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="submit"
                            className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/20"
                        >
                            Apply
                        </button>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                title="Reset filters"
                                className="flex items-center justify-center rounded-lg border border-white/8 bg-white/4 p-1.5 text-zinc-400 transition-colors hover:bg-white/8 hover:text-white"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Admin
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
                                    {/* Admin */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(user.name)} text-xs font-bold text-white`}
                                            >
                                                {getInitials(user.name)}
                                            </div>
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
                                                    {user.is_super_admin && (
                                                        <span className="hidden shrink-0 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-violet-300 uppercase sm:inline">
                                                            Mother Admin
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
                                            {auth.user.is_super_admin &&
                                                auth.user.id !== user.id && (
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(user)
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
    <AdminLayout title="Admins">{page}</AdminLayout>
);
