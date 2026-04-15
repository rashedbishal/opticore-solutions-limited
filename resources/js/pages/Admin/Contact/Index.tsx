import type { ReactNode } from 'react';
import { useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
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

interface Props {
    contacts: {
        data: Contact[];
        links: any[];
    };
}

export default function ContactIndex({ contacts }: Props) {
    const { delete: destroy } = useForm();

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this feedback message?')) {
            destroy(adminRoutes.contacts.destroy.url(id));
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="mb-6 text-2xl font-bold text-white">
                Contact & Feedback
            </h1>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                From
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Subject & Message
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-zinc-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {contacts.data.map((contact) => (
                            <tr
                                key={contact.id}
                                className="transition-colors hover:bg-white/5"
                            >
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-400">
                                    {new Date(
                                        contact.created_at,
                                    ).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <p className="font-medium text-white">
                                        {contact.name}
                                    </p>
                                    <p className="text-zinc-500">
                                        {contact.email}
                                    </p>
                                </td>
                                <td className="max-w-sm px-6 py-4 text-sm text-zinc-300 xl:max-w-md">
                                    {contact.subject && (
                                        <p className="mb-1 font-semibold text-white">
                                            {contact.subject}
                                        </p>
                                    )}
                                    <p className="truncate">
                                        {contact.message}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                    <button
                                        onClick={() => handleDelete(contact.id)}
                                        className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {contacts.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-8 text-center text-sm text-zinc-500"
                                >
                                    No contact messages found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

ContactIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Manage Contacts">{page}</AdminLayout>
);
