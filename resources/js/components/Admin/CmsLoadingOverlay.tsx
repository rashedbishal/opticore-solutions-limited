import type { GlobalEvent } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import adminRoutes from '@/routes/admin';

const SHOW_DELAY_MS = 150;
const ACCESSING_PREFIX = 'Accessing ';
const FALLBACK_SECTION = 'Module';
const SIGN_OUT_LABEL = 'Signing Out';
const LOGOUT_PATH = adminRoutes.logout.url();

const POST_LABEL_OVERRIDES: Record<string, string> = {
    '/admin/subscriptions/offer-email': 'Sending Broadcasting Email',
    '/admin/subscriptions/custom-email': 'Sending Email',
};
const LOGO_SRC = '/images/logo/OSL-Logo.png';

const CORNER_BRACKETS = [
    'top-6 left-6 border-t border-l',
    'top-6 right-6 border-t border-r',
    'bottom-6 left-6 border-b border-l',
    'bottom-6 right-6 border-b border-r',
];

// Mirrors AdminLayout's sidebar NAV_ITEMS so the loader names the section being entered.
const CMS_NAV_SECTIONS: { name: string; href: string }[] = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Customer Support', href: '/admin/customer-conversations' },
    { name: 'Portfolios', href: '/admin/portfolios' },
    { name: 'Sub Categories', href: '/admin/sub-categories' },
    { name: 'Blogs', href: '/admin/blogs' },
    { name: 'FAQs', href: '/admin/faqs' },
    { name: 'Job Listings', href: '/admin/job-listings' },
    { name: 'Job Applications', href: '/admin/job-applications' },
    { name: 'Chat Archive', href: '/admin/chats' },
    { name: 'Contacts', href: '/admin/contacts' },
    { name: 'Brands', href: '/admin/brands' },
    { name: 'Admins', href: '/admin/users' },
    { name: 'Clients', href: '/admin/clients' },
    { name: 'Client Workflow', href: '/admin/tasks' },
    { name: 'Review Control', href: '/admin/client-reviews' },
    { name: 'Testimonials', href: '/admin/testimonials' },
    { name: 'Orders', href: '/admin/orders' },
    { name: 'Transactions', href: '/admin/transactions' },
    { name: 'Subscriptions', href: '/admin/subscriptions' },
];

function resolveSectionLabel(pathname: string): string {
    let bestMatch: { name: string; href: string } | null = null;

    for (const section of CMS_NAV_SECTIONS) {
        if (section.href === '/admin') {
            if (pathname === '/admin' || pathname === '/admin/') {
                bestMatch = section;
            }

            continue;
        }

        if (
            pathname.startsWith(section.href) &&
            (!bestMatch || section.href.length > bestMatch.href.length)
        ) {
            bestMatch = section;
        }
    }

    return bestMatch?.name ?? FALLBACK_SECTION;
}

function HudRing() {
    return (
        <div className="relative flex h-28 w-28 items-center justify-center">
            <motion.svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full"
                style={{ overflow: 'visible' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            >
                <defs>
                    <linearGradient
                        id="cms-loader-ring"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop
                            offset="100%"
                            stopColor="#22d3ee"
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>
                <polygon
                    points="50,4 90,27 90,73 50,96 10,73 10,27"
                    fill="none"
                    stroke="url(#cms-loader-ring)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
            </motion.svg>

            <motion.svg
                viewBox="0 0 100 100"
                className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)]"
                animate={{ rotate: -360 }}
                transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
            >
                <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="6 10"
                    strokeLinecap="round"
                    className="text-cyan-400/30"
                />
            </motion.svg>

            <motion.div
                className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/40 via-fuchsia-400/20 to-cyan-400/40 blur-xl"
                animate={{ scale: [0.85, 1.2, 0.85], opacity: [0.5, 1, 0.5] }}
                transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            <motion.img
                src={LOGO_SRC}
                alt="Opticore"
                className="relative h-11 w-11 object-contain"
                initial={{
                    filter: 'brightness(0) invert(1) drop-shadow(0 0 6px rgba(139,92,246,0.6)) drop-shadow(0 0 14px rgba(34,211,238,0.35))',
                    scale: 1,
                }}
                animate={{
                    filter: [
                        'brightness(0) invert(1) drop-shadow(0 0 6px rgba(139,92,246,0.6)) drop-shadow(0 0 14px rgba(34,211,238,0.35))',
                        'brightness(0) invert(1) drop-shadow(0 0 16px rgba(139,92,246,0.95)) drop-shadow(0 0 32px rgba(34,211,238,0.65))',
                        'brightness(0) invert(1) drop-shadow(0 0 6px rgba(139,92,246,0.6)) drop-shadow(0 0 14px rgba(34,211,238,0.35))',
                    ],
                    scale: [1, 1.08, 1],
                }}
                transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </div>
    );
}

interface CmsLoadingOverlayProps {
    /** When set, overrides the router-driven visibility (e.g. a manual "Signing In" transition). */
    forceVisible?: boolean;
    /** When set, overrides the router-resolved label. */
    forceLabel?: string;
}

export default function CmsLoadingOverlay({
    forceVisible,
    forceLabel,
}: CmsLoadingOverlayProps) {
    const [visible, setVisible] = useState(false);
    const [label, setLabel] = useState(ACCESSING_PREFIX + FALLBACK_SECTION);

    useEffect(() => {
        const preload = new Image();
        preload.src = LOGO_SRC;
    }, []);

    useEffect(() => {
        let showTimer: ReturnType<typeof setTimeout>;

        const start = (event: GlobalEvent<'start'>) => {
            if (!event.detail.visit.showProgress) {
                return;
            }

            const { url, method } = event.detail.visit;

            setLabel(
                method === 'post' && url.pathname === LOGOUT_PATH
                    ? SIGN_OUT_LABEL
                    : method === 'post' && POST_LABEL_OVERRIDES[url.pathname]
                      ? POST_LABEL_OVERRIDES[url.pathname]
                      : ACCESSING_PREFIX + resolveSectionLabel(url.pathname),
            );

            showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        };

        const finish = () => {
            clearTimeout(showTimer);
            setVisible(false);
        };

        const offStart = router.on('start', start);
        const offFinish = router.on('finish', finish);
        const offNavigate = router.on('navigate', finish);

        return () => {
            clearTimeout(showTimer);
            offStart();
            offFinish();
            offNavigate();
        };
    }, []);

    const isVisible = forceVisible ?? visible;
    const displayLabel = forceLabel ?? label;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="cms-loading-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="fixed inset-0 z-[500] flex items-center justify-center bg-[#03050d]/85 backdrop-blur-md"
                >
                    {/* Ambient grid */}
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.05]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
                            backgroundSize: '48px 48px',
                        }}
                    />

                    {/* Radar sweep */}
                    <motion.div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.1) 50%, transparent 100%)',
                        }}
                        animate={{ y: ['-100%', '100%'] }}
                        transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />

                    {/* HUD corner brackets */}
                    {CORNER_BRACKETS.map((position) => (
                        <div
                            key={position}
                            className={`pointer-events-none absolute h-6 w-6 ${position} border-violet-500/30`}
                        />
                    ))}

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="relative flex flex-col items-center gap-6"
                    >
                        <HudRing />

                        <div className="flex flex-col items-center gap-2">
                            <p className="font-mono text-sm font-semibold tracking-[0.2em] text-violet-300/80 uppercase">
                                {displayLabel}
                            </p>
                            <div className="h-[3px] w-40 overflow-hidden rounded-full bg-white/5">
                                <motion.div
                                    className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-500"
                                    animate={{ x: ['-100%', '300%'] }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
