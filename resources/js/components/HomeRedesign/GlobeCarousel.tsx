import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useLenis } from '@/hooks/useLenis';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// ── Public types ──────────────────────────────────────────────────────────────

export interface GlobeItem {
    id: string;
    title: string;
    image: string;
    category?: string;
    description?: string;
    tags?: string[];
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

// ── Lightbox types ────────────────────────────────────────────────────────────

interface LightboxState {
    item: GlobeItem;
    /** card center X on the viewport (from getBoundingClientRect) */
    cardCX: number;
    /** card center Y on the viewport */
    cardCY: number;
    cardW: number;
    cardH: number;
}

/** opening → open → closing → (null / unmounted) */
type LightboxPhase = 'opening' | 'open' | 'closing';

// ── Layout math ───────────────────────────────────────────────────────────────

const RING_WEIGHTS = [0.28, 0.44, 0.28];
const RING_STAGGER = [22, 0, 22];

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

    const layoutRef = useRef(layout);
    useEffect(() => {
        layoutRef.current = layout;
    }, [layout]);

    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    // ── All animation state lives in refs (zero re-renders per frame) ─────────

    const globalAngle = useRef(0);
    const velocity = useRef(0);
    const isDragging = useRef(false);
    const isSnapping = useRef(false);
    const snapTarget = useRef(0);
    const rafHandle = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedIdRef = useRef<string | null>(null);
    const lightboxOpenRef = useRef(false); // pauses auto-rotate while modal is open

    const lenis = useLenis();
    const lenisRef = useRef(lenis);
    useEffect(() => {
        lenisRef.current = lenis;
    }, [lenis]);

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
    const pointerDownTarget = useRef<EventTarget | null>(null);

    // ── React state ───────────────────────────────────────────────────────────

    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Lightbox phase ref — kept in sync with state so stable callbacks can read it
    const [lbPhase, setLbPhase] = useState<LightboxPhase>('opening');
    const lbPhaseRef = useRef<LightboxPhase>('opening');
    useEffect(() => {
        lbPhaseRef.current = lbPhase;
    }, [lbPhase]);

    const [lightbox, setLightbox] = useState<LightboxState | null>(null);

    const setSelected = useCallback((id: string | null) => {
        selectedIdRef.current = id;
        setSelectedId(id);
    }, []);

    // ── Scroll lock cleanup on unmount ────────────────────────────────────────

    useEffect(
        () => () => {
            lenisRef.current?.start();
        },
        [],
    );

    // ── RAF animation loop ────────────────────────────────────────────────────

    useEffect(() => {
        function tick() {
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

                    // Pause auto-rotate while lightbox is open
                    if (autoRotateRef.current && !lightboxOpenRef.current) {
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
                const nz = Math.cos((eff * Math.PI) / 180);
                const t = (nz + 1) / 2;
                const isSel = card.item.id === selectedIdRef.current;

                el.style.transform = `translateY(${card.ringY}px) rotateY(${eff}deg) translateZ(${card.radius}px)`;
                el.style.opacity = isSel ? '1' : (0.22 + 0.78 * t).toFixed(2);
                el.style.pointerEvents = t < 0.08 ? 'none' : 'auto';
            }

            rafHandle.current = requestAnimationFrame(tick);
        }

        function pause() {
            cancelAnimationFrame(rafHandle.current);
            rafHandle.current = 0;
        }
        function resume() {
            if (!rafHandle.current) {
                rafHandle.current = requestAnimationFrame(tick);
            }
        }

        rafHandle.current = requestAnimationFrame(tick);

        const onVisibility = () =>
            document.visibilityState === 'hidden' ? pause() : resume();
        document.addEventListener('visibilitychange', onVisibility);

        const obs = new IntersectionObserver(
            ([entry]) => (entry.isIntersecting ? resume() : pause()),
            { threshold: 0.01 },
        );

        if (containerRef.current) {
            obs.observe(containerRef.current);
        }

        return () => {
            cancelAnimationFrame(rafHandle.current);
            document.removeEventListener('visibilitychange', onVisibility);
            obs.disconnect();
        };
    }, []);

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

    // ── Lightbox open / close ─────────────────────────────────────────────────

    /**
     * Stable close handler — reads phase via ref so it never goes stale in
     * event listeners without needing to re-register them.
     */
    const closeLightbox = useCallback(() => {
        if (lbPhaseRef.current === 'open') {
            setLbPhase('closing');
        } else {
            // Not yet fully open — dismiss immediately without animation
            setLightbox(null);
            selectedIdRef.current = null;
            setSelectedId(null);
            lightboxOpenRef.current = false;
            lenisRef.current?.start();
        }
    }, []);

