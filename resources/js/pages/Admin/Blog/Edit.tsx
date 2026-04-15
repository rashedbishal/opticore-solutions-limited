import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Props {
    blog: {
        id: number;
        title: string;
        category: string;
        excerpt: string | null;
        content: string;
        author: string | null;
        read_time: string | null;
        image: string | null;
    };
}

export default function BlogEdit({ blog }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        title: blog.title,
        category: blog.category,
        excerpt: blog.excerpt || '',
        content: blog.content,
        author: blog.author || '',
        read_time: blog.read_time || '',
        image: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(adminRoutes.blogs.update.url(blog.id));
    };

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-2xl font-bold text-white">
                Edit Blog Post
            </h1>
            <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300">
                                Title
                            </label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                                className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                                required
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300">
                                Category
                            </label>
                            <select
                                value={data.category}
                                onChange={(e) =>
                                    setData('category', e.target.value)
                                }
                                className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            >
                                <option value="Graphic Design">
                                    Graphic Design
                                </option>
                                <option value="Digital Marketing">
                                    Digital Marketing
                                </option>
                                <option value="Video Editing">
                                    Video Editing
                                </option>
                                <option value="3D Production">
                                    3D Production
                                </option>
                                <option value="Web Development">
                                    Web Development
                                </option>
                            </select>
                            {errors.category && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.category}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300">
                                Author
                            </label>
                            <input
                                type="text"
                                value={data.author}
                                onChange={(e) =>
                                    setData('author', e.target.value)
                                }
                                className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300">
                                Read Time (e.g., "5 min read")
                            </label>
                            <input
                                type="text"
                                value={data.read_time}
                                onChange={(e) =>
                                    setData('read_time', e.target.value)
                                }
                                className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Excerpt
                        </label>
                        <textarea
                            value={data.excerpt}
                            onChange={(e) => setData('excerpt', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Content (HTML allowed)
                        </label>
                        <textarea
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            rows={15}
                            className="mt-1 block w-full rounded-md border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-white focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            required
                        ></textarea>
                        {errors.content && (
                            <p className="mt-1 text-sm text-red-500">
                                {errors.content}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300">
                            Cover Image (Leave empty to keep current)
                        </label>
                        {blog.image && (
                            <div className="mb-2">
                                <img
                                    src={blog.image}
                                    alt="Current"
                                    className="h-auto w-48 rounded-lg border border-white/10 object-cover"
                                />
                            </div>
                        )}
                        <input
                            type="file"
                            onChange={(e) =>
                                setData('image', e.target.files?.[0] || null)
                            }
                            className="mt-1 block w-full text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-violet-500"
                        />
                        {errors.image && (
                            <p className="mt-1 text-sm text-red-500">
                                {errors.image}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-4 border-t border-white/10 pt-4">
                        <button
                            disabled={processing}
                            type="submit"
                            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                        >
                            Update Blog
                        </button>
                        <Link
                            href={adminRoutes.blogs.index.url()}
                            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

BlogEdit.layout = (page: ReactNode) => (
    <AdminLayout title="Edit Blog">{page}</AdminLayout>
);
