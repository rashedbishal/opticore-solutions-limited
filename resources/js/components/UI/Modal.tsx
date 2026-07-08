import type { PropsWithChildren } from 'react';
import { AnimatePresence, m as motion } from 'framer-motion';
import { X } from 'lucide-react';
import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useLenis } from '@/hooks/useLenis';

type Accent = 'emerald' | 'red';

interface ModalProps extends PropsWithChildren {
    open: boolean;
    title: string;
    onClose: () => void;
    /** Tints the header/footer bars and adds an ambient glow to the panel, e.g. for status modals. */
    accent?: Accent;
}

/** Shares the modal's accent so `ModalFooter` can match the header without prop-drilling. */
const ModalAccentContext = createContext<Accent | undefined>(undefined);

/** Background + border treatment for the header/footer chrome bars, keyed by accent. */
const SECTION_STYLES: Record<Accent | 'default', string> = {
    default: 'border-theme bg-theme-surface',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    red: 'border-red-500/20 bg-red-500/5',
};

/** Ambient glow + top hairline applied to the panel itself, keyed by accent. */
const GLOW_STYLES: Record<Accent, { line: string; glow: string }> = {
    emerald: {
        line: 'from-transparent via-emerald-500/60 to-transparent',
        glow: '0 0 100px -20px rgba(16,185,129,0.35)',
    },
    red: {
        line: 'from-transparent via-red-500/60 to-transparent',
        glow: '0 0 100px -20px rgba(239,68,68,0.35)',
    },
};

/**
 * Scrollable content area of the modal. Compose modals as
 * `<Modal><ModalBody>…</ModalBody><ModalFooter>…</ModalFooter></Modal>`.
 */
export function ModalBody({
    className = '',
    children,
}: PropsWithChildren<{ className?: string }>) {
    return <div className={`space-y-6 ${className}`.trim()}>{children}</div>;
}

/**
 * Bottom action bar — its own tinted background, top border, and rounded
 * bottom corners flush with the panel edge (matching the header above it).
 * Buttons are laid out `flex-row-reverse` so the primary action — listed
 * first in JSX — ends up rightmost, matching the rest of the app's convention.
 */
export function ModalFooter({
    className = '',
    children,
}: PropsWithChildren<{ className?: string }>) {
    const accent = useContext(ModalAccentContext);

    return (
        <div
            className={`-mx-5 -mb-5 mt-6 flex flex-col gap-2 rounded-b-[2rem] border-t px-5 py-4 sm:-mx-7 sm:-mb-7 sm:flex-row-reverse sm:px-7 ${SECTION_STYLES[accent ?? 'default']} ${className}`.trim()}
        >
            {children}
        </div>
    );
}

export default function Modal({
    open,
    title,
    onClose,
    accent,
    children,
}: ModalProps) {
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
                    className="site-typography fixed inset-0 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/80 dark:backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        className="neo-panel-elevated relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto overflow-x-hidden p-5 sm:p-7"
                        style={
                            accent
                                ? {
                                      boxShadow: `var(--neo-shadow-modal), ${GLOW_STYLES[accent].glow}`,
                                  }
                                : undefined
                        }
                        onClick={(event) => event.stopPropagation()}
                    >
                        {accent && (
                            <div
                                aria-hidden
                                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${GLOW_STYLES[accent].line}`}
                            />
                        )}
                        <ModalAccentContext.Provider value={accent}>
                            {/* Header */}
                            <div
                                className={`-mx-5 -mt-5 mb-6 flex shrink-0 items-center justify-between gap-4 rounded-t-[2rem] border-b px-5 py-4 sm:-mx-7 sm:-mt-7 sm:px-7 sm:py-5 ${SECTION_STYLES[accent ?? 'default']}`}
                            >
                                <h3 className="text-theme text-xl font-bold tracking-tight uppercase">
                                    {title}
                                </h3>
                                <button
                                    type="button"
                                    aria-label="Close modal"
                                    className="neo-btn-ghost flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-all hover:scale-105 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                                    onClick={onClose}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            {children}
                        </ModalAccentContext.Provider>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>,
        document.body,
    );
}