    /**
     * After the opening state is painted (opacity 0, at card position),
     * advance to 'open' on the next double-RAF so the browser has committed
     * the starting frame and the CSS transition fires correctly.
     */
    useEffect(() => {
        if (lbPhase === 'opening' && lightbox) {
            const id = requestAnimationFrame(() =>
                requestAnimationFrame(() => setLbPhase('open')),
            );

            return () => cancelAnimationFrame(id);
        }
    }, [lbPhase, lightbox]);

    /**
     * Called by onTransitionEnd on the modal card.
     * When the closing animation finishes, tear down the lightbox.
     */
    const onModalTransitionEnd = useCallback((e: React.TransitionEvent) => {
        // Only act on the 'transform' property to avoid double-firing
        if (e.propertyName !== 'transform') {
            return;
        }

        if (lbPhaseRef.current === 'closing') {
            setLightbox(null);
            selectedIdRef.current = null;
            setSelectedId(null);
            lightboxOpenRef.current = false;
            lenisRef.current?.start();
        }
    }, []);

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
            pointerDownTarget.current = e.target;
            // setPointerCapture routes pointermove/pointerup here even when the
            // cursor leaves this element — but it also means the browser fires
            // the synthetic `click` on *this* container, not the child card.
            // We therefore resolve click intent ourselves in onPointerUp instead.
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

        // Small movement → treat as a tap/click.
        // setPointerCapture redirects the browser's synthetic `click` event
        // to the container, so we resolve the target ourselves here instead.
        if (dragDistance.current <= 8) {
            let el = pointerDownTarget.current as HTMLElement | null;

            while (el) {
                const idx = cardRefs.current.indexOf(el as HTMLDivElement);

                if (idx !== -1) {
                    const card = layoutRef.current[idx];
                    const cardEl = cardRefs.current[idx];

                    if (card && cardEl) {
                        // Capture the card's viewport rect before any state changes
                        const rect = cardEl.getBoundingClientRect();
                        setLightbox({
                            item: card.item,
                            cardCX: rect.left + rect.width / 2,
                            cardCY: rect.top + rect.height / 2,
                            cardW: rect.width,
                            cardH: rect.height,
                        });
                        setLbPhase('opening');
                        lightboxOpenRef.current = true;
                        lenisRef.current?.stop();

                        setSelected(card.item.id);
                        snapCardToFront(card);
                        onSelect?.(card.item);
                    }

                    break;
                }

                el = el.parentElement;
            }

            pointerDownTarget.current = null;

            return;
        }

