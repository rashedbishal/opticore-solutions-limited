import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { PropsWithChildren } from 'react';

interface ModalProps extends PropsWithChildren {
    open: boolean;
    title: string;
    onClose: () => void;
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[80] bg-black/80 p-0 backdrop-blur-md sm:p-6"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.3 }}
                        className="glass-panel fixed inset-0 h-full w-full rounded-none p-5 sm:relative sm:inset-auto sm:mx-auto sm:h-auto sm:max-w-lg sm:rounded-[2rem] sm:p-7"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-white">{title}</h3>
                            <button
                                type="button"
                                aria-label="Close modal"
                                className="touch-target inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200"
                                onClick={onClose}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
