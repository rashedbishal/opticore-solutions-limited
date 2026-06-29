import type { BlogPost } from '@/types/blog';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';

interface BlogCardProps {
    post: BlogPost;
    index: number;
}

export default function BlogCard({ post, index }: BlogCardProps) {
    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group glass-panel flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50 transition-colors hover:border-primary/30 dark:border-white/5 dark:bg-white/5 dark:shadow-xl dark:shadow-black/20 dark:hover:border-primary/30"
        >
            <Link
                href={`/blog/${post.slug}`}
                className="relative block aspect-video overflow-hidden"
            >
                <img
                    src={post.image}
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-dark/80 via-transparent to-transparent opacity-60" />
                <div className="absolute top-4 left-4">
                    <span className="rounded-full border border-primary/20 bg-primary/20 px-3 py-1 text-[10px] font-bold tracking-widest text-primary uppercase backdrop-blur-md">
                        {post.category}
                    </span>
                </div>
            </Link>

            <div className="flex flex-grow flex-col p-6 md:p-8">
                <div className="mb-4 flex items-center gap-4 text-[10px] font-medium tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span>{post.date}</span>
                </div>

                <Link href={`/blog/${post.slug}`}>
                    <h3 className="mb-3 line-clamp-2 text-xl leading-tight font-bold text-zinc-900 transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-primary">
                        {post.title}
                    </h3>
                </Link>

                <p className="mb-8 line-clamp-3 flex-grow text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {post.description}
                </p>

                <Link
                    href={`/blog/${post.slug}`}
                    className="group/btn mt-auto inline-flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-900 uppercase dark:text-white"
                >
                    Read More
                    <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover/btn:translate-x-1" />
                </Link>
            </div>
        </motion.article>
    );
}
