import type { SharedPageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, Layers, Star, Users, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import GradientOrb from '@/components/UI/GradientOrb';
import {
    resolveCategoryColor,
    resolveCategoryIcon,
} from '@/lib/categoryVisuals';

interface HireUsSubCategory {
    name: string;
    slug: string;
    price: string;
    rating: number;
    reviews: number;
    image: string;
}

interface Props {
    subCategories: Record<string, HireUsSubCategory[]>;
}

type DisplayItem = HireUsSubCategory & { categorySlug: string };

const ALL_TAB_ID = 'all';

const HireUsPage = ({ subCategories = {} }: Props) => {
    const { categories } = usePage<SharedPageProps>().props;

    const allTab = {
        id: ALL_TAB_ID,
        name: 'All Services',
        icon: Layers,
        text: 'text-violet-500',
        bg: 'bg-violet-500/10',
        swatch: 'bg-violet-500',
    };

    // Tabs are fully CMS-driven: name, icon, and color all come from the
    // category's admin-managed fields, not a hardcoded list.
    const tabs = [
        allTab,
        ...Object.entries(categories).map(([slug, category]) => ({
            id: slug,
            name: category.label,
            icon: resolveCategoryIcon(category.icon),
            ...resolveCategoryColor(category.color),
        })),
    ];

    const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? ALL_TAB_ID);
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

    const activeTabData = tabs.find((t) => t.id === activeTab) ?? tabs[0];
    const ActiveIcon = activeTabData?.icon ?? Layers;

    // When "All" is active, flatten every category's items and attach their
    // real category slug so the card links remain correct.
    const displayItems: DisplayItem[] =
        activeTab === ALL_TAB_ID
            ? Object.entries(subCategories).flatMap(([catSlug, items]) =>
                  items.map((item) => ({ ...item, categorySlug: catSlug })),
              )
            : (subCategories[activeTab] ?? []).map((item) => ({
                  ...item,
                  categorySlug: activeTab,
              }));

    const handleTabSelect = (id: string) => {
        setActiveTab(id);
        setDropdownOpen(false);
    };

    return (
        <>
            <Head title="Hire Opticore | Digital Services Marketplace" />

            <div className="relative min-h-screen overflow-hidden px-4 pt-32 pb-24">
                {/* Background Glows */}
                <GradientOrb
                    className="top-0 right-0 h-[600px] w-[600px] translate-x-1/4 -translate-y-1/4"
                    color="rgb(6 182 212 / 0.12)"
                />
                <GradientOrb
                    className="bottom-0 left-0 h-[600px] w-[600px] -translate-x-1/4 translate-y-1/4"
                    color="rgb(124 58 237 / 0.12)"
                />

                <div className="relative z-10 mx-auto max-w-7xl">
                    {/* Hero Section */}
                    <section className="mb-24 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto max-w-4xl"
                        >
                            <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-theme bg-theme-surface px-4 py-2 text-sm font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">
                                <Zap className="h-4 w-4 fill-current" /> Premium
                                Solutions
                            </span>
                            <h1 className="mb-8 text-5xl leading-tight font-black tracking-tighter text-theme uppercase md:text-8xl">
                                Experts{' '}
                                <span className="bg-gradient-to-r from-cyan-500 to-violet-600 bg-clip-text text-transparent">
                                    On Demand
                                </span>
                            </h1>
                            <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-theme-muted">
                                Select a category to explore our professional
                                creative and digital services tailored for your
                                business.
                            </p>
                        </motion.div>
                    </section>

                    {/* Services Tabs */}
                    <section className="mb-20">
                        {/* ── Mobile dropdown (hidden on md+) ── */}
                        <div
                            ref={dropdownRef}
                            className="relative md:hidden"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setDropdownOpen((prev) => !prev)
                                }
                                className="neo-btn-ghost group flex w-full select-none items-center justify-between gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold text-theme transition-all duration-200 active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${activeTabData.bg} ${activeTabData.text}`}
                                    >
                                        <ActiveIcon className="h-4 w-4" />
                                    </div>
                                    <span>{activeTabData.name}</span>
                                </div>
                                <ChevronDown
                                    className={`h-4 w-4 shrink-0 text-theme-muted transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            y: -6,
                                            scale: 0.97,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            scale: 1,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: -6,
                                            scale: 0.97,
                                        }}
                                        transition={{ duration: 0.18 }}
                                        className="neo-panel-elevated absolute top-full left-0 right-0 z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl p-1.5"
                                    >
                                        {tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            const isActive =
                                                activeTab === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() =>
                                                        handleTabSelect(tab.id)
                                                    }
                                                    className={`group flex w-full select-none items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                                                        isActive
                                                            ? 'neo-btn-primary text-white'
                                                            : 'text-theme-muted hover:bg-theme-surface-hover hover:text-theme'
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
                                                            isActive
                                                                ? 'bg-white/20 text-white'
                                                                : `${tab.bg} ${tab.text} group-hover:scale-110`
                                                        }`}
                                                    >
                                                        <Icon className="h-3.5 w-3.5" />
                                                    </div>
                                                    {tab.name}
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
                                {tabs.map((service) => {
                                    const Icon = service.icon;
                                    const isActive = activeTab === service.id;

                                    return (
                                        <button
                                            key={service.id}
                                            type="button"
                                            onClick={() =>
                                                handleTabSelect(service.id)
                                            }
                                            className={`group relative flex shrink-0 select-none items-center gap-2.5 overflow-hidden rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-300 active:scale-95 ${
                                                isActive
                                                    ? 'text-white'
                                                    : 'neo-btn-ghost text-theme-muted hover:-translate-y-0.5 hover:text-theme'
                                            }`}
                                        >
                                            {/* Sliding violet pill */}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="hire-tab-active-bg"
                                                    className="neo-btn-primary absolute inset-0"
                                                    transition={{
                                                        type: 'spring',
                                                        bounce: 0.18,
                                                        duration: 0.45,
                                                    }}
                                                />
                                            )}

                                            {/* Icon badge — always shows category color */}
                                            <div
                                                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : `${service.bg} ${service.text} group-hover:scale-110`
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </div>

                                            {/* Label */}
                                            <span className="relative z-10 whitespace-nowrap">
                                                {service.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />
                    </section>

                    {/* Marketplace Grid */}
                    <AnimatePresence mode="wait">
                        <motion.section
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {displayItems.map((item, idx) => (
                                <motion.div
                                    key={`${item.categorySlug}-${item.slug}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group glass-panel overflow-hidden rounded-[2.5rem] border border-theme transition-all duration-500 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/10"
                                >
                                    <Link
                                        href={`/hire-us/${item.categorySlug}/${item.slug}`}
                                    >
                                        {/* Image */}
                                        <div className="relative h-64 overflow-hidden">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                                            <div className="absolute top-4 right-4 rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                                                Starts at {item.price}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-8">
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-amber-400">
                                                    <Star className="h-4 w-4 fill-current" />
                                                    <span className="text-sm font-bold text-theme">
                                                        {item.rating}
                                                    </span>
                                                    <span className="text-xs text-theme-muted">
                                                        ({item.reviews})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-theme-muted">
                                                    <Users className="h-4 w-4" />
                                                    <span className="text-xs">
                                                        24 Active
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="mb-6 text-2xl font-black tracking-tight text-theme transition-colors group-hover:text-violet-500">
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-theme-muted transition-colors group-hover:text-theme">
                                                    View Marketplace
                                                </span>
                                                <div className="rounded-full bg-theme-surface p-3 text-theme transition-all duration-300 group-hover:bg-violet-600 group-hover:text-white">
                                                    <ArrowRight className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.section>
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

export default HireUsPage;
