import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import BlogCard from '@/components/Blogs/BlogCard';
import FilterBar from '@/components/Blogs/FilterBar';
import GradientOrb from '@/components/UI/GradientOrb';
import { mockBlogs } from '@/lib/mock-blogs';
import type { BlogCategory } from '@/types/blog';

const categories: BlogCategory[] = [
    'All',
    'Graphic Design',
    'Digital Marketing',
    'Video Editing',
    '3D Production',
    'Web Development',
];

export default function BlogIndex() {
    const [activeCategory, setActiveCategory] = useState<BlogCategory>('All');

    const filteredBlogs =
        activeCategory === 'All'
            ? mockBlogs
            : mockBlogs.filter((blog) => blog.category === activeCategory);

    const glitchText = 'The Opticore Blog';

    return (
        <>
            <Head title="Blog">
                <meta
                    name="description"
                    content="Read the latest insights on design, tech, and marketing from the Opticore team."
                />
            </Head>

            <section className="section-shell relative min-h-screen overflow-hidden pt-32 md:pt-40 lg:pt-48">
                {/* Background Decorations */}
                <div className="pointer-events-none absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 opacity-10 blur-3xl">
                    <GradientOrb
                        color="var(--color-primary)"
                        className="h-[600px] w-[600px]"
                    />
                </div>

                <div className="section-inner relative z-10">
                    <div className="mx-auto mb-16 max-w-4xl text-center md:mb-24">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="section-kicker mx-auto mb-6"
                        >
                            Insights & Perspective
                        </motion.span>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="blog-glitch-title relative text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-7xl"
                            data-text={glitchText}
                        >
                            <span className="gradient-text">{glitchText}</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400"
                        >
                            Exploring the intersection of premium design,
                            technical excellence, and strategic growth.
                        </motion.p>
                    </div>

                    <FilterBar
                        categories={categories}
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                    />

                    <motion.div
                        layout
                        className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredBlogs.map((post, index) => (
                                <BlogCard
                                    key={post.id}
                                    post={post}
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {filteredBlogs.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-20 text-center"
                        >
                            <p className="text-lg text-zinc-500">
                                No posts found in this category.
                            </p>
                        </motion.div>
                    )}
                </div>
            </section>
        </>
    );
}