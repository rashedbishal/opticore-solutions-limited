import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';
import { Link, useForm } from '@inertiajs/react';
import type { FormEventHandler, ReactNode } from 'react';
import { Save, X } from 'lucide-react';

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
        <form onSubmit={submit} className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Main Content Column */}
                <div className="flex-1 space-y-6">
                    <div className="rounded-[24px] border border-white/5 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-2">Post Title</label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    placeholder="Enter an engaging title..."
                                    className="block w-full rounded-xl border border-white/10 bg-black/20 text-white px-4 py-3 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all outline-none"
                                    required
                                />
                                {errors.title && <p className="mt-2 text-sm text-red-400">{errors.title}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-2">Excerpt</label>
                                <textarea
                                    value={data.excerpt}
                                    onChange={e => setData('excerpt', e.target.value)}
                                    rows={3}
                                    placeholder="Brief summary of the article..."
                                    className="block w-full rounded-xl border border-white/10 bg-black/20 text-white px-4 py-3 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all outline-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-2">Full Content (HTML allowed)</label>
                                <textarea
                                    value={data.content}
                                    onChange={e => setData('content', e.target.value)}
                                    rows={18}
                                    placeholder="<p>Write your amazing content here...</p>"
                                    className="block w-full rounded-xl border border-white/10 bg-black/20 text-white px-4 py-3 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all outline-none font-mono"
                                    required
                                ></textarea>
                                {errors.content && <p className="mt-2 text-sm text-red-400">{errors.content}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:w-80 space-y-6">
                    <div className="rounded-[24px] border border-white/5 bg-white/5 backdrop-blur-xl p-6 shadow-2xl space-y-6">
                        
                        <div>
                            <label className="block text-sm font-semibold text-zinc-300 mb-2">Category</label>
                            <select
                                value={data.category}
                                onChange={e => setData('category', e.target.value)}
                                className="block w-full rounded-xl border border-white/10 bg-black/20 text-white px-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-sm appearance-none outline-none"
                            >
                                <option value="Graphic Design">Graphic Design</option>
                                <option value="Digital Marketing">Digital Marketing</option>
                                <option value="Video Editing">Video Editing</option>
                                <option value="3D Production">3D Production</option>
                                <option value="Web Development">Web Development</option>
                            </select>
                            {errors.category && <p className="mt-2 text-sm text-red-400">{errors.category}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-zinc-300 mb-2">Author Name</label>
                            <input
                                type="text"
                                value={data.author}
                                onChange={e => setData('author', e.target.value)}
                                placeholder="e.g., John Doe"
                                className="block w-full rounded-xl border border-white/10 bg-black/20 text-white px-4 py-3 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-zinc-300 mb-2">Read Time</label>
                            <input
                                type="text"
                                value={data.read_time}
                                onChange={e => setData('read_time', e.target.value)}
                                placeholder="e.g., 5 min read"
                                className="block w-full rounded-xl border border-white/10 bg-black/20 text-white px-4 py-3 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-zinc-300 mb-2">Cover Image</label>
                            <div className="border border-dashed border-white/20 rounded-xl p-4 bg-black/10 hover:bg-black/20 transition-colors">
                                <input
                                    type="file"
                                    onChange={e => setData('image', e.target.files?.[0] || null)}
                                    className="block w-full text-zinc-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer"
                                />
                            </div>
                            {errors.image && <p className="mt-2 text-sm text-red-400">{errors.image}</p>}
                        </div>

                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            disabled={processing} 
                            type="submit" 
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:bg-cyan-400 disabled:opacity-50 transition-all"
                        >
                            <Save className="w-4 h-4" /> Save Post
                        </button>
                        <Link 
                            href={adminRoutes.blogs.index.url()} 
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-4 h-4" /> Cancel
                        </Link>
                    </div>
                </div>

            </div>
        </form>
    );
}

BlogCreate.layout = (page: ReactNode) => <AdminLayout title="Create Blog Post">{page}</AdminLayout>;
