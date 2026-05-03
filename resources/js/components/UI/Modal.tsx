import type { PropsWithChildren } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useLenis } from '@/hooks/useLenis';

interface ModalProps extends PropsWithChildren {
    open: boolean;
    title: string;
    onClose: () => void;
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
    const lenis = useLenis();

    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );

    useEffect(() => {
        if (open) {
            lenis?.stop();
        } else {
            lenis?.start();
        }

        return () => {
            lenis?.start();
        };
    }, [open, lenis]);

    if (!mounted) {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {open ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ zIndex: 999999 }}
                    className="fixed inset-0 flex items-center justify-center bg-slate-900/40 dark:bg-black/80 p-4 backdrop-blur-sm dark:backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-lg rounded-[2rem] p-5 sm:p-7 bg-gradient-to-b from-white to-slate-50 shadow-[0_16px_64px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] dark:from-zinc-900 dark:to-zinc-950 dark:shadow-[0_16px_64px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-slate-100 dark:border-zinc-800"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-theme text-xl font-bold tracking-tight uppercase">
                                {title}
                            </h3>
                            <button
                                type="button"
                                aria-label="Close modal"
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-white to-slate-50 text-zinc-500 shadow-[0_2px_4px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] transition-all hover:scale-105 hover:text-zinc-800 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-400 dark:shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)] dark:hover:text-zinc-200"
                                onClick={onClose}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>,
        document.body,
    );
}
