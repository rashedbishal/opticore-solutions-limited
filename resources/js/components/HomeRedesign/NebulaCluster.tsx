import { Link } from '@inertiajs/react';
import {
    AnimatePresence,
    motion,
    useMotionValue,
    useSpring,
    useTransform,
} from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import GradientOrb from '@/components/UI/GradientOrb';
import { useLenis } from '@/hooks/useLenis';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTheme } from '@/hooks/useTheme';

export interface FloatingCardData {
    id: number;
    category: string;
    title: string;
    description: string;
    image: string;
    thumb: string;
    href: string;
}

interface NebulaEntry {
    id: number;
    category: string;
    title: string;
    description: string;
    src: string;
    thumb: string;
    left: string;
    top: string;
    depth: number;
    isCenter: boolean;
    href: string;
}

interface CardPosition {
    left: string;
    top: string;
    depth: number;
    isCenter: boolean;
}

function computeCardPositions(n: number): CardPosition[] {
    if (n === 0) {
        return [];
    }

    if (n === 1) {
        return [{ left: '50%', top: '50%', depth: 0.8, isCenter: true }];
    }

    if (n === 2) {
        return [
            { left: '30%', top: '50%', depth: 1.6, isCenter: false },
            { left: '70%', top: '50%', depth: 1.8, isCenter: false },
        ];
    }

    if (n === 3) {
        return [
            { left: '50%', top: '28%', depth: 1.6, isCenter: false },
            { left: '25%', top: '68%', depth: 1.8, isCenter: false },
            { left: '75%', top: '68%', depth: 2.0, isCenter: false },
        ];
    }

    if (n === 4) {
        return [
            { left: '27%', top: '27%', depth: 1.6, isCenter: false },
            { left: '73%', top: '27%', depth: 1.8, isCenter: false },
            { left: '27%', top: '73%', depth: 2.0, isCenter: false },
            { left: '73%', top: '73%', depth: 2.2, isCenter: false },
        ];
    }

    if (n === 5) {
        // Original 5-card layout preserved exactly
        return [
            { left: '50%', top: '50%', depth: 0.8, isCenter: true },
            { left: '23%', top: '26%', depth: 1.8, isCenter: false },
            { left: '77%', top: '26%', depth: 2.0, isCenter: false },
            { left: '23%', top: '73%', depth: 2.2, isCenter: false },
            { left: '77%', top: '72%', depth: 2.4, isCenter: false },
        ];
    }

    if (n === 6) {
        return [
            { left: '50%', top: '50%', depth: 0.8, isCenter: true },
            { left: '20%', top: '22%', depth: 1.8, isCenter: false },
            { left: '80%', top: '22%', depth: 2.0, isCenter: false },
            { left: '14%', top: '57%', depth: 2.1, isCenter: false },
            { left: '86%', top: '57%', depth: 2.2, isCenter: false },
            { left: '50%', top: '80%', depth: 2.3, isCenter: false },
        ];
    }

    // 7+ cards: center + surrounding on an ellipse
    const positions: CardPosition[] = [
        { left: '50%', top: '50%', depth: 0.8, isCenter: true },
    ];
    const surrounding = n - 1;
    const rx = 30;
    const ry = 27;

    for (let i = 0; i < surrounding; i++) {
        const angle = (i / surrounding) * 2 * Math.PI - Math.PI / 2;
        const left = 50 + rx * Math.cos(angle);
        const top = 50 + ry * Math.sin(angle);
        positions.push({
            left: `${left.toFixed(1)}%`,
            top: `${top.toFixed(1)}%`,
            depth: 1.8 + i * 0.1,
            isCenter: false,
        });
    }

    return positions;
}

// ── Expand modal (portal, highest z-index, scroll-locked) ─────────────────────

// Stagger variants for content lines inside the modal
const modalContentVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.08, delayChildren: 0.22 },
    },
    exit: {
        transition: { staggerChildren: 0.04, staggerDirection: -1 },
    },
};

const modalLineVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, damping: 22, stiffness: 260 },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.12 } },
};

