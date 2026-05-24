import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
    messages: string[];
    onClose: () => void;
}

export function CmsErrorDialog({ messages, onClose }: Props) {
    return (
        <AnimatePresence>
            {messages.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    style={{
                        backdropFilter: 'blur(4px)',
                        background: 'rgba(0,0,0,0.55)',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.86, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 30,
                        }}
                        className="relative w-full max-w-sm overflow-hidden rounded-xl"
                        style={{
                            background:
                                'linear-gradient(148deg, #0e1225, #090d1b)',
                            border: '1px solid rgba(239,68,68,0.35)',
                            boxShadow:
                                '0 0 0 1px rgba(239,68,68,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(239,68,68,0.14)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

                        <div
                            className="flex items-center justify-between px-4 py-2.5"
                            style={{
                                background:
                                    'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(239,68,68,0.05))',
                                borderBottom: '1px solid rgba(239,68,68,0.18)',
                            }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="flex gap-1.5">
                                    <div
                                        className="h-2.5 w-2.5 rounded-full bg-red-500"
                                        style={{
                                            boxShadow:
                                                '0 0 6px rgba(239,68,68,0.7)',
                                        }}
                                    />
                                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                                </div>
                                <span className="font-mono text-[9px] tracking-[0.25em] text-red-400/80 uppercase">
                                    ◈ Validation Error
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-5 w-5 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-400/60 transition-all hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-300"
                            >
                                <X size={10} />
                            </button>
                        </div>

                        <div className="px-5 py-5">
                            <div className="flex items-start gap-4">
                                <div
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                    style={{
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.28)',
                                        boxShadow:
                                            '0 0 20px rgba(239,68,68,0.12)',
                                    }}
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.12, 1] }}
                                        transition={{
                                            duration: 1.8,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                    >
                                        <AlertTriangle className="h-5 w-5 text-red-400" />
                                    </motion.div>
                                </div>

                                <div className="flex-1 pt-0.5">
                                    <p className="text-sm font-semibold text-white">
                                        Validation Failed
                                    </p>
                                    <ul className="mt-2 space-y-1">
                                        {messages.map((msg, i) => (
                                            <li
                                                key={i}
                                                className="text-xs text-red-300/80"
                                            >
                                                • {msg}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="mx-5 h-px bg-red-500/12" />

                        <div className="flex justify-end px-5 py-3.5">
                            <motion.button
                                type="button"
                                onClick={onClose}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="relative overflow-hidden rounded-lg px-5 py-2 text-sm font-semibold text-white"
                                style={{
                                    background:
                                        'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))',
                                    border: '1px solid rgba(239,68,68,0.4)',
                                    boxShadow: '0 0 18px rgba(239,68,68,0.15)',
                                }}
                            >
                                <motion.span
                                    animate={{ x: ['-100%', '180%'] }}
                                    transition={{
                                        duration: 1.6,
                                        repeat: Infinity,
                                        ease: 'linear',
                                        repeatDelay: 0.8,
                                    }}
                                    className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-red-400/15 to-transparent"
                                />
                                <span className="relative">Dismiss</span>
                            </motion.button>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/35 to-transparent" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
