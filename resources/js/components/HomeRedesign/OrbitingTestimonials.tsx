import { AnimatePresence, motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';

// ── Types ──────────────────────────────────────────────────────────────────────

export type Testimonial = {
    id: string;
    name: string;
    role?: string;
    company?: string;
    image?: string;
    quote: string;
    rating?: number;
};

interface OrbitingTestimonialsProps {
    items?: Testimonial[];
    autoRotate?: boolean;
    rotationSpeed?: number;
    radius?: number;
    onSelect?: (item: Testimonial) => void;
}

// ── Defaults ───────────────────────────────────────────────────────────────────

const DEFAULT_ITEMS: Testimonial[] = [
    {
        id: '1',
        name: 'Alex Rivera',
        role: 'CEO',
        company: 'TechFlow',
        quote: 'The visual direction Opticore provided was transformative. Our brand feels decades ahead of the competition.',
        rating: 5,
    },
    {
        id: '2',
        name: 'Sarah Chen',
        role: 'Marketing Director',
        company: 'NovaBrand',
        quote: 'I have never worked with a team that moves this fast without sacrificing a single ounce of quality.',
        rating: 5,
    },
    {
        id: '3',
        name: 'James Wilson',
        role: 'Founder',
        company: 'Crescent Labs',
        quote: "They don't just design; they architect experiences. Every pixel feels intentional and aligned with our goals.",
        rating: 5,
    },
    {
        id: '4',
        name: 'Elena Gilbert',
        role: 'Product Lead',
        company: 'Forma Studio',
        quote: 'The level of detail in their 3D production work was breathtaking. It elevated our entire product launch.',
        rating: 5,
    },
    {
        id: '5',
        name: 'Marcus Lee',
        role: 'Creative Director',
        company: 'Luminary Co.',
        quote: 'Working with Opticore feels like having a world-class creative partner embedded in our team.',
        rating: 5,
    },
    {
        id: '6',
        name: 'Priya Sharma',
        role: 'Brand Strategist',
        company: 'Pinnacle Group',
        quote: 'From concept to execution, every deliverable exceeded our expectations. The attention to detail is unmatched.',
        rating: 5,
    },
];

// ── Animation constants ────────────────────────────────────────────────────────

const INERTIA_DECAY = 0.92;
const DRAG_SENSITIVITY = 0.35;
const SNAP_SPEED = 0.09;
const SNAP_THRESHOLD = 0.06;
/** How long the "winning" chip must hold the front before we commit the state update */
const ACTIVE_STABLE_MS = 320;

// ── Component ──────────────────────────────────────────────────────────────────

export default function OrbitingTestimonials({
    items = DEFAULT_ITEMS,
    autoRotate = true,
    rotationSpeed = 0.1,
    radius: radiusProp,
    onSelect,
}: OrbitingTestimonialsProps) {
    const isMobile = useMediaQuery('(max-width: 767px)');
    const prefersReducedMotion = useMediaQuery(
        '(prefers-reduced-motion: reduce)',
    );

    const chipSize = isMobile ? 52 : 68;
    const orbitRadius = radiusProp ?? (isMobile ? 145 : 215);
    // Extra height accounts for the rotateX(-18deg) tilt pushing front chips down / back chips up
    const orbitContainerH = isMobile ? 260 : 340;

    // Each item's fixed angle on the ring
    const cardAngles = useMemo(
        () => items.map((_, i) => (360 / items.length) * i),
        [items],
    );

    // ── All animation state lives in refs (zero re-renders per frame) ──────────

    const globalAngle = useRef(0);
    const velocity = useRef(0);
    const isDragging = useRef(false);
    const isSnapping = useRef(false);
    const snapTarget = useRef(0);
    const rafHandle = useRef(0);
    const autoRotateRef = useRef(autoRotate);
    const rotSpeedRef = useRef(rotationSpeed);
    const prefersReducedRef = useRef(prefersReducedMotion);

    // Active tracking with stability gate (prevents rapid state churn)
    const activeIdxRef = useRef(0);
    const frontCandidateIdx = useRef(0);
    const frontCandidateSince = useRef(0);

    // DOM refs
    const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
    const chipInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
    const glowRef = useRef<HTMLDivElement | null>(null);

    // Drag tracking
    const dragStartX = useRef(0);
    const dragStartAngle = useRef(0);
    const lastDragX = useRef(0);
    const lastDragTime = useRef(0);
    const dragDistance = useRef(0);
    const pointerDownTarget = useRef<EventTarget | null>(null);

    // React state — only the active index needs to be reactive (drives the quote panel)
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        autoRotateRef.current = autoRotate;
    }, [autoRotate]);
    useEffect(() => {
        rotSpeedRef.current = rotationSpeed;
    }, [rotationSpeed]);
    useEffect(() => {
        prefersReducedRef.current = prefersReducedMotion;
    }, [prefersReducedMotion]);

    // ── RAF animation loop ─────────────────────────────────────────────────────

    useEffect(() => {
        function tick() {
            // Update rotation angle
            if (!isDragging.current) {
                if (isSnapping.current) {
                    const diff = snapTarget.current - globalAngle.current;
                    if (Math.abs(diff) < SNAP_THRESHOLD) {
                        globalAngle.current = snapTarget.current;
                        isSnapping.current = false;
                        velocity.current = 0;
                    } else {
                        globalAngle.current += diff * SNAP_SPEED;
                    }
                } else if (Math.abs(velocity.current) > 0.04) {
                    velocity.current *= INERTIA_DECAY;
                    globalAngle.current += velocity.current;
                } else {
                    velocity.current = 0;
                    if (autoRotateRef.current && !prefersReducedRef.current) {
                        globalAngle.current += rotSpeedRef.current;
                    }
                }
            }

            const ga = globalAngle.current;
            let bestIdx = 0;
            let bestNz = -Infinity;

            // Update each chip's transform + depth visuals
            for (let i = 0; i < cardAngles.length; i++) {
                const el = chipRefs.current[i];
                if (!el) continue;

                const eff = ((ga + cardAngles[i]) % 360 + 360) % 360;
                const rad = (eff * Math.PI) / 180;
                const nz = Math.cos(rad); // -1 = back, 1 = front
                const t = (nz + 1) / 2; // 0 → 1 depth factor

                el.style.transform = `rotateY(${eff}deg) translateZ(${orbitRadius}px)`;
                el.style.opacity = (0.28 + 0.72 * t).toFixed(3);

                const blurPx = Math.max(0, 3 * (1 - t));
                el.style.filter =
                    blurPx < 0.1 ? 'none' : `blur(${blurPx.toFixed(1)}px)`;
                el.style.pointerEvents = t < 0.08 ? 'none' : 'auto';
                el.style.zIndex = String(Math.round(t * 10));

                if (nz > bestNz) {
                    bestNz = nz;
                    bestIdx = i;
                }
            }

            // Animate ambient background glow based on orbit rotation
            if (glowRef.current) {
                const glowX = 50 + Math.sin((ga * Math.PI) / 180) * 14;
                const glowY = 50 + Math.cos((ga * Math.PI) / 180) * 6;
                glowRef.current.style.background = `radial-gradient(ellipse 75% 55% at ${glowX.toFixed(1)}% ${glowY.toFixed(1)}%, rgba(124,58,237,0.09) 0%, rgba(6,182,212,0.05) 40%, transparent 70%)`;
            }

            // Update active chip glow/border directly on DOM (no state change)
            const prevIdx = activeIdxRef.current;
            if (bestIdx !== prevIdx) {
                const oldInner = chipInnerRefs.current[prevIdx];
                const newInner = chipInnerRefs.current[bestIdx];
                if (oldInner) {
                    oldInner.style.borderColor = 'rgba(255,255,255,0.1)';
                    oldInner.style.boxShadow = '0 8px 24px -6px rgba(0,0,0,0.4)';
                }
                if (newInner) {
                    newInner.style.borderColor = 'rgba(167,139,250,0.85)';
                    newInner.style.boxShadow =
                        '0 0 32px -4px rgba(139,92,246,0.7), 0 16px 48px -8px rgba(0,0,0,0.5)';
                }
            }

            // Stability gate: commit state update only after ACTIVE_STABLE_MS of holding front
            const now = performance.now();
            if (bestIdx !== frontCandidateIdx.current) {
                frontCandidateIdx.current = bestIdx;
                frontCandidateSince.current = now;
            }
            if (
                bestIdx !== activeIdxRef.current &&
                now - frontCandidateSince.current > ACTIVE_STABLE_MS
            ) {
                activeIdxRef.current = bestIdx;
                setActiveIdx(bestIdx);
            }

            rafHandle.current = requestAnimationFrame(tick);
        }

        rafHandle.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafHandle.current);
    }, [cardAngles, orbitRadius]);

    // ── Snap helpers ───────────────────────────────────────────────────────────

    const snapCardToFront = useCallback(
        (idx: number) => {
            const eff =
                ((globalAngle.current + cardAngles[idx]) % 360 + 360) % 360;
            const adj = eff <= 180 ? -eff : 360 - eff;
            snapTarget.current = globalAngle.current + adj;
            isSnapping.current = true;
            velocity.current = 0;
        },
        [cardAngles],
    );

    const snapToNearest = useCallback(() => {
        let bestIdx = 0;
        let bestDiff = Infinity;
        for (let i = 0; i < cardAngles.length; i++) {
            const eff =
                ((globalAngle.current + cardAngles[i]) % 360 + 360) % 360;
            const diff = Math.min(eff, 360 - eff);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestIdx = i;
            }
        }
        snapCardToFront(bestIdx);
    }, [cardAngles, snapCardToFront]);

    // ── Pointer handlers ───────────────────────────────────────────────────────

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        isDragging.current = true;
        isSnapping.current = false;
        velocity.current = 0;
        dragDistance.current = 0;
        dragStartX.current = e.clientX;
        dragStartAngle.current = globalAngle.current;
        lastDragX.current = e.clientX;
        lastDragTime.current = performance.now();
        pointerDownTarget.current = e.target;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragStartX.current;
        dragDistance.current = Math.abs(dx);
        globalAngle.current = dragStartAngle.current - dx * DRAG_SENSITIVITY;

        const now = performance.now();
        const dt = now - lastDragTime.current;
        if (dt > 0) {
            velocity.current =
                -((e.clientX - lastDragX.current) / dt) *
                16 *
                DRAG_SENSITIVITY;
        }
        lastDragX.current = e.clientX;
        lastDragTime.current = now;
    }, []);

    const onPointerUp = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;

        if (dragDistance.current <= 8) {
            // Treat as tap — walk up from the target to find a chip
            let el = pointerDownTarget.current as HTMLElement | null;
            while (el) {
                const idx = chipRefs.current.indexOf(el as HTMLDivElement);
                if (idx !== -1) {
                    snapCardToFront(idx);
                    // Bypass stability gate on explicit click
                    activeIdxRef.current = idx;
                    frontCandidateIdx.current = idx;
                    frontCandidateSince.current = performance.now();
                    setActiveIdx(idx);
                    onSelect?.(items[idx]);
                    break;
                }
                el = el.parentElement;
            }
        } else {
            snapToNearest();
        }

        pointerDownTarget.current = null;
    }, [items, onSelect, snapCardToFront, snapToNearest]);

    // ── Keyboard navigation ────────────────────────────────────────────────────

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                isSnapping.current = false;
                velocity.current = -8;
            } else if (e.key === 'ArrowRight') {
                isSnapping.current = false;
                velocity.current = 8;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ── Render ─────────────────────────────────────────────────────────────────

    const activeItem = items[activeIdx];

    return (
        <div className="relative overflow-hidden py-20">
            {/* Ambient glow — updated per-frame in RAF */}
            <div
                ref={glowRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-none"
            />

            <div className="relative z-10 mx-auto max-w-3xl px-4">
                {/* ── Central active testimonial ────────────────────────────── */}
                <div
                    className="mb-10 flex justify-center"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeItem.id}
                            initial={{
                                // Clip starts as a circle the size of the avatar chip,
                                // anchored at the bottom-center — pointing at the orbit ring below
                                clipPath: `circle(${chipSize / 2}px at 50% 100%)`,
                                opacity: 0,
                                y: 12,
                            }}
                            animate={{
                                clipPath: 'circle(160% at 50% 100%)',
                                opacity: 1,
                                y: 0,
                            }}
                            exit={{
                                clipPath: `circle(${chipSize / 2}px at 50% 100%)`,
                                opacity: 0,
                                y: 8,
                            }}
                            transition={{
                                duration: 0.65,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="w-full max-w-2xl text-center"
                            role="article"
                            aria-label={`Testimonial by ${activeItem.name}: ${activeItem.quote}`}
                        >
                            {/* Star rating */}
                            {activeItem.rating ? (
                                <div className="mb-5 flex justify-center gap-1">
                                    {Array.from({
                                        length: activeItem.rating,
                                    }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className="h-4 w-4 fill-amber-400 text-amber-400"
                                        />
                                    ))}
                                </div>
                            ) : null}

                            <Quote className="mx-auto mb-5 h-8 w-8 text-violet-400/30" />

                            <p className="text-xl leading-relaxed font-medium text-balance text-foreground md:text-2xl lg:text-[1.65rem]">
                                &ldquo;{activeItem.quote}&rdquo;
                            </p>

                            <div className="mt-8 flex items-center justify-center gap-3">
                                {activeItem.image ? (
                                    <img
                                        src={activeItem.image}
                                        alt={activeItem.name}
                                        className="h-11 w-11 rounded-full object-cover ring-2 ring-violet-500/30"
                                    />
                                ) : (
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-bold text-violet-300 ring-2 ring-violet-500/20">
                                        {activeItem.name[0]}
                                    </div>
                                )}
                                <div className="text-left">
                                    <p className="font-bold text-foreground">
                                        {activeItem.name}
                                    </p>
                                    {(activeItem.role ||
                                        activeItem.company) && (
                                        <p className="text-sm text-theme-muted">
                                            {[
                                                activeItem.role,
                                                activeItem.company,
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ── 3D Orbit ring ─────────────────────────────────────────── */}
                <div
                    className="relative flex items-center justify-center cursor-grab select-none active:cursor-grabbing"
                    style={{
                        height: orbitContainerH,
                        perspective: '1200px',
                        touchAction: 'none',
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                    role="region"
                    aria-label="Testimonial selector — drag or use arrow keys"
                >
                    {/* 3D scene root — zero-size origin, tilted so back side is elevated */}
                    <div
                        style={{
                            width: 0,
                            height: 0,
                            transformStyle: 'preserve-3d',
                            transform: 'rotateX(-18deg)',
                        }}
                    >
                        {/* Orbit ring — lies flat in the XZ plane (rotateX 90deg),
                            diameter = orbitRadius * 2 so the line threads through chip centers */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                left: -orbitRadius,
                                top: -orbitRadius,
                                width: orbitRadius * 2,
                                height: orbitRadius * 2,
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.1)',
                                transform: 'rotateX(90deg)',
                                transformOrigin: 'center',
                                pointerEvents: 'none',
                            }}
                        />

                        {items.map((item, i) => (
                            <div
                                key={item.id}
                                ref={(el) => {
                                    chipRefs.current[i] = el;
                                }}
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    left: -(chipSize / 2),
                                    top: -(chipSize / 2),
                                    width: chipSize,
                                    height: chipSize,
                                    cursor: 'pointer',
                                    willChange: 'transform, opacity, filter',
                                }}
                            >
                                {/* Avatar circle — border/shadow updated directly in RAF */}
                                <div
                                    ref={(el) => {
                                        chipInnerRefs.current[i] = el;
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: `2px solid ${i === 0 ? 'rgba(167,139,250,0.85)' : 'rgba(255,255,255,0.1)'}`,
                                        boxShadow:
                                            i === 0
                                                ? '0 0 32px -4px rgba(139,92,246,0.7), 0 16px 48px -8px rgba(0,0,0,0.5)'
                                                : '0 8px 24px -6px rgba(0,0,0,0.4)',
                                        transition:
                                            'border-color 0.5s ease, box-shadow 0.5s ease',
                                        background: 'rgba(15,15,25,0.9)',
                                    }}
                                >
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            draggable={false}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background:
                                                    'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(6,182,212,0.2))',
                                                color: 'rgba(255,255,255,0.9)',
                                                fontSize: Math.round(
                                                    chipSize * 0.36,
                                                ),
                                                fontWeight: 700,
                                                pointerEvents: 'none',
                                                userSelect: 'none',
                                            }}
                                        >
                                            {item.name[0]}
                                        </div>
                                    )}
                                </div>

                                {/* First-name label */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '108%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        whiteSpace: 'nowrap',
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.45)',
                                        letterSpacing: '0.05em',
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                    }}
                                >
                                    {item.name.split(' ')[0]}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Hint text */}
                    <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/30 px-3 py-1 text-[10px] whitespace-nowrap text-white/30 backdrop-blur-sm">
                        Drag to explore &nbsp;·&nbsp; Click to focus &nbsp;·&nbsp; ← →
                    </p>
                </div>

                {/* Navigation dots */}
                <div
                    className="mt-6 flex justify-center gap-2"
                    role="tablist"
                    aria-label="Testimonial navigation"
                >
                    {items.map((item, i) => (
                        <button
                            key={item.id}
                            role="tab"
                            aria-selected={i === activeIdx}
                            aria-label={`View testimonial by ${item.name}`}
                            onClick={() => {
                                snapCardToFront(i);
                                activeIdxRef.current = i;
                                frontCandidateIdx.current = i;
                                frontCandidateSince.current = performance.now();
                                setActiveIdx(i);
                                onSelect?.(items[i]);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                                i === activeIdx
                                    ? 'w-7 bg-violet-400'
                                    : 'w-1.5 bg-theme-muted/25 hover:bg-theme-muted/50'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
