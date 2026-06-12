import type { GlobalEvent } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const SHOW_DELAY_MS = 150;
const LABEL = 'ACCESSING MODULE';

const CORNER_BRACKETS = [
    'top-6 left-6 border-t border-l',
    'top-6 right-6 border-t border-r',
    'bottom-6 left-6 border-b border-l',
    'bottom-6 right-6 border-b border-r',
];

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
                className="h-3 w-3 rounded-full bg-gradient-to-br from-violet-400 to-cyan-300"
                style={{
                    boxShadow:
                        '0 0 16px rgba(139,92,246,0.8), 0 0 32px rgba(34,211,238,0.4)',
                }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </div>
    );
}

export default function CmsLoadingOverlay() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let showTimer: ReturnType<typeof setTimeout>;

        const start = (event: GlobalEvent<'start'>) => {
            if (!event.detail.visit.showProgress) {
                return;
            }

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

    return (
        <AnimatePresence>
            {visible && (
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
                            <p className="font-mono text-[11px] font-semibold tracking-[0.3em] text-violet-300/80 uppercase">
                                {LABEL}
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
