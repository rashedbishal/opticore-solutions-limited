import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useRef, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface User {
    id: number;
    name: string;
    email: string;
}

interface SubCategory {
    id: number;
    name: string;
    slug: string;
}

interface Task {
    id: number;
    client_name: string;
    user_id: number;
    category: string;
    sub_category_id: number | null;
    task_name: string;
    date: string | null;
    state: 'pending' | 'in progress' | 'delivered';
    image_url: string | null;
}

interface Props {
    task: Task;
    categories: Record<string, string>;
    subCategoriesByCategory: Record<string, SubCategory[]>;
    users: User[];
}

export default function EditTask({
    task,
    categories,
    subCategoriesByCategory,
    users,
}: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        client_name: string;
        user_id: number;
        category: string;
        sub_category_id: number | string;
        task_name: string;
        date: string;
        state: string;
        image: File | null;
        remove_image: boolean;
        _method: string;
    }>({
        client_name: task.client_name,
        user_id: task.user_id,
        category: task.category,
        sub_category_id: task.sub_category_id ?? '',
        task_name: task.task_name,
        date: task.date ?? '',
        state: task.state,
        image: null,
        remove_image: false,
        _method: 'PUT',
    });

    const imageInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(task.image_url);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(adminRoutes.tasks.update.url(task.id), {
            forceFormData: true,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href={adminRoutes.tasks.index.url()}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Edit Task</h1>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Client Name
                            </label>
                            <input
                                type="text"
                                name="client_name"
                                value={data.client_name}
                                onChange={(e) =>
                                    setData('client_name', e.target.value)
                                }
                                className="w-full rounded-lg border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-violet-500 focus:ring-violet-500"
                                placeholder="Enter client name"
                                required
                            />
                            {errors.client_name && (
                                <p className="text-sm text-red-500">
                                    {errors.client_name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Client Email (User)
                            </label>
                            <select
                                name="user_id"
                                value={data.user_id}
                                onChange={(e) =>
                                    setData(
                                        'user_id',
                                        parseInt(e.target.value, 10),
                                    )
                                }
                                className="w-full rounded-lg border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-violet-500 focus:ring-violet-500"
                                required
                            >
                                <option value="">Select a user</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && (
                                <p className="text-sm text-red-500">
                                    {errors.user_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Category
                            </label>
                            <select
                                name="category"
                                value={data.category}
                                className="w-full rounded-lg border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-violet-500 focus:ring-violet-500"
                                onChange={(e) => {
                                    setData('category', e.target.value);
                                    setData('sub_category_id', '');
                                }}
                                required
                            >
                                <option value="">Select Category</option>
                                {Object.entries(categories).map(
                                    ([slug, label]) => (
                                        <option key={slug} value={slug}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                            {errors.category && (
                                <p className="text-sm text-red-500">
                                    {errors.category}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Sub-Category
                            </label>
                            <select
                                name="sub_category_id"
                                className="w-full rounded-lg border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-violet-500 focus:ring-violet-500 disabled:opacity-50"
                                disabled={!data.category}
                                value={data.sub_category_id}
                                onChange={(e) =>
                                    setData('sub_category_id', e.target.value)
                                }
                            >
                                <option value="">
                                    Select Sub-Category (Optional)
                                </option>
                                {data.category &&
                                    subCategoriesByCategory[
                                        data.category as string
                                    ]?.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.name}
                                        </option>
                                    ))}
                            </select>
                            {errors.sub_category_id && (
                                <p className="text-sm text-red-500">
                                    {errors.sub_category_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Task Name
                            </label>
                            <input
                                type="text"
                                name="task_name"
                                value={data.task_name}
                                onChange={(e) =>
                                    setData('task_name', e.target.value)
                                }
                                className="w-full rounded-lg border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-violet-500 focus:ring-violet-500"
                                placeholder="Enter task name"
                                required
                            />
                            {errors.task_name && (
                                <p className="text-sm text-red-500">
                                    {errors.task_name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={data.date}
                                onChange={(e) =>
                                    setData('date', e.target.value)
                                }
                                onClick={(e) => {
                                    try {
                                        (
                                            e.currentTarget as HTMLInputElement
                                        ).showPicker?.();
                                    } catch {
                                        // Fallback if showPicker is not supported or throws
                                    }
                                }}
                                style={{ colorScheme: 'dark' }}
                                className="w-full cursor-pointer rounded-lg border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-violet-500 focus:ring-violet-500"
                                required
                            />
                            {errors.date && (
                                <p className="text-sm text-red-500">
                                    {errors.date}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                State
                            </label>
                            <select
                                name="state"
                                value={data.state}
                                onChange={(e) =>
                                    setData('state', e.target.value as any)
                                }
                                className="w-full rounded-lg border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-violet-500 focus:ring-violet-500"
                                required
                            >
                                <option value="pending">Pending</option>
                                <option value="in progress">In Progress</option>
                                <option value="delivered">Delivered</option>
                            </select>
                            {errors.state && (
                                <p className="text-sm text-red-500">
                                    {errors.state}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300">
                            Task Image{' '}
                            <span className="text-xs text-slate-500">
                                (Used as review image)
                            </span>
                        </label>
                        {previewUrl && !data.remove_image && (
                            <div className="flex items-center gap-4">
                                <img
                                    src={previewUrl}
                                    alt="Task image"
                                    className="h-24 w-24 rounded-lg object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData('remove_image', true);
                                        setPreviewUrl(null);

                                        if (imageInputRef.current) {
                                            imageInputRef.current.value = '';
                                        }

                                        setData('image', null);
                                    }}
                                    className="text-sm text-red-400 hover:text-red-300"
                                >
                                    Remove image
                                </button>
                            </div>
                        )}
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setData('image', file);
                                setData('remove_image', false);
                                setPreviewUrl(
                                    file
                                        ? URL.createObjectURL(file)
                                        : task.image_url,
                                );
                            }}
                            className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-sm text-slate-300 file:mr-4 file:rounded file:border-0 file:bg-violet-600 file:px-3 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-violet-500"
                        />
                        {errors.image && (
                            <p className="text-sm text-red-500">
                                {errors.image}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-4 border-t border-white/10 pt-6">
                        <Link
                            href={adminRoutes.tasks.index.url()}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Update Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

EditTask.layout = (page: ReactNode) => (
    <AdminLayout title="Edit Task">{page}</AdminLayout>
);
