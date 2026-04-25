import type { SharedPageProps } from '@/types';
import type { Variants } from 'framer-motion';
import { Head, Link, router, usePage } from '@inertiajs/react';
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
    Send,
    Users,
    ChevronLeft,
    ChevronRight,
    Film,
    ImageIcon,
    Play,
    Pause,
    Maximize2,
    Quote,
    BadgeCheck,
    Globe,
    Languages,
    Info,
    HelpCircle,
    ChevronDown,
    ChevronUp,
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
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
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

interface Props {
    category: Category;
    subCategory: SubCategory;
    portfolios: PortfolioItem[];
    siblingSubCategories: Array<{ name: string; slug: string }>;
    recommendedServices: RecommendedService[];
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

// ─── Chat Message Type ──────────────────────────────────────────────────────

type ChatMessage = { role: 'team' | 'user'; content: string; time: string };

// ─── Static Reviews ─────────────────────────────────────────────────────────

type Review = {
    user: string;
    location: string;
    flag: string;
    review: string;
    rating: number;
    priceRange: string;
    duration: string;
    date: string;
    isRepeatClient: boolean;
    files?: { type: 'image' | 'video'; url: string }[];
};

const REVIEWS: Review[] = [
    {
        user: 'Alex M.',
        location: 'United States',
        flag: '🇺🇸',
        review: 'Exceptional work! Communication was smooth and the final result exceeded my expectations. Will definitely hire again.',
        rating: 5,
        priceRange: '$25 - $50',
        duration: '4 days',
        date: '2 weeks ago',
        isRepeatClient: true,
        files: [
            {
                type: 'image',
                url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=800&fit=crop',
            },
        ],
    },
    {
        user: 'Sarah K.',
        location: 'United Kingdom',
        flag: '🇬🇧',
        review: 'The team really understood my vision. The deliverables were exactly what I needed to boost engagement.',
        rating: 5,
        priceRange: '$50+',
        duration: '7 days',
        date: '1 month ago',
        isRepeatClient: false,
        files: [
            {
                type: 'video',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            },
        ],
    },
    {
        user: 'Rafi H.',
        location: 'Germany',
        flag: '🇩🇪',
        review: 'Fast turnaround, premium quality. The source files were clean and well-organized. Highly recommended.',
        rating: 5,
        priceRange: '$10 - $25',
        duration: '2 days',
        date: '3 days ago',
        isRepeatClient: true,
    },
    {
        user: 'John D.',
        location: 'Canada',
        flag: '🇨🇦',
        review: 'Very good service, though the initial concept needed a bit of tweaking. Overall satisfied.',
        rating: 4,
        priceRange: '$25 - $50',
        duration: '5 days',
        date: '3 weeks ago',
        isRepeatClient: false,
    },
    {
        user: 'Elena P.',
        location: 'France',
        flag: '🇫🇷',
        review: 'The design was great, but delivery was delayed by a day. Still recommended for the quality.',
        rating: 4,
        priceRange: '$50+',
        duration: '8 days',
        date: '2 months ago',
        isRepeatClient: true,
        files: [
            {
                type: 'image',
                url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=800&fit=crop',
            },
        ],
    },
    {
        user: 'Mark T.',
        location: 'Australia',
        flag: '🇦🇺',
        review: 'Decent work, but I expected more options in the basic package.',
        rating: 3,
        priceRange: '$5 - $10',
        duration: '2 days',
        date: '1 week ago',
        isRepeatClient: false,
    },
];

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
        <div className="overflow-hidden rounded-2xl border border-theme bg-theme-surface transition-colors hover:bg-theme-surface-hover">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors"
            >
                <span className="text-sm font-bold text-theme">
                    {faq.question}
                </span>
                {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-theme-muted" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-theme-muted" />
                )}
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="border-t border-theme p-5 pt-0">
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

// ─── Gallery Slider ─────────────────────────────────────────────────────────

