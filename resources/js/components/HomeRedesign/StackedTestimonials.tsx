import type { PanInfo } from 'framer-motion';
import { animate, motion, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Testimonial = {
    id: string;
    name: string;
    role?: string;
    company?: string;
    image?: string;
    quote: string;
};

interface StackedTestimonialsProps {
    items?: Testimonial[];
    autoPlay?: boolean;
    interval?: number;
    onChange?: (item: Testimonial) => void;
}

const DEFAULT_ITEMS: Testimonial[] = [
    {
        id: '1',
        name: 'Alex Rivera',
        role: 'CEO',
        company: 'TechFlow',
        quote: 'The visual direction Opticore provided was transformative. Our brand feels decades ahead of the competition.',
    },
    {
        id: '2',
        name: 'Sarah Chen',
        role: 'Marketing Director',
        company: 'NovaBrand',
        quote: 'I have never worked with a team that moves this fast without sacrificing a single ounce of quality.',
    },
    {
        id: '3',
        name: 'James Wilson',
        role: 'Founder',
        company: 'Crescent Labs',
        quote: "They don't just design; they architect experiences. Every pixel feels intentional and aligned with our goals.",
    },
    {
        id: '4',
        name: 'Elena Gilbert',
        role: 'Product Lead',
        company: 'Forma Studio',
        quote: 'The level of detail in their 3D production work was breathtaking. It elevated our entire product launch.',
    },
];

const DRAG_THRESHOLD = 75;

const STACK_CONFIGS = [
    {
        scale: 1,
        y: 0,
        xOffset: 0,
        opacity: 1,
        blur: 0,
        zIndex: 10,
        shadow: '0 24px 60px -10px rgba(0,0,0,0.55), 0 8px 20px -6px rgba(0,0,0,0.3)',
    },
    {
        scale: 0.93,
        y: 26,
        xOffset: 10,
        opacity: 0.75,
        blur: 1,
        zIndex: 9,
        shadow: '0 12px 32px -8px rgba(0,0,0,0.32), 0 4px 10px -4px rgba(0,0,0,0.18)',
    },
    {
        scale: 0.86,
        y: 50,
        xOffset: 18,
        opacity: 0.45,
        blur: 2.5,
        zIndex: 8,
        shadow: '0 6px 18px -6px rgba(0,0,0,0.18)',
    },
    {
        scale: 0.79,
        y: 72,
        xOffset: 24,
        opacity: 0.2,
        blur: 4,
        zIndex: 7,
        shadow: '0 2px 8px -4px rgba(0,0,0,0.1)',
    },
] as const;

export default function StackedTestimonials({
    items = DEFAULT_ITEMS,
    autoPlay = true,
    interval = 4500,
    onChange,
}: StackedTestimonialsProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragX = useMotionValue(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const total = items.length;
    const maxDepth = useMemo(
        () => Math.min(4, Math.max(2, total - 1)),
        [total],
    );

    const goTo = useCallback(
        (index: number) => {
            const next = ((index % total) + total) % total;
            setActiveIndex(next);
            onChange?.(items[next]);
        },
        [items, total, onChange],
    );

    const goNext = useCallback(
        () => goTo(activeIndex + 1),
        [activeIndex, goTo],
    );
    const goPrev = useCallback(
        () => goTo(activeIndex - 1),
        [activeIndex, goTo],
    );

    useEffect(() => {
        if (!autoPlay || isPaused || isDragging) {
            return;
        }

        timerRef.current = setInterval(goNext, interval);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [autoPlay, isPaused, isDragging, goNext, interval]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                goNext();
            } else if (e.key === 'ArrowLeft') {
                goPrev();
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [goNext, goPrev]);

    const handleDragStart = useCallback(() => setIsDragging(true), []);

    const handleDragEnd = useCallback(
        (_: unknown, info: PanInfo) => {
            setIsDragging(false);
            const isFlick = Math.abs(info.velocity.x) > 300;
            const isPastThreshold = Math.abs(info.offset.x) > DRAG_THRESHOLD;

            if (isFlick || isPastThreshold) {
                // Reset x cleanly before card transitions so stack animation is crisp
                dragX.set(0);
                const goingNext =
                    info.velocity.x < -300 || info.offset.x < -DRAG_THRESHOLD;

                if (goingNext) {
                    goNext();
                } else {
                    goPrev();
                }
            } else {
                // Spring snap-back with natural feel
                animate(dragX, 0, {
                    type: 'spring',
                    stiffness: 380,
                    damping: 28,
                    mass: 0.8,
                });
            }
        },
        [dragX, goNext, goPrev],
    );

    const stackHeight = 380 + maxDepth * 26;

    return (
        <div
            className="relative overflow-hidden py-32"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="mx-auto max-w-xl px-4">
                {/* Deck */}
                <div
                    className="relative"
                    style={{ height: stackHeight, perspective: '1200px' }}
                    role="region"
                    aria-label="Testimonials carousel"
                    aria-live="polite"
                >
                    {items.map((testimonial, i) => {
                        const position = (i - activeIndex + total) % total;
                        const isActive = position === 0;
                        const isVisible = position <= maxDepth;

                        if (!isVisible) {
                            return null;
                        }

                        const cfg = STACK_CONFIGS[position];

                        return (
                            <motion.div
                                key={testimonial.id}
                                className="absolute inset-x-0 top-0 rounded-[2rem] border border-theme bg-theme-surface p-8 select-none"
                                style={{
                                    zIndex: cfg.zIndex,
                                    cursor: isActive ? 'grab' : 'default',
                                    // Active card: x driven by drag motion value
                                    // Inactive cards: x set via animate below
                                    ...(isActive && { x: dragX }),
                                }}
                                animate={{
                                    scale: cfg.scale,
                                    y: cfg.y,
                                    ...(isActive ? {} : { x: cfg.xOffset }),
                                    opacity: cfg.opacity,
                                    filter: `blur(${cfg.blur}px)`,
                                    boxShadow: cfg.shadow,
                                }}
                                transition={
                                    isActive
                                        ? {
                                              // Spring overshoot gives the micro-animation: card springs
                                              // slightly past scale 1 and y 0 before settling — subtle lift.
                                              scale: {
                                                  type: 'spring',
                                                  stiffness: 280,
                                                  damping: 22,
                                              },
                                              y: {
                                                  type: 'spring',
                                                  stiffness: 300,
                                                  damping: 26,
                                              },
                                              opacity: {
                                                  duration: 0.35,
                                                  ease: 'easeOut',
                                              },
                                              filter: {
                                                  duration: 0.35,
                                                  ease: 'easeOut',
                                              },
                                              boxShadow: {
                                                  duration: 0.5,
                                                  ease: 'easeOut',
                                              },
                                          }
                                        : {
                                              duration: 0.55,
                                              ease: [0.22, 1, 0.36, 1],
                                          }
                                }
                                drag={isActive ? 'x' : false}
                                dragElastic={0.07}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragDirectionLock
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                aria-hidden={!isActive}
                                role={isActive ? 'article' : undefined}
                                aria-label={
                                    isActive
                                        ? `${testimonial.name}${testimonial.role ? `, ${testimonial.role}` : ''}: ${testimonial.quote}`
                                        : undefined
                                }
                                tabIndex={isActive ? 0 : -1}
                                onKeyDown={
                                    isActive
                                        ? (e) => {
                                              if (e.key === 'Enter') {
                                                  onChange?.(testimonial);
                                              }
                                          }
                                        : undefined
                                }
                            >
                                {/* Active glow ring */}
                                {isActive && (
                                    <motion.div
                                        className="pointer-events-none absolute inset-0 rounded-[2rem]"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                        style={{
                                            boxShadow:
                                                '0 0 60px -8px rgba(139,92,246,0.35), 0 0 0 1px rgba(139,92,246,0.15)',
                                        }}
                                    />
                                )}

                                <Quote className="mb-5 h-7 w-7 text-violet-400/50" />

                                <p className="text-lg leading-8 font-medium text-foreground">
                                    &ldquo;{testimonial.quote}&rdquo;
                                </p>

                                <div className="mt-8 flex items-center gap-4">
                                    {testimonial.image ? (
                                        <img
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                            loading="lazy"
                                            decoding="async"
                                            width={44}
                                            height={44}
                                            className="h-11 w-11 rounded-full object-cover"
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300">
                                            {testimonial.name[0]}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-foreground">
                                            {testimonial.name}
                                        </p>
                                        {(testimonial.role ||
                                            testimonial.company) && (
                                            <p className="mt-0.5 text-sm text-theme-muted">
                                                {[
                                                    testimonial.role,
                                                    testimonial.company,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {isActive && (
                                    <div
                                        className="absolute right-8 bottom-8 text-xs font-medium tracking-widest text-theme-muted uppercase"
                                        aria-label={`${activeIndex + 1} of ${total}`}
                                    >
                                        {String(activeIndex + 1).padStart(
                                            2,
                                            '0',
                                        )}{' '}
                                        / {String(total).padStart(2, '0')}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Controls */}
                <div className="mt-8 flex items-center justify-between">
                    <div className="flex gap-3">
                        <button
                            onClick={goPrev}
                            className="rounded-full border border-theme p-3 text-foreground transition-colors hover:bg-theme-surface focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={goNext}
                            className="rounded-full border border-theme p-3 text-foreground transition-colors hover:bg-theme-surface focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                            aria-label="Next testimonial"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex gap-2" role="tablist">
                        {items.map((_, i) => (
                            <button
                                key={i}
                                role="tab"
                                aria-selected={i === activeIndex}
                                aria-label={`Testimonial ${i + 1}`}
                                onClick={() => goTo(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                                    i === activeIndex
                                        ? 'w-7 bg-violet-400'
                                        : 'bg-theme-muted/30 hover:bg-theme-muted/60 w-1.5'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
