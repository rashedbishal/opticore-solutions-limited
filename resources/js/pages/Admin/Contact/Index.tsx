import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Mail, MessageSquare, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Contact {
    id: number;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    contacts: {
        data: Contact[];
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

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function decodePaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»');
}

export default function ContactIndex({ contacts }: Props) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const { delete: destroy } = useForm();

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this message?')) {
            destroy(adminRoutes.contacts.destroy.url(id));
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const hasPagination =
        contacts.links.filter((l) => l.url !== null).length > 2;

    return (
        <div className="space-y-6">
            {/* Count */}
            <p className="text-sm text-zinc-500">
                {contacts.total} {contacts.total === 1 ? 'message' : 'messages'}{' '}
                received
            </p>

            {/* Table */}
            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                From
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase sm:table-cell">
                                Subject
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase lg:table-cell">
                                Message
                            </th>
                            <th className="hidden px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase sm:table-cell">
                                Date
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-6 py-16 text-center"
                                >
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">No messages found</p>
                                </td>
                            </tr>
                        ) : (
                            contacts.data.map((contact) => {
                                const isExpanded = expandedId === contact.id;

                                return (
                                    <Fragment key={contact.id}>
                                        {/* Main row */}
                                        <tr
                                            onClick={() =>
                                                toggleExpand(contact.id)
                                            }
                                            className={`cursor-pointer border-b border-white/4 transition-colors last:border-0 ${
                                                isExpanded
                                                    ? 'bg-violet-500/5'
                                                    : 'hover:bg-violet-500/5'
                                            }`}
                                        >
                                            {/* From */}
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-white">
                                                    {contact.name}
                                                </p>
                                                <p className="mt-0.5 max-w-[14rem] truncate text-xs text-zinc-500 sm:max-w-none">
                                                    {contact.email}
                                                </p>
                                            </td>

                                            {/* Subject */}
                                            <td className="hidden px-6 py-4 sm:table-cell">
                                                {contact.subject ? (
                                                    <span className="block max-w-[12rem] truncate text-sm text-zinc-300">
                                                        {contact.subject}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-600">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            {/* Message preview */}
                                            <td className="hidden px-6 py-4 lg:table-cell">
                                                <p className="max-w-[22rem] truncate text-sm text-zinc-400">
                                                    {contact.message}
                                                </p>
                                            </td>

                                            {/* Date */}
                                            <td className="hidden px-6 py-4 text-sm whitespace-nowrap text-zinc-500 sm:table-cell">
                                                {formatDate(contact.created_at)}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(
                                                                contact.id,
                                                            );
                                                        }}
                                                        title="Delete message"
                                                        className="font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                    <ChevronDown
                                                        className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                                                            isExpanded
                                                                ? 'rotate-180'
                                                                : ''
                                                        }`}
                                                    />
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expandable content row */}
                                        <tr>
                                            <td colSpan={5} className="p-0">
                                                <AnimatePresence
                                                    initial={false}
                                                >
                                                    {isExpanded && (
                                                        <motion.div
                                                            key="content"
                                                            initial={{
                                                                height: 0,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                height: 'auto',
                                                                opacity: 1,
                                                            }}
                                                            exit={{
                                                                height: 0,
                                                                opacity: 0,
                                                            }}
                                                            transition={{
                                                                duration: 0.22,
                                                                ease: 'easeInOut',
                                                            }}
                                                            style={{
                                                                overflow:
                                                                    'hidden',
                                                            }}
                                                        >
                                                            <div className="border-b border-violet-500/10 bg-violet-500/5 px-6 py-5">
                                                                {/* Subject on mobile (hidden in column) */}
                                                                {contact.subject && (
                                                                    <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-cyan-400 sm:hidden">
                                                                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                                                                        {
                                                                            contact.subject
                                                                        }
                                                                    </p>
                                                                )}

                                                                {/* Full message */}
                                                                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-zinc-200">
                                                                    {
                                                                        contact.message
                                                                    }
                                                                </p>

                                                                {/* Footer */}
                                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                                                    <span className="text-xs text-zinc-500">
                                                                        {formatDateTime(
                                                                            contact.created_at,
                                                                        )}
                                                                    </span>
                                                                    <a
                                                                        href={`mailto:${contact.email}`}
                                                                        onClick={(
                                                                            e,
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400"
                                                                    >
                                                                        <Mail className="h-3.5 w-3.5" />
                                                                        Reply
                                                                        via
                                                                        email
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </td>
                                        </tr>
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {hasPagination && (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-2">
                    {contacts.links.map((link, i) => {
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

ContactIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Contacts & Feedback">{page}</AdminLayout>
);
