import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Edit2, Phone, Plus, Shield, Trash2, User } from 'lucide-react';
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

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            destroy(adminRoutes.users.destroy.url(id));
        }
    };

    const hasPagination = users.links.filter((l) => l.url !== null).length > 2;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                    {users.total} {users.total === 1 ? 'user' : 'users'}{' '}
                    registered
                </p>
                <Link
                    href={adminRoutes.users.create.url()}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                    <Plus className="h-4 w-4" />
                    Add User
                </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/50">
                <table className="w-full">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                User
                            </th>
                            <th className="hidden px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400 sm:table-cell">
                                Role
                            </th>
                            <th className="hidden px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400 md:table-cell">
                                Phone
                            </th>
                            <th className="hidden px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400 lg:table-cell">
                                Joined
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-zinc-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-6 py-16 text-center text-sm text-zinc-500"
                                >
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            users.data.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b border-white/10 transition-colors last:border-0 hover:bg-white/5"
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
                                                        <span className="hidden shrink-0 rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400 sm:inline">
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

                                    {/* Role */}
                                    <td className="hidden px-6 py-4 sm:table-cell">
                                        {user.role === 'admin' ? (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
                                                <Shield className="h-3 w-3" />
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-400">
                                                <User className="h-3 w-3" />
                                                User
                                            </span>
                                        )}
                                    </td>

                                    {/* Phone */}
                                    <td className="hidden px-6 py-4 md:table-cell">
                                        {user.phone_number ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-zinc-300">
                                                <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                                {user.phone_number}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    {/* Joined */}
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
                                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-blue-500/10 hover:text-blue-400"
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
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
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
                                        ? 'border border-cyan-500/30 bg-cyan-500/15 text-cyan-400'
                                        : 'border border-white/10 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
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
