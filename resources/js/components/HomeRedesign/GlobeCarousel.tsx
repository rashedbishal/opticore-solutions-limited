import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';

// ── Public types ──────────────────────────────────────────────────────────────

export interface GlobeItem {
    id: string;
    title: string;
    image: string;
    category?: string;
}

export interface GlobeCarouselProps {
    items: GlobeItem[];
    autoRotate?: boolean;
    rotationSpeed?: number;
    onSelect?: (item: GlobeItem) => void;
}

// ── Internal layout types ─────────────────────────────────────────────────────

interface SizeConfig {
    midRadius: number;
    sideRadius: number;
    cardW: number;
    cardH: number;
    perspective: number;
    /** vertical offset in px for top/bottom rings from the 3D origin */
    ringY: number;
}

interface CardLayout {
    item: GlobeItem;
    /** card's fixed position in its ring (degrees) */
    cardAngle: number;
    /** fixed Y offset in px — positive = down, negative = up */
    ringY: number;
    /** translateZ radius */
    radius: number;
}

// ── Layout math ───────────────────────────────────────────────────────────────

// Ring distribution weights and stagger offsets
const RING_WEIGHTS = [0.28, 0.44, 0.28];
const RING_STAGGER = [22, 0, 22]; // degrees — prevents vertical alignment

function computeLayout(items: GlobeItem[], cfg: SizeConfig): CardLayout[] {
    const n = items.length;

    if (n === 0) {
        return [];
    }

    const midCount = Math.round(n * RING_WEIGHTS[1]);
    const topCount = Math.round(n * RING_WEIGHTS[0]);
    const botCount = n - midCount - topCount;

    const rings = [
        {
            ringY: -cfg.ringY,
            radius: cfg.sideRadius,
            count: topCount,
            stagger: RING_STAGGER[0],
        },
        {
            ringY: 0,
            radius: cfg.midRadius,
            count: midCount,
            stagger: RING_STAGGER[1],
        },
        {
            ringY: cfg.ringY,
            radius: cfg.sideRadius,
            count: botCount,
            stagger: RING_STAGGER[2],
        },
    ];

    const result: CardLayout[] = [];
    let idx = 0;

    for (const ring of rings) {
        const step = ring.count > 1 ? 360 / ring.count : 0;

        for (let i = 0; i < ring.count && idx < n; i++, idx++) {
            result.push({
                item: items[idx],
                cardAngle: ring.stagger + step * i,
                ringY: ring.ringY,
                radius: ring.radius,
            });
        }
    }

    return result;
}

// ── Animation constants ───────────────────────────────────────────────────────

const INERTIA_DECAY = 0.935;
const DRAG_SENSITIVITY = 0.36;
const SNAP_SPEED = 0.09;
const SNAP_THRESHOLD = 0.07;

// ── Component ─────────────────────────────────────────────────────────────────

