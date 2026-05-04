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
                            <div className="neo-panel-elevated p-8">
                                <h2 className="drop-icon-subtle dark:drop-icon-md mb-6 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
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
                                            className={`flex w-full items-center gap-4 rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] ${
                                                selectedMethod === method.id
                                                    ? 'bg-gradient-to-b from-cyan-50/50 to-white shadow-[0_0_32px_rgba(34,211,238,0.2),0_8px_24px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(34,211,238,0.4),inset_0_2px_4px_rgba(255,255,255,0.8)] dark:from-cyan-950/30 dark:to-zinc-900 dark:shadow-[0_0_32px_rgba(34,211,238,0.15),0_8px_24px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(34,211,238,0.4),inset_0_1px_2px_rgba(255,255,255,0.15)]'
                                                    : 'bg-gradient-to-b from-slate-50 to-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(0,0,0,0.08),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.05)] dark:from-zinc-800 dark:to-zinc-900 dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.05)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.08)]'
                                            }`}
                                        >
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] ${selectedMethod === method.id ? 'bg-cyan-500/10 dark:bg-cyan-500/20' : 'bg-slate-200 dark:bg-zinc-950'} ${method.color}`}
                                            >
                                                <method.icon className="drop-icon-sm h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-zinc-900 dark:text-white">
                                                    {method.label}
                                                </div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {method.description}
                                                </div>
                                            </div>
                                            <div
                                                className={`flex h-5 w-5 items-center justify-center rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all ${
                                                    selectedMethod === method.id
                                                        ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_2px_8px_rgba(34,211,238,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] dark:from-cyan-500 dark:to-cyan-700 dark:shadow-[0_2px_8px_rgba(34,211,238,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                                                        : 'bg-zinc-200 dark:bg-zinc-950'
                                                }`}
                                            >
                                                {selectedMethod ===
                                                    method.id && (
                                                    <div className="h-2 w-2 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
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
                            <div className="neo-panel-elevated p-6">
                                <h2 className="drop-icon-subtle dark:drop-icon-md mb-5 text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                                    Order Summary
                                </h2>

                                <div className="space-y-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                                    <div>
                                        <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                                            Service
                                        </div>
                                        <div className="drop-icon-sm mt-1 text-sm font-bold text-zinc-900 dark:text-white">
                                            {item.service}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                                                Plan
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 rounded-xl bg-cyan-50/50 px-3 py-1.5 text-sm font-bold text-cyan-600 shadow-[inset_0_1px_1px_rgba(255,255,255,1),inset_0_0_0_1px_rgba(34,211,238,0.2)] dark:bg-cyan-950/30 dark:text-cyan-400 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(34,211,238,0.2)]">
                                                <Zap className="h-3.5 w-3.5" />
                                                {item.plan}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                                                Delivery
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5 text-sm font-bold text-zinc-600 shadow-[inset_0_1px_1px_rgba(255,255,255,1),inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:bg-zinc-800/50 dark:text-zinc-300 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                                                <Clock className="h-3.5 w-3.5" />
                                                {item.delivery}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-5">
                                    <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                                        Total
                                    </span>
                                    <span className="drop-icon-subtle dark:drop-icon-md text-2xl font-black text-zinc-900 dark:text-white">
                                        {item.price}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={handlePay}
                                    className="neo-btn-accent group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-black tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
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
                                                className="drop-icon flex items-center gap-2"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Payment Accepted!
                                            </motion.span>
                                        ) : isProcessing ? (
                                            <motion.span
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="drop-icon flex items-center gap-2"
                                            >
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Processing…
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="idle"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="drop-icon flex items-center gap-2"
                                            >
                                                Pay Now
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>

                            <div className="rounded-[2rem] border border-cyan-100/50 bg-gradient-to-b from-cyan-50 to-white p-5 shadow-[0_4px_12px_rgba(34,211,238,0.1),inset_0_0_0_1px_rgba(34,211,238,0.2),inset_0_2px_4px_rgba(255,255,255,0.8)] dark:border-cyan-900/50 dark:from-cyan-950/40 dark:to-zinc-900 dark:shadow-[0_4px_12px_rgba(34,211,238,0.05),inset_0_0_0_1px_rgba(34,211,238,0.2),inset_0_1px_2px_rgba(255,255,255,0.1)]">
                                <h4 className="mb-1.5 flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400">
                                    <Shield className="h-4 w-4 drop-shadow-[0_1px_1px_rgba(34,211,238,0.3)]" />{' '}
                                    Secure Purchase
                                </h4>
                                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
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
