import type { BlogCategory } from '@/types/blog';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Layers, PenTool, Code2, Megaphone, Sparkles, Box } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface FilterBarProps {
    categories: BlogCategory[];
    activeCategory: BlogCategory;
    onCategoryChange: (category: BlogCategory) => void;
}

const getCategoryVisuals = (category: string) => {
    switch (category.toLowerCase()) {
        case 'design':
            return { icon: PenTool, text: 'text-pink-500', bg: 'bg-pink-500/10' };
        case 'engineering':
        case 'tech':
            return { icon: Code2, text: 'text-cyan-500', bg: 'bg-cyan-500/10' };
        case 'marketing':
            return { icon: Megaphone, text: 'text-orange-500', bg: 'bg-orange-500/10' };
        case 'product':
            return { icon: Box, text: 'text-emerald-500', bg: 'bg-emerald-500/10' };
        case 'all':
            return { icon: Layers, text: 'text-violet-500', bg: 'bg-violet-500/10' };
        default:
            return { icon: Sparkles, text: 'text-blue-500', bg: 'bg-blue-500/10' };
    }
};

export default function FilterBar({
    categories,
    activeCategory,
    onCategoryChange,
}: FilterBarProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () =>
            document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const activeVisuals = getCategoryVisuals(activeCategory);
    const ActiveIcon = activeVisuals.icon;

    const handleTabSelect = (category: BlogCategory) => {
        onCategoryChange(category);
        setDropdownOpen(false);
    };

    return (
        <div className="mb-12 md:mb-16">
            {/* ── Mobile dropdown (hidden on md+) ── */}
            <div ref={dropdownRef} className="relative mx-auto max-w-sm md:hidden">
                <button
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="group flex w-full select-none items-center justify-between gap-3 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-5 py-3.5 text-sm font-semibold text-zinc-900 dark:text-white transition-all duration-200 active:scale-[0.98] shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${activeVisuals.bg} ${activeVisuals.text}`}
                        >
                            <ActiveIcon className="h-4 w-4" />
                        </div>
                        <span>{activeCategory}</span>
                    </div>
                    <ChevronDown
                        className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                <AnimatePresence>
                    {dropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.18 }}
                            className="absolute top-full left-0 right-0 z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-1.5 shadow-xl"
                        >
                            {categories.map((category) => {
                                const visuals = getCategoryVisuals(category);
                                const Icon = visuals.icon;
                                const isActive = activeCategory === category;
                                return (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => handleTabSelect(category)}
                                        className={`group flex w-full select-none items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                                            isActive
                                                ? 'neo-btn-primary text-white'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <div
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : `${visuals.bg} ${visuals.text} group-hover:scale-110`
                                            }`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                        </div>
                                        {category}
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Desktop pill tabs (hidden on mobile) ── */}
            <div className="hidden md:block">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {categories.map((category) => {
                        const visuals = getCategoryVisuals(category);
                        const Icon = visuals.icon;
                        const isActive = activeCategory === category;

                        return (
                            <button
                                key={category}
                                type="button"
                                onClick={() => handleTabSelect(category)}
                                className={`group relative flex shrink-0 select-none items-center gap-2.5 overflow-hidden rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-300 active:scale-95 ${
                                    isActive
                                        ? 'text-white'
                                        : 'neo-btn-ghost text-zinc-600 dark:text-zinc-400 hover:-translate-y-0.5 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                {/* Sliding primary pill */}
                                {isActive && (
                                    <motion.div
                                        layoutId="blog-tab-active-bg"
                                        className="absolute inset-0 neo-btn-primary"
                                        transition={{
                                            type: 'spring',
                                            bounce: 0.18,
                                            duration: 0.45,
                                        }}
                                    />
                                )}

                                {/* Icon badge */}
                                <div
                                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : `${visuals.bg} ${visuals.text} group-hover:scale-110`
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>

                                {/* Label */}
                                <span className="relative z-10 whitespace-nowrap">
                                    {category}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {/* Divider */}
            <div className="mt-8 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />
        </div>
    );
}