        pointerDownTarget.current = null;
        snapToNearest();
    }, [snapToNearest, setSelected, snapCardToFront, onSelect]);

    // ── Keyboard navigation ───────────────────────────────────────────────────

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                isSnapping.current = false;
                velocity.current = -9;
            } else if (e.key === 'ArrowRight') {
                isSnapping.current = false;
                velocity.current = 9;
            } else if (e.key === 'Escape') {
                closeLightbox();
            }
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [closeLightbox]);

    // ── Lightbox transform math ───────────────────────────────────────────────
    //
    // The modal lives in a portal: position:fixed, full-viewport flex container,
    // items centered.  In the 'open' phase it has no additional transform — it
    // sits at the visual center of the screen.  In 'opening'/'closing' we apply
    // a translate+scale so it visually matches the card's screen position.
    //
    //   dx   = card center X  −  screen center X
    //   dy   = card center Y  −  screen center Y
    //   scaleX = card width   /  modal width
    //   scaleY = card height  /  modal height
    //
    // MODAL_INFO_H is an estimate; the animation looks correct even with a small
    // discrepancy because the scale-origin (center) hides mismatches.

    const MODAL_W = Math.min(window.innerWidth * 0.9, 640);
    const MODAL_INFO_H = 116; // category + title + padding (approximate)
    const MODAL_H = MODAL_W * (9 / 16) + MODAL_INFO_H;

    const screenCX = window.innerWidth / 2;
    const screenCY = window.innerHeight / 2;

    const startDX = lightbox ? lightbox.cardCX - screenCX : 0;
    const startDY = lightbox ? lightbox.cardCY - screenCY : 0;
    const startSX = lightbox ? lightbox.cardW / MODAL_W : 1;
    const startSY = lightbox ? lightbox.cardH / MODAL_H : 1;

    const atCard = lbPhase === 'opening' || lbPhase === 'closing';
    const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const DURATION = '1.1s';

    const modalTransform = atCard
        ? `translate(${startDX}px, ${startDY}px) scale(${startSX}, ${startSY})`
        : 'translate(0px, 0px) scale(1)';
    // No opacity change on the modal — only transform animates so the expansion
    // is clearly visible throughout. Backdrop fades separately.
    const modalTransition =
        lbPhase === 'opening'
            ? 'none' // paint at card position instantly
            : `transform ${DURATION} ${EASING}`; // then animate to/from center
    const backdropOpacity = lbPhase === 'open' ? 1 : 0;

    // ── Render ────────────────────────────────────────────────────────────────

    const { cardW, cardH, perspective } = sizeConfig;

    return (
        <>
            <div
                ref={containerRef}
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
                <div
                    style={{
                        width: 0,
                        height: 0,
                        transformStyle: 'preserve-3d',
                    }}
                >
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
                                transform: `translateY(${card.ringY}px) rotateY(${card.cardAngle}deg) translateZ(${card.radius}px)`,
                                cursor: 'pointer',
                                willChange: 'transform, opacity',
                            }}
                        >
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
                    Drag to rotate &nbsp;·&nbsp; Click a card to view
                    &nbsp;·&nbsp; ← →
                </p>
            </div>

            {/* ── Lightbox ────────────────────────────────────────────────────────
                Rendered via portal into document.body so it sits above every layout
                layer (navbar, chat buttons, etc.) and is not clipped by any
                overflow:hidden ancestor.
            ─────────────────────────────────────────────────────────────────── */}
            {lightbox &&
                createPortal(
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 99999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            // Pointer events on the wrapper handle backdrop clicks.
                            // The modal card stops propagation so its clicks don't close.
                        }}
                        // Any pointer-down that isn't stopped by the modal card bubbles here → close.
                        onPointerDown={closeLightbox}
                    >
                        {/* Dimmed + blurred backdrop */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0, 0, 0, 0.88)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                opacity: backdropOpacity,
                                transition: `opacity 0.55s ease`,
                            }}
                        />

                        {/* Modal card — transforms animate it from/to the card's screen position */}
                        <div
                            style={{
                                position: 'relative',
                                width: MODAL_W,
                                maxWidth: '90vw',
                                borderRadius: 16,
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.12)',
                                boxShadow:
                                    '0 40px 120px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)',
                                transform: modalTransform,
                                transition: modalTransition,
                                transformOrigin: 'center center',
                                willChange: 'transform',
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onTransitionEnd={onModalTransitionEnd}
                        >
                            {/* Close button */}
                            <button
                                type="button"
                                aria-label="Close"
                                style={{
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                    zIndex: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.65)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: 'rgba(255,255,255,0.75)',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(4px)',
                                    transition: 'background 0.2s, color 0.2s',
                                }}
                                onPointerEnter={(e) => {
                                    (
                                        e.currentTarget as HTMLButtonElement
                                    ).style.background =
                                        'rgba(255,255,255,0.15)';
                                    (
                                        e.currentTarget as HTMLButtonElement
                                    ).style.color = '#fff';
                                }}
                                onPointerLeave={(e) => {
                                    (
                                        e.currentTarget as HTMLButtonElement
                                    ).style.background = 'rgba(0,0,0,0.65)';
                                    (
                                        e.currentTarget as HTMLButtonElement
                                    ).style.color = 'rgba(255,255,255,0.75)';
                                }}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    closeLightbox();
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>

                            {/* Image */}
                            <div
                                style={{
                                    position: 'relative',
                                    aspectRatio: '16/9',
                                    overflow: 'hidden',
                                    background: '#000',
                                }}
                            >
                                <img
                                    src={lightbox.item.image.replace(
                                        'w=500',
                                        'w=1200',
                                    )}
                                    alt={lightbox.item.title}
                                    draggable={false}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background:
                                            'linear-gradient(to top, rgba(13,13,15,0.8) 0%, transparent 50%)',
                                    }}
                                />
                            </div>

                            {/* Info panel */}
                            <div
                                style={{
                                    background: '#0d0d0f',
                                    padding: '20px 24px 24px',
                                }}
                            >
                                {lightbox.item.category && (
                                    <p
                                        style={{
                                            margin: '0 0 6px',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                            color: 'rgb(167,139,250)',
                                        }}
                                    >
                                        {lightbox.item.category}
                                    </p>
                                )}
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: '#fff',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {lightbox.item.title}
                                </h3>
                                {lightbox.item.description && (
                                    <p
                                        style={{
                                            margin: '10px 0 0',
                                            fontSize: 14,
                                            lineHeight: 1.6,
                                            color: 'rgba(255,255,255,0.55)',
                                        }}
                                    >
                                        {lightbox.item.description}
                                    </p>
                                )}
                                {lightbox.item.tags &&
                                    lightbox.item.tags.length > 0 && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 8,
                                                marginTop: 14,
                                            }}
                                        >
                                            {lightbox.item.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    style={{
                                                        padding: '4px 12px',
                                                        borderRadius: 999,
                                                        background:
                                                            'rgba(255,255,255,0.08)',
                                                        fontSize: 12,
                                                        color: 'rgba(255,255,255,0.55)',
                                                    }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
