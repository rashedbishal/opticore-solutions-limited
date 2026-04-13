import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';
import { Link, useForm } from '@inertiajs/react';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { ReactNode } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    users: {
        data: User[];
        links: any[];
    };
    auth: {
        user: {
            id: number;
        };
    };
}

export default function UserIndex({ users, auth }: Props) {
    const { delete: destroy } = useForm();

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            destroy(adminRoutes.users.destroy.url(id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Users</h1>
                <Link
                    href={adminRoutes.users.create.url()}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                    <Plus className="h-4 w-4" /> Add User
                </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Email
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-zinc-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {users.data.map((user) => (
                            <tr
                                key={user.id}
                                className="transition-colors hover:bg-white/5"
                            >
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-white">
                                    {user.name}
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-400">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                    <Link
                                        href={adminRoutes.users.edit.url(
                                            user.id,
                                        )}
                                        className="mr-4 inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
                                    >
                                        <Edit className="h-4 w-4" /> Edit
                                    </Link>
                                    {auth.user.id !== user.id && (
                                        <button
                                            onClick={() =>
                                                handleDelete(user.id)
                                            }
                                            className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="h-4 w-4" />{' '}
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

UserIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Manage Users">{page}</AdminLayout>
);
