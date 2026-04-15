import type { ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Plus, Trash2, Edit } from 'lucide-react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Blog {
    id: number;
    title: string;
    category: string;
    author: string;
}

interface Props {
    blogs: {
        data: Blog[];
        links: any[];
    };
}

export default function BlogIndex({ blogs }: Props) {
    const { delete: destroy } = useForm();

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this blog post?')) {
            destroy(adminRoutes.blogs.destroy.url(id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Blogs</h1>
                <Link
                    href={adminRoutes.blogs.create.url()}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                >
                    <Plus className="h-4 w-4" /> Add Blog Post
                </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-zinc-400">
                                Author
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-zinc-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {blogs.data.map((blog) => (
                            <tr
                                key={blog.id}
                                className="transition-colors hover:bg-white/5"
                            >
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-white">
                                    {blog.title}
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-400">
                                    {blog.category}
                                </td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap text-zinc-400">
                                    {blog.author}
                                </td>
                                <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                    <Link
                                        href={adminRoutes.blogs.edit.url(
                                            blog.id,
                                        )}
                                        className="mr-4 inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
                                    >
                                        <Edit className="h-4 w-4" /> Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(blog.id)}
                                        className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {blogs.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-8 text-center text-sm text-zinc-500"
                                >
                                    No blogs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

BlogIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Manage Blogs">{page}</AdminLayout>
);
