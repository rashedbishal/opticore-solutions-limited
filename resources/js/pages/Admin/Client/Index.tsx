import type { ReactNode } from 'react';
import { useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    EyeOff,
    MessageSquare,
    Phone,
    Trash2,
    Workflow,
} from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface ClientRecord {
    id: number;
    name: string;
    email: string;
    phone_number: string | null;
    avatar: string | null;
    role: string;
    created_at: string;
    email_verified_at: string | null;
    conversations_count: number;
    tasks_count: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    clients: {
        data: ClientRecord[];
        links: PaginationLink[];
        total: number;
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

type DeleteStep = 'warning' | 'password';

interface DeleteState {
    client: ClientRecord;
    step: DeleteStep;
}

export default function ClientIndex({ clients }: Props) {
    const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const {
        delete: destroy,
        data,
        setData,
        processing,
        errors,
        reset,
    } = useForm({ password: '' });

    const hasPagination =
        clients.links.filter((l) => l.url !== null).length > 2;

    function openDeleteFlow(client: ClientRecord) {
        reset();
        setShowPassword(false);
        const hasRelated =
            client.conversations_count > 0 || client.tasks_count > 0;
        setDeleteState({ client, step: hasRelated ? 'warning' : 'password' });
    }

    function closeModal() {
        setDeleteState(null);
        reset();
        setShowPassword(false);
    }

    function proceedToPassword() {
        if (deleteState) {
            setDeleteState({ ...deleteState, step: 'password' });
        }
    }

    function submitDelete(e: React.FormEvent) {
        e.preventDefault();

        if (!deleteState) {
            return;
        }

        destroy(adminRoutes.clients.destroy.url(deleteState.client.id), {
            onSuccess: closeModal,
        });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                    {clients.total} {clients.total === 1 ? 'client' : 'clients'}{' '}
                    registered
                </p>
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Client
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase md:table-cell">
                                Phone
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase sm:table-cell">
                                Activity
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase sm:table-cell">
                                Status
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase lg:table-cell">
                                Joined
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">No records found</p>
                                </td>
                            </tr>
                        ) : (
                            clients.data.map((client) => (
                                <tr
                                    key={client.id}
                                    className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                                >
                                    {/* Client */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {client.avatar ? (
                                                <img
                                                    src={client.avatar}
                                                    alt={client.name}
                                                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(client.name)} text-xs font-bold text-white`}
                                                >
                                                    {getInitials(client.name)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-white">
                                                    {client.name}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-zinc-500">
                                                    {client.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Phone */}
                                    <td className="hidden px-6 py-4 md:table-cell">
                                        {client.phone_number ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-zinc-300">
                                                <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                                {client.phone_number}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    {/* Activity */}
                                    <td className="hidden px-6 py-4 sm:table-cell">
                                        <div className="flex flex-wrap gap-2">
                                            {client.conversations_count > 0 && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400">
                                                    <MessageSquare className="h-3 w-3" />
                                                    {client.conversations_count}{' '}
                                                    chat
                                                    {client.conversations_count !==
                                                        1 && 's'}
                                                </span>
                                            )}
                                            {client.tasks_count > 0 && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400">
                                                    <Workflow className="h-3 w-3" />
                                                    {client.tasks_count}{' '}
                                                    workflow
                                                    {client.tasks_count !== 1 &&
                                                        's'}
                                                </span>
                                            )}
                                            {client.conversations_count === 0 &&
                                                client.tasks_count === 0 && (
                                                    <span className="text-xs text-zinc-600">
                                                        No activity
                                                    </span>
                                                )}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="hidden px-6 py-4 sm:table-cell">
                                        {client.email_verified_at ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                                                <CheckCircle className="h-3 w-3" />
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                                                <Clock className="h-3 w-3" />
                                                Unverified
                                            </span>
                                        )}
                                    </td>

                                    {/* Joined */}
                                    <td className="hidden px-6 py-4 text-sm whitespace-nowrap text-zinc-500 lg:table-cell">
                                        {formatDate(client.created_at)}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button
                                            onClick={() =>
                                                openDeleteFlow(client)
                                            }
                                            className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">
                                                Delete
                                            </span>
                                        </button>
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
                    {clients.links.map((link, i) => {
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
                            <a
                                key={i}
                                href={link.url}
                                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                                    link.active
                                        ? 'border border-violet-500/30 bg-violet-500/10 text-violet-300'
                                        : 'border border-white/8 bg-white/4 text-zinc-400 hover:bg-white/8'
                                }`}
                            >
                                {label}
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Delete Modal */}
            {deleteState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/20 bg-[#060c1a] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                        {deleteState.step === 'warning' ? (
                            <>
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            Delete Client
                                        </h3>
                                        <p className="text-xs text-zinc-500">
                                            {deleteState.client.name}
                                        </p>
                                    </div>
                                </div>

                                <p className="mb-3 text-sm text-zinc-300">
                                    This client has existing data that will also
                                    be permanently deleted:
                                </p>

                                <ul className="mb-5 space-y-2">
                                    {deleteState.client.conversations_count >
                                        0 && (
                                        <li className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300">
                                            <MessageSquare className="h-4 w-4 shrink-0" />
                                            {
                                                deleteState.client
                                                    .conversations_count
                                            }{' '}
                                            chat conversation
                                            {deleteState.client
                                                .conversations_count !== 1 &&
                                                's'}{' '}
                                            (including all messages and offers)
                                        </li>
                                    )}
                                    {deleteState.client.tasks_count > 0 && (
                                        <li className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-300">
                                            <Workflow className="h-4 w-4 shrink-0" />
                                            {deleteState.client.tasks_count}{' '}
                                            workflow
                                            {deleteState.client.tasks_count !==
                                                1 && 's'}
                                        </li>
                                    )}
                                </ul>

                                <p className="mb-5 text-xs text-zinc-500">
                                    This action is permanent and cannot be
                                    undone.
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={closeModal}
                                        className="flex-1 rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/8 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={proceedToPassword}
                                        className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
                                    >
                                        Proceed Anyway
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                                        <Trash2 className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            Confirm Deletion
                                        </h3>
                                        <p className="text-xs text-zinc-500">
                                            {deleteState.client.name}
                                        </p>
                                    </div>
                                </div>

                                <p className="mb-4 text-sm text-zinc-300">
                                    Enter your admin password to permanently
                                    delete this client and all associated data.
                                </p>

                                <form onSubmit={submitDelete}>
                                    <div className="relative mb-4">
                                        <input
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={data.password}
                                            onChange={(e) =>
                                                setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Your admin password"
                                            autoFocus
                                            className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-10 pl-4 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-red-500/50 focus:bg-red-500/5"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((p) => !p)
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                        {errors.password && (
                                            <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/8 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={
                                                processing || !data.password
                                            }
                                            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing
                                                ? 'Deleting...'
                                                : 'Delete Client'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

ClientIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Clients">{page}</AdminLayout>
);
