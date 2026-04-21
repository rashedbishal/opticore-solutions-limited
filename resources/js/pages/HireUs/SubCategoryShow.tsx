import type { Variants } from 'framer-motion';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    MessageSquare,
    Star,
    Zap,
    Shield,
    Clock,
    User,
    ArrowRight,
    X,
    Send,
    Users,
    ChevronLeft,
    ChevronRight,
    Film,
    ImageIcon,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Modal from '@/components/UI/Modal';

interface PortfolioItem {
    id: number;
    title: string;
    media_path: string | null;
    media_type: 'image' | 'video';
    alt: string;
}

interface SubCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
}

interface Category {
    slug: string;
    label: string;
}

interface Props {
    category: Category;
    subCategory: SubCategory;
    portfolios: PortfolioItem[];
    siblingSubCategories: Array<{ name: string; slug: string }>;
}

// ─── Animation Variants ────────────────────────────────────────────────────

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
};

const stagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const PLACEHOLDER = 'https://placehold.co/1200x675/0a0a0a/27272a?text=Opticore';

// ─── Plans ─────────────────────────────────────────────────────────────────

const PLANS = [
    {
        id: 'basic',
        name: 'Basic',
        priceBDT: '500 BDT',
        priceUSD: '~$4.5',
        delivery: '2 Days',
        features: [
            '1 Initial Concept',
            '2 Revisions',
            'High-Res JPG/PNG',
            'Commercial Use',
        ],
        Icon: Zap,
        accentClass: 'text-zinc-400',
    },
    {
        id: 'standard',
        name: 'Standard',
        priceBDT: '1,000 BDT',
        priceUSD: '~$9',
        delivery: '4 Days',
        features: [
            '2 Initial Concepts',
            '5 Revisions',
            'Source Files',
            'Commercial Use',
            'Priority Support',
        ],
        Icon: Star,
        accentClass: 'text-cyan-400',
        popular: true,
    },
    {
        id: 'premium',
        name: 'Premium',
        priceBDT: '2,500 BDT',
        priceUSD: '~$23',
        delivery: '7 Days',
        features: [
            '4 Initial Concepts',
            'Unlimited Revisions',
            'Full Brand Kit',
            'Source Files',
            'Commercial Use',
            'VIP Support',
        ],
        Icon: Shield,
        accentClass: 'text-violet-400',
    },
] as const;

type PlanId = (typeof PLANS)[number]['id'];

// ─── Chat Message Type ──────────────────────────────────────────────────────

type ChatMessage = { role: 'team' | 'user'; content: string; time: string };

// ─── Static Reviews ─────────────────────────────────────────────────────────

const REVIEWS = [
    {
        user: 'Alex M.',
        location: 'United States',
        review: 'Exceptional work! Communication was smooth and the final result exceeded my expectations. Will definitely hire again.',
        rating: 5,
    },
    {
        user: 'Sarah K.',
        location: 'United Kingdom',
        review: 'The team really understood my vision. The deliverables were exactly what I needed to boost engagement.',
        rating: 5,
    },
    {
        user: 'Rafi H.',
        location: 'Bangladesh',
        review: 'Fast turnaround, premium quality. The source files were clean and well-organized. Highly recommended.',
        rating: 5,
    },
];

// ─── Gallery Slider ─────────────────────────────────────────────────────────

