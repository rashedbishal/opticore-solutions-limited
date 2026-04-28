import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';

interface CardDef {
    id: number;
    src: string;
    category: string;
    label: string;
    /** canvas position as a fraction 0–1 of canvas dimensions */
    cx: number;
    cy: number;
    /** base card width in px at desktop (1×) scale */
    cw: number;
}

const CARDS: CardDef[] = [
    // ── Center cluster — visible on initial load ──────────────────────────────
    {
        id: 1,
        cx: 0.31,
        cy: 0.32,
        cw: 380,
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800',
        category: 'Brand Identity',
        label: 'Visual Branding',
    },
    {
        id: 2,
        cx: 0.46,
        cy: 0.29,
        cw: 320,
        src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800',
        category: 'Motion Design',
        label: 'Motion Graphics',
    },
    {
        id: 3,
        cx: 0.6,
        cy: 0.33,
        cw: 360,
        src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800',
        category: 'Web Design',
        label: 'Digital Experiences',
    },
    {
        id: 4,
        cx: 0.36,
        cy: 0.54,
        cw: 400,
        src: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800',
        category: '3D Production',
        label: '3D Visuals',
    },
    {
        id: 5,
        cx: 0.56,
        cy: 0.52,
        cw: 340,
        src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800',
        category: 'Photography',
        label: 'Creative Photography',
    },

    // ── Left edge — pan left to discover ─────────────────────────────────────
    {
        id: 6,
        cx: 0.03,
        cy: 0.16,
        cw: 350,
        src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800',
        category: 'Graphic Design',
        label: 'Print & Digital',
    },
    {
        id: 7,
        cx: 0.06,
        cy: 0.44,
        cw: 380,
        src: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=800',
        category: 'UI / UX Design',
        label: 'User Interfaces',
    },
    {
        id: 8,
        cx: 0.09,
        cy: 0.7,
        cw: 320,
        src: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=800',
        category: 'Illustration',
        label: 'Custom Artwork',
    },

    // ── Right edge — pan right to discover ───────────────────────────────────
    {
        id: 9,
        cx: 0.83,
        cy: 0.14,
        cw: 400,
        src: 'https://images.unsplash.com/photo-1536240478700-b869ad10e128?q=80&w=800',
        category: 'Video Editing',
        label: 'Video Production',
    },
    {
        id: 10,
        cx: 0.86,
        cy: 0.42,
        cw: 360,
        src: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=800',
        category: 'Social Media',
        label: 'Content Creation',
    },
    {
        id: 11,
        cx: 0.81,
        cy: 0.67,
        cw: 340,
        src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800',
        category: 'Marketing',
        label: 'Digital Marketing',
    },

    // ── Top edge — pan up to discover ────────────────────────────────────────
    {
        id: 12,
        cx: 0.19,
        cy: 0.04,
        cw: 360,
        src: 'https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?q=80&w=800',
        category: 'Branding',
        label: 'Brand Strategy',
    },
    {
        id: 13,
        cx: 0.5,
        cy: 0.05,
        cw: 400,
        src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800',
        category: 'Web Development',
        label: 'Full-Stack Apps',
    },

    // ── Bottom edge — pan down to discover ───────────────────────────────────
    {
        id: 14,
        cx: 0.71,
        cy: 0.8,
        cw: 350,
        src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800',
        category: 'E-commerce',
        label: 'Online Stores',
    },
    {
        id: 15,
        cx: 0.34,
        cy: 0.82,
        cw: 320,
        src: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=800',
        category: 'SEO & Growth',
        label: 'Traffic & Conversions',
    },
];

function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

