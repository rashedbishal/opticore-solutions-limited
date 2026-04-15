import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, User, Share2 } from 'lucide-react';
import GradientOrb from '@/components/UI/GradientOrb';

interface BlogShowProps {
    dbBlog?: any;
}

export default function BlogShow({ dbBlog }: BlogShowProps) {
    const post = dbBlog;

    const handleShare = (platform: 'facebook' | 'twitter') => {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(post?.title || '');

        if (platform === 'facebook') {
            window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                '_blank',
                'width=600,height=400',
            );
        } else if (platform === 'twitter') {
            window.open(
                `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
                '_blank',
                'width=600,height=400',
            );
        }
    };

    if (!post) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 text-white">
                <h1 className="mb-4 text-4xl font-bold">Post Not Found</h1>
                <Link href="/blogs" className="text-primary hover:underline">
                    Return to Blog
                </Link>
            </div>
        );
    }

    return (
        <>
            <Head title={post.title}>
                <meta name="description" content={post.description} />
            </Head>

            <article className="relative min-h-screen overflow-hidden pt-28 pb-20 md:pt-40 md:pb-32 lg:pt-48">
                {/* Background Decorations */}
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl">
                    <GradientOrb
                        color="var(--color-primary)"
                        className="h-[600px] w-[600px] md:h-[800px] md:w-[800px]"
                    />
                </div>

                <div className="section-shell py-0!">
                    <div className="section-inner relative z-10">
                        {/* Back Button */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-8 md:mb-12"
                        >
                            <Link
                                href="/blogs"
                                className="group inline-flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase transition-colors hover:text-primary md:text-xs"
                            >
                                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 md:h-4 md:w-4" />
                                Back to Blog
                            </Link>
                        </motion.div>

                        {/* Header */}
                        <div className="max-w-4xl">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[9px] font-bold tracking-widest text-primary uppercase md:mb-6 md:text-[10px]">
                                    {post.category}
                                </span>
                                <h1 className="mb-6 text-3xl leading-[1.2] font-extrabold tracking-tight text-white sm:text-4xl md:mb-8 md:text-5xl lg:text-7xl lg:leading-[1.1]">
                                    {post.title}
                                </h1>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-8 text-[10px] font-medium tracking-widest text-zinc-500 uppercase md:gap-10 md:pb-12 md:text-xs"
                            >
                                <div className="flex items-center gap-2 md:gap-2.5">
                                    <div className="to-secondary h-7 w-7 rounded-full bg-linear-to-br from-primary p-px md:h-8 md:w-8">
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-dark">
                                            <User className="h-3.5 w-3.5 text-white md:h-4 md:w-4" />
                                        </div>
                                    </div>
                                    <span className="text-white">
                                        {post.author}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    <span>{post.publishedAt}</span>
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    <span>{post.readTime}</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Hero Image */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="glass-panel my-10 aspect-16/10 overflow-hidden rounded-2xl border-white/10 sm:aspect-21/9 md:my-16 md:rounded-[2.5rem]"
                        >
                            <img
                                src={post.image}
                                alt={post.title}
                                className="h-full w-full object-cover"
                            />
                        </motion.div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 gap-12 md:gap-16 lg:grid-cols-12">
                            <div className="lg:col-span-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="prose prose-invert prose-sm sm:prose-base md:prose-lg prose-headings:font-extrabold prose-headings:tracking-tight prose-p:text-zinc-400 prose-p:leading-relaxed prose-strong:text-white max-w-none"
                                >
                                    <p className="mb-8 text-lg leading-relaxed font-light text-white md:mb-12 md:text-xl">
                                        {post.excerpt}
                                    </p>

                                    <div
                                        className="whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{
                                            __html: post.content,
                                        }}
                                    />

                                    {/* Generic Rich Content Example */}
                                    <div className="mt-8 space-y-6 md:mt-12 md:space-y-8">
                                        <h3 className="text-xl md:text-3xl">
                                            A Strategic Perspective
                                        </h3>
                                        <p>
                                            In the digital era, the boundaries
                                            between medium and message have
                                            blurred. A brand’s technical
                                            performance is now as much a part of
                                            its identity as its visual language.
                                            When we talk about "premium" digital
                                            work, we are talking about the
                                            seamless integration of speed,
                                            security, and aesthetics.
                                        </p>
                                        <ul className="space-y-3 md:space-y-4">
                                            <li>
                                                Consistency across all digital
                                                touchpoints
                                            </li>
                                            <li>
                                                Performance-first engineering
                                                principles
                                            </li>
                                            <li>
                                                Data-driven creative decision
                                                making
                                            </li>
                                        </ul>
                                        <p>
                                            As we look toward the next decade,
                                            the challenge for brands will be to
                                            maintain this high standard of
                                            execution at scale.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Sidebar */}
                            <aside className="lg:col-span-4">
                                <div className="space-y-6 md:space-y-8 lg:sticky lg:top-32">
                                    <div className="glass-panel rounded-2xl border-white/5 p-6 md:rounded-3xl md:p-8">
                                        <h4 className="mb-4 flex items-center gap-2 text-xs font-bold tracking-widest text-white uppercase md:mb-6 md:text-sm">
                                            <Share2 className="h-3.5 w-3.5 text-primary md:h-4 md:w-4" />
                                            Share Insight
                                        </h4>
                                        <div className="flex gap-3 md:gap-4">
                                            <button
                                                onClick={() =>
                                                    handleShare('facebook')
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-zinc-400 transition-all hover:border-[#1877F2]/30 hover:bg-[#1877F2]/10 hover:text-[#1877F2] md:h-10 md:w-10 md:rounded-xl"
                                                aria-label="Share on Facebook"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-4 w-4 md:h-5 md:w-5"
                                                >
                                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleShare('twitter')
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-zinc-400 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white md:h-10 md:w-10 md:rounded-xl"
                                                aria-label="Share on X (Twitter)"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-4 w-4 md:h-5 md:w-5"
                                                >
                                                    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                                                    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="glass-panel rounded-2xl border-white/5 bg-linear-to-br from-primary/10 to-transparent p-6 md:rounded-3xl md:p-8">
                                        <h4 className="mb-3 text-lg font-bold text-white md:mb-4 md:text-xl">
                                            Start your journey with us
                                        </h4>
                                        <p className="mb-6 text-xs leading-relaxed text-zinc-400 md:mb-8 md:text-sm">
                                            If you're ready to build a brand
                                            that balances technical precision
                                            with creative ambition, let's talk.
                                        </p>
                                        <Link
                                            href="/request-appointment"
                                            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-[10px] font-bold tracking-widest text-dark uppercase transition-transform hover:scale-105 md:h-12 md:rounded-xl md:px-6 md:text-xs"
                                        >
                                            Request Appointment
                                        </Link>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            </article>
        </>
    );
}