function GallerySlider({ items }: { items: PortfolioItem[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);

    const slides = items.length > 0 ? items : null;

    const goTo = useCallback(
        (index: number, dir: 1 | -1) => {
            setDirection(dir);
            setActiveIndex(index);
        },
        [],
    );

    const goPrev = useCallback(() => {
        if (!slides) {
            return;
        }
        goTo(
            (activeIndex - 1 + slides.length) % slides.length,
            -1,
        );
    }, [activeIndex, slides, goTo]);

    const goNext = useCallback(() => {
        if (!slides) {
            return;
        }
        goTo((activeIndex + 1) % slides.length, 1);
    }, [activeIndex, slides, goTo]);

    const slideVariants: Variants = {
        enter: (d: number) => ({
            x: d > 0 ? '100%' : '-100%',
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        },
        exit: (d: number) => ({
            x: d > 0 ? '-100%' : '100%',
            opacity: 0,
            transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        }),
    };

    if (!slides) {
        return (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-[2rem] border border-white/10 bg-zinc-900">
                <ImageIcon className="h-10 w-10 text-zinc-700" />
                <p className="text-sm font-medium text-zinc-600">
                    Portfolio coming soon
                </p>
            </div>
        );
    }

    const active = slides[activeIndex];

    return (
        <div className="space-y-4">
            {/* Main slide */}
            <div className="group relative aspect-video w-full overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={activeIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="absolute inset-0"
                    >
                        {active.media_type === 'video' ? (
                            <video
                                src={active.media_path ?? undefined}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <img
                                src={active.media_path ?? PLACEHOLDER}
                                alt={active.alt}
                                onError={(e) => {
                                    e.currentTarget.src = PLACEHOLDER;
                                }}
                                className="h-full w-full object-cover"
                            />
                        )}
                        {/* Caption */}
                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-6">
                            <p className="text-sm font-semibold text-white">
                                {active.title}
                            </p>
                            {active.media_type === 'video' && (
                                <span className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-400">
                                    <Film className="h-3 w-3" /> Video
                                </span>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation arrows */}
                {slides.length > 1 && (
                    <>
                        <button
                            onClick={goPrev}
                            className="absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}

                {/* Dot indicator */}
                {slides.length > 1 && (
                    <div className="absolute right-0 bottom-4 left-0 flex justify-center gap-1.5">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i, i > activeIndex ? 1 : -1)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i === activeIndex
                                        ? 'w-6 bg-white'
                                        : 'w-1.5 bg-white/30 hover:bg-white/60'
                                }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Thumbnail strip */}
            {slides.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {slides.map((item, i) => (
                        <button
                            key={item.id}
                            onClick={() => goTo(i, i > activeIndex ? 1 : -1)}
                            className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                                i === activeIndex
                                    ? 'border-cyan-400 opacity-100'
                                    : 'border-white/10 opacity-50 hover:opacity-80'
                            }`}
                        >
                            {item.media_type === 'video' ? (
                                <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                                    <Film className="h-4 w-4 text-zinc-400" />
                                </div>
                            ) : (
                                <img
                                    src={item.media_path ?? PLACEHOLDER}
                                    alt={item.alt}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = PLACEHOLDER;
                                    }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SubCategoryShow({
    category,
    subCategory,
    portfolios,
    siblingSubCategories,
}: Props) {
    const [selectedPlan, setSelectedPlan] = useState<PlanId>('standard');
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            role: 'team',
            content: `Hi there! We're the ${category.label} team. How can we help with your project today?`,
            time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
        },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isChatOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) {
            return;
        }

        const time = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });

        setChatMessages((prev) => [
            ...prev,
            { role: 'user', content: newMessage, time },
        ]);
        setNewMessage('');

        setTimeout(() => {
            setChatMessages((prev) => [
                ...prev,
                {
                    role: 'team',
                    content:
                        'Thanks for reaching out! A team member will review your message and get back to you shortly.',
                    time: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                },
            ]);
        }, 1500);
    };

    const activePlan = PLANS.find((p) => p.id === selectedPlan)!;

    return (
        <>
            <Head title={`${subCategory.name} — Hire Opticore`} />

            <div className="relative min-h-screen bg-zinc-950 pb-24">
                {/* Background glows */}
                <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[140px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[140px]" />

                <div className="relative mx-auto max-w-7xl px-4 pt-32">
                    {/* Breadcrumb */}
                    <motion.nav
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mb-10 flex flex-wrap items-center gap-2 text-sm text-zinc-500"
                        aria-label="Breadcrumb"
                    >
                        <Link
                            href="/hire-us"
                            className="transition-colors hover:text-zinc-300"
                        >
                            Hire Us
                        </Link>
                        <span>/</span>
                        <span className="text-zinc-400">{category.label}</span>
                        <span>/</span>
                        <span className="text-zinc-200">
                            {subCategory.name}
                        </span>
                    </motion.nav>

                    {/* Sibling sub-category tabs */}
                    {siblingSubCategories.length > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                            className="mb-10 flex gap-2 overflow-x-auto pb-1"
                        >
                            {siblingSubCategories.map((s) => (
                                <button
                                    key={s.slug}
                                    type="button"
                                    onClick={() =>
                                        router.visit(
                                            `/hire-us/${category.slug}/${s.slug}`,
                                            { preserveScroll: false },
                                        )
                                    }
                                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                                        s.slug === subCategory.slug
                                            ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300'
                                            : 'border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                                    }`}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {/* Two-column layout */}
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_0.6fr]">
                        {/* ── LEFT COLUMN ── */}
                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            animate="visible"
                            className="min-w-0 space-y-12"
                        >
                            {/* Hero header */}
                            <motion.div variants={fadeUp}>
                                <div className="mb-2 text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">
                                    {category.label}
                                </div>
                                <h1 className="mb-5 text-4xl font-black tracking-tight text-white md:text-5xl">
                                    {subCategory.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-5 text-sm">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className="h-4 w-4 fill-current"
                                            />
                                        ))}
                                        <span className="ml-1 text-white">
                                            5.0
                                        </span>
                                        <span className="font-normal text-zinc-500">
                                            ({REVIEWS.length * 41} Reviews)
                                        </span>
                                    </div>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-zinc-500">
                                        10 Orders in Queue
                                    </span>
                                </div>
                            </motion.div>

                            {/* Gallery */}
                            <motion.div variants={fadeUp}>
                                <GallerySlider items={portfolios} />
                            </motion.div>

                            {/* Description */}
                            <motion.div
                                variants={fadeUp}
                                className="glass-panel space-y-6 rounded-[2rem] border border-white/5 p-8 md:p-10"
                            >
                                <h2 className="text-2xl font-bold text-white">
                                    Service Description
                                </h2>
                                <p className="text-base leading-relaxed text-zinc-400">
                                    {subCategory.description ??
                                        `We provide high-quality, professional ${subCategory.name.toLowerCase()} tailored specifically to your brand's voice and goals. Our team of experts focuses on delivering visually stunning and commercially effective results that stand out in today's crowded digital landscape.`}
                                </p>
                                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {[
                                        'Custom Designs',
                                        'Fast Turnaround',
                                        'Expert Consultation',
                                        'Source Files Included',
                                        'Commercial License',
                                        'Revisions Guaranteed',
                                    ].map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-center gap-3 text-sm text-zinc-300"
                                        >
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
                                                <Check className="h-3 w-3 text-cyan-400" />
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Reviews */}
                            <motion.div variants={fadeUp} className="space-y-6">
                                <div className="flex items-end justify-between">
                                    <h2 className="text-2xl font-bold text-white">
                                        Client Reviews
                                    </h2>
                                    <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                        <span className="font-bold text-white">
                                            5.0
                                        </span>
                                        <span>
                                            ({REVIEWS.length * 41} reviews)
                                        </span>
                                    </div>
                                </div>

                                <motion.div
                                    variants={stagger}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-4"
                                >
                                    {REVIEWS.map((review, i) => (
                                        <motion.div
                                            key={i}
                                            variants={fadeUp}
                                            className="rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition-colors hover:border-white/10"
                                        >
                                            <div className="mb-4 flex items-center gap-4">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800">
                                                    <User className="h-5 w-5 text-zinc-500" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-white">
                                                            {review.user}
                                                        </h4>
                                                        <span className="text-xs text-zinc-600">
                                                            {review.location}
                                                        </span>
                                                    </div>
                                                    <div className="mt-0.5 flex text-amber-400">
                                                        {[1, 2, 3, 4, 5].map(
                                                            (s) => (
                                                                <Star
                                                                    key={s}
                                                                    className="h-3 w-3 fill-current"
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm leading-relaxed text-zinc-400 italic">
                                                "{review.review}"
                                            </p>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* ── RIGHT COLUMN (Sticky) ── */}
                        <div className="sticky top-32 h-fit space-y-4">
                            {/* Pricing card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.55,
                                    delay: 0.25,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="glass-panel rounded-[2.5rem] border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl"
                            >
                                {/* Plan switcher tabs */}
                                <div className="mb-6 flex rounded-2xl bg-black/40 p-1.5">
                                    {PLANS.map((plan) => (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedPlan(plan.id)
                                            }
                                            className={`relative flex-1 rounded-xl py-3 text-xs font-bold transition-all ${
                                                selectedPlan === plan.id
                                                    ? 'bg-zinc-800 text-white shadow-lg'
                                                    : 'text-zinc-500 hover:text-zinc-300'
                                            }`}
                                        >
                                            {plan.name}
                                            {'popular' in plan &&
                                                selectedPlan !== plan.id && (
                                                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-500" />
                                                )}
                                        </button>
                                    ))}
                                </div>

                                {/* Active plan details */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedPlan}
                                        initial={{ opacity: 0, x: 12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -12 }}
                                        transition={{ duration: 0.25 }}
                                        className="space-y-5"
                                    >
                                        {/* Price row */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div
                                                    className={`flex items-center gap-2 ${activePlan.accentClass}`}
                                                >
                                                    <activePlan.Icon className="h-5 w-5" />
                                                    <span className="text-2xl font-black text-white">
                                                        {activePlan.priceBDT}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-zinc-500">
                                                    {activePlan.priceUSD} USD
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-zinc-400">
                                                <Clock className="h-3.5 w-3.5" />
                                                {activePlan.delivery}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs leading-relaxed text-zinc-500">
                                            Professional{' '}
                                            {activePlan.name.toLowerCase()}{' '}
                                            package for{' '}
                                            {subCategory.name.toLowerCase()} —
                                            tailored for brands that demand
                                            results.
                                        </p>

                                        {/* Feature list */}
                                        <ul className="space-y-2.5">
                                            {activePlan.features.map((f) => (
                                                <li
                                                    key={f}
                                                    className="flex items-center gap-3 text-xs text-zinc-300"
                                                >
                                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
                                                        <Check className="h-2.5 w-2.5 text-cyan-400" />
                                                    </span>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* CTA buttons */}
                                        <div className="space-y-3 pt-2">
                                            <button className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-black tracking-widest text-black uppercase transition-all hover:bg-cyan-400">
                                                Hire Now
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsContactModalOpen(true)
                                                }
                                                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/5"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                Custom Quote
                                            </button>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </motion.div>

                            {/* Guarantee box */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.55,
                                    delay: 0.35,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="rounded-[2rem] border border-cyan-500/20 bg-cyan-500/5 p-5"
                            >
                                <h4 className="mb-1.5 flex items-center gap-2 text-sm font-bold text-cyan-400">
                                    <Shield className="h-4 w-4" /> Secure
                                    Purchase
                                </h4>
                                <p className="text-xs leading-relaxed text-zinc-500">
                                    Your payment is held securely and released
                                    only when you're satisfied with the final
                                    delivery.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Floating Chat ── */}
            <div className="fixed right-6 bottom-6 z-[60] flex flex-col items-end sm:right-8 sm:bottom-8">
                <AnimatePresence>
                    {isChatOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.96 }}
                            transition={{
                                duration: 0.3,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="glass-panel mb-4 flex h-[480px] w-[320px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 shadow-2xl sm:w-[360px]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/5 bg-zinc-800/50 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">
                                            {category.label} Team
                                        </p>
                                        <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                                            Online
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsChatOpen(false)}
                                    className="text-zinc-500 transition-colors hover:text-white"
                                    aria-label="Close chat"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 space-y-4 overflow-y-auto p-5">
                                {chatMessages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                                                msg.role === 'user'
                                                    ? 'rounded-tr-none bg-white text-black'
                                                    : 'rounded-tl-none border border-white/5 bg-white/5 text-zinc-300'
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="mt-1.5 text-[10px] text-zinc-600">
                                            {msg.time}
                                        </span>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <form
                                onSubmit={handleSendMessage}
                                className="border-t border-white/5 bg-black/20 p-4"
                            >
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) =>
                                            setNewMessage(e.target.value)
                                        }
                                        placeholder="Ask about this service…"
                                        className="w-full rounded-xl border border-white/5 bg-zinc-800 py-3 pr-12 pl-4 text-sm text-white placeholder-zinc-600 focus:border-cyan-500/50 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-cyan-500 text-white transition-colors hover:bg-cyan-400"
                                        aria-label="Send message"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="mt-2.5 text-center text-[9px] font-bold tracking-[0.2em] text-zinc-700 uppercase">
                                    Direct Team Chat
                                </p>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toggle button */}
                <button
                    type="button"
                    onClick={() => setIsChatOpen((v) => !v)}
                    className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
                        isChatOpen
                            ? 'rotate-90 bg-zinc-800 text-white'
                            : 'bg-white text-black hover:scale-110'
                    }`}
                    aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
                >
                    {isChatOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <MessageSquare className="h-6 w-6" />
                    )}
                    {!isChatOpen && (
                        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 animate-ping rounded-full bg-cyan-500" />
                    )}
                </button>
            </div>

            {/* ── Custom Quote Modal ── */}
            <Modal
                open={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                title="Discuss Your Project"
            >
                <div className="space-y-5 p-6">
                    <p className="text-sm text-zinc-400">
                        Tell us more about your custom requirements for{' '}
                        <span className="font-bold text-white">
                            {subCategory.name}
                        </span>
                        .
                    </p>
                    <textarea
                        placeholder="Describe what you need — scope, timeline, budget…"
                        className="h-32 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white placeholder-zinc-600 transition-colors focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                        type="button"
                        className="w-full rounded-2xl bg-cyan-500 py-4 text-sm font-black tracking-widest text-white uppercase transition-colors hover:bg-cyan-600"
                    >
                        Send Message
                    </button>
                </div>
            </Modal>
        </>
    );
}
