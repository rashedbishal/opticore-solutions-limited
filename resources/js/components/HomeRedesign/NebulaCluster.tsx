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

const items: NebulaEntry[] = [
    {
        id: 1,
        category: 'Brand Identity',
        title: 'Visual Branding System',
        description:
            'A holistic brand identity crafted for modern businesses — from logo systems and colour palettes to typography and comprehensive brand guidelines that stand the test of time.',
        src: '/images/portfolio/nebula/branding.webp',
        thumb: '/images/portfolio/nebula/branding-sm.webp',
        left: '50%',
        top: '50%',
        depth: 0.8,
        isCenter: true,
        href: '/portfolio/graphic-design',
    },
    {
        id: 2,
        category: 'Motion Design',
        title: 'Motion Graphics Reel',
        description:
            'Dynamic motion graphics and animation sequences that captivate audiences and bring brand stories to life across every platform and format.',
        src: '/images/portfolio/nebula/motion.webp',
        thumb: '/images/portfolio/nebula/motion-sm.webp',
        left: '23%',
        top: '26%',
        depth: 1.8,
        isCenter: false,
        href: '/portfolio/video-editing',
    },
    {
        id: 3,
        category: 'Web Design',
        title: 'Analytics Dashboard',
        description:
            'Clean, data-rich interfaces that surface insights at a glance — designed for clarity, speed, and delightful interactions across all devices.',
        src: '/images/portfolio/nebula/analytics.webp',
        thumb: '/images/portfolio/nebula/analytics-sm.webp',
        left: '77%',
        top: '26%',
        depth: 2.0,
        isCenter: false,
        href: '/portfolio/web-development',
    },
    {
        id: 4,
        category: '3D Production',
        title: '3D Visual Direction',
        description:
            'Photorealistic 3D visuals and art direction that elevate product launches, campaigns, and immersive brand experiences.',
        src: '/images/portfolio/nebula/3d-visual.webp',
        thumb: '/images/portfolio/nebula/3d-visual-sm.webp',
        left: '23%',
        top: '73%',
        depth: 2.2,
        isCenter: false,
        href: '/portfolio/3d-production',
    },
    {
        id: 5,
        category: 'Social Media',
        title: 'Campaign Creative',
        description:
            'High-impact social content and campaign visuals designed to stop the scroll, drive engagement, and grow your audience organically.',
        src: '/images/portfolio/nebula/campaign.webp',
        thumb: '/images/portfolio/nebula/campaign-sm.webp',
        left: '77%',
        top: '72%',
        depth: 2.4,
        isCenter: false,
        href: '/portfolio/digital-marketing',
    },
];

// ── Expand modal (portal, highest z-index, scroll-locked) ─────────────────────

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
                <motion.div
                    key="nebula-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ zIndex: 99999 }}
                    className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
                    onPointerDown={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.88, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.88, opacity: 0, y: 20 }}
                        transition={{
                            type: 'spring',
                            damping: 28,
                            stiffness: 320,
                        }}
                        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="aspect-video w-full overflow-hidden">
                            <img
                                src={item.src}
                                alt={item.title}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                                draggable={false}
                            />
                        </div>
                        <div className="p-6">
                            <p className="text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">
                                {item.category}
                            </p>
                            <h3 className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                                {item.title}
                            </h3>
                            <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
                                {item.description}
                            </p>

                            <div className="mt-6 flex justify-end">
                                <Link
                                    href={item.href}
                                    className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-violet-700"
                                >
                                    Explore Portfolio
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                        <button
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            aria-label="Close"
                            className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                        >
                            <X className="h-5 w-5" />
                        </button>
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

export default function NebulaCluster() {
    const lenis = useLenis();
    const isMobile = useMediaQuery('(max-width: 767px)');
    const isTablet = useMediaQuery(
        '(min-width: 768px) and (max-width: 1023px)',
    );

    const [selected, setSelected] = useState<number | null>(null);
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
                        className="relative z-10 select-none text-7xl font-black tracking-tighter text-foreground uppercase md:text-9xl"
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
                                    display: char === ' ' ? 'inline' : 'inline-block',
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
