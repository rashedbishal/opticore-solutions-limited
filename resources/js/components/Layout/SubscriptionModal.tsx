import { AnimatePresence, m as motion } from 'framer-motion';
import { CheckCircle, Mail } from 'lucide-react';
import { createPortal } from 'react-dom';

type SubscriptionModalVariant =
    | 'pending-subscribe'
    | 'pending-unsubscribe'
    | 'subscribed'
    | 'unsubscribed';

const SUBSCRIPTION_MODAL_COPY: Record<
    SubscriptionModalVariant,
    { eyebrow: string; title: string; body: string }
> = {
    'pending-subscribe': {
        eyebrow: 'Confirmation Sent',
        title: 'Check your inbox',
        body: "We've emailed a confirmation link — click it to start receiving updates & exclusive offers.",
    },
    'pending-unsubscribe': {
        eyebrow: 'Confirmation Sent',
        title: 'Check your inbox',
        body: "We've emailed a confirmation link — click it to confirm you'd like to stop receiving updates.",
    },
    subscribed: {
        eyebrow: 'Subscription Confirmed',
        title: "You're subscribed!",
        body: "You'll receive exclusive offers and updates from Opticore Solutions.",
    },
    unsubscribed: {
        eyebrow: 'Unsubscribed',
        title: "You've been unsubscribed",
        body: "You won't receive any more newsletter emails from us. Changed your mind? You can resubscribe anytime.",
    },
};

interface SubscriptionModalProps {
    variant: SubscriptionModalVariant | null;
    onClose: () => void;
}

export default function SubscriptionModal({
    variant,
    onClose,
}: SubscriptionModalProps) {
    return createPortal(
        <AnimatePresence>
            {variant && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="site-typography fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{
                        backdropFilter: 'blur(6px)',
                        background: 'rgba(0,0,0,0.65)',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.88,
                            y: -20,
                        }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -12 }}
                        transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 28,
                        }}
                        className="relative w-full max-w-sm overflow-hidden rounded-2xl text-center"
                        style={{
                            background:
                                'linear-gradient(148deg, #0e1225, #090d1b)',
                            border: '1px solid rgba(124,58,237,0.35)',
                            boxShadow:
                                '0 0 0 1px rgba(124,58,237,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(124,58,237,0.2)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/70 to-transparent" />

                        <div className="px-6 py-8">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{
                                    duration: 1.6,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                                style={{
                                    background: 'rgba(124,58,237,0.12)',
                                    border: '1px solid rgba(124,58,237,0.35)',
                                    boxShadow: '0 0 28px rgba(124,58,237,0.25)',
                                }}
                            >
                                {variant.startsWith('pending') ? (
                                    <Mail className="h-7 w-7 text-violet-400" />
                                ) : (
                                    <CheckCircle className="h-7 w-7 text-violet-400" />
                                )}
                            </motion.div>

                            <p className="mb-1 font-mono text-[9px] tracking-[0.28em] text-violet-400/60 uppercase">
                                ◈ {SUBSCRIPTION_MODAL_COPY[variant].eyebrow}
                            </p>
                            <h3 className="text-base font-semibold text-white">
                                {SUBSCRIPTION_MODAL_COPY[variant].title}
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-white/50">
                                {SUBSCRIPTION_MODAL_COPY[variant].body}
                            </p>

                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="relative mt-6 inline-flex w-full items-center justify-center overflow-hidden rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(124,58,237,0.3)] transition-all hover:from-violet-500 hover:to-indigo-500"
                            >
                                <motion.div
                                    animate={{
                                        x: ['-120%', '220%'],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 1,
                                        ease: 'easeInOut',
                                    }}
                                    className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                                <span className="relative">Got it</span>
                            </motion.button>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/35 to-transparent" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
