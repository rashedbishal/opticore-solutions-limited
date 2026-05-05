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
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=900',
        left: '50%',
        top: '48%',
        depth: 0,
        isCenter: true,
        href: '/portfolio/graphic-design',
    },
    {
        id: 2,
        category: 'Motion Design',
        title: 'Motion Graphics Reel',
        description:
            'Dynamic motion graphics and animation sequences that captivate audiences and bring brand stories to life across every platform and format.',
        src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=900',
        left: '18%',
        top: '20%',
        depth: 1.4,
        isCenter: false,
        href: '/portfolio/video-editing',
    },
    {
        id: 3,
        category: 'Web Design',
        title: 'Analytics Dashboard',
        description:
            'Clean, data-rich interfaces that surface insights at a glance — designed for clarity, speed, and delightful interactions across all devices.',
        src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=900',
        left: '80%',
        top: '20%',
        depth: 1.6,
        isCenter: false,
        href: '/portfolio/web-development',
    },
    {
        id: 4,
        category: '3D Production',
        title: '3D Visual Direction',
        description:
            'Photorealistic 3D visuals and art direction that elevate product launches, campaigns, and immersive brand experiences.',
        src: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=900',
        left: '18%',
        top: '76%',
        depth: 1.8,
        isCenter: false,
        href: '/portfolio/3d-production',
    },
    {
        id: 5,
        category: 'Social Media',
        title: 'Campaign Creative',
        description:
            'High-impact social content and campaign visuals designed to stop the scroll, drive engagement, and grow your audience organically.',
        src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=900',
        left: '80%',
        top: '76%',
        depth: 2.0,
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
                        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-theme bg-theme-surface shadow-2xl"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="aspect-video w-full overflow-hidden">
                            <img
                                src={item.src}
                                alt={item.title}
                                className="h-full w-full object-cover"
                                draggable={false}
                            />
                        </div>
                        <div className="p-6">
                            <p className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
                                {item.category}
                            </p>
                            <h3 className="mt-2 text-2xl font-extrabold text-theme">
                                {item.title}
                            </h3>
                            <p className="mt-3 leading-relaxed text-theme-muted">
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

    // Parallax driven by mouse — depth:0 (center) produces zero movement here
    const x = useTransform(dx, [-0.5, 0.5], [-maxX, maxX]);
    const y = useTransform(dy, [-0.5, 0.5], [-maxY, maxY]);
    const rotateX = useTransform(dy, [-0.5, 0.5], [8, -8]);
    const rotateY = useTransform(dx, [-0.5, 0.5], [-8, 8]);

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
                        className={`group preserve-3d relative cursor-pointer overflow-hidden rounded-3xl border border-theme shadow-2xl ${
                            item.isCenter
                                ? 'w-[min(300px,34vw)]'
                                : 'w-[min(220px,24vw)]'
                        } aspect-[4/3]`}
                        whileHover={{ scale: 1.07 }}
                        onClick={onSelect}
                    >
                        <img
                            src={item.src}
                            alt={item.title}
                            className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                            draggable={false}
                        />
                        <motion.div
                            className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                                {item.category}
                            </p>
                            <p className="mt-0.5 text-sm leading-tight font-bold text-white">
                                {item.title}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs text-zinc-300">
                                <span>View details</span>
                                <ArrowUpRight className="h-3 w-3" />
                            </div>
                        </motion.div>
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
                                src={item.src}
                                alt={item.title}
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

                    <h2 className="relative z-10 text-7xl font-black tracking-tighter text-foreground uppercase opacity-[0.04] md:text-9xl">
                        The Nebula
                    </h2>
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
