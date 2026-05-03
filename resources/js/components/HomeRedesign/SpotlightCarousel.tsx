import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Testimonial = {
    id: string;
    name: string;
    company: string;
    role: string;
    image?: string;
    rating: number;
    comment: string;
};

type CardPosition = 'center' | 'left' | 'right' | 'hidden-left' | 'hidden-right';

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
            "Finally, an agency that understands the intersection of high art and commercial performance. Opticore delivers on both fronts without compromise.",
    },
];

const AVATAR_GRADIENTS = [
    'from-violet-500 to-purple-700',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-700',
    'from-rose-500 to-pink-700',
    'from-amber-500 to-orange-600',
] as const;

const EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CARD_HEIGHT = 340;
const STAGE_HEIGHT = 400;

function resolvePosition(index: number, activeIndex: number, total: number): CardPosition {
    const diff = (index - activeIndex + total) % total;
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    if (diff === total - 1) return 'left';
    return diff <= Math.floor(total / 2) ? 'hidden-right' : 'hidden-left';
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface TestimonialCardProps {
    item: Testimonial;
    colorIndex: number;
    isActive: boolean;
}

function TestimonialCard({ item, colorIndex, isActive }: TestimonialCardProps) {
    const initials = item.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div
            className={`relative flex h-full flex-col overflow-hidden rounded-3xl border p-7 ${
                isActive
                    ? 'border-violet-500/25 bg-theme-surface shadow-2xl shadow-violet-900/20'
                    : 'border-theme bg-theme-surface/70'
            }`}
        >
            {/* Gradient sheen for active card */}
            {isActive && (
                <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-violet-500/[0.07] via-transparent to-cyan-500/[0.07]" />
            )}

            {/* Dimming overlay for side cards */}
            {!isActive && (
                <div className="pointer-events-none absolute inset-0 z-10 rounded-3xl bg-background/30" />
            )}

            <div className="relative z-0 flex h-full flex-col">
                {/* Header row */}
                <div className="mb-4 flex items-start justify-between gap-2">
                    <Quote className="h-7 w-7 flex-shrink-0 text-violet-400/50" />
                    <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                            <Star
                                key={si}
                                className={`h-3.5 w-3.5 ${
                                    si < item.rating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'fill-transparent text-theme-muted/20'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Comment */}
                <p
                    className={`flex-1 text-sm leading-relaxed sm:text-base ${
                        isActive ? 'text-theme-muted' : 'text-theme-muted/60'
                    }`}
                >
                    &ldquo;{item.comment}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.name}
                            className="h-11 w-11 flex-shrink-0 rounded-full object-cover ring-2 ring-violet-500/25"
                        />
                    ) : (
                        <div
                            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[colorIndex % AVATAR_GRADIENTS.length]} text-sm font-bold text-white ring-2 ring-white/10`}
                        >
                            {initials}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-theme">
                            {item.name}
                        </div>
                        <div className="truncate text-xs text-theme-muted">
                            {item.role} · {item.company}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SpotlightCarousel() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(960);
    const dragStartX = useRef(0);
    const hasDragged = useRef(false);

    const total = TESTIMONIALS.length;

    // Track container width for responsive offsets
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const cardWidth = useMemo(
        () => Math.min(containerWidth * 0.52, 440),
        [containerWidth],
    );

    const sideOffset = useMemo(
        () => Math.min(containerWidth * 0.34, 350),
        [containerWidth],
    );

    const next = useCallback(() => setActiveIndex((i) => (i + 1) % total), [total]);
    const prev = useCallback(
        () => setActiveIndex((i) => (i - 1 + total) % total),
        [total],
    );

    // Auto-rotation — pauses on hover
    useEffect(() => {
        if (isHovered) return;
        const interval = setInterval(next, 5000);
        return () => clearInterval(interval);
    }, [next, isHovered]);

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [next, prev]);

    const getAnimate = useCallback(
        (pos: CardPosition) => {
            switch (pos) {
                case 'center':
                    return { x: 0, scale: 1, opacity: 1, filter: 'blur(0px)' };
                case 'left':
                    return { x: -sideOffset, scale: 0.83, opacity: 0.58, filter: 'blur(1px)' };
                case 'right':
                    return { x: sideOffset, scale: 0.83, opacity: 0.58, filter: 'blur(1px)' };
                case 'hidden-left':
                    return {
                        x: -(containerWidth * 0.78),
                        scale: 0.65,
                        opacity: 0,
                        filter: 'blur(6px)',
                    };
                case 'hidden-right':
                    return {
                        x: containerWidth * 0.78,
                        scale: 0.65,
                        opacity: 0,
                        filter: 'blur(6px)',
                    };
            }
        },
        [sideOffset, containerWidth],
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
                delta < 0 ? next() : prev();
            }
        },
        [next, prev],
    );

    return (
        <div
            className="relative select-none py-16"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
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
                    style={{ height: STAGE_HEIGHT }}
                >
                    {TESTIMONIALS.map((item, i) => {
                        const position = resolvePosition(i, activeIndex, total);
                        const animate = getAnimate(position);
                        const isCenter = position === 'center';
                        const isSide = position === 'left' || position === 'right';
                        const zIndex = isCenter ? 20 : isSide ? 10 : 0;

                        return (
                            <motion.div
                                key={item.id}
                                className="absolute"
                                style={{
                                    width: cardWidth,
                                    height: CARD_HEIGHT,
                                    left: '50%',
                                    marginLeft: -cardWidth / 2,
                                    zIndex,
                                    cursor: isSide ? 'pointer' : 'default',
                                }}
                                animate={animate}
                                transition={{
                                    duration: 0.78,
                                    ease: EASING,
                                    filter: { duration: 0.55 },
                                    opacity: { duration: 0.5 },
                                }}
                                onClick={() => {
                                    if (hasDragged.current) return;
                                    if (position === 'left') prev();
                                    else if (position === 'right') next();
                                }}
                                aria-hidden={!isCenter}
                            >
                                <TestimonialCard
                                    item={item}
                                    colorIndex={i}
                                    isActive={isCenter}
                                />
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Controls ── */}
                <div className="mt-8 flex items-center justify-center gap-5">
                    <button
                        onClick={prev}
                        aria-label="Previous testimonial"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-theme bg-theme-surface text-theme-muted transition-colors hover:border-violet-500/60 hover:text-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Pill dots */}
                    <div className="flex items-center gap-2" role="tablist" aria-label="Testimonials">
                        {TESTIMONIALS.map((_, i) => (
                            <button
                                key={i}
                                role="tab"
                                aria-selected={i === activeIndex}
                                aria-label={`Testimonial ${i + 1}`}
                                onClick={() => setActiveIndex(i)}
                                className={`rounded-full transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                                    i === activeIndex
                                        ? 'h-2 w-7 bg-violet-500'
                                        : 'h-2 w-2 bg-theme-muted/30 hover:bg-theme-muted/60'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={next}
                        aria-label="Next testimonial"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-theme bg-theme-surface text-theme-muted transition-colors hover:border-violet-500/60 hover:text-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
