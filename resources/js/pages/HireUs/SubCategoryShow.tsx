import type { SharedPageProps } from '@/types';
import type { Variants } from 'framer-motion';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Star,
    Zap,
    Shield,
    Clock,
    User,
    ArrowRight,
    X,
    ChevronLeft,
    ChevronRight,
    Film,
    ImageIcon,
    Play,
    Pause,
    Maximize2,
    // BadgeCheck,
    Globe,
    Info,
    HelpCircle,
    ChevronDown,
    FilterX,
    DollarSign,
    Repeat,
    Palette,
    FileText,
    CheckCircle,
    RotateCcw,
    FileCode,
    Headset,
    Crown,
    Layers,
    PenLine,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { showSubCategory } from '@/actions/App/Http/Controllers/HireUsController';
import Modal from '@/components/UI/Modal';

interface PortfolioItem {
    id: number;
    title: string;
    media_path: string | null;
    media_type: 'image' | 'video';
    alt: string;
}

interface FaqItem {
    question: string;
    answer: string;
}

interface SubCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    faqs?: FaqItem[];
}

interface Category {
    slug: string;
    label: string;
}

interface RecommendedService {
    id: number;
    name: string;
    slug: string;
    category_slug: string;
    category_label: string;
    description: string | null;
    price: string | null;
    rating: string | null;
    reviews_count: number;
    image: string | null;
}

interface DbReview {
    id: number;
    username: string;
    client_type: 'new' | 'repeat';
    rating: number;
    comment: string;
    image_url: string | null;
    price_range: string | null;
    work_duration: string | null;
    created_at: string;
}

