import type { SharedPageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle,
    Clock,
    CreditCard,
    Loader2,
    Lock,
    Shield,
    Smartphone,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface CheckoutItem {
    service: string;
    plan: string;
    price: string;
    delivery: string;
    category: string;
    subcategory: string;
}

interface Props {
    item: CheckoutItem;
}

type PaymentMethod = 'bkash' | 'nagad' | 'card';

const PAYMENT_METHODS: {
    id: PaymentMethod;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}[] = [
    {
        id: 'bkash',
        label: 'bKash',
        description: 'Pay with your bKash mobile wallet',
        icon: Smartphone,
        color: 'text-pink-500',
    },
    {
        id: 'nagad',
        label: 'Nagad',
        description: 'Pay with your Nagad mobile wallet',
        icon: Smartphone,
        color: 'text-orange-500',
    },
    {
        id: 'card',
        label: 'Visa / Mastercard',
        description: 'Pay securely with your debit or credit card',
        icon: CreditCard,
        color: 'text-cyan-500',
    },
];

export default function Checkout({ item }: Props) {
    const { auth } = usePage<SharedPageProps>().props;
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const handlePay = () => {
        setIsProcessing(true);

        setTimeout(() => {
            setIsDone(true);
            setTimeout(() => {
                router.post('/checkout/process', {
                    payment_method: selectedMethod,
                    service: item.service,
                    plan: item.plan,
                    price: item.price,
                    delivery: item.delivery,
                });
            }, 800);
        }, 1500);
    };

    return (
        <>
            <Head title="Checkout — Opticore" />

            <div className="relative min-h-screen pb-24">
                <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[140px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[140px]" />

                <div className="relative mx-auto max-w-4xl px-4 pt-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-10"
                    >
                        <div className="mb-2 text-xs font-bold tracking-[0.2em] text-cyan-500 uppercase">
                            Secure Checkout
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-theme">
                            Complete Your Order
                        </h1>
                        <p className="mt-2 text-sm text-theme-muted">
                            Logged in as{' '}
                            <span className="font-semibold text-theme">
                                {auth.user?.name}
                            </span>
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
                        {/* Payment Method Selector */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.1,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="space-y-6"
                        >
                            <div className="glass-panel rounded-[2rem] border-theme p-8">
                                <h2 className="mb-6 text-xl font-bold text-theme">
                                    Payment Method
                                </h2>

                                <div className="space-y-3">
                                    {PAYMENT_METHODS.map((method) => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedMethod(method.id)
                                            }
                                            className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${
                                                selectedMethod === method.id
                                                    ? 'border-cyan-500/50 bg-cyan-500/10'
                                                    : 'border-theme bg-theme-surface hover:bg-theme-surface-hover'
                                            }`}
                                        >
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-theme-surface-hover ${method.color}`}
                                            >
                                                <method.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-theme">
                                                    {method.label}
                                                </div>
                                                <div className="text-xs text-theme-muted">
                                                    {method.description}
                                                </div>
                                            </div>
                                            <div
                                                className={`h-5 w-5 rounded-full border-2 transition-all ${
                                                    selectedMethod === method.id
                                                        ? 'border-cyan-500 bg-cyan-500'
                                                        : 'border-theme-muted/40'
                                                }`}
                                            >
                                                {selectedMethod ===
                                                    method.id && (
                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <div className="h-2 w-2 rounded-full bg-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <p className="mt-5 flex items-center gap-2 text-xs text-theme-subtle">
                                    <Lock className="h-3.5 w-3.5" /> This is a
                                    mock checkout — no real payment is
                                    processed.
                                </p>
                            </div>
                        </motion.div>

                        {/* Order Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.2,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="space-y-4"
                        >
                            <div className="glass-panel rounded-[2rem] border-theme p-6">
                                <h2 className="mb-5 text-lg font-bold text-theme">
                                    Order Summary
                                </h2>

                                <div className="space-y-4 border-b border-theme pb-5">
                                    <div>
                                        <div className="text-[10px] font-bold tracking-widest text-theme-muted uppercase">
                                            Service
                                        </div>
                                        <div className="mt-1 text-sm font-bold text-theme">
                                            {item.service}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-bold tracking-widest text-theme-muted uppercase">
                                                Plan
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-theme">
                                                <Zap className="h-3.5 w-3.5 text-cyan-500" />
                                                {item.plan}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold tracking-widest text-theme-muted uppercase">
                                                Delivery
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-theme">
                                                <Clock className="h-3.5 w-3.5 text-cyan-500" />
                                                {item.delivery}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-5">
                                    <span className="text-sm font-bold text-theme-muted">
                                        Total
                                    </span>
                                    <span className="text-2xl font-black text-theme">
                                        {item.price}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={handlePay}
                                    className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-cyan-500 py-4 text-sm font-black tracking-widest text-white uppercase transition-all hover:bg-cyan-600 disabled:opacity-70"
                                >
                                    <AnimatePresence mode="wait">
                                        {isDone ? (
                                            <motion.span
                                                key="done"
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Payment Accepted!
                                            </motion.span>
                                        ) : isProcessing ? (
                                            <motion.span
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center gap-2"
                                            >
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Processing…
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="idle"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center gap-2"
                                            >
                                                Pay Now
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>

                            <div className="rounded-[2rem] border border-cyan-500/20 bg-cyan-500/5 p-5">
                                <h4 className="mb-1.5 flex items-center gap-2 text-sm font-bold text-cyan-500">
                                    <Shield className="h-4 w-4" /> Secure
                                    Purchase
                                </h4>
                                <p className="text-xs leading-relaxed text-theme-muted">
                                    Your payment is held securely and released
                                    only when you're satisfied with the final
                                    delivery.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}