function ExpandModal({
    item,
    onClose,
}: {
    item: NebulaEntry | null;
    onClose: () => void;
}) {
    return createPortal(
        <AnimatePresence>
            {item && (
                // Scrim — fades in independently so the iris and blur aren't coupled
                <motion.div
                    key="nebula-modal-scrim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ zIndex: 99999 }}
                    className="site-typography fixed inset-0 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
                    onPointerDown={onClose}
                >
                    {/* Ambient violet glow behind the card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.4 }}
                        transition={{
                            duration: 0.55,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="pointer-events-none absolute h-[520px] w-[520px] rounded-full bg-violet-500/20 blur-3xl"
                    />

                    {/* Modal card — iris expand from center */}
                    <motion.div
                        key="nebula-modal-card"
                        initial={{
                            clipPath: 'inset(50% 50% 50% 50% round 24px)',
                            scale: 0.9,
                        }}
                        animate={{
                            clipPath: 'inset(0% 0% 0% 0% round 24px)',
                            scale: 1,
                        }}
                        exit={{
                            clipPath: 'inset(50% 50% 50% 50% round 24px)',
                            scale: 0.9,
                        }}
                        transition={{
                            type: 'spring',
                            damping: 26,
                            stiffness: 240,
                        }}
                        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950"
                        style={{
                            boxShadow:
                                '0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06), 0 0 80px rgba(124,58,237,0.18)',
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {/* Brand gradient top-edge line */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-500" />

                        {/* Decorative corner glows */}
                        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-violet-500/10 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-2xl" />

                        {/* Image — zooms from 110% to natural size as modal opens */}
                        <motion.div
                            className="relative aspect-video w-full overflow-hidden"
                            initial={{ scale: 1.12 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 1.06 }}
                            transition={{
                                duration: 0.55,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <img
                                src={item.src}
                                alt={item.title}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                                draggable={false}
                            />
                            {/* Gradient that fades the image into the card body */}
                            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        </motion.div>

                        {/* Staggered text content */}
                        <motion.div
                            className="relative z-10 -mt-8 px-7 pb-7"
                            variants={modalContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {/* Category pill badge */}
                            <motion.span
                                variants={modalLineVariants}
                                className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-violet-400 uppercase"
                            >
                                {item.category}
                            </motion.span>

                            <motion.h3
                                variants={modalLineVariants}
                                className="mt-3 text-2xl font-black tracking-tight text-white"
                            >
                                {item.title}
                            </motion.h3>

                            <motion.p
                                variants={modalLineVariants}
                                className="mt-3 text-sm leading-relaxed text-zinc-400"
                            >
                                {item.description}
                            </motion.p>

                            {/* Divider */}
                            <motion.div
                                variants={modalLineVariants}
                                className="my-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            />

                            {/* CTA */}
                            <motion.div
                                variants={modalLineVariants}
                                className="flex items-center justify-between"
                            >
                                <p className="text-xs text-zinc-600">
                                    Click outside to close
                                </p>
                                <Link
                                    href={item.href}
                                    className="neo-btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-105"
                                >
                                    Explore Portfolio
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* Close button — spins in with a delay */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.4, rotate: -45 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.4, rotate: 45 }}
                            transition={{
                                delay: 0.25,
                                type: 'spring',
                                damping: 18,
                                stiffness: 280,
                            }}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            aria-label="Close"
                            className="absolute top-4 right-4 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-zinc-400 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/15 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

// ── Single parallax card ─────────────────────────────────────────────────────

interface NebulaCardProps {
    item: NebulaEntry;
    dx: ReturnType<typeof useSpring>;
    dy: ReturnType<typeof useSpring>;
    onSelect: () => void;
    intensity: number;
}

function NebulaCard({ item, dx, dy, onSelect, intensity }: NebulaCardProps) {
    const maxX = item.depth * 28 * intensity;
    const maxY = item.depth * 22 * intensity;

    // Parallax driven by mouse — Inverted for "attraction" (pulling towards the mouse)
    const x = useTransform(dx, [-0.5, 0.5], [maxX, -maxX]);
    const y = useTransform(dy, [-0.5, 0.5], [maxY, -maxY]);

    // Enhanced tilt — "attraction" style (tilting towards the mouse)
    const rotateX = useTransform(dy, [-0.5, 0.5], [25, -25]);
    const rotateY = useTransform(dx, [-0.5, 0.5], [-25, 25]);

    return (
        <div
            className="absolute"
            style={{
                left: item.left,
                top: item.top,
                transform: 'translate(-50%, -50%)',
                zIndex: item.isCenter ? 20 : 10,
            }}
        >
            {/*
             * Ambient float for the center card lives on THIS wrapper so its
             * x/y keyframes never conflict with the motion values on the button below.
             */}
            <motion.div
                animate={
                    item.isCenter
                        ? { x: [0, 5, 0, -5, 0], y: [-3, 0, 3, 0, -3] }
                        : undefined
                }
                transition={
                    item.isCenter
                        ? {
                              duration: 12,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              times: [0, 0.25, 0.5, 0.75, 1],
                          }
                        : undefined
                }
            >
                <div style={{ perspective: '1000px' }}>
                    <motion.button
                        style={{ x, y, rotateX, rotateY }}
                        className="group preserve-3d relative aspect-[4/3] w-[min(300px,28vw)] cursor-pointer overflow-hidden rounded-3xl border border-theme shadow-2xl"
                        whileHover={{ scale: 1.07 }}
                        onClick={onSelect}
                    >
                        <img
                            src={item.thumb}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                            draggable={false}
                        />
                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4">
                            <p className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                                {item.category}
                            </p>
                            <p className="mt-0.5 text-sm leading-tight font-bold text-white">
                                {item.title}
                            </p>
                            <p className="mt-1.5 line-clamp-2 max-h-0 overflow-hidden text-xs leading-snug text-zinc-300 opacity-0 transition-all duration-300 group-hover:max-h-16 group-hover:opacity-100">
                                {item.description}
                            </p>
                            <div className="mt-1.5 flex max-h-0 items-center gap-1 overflow-hidden text-xs text-zinc-300 opacity-0 transition-all duration-300 group-hover:max-h-8 group-hover:opacity-100">
                                <span>View details</span>
                                <ArrowUpRight className="h-3 w-3" />
                            </div>
                        </div>
                        {item.isCenter && (
                            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-violet-500/60 ring-inset" />
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

// ── StarField Background ──────────────────────────────────────────────────────

interface Star {
    id: number;
    x: string;
    y: string;
    size: number;
    opacity: number;
}

function StarField({
    dx,
    dy,
    intensity,
}: {
    dx: ReturnType<typeof useSpring>;
    dy: ReturnType<typeof useSpring>;
    intensity: number;
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [stars] = useState<Star[]>(() => {
        return Array.from({ length: 60 }, (_, i) => ({
            id: i,
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.1,
        }));
    });

    // Stars move at a much shallower depth than cards
    const x = useTransform(dx, [-0.5, 0.5], [-20 * intensity, 20 * intensity]);
    const y = useTransform(dy, [-0.5, 0.5], [-15 * intensity, 15 * intensity]);

    return (
        <motion.div
            style={{ x, y }}
            className="pointer-events-none absolute inset-[-10%] z-0"
        >
            {stars.map((star) => (
                <div
                    key={star.id}
                    className={`absolute rounded-full transition-colors duration-500 ${
                        isDark
                            ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                            : 'bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.4)]'
                    }`}
                    style={{
                        left: star.x,
                        top: star.y,
                        width: star.size,
                        height: star.size,
                        opacity: isDark ? star.opacity : star.opacity * 0.7,
                    }}
                />
            ))}
        </motion.div>
    );
}

const WATERMARK = 'THE REAL OPTICORE';

// ── Main export ───────────────────────────────────────────────────────────────

interface NebulaClusterProps {
    cards?: FloatingCardData[];
}

export default function NebulaCluster({ cards = [] }: NebulaClusterProps) {
    const lenis = useLenis();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const isTablet = useMediaQuery(
        '(min-width: 768px) and (max-width: 1023px)',
    );

    const [selected, setSelected] = useState<number | null>(null);

    const positions = computeCardPositions(cards.length);
    const items: NebulaEntry[] = cards.map((card, index) => ({
        id: card.id,
        category: card.category,
        title: card.title,
        description: card.description,
        src: card.image,
        thumb: card.thumb,
        href: card.href,
        ...positions[index],
    }));

    const selectedItem = items.find((i) => i.id === selected) ?? null;

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 25, stiffness: 150 };
    const dx = useSpring(mouseX, springConfig);
    const dy = useSpring(mouseY, springConfig);

    const watermarkX = useTransform(dx, [-0.5, 0.5], [-24, 24]);
    const watermarkY = useTransform(dy, [-0.5, 0.5], [-12, 12]);

    const intensity = isTablet ? 0.45 : 1.0;

    // Pause/resume Lenis while modal is open
    useEffect(() => {
        if (selected !== null) {
            lenis?.stop();
        } else {
            lenis?.start();
        }

        return () => {
            lenis?.start();
        };
    }, [selected, lenis]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelected(null);
            }
        };
        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX / window.innerWidth - 0.5);
        mouseY.set(e.clientY / window.innerHeight - 0.5);
    };

    const modal = (
        <ExpandModal item={selectedItem} onClose={() => setSelected(null)} />
    );

    if (items.length === 0) {
        return null;
    }

    // ── Mobile: 2-col grid ────────────────────────────────────────────────────
    if (isMobile) {
        return (
            <>
                <div className="grid grid-cols-2 gap-3 px-4 pb-8">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSelected(item.id)}
                            className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border border-theme ${
                                item.isCenter ? 'col-span-2' : ''
                            }`}
                        >
                            <img
                                src={item.thumb}
                                alt={item.title}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-3">
                                <p className="text-[9px] font-bold tracking-widest text-cyan-400 uppercase">
                                    {item.category}
                                </p>
                                <p className="text-xs leading-tight font-bold text-white">
                                    {item.title}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
                {modal}
            </>
        );
    }

    // ── Desktop / tablet: parallax floating layout ────────────────────────────
    return (
        <>
            <div
                onMouseMove={handleMouseMove}
                className="relative h-screen w-full overflow-hidden"
            >
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                    {/* Background Glows */}
                    <GradientOrb
                        className="top-1/4 left-1/4 h-80 w-80 -rotate-12"
                        color="rgb(124 58 237 / 0.15)"
                    />
                    <GradientOrb
                        className="right-1/4 bottom-1/4 h-80 w-80 rotate-12"
                        color="rgb(6 182 212 / 0.15)"
                    />

                    <motion.h2
                        style={{ x: watermarkX, y: watermarkY }}
                        className="relative z-10 text-7xl font-black tracking-tighter text-foreground uppercase select-none md:text-9xl"
                    >
                        {WATERMARK.split('').map((char, i) => (
                            <motion.span
                                key={i}
                                animate={{
                                    opacity: [0.04, 0.55, 0.04],
                                    textShadow: [
                                        '0 0 0px transparent',
                                        '0 0 16px rgba(139,92,246,0.95), 0 0 32px rgba(139,92,246,0.5), 0 0 60px rgba(99,102,241,0.3)',
                                        '0 0 0px transparent',
                                    ],
                                }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    repeatDelay: WATERMARK.length * 0.09 + 1.2,
                                    ease: 'easeInOut',
                                    delay: i * 0.09,
                                }}
                                style={{
                                    display:
                                        char === ' '
                                            ? 'inline'
                                            : 'inline-block',
                                }}
                            >
                                {char}
                            </motion.span>
                        ))}
                    </motion.h2>
                </div>

                <StarField dx={dx} dy={dy} intensity={intensity} />

                {items.map((item) => (
                    <NebulaCard
                        key={item.id}
                        item={item}
                        dx={dx}
                        dy={dy}
                        onSelect={() => setSelected(item.id)}
                        intensity={intensity}
                    />
                ))}
            </div>
            {modal}
        </>
    );
}