export default function NebulaCluster() {
    const containerRef = useRef<HTMLDivElement>(null);

    const isMobile = useMediaQuery('(max-width: 767px)');
    const isTablet = useMediaQuery('(max-width: 1023px)');
    const isDesktop = !isTablet;

    // Virtual canvas dimensions & card scale per breakpoint
    const canvasW = isMobile ? 1800 : isTablet ? 2400 : 3000;
    const canvasH = isMobile ? 2400 : isTablet ? 1600 : 2000;
    const cardScale = isMobile ? 0.46 : isTablet ? 0.65 : 1;

    // Pan position motion values
    const panX = useMotionValue(0);
    const panY = useMotionValue(0);

    // 3D tilt (desktop only)
    const rawTX = useMotionValue(0);
    const rawTY = useMotionValue(0);
    const tiltX = useSpring(rawTX, { damping: 32, stiffness: 180 });
    const tiltY = useSpring(rawTY, { damping: 32, stiffness: 180 });

    // Refs shared across event handlers / RAF without triggering re-renders
    const isDragging = useRef(false);
    const isInside = useRef(false);
    const cursor = useRef({ x: 0.5, y: 0.5 });
    const dragAnchor = useRef({ mx: 0, my: 0, px: 0, py: 0 });
    const touchAnchor = useRef({ tx: 0, ty: 0, px: 0, py: 0 });

    const getBounds = useCallback(() => {
        const el = containerRef.current;

        if (!el) {
            return { minX: 0, minY: 0 };
        }

        return {
            minX: -(canvasW - el.offsetWidth),
            minY: -(canvasH - el.offsetHeight),
        };
    }, [canvasW, canvasH]);

    // Re-centre the canvas whenever breakpoint or canvas dimensions change
    useEffect(() => {
        const el = containerRef.current;

        if (!el) {
            return;
        }

        const { minX, minY } = getBounds();
        panX.set(clamp(minX / 2, minX, 0));
        panY.set(clamp(minY / 2, minY, 0));
    }, [canvasW, canvasH, getBounds, panX, panY]);

    // Auto-drift on desktop — canvas slowly follows cursor lean outside a dead-zone
    useEffect(() => {
        if (!isDesktop) {
            return;
        }

        const SPEED = 2.4;
        const DEAD = 0.18;
        let rafId: number;

        const tick = () => {
            if (!isDragging.current && isInside.current) {
                const lx = cursor.current.x - 0.5;
                const ly = cursor.current.y - 0.5;
                const dx =
                    Math.abs(lx) > DEAD
                        ? (lx - Math.sign(lx) * DEAD) * SPEED
                        : 0;
                const dy =
                    Math.abs(ly) > DEAD
                        ? (ly - Math.sign(ly) * DEAD) * SPEED
                        : 0;
                const { minX, minY } = getBounds();
                panX.set(clamp(panX.get() - dx, minX, 0));
                panY.set(clamp(panY.get() - dy, minY, 0));
            }

            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafId);
    }, [isDesktop, getBounds, panX, panY]);

    // Non-passive touchmove so we can call preventDefault and block page scroll
    useEffect(() => {
        const el = containerRef.current;

        if (!el) {
            return;
        }

        const onTouchMove = (e: TouchEvent) => {
            if (!isDragging.current) {
                return;
            }

            e.preventDefault();
            const t = e.touches[0];
            const { minX, minY } = getBounds();
            panX.set(
                clamp(
                    touchAnchor.current.px + t.clientX - touchAnchor.current.tx,
                    minX,
                    0,
                ),
            );
            panY.set(
                clamp(
                    touchAnchor.current.py + t.clientY - touchAnchor.current.ty,
                    minY,
                    0,
                ),
            );
        };
        el.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => el.removeEventListener('touchmove', onTouchMove);
    }, [getBounds, panX, panY]);

    // ── Mouse handlers ────────────────────────────────────────────────────────

    const onMouseMove = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();

        if (!rect) {
            return;
        }

        const rx = (e.clientX - rect.left) / rect.width;
        const ry = (e.clientY - rect.top) / rect.height;
        cursor.current = { x: rx, y: ry };

        if (isDesktop) {
            rawTX.set((ry - 0.5) * -8);
            rawTY.set((rx - 0.5) * 8);
        }

        if (isDragging.current) {
            const { minX, minY } = getBounds();
            panX.set(
                clamp(
                    dragAnchor.current.px + e.clientX - dragAnchor.current.mx,
                    minX,
                    0,
                ),
            );
            panY.set(
                clamp(
                    dragAnchor.current.py + e.clientY - dragAnchor.current.my,
                    minY,
                    0,
                ),
            );
        }
    };

    const onMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        dragAnchor.current = {
            mx: e.clientX,
            my: e.clientY,
            px: panX.get(),
            py: panY.get(),
        };
    };

    const onMouseUp = () => {
        isDragging.current = false;
    };

    const onMouseEnter = () => {
        isInside.current = true;
    };

    const onMouseLeave = () => {
        isInside.current = false;
        isDragging.current = false;
        rawTX.set(0);
        rawTY.set(0);
    };

    // ── Touch handlers ────────────────────────────────────────────────────────

    const onTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];
        isDragging.current = true;
        touchAnchor.current = {
            tx: t.clientX,
            ty: t.clientY,
            px: panX.get(),
            py: panY.get(),
        };
    };

    const onTouchEnd = () => {
        isDragging.current = false;
    };

    return (
        <div
            ref={containerRef}
            className="relative h-screen w-full cursor-grab overflow-hidden select-none active:cursor-grabbing"
            style={{ perspective: '1200px' }}
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Background watermark */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <h2 className="text-7xl font-black tracking-tighter text-foreground uppercase opacity-5 md:text-9xl">
                    The Nebula
                </h2>
            </div>

            {/* Edge vignette — hints at content beyond the viewport */}
            <div
                className="pointer-events-none absolute inset-0 z-20"
                style={{
                    background:
                        'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.45) 100%)',
                }}
            />

            {/* Explore hint */}
            <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2">
                <span className="rounded-full bg-black/40 px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm">
                    {isMobile
                        ? '✦ Drag to explore'
                        : '✦ Hover or drag to explore'}
                </span>
            </div>

            {/* Virtual canvas */}
            <motion.div
                style={{
                    x: panX,
                    y: panY,
                    width: canvasW,
                    height: canvasH,
                    position: 'absolute',
                }}
            >
                {CARDS.map((card) => {
                    const w = Math.round(card.cw * cardScale);
                    const left = Math.round(card.cx * canvasW);
                    const top = Math.round(card.cy * canvasH);

                    return (
                        <motion.div
                            key={card.id}
                            style={{
                                left,
                                top,
                                width: w,
                                rotateX: tiltX,
                                rotateY: tiltY,
                            }}
                            className="preserve-3d absolute aspect-[4/3] overflow-hidden rounded-2xl border border-theme shadow-2xl"
                            whileHover={{
                                scale: 1.06,
                                z: 40,
                                borderColor: 'var(--color-accent)',
                                transition: { duration: 0.2 },
                            }}
                        >
                            <img
                                src={card.src}
                                alt={card.label}
                                loading="lazy"
                                draggable={false}
                                className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-3 sm:px-4">
                                <p className="text-[9px] font-bold tracking-widest text-white/50 uppercase sm:text-[10px]">
                                    {card.category}
                                </p>
                                <p className="text-xs font-semibold text-white sm:text-sm">
                                    {card.label}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
