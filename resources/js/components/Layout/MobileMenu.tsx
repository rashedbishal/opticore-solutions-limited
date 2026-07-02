import type { SharedPageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    PenTool,
    Globe,
    Film,
    Box,
    Code2,
    Mail,
    User,
    LogOut,
    LogIn,
    Home,
    Briefcase,
    ArrowRight,
    Loader2,
    X,
} from 'lucide-react';
import { useId, useState } from 'react';
import { navigationItems } from '@/lib/site';
import { cn } from '@/lib/utils';

const IconMap: Record<string, any> = {
    PenTool,
    Globe,
    Film,
    Box,
    Code2,
    Mail,
    User,
    Home,
    Briefcase,
    LogOut,
    LogIn,
};

interface MobileMenuProps {
    url: string;
    open: boolean;
    onClose: () => void;
}

const railEase = [0.16, 1, 0.3, 1] as const;

// The rail panel itself is masked (via an SVG <mask>, not an opaque div
// drawn on top of it) by a grid of squares that fade in/out in two
// alternating waves (even squares, then odd squares). A hidden square is
// therefore a genuine hole — it shows whatever is actually behind the rail
// (the blurred backdrop/page), not another layer's color. Opening grows the
// mask from nothing to fully revealed; closing is the exact reverse — no
// square ever fades in only to fade out again mid-open.
const TILE_COLS = 10;
const TILE_ROWS = 17;
const TILES = Array.from({ length: TILE_COLS * TILE_ROWS }, (_, i) => i);
const TILE_DURATION = 0.8;
const WAVE_GAP = 0.42;
const POSITION_SPREAD = 0.75;
const MAX_POSITION_STEPS = TILE_COLS - 1 + (TILE_ROWS - 1);
const TOTAL_WIPE_DURATION = WAVE_GAP + POSITION_SPREAD + TILE_DURATION + 0.1;

function tileDelay(row: number, col: number) {
    const isEven = (row + col) % 2 === 0;
    const positionDelay = (row + col) * (POSITION_SPREAD / MAX_POSITION_STEPS);

    return (isEven ? 0 : WAVE_GAP) + positionDelay;
}

