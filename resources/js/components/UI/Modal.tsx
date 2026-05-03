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
                    className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        className="glass-panel w-full max-w-lg rounded-[2rem] p-5 sm:p-7"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-theme text-xl font-bold tracking-tight uppercase">
                                {title}
                            </h3>
                            <button
                                type="button"
                                aria-label="Close modal"
                                className="border-theme bg-theme-surface text-theme-muted hover:bg-theme-surface-hover flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
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
