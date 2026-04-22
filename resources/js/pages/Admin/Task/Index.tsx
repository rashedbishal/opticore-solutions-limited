import type { ReactNode } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { Edit, Plus, Trash2, Briefcase } from 'lucide-react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Task {
    id: number;
    client_name: string;
    client_email: string | null;
    category: string;
    sub_category?: {
        id: number;
        name: string;
    } | null;
    task_name: string;
    date: string | null;
    state: 'pending' | 'in progress' | 'delivered';
}

interface Props {
    tasks: {
        data: Task[];
        links: unknown[];
    };
}

export default function TaskIndex({ tasks }: Props) {
    const { delete: destroy } = useForm();

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this task?')) {
            destroy(adminRoutes.tasks.destroy.url(id));
        }
    };

    const handleStateChange = (id: number, newState: string) => {
        router.put(
            adminRoutes.tasks.update.url(id),
            { state: newState },
            { preserveScroll: true },
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">
                    Client Workflow Management
                </h1>
                <Link
                    href={adminRoutes.tasks.create.url()}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                    <Plus className="h-4 w-4" /> Add Task
                </Link>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/50">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Client
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Task Info
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-zinc-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {tasks.data.map((task) => (
                            <tr
                                key={task.id}
                                className="transition-colors hover:bg-white/5"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white">
                                            {task.client_name}
                                        </span>
                                        <span className="text-xs text-zinc-400">
                                            {task.client_email}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-zinc-500" />
                                        <span className="text-sm text-white">
                                            {task.task_name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-zinc-300 capitalize">
                                            {task.category.replace(/-/g, ' ')}
                                        </span>
                                        {task.sub_category && (
                                            <span className="text-xs text-zinc-500">
                                                {task.sub_category.name}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-300">
                                    {task.date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={task.state}
                                        onChange={(e) =>
                                            handleStateChange(
                                                task.id,
                                                e.target.value,
                                            )
                                        }
                                        className={`w-32 rounded-lg border-white/10 bg-zinc-800 px-3 py-1.5 text-sm font-medium focus:border-violet-500 focus:ring-violet-500 ${
                                            task.state === 'pending'
                                                ? 'text-yellow-400'
                                                : task.state === 'in progress'
                                                  ? 'text-blue-400'
                                                  : 'text-emerald-400'
                                        }`}
                                    >
                                        <option
                                            value="pending"
                                            className="text-white"
                                        >
                                            Pending
                                        </option>
                                        <option
                                            value="in progress"
                                            className="text-white"
                                        >
                                            In Progress
                                        </option>
                                        <option
                                            value="delivered"
                                            className="text-white"
                                        >
                                            Delivered
                                        </option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                    <Link
                                        href={adminRoutes.tasks.edit.url(
                                            task.id,
                                        )}
                                        className="mr-4 inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
                                    >
                                        <Edit className="h-4 w-4" /> Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {tasks.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-8 text-center text-sm text-zinc-500"
                                >
                                    No tasks found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

TaskIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Client Workflow Management">{page}</AdminLayout>
);