function GallerySlider({ items }: { items: PortfolioItem[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);
    const [isPlaying, setIsPlaying] = useState(true);
    const [videoProgress, setVideoProgress] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lightboxVideoRef = useRef<HTMLVideoElement>(null);

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
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-[2rem] border border-theme bg-theme-surface">
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
            <div className="space-y-4">
                {/* Main slide */}
                <div className="group relative aspect-video w-full overflow-hidden rounded-[2rem] border border-theme bg-theme-surface">
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
                                    ref={videoRef}
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
                            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-6 pb-8">
                                <p className="text-sm font-semibold text-white">
                                    {active.title}
                                </p>
                                {active.media_type === 'video' && (
                                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-400">
                                        <Film className="h-3 w-3" /> Video
                                    </span>
                                )}
                            </div>

                            {/* Video progress bar */}
                            {active.media_type === 'video' && (
                                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
                                    <motion.div
                                        className="h-full bg-cyan-400"
                                        style={{ width: `${videoProgress}%` }}
                                        transition={{ duration: 0.1 }}
                                    />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Play/Pause overlay for video */}
                    {active.media_type === 'video' && (
                        <button
                            type="button"
                            onClick={togglePlayPause}
                            className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
                            aria-label={
                                isPlaying ? 'Pause video' : 'Play video'
                            }
                        >
                            {isPlaying ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                        </button>
                    )}

                    {/* Fullscreen/zoom button */}
                    <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80"
                        aria-label="View fullscreen"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </button>

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
                                    onClick={() =>
                                        goTo(i, i > activeIndex ? 1 : -1)
                                    }
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
                                onClick={() =>
                                    goTo(i, i > activeIndex ? 1 : -1)
                                }
                                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                                    i === activeIndex
                                        ? 'border-cyan-400 opacity-100 shadow-[0_0_14px_rgba(34,211,238,0.45)]'
                                        : 'hover:border-theme-muted/50 border-theme opacity-50 hover:opacity-80'
                                }`}
                            >
                                {item.media_type === 'video' ? (
                                    <div className="flex h-full w-full items-center justify-center bg-theme-surface">
                                        <Film className="h-4 w-4 text-theme-subtle" />
                                        {i === activeIndex &&
                                            item.media_type === 'video' && (
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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SubCategoryShow({
    category,
    subCategory,
    portfolios,
    siblingSubCategories,
    recommendedServices,
}: Props) {
    const { auth } = usePage<SharedPageProps>().props;
    const displayPortfolios =
        portfolios.length > 0 ? portfolios : MOCK_PORTFOLIOS;
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
    const [activeReviewIndex, setActiveReviewIndex] = useState(0);
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [hasFilesFilter, setHasFilesFilter] = useState(false);
    const [reviewLightboxItem, setReviewLightboxItem] = useState<{
        type: string;
        url: string;
    } | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const reviewsSectionRef = useRef<HTMLDivElement>(null);

    const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: REVIEWS.filter((r) => r.rating === star).length,
    }));

    const filteredReviews = REVIEWS.filter((r) => {
        const matchesRating = ratingFilter ? r.rating === ratingFilter : true;
        const matchesFiles = hasFilesFilter
            ? r.files && r.files.length > 0
            : true;

        return matchesRating && matchesFiles;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveReviewIndex((prev) => (prev + 1) % REVIEWS.length);
        }, 3500);

        return () => clearInterval(interval);
    }, []);

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

            <div className="relative min-h-screen bg-background pb-24">
                {/* Background glows */}
                <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[140px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[140px]" />

                <div className="relative mx-auto max-w-7xl px-4 pt-32">
                    {/* Breadcrumb */}
                    <motion.nav
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mb-10 flex flex-wrap items-center gap-2 text-sm text-theme-muted"
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
                                            ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-500'
                                            : 'hover:border-theme-muted/50 border-theme bg-theme-surface text-theme-muted hover:text-theme'
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
                                <div className="mb-2 text-xs font-bold tracking-[0.2em] text-cyan-500 uppercase">
                                    {category.label}
                                </div>
                                <h1 className="mb-5 text-4xl font-black tracking-tight text-theme md:text-5xl">
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
                                        <span className="ml-1 text-theme">
                                            5.0
                                        </span>
                                        <span className="font-normal text-theme-muted">
                                            ({REVIEWS.length * 41} Reviews)
                                        </span>
                                    </div>
                                    <span className="text-theme-subtle">·</span>
                                    <span className="text-theme-muted">
                                        10 Orders in Queue
                                    </span>
                                </div>
                            </motion.div>

                            {/* Gallery */}
                            <motion.div variants={fadeUp}>
                                <GallerySlider items={displayPortfolios} />
                            </motion.div>

                            {/* Featured Trust Section */}
                            <motion.div
                                variants={fadeUp}
                                className="relative overflow-hidden rounded-[2rem] border border-theme bg-theme-surface p-8 backdrop-blur-sm transition-transform duration-300 hover:scale-[1.01]"
                            >
                                <Quote className="absolute -top-4 -right-4 h-32 w-32 rotate-180 text-cyan-500/5" />

                                {/* Auto-sliding review carousel */}
                                <div className="relative min-h-[120px]">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeReviewIndex}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -12 }}
                                            transition={{
                                                duration: 0.4,
                                                ease: [0.22, 1, 0.36, 1],
                                            }}
                                            className="space-y-5"
                                        >
                                            <div className="flex gap-1 text-amber-400">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className="h-4 w-4 fill-current"
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-lg leading-relaxed font-medium text-theme-muted italic">
                                                "
                                                {
                                                    REVIEWS[activeReviewIndex]
                                                        .review
                                                }
                                                "
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-surface-hover">
                                                    <User className="h-5 w-5 text-theme-subtle" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-theme">
                                                            {
                                                                REVIEWS[
                                                                    activeReviewIndex
                                                                ].user
                                                            }
                                                        </span>
                                                        <BadgeCheck className="h-4 w-4 text-cyan-500" />
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-theme-muted">
                                                        <span className="flex items-center gap-1">
                                                            <span>
                                                                {
                                                                    REVIEWS[
                                                                        activeReviewIndex
                                                                    ].flag
                                                                }
                                                            </span>
                                                            {
                                                                REVIEWS[
                                                                    activeReviewIndex
                                                                ].location
                                                            }
                                                        </span>
                                                        <span>·</span>
                                                        <span>
                                                            {
                                                                REVIEWS[
                                                                    activeReviewIndex
                                                                ].date
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Dot indicators */}
                                <div className="mt-5 flex gap-1.5">
                                    {REVIEWS.map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() =>
                                                setActiveReviewIndex(i)
                                            }
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                i === activeReviewIndex
                                                    ? 'w-6 bg-cyan-500'
                                                    : 'bg-theme-muted/30 hover:bg-theme-muted/50 w-1.5'
                                            }`}
                                            aria-label={`Go to review ${i + 1}`}
                                        />
                                    ))}
                                </div>

                                {/* Trust banner + View All button */}
                                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-theme pt-5">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-amber-400">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className="h-4 w-4 fill-current"
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm font-bold text-theme">
                                                5.0/5.0 Overall Rating
                                            </span>
                                        </div>
                                        <span className="hidden text-theme-subtle sm:inline">
                                            ·
                                        </span>
                                        <div className="flex items-center gap-1.5 text-sm text-theme-muted">
                                            <Shield className="h-4 w-4 text-cyan-500" />
                                            <span>
                                                Verified Opticore Clients
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            reviewsSectionRef.current?.scrollIntoView(
                                                { behavior: 'smooth' },
                                            )
                                        }
                                        className="flex items-center gap-1.5 rounded-full border border-theme bg-theme-surface px-4 py-2 text-xs font-bold text-theme-muted transition-all hover:bg-theme-surface-hover"
                                    >
                                        View All Reviews
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </motion.div>

                            {/* Description */}
                            <motion.div
                                variants={fadeUp}
                                className="glass-panel space-y-6 rounded-[2rem] border-theme p-8 md:p-10"
                            >
                                <h2 className="text-2xl font-bold text-theme">
                                    Service Description
                                </h2>
                                <p className="text-base leading-relaxed text-theme-muted">
                                    {subCategory.description ??
                                        `We provide high-quality, professional ${subCategory.name.toLowerCase()} tailored specifically to your brand's voice and goals. Our team of experts focuses on delivering visually stunning and commercially effective results that stand out in today's crowded digital landscape.`}
                                </p>
                                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {[
                                        {
                                            label: 'Custom Designs',
                                            Icon: Palette,
                                        },
                                        {
                                            label: 'Fast Turnaround',
                                            Icon: Clock,
                                        },
                                        {
                                            label: 'Expert Consultation',
                                            Icon: MessageSquare,
                                        },
                                        {
                                            label: 'Source Files Included',
                                            Icon: FileText,
                                        },
                                        {
                                            label: 'Commercial License',
                                            Icon: Shield,
                                        },
                                        {
                                            label: 'Revisions Guaranteed',
                                            Icon: CheckCircle,
                                        },
                                    ].map((item) => (
                                        <li
                                            key={item.label}
                                            className="flex items-center gap-3 text-sm text-theme-muted"
                                        >
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
                                                <item.Icon className="h-3 w-3 text-cyan-500" />
                                            </span>
                                            {item.label}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Company Background & About Section */}
                            <motion.div
                                variants={fadeUp}
                                className="flex flex-col gap-6"
                            >
                                <div className="glass-panel space-y-6 rounded-[2rem] border-theme p-8 md:p-10">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-xl font-bold text-theme">
                                            Background
                                        </h2>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-sm leading-relaxed text-theme-muted">
                                            <span className="font-bold text-theme">
                                                Opticore Solutions LTD.
                                            </span>{' '}
                                            operates from{' '}
                                            <span className="text-cyan-500">
                                                New Mexico, USA
                                            </span>{' '}
                                            and{' '}
                                            <span className="text-cyan-500">
                                                Dhaka, Bangladesh
                                            </span>
                                            .
                                        </p>
                                        <div className="flex items-center gap-3 pt-2">
                                            <Languages className="h-4 w-4 text-theme-subtle" />
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    {
                                                        name: 'English',
                                                        flag: '🇺🇸',
                                                    },
                                                    {
                                                        name: 'Bangla',
                                                        flag: '🇧🇩',
                                                    },
                                                    {
                                                        name: 'Hindi',
                                                        flag: '🇮🇳',
                                                    },
                                                ].map((lang) => (
                                                    <span
                                                        key={lang.name}
                                                        className="flex items-center gap-1.5 rounded-full border border-theme bg-theme-surface px-3 py-1 text-[10px] font-bold tracking-widest text-theme-muted uppercase"
                                                    >
                                                        <span>{lang.flag}</span>
                                                        {lang.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel space-y-6 rounded-[2rem] border-theme p-8 md:p-10">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                                            <Info className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-xl font-bold text-theme">
                                            About Us
                                        </h2>
                                    </div>
                                    <p className="text-sm leading-relaxed text-theme-muted">
                                        Opticore is a multidisciplinary creative
                                        agency dedicated to bridging the gap
                                        between high-end strategy and technical
                                        execution. We empower brands with
                                        cinematic motion, conversion-focused
                                        design, and scalable web solutions that
                                        leave a lasting impact.
                                    </p>
                                </div>

                                {/* Service FAQ Section */}
                                <div className="glass-panel space-y-6 rounded-[2rem] border-theme p-8 md:p-10">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                                            <HelpCircle className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-xl font-bold text-theme">
                                            Service FAQs
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        {(subCategory.faqs &&
                                        subCategory.faqs.length > 0
                                            ? subCategory.faqs
                                            : [
                                                  {
                                                      question:
                                                          '[DUMMY] How long does it take?',
                                                      answer: 'This is placeholder data. Actual delivery times vary by project scope.',
                                                  },
                                                  {
                                                      question:
                                                          '[DUMMY] Can I request revisions?',
                                                      answer: 'This is placeholder data. Revisions are typically included in our packages.',
                                                  },
                                                  {
                                                      question:
                                                          '[DUMMY] What files will I receive?',
                                                      answer: 'This is placeholder data. Final deliverables usually include source files and high-res exports.',
                                                  },
                                              ]
                                        ).map((faq, idx) => (
                                            <FaqAccordionItem
                                                key={idx}
                                                faq={faq}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Reviews */}
                            <motion.div
                                ref={reviewsSectionRef}
                                variants={fadeUp}
                                className="space-y-8"
                            >
                                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-theme">
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
                                                4.8
                                            </span>
                                            <span className="text-sm text-theme-subtle">
                                                ({REVIEWS.length} verified
                                                reviews)
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
                                                        ratingFilter ===
                                                            row.star
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
                                                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-theme-surface">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${(row.count / REVIEWS.length) * 100}%`,
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
                                                Showing {filteredReviews.length}{' '}
                                                reviews
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
                                                        setHasFilesFilter(
                                                            false,
                                                        );
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-md bg-theme-surface px-2 py-1 text-[10px] font-bold text-theme transition-colors hover:bg-theme-surface-hover"
                                                >
                                                    <FilterX className="h-3 w-3" />{' '}
                                                    Clear All
                                                </button>
                                            </span>
                                        ) : (
                                            `Showing all ${REVIEWS.length} reviews`
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
                                                    initial={{
                                                        opacity: 0,
                                                        y: 10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        scale: 0.95,
                                                    }}
                                                    variants={fadeUp}
                                                    className="bg-theme-surface/30 hover:bg-theme-surface/50 rounded-3xl border border-theme p-6 transition-colors"
                                                >
                                                    <div className="flex flex-col gap-6 md:flex-row">
                                                        <div className="flex-1">
                                                            <div className="mb-4 flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-theme-surface-hover">
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
                                                                                <span className="flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold text-cyan-500 uppercase">
                                                                                    <Repeat className="h-2.5 w-2.5" />{' '}
                                                                                    Repeat
                                                                                    Client
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-xs text-theme-muted">
                                                                            <span className="mr-1">
                                                                                {
                                                                                    review.flag
                                                                                }
                                                                            </span>
                                                                            {
                                                                                review.location
                                                                            }{' '}
                                                                            ·{' '}
                                                                            {
                                                                                review.date
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex text-amber-400">
                                                                    {[
                                                                        1, 2, 3,
                                                                        4, 5,
                                                                    ].map(
                                                                        (s) => (
                                                                            <Star
                                                                                key={
                                                                                    s
                                                                                }
                                                                                className={`h-3.5 w-3.5 ${s <= review.rating ? 'fill-current' : 'text-theme-muted/20'}`}
                                                                            />
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <p className="mb-6 text-sm leading-relaxed text-theme-muted italic">
                                                                "{review.review}
                                                                "
                                                            </p>

                                                            <div className="flex flex-wrap items-center gap-4 border-t border-theme pt-4 text-[10px] font-bold tracking-widest text-theme-muted uppercase">
                                                                <div className="flex items-center gap-1.5">
                                                                    <DollarSign className="h-3 w-3 text-emerald-500" />
                                                                    <span>
                                                                        Price:{' '}
                                                                        {
                                                                            review.priceRange
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock className="h-3 w-3 text-cyan-500" />
                                                                    <span>
                                                                        Duration:{' '}
                                                                        {
                                                                            review.duration
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Review Attachments */}
                                                        {review.files &&
                                                            review.files
                                                                .length > 0 && (
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
                                                No reviews found for this rating
                                                level.
                                            </div>
                                        )}
                                    </AnimatePresence>
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
                                className="glass-panel bg-theme-surface/60 rounded-[2.5rem] border-theme p-6 backdrop-blur-xl"
                            >
                                {/* Plan switcher tabs */}
                                <div className="mb-6 flex rounded-2xl bg-theme-surface-hover p-1.5">
                                    {PLANS.map((plan) => (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedPlan(plan.id)
                                            }
                                            className={`relative flex-1 rounded-xl py-3 text-xs font-bold transition-all ${
                                                selectedPlan === plan.id
                                                    ? 'bg-foreground text-background shadow-lg'
                                                    : 'text-theme-muted hover:text-theme'
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
                                                    <span className="text-2xl font-black text-theme">
                                                        {activePlan.price}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 rounded-xl border border-theme bg-theme-surface px-3 py-2 text-xs text-theme-muted">
                                                <Clock className="h-3.5 w-3.5" />
                                                {activePlan.delivery}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs leading-relaxed text-theme-subtle">
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
                                                    key={f.label}
                                                    className="flex items-center gap-3 text-xs text-theme-muted"
                                                >
                                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
                                                        <f.Icon className="h-2.5 w-2.5 text-cyan-500" />
                                                    </span>
                                                    {f.label}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* CTA buttons */}
                                        <div className="space-y-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!auth.user) {
                                                        router.visit('/login');

                                                        return;
                                                    }

                                                    router.visit('/checkout', {
                                                        data: {
                                                            service:
                                                                subCategory.name,
                                                            plan: activePlan.name,
                                                            price: activePlan.price,
                                                            delivery:
                                                                activePlan.delivery,
                                                            category:
                                                                category.slug,
                                                            subcategory:
                                                                subCategory.slug,
                                                        },
                                                    });
                                                }}
                                                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-black tracking-widest text-background uppercase transition-all hover:bg-cyan-500 hover:text-white"
                                            >
                                                Hire Now
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsContactModalOpen(true)
                                                }
                                                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-theme py-3.5 text-sm font-bold text-theme transition-colors hover:bg-theme-surface"
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
                                <h4 className="mb-1.5 flex items-center gap-2 text-sm font-bold text-cyan-500">
                                    <Shield className="h-4 w-4" /> Secure
                                    Purchase
                                </h4>
                                <p className="text-xs leading-relaxed text-theme-muted">
                                    Your payment is held securely and released
                                    only when you're satisfied with the final
                                    delivery.
                                </p>
                            </motion.div>
                        </div>
                    </div>

                    {/* Other Recommended Services */}
                    {recommendedServices.length > 0 && (
                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-80px' }}
                            className="mt-20 space-y-8"
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
                                        className="bg-theme-surface/30 hover:bg-theme-surface/50 group relative flex flex-col overflow-hidden rounded-3xl border border-theme transition-all duration-300 hover:-translate-y-1"
                                    >
                                        {/* Thumbnail */}
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
                                            {/* Category badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className="rounded-full border border-cyan-500/30 bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-widest text-cyan-500 uppercase backdrop-blur-sm">
                                                    {service.category_label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
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

            {/* ── Floating Chat ── */}
            <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start sm:bottom-8 sm:left-8">
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
                            className="glass-panel border-theme bg-theme-surface mb-4 flex h-[480px] w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-[2rem] border shadow-2xl sm:w-[360px]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-theme bg-theme-surface-hover px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-500">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-theme">
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
                                    className="text-theme-muted transition-colors hover:text-theme"
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
                                                    ? 'rounded-tr-none bg-foreground text-background'
                                                    : 'rounded-tl-none border border-theme bg-theme-surface-hover text-theme'
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                        <span className="mt-1.5 text-[10px] text-theme-subtle">
                                            {msg.time}
                                        </span>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <form
                                onSubmit={handleSendMessage}
                                className="border-t border-theme bg-theme-surface-hover p-4"
                            >
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) =>
                                            setNewMessage(e.target.value)
                                        }
                                        placeholder="Ask about this service…"
                                        className="placeholder-theme-subtle w-full rounded-xl border border-theme bg-theme-surface py-3 pr-12 pl-4 text-sm text-theme focus:border-cyan-500/50 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-cyan-500 text-white transition-colors hover:bg-cyan-600"
                                        aria-label="Send message"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="mt-2.5 text-center text-[9px] font-bold tracking-[0.2em] text-theme-subtle uppercase">
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
                    className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all duration-300 ${
                        isChatOpen
                            ? 'rotate-90 bg-foreground text-background'
                            : 'bg-background text-cyan-600 hover:scale-110 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] dark:text-cyan-400'
                    }`}
                    aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
                >
                    {isChatOpen ? (
                        <X className="h-7 w-7" />
                    ) : (
                        <MessageSquare className="h-7 w-7" />
                    )}
                    {!isChatOpen && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 animate-ping rounded-full bg-cyan-500" />
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
