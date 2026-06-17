import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

interface Props {
    message: string;
    onClose: () => void;
}

export function CmsSuccessDialog({ message, onClose }: Props) {
    return (
        <AnimatePresence>
            {message && (
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
                            border: '1px solid rgba(16,185,129,0.35)',
                            boxShadow:
                                '0 0 0 1px rgba(16,185,129,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(16,185,129,0.14)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />

                        <div
                            className="flex items-center justify-between px-4 py-2.5"
                            style={{
                                background:
                                    'linear-gradient(90deg, rgba(16,185,129,0.14), rgba(16,185,129,0.05))',
                                borderBottom: '1px solid rgba(16,185,129,0.18)',
                            }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="flex gap-1.5">
                                    <div
                                        className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                                        style={{
                                            boxShadow:
                                                '0 0 6px rgba(16,185,129,0.7)',
                                        }}
                                    />
                                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                                </div>
                                <span className="font-mono text-[9px] tracking-[0.25em] text-emerald-400/80 uppercase">
                                    ◈ Operation Complete
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-5 w-5 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400/60 transition-all hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:text-emerald-300"
                            >
                                <X size={10} />
                            </button>
                        </div>

                        <div className="px-5 py-5">
                            <div className="flex items-start gap-4">
                                <div
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                    style={{
                                        background: 'rgba(16,185,129,0.1)',
                                        border: '1px solid rgba(16,185,129,0.28)',
                                        boxShadow:
                                            '0 0 20px rgba(16,185,129,0.12)',
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
                                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    </motion.div>
                                </div>

                                <div className="flex-1 pt-0.5">
                                    <p className="text-sm font-semibold text-white">
                                        Success
                                    </p>
                                    <p className="mt-1.5 text-xs leading-relaxed text-emerald-300/80">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mx-5 h-px bg-emerald-500/12" />

                        <div className="flex justify-end px-5 py-3.5">
                            <motion.button
                                type="button"
                                onClick={onClose}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="relative overflow-hidden rounded-lg px-5 py-2 text-sm font-semibold text-white"
                                style={{
                                    background:
                                        'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
                                    border: '1px solid rgba(16,185,129,0.4)',
                                    boxShadow: '0 0 18px rgba(16,185,129,0.15)',
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
                                    className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent"
                                />
                                <span className="relative">Dismiss</span>
                            </motion.button>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