export default function GlobeCarousel({
    items,
    autoRotate = true,
    rotationSpeed = 0.15,
    onSelect,
}: GlobeCarouselProps) {
    const isSmall = useMediaQuery('(max-width: 479px)');
    const isMobile = useMediaQuery('(max-width: 767px)');

    // Responsive card + globe dimensions
    const sizeConfig = useMemo<SizeConfig>(() => {
        if (isSmall) {
            return {
                midRadius: 168,
                sideRadius: 132,
                cardW: 115,
                cardH: 84,
                perspective: 500,
                ringY: 92,
            };
        }

        if (isMobile) {
            return {
                midRadius: 245,
                sideRadius: 192,
                cardW: 148,
                cardH: 108,
                perspective: 660,
                ringY: 118,
            };
        }

        // Desktop
        return {
            midRadius: 340,
            sideRadius: 268,
            cardW: 205,
            cardH: 150,
            perspective: 880,
            ringY: 160,
        };
    }, [isSmall, isMobile]);

    const layout = useMemo(
        () => computeLayout(items, sizeConfig),
        [items, sizeConfig],
    );

    // layoutRef so the RAF closure always reads the latest layout without restart
    const layoutRef = useRef(layout);

    useEffect(() => {
        layoutRef.current = layout;
    }, [layout]);

    // One DOM ref per card — RAF mutates styles directly, bypassing React
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    // ── All animation state lives in refs (zero re-renders per frame) ─────────

    const globalAngle = useRef(0);
    const velocity = useRef(0);
    const isDragging = useRef(false);
    const isSnapping = useRef(false);
    const snapTarget = useRef(0);
    const rafHandle = useRef(0);
    const selectedIdRef = useRef<string | null>(null);

    const autoRotateRef = useRef(autoRotate);
    const rotSpeedRef = useRef(rotationSpeed);

    useEffect(() => {
        autoRotateRef.current = autoRotate;
    }, [autoRotate]);

    useEffect(() => {
        rotSpeedRef.current = rotationSpeed;
    }, [rotationSpeed]);

    // Drag tracking
    const dragStartX = useRef(0);
    const dragStartAngle = useRef(0);
    const lastDragX = useRef(0);
    const lastDragTime = useRef(0);
    const dragDistance = useRef(0);

    // ── React state — only for selection (not updated per frame) ──────────────

    const [selectedId, setSelectedId] = useState<string | null>(null);

    const setSelected = useCallback((id: string | null) => {
        selectedIdRef.current = id;
        setSelectedId(id);
    }, []);

    // ── RAF animation loop ────────────────────────────────────────────────────

    useEffect(() => {
        function tick() {
            // Advance the global rotation angle
            if (!isDragging.current) {
                if (isSnapping.current) {
                    const diff = snapTarget.current - globalAngle.current;

                    if (Math.abs(diff) < SNAP_THRESHOLD) {
                        globalAngle.current = snapTarget.current;
                        isSnapping.current = false;
                    } else {
                        globalAngle.current += diff * SNAP_SPEED;
                    }
                } else if (Math.abs(velocity.current) > 0.04) {
                    velocity.current *= INERTIA_DECAY;
                    globalAngle.current += velocity.current;
                } else {
                    velocity.current = 0;

                    if (autoRotateRef.current) {
                        globalAngle.current += rotSpeedRef.current;
                    }
                }
            }

            const cards = layoutRef.current;
            const ga = globalAngle.current;

            for (let i = 0; i < cards.length; i++) {
                const el = cardRefs.current[i];

                if (!el) {
                    continue;
                }

                const card = cards[i];
                const eff = ga + card.cardAngle;

                // Depth: purely from rotateY — cos(eff) in [-1, 1]
                // 1 = front-facing, -1 = back-facing
                const nz = Math.cos((eff * Math.PI) / 180);
                const t = (nz + 1) / 2; // remap to [0, 1]

                const isSel = card.item.id === selectedIdRef.current;

                // translateY(ringY) keeps cards on a fixed horizontal plane —
                // only rotateY changes, so there is zero vertical movement.
                el.style.transform = `translateY(${card.ringY}px) rotateY(${eff}deg) translateZ(${card.radius}px)`;
                el.style.opacity = isSel ? '1' : (0.22 + 0.78 * t).toFixed(2);

                const blurPx = isSel ? 0 : 3.5 * (1 - t);
                el.style.filter =
                    blurPx < 0.08 ? 'none' : `blur(${blurPx.toFixed(1)}px)`;

                // Disable pointer events on cards that are nearly back-facing
                el.style.pointerEvents = t < 0.08 ? 'none' : 'auto';
            }

            rafHandle.current = requestAnimationFrame(tick);
        }

        rafHandle.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafHandle.current);
    }, []); // runs once — everything accessed via refs

    // ── Snap helpers ──────────────────────────────────────────────────────────

    const snapCardToFront = useCallback((card: CardLayout) => {
        const eff =
            (((globalAngle.current + card.cardAngle) % 360) + 360) % 360;
        const adj = eff <= 180 ? -eff : 360 - eff;
        snapTarget.current = globalAngle.current + adj;
        isSnapping.current = true;
    }, []);

    const snapToNearest = useCallback(() => {
        let bestCard: CardLayout | null = null;
        let bestDiff = Infinity;

        for (const card of layoutRef.current) {
            const eff =
                (((globalAngle.current + card.cardAngle) % 360) + 360) % 360;
            const diff = Math.min(eff, 360 - eff);

            if (diff < bestDiff) {
                bestDiff = diff;
                bestCard = card;
            }
        }

        if (bestCard) {
            snapCardToFront(bestCard);
        }
    }, [snapCardToFront]);

    // ── Pointer handlers ──────────────────────────────────────────────────────

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            isDragging.current = true;
            isSnapping.current = false;
            velocity.current = 0;
            dragDistance.current = 0;
            dragStartX.current = e.clientX;
            dragStartAngle.current = globalAngle.current;
            lastDragX.current = e.clientX;
            lastDragTime.current = performance.now();
            e.currentTarget.setPointerCapture(e.pointerId);
        },
        [],
    );

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) {
            return;
        }

        const dx = e.clientX - dragStartX.current;
        dragDistance.current = Math.abs(dx);

        // Negate dx: drag-left shrinks angle → rotates globe left (intuitive)
        globalAngle.current = dragStartAngle.current - dx * DRAG_SENSITIVITY;

        const now = performance.now();
        const dt = now - lastDragTime.current;

        if (dt > 0) {
            velocity.current =
                -((e.clientX - lastDragX.current) / dt) * 16 * DRAG_SENSITIVITY;
        }

        lastDragX.current = e.clientX;
        lastDragTime.current = now;
    }, []);

    const onPointerUp = useCallback(() => {
        if (!isDragging.current) {
            return;
        }

        isDragging.current = false;
        snapToNearest();
    }, [snapToNearest]);

    // ── Keyboard navigation ───────────────────────────────────────────────────

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                isSnapping.current = false;
                velocity.current = -9;
            } else if (e.key === 'ArrowRight') {
                isSnapping.current = false;
                velocity.current = 9;
            }
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ── Card click — snap to front + toggle selection ─────────────────────────

    const handleCardClick = useCallback(
        (card: CardLayout, e: React.MouseEvent) => {
            e.stopPropagation();

            // Treat any movement >8px as a drag, not a click
            if (dragDistance.current > 8) {
                return;
            }

            const newId =
                selectedIdRef.current === card.item.id ? null : card.item.id;
            setSelected(newId);

            if (newId) {
                // Rotate the globe so this card faces forward
                snapCardToFront(card);
                onSelect?.(card.item);
            }
        },
        [onSelect, setSelected, snapCardToFront],
    );

    // ── Render ────────────────────────────────────────────────────────────────

    const { cardW, cardH, perspective } = sizeConfig;

    return (
        <div
            className="relative flex w-full cursor-grab items-center justify-center overflow-hidden select-none active:cursor-grabbing"
            style={{
                height: isMobile ? (isSmall ? '360px' : '440px') : '560px',
                perspective: `${perspective}px`,
                touchAction: 'none',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
        >
            {/* Ambient depth glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(124,58,237,0.09) 0%, rgba(6,182,212,0.05) 45%, transparent 70%)',
                }}
            />

            {/* 3D root — zero-size point from which all cards expand */}
            <div style={{ width: 0, height: 0, transformStyle: 'preserve-3d' }}>
                {layout.map((card, i) => (
                    <div
                        key={card.item.id}
                        ref={(el) => {
                            cardRefs.current[i] = el;
                        }}
                        style={{
                            position: 'absolute',
                            left: -(cardW / 2),
                            top: -(cardH / 2),
                            width: cardW,
                            height: cardH,
                            // Initial transform — overwritten by RAF each frame
                            transform: `translateY(${card.ringY}px) rotateY(${card.cardAngle}deg) translateZ(${card.radius}px)`,
                            cursor: 'pointer',
                            willChange: 'transform, opacity, filter',
                        }}
                        onClick={(e) => handleCardClick(card, e)}
                    >
                        {/*
                         * Inner div — handles selection visuals via React state.
                         * Kept separate from the RAF-driven outer div so animation
                         * never triggers React re-renders.
                         */}
                        <div
                            className="h-full w-full overflow-hidden rounded-xl border border-white/10"
                            style={{
                                transform:
                                    selectedId === card.item.id
                                        ? 'scale(1.1)'
                                        : 'scale(1)',
                                transition:
                                    'transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease',
                                boxShadow:
                                    selectedId === card.item.id
                                        ? '0 0 0 2px rgba(167,139,250,0.85), 0 20px 60px -10px rgba(0,0,0,0.7)'
                                        : '0 8px 32px -8px rgba(0,0,0,0.5)',
                            }}
                        >
                            <img
                                src={card.item.image}
                                alt={card.item.title}
                                loading="lazy"
                                draggable={false}
                                className={[
                                    'h-full w-full object-cover transition-[filter] duration-300',
                                    selectedId === card.item.id
                                        ? ''
                                        : 'grayscale',
                                ].join(' ')}
                            />

                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pt-5 pb-2 sm:px-3 sm:pb-3">
                                {card.item.category ? (
                                    <p className="mb-0.5 truncate text-[8px] font-bold tracking-widest text-white/50 uppercase sm:text-[9px]">
                                        {card.item.category}
                                    </p>
                                ) : null}
                                <p className="truncate text-[10px] font-semibold text-white sm:text-xs">
                                    {card.item.title}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1.5 text-xs whitespace-nowrap text-white/40 backdrop-blur-sm">
                Drag to rotate &nbsp;·&nbsp; Click a card to focus &nbsp;·&nbsp;
                ← →
            </p>
        </div>
    );
}
