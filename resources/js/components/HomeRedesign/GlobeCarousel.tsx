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

// ── Layout types & math ───────────────────────────────────────────────────────

interface SizeConfig {
    midRadius: number;
    sideRadius: number;
    cardW: number;
    cardH: number;
    perspective: number;
}

interface CardLayout {
    item: GlobeItem;
    cardAngle: number; // initial angle in ring (degrees)
    ringTilt: number; // ring's rotateX (degrees)
    radius: number; // translateZ distance (px)
}

const RING_DEFS = [
    { tilt: -38, weightFraction: 0.28, offset: 22 }, // top — staggered by 22°
    { tilt: 0, weightFraction: 0.44, offset: 0 }, // middle — equator
    { tilt: 38, weightFraction: 0.28, offset: 22 }, // bottom — staggered by 22°
];

function computeLayout(items: GlobeItem[], cfg: SizeConfig): CardLayout[] {
    const n = items.length;

    if (n === 0) {
        return [];
    }

    const midCount = Math.round(n * RING_DEFS[1].weightFraction);
    const topCount = Math.round(n * RING_DEFS[0].weightFraction);
    const botCount = n - midCount - topCount;
    const counts = [topCount, midCount, botCount];
    const radii = [cfg.sideRadius, cfg.midRadius, cfg.sideRadius];

    const result: CardLayout[] = [];
    let idx = 0;

    RING_DEFS.forEach((ring, ri) => {
        const count = counts[ri];
        const step = count > 1 ? 360 / count : 0;

        for (let i = 0; i < count && idx < n; i++, idx++) {
            result.push({
                item: items[idx],
                cardAngle: ring.offset + step * i,
                ringTilt: ring.tilt,
                radius: radii[ri],
            });
        }
    });

    return result;
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

    // Responsive sizing — card dimensions, radii, and perspective depth
    const sizeConfig = useMemo<SizeConfig>(() => {
        if (isSmall) {
            return {
                midRadius: 185,
                sideRadius: 148,
                cardW: 115,
                cardH: 84,
                perspective: 480,
            };
        }

        if (isMobile) {
            return {
                midRadius: 270,
                sideRadius: 215,
                cardW: 148,
                cardH: 108,
                perspective: 640,
            };
        }

        return {
            midRadius: 500,
            sideRadius: 385,
            cardW: 205,
            cardH: 150,
            perspective: 980,
        };
    }, [isSmall, isMobile]);

    const layout = useMemo(
        () => computeLayout(items, sizeConfig),
        [items, sizeConfig],
    );

    // Keep refs to layout & size so the RAF loop always reads latest values
    // without needing to recreate the animation callback on every resize.
    const layoutRef = useRef(layout);
    const sizeRef = useRef(sizeConfig);
    useEffect(() => {
        layoutRef.current = layout;
    }, [layout]);
    useEffect(() => {
        sizeRef.current = sizeConfig;
    }, [sizeConfig]);

    // DOM refs — outer card divs receive direct style mutations each frame
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    // ── Animation state (all refs → no re-renders during animation) ───────────

    const globalAngle = useRef(0);
    const velocity = useRef(0);
    const isDragging = useRef(false);
    const isSnapping = useRef(false);
    const snapTarget = useRef(0);
    const rafHandle = useRef(0);
    const selectedIdRef = useRef<string | null>(null);

    // Props as refs so RAF reads latest without needing effect cleanup
    const autoRotateRef = useRef(autoRotate);
    const rotSpeedRef = useRef(rotationSpeed);
    useEffect(() => {
        autoRotateRef.current = autoRotate;
    }, [autoRotate]);
    useEffect(() => {
        rotSpeedRef.current = rotationSpeed;
    }, [rotationSpeed]);

    // ── Drag tracking ─────────────────────────────────────────────────────────

    const dragStartX = useRef(0);
    const dragStartAngle = useRef(0);
    const lastDragX = useRef(0);
    const lastDragTime = useRef(0);
    const dragDistance = useRef(0);

    // ── React state (only selection — not updated per frame) ──────────────────

    const [selectedId, setSelectedId] = useState<string | null>(null);

    const setSelected = useCallback((id: string | null) => {
        selectedIdRef.current = id;
        setSelectedId(id);
    }, []);

    // ── Core RAF animation loop ───────────────────────────────────────────────
    // Defined inside useEffect so the self-recursive call avoids stale-closure
    // issues and satisfies the react-hooks/exhaustive-deps rule.

    useEffect(() => {
        function tick() {
            // 1. Advance global angle
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

            // 2. Update each card's transform + depth visuals directly in the DOM
            const cards = layoutRef.current;
            const ga = globalAngle.current;

            for (let i = 0; i < cards.length; i++) {
                const el = cardRefs.current[i];

                if (!el) {
                    continue;
                }

                const card = cards[i];
                const eff = ga + card.cardAngle;

                // Normalized Z depth: 1 = front, -1 = back
                const nz =
                    Math.cos((eff * Math.PI) / 180) *
                    Math.cos((card.ringTilt * Math.PI) / 180);
                const t = (nz + 1) / 2; // remap to [0, 1]

                const isSel = card.item.id === selectedIdRef.current;

                el.style.transform = `rotateX(${card.ringTilt}deg) rotateY(${eff}deg) translateZ(${card.radius}px)`;
                el.style.opacity = isSel ? '1' : (0.18 + 0.82 * t).toFixed(2);
                el.style.zIndex = String(Math.round(t * 200));

                const blurPx = isSel ? 0 : 4 * (1 - t);
                el.style.filter =
                    blurPx < 0.08 ? 'none' : `blur(${blurPx.toFixed(1)}px)`;
            }

            rafHandle.current = requestAnimationFrame(tick);
        }

        rafHandle.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafHandle.current);
    }, []); // runs once — all state accessed via refs

    // ── Snap to nearest front-facing card ─────────────────────────────────────

    const snapToNearest = useCallback(() => {
        const cards = layoutRef.current;
        let bestCard: CardLayout | null = null;
        let bestDiff = Infinity;

        for (const card of cards) {
            const eff =
                (((globalAngle.current + card.cardAngle) % 360) + 360) % 360;
            const diff = Math.min(eff, 360 - eff);

            if (diff < bestDiff) {
                bestDiff = diff;
                bestCard = card;
            }
        }

        if (bestCard) {
            const eff =
                (((globalAngle.current + bestCard.cardAngle) % 360) + 360) %
                360;
            const adj = eff <= 180 ? -eff : 360 - eff;
            snapTarget.current = globalAngle.current + adj;
            isSnapping.current = true;
        }
    }, []);

    // ── Pointer event handlers ────────────────────────────────────────────────

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
        globalAngle.current = dragStartAngle.current + dx * DRAG_SENSITIVITY;

        const now = performance.now();
        const dt = now - lastDragTime.current;

        if (dt > 0) {
            // Scale velocity to ~16ms frame time so inertia feels consistent at any fps
            velocity.current =
                ((e.clientX - lastDragX.current) / dt) * 16 * DRAG_SENSITIVITY;
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

    // ── Card click ────────────────────────────────────────────────────────────

    const handleCardClick = useCallback(
        (card: CardLayout, e: React.MouseEvent) => {
            e.stopPropagation();

            // Ignore clicks that were actually drag gestures
            if (dragDistance.current > 8) {
                return;
            }

            const newId =
                selectedIdRef.current === card.item.id ? null : card.item.id;
            setSelected(newId);

            if (newId) {
                onSelect?.(card.item);
            }
        },
        [onSelect, setSelected],
    );

    // ── Render ────────────────────────────────────────────────────────────────

    const { cardW, cardH, perspective } = sizeConfig;

    return (
        <div
            className="relative flex w-full cursor-grab items-center justify-center overflow-hidden select-none active:cursor-grabbing"
            style={{
                height: isMobile ? (isSmall ? '380px' : '460px') : '600px',
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
                        'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(124,58,237,0.10) 0%, rgba(6,182,212,0.06) 40%, transparent 70%)',
                }}
            />

            {/* Equator ring hint */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5"
                style={{
                    width: sizeConfig.midRadius * 2 + cardW,
                    height: sizeConfig.midRadius * 2 + cardH,
                }}
            />

            {/* 3D preserve-3d root — zero-size so cards expand from center */}
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
                            transform: `rotateX(${card.ringTilt}deg) rotateY(${card.cardAngle}deg) translateZ(${card.radius}px)`,
                            transformStyle: 'preserve-3d',
                            cursor: 'pointer',
                            willChange: 'transform, opacity, filter',
                        }}
                        onClick={(e) => handleCardClick(card, e)}
                    >
                        {/*
                         * Inner div handles selection scale + shadow via CSS transition.
                         * It is intentionally separate from the outer RAF-driven div so
                         * that React state (selectedId) only touches this layer.
                         */}
                        <div
                            className="h-full w-full overflow-hidden rounded-xl border border-white/10"
                            style={{
                                transform:
                                    selectedId === card.item.id
                                        ? 'scale(1.12)'
                                        : 'scale(1)',
                                transition:
                                    'transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease',
                                boxShadow:
                                    selectedId === card.item.id
                                        ? '0 0 0 2px rgba(167,139,250,0.9), 0 20px 60px -10px rgba(0,0,0,0.7)'
                                        : '0 8px 40px -10px rgba(0,0,0,0.5)',
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
                                        ? 'grayscale-0'
                                        : 'grayscale',
                                ].join(' ')}
                            />

                            {/* Bottom label */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pt-6 pb-2 sm:px-3 sm:pb-3">
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

            {/* Keyboard / drag hint */}
            <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1.5 text-center text-xs text-white/40 backdrop-blur-sm">
                Drag to rotate &nbsp;·&nbsp; ← → to step
            </p>
        </div>
    );
}
