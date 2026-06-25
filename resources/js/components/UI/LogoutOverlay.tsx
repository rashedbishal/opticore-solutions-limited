import { router } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const LETTERS = 'SIGNING OUT'.split('');

function GradientRing() {
    return (
        <div className="relative flex h-24 w-24 items-center justify-center">
            {/* Outer rotating gradient arc */}
            <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            >
                <svg
                    viewBox="0 0 96 96"
                    className="h-full w-full"
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        <linearGradient
                            id="arc-grad"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Track */}
                    <circle
                        cx="48"
                        cy="48"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-violet-500/10 dark:text-violet-400/15"
                    />
                    {/* Gradient arc — roughly 270° */}
                    <circle
                        cx="48"
                        cy="48"
                        r="42"
                        fill="none"
                        stroke="url(#arc-grad)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="197 66"
                        strokeDashoffset="0"
                    />
                </svg>
            </motion.div>

            {/* Inner slow counter-rotate — creates depth */}
            <motion.div
                className="absolute inset-4"
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            >
                <svg viewBox="0 0 56 56" className="h-full w-full">
                    <circle
                        cx="28"
                        cy="28"
                        r="24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="8 10"
                        strokeLinecap="round"
                        className="text-violet-400/20 dark:text-violet-400/25"
                    />
                </svg>
            </motion.div>

            {/* Center dot */}
            <motion.div
                className="h-2 w-2 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400"
                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
}

export default function LogoutOverlay() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let shownAt = 0;
        let hideTimer: ReturnType<typeof setTimeout>;

        const show = () => {
            shownAt = Date.now();
            setVisible(true);
        };

        const hide = () => {
            const elapsed = Date.now() - shownAt;
            const remaining = Math.max(0, 1200 - elapsed);
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => setVisible(false), remaining);
        };

        window.addEventListener('logout:start', show);
        const offFinish = router.on('finish', hide);
        const offNavigate = router.on('navigate', hide);

        return () => {
            clearTimeout(hideTimer);
            window.removeEventListener('logout:start', show);
            offFinish();
            offNavigate();
        };
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="logout-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[oklch(0.99_0.003_240)] dark:bg-[oklch(0.12_0_0)]"
                >
                    {/* Ambient glow */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-[480px] w-[480px] rounded-full bg-violet-500/[0.05] blur-3xl dark:bg-violet-500/[0.09]" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="relative flex flex-col items-center gap-8"
                    >
                        <GradientRing />

                        {/* Staggered letter text */}
                        <motion.div
                            className="flex items-center gap-[0.18em]"
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={{
                                visible: { transition: { staggerChildren: 0.045, delayChildren: 0.15 } },
                                hidden: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
                            }}
                        >
                            {LETTERS.map((char, i) =>
                                char === ' ' ? (
                                    <span key={i} className="w-2" />
                                ) : (
                                    <motion.span
                                        key={i}
                                        variants={{
                                            hidden: { opacity: 0, y: 6 },
                                            visible: { opacity: 1, y: 0 },
                                        }}
                                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                        className="font-[family-name:var(--font-geist-mono)] text-[10px] font-semibold tracking-[0.22em] text-zinc-400/70 dark:text-zinc-500/80"
                                    >
                                        {char}
                                    </motion.span>
                                ),
                            )}
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
