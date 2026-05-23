import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Save, X, Loader2 } from 'lucide-react';
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
                    <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-8 backdrop-blur-sm">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                        <div className="space-y-6">
                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                    Post Title
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    placeholder="Enter an engaging title..."
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                                    required
                                />
                                {errors.title && (
                                    <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                    Excerpt
                                </label>
                                <textarea
                                    value={data.excerpt}
                                    onChange={(e) =>
                                        setData('excerpt', e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Brief summary of the article..."
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                                ></textarea>
                            </div>

                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                    Full Content (HTML allowed)
                                </label>
                                <textarea
                                    value={data.content}
                                    onChange={(e) =>
                                        setData('content', e.target.value)
                                    }
                                    rows={18}
                                    placeholder="<p>Write your amazing content here...</p>"
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 font-mono text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                                    required
                                ></textarea>
                                {errors.content && (
                                    <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                        {errors.content}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6 lg:w-80">
                    <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-6 backdrop-blur-sm">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                        <div className="space-y-6">
                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                    Category
                                </label>
                                <select
                                    value={data.category}
                                    onChange={(e) =>
                                        setData('category', e.target.value)
                                    }
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
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
                                    <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                        {errors.category}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                    Author Name
                                </label>
                                <input
                                    type="text"
                                    value={data.author}
                                    onChange={(e) =>
                                        setData('author', e.target.value)
                                    }
                                    placeholder="e.g., John Doe"
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                    Read Time
                                </label>
                                <input
                                    type="text"
                                    value={data.read_time}
                                    onChange={(e) =>
                                        setData('read_time', e.target.value)
                                    }
                                    placeholder="e.g., 5 min read"
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-violet-500/50 focus:bg-violet-500/5"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                    Cover Image
                                </label>
                                <div className="rounded-lg border border-dashed border-white/10 bg-white/2 p-4 transition-colors hover:bg-white/4">
                                    <input
                                        type="file"
                                        onChange={(e) =>
                                            setData(
                                                'image',
                                                e.target.files?.[0] || null,
                                            )
                                        }
                                        className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-violet-600/80 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-violet-500 outline-none"
                                    />
                                </div>
                                {errors.image && (
                                    <p className="mt-1.5 font-mono text-[10px] text-red-400">
                                        {errors.image}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            disabled={processing}
                            type="submit"
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" /> Save Post
                                </>
                            )}
                        </button>
                        <Link
                            href={adminRoutes.blogs.index.url()}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/8 bg-white/4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/8 hover:text-white"
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
