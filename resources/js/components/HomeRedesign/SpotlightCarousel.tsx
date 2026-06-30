import { m as motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GradientOrb from '@/components/UI/GradientOrb';

type Testimonial = {
    id: string;
    name: string;
    company: string;
    role: string;
    image?: string | null;
    rating: number;
    comment: string;
};

type CardPosition =
    | 'center'
    | 'left'
    | 'right'
    | 'hidden-left'
    | 'hidden-right';

const TESTIMONIALS: Testimonial[] = [
    {
        id: '1',
        name: 'Alex Rivera',
        company: 'TechFlow',
        role: 'CEO',
        rating: 5,
        comment:
            'The visual direction Opticore provided was transformative. Our brand feels decades ahead of the competition. Every deliverable exceeded our expectations.',
    },
    {
        id: '2',
        name: 'Sarah Chen',
        company: 'NovaBrand',
        role: 'Marketing Director',
        rating: 5,
        comment:
            'I have never worked with a team that moves this fast without sacrificing a single ounce of quality. The motion work they produced was cinematic.',
    },
    {
        id: '3',
        name: 'James Wilson',
        company: 'Crescent Labs',
        role: 'Founder',
        rating: 5,
        comment:
            "They don't just design; they architect experiences. Every pixel feels intentional and perfectly aligned with our goals. Truly world-class execution.",
    },
    {
        id: '4',
        name: 'Elena Mast',
        company: 'Forma Studio',
        role: 'Product Lead',
        rating: 5,
        comment:
            'The level of detail in their 3D production work was breathtaking. It elevated our entire product launch and drove remarkable audience engagement.',
    },
    {
        id: '5',
        name: 'Marcus Bell',
        company: 'Orbit Creative',
        role: 'Creative Director',
        rating: 5,
        comment:
            'Finally, an agency that understands the intersection of high art and commercial performance. Opticore delivers on both fronts without compromise.',
    },
];

const AVATAR_GRADIENTS = [
    'from-violet-500 to-purple-700',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-700',
    'from-rose-500 to-pink-700',
    'from-amber-500 to-orange-600',
] as const;

const EASING_MANUAL: [number, number, number, number] = [0.7, 0, 0.2, 1];
const EASING_AUTO: [number, number, number, number] = [0.3, 0.05, 0.1, 1];

const MANUAL_TRANSITION = {
    duration: 1.2,
    ease: EASING_MANUAL,
};

const AUTO_TRANSITION = {
    duration: 3.8,
    ease: EASING_AUTO,
};

const CARD_HEIGHT = 340;
const STAGE_HEIGHT = 400;

function resolvePosition(
    index: number,
    activeIndex: number,
    total: number,
): CardPosition {
    const diff = (index - activeIndex + total) % total;

    if (diff === 0) {
        return 'center';
    }

    if (diff === 1) {
        return 'right';
    }

    if (diff === total - 1) {
        return 'left';
    }

    return diff <= Math.floor(total / 2) ? 'hidden-right' : 'hidden-left';
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface TestimonialCardProps {
    item: Testimonial;
    colorIndex: number;
    isActive: boolean;
    compact?: boolean;
}

function TestimonialCard({
    item,
    colorIndex,
    isActive,
    compact = false,
}: TestimonialCardProps) {
    const initials = item.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const activeBg =
        'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-[#1e1e2c] dark:via-[#151520] dark:to-[#0a0a0f]';
    const inactiveBg =
        'bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-[#151520] dark:via-[#0f0f16] dark:to-[#050508]';

    const activeShadowLight =
        'shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15),0_0_0_1px_rgba(139,92,246,0.3),inset_0_0_0_1px_rgba(255,255,255,0.8),inset_0_1px_3px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.05)]';
    const activeShadowDark =
        'dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(139,92,246,0.4),inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.5)]';

    const inactiveShadowLight =
        'shadow-[0_15px_30px_-10px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(255,255,255,0.6),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_2px_rgba(0,0,0,0.03)]';
    const inactiveShadowDark =
        'dark:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_2px_rgba(255,255,255,0.08),inset_0_-1px_2px_rgba(0,0,0,0.3)]';

    return (
        <div
            className={`relative flex h-full flex-col overflow-hidden rounded-3xl transition-all duration-[1.4s] ease-[cubic-bezier(0.8,0,0.2,1)] ${compact ? 'p-5' : 'p-7'} ${
                isActive
                    ? `${activeBg} ${activeShadowLight} ${activeShadowDark}`
                    : `${inactiveBg} ${inactiveShadowLight} ${inactiveShadowDark}`
            }`}
        >
            {/* Top glare effect for 3D depth */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80 dark:via-white/25 dark:opacity-100" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/60 to-transparent opacity-60 dark:from-white/[0.04]" />

            {/* Gradient sheen for active card */}
            {isActive && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-cyan-500/[0.03] dark:from-violet-500/[0.08] dark:to-cyan-500/[0.05]" />
            )}

            {/* Dimming overlay for side cards */}
            {!isActive && (
                <div className="pointer-events-none absolute inset-0 z-10 bg-slate-900/[0.03] dark:bg-black/40" />
            )}

            <div className="relative z-0 flex h-full flex-col">
                {/* Header row */}
                <div
                    className={`${compact ? 'mb-3' : 'mb-4'} flex items-start justify-between gap-2`}
                >
                    {/* Elevated quote icon */}
                    <Quote className="drop-icon dark:drop-icon h-7 w-7 flex-shrink-0 text-violet-500/80 dark:text-violet-400/80" />
                    {/* Elevated stars */}
                    <div className="drop-icon flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                            <Star
                                key={si}
                                className={`h-3.5 w-3.5 ${
                                    si < item.rating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-theme-muted/20 fill-transparent'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Comment (Engraved text) */}
                <p
                    className={`flex-1 text-sm leading-relaxed [text-shadow:0_1px_1px_rgba(255,255,255,0.8)] sm:text-base dark:[text-shadow:0_-1px_1px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.05)] ${
                        isActive ? 'text-theme-muted' : 'text-theme-muted/60'
                    }`}
                >
                    &ldquo;{item.comment}&rdquo;
                </p>

                {/* Author (Elevated content) */}
                <div
                    className={`${compact ? 'mt-4' : 'mt-6'} flex items-center gap-4`}
                >
                    {item.image ? (
                        <div className="neo-btn-ghost relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full p-1">
                            <img
                                src={item.image}
                                alt={item.name}
                                loading="lazy"
                                decoding="async"
                                width={48}
                                height={48}
                                className="drop-icon h-full w-full rounded-full object-cover"
                            />
                        </div>
                    ) : (
                        <div
                            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-[0_4px_10px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(255,255,255,0.2),inset_0_1px_2px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] ${AVATAR_GRADIENTS[colorIndex % AVATAR_GRADIENTS.length]} dark:[&>span]:drop-icon text-sm font-bold text-white [&>span]:drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]`}
                        >
                            <span>{initials}</span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="drop-icon-sm dark:drop-icon-md truncate text-sm font-semibold text-theme">
                            {item.name}
                        </div>
                        <div className="truncate text-xs text-theme-muted">
                            {item.role} &middot; {item.company}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface SpotlightCarouselProps {
    testimonials?: Testimonial[];
}

export default function SpotlightCarousel({
    testimonials,
}: SpotlightCarouselProps) {
    const items =
        testimonials && testimonials.length > 0 ? testimonials : TESTIMONIALS;
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(960);
    const dragStartX = useRef(0);
    const hasDragged = useRef(false);
    const [slideMode, setSlideMode] = useState<'auto' | 'manual'>('auto');
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(
        null,
    );

    const total = items.length;

    // Track container width for responsive offsets
    useEffect(() => {
        const el = containerRef.current;

        if (!el) {
            return;
        }

        const ro = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width);
        });
        ro.observe(el);

        return () => ro.disconnect();
    }, []);

    const isExtraSmall = containerWidth < 375;

    const cardWidth = useMemo(
        () =>
            containerWidth < 375
                ? containerWidth * 0.84
                : Math.min(containerWidth * 0.52, 440),
        [containerWidth],
    );

    const sideOffset = useMemo(
        () =>
            containerWidth < 375
                ? containerWidth * 0.86
                : Math.min(containerWidth * 0.34, 350),
        [containerWidth],
    );

    // Resets the auto-slide timer on any manual interaction
    const [autoSlideKey, setAutoSlideKey] = useState(0);
    const resetAutoSlide = useCallback(() => setAutoSlideKey((k) => k + 1), []);

    const next = useCallback(
        (mode: 'auto' | 'manual' = 'manual') => {
            setSlideMode(mode);

            if (mode === 'manual') {
                resetAutoSlide();
            }

            setActiveIndex((i) => (i + 1) % total);
        },
        [total, resetAutoSlide],
    );

    const prev = useCallback(
        (mode: 'auto' | 'manual' = 'manual') => {
            setSlideMode(mode);

            if (mode === 'manual') {
                resetAutoSlide();
            }

            setActiveIndex((i) => (i - 1 + total) % total);
        },
        [total, resetAutoSlide],
    );

    // Auto-rotation — pauses when a side card is hovered
    const nextRef = useRef(next);

    useEffect(() => {
        nextRef.current = next;
    }, [next]);

    useEffect(() => {
        if (hoveredCardIndex !== null) {
            return;
        }

        const interval = setInterval(() => {
            nextRef.current('auto');
        }, 5000);

        return () => clearInterval(interval);
    }, [autoSlideKey, hoveredCardIndex]);

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                prev();
            } else if (e.key === 'ArrowRight') {
                next();
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [next, prev]);

    const getAnimate = useCallback(
        (pos: CardPosition) => {
            const sideScale = isExtraSmall ? 0.7 : 0.83;
            const sideOpacity = isExtraSmall ? 0.28 : 0.58;

            switch (pos) {
                case 'center':
                    return { x: 0, scale: 1, opacity: 1 };
                case 'left':
                    return {
                        x: -sideOffset,
                        scale: sideScale,
                        opacity: sideOpacity,
                    };
                case 'right':
                    return {
                        x: sideOffset,
                        scale: sideScale,
                        opacity: sideOpacity,
                    };
                case 'hidden-left':
                    return {
                        x: -(containerWidth * 0.78),
                        scale: 0.65,
                        opacity: 0,
                    };
                case 'hidden-right':
                    return {
                        x: containerWidth * 0.78,
                        scale: 0.65,
                        opacity: 0,
                    };
            }
        },
        [sideOffset, containerWidth, isExtraSmall],
    );

    // Drag / swipe handlers (pointer events at container level)
    const onPointerDown = useCallback((e: React.PointerEvent) => {
        dragStartX.current = e.clientX;
        hasDragged.current = false;
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (Math.abs(e.clientX - dragStartX.current) > 8) {
            hasDragged.current = true;
        }
    }, []);

    const onPointerUp = useCallback(
        (e: React.PointerEvent) => {
            const delta = e.clientX - dragStartX.current;

            if (hasDragged.current && Math.abs(delta) > 40) {
                if (delta < 0) {
                    next();
                } else {
                    prev();
                }
            }
        },
        [next, prev],
    );

    return (
        <div className="relative py-16 select-none">
            {/* Background Glows */}
            <GradientOrb
                className="top-1/4 right-0 h-80 w-80 rotate-12"
                color="rgb(124 58 237 / 0.08)"
            />
            <GradientOrb
                className="bottom-1/4 left-0 h-80 w-80 -rotate-12"
                color="rgb(6 182 212 / 0.08)"
            />

            <div
                ref={containerRef}
                className="relative mx-auto max-w-6xl px-4"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{ touchAction: 'pan-y' }}
            >
                {/* ── Cards stage ── */}
                <div
                    className="relative flex items-center justify-center overflow-visible"
                    style={{
                        height: isExtraSmall ? 380 : STAGE_HEIGHT,
                        maskImage: isExtraSmall
                            ? 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)'
                            : 'linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)',
                        WebkitMaskImage: isExtraSmall
                            ? 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)'
                            : 'linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)',
                    }}
                >
                    {items.map((item, i) => {
                        const position = resolvePosition(i, activeIndex, total);
                        const animate = getAnimate(position);
                        const isCenter = position === 'center';
                        const isSide =
                            position === 'left' || position === 'right';
                        const isHoveredSide = isSide && hoveredCardIndex === i;
                        const zIndex = isHoveredSide
                            ? 30
                            : isCenter
                              ? 20
                              : isSide
                                ? 10
                                : 0;

                        return (
                            <motion.div
                                key={item.id}
                                className="absolute"
                                style={{
                                    width: cardWidth,
                                    height: isExtraSmall ? 360 : CARD_HEIGHT,
                                    left: '50%',
                                    marginLeft: -cardWidth / 2,
                                    zIndex,
                                    cursor: isSide ? 'pointer' : 'default',
                                }}
                                animate={animate}
                                whileHover={
                                    isSide
                                        ? { scale: 0.96, opacity: 1, y: -12 }
                                        : undefined
                                }
                                onHoverStart={() => {
                                    if (isSide) {
                                        setHoveredCardIndex(i);
                                    }
                                }}
                                onHoverEnd={() => setHoveredCardIndex(null)}
                                transition={
                                    slideMode === 'auto'
                                        ? AUTO_TRANSITION
                                        : MANUAL_TRANSITION
                                }
                                onClick={() => {
                                    if (hasDragged.current) {
                                        return;
                                    }

                                    if (position === 'left') {
                                        prev();
                                    } else if (position === 'right') {
                                        next();
                                    }
                                }}
                                aria-hidden={!isCenter}
                            >
                                {/* Hover ring for side cards */}
                                {isHoveredSide && (
                                    <div className="pointer-events-none absolute inset-0 z-10 rounded-3xl shadow-[0_0_0_2px_rgba(139,92,246,0.7),0_0_24px_rgba(139,92,246,0.25)]" />
                                )}
                                <TestimonialCard
                                    item={item}
                                    colorIndex={i}
                                    isActive={isCenter}
                                    compact={isExtraSmall}
                                />
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Controls ── */}
                <div className="mt-8 flex items-center justify-center gap-5">
                    <button
                        onClick={() => prev('manual')}
                        aria-label="Previous testimonial"
                        className="neo-btn-ghost flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
                    >
                        <ChevronLeft className="drop-icon h-5 w-5 text-violet-500 dark:text-violet-400" />
                    </button>

                    {/* Pill dots */}
                    <div
                        className="flex items-center gap-2"
                        role="tablist"
                        aria-label="Testimonials"
                    >
                        {items.map((_, i) => (
                            <button
                                key={i}
                                role="tab"
                                aria-selected={i === activeIndex}
                                aria-label={`Testimonial ${i + 1}`}
                                onClick={() => {
                                    resetAutoSlide();
                                    setActiveIndex(i);
                                }}
                                className={`rounded-full transition-all duration-500 ease-out focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none ${
                                    i === activeIndex
                                        ? 'h-2 w-7 bg-violet-500'
                                        : 'bg-theme-muted/30 hover:bg-theme-muted/60 h-2 w-2'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => next('manual')}
                        aria-label="Next testimonial"
                        className="neo-btn-ghost flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
                    >
                        <ChevronRight className="drop-icon h-5 w-5 text-violet-500 dark:text-violet-400" />
                    </button>
                </div>
            </div>
        </div>
    );
}