interface Props {
    category: Category;
    subCategory: SubCategory;
    portfolios: PortfolioItem[];
    siblingSubCategories: Array<{ name: string; slug: string }>;
    recommendedServices: RecommendedService[];
    reviews: DbReview[];
    reviewEligibleTask: { id: number } | null;
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

// ─── Review shape used by the template ──────────────────────────────────────

type Review = {
    id: number;
    user: string;
    review: string;
    rating: number;
    priceRange: string | null;
    duration: string | null;
    date: string;
    isRepeatClient: boolean;
    hasRealImage: boolean;
    files?: { type: 'image' | 'video'; url: string }[];
};

function mapDbReview(r: DbReview): Review {
    return {
        id: r.id,
        user: r.username,
        review: r.comment,
        rating: r.rating,
        priceRange: r.price_range,
        duration: r.work_duration,
        date: r.created_at,
        isRepeatClient: r.client_type === 'repeat',
        hasRealImage: !!r.image_url,
        files: r.image_url
            ? [{ type: 'image' as const, url: r.image_url }]
            : [{ type: 'image' as const, url: PLACEHOLDER }],
    };
}

// ─── Mock Portfolio Data ────────────────────────────────────────────────────

const MOCK_PORTFOLIOS: PortfolioItem[] = [
    {
        id: 1,
        title: 'Service Intro — Who We Are',
        media_path:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        media_type: 'video',
        alt: 'Opticore service introduction video',
    },
    {
        id: 2,
        title: 'Brand Identity — TechFlow',
        media_path:
            'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=675&fit=crop',
        media_type: 'image',
        alt: 'TechFlow brand identity project',
    },
    {
        id: 3,
        title: 'Motion Design — Product Demo',
        media_path:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        media_type: 'video',
        alt: 'Product motion design demo',
    },
    {
        id: 4,
        title: 'Visual Campaign — NovaMark',
        media_path:
            'https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=675&fit=crop',
        media_type: 'image',
        alt: 'NovaMark visual campaign',
    },
    {
        id: 5,
        title: 'UI/UX Design — Fintech Dashboard',
        media_path:
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop',
        media_type: 'image',
        alt: 'Fintech dashboard UI design',
    },
    {
        id: 6,
        title: 'Photography — Apex Lifestyle',
        media_path:
            'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=675&fit=crop',
        media_type: 'image',
        alt: 'Apex lifestyle photography',
    },
    {
        id: 7,
        title: 'Social Assets — Luminary Co.',
        media_path:
            'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&h=675&fit=crop',
        media_type: 'image',
        alt: 'Luminary Co. social media assets',
    },
    {
        id: 8,
        title: '3D Renders — Arcadia Space',
        media_path:
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop',
        media_type: 'image',
        alt: 'Arcadia Space 3D renders',
    },
];

// ─── Plans ─────────────────────────────────────────────────────────────────

const PLANS = [
    {
        id: 'basic',
        name: 'Basic',
        price: '$5',
        delivery: '2 Days',
        features: [
            { label: '1 Initial Concept', Icon: Zap },
            { label: '2 Revisions', Icon: RotateCcw },
            { label: 'High-Res JPG/PNG', Icon: ImageIcon },
            { label: 'Commercial Use', Icon: Shield },
        ],
        Icon: Zap,
        accentClass: 'text-zinc-400 dark:text-zinc-500',
    },
    {
        id: 'standard',
        name: 'Standard',
        price: '$10',
        delivery: '4 Days',
        features: [
            { label: '2 Initial Concepts', Icon: Zap },
            { label: '5 Revisions', Icon: RotateCcw },
            { label: 'Source Files', Icon: FileCode },
            { label: 'Commercial Use', Icon: Shield },
            { label: 'Priority Support', Icon: Headset },
        ],
        Icon: Star,
        accentClass: 'text-cyan-500',
        popular: true,
    },
    {
        id: 'premium',
        name: 'Premium',
        price: '$25',
        delivery: '7 Days',
        features: [
            { label: '4 Initial Concepts', Icon: Zap },
            { label: 'Unlimited Revisions', Icon: Repeat },
            { label: 'Full Brand Kit', Icon: Layers },
            { label: 'Source Files', Icon: FileCode },
            { label: 'Commercial Use', Icon: Shield },
            { label: 'VIP Support', Icon: Crown },
        ],
        Icon: Shield,
        accentClass: 'text-violet-500',
    },
] as const;

type PlanId = (typeof PLANS)[number]['id'];

// ─── Review Media Preview ────────────────────────────────────────────────

function ReviewMedia({
    file,
}: {
    file: { type: 'image' | 'video'; url: string };
}) {
    return (
        <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-theme bg-theme-surface md:w-32">
            {file.type === 'video' ? (
                <video
                    src={file.url}
                    muted
                    loop
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                />
            ) : (
                <img
                    src={file.url}
                    alt="Delivered work"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {file.type === 'video' ? (
                    <Play className="h-6 w-6 text-white" />
                ) : (
                    <Maximize2 className="h-6 w-6 text-white" />
                )}
            </div>
        </div>
    );
}

// ─── FAQ Accordion Item ───────────────────────────────────────────────────

function FaqAccordionItem({ faq }: { faq: FaqItem }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`overflow-hidden rounded-3xl transition-all duration-300 ${isOpen ? '-translate-y-0.5 border border-cyan-500/30 bg-theme-surface shadow-[0_12px_40px_rgba(0,0,0,0.45),0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]' : 'border border-theme bg-theme-surface shadow-[0_4px_16px_rgba(0,0,0,0.28),0_2px_4px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.05)] hover:-translate-y-0.5 hover:bg-theme-surface-hover hover:shadow-[0_8px_28px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.07)]'}`}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-6 text-left transition-colors"
            >
                <span
                    className={`text-sm font-bold tracking-tight transition-colors ${isOpen ? 'text-cyan-500' : 'text-theme'}`}
                >
                    {faq.question}
                </span>
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-theme transition-all duration-300 ${isOpen ? 'rotate-180 border-cyan-500/30 bg-cyan-500/10 text-cyan-500' : 'text-theme-muted'}`}
                >
                    <ChevronDown className="h-4 w-4" />
                </div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="px-6 pt-0 pb-6">
                            <p className="text-sm leading-relaxed text-theme-muted">
                                {faq.answer}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Gallery Slider (vertical filmstrip layout) ─────────────────────────────

function GallerySlider({ items }: { items: PortfolioItem[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);
    const [isPlaying, setIsPlaying] = useState(true);
    const [videoProgress, setVideoProgress] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lightboxVideoRef = useRef<HTMLVideoElement>(null);
    const filmstripRef = useRef<HTMLDivElement>(null);

    const slides = items.length > 0 ? items : null;

    const goTo = useCallback((index: number, dir: 1 | -1) => {
        setDirection(dir);
        setActiveIndex(index);
        setIsPlaying(true);
        setVideoProgress(0);
    }, []);

    const goPrev = useCallback(() => {
        if (!slides) {
            return;
        }

        goTo((activeIndex - 1 + slides.length) % slides.length, -1);
    }, [activeIndex, slides, goTo]);

    const goNext = useCallback(() => {
        if (!slides) {
            return;
        }

        goTo((activeIndex + 1) % slides.length, 1);
    }, [activeIndex, slides, goTo]);

    const togglePlayPause = useCallback(() => {
        const vid = videoRef.current;

        if (!vid) {
            return;
        }

        if (vid.paused) {
            vid.play();
            setIsPlaying(true);
        } else {
            vid.pause();
            setIsPlaying(false);
        }
    }, []);

    useEffect(() => {
        const vid = videoRef.current;

        if (!vid) {
            return;
        }

        const onTimeUpdate = () => {
            if (vid.duration) {
                setVideoProgress((vid.currentTime / vid.duration) * 100);
            }
        };
        vid.addEventListener('timeupdate', onTimeUpdate);

        return () => vid.removeEventListener('timeupdate', onTimeUpdate);
    }, [activeIndex]);

    // Keep active thumbnail visible in the filmstrip
    useEffect(() => {
        const strip = filmstripRef.current;

        if (!strip) {
            return;
        }

        const thumb = strip.children[activeIndex] as HTMLElement | undefined;

        if (thumb) {
            thumb.scrollIntoView({
                inline: 'nearest',
                block: 'nearest',
                behavior: 'smooth',
            });
        }
    }, [activeIndex]);

    const slideVariants: Variants = {
        enter: (d: number) => ({
            x: d > 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.98,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
            },
        },
        exit: (d: number) => ({
            x: d > 0 ? '-100%' : '100%',
            opacity: 0,
            scale: 0.98,
            transition: {
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
            },
        }),
    };

    if (!slides) {
        return (
            <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-theme-surface">
                <ImageIcon className="h-10 w-10 text-theme-subtle" />
                <p className="text-sm font-medium text-theme-muted">
                    Portfolio coming soon
                </p>
            </div>
        );
    }

    const active = slides[activeIndex];

    return (
        <>
            <div className="group relative h-[100dvh] w-full overflow-hidden">
                {/* Slides — full screen */}
                <AnimatePresence
                    initial={false}
                    custom={direction}
                    mode="popLayout"
                >
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
                                ref={(el) => {
                                    videoRef.current = el;

                                    if (el) {
                                        el.play().catch(() => {});
                                    }
                                }}
                                src={active.media_path ?? undefined}
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
                    </motion.div>
                </AnimatePresence>

                {/* Bottom gradient */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-72 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Video progress bar */}
                {active.media_type === 'video' && (
                    <div className="absolute inset-x-0 bottom-0 z-30 h-0.5 bg-white/10">
                        <motion.div
                            className="h-full bg-cyan-400"
                            style={{ width: `${videoProgress}%` }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>
                )}

                {/* Play/Pause */}
                {active.media_type === 'video' && (
                    <button
                        type="button"
                        onClick={togglePlayPause}
                        className="absolute top-6 left-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
                        aria-label={isPlaying ? 'Pause video' : 'Play video'}
                    >
                        {isPlaying ? (
                            <Pause className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                    </button>
                )}

                {/* Fullscreen */}
                <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
                    aria-label="View fullscreen"
                >
                    <Maximize2 className="h-4 w-4" />
                </button>

                {/* Navigation arrows */}
                {slides.length > 1 && (
                    <>
                        <button
                            onClick={goPrev}
                            className="absolute top-1/2 left-6 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute top-1/2 right-6 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}

                {/* Caption */}
                <div className="absolute bottom-20 left-6 z-20 md:bottom-24">
                    <p className="text-sm font-semibold text-white drop-shadow">
                        {active.title}
                    </p>
                    {active.media_type === 'video' && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-400">
                            <Film className="h-3 w-3" /> Video
                        </span>
                    )}
                </div>

                {/* Horizontal filmstrip overlay */}
                {slides.length > 1 && (
                    <div
                        ref={filmstripRef}
                        className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2 overflow-x-auto px-4"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {slides.map((item, i) => (
                            <button
                                key={item.id}
                                onClick={() =>
                                    goTo(i, i > activeIndex ? 1 : -1)
                                }
                                className={`relative h-12 w-20 shrink-0 overflow-hidden rounded-lg transition-all duration-300 ${
                                    i === activeIndex
                                        ? 'opacity-100 ring-2 ring-cyan-400 ring-offset-1 ring-offset-black/60'
                                        : 'opacity-50 hover:opacity-80'
                                }`}
                                aria-label={`View ${item.title}`}
                            >
                                {i === activeIndex && (
                                    <span className="absolute inset-x-0 top-0 z-10 h-0.5 rounded-b-full bg-cyan-400" />
                                )}
                                {item.media_type === 'video' ? (
                                    <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                                        <Film className="h-4 w-4 text-white/60" />
                                        {i === activeIndex && (
                                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
                                                <div
                                                    className="h-full bg-cyan-400 transition-none"
                                                    style={{
                                                        width: `${videoProgress}%`,
                                                    }}
                                                />
                                            </div>
                                        )}
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

            {/* Lightbox */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{
                                duration: 0.35,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-theme bg-theme-surface shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {active.media_type === 'video' ? (
                                <video
                                    ref={lightboxVideoRef}
                                    src={active.media_path ?? undefined}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    controls
                                    className="aspect-video w-full object-cover"
                                />
                            ) : (
                                <img
                                    src={active.media_path ?? PLACEHOLDER}
                                    alt={active.alt}
                                    className="aspect-video w-full object-contain"
                                    onError={(e) => {
                                        e.currentTarget.src = PLACEHOLDER;
                                    }}
                                />
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-6 py-5">
                                <p className="font-semibold text-white">
                                    {active.title}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsLightboxOpen(false)}
                                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
                                aria-label="Close lightbox"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ─── Review Form Component ───────────────────────────────────────────────────

const PRICE_RANGES = ['Under $5', '$5 - $10', '$10 - $25', '$25 - $50', '$50+'];
const WORK_DURATIONS = [
    '1 day',
    '2 days',
    '3-5 days',
    '1 week',
    '2 weeks',
    '3+ weeks',
];

function ReviewForm({
    taskId,
    onSuccess,
}: {
    taskId: number;
    onSuccess: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        task_id: number;
        rating: number;
        comment: string;
        price_range: string;
        work_duration: string;
    }>({
        task_id: taskId,
        rating: 0,
        comment: '',
        price_range: '',
        work_duration: '',
    });

    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/reviews', {
            onSuccess: () => {
                reset();
                onSuccess();
            },
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 rounded-3xl border border-cyan-500/30 bg-cyan-500/5 p-6"
        >
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                    <PenLine className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-theme">
                        Share Your Experience
                    </h3>
                    <p className="text-xs text-theme-muted">
                        Your task has been delivered. Leave a review within 24
                        hours.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star rating */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold tracking-wider text-theme-muted uppercase">
                        Rating *
                    </label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onMouseEnter={() => setHoverRating(s)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setData('rating', s)}
                                className="transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`h-7 w-7 transition-colors ${
                                        s <= (hoverRating || data.rating)
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-theme-muted/30'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    {errors.rating && (
                        <p className="mt-1 text-xs text-red-400">
                            {errors.rating}
                        </p>
                    )}
                </div>

                {/* Comment */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold tracking-wider text-theme-muted uppercase">
                        Review *
                    </label>
                    <textarea
                        value={data.comment}
                        onChange={(e) => setData('comment', e.target.value)}
                        placeholder="Describe your experience with this service…"
                        rows={4}
                        className="placeholder-theme-muted w-full resize-none rounded-2xl border border-theme bg-theme-surface p-4 text-sm text-theme transition-colors focus:border-cyan-500 focus:outline-none"
                    />
                    {errors.comment && (
                        <p className="mt-1 text-xs text-red-400">
                            {errors.comment}
                        </p>
                    )}
                </div>

                {/* Price range & Work duration */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1.5 block text-xs font-bold tracking-wider text-theme-muted uppercase">
                            Price Range
                        </label>
                        <select
                            value={data.price_range}
                            onChange={(e) =>
                                setData('price_range', e.target.value)
                            }
                            className="w-full rounded-2xl border border-theme bg-theme-surface px-4 py-2.5 text-sm text-theme focus:border-cyan-500 focus:outline-none"
                        >
                            <option value="">Select…</option>
                            {PRICE_RANGES.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold tracking-wider text-theme-muted uppercase">
                            Work Duration
                        </label>
                        <select
                            value={data.work_duration}
                            onChange={(e) =>
                                setData('work_duration', e.target.value)
                            }
                            className="w-full rounded-2xl border border-theme bg-theme-surface px-4 py-2.5 text-sm text-theme focus:border-cyan-500 focus:outline-none"
                        >
                            <option value="">Select…</option>
                            {WORK_DURATIONS.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing || data.rating === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-4 text-sm font-black tracking-widest text-white uppercase transition-all hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {processing ? 'Submitting…' : 'Submit Review'}
                </button>
            </form>
        </motion.div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SubCategoryShow({
    category,
    subCategory,
    portfolios,
    siblingSubCategories,
    recommendedServices,
    reviews: dbReviews,
    reviewEligibleTask,
}: Props) {
    const { auth } = usePage<SharedPageProps>().props;
    const displayPortfolios =
        portfolios?.length > 0 ? portfolios : MOCK_PORTFOLIOS;
    const [selectedPlan, setSelectedPlan] = useState<PlanId>('standard');
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [hasFilesFilter, setHasFilesFilter] = useState(false);
    // const [reviewPage, setReviewPage] = useState(1);
    const [reviewLightboxItem, setReviewLightboxItem] = useState<{
        type: 'image' | 'video';
        url: string;
    } | null>(null);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const mappedReviews = useMemo(
        () => (dbReviews || []).map(mapDbReview),
        [dbReviews],
    );
    const reviewsSectionRef = useRef<HTMLDivElement>(null);
    const pricingSectionRef = useRef<HTMLDivElement>(null);

    // const REVIEWS_PER_PAGE = 4;

    const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: mappedReviews.filter((r) => r.rating === star).length,
    }));

    const filteredReviews = mappedReviews.filter((r) => {
        const matchesRating = ratingFilter ? r.rating === ratingFilter : true;
        const matchesFiles = hasFilesFilter ? r.hasRealImage : true;

        return matchesRating && matchesFiles;
    });

    // const totalReviewPages = Math.ceil(
    //     filteredReviews.length / REVIEWS_PER_PAGE,
    // );
    // const pagedReviews = filteredReviews.slice(
    //     (reviewPage - 1) * REVIEWS_PER_PAGE,
    //     reviewPage * REVIEWS_PER_PAGE,
    // );

    const scrollToPricing = () =>
        pricingSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });

    const handleHireNow = (planId: PlanId = selectedPlan) => {
        const plan = PLANS.find((p) => p.id === planId)!;

        if (!auth.user) {
            router.visit('/login');

            return;
        }

        router.visit('/checkout', {
            data: {
                service: subCategory.name,
                plan: plan.name,
                price: plan.price,
                delivery: plan.delivery,
                category: category.slug,
                subcategory: subCategory.slug,
            },
        });
    };

    const descriptionFeatures = [
        { label: 'Custom Designs', Icon: Palette },
        { label: 'Fast Turnaround', Icon: Clock },
        { label: 'Expert Consultation', Icon: MessageSquare },
        { label: 'Source Files Included', Icon: FileText },
        { label: 'Commercial License', Icon: Shield },
        { label: 'Revisions Guaranteed', Icon: CheckCircle },
    ];

    const faqs =
        subCategory.faqs && subCategory.faqs.length > 0
            ? subCategory.faqs
            : [
                  {
                      question: '[DUMMY] How long does it take?',
                      answer: 'This is placeholder data. Actual delivery times vary by project scope.',
                  },
                  {
                      question: '[DUMMY] Can I request revisions?',
                      answer: 'This is placeholder data. Revisions are typically included in our packages.',
                  },
                  {
                      question: '[DUMMY] What files will I receive?',
                      answer: 'This is placeholder data. Final deliverables usually include source files and high-res exports.',
                  },
                  {
                      question: '[DUMMY] Do you offer rush delivery?',
                      answer: 'This is placeholder data. Rush options are available for premium packages.',
                  },
              ];

    return (
        <>
            <Head title={`${subCategory.name} — Hire Opticore`} />

            <div className="relative min-h-screen pb-36 lg:pb-24">
                {/* ── CINEMATIC HERO GALLERY (full-width) ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="relative w-full"
                >
                    <GallerySlider items={displayPortfolios} />
                </motion.div>

                {/* ── PAGE HEADER + NAVIGATION ── */}
                <div className="mx-auto max-w-7xl px-4 pt-8">
                    {/* Breadcrumb */}
                    <motion.nav
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mb-8 flex flex-wrap items-center gap-2 text-sm text-theme-muted"
                        aria-label="Breadcrumb"
                    >
                        <Link
                            href="/hire-us"
                            className="transition-colors hover:text-theme"
                        >
                            Hire Us
                        </Link>
                        <span>/</span>
                        <span className="text-theme-muted/80">
                            {category.label}
                        </span>
                        <span>/</span>
                        <span className="font-semibold text-theme">
                            {subCategory.name}
                        </span>
                    </motion.nav>

                    {/* Sibling sub-category tabs */}
                    {siblingSubCategories.length > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                            className="mb-8 flex gap-6 overflow-x-auto border-b border-theme pb-0"
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
                                    className={`shrink-0 border-b-2 pb-3 text-xs font-semibold transition-all ${
                                        s.slug === subCategory.slug
                                            ? 'border-cyan-400 text-cyan-500'
                                            : 'hover:border-theme-muted/50 border-transparent text-theme-muted hover:text-theme'
                                    }`}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {/* Page header */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-10"
                    >
                        <div className="mb-2 text-xs font-bold tracking-[0.2em] text-cyan-500 uppercase">
                            {category.label}
                        </div>
                        <h1 className="mb-4 text-4xl font-black tracking-tight text-theme md:text-5xl">
                            {subCategory.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-5 text-sm">
                            <div className="flex items-center gap-1.5 font-bold text-amber-500">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                        key={s}
                                        className="h-4 w-4 fill-current"
                                    />
                                ))}
                                <span className="ml-1 text-theme">5.0</span>
                                <span className="font-normal text-theme-muted">
                                    ({mappedReviews.length * 41} reviews)
                                </span>
                            </div>
                            <span className="text-theme-subtle">·</span>
                            <span className="text-theme-muted">
                                10 Orders in Queue
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* ── PRICING MODULE ── */}
                <motion.div
                    ref={pricingSectionRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.55,
                        delay: 0.15,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    className="mx-auto max-w-7xl scroll-mt-32 px-4"
                >
                    <p className="mb-6 text-[10px] font-bold tracking-[0.2em] text-theme-muted uppercase">
                        Choose Your Plan
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {PLANS.map((plan) => (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative flex cursor-pointer flex-col rounded-[2rem] border p-6 transition-all duration-300 ${
                                    selectedPlan === plan.id
                                        ? '-translate-y-1.5 border-cyan-400/60 bg-theme-surface shadow-[0_0_48px_rgba(34,211,238,0.22),0_16px_48px_rgba(0,0,0,0.55),0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]'
                                        : 'hover:border-theme-muted/40 border-theme bg-theme-surface shadow-[0_8px_32px_rgba(0,0,0,0.38),0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.08)]'
                                }`}
                            >
                                {'popular' in plan && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-3 py-0.5 text-[9px] font-black tracking-widest text-white uppercase">
                                        Most Popular
                                    </span>
                                )}

                                <div className="mb-5 flex items-start justify-between">
                                    <div>
                                        <div
                                            className={`mb-1 flex items-center gap-2 ${selectedPlan === plan.id ? plan.accentClass : 'text-theme-subtle'}`}
                                        >
                                            <plan.Icon className="h-4 w-4" />
                                            <span className="text-xs font-bold tracking-widest uppercase">
                                                {plan.name}
                                            </span>
                                        </div>
                                        <span className="text-3xl font-black text-theme">
                                            {plan.price}
                                        </span>
                                    </div>
                                    <div className="bg-theme-surface/80 flex items-center gap-1.5 rounded-xl border border-theme px-3 py-2 text-xs text-theme-muted">
                                        <Clock className="h-3.5 w-3.5" />
                                        {plan.delivery}
                                    </div>
                                </div>

                                <ul className="mb-6 space-y-2.5">
                                    {plan.features.map((f) => (
                                        <li
                                            key={f.label}
                                            className="flex items-center gap-3 text-sm text-theme-muted"
                                        >
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
                                                <f.Icon className="h-3 w-3 text-cyan-500" />
                                            </span>
                                            {f.label}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleHireNow(plan.id);
                                    }}
                                    className="group mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-sm font-black tracking-widest text-background uppercase transition-all hover:bg-cyan-500 hover:text-white shadow-[0_5px_18px_rgba(0,0,0,0.55),0_2px_4px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(34,211,238,0.55),0_4px_8px_rgba(34,211,238,0.3),inset_0_1px_0_rgba(255,255,255,0.22)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                                >
                                    Hire Now
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                        <button
                            type="button"
                            onClick={() => setIsContactModalOpen(true)}
                            className="flex items-center gap-2 rounded-2xl border border-theme px-6 py-3 text-sm font-bold text-theme transition-colors hover:bg-theme-surface"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Need a Custom Quote?
                        </button>
                        <div className="flex items-center gap-2 text-xs text-theme-muted">
                            <Shield className="h-4 w-4 text-cyan-500" />
                            Payment held securely — released only when you're
                            satisfied
                        </div>
                    </div>
                </motion.div>

                {/* ── TRUST METRICS (wide card) ── */}
                <div className="relative mt-16 w-full py-10">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="mx-auto max-w-7xl px-4"
                    >
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-cyan-500/25 bg-theme-surface p-8 shadow-[0_24px_80px_rgba(0,0,0,0.65),0_8px_32px_rgba(0,0,0,0.45),0_0_60px_rgba(34,211,238,0.1),inset_0_1px_0_rgba(255,255,255,0.08)] md:p-12">
                            {/* Subtle dot grid */}
                            <div className="dot-grid pointer-events-none absolute inset-0 opacity-20" />
                            {/* Glow orbs */}
                            <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px]" />
                            <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[80px]" />

                            <div className="relative z-10">
                                {/* Header label */}
                                <p className="mb-8 text-center text-[10px] font-bold tracking-[0.25em] text-cyan-500 uppercase md:text-left">
                                    Why clients trust us
                                </p>

                                {/* Stats grid */}
                                <div className="sm:divide-theme grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
                                    {[
                                        {
                                            value: '5.0',
                                            suffix: (
                                                <Star className="h-6 w-6 fill-current text-amber-400 md:h-8 md:w-8" />
                                            ),
                                            label: 'Overall Rating',
                                            accent: 'text-amber-400',
                                        },
                                        {
                                            value: String(
                                                mappedReviews.length * 41,
                                            ),
                                            suffix: null,
                                            label: 'Happy Reviews',
                                            accent: 'text-cyan-500',
                                        },
                                        {
                                            value: '100%',
                                            suffix: null,
                                            label: 'Verified Clients',
                                            accent: 'text-emerald-500',
                                        },
                                        {
                                            value: '10',
                                            suffix: null,
                                            label: 'Active Projects',
                                            accent: 'text-violet-500',
                                        },
                                    ].map((metric, idx) => (
                                        <motion.div
                                            key={metric.label}
                                            initial={{ opacity: 0, y: 16 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{
                                                delay: idx * 0.1,
                                                duration: 0.5,
                                            }}
                                            className="flex flex-col items-center gap-2 px-4 py-2 text-center"
                                        >
                                            <div
                                                className={`flex items-center gap-2 text-5xl font-black md:text-6xl lg:text-7xl ${metric.accent}`}
                                            >
                                                <span>{metric.value}</span>
                                                {metric.suffix}
                                            </div>
                                            <p className="text-xs font-bold tracking-[0.18em] text-theme-muted uppercase">
                                                {metric.label}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Divider */}
                                <div className="via-theme my-8 h-px bg-linear-to-r from-transparent to-transparent" />

                                {/* CTA row */}
                                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                                    <p className="text-sm text-theme-muted">
                                        Ready to experience the difference?{' '}
                                        <span className="font-semibold text-theme">
                                            Join our happy clients today.
                                        </span>
                                    </p>
                                    <button
                                        type="button"
                                        onClick={scrollToPricing}
                                        className="group flex shrink-0 items-center gap-2 rounded-2xl bg-foreground px-8 py-4 text-sm font-black tracking-widest text-background uppercase transition-all hover:bg-cyan-500 hover:text-white shadow-[0_6px_20px_rgba(0,0,0,0.55),0_2px_4px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(34,211,238,0.55),0_4px_8px_rgba(34,211,238,0.3),inset_0_1px_0_rgba(255,255,255,0.22)] active:translate-y-0"
                                    >
                                        Get Started
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── SERVICE DESCRIPTION (full-width) ── */}
                <div className="relative w-full overflow-hidden py-24">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/2">
                        <div className="h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
                    </div>
                    <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/2">
                        <div className="h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{
                            duration: 0.6,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative z-10 mx-auto max-w-7xl px-4"
                    >
                        <div className="mb-10 flex items-start gap-5">
                            <div className="mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                                <Info className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight text-theme md:text-4xl">
                                    Service Description
                                </h2>
                                <p className="mt-4 text-lg leading-relaxed text-theme-muted">
                                    {subCategory.description ??
                                        `We provide high-quality, professional ${subCategory.name.toLowerCase()} tailored specifically to your brand's voice and goals. Our team of experts focuses on delivering visually stunning and commercially effective results that stand out in today's crowded digital landscape.`}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                            {descriptionFeatures.map((item, idx) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group flex flex-col items-center gap-3 rounded-3xl border border-theme bg-theme-surface p-6 text-center transition-all duration-300 shadow-[0_6px_24px_rgba(0,0,0,0.32),0_2px_6px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-2 hover:border-cyan-500/30 hover:shadow-[0_14px_40px_rgba(0,0,0,0.48),0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.09)] hover:bg-theme-surface-hover"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                                        <item.Icon className="h-6 w-6" />
                                    </div>
                                    <span className="text-sm font-bold text-theme">
                                        {item.label}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-12 flex justify-center md:justify-start">
                            <button
                                type="button"
                                onClick={scrollToPricing}
                                className="group flex items-center gap-3 rounded-2xl bg-foreground px-8 py-4 text-sm font-black tracking-widest text-background uppercase transition-all hover:bg-cyan-500 hover:text-white shadow-[0_6px_20px_rgba(0,0,0,0.48),0_2px_4px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.14)] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(34,211,238,0.45),0_3px_6px_rgba(34,211,238,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] active:translate-y-0"
                            >
                                Hire Now
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* ── ABOUT + BACKGROUND (full-width with bg) ── */}
                <div className="bg-theme-surface/30 relative w-full overflow-hidden py-24">
                    <div className="dot-grid pointer-events-none absolute inset-0 opacity-20" />

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{
                            duration: 0.6,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative z-10 mx-auto max-w-5xl px-4"
                    >
                        <div className="overflow-hidden rounded-[2.5rem] border border-theme bg-theme-surface shadow-[0_20px_64px_rgba(0,0,0,0.6),0_8px_24px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.08)]">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {/* Left: Globe + location + languages */}
                                <div className="relative space-y-6 p-10 md:p-12">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
                                            <Globe className="h-6 w-6" />
                                        </div>
                                        <h2 className="text-2xl font-black text-theme">
                                            Background
                                        </h2>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-base leading-relaxed text-theme-muted">
                                            <span className="font-bold text-theme">
                                                Opticore Solutions LTD.
                                            </span>{' '}
                                            is a globally distributed team
                                            operating from the heart of tech
                                            hubs.
                                        </p>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
                                                <span className="text-sm font-semibold text-theme">
                                                    New Mexico, USA
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
                                                <span className="text-sm font-semibold text-theme">
                                                    Dhaka, Bangladesh
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <p className="mb-3 text-[10px] font-bold tracking-widest text-theme-muted uppercase">
                                            Supported Languages
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { name: 'English', flag: '🇺🇸' },
                                                { name: 'Bangla', flag: '🇧🇩' },
                                                { name: 'Hindi', flag: '🇮🇳' },
                                            ].map((lang) => (
                                                <span
                                                    key={lang.name}
                                                    className="flex items-center gap-2 rounded-xl border border-theme bg-theme-surface px-4 py-2 text-xs font-bold text-theme transition-all shadow-[0_3px_10px_rgba(0,0,0,0.38),0_1px_3px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.09)] hover:-translate-y-0.5 hover:border-cyan-500/30 hover:shadow-[0_6px_18px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-theme-surface-hover"
                                                >
                                                    <span>{lang.flag}</span>
                                                    {lang.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: About Us */}
                                <div className="relative flex flex-col gap-6 bg-linear-to-br from-cyan-500/[0.03] to-violet-500/[0.03] p-10 md:p-12">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                                            <Info className="h-6 w-6" />
                                        </div>
                                        <h2 className="text-2xl font-black text-theme">
                                            About Us
                                        </h2>
                                    </div>
                                    <p className="text-base leading-relaxed text-theme-muted">
                                        Opticore is a multidisciplinary creative
                                        agency dedicated to bridging the gap
                                        between high-end strategy and technical
                                        execution. We empower brands with
                                        cinematic motion, conversion-focused
                                        design, and scalable web solutions that
                                        leave a lasting impact.
                                    </p>
                                    <div className="mt-auto pt-8">
                                        <button
                                            type="button"
                                            onClick={scrollToPricing}
                                            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-foreground px-6 py-4 text-sm font-black tracking-widest text-background uppercase transition-all hover:bg-cyan-500 hover:text-white shadow-[0_5px_18px_rgba(0,0,0,0.55),0_2px_4px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(34,211,238,0.55),0_4px_8px_rgba(34,211,238,0.3),inset_0_1px_0_rgba(255,255,255,0.22)] active:translate-y-0 md:w-auto"
                                        >
                                            Start Project
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── FAQs (full-width with border) ── */}
                <div className="relative w-full border-y border-theme bg-linear-to-b from-transparent via-cyan-500/[0.02] to-transparent py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{
                            duration: 0.6,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="mx-auto max-w-7xl px-4"
                    >
                        <div className="mb-12 flex flex-col items-center text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                                <HelpCircle className="h-7 w-7" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight text-theme md:text-4xl">
                                Service FAQs
                            </h2>
                            <p className="mt-4 text-theme-muted">
                                Everything you need to know about our{' '}
                                {subCategory.name.toLowerCase()} service.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {faqs.map((faq, idx) => (
                                <FaqAccordionItem key={idx} faq={faq} />
                            ))}
                        </div>

                        <div className="mt-12 flex justify-center">
                            <button
                                type="button"
                                onClick={scrollToPricing}
                                className="group flex items-center gap-3 rounded-2xl bg-foreground px-8 py-4 text-sm font-black tracking-widest text-background uppercase transition-all hover:bg-cyan-500 hover:text-white shadow-[0_6px_20px_rgba(0,0,0,0.48),0_2px_4px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.14)] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(34,211,238,0.45),0_3px_6px_rgba(34,211,238,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] active:translate-y-0"
                            >
                                Hire Now
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* ── REVIEWS (full-width, high-contrast bg) ── */}
                <div className="relative w-full overflow-hidden border-y border-theme py-20">
                    {/* Section background */}
                    <div className="from-theme-surface via-theme-surface/60 to-theme-surface pointer-events-none absolute inset-0 bg-linear-to-b" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(34,211,238,0.06),transparent)]" />

                    <motion.div
                        ref={reviewsSectionRef}
                        variants={fadeUp}
                        className="relative z-10 mx-auto max-w-7xl space-y-8 px-4"
                    >
                        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                            <div>
                                <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-cyan-500 uppercase">
                                    Verified Client Feedback
                                </p>
                                <h2 className="text-3xl font-black tracking-tight text-theme md:text-4xl">
                                    Client Reviews
                                </h2>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex text-amber-400">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className="h-4 w-4 fill-current"
                                            />
                                        ))}
                                    </div>
                                    <span className="text-lg font-bold text-theme">
                                        {mappedReviews.length > 0
                                            ? (
                                                  mappedReviews.reduce(
                                                      (sum, r) =>
                                                          sum + r.rating,
                                                      0,
                                                  ) / mappedReviews.length
                                              ).toFixed(1)
                                            : '—'}
                                    </span>
                                    <span className="text-sm text-theme-subtle">
                                        ({mappedReviews.length} verified
                                        {mappedReviews.length === 1
                                            ? ' review'
                                            : ' reviews'}
                                        )
                                    </span>
                                </div>
                            </div>

                            {/* Rating Breakdown */}
                            <div className="flex w-full max-w-xs flex-col gap-2">
                                {ratingBreakdown.map((row) => (
                                    <button
                                        key={row.star}
                                        onClick={() =>
                                            setRatingFilter(
                                                ratingFilter === row.star
                                                    ? null
                                                    : row.star,
                                            )
                                        }
                                        className={`group flex items-center gap-3 transition-opacity ${ratingFilter !== null && ratingFilter !== row.star ? 'opacity-40' : 'opacity-100'}`}
                                    >
                                        <span className="flex w-12 items-center gap-1 text-xs font-bold text-theme-subtle">
                                            {row.star}{' '}
                                            <Star className="h-3 w-3 fill-current text-amber-500" />
                                        </span>
                                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-theme-surface-hover">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${(row.count / mappedReviews.length) * 100}%`,
                                                }}
                                                className="absolute inset-y-0 left-0 bg-amber-500"
                                            />
                                        </div>
                                        <span className="w-6 text-right text-xs font-medium text-theme-subtle">
                                            {row.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 border-b border-theme pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-theme-muted">
                                {ratingFilter || hasFilesFilter ? (
                                    <span className="flex flex-wrap items-center gap-2">
                                        Showing {filteredReviews.length} reviews
                                        {ratingFilter && (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                                                {ratingFilter} Stars
                                            </span>
                                        )}
                                        {hasFilesFilter && (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-500">
                                                With Media
                                            </span>
                                        )}
                                        <button
                                            onClick={() => {
                                                setRatingFilter(null);
                                                setHasFilesFilter(false);
                                            }}
                                            className="inline-flex items-center gap-1 rounded-md bg-theme-surface px-2 py-1 text-[10px] font-bold text-theme transition-colors hover:bg-theme-surface-hover"
                                        >
                                            <FilterX className="h-3 w-3" />{' '}
                                            Clear All
                                        </button>
                                    </span>
                                ) : mappedReviews.length > 0 ? (
                                    `Showing all ${mappedReviews.length} review${mappedReviews.length === 1 ? '' : 's'}`
                                ) : (
                                    'No reviews yet'
                                )}
                            </div>

                            <button
                                onClick={() =>
                                    setHasFilesFilter(!hasFilesFilter)
                                }
                                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                                    hasFilesFilter
                                        ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-500'
                                        : 'hover:border-theme-muted/50 border-theme bg-theme-surface text-theme-muted hover:text-theme'
                                }`}
                            >
                                <ImageIcon className="h-3.5 w-3.5" />
                                With Photos/Videos
                            </button>
                        </div>

                        {/* Review submission form — shown only to eligible user */}
                        {reviewEligibleTask && !reviewSubmitted && (
                            <ReviewForm
                                taskId={reviewEligibleTask.id}
                                onSuccess={() => setReviewSubmitted(true)}
                            />
                        )}

                        {/* Success message after submission */}
                        {reviewSubmitted && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"
                            >
                                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                                <p className="text-sm font-semibold text-emerald-400">
                                    Your review has been submitted. Thank you!
                                </p>
                            </motion.div>
                        )}

                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            animate="visible"
                            className="space-y-4"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredReviews.length > 0 ? (
                                    filteredReviews.map((review, i) => (
                                        <motion.div
                                            key={review.user + i}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{
                                                opacity: 0,
                                                scale: 0.95,
                                            }}
                                            variants={fadeUp}
                                            className="group relative overflow-hidden rounded-3xl border border-theme bg-theme-surface p-6 transition-all duration-300 shadow-[0_6px_24px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-[0_16px_48px_rgba(0,0,0,0.52),0_4px_12px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.09)]"
                                        >
                                            {/* Accent top bar */}
                                            <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-amber-500/60 via-amber-400/40 to-transparent" />

                                            <div className="flex flex-col gap-6 md:flex-row">
                                                <div className="flex-1">
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-theme bg-theme-surface-hover ring-2 ring-amber-500/10">
                                                                <User className="h-5 w-5 text-theme-subtle" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-bold text-theme">
                                                                        {
                                                                            review.user
                                                                        }
                                                                    </h4>
                                                                    {review.isRepeatClient && (
                                                                        <span className="flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold text-cyan-500 uppercase">
                                                                            <Repeat className="h-2.5 w-2.5" />{' '}
                                                                            Repeat
                                                                            Client
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-theme-muted">
                                                                    {
                                                                        review.date
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5">
                                                            {[
                                                                1, 2, 3, 4, 5,
                                                            ].map((s) => (
                                                                <Star
                                                                    key={s}
                                                                    className={`h-3.5 w-3.5 text-amber-400 ${s <= review.rating ? 'fill-current' : 'opacity-20'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <p className="mb-6 text-sm leading-relaxed text-theme">
                                                        <span className="mr-0.5 text-lg font-black text-amber-400/60">
                                                            "
                                                        </span>
                                                        {review.review}
                                                        <span className="ml-0.5 text-lg font-black text-amber-400/60">
                                                            "
                                                        </span>
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-3 border-t border-theme pt-4 text-[10px] font-bold tracking-widest text-theme-muted uppercase">
                                                        {review.priceRange && (
                                                            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-500">
                                                                <DollarSign className="h-3 w-3" />
                                                                <span>
                                                                    {
                                                                        review.priceRange
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                        {review.duration && (
                                                            <div className="flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-500">
                                                                <Clock className="h-3 w-3" />
                                                                <span>
                                                                    {
                                                                        review.duration
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Review Attachments */}
                                                {review.files &&
                                                    review.files.length > 0 && (
                                                        <div className="flex shrink-0 flex-wrap gap-2 md:w-32 md:flex-col">
                                                            {review.files.map(
                                                                (
                                                                    file,
                                                                    fIdx,
                                                                ) => (
                                                                    <button
                                                                        key={
                                                                            fIdx
                                                                        }
                                                                        onClick={() =>
                                                                            setReviewLightboxItem(
                                                                                file,
                                                                            )
                                                                        }
                                                                        className="w-full text-left"
                                                                    >
                                                                        <ReviewMedia
                                                                            file={
                                                                                file
                                                                            }
                                                                        />
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-theme-subtle">
                                        No reviews found for this rating level.
                                    </div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                </div>

                {/* ── RECOMMENDED SERVICES ── */}
                {recommendedServices.length > 0 && (
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        className="mx-auto max-w-7xl space-y-8 px-4 py-20"
                    >
                        <motion.div variants={fadeUp}>
                            <h2 className="text-2xl font-bold text-theme">
                                Other Recommended Services
                            </h2>
                            <p className="mt-1 text-sm text-theme-muted">
                                Explore more of what Opticore has to offer
                            </p>
                        </motion.div>

                        <motion.div
                            variants={fadeUp}
                            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                        >
                            {recommendedServices.map((service) => (
                                <Link
                                    key={service.id}
                                    href={showSubCategory.url({
                                        category: service.category_slug,
                                        subcategory: service.slug,
                                    })}
                                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-theme bg-theme-surface transition-all duration-300 shadow-[0_6px_24px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.06)] hover:-translate-y-1.5 hover:border-cyan-500/30 hover:shadow-[0_16px_48px_rgba(0,0,0,0.52),0_4px_12px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.09)]"
                                >
                                    <div className="relative aspect-video w-full overflow-hidden bg-theme-surface">
                                        {service.image ? (
                                            <img
                                                src={service.image}
                                                alt={service.name}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={(e) => {
                                                    e.currentTarget.style.display =
                                                        'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                                <ImageIcon className="h-8 w-8 text-zinc-700" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3">
                                            <span className="rounded-full border border-cyan-500/30 bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-widest text-cyan-500 uppercase backdrop-blur-sm">
                                                {service.category_label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col gap-3 p-5">
                                        <h3 className="text-sm leading-snug font-bold text-theme transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-500">
                                            {service.name}
                                        </h3>

                                        {service.description && (
                                            <p className="line-clamp-2 text-xs leading-relaxed text-theme-muted">
                                                {service.description}
                                            </p>
                                        )}

                                        <div className="mt-auto flex items-center justify-between border-t border-theme pt-3">
                                            {service.rating ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Star className="h-3 w-3 fill-current text-amber-500" />
                                                    <span className="text-xs font-bold text-theme">
                                                        {service.rating}
                                                    </span>
                                                    {service.reviews_count >
                                                        0 && (
                                                        <span className="text-[10px] text-theme-subtle">
                                                            (
                                                            {
                                                                service.reviews_count
                                                            }
                                                            )
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div />
                                            )}
                                            {service.price && (
                                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-500">
                                                    From ${service.price}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <ArrowRight className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-cyan-500 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
                                </Link>
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </div>

            {/* ── Mobile Sticky Bottom Bar ── */}
            <div className="fixed inset-x-0 bottom-0 z-[50] flex items-center gap-3 border-t border-theme bg-background/90 px-4 py-3 backdrop-blur-xl lg:hidden">
                <div className="flex-1">
                    <p className="text-[10px] font-bold tracking-widest text-theme-muted uppercase">
                        Starting from
                    </p>
                    <p className="text-xl font-black text-theme">$5</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                    <span className="text-sm font-bold text-theme">5.0</span>
                    <span className="text-xs text-theme-muted">
                        ({mappedReviews.length * 41})
                    </span>
                </div>
                <button
                    type="button"
                    onClick={scrollToPricing}
                    className="group flex items-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-black tracking-widest text-background uppercase transition-all hover:bg-cyan-500 hover:text-white"
                >
                    See Plans
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
            </div>

            {/* ── Review Attachment Lightbox ── */}
            <AnimatePresence>
                {reviewLightboxItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
                        onClick={() => setReviewLightboxItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{
                                duration: 0.35,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-theme bg-theme-surface shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {reviewLightboxItem.type === 'video' ? (
                                <video
                                    src={reviewLightboxItem.url}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    controls
                                    className="aspect-video w-full object-cover"
                                />
                            ) : (
                                <img
                                    src={reviewLightboxItem.url}
                                    alt="Delivered work"
                                    className="aspect-video w-full object-contain"
                                />
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-6 py-5">
                                <p className="font-semibold text-white">
                                    Client Delivery Result
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReviewLightboxItem(null)}
                                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
                                aria-label="Close lightbox"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Custom Quote Modal ── */}
            <Modal
                open={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                title="Discuss Your Project"
            >
                <div className="space-y-5 p-6">
                    <p className="text-sm text-theme-muted">
                        Tell us more about your custom requirements for{' '}
                        <span className="font-bold text-theme">
                            {subCategory.name}
                        </span>
                        .
                    </p>
                    <textarea
                        placeholder="Describe what you need — scope, timeline, budget…"
                        className="placeholder-theme-muted h-32 w-full rounded-2xl border border-theme bg-theme-surface p-4 text-sm text-theme transition-colors focus:border-cyan-500 focus:outline-none"
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
