import type { BlogCategory } from '@/types/blog';
import { motion } from 'framer-motion';

interface FilterBarProps {
    categories: BlogCategory[];
    activeCategory: BlogCategory;
    onCategoryChange: (category: BlogCategory) => void;
}

export default function FilterBar({
    categories,
    activeCategory,
    onCategoryChange,
}: FilterBarProps) {
    return (
        <div className="mb-12 flex flex-wrap items-center justify-center gap-3 md:mb-16">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onCategoryChange(category)}
                    className="group relative rounded-full px-6 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-300"
                >
                    <span
                        className={`relative z-10 ${
                            activeCategory === category
                                ? 'text-dark'
                                : 'text-zinc-400 group-hover:text-white'
                        }`}
                    >
                        {category}
                    </span>

                    {activeCategory === category ? (
                        <motion.div
                            layoutId="activeCategory"
                            className="absolute inset-0 rounded-full bg-primary shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]"
                            transition={{
                                type: 'spring',
                                bounce: 0.2,
                                duration: 0.6,
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 rounded-full border border-white/5 bg-white/[0.02] opacity-100" />
                    )}
                </button>
            ))}
        </div>
    );
}