export default function MobileMenu({ url, open, onClose }: MobileMenuProps) {
    const { props } = usePage<SharedPageProps>();
    const { user } = props.auth;
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const maskId = useId();

    const navItems = [...navigationItems];

    const authItems = user
        ? [
              {
                  label: 'Profile',
                  href: '/profile',
                  icon: 'User',
                  isPost: false,
                  isLogout: false,
              },
              {
                  label: 'Sign out',
                  href: '/logout',
                  icon: 'LogOut',
                  isPost: true,
                  isLogout: true,
              },
          ]
        : [
              {
                  label: 'Sign in',
                  href: '/login',
                  icon: 'LogIn',
                  isPost: false,
                  isLogout: false,
              },
          ];

    const allItems = [
        ...navItems.map((item) => ({
            ...item,
            isPost: false,
            isLogout: false,
        })),
        ...authItems,
    ];

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        transition={{ duration: 1.15, ease: railEase }}
                        className="fixed inset-0 z-60 bg-black/50 xl:hidden dark:bg-black/65"
                        onClick={onClose}
                    />

                    {/* Rail panel — stays put; the SVG mask referenced below
                        is what checkerboards its visibility in/out. */}
                    <motion.div
                        key="rail"
                        exit={{ opacity: 1 }}
                        transition={{ delay: TOTAL_WIPE_DURATION }}
                        style={{
                            WebkitMaskImage: `url(#${maskId})`,
                            maskImage: `url(#${maskId})`,
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            WebkitMaskSize: '100% 100%',
                            maskSize: '100% 100%',
                        }}
                        className="fixed inset-y-0 right-0 z-60 flex w-[86%] max-w-sm flex-col overflow-hidden border-l border-slate-200/70 bg-gradient-to-b from-white to-slate-50/98 shadow-[-20px_0_60px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.9)] xl:hidden dark:border-zinc-800 dark:from-[#1c1c22] dark:to-[#08080c] dark:shadow-[-24px_0_80px_rgba(0,0,0,0.85),inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                    >
                        {/* Left-edge gradient glow stripe */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
                            style={{
                                background:
                                    'linear-gradient(to bottom, transparent 0%, #7c3aed 22%, #22d3ee 72%, transparent 100%)',
                                boxShadow:
                                    '0 0 16px rgba(124,58,237,0.5), 0 0 36px rgba(34,211,238,0.18)',
                            }}
                        />

                        {/* Subtle ambient glow from the stripe */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-violet-100/40 to-transparent dark:from-violet-950/30 dark:to-transparent"
                        />

                        {/* Rail header */}
                        <div className="relative flex shrink-0 items-center justify-between pt-7 pr-5 pb-4 pl-7">
                            <Link
                                href="/"
                                onClick={onClose}
                                className="inline-flex items-center"
                            >
                                <img
                                    src="/images/logo/opticore.webp"
                                    alt="Opticore Solutions"
                                    decoding="async"
                                    className="block h-14 w-auto dark:hidden"
                                />
                                <img
                                    src="/images/logo/opticore-white.webp"
                                    alt="Opticore Solutions"
                                    decoding="async"
                                    className="hidden h-14 w-auto dark:block"
                                />
                            </Link>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close navigation menu"
                                className="neo-btn-ghost group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:scale-105"
                            >
                                <X className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                            </button>
                        </div>

                        {/* Unified item list — no independent fade here; the
                            mask above is the sole reveal mechanism, so a
                            square genuinely hides/exposes whatever content
                            sits underneath it. */}
                        <div className="hide-scrollbar relative flex-1 overflow-y-auto overscroll-contain pr-5 pb-2 pl-7">
                            <div>
                                {allItems.map((item) => {
                                    const Icon = item.icon
                                        ? IconMap[item.icon]
                                        : null;
                                    const active =
                                        !item.isLogout && url === item.href;

                                    const rowBase =
                                        'group flex w-full items-center gap-3.5 border-b py-4 transition-all duration-200 border-slate-200/70 dark:border-white/[0.05]';

                                    if (item.isLogout) {
                                        return (
                                            <Link
                                                key="logout"
                                                href={item.href}
                                                method="post"
                                                as="button"
                                                onStart={() =>
                                                    setIsLoggingOut(true)
                                                }
                                                onFinish={() =>
                                                    setIsLoggingOut(false)
                                                }
                                                disabled={isLoggingOut}
                                                onClick={() => {
                                                    window.dispatchEvent(
                                                        new CustomEvent(
                                                            'logout:start',
                                                        ),
                                                    );
                                                    onClose();
                                                }}
                                                className={cn(
                                                    rowBase,
                                                    'text-left disabled:opacity-50',
                                                )}
                                            >
                                                {isLoggingOut ? (
                                                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-500 dark:text-violet-400" />
                                                ) : (
                                                    Icon && (
                                                        <Icon className="h-5 w-5 shrink-0 text-violet-500 dark:text-violet-400" />
                                                    )
                                                )}
                                                <span className="flex-1 text-base font-semibold text-zinc-700 dark:text-zinc-400">
                                                    {isLoggingOut
                                                        ? 'Signing out…'
                                                        : item.label}
                                                </span>
                                                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 dark:text-zinc-700" />
                                            </Link>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={cn(rowBase)}
                                        >
                                            {Icon && (
                                                <Icon
                                                    className={cn(
                                                        'h-5 w-5 shrink-0 transition-colors',
                                                        active
                                                            ? 'text-violet-500 dark:text-violet-400'
                                                            : 'text-zinc-400 dark:text-zinc-600',
                                                    )}
                                                />
                                            )}
                                            <span
                                                className={cn(
                                                    'flex-1 text-base font-semibold transition-colors',
                                                    active
                                                        ? 'bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent dark:from-violet-300 dark:to-cyan-300'
                                                        : 'text-zinc-700 dark:text-zinc-400',
                                                )}
                                            >
                                                {item.label}
                                            </span>
                                            <ArrowRight
                                                className={cn(
                                                    'h-4 w-4 shrink-0 transition-all duration-200 group-hover:translate-x-0.5',
                                                    active
                                                        ? 'text-cyan-400 dark:text-cyan-500'
                                                        : 'text-slate-300 dark:text-zinc-700',
                                                )}
                                            />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer spacer */}
                        <div className="shrink-0 pb-8" />
                    </motion.div>

                    {/* SVG mask definition — each rect is one checker square.
                        White = that square of the rail is visible; the
                        default (unpainted) mask background is transparent,
                        so a square at opacity 0 shows through to whatever is
                        actually behind the rail (the blurred backdrop/page),
                        not another opaque layer. */}
                    <svg
                        aria-hidden
                        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
                    >
                        <defs>
                            <mask
                                id={maskId}
                                maskContentUnits="objectBoundingBox"
                            >
                                {TILES.map((i) => {
                                    const col = i % TILE_COLS;
                                    const row = Math.floor(i / TILE_COLS);
                                    const delay = tileDelay(row, col);
                                    const w = 1 / TILE_COLS;
                                    const h = 1 / TILE_ROWS;
                                    // Slightly overlap neighboring squares so
                                    // sub-pixel/antialiasing rounding never
                                    // leaves a hairline seam once every
                                    // square has faded to fully opaque.
                                    const overlapX = w * 0.03;
                                    const overlapY = h * 0.03;

                                    return (
                                        <motion.rect
                                            key={i}
                                            shapeRendering="crispEdges"
                                            x={col * w - overlapX / 2}
                                            y={row * h - overlapY / 2}
                                            width={w + overlapX}
                                            height={h + overlapY}
                                            fill="white"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{
                                                delay,
                                                duration: TILE_DURATION,
                                                ease: railEase,
                                            }}
                                        />
                                    );
                                })}
                            </mask>
                        </defs>
                    </svg>
                </>
            )}
        </AnimatePresence>
    );
}
