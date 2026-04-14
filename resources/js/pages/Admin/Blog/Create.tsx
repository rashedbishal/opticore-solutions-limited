import { Link, useForm } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import type { FormEventHandler, ReactNode } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

export default function BlogCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        category: 'Graphic Design',
        excerpt: '',
        content: '',
        author: '',
        read_time: '',
        image: null as File | null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(adminRoutes.blogs.store.url());
    };

    return (
        <form onSubmit={submit} className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Main Content Column */}
                <div className="flex-1 space-y-6">
                    <div className="rounded-[24px] border border-white/5 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                                    Post Title
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    placeholder="Enter an engaging title..."
                                    className="block w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                                    required
                                />
                                {errors.title && (
                                    <p className="mt-2 text-sm text-red-400">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                                    Excerpt
                                </label>
                                <textarea
                                    value={data.excerpt}
                                    onChange={(e) =>
                                        setData('excerpt', e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Brief summary of the article..."
                                    className="block w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                                ></textarea>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                                    Full Content (HTML allowed)
                                </label>
                                <textarea
                                    value={data.content}
                                    onChange={(e) =>
                                        setData('content', e.target.value)
                                    }
                                    rows={18}
                                    placeholder="<p>Write your amazing content here...</p>"
                                    className="block w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm text-white placeholder-zinc-500 transition-all outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                                    required
                                ></textarea>
                                {errors.content && (
                                    <p className="mt-2 text-sm text-red-400">
                                        {errors.content}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6 lg:w-80">
                    <div className="space-y-6 rounded-[24px] border border-white/5 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-zinc-300">
                                Category
                            </label>
                            <select
                                value={data.category}
                                onChange={(e) =>
                                    setData('category', e.target.value)
                                }
                                className="block w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
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
                                <p className="mt-2 text-sm text-red-400">
                                    {errors.category}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-zinc-300">
                                Author Name
                            </label>
                            <input
                                type="text"
                                value={data.author}
                                onChange={(e) =>
                                    setData('author', e.target.value)
                                }
                                placeholder="e.g., John Doe"
                                className="block w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-zinc-300">
                                Read Time
                            </label>
                            <input
                                type="text"
                                value={data.read_time}
                                onChange={(e) =>
                                    setData('read_time', e.target.value)
                                }
                                placeholder="e.g., 5 min read"
                                className="block w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-zinc-300">
                                Cover Image
                            </label>
                            <div className="rounded-xl border border-dashed border-white/20 bg-black/10 p-4 transition-colors hover:bg-black/20">
                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setData(
                                            'image',
                                            e.target.files?.[0] || null,
                                        )
                                    }
                                    className="block w-full cursor-pointer text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan-400 hover:file:bg-cyan-500/20"
                                />
                            </div>
                            {errors.image && (
                                <p className="mt-2 text-sm text-red-400">
                                    {errors.image}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            disabled={processing}
                            type="submit"
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all hover:bg-cyan-400 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" /> Save Post
                        </button>
                        <Link
                            href={adminRoutes.blogs.index.url()}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                        >
                            <X className="h-4 w-4" /> Cancel
                        </Link>
                    </div>
                </div>
            </div>
        </form>
    );
}

BlogCreate.layout = (page: ReactNode) => (
    <AdminLayout title="Create Blog Post">{page}</AdminLayout>
);
