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
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:from-violet-500 hover:to-cyan-500"
                >
                    <Plus className="h-4 w-4" /> Add Blog Post
                </Link>
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <table className="w-full min-w-[42rem]">
                    <colgroup>
                        <col className="w-auto" />
                        <col className="w-44" />
                        <col className="w-36" />
                        <col className="w-36" />
                    </colgroup>
                    <thead>
                        <tr className="border-b border-violet-500/10 bg-violet-500/5">
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase whitespace-nowrap">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase whitespace-nowrap">
                                Author
                            </th>
                            <th className="px-6 py-3 text-right font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase whitespace-nowrap">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {blogs.data.map((blog) => (
                            <tr
                                key={blog.id}
                                className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                            >
                                <td className="max-w-0 px-6 py-4 text-sm text-white">
                                    <p className="truncate">
                                        {blog.title}
                                    </p>
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
                                        className="mr-4 inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/70 transition-colors hover:text-cyan-300"
                                    >
                                        <Edit className="h-4 w-4" /> Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(blog.id)}
                                        className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {blogs.data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-16 text-center">
                                    <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">No records found</p>
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
