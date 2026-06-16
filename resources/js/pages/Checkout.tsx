import type { SharedPageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowRight,
    Clock,
    CreditCard,
    Lock,
    RefreshCw,
    Settings,
    Shield,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CheckoutItem {
    service: string;
    plan: string;
    price: string;
    delivery: string;
    category: string;
    subcategory: string;
    subcategory_id: number;
    offer_token?: string;
    milestone_id?: number | null;
}

interface Props {
    item: CheckoutItem;
}

type Currency = 'USD' | 'BDT';

export default function Checkout({ item }: Props) {
    const { auth } = usePage<SharedPageProps>().props;
    const [currency, setCurrency] = useState<Currency>('USD');
    const [bdtRate, setBdtRate] = useState<number | null>(null);
    const [rateLoading, setRateLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const sslBtnRef = useRef<HTMLButtonElement>(null);
    const sslScriptLoaded = useRef(false);

    const REQUIRED_FIELDS: { key: keyof typeof auth.user; label: string }[] = [
        { key: 'name', label: 'Full Name' },
        { key: 'email', label: 'Email Address' },
        { key: 'phone_number', label: 'Phone Number' },
        { key: 'address', label: 'Address' },
        { key: 'country', label: 'Country' },
    ];

    const usdAmount = parseFloat(item.price.replace(/[^0-9.]/g, ''));

    useEffect(() => {
        fetch('/checkout/exchange-rate')
            .then((r) => r.json())
            .then((data) => {
                if (data.rate) {
                    setBdtRate(data.rate);
                }
            })
            .catch(() => {})
            .finally(() => setRateLoading(false));
    }, []);

    const handlePay = () => {
        const missing = REQUIRED_FIELDS.filter(
            ({ key }) => !auth.user?.[key],
        ).map(({ label }) => label);

        if (missing.length > 0) {
            setMissingFields(missing);

            return;
        }

        setIsProcessing(true);

        if (sslBtnRef.current) {
            (sslBtnRef.current as any).postdata = {
                currency,
                category_id: item.category,
                subcategory_id: item.subcategory_id,
                service: item.service,
                plan: item.plan,
                delivery: item.delivery,
                subcategory: item.subcategory,
                ...(item.offer_token ? { offer_token: item.offer_token } : {}),
                ...(item.milestone_id
                    ? { milestone_id: item.milestone_id }
                    : {}),
            };
        }

        if (sslScriptLoaded.current) {
            setIsProcessing(false);
            setTimeout(() => sslBtnRef.current?.click(), 100);
        } else {
            const script = document.createElement('script');
            script.src = `https://sandbox.sslcommerz.com/embed.min.js?${Math.random().toString(36).substring(7)}`;
            script.onload = () => {
                sslScriptLoaded.current = true;
                setIsProcessing(false);
                setTimeout(() => sslBtnRef.current?.click(), 300);
            };
            document.body.appendChild(script);
        }
    };

    const displayPrice =
        currency === 'BDT' && bdtRate !== null
            ? `৳${(usdAmount * bdtRate).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`
            : item.price;

    return (
        <>
            <Head title="Checkout — Opticore" />

            <div className="relative min-h-screen pb-24">
                <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] bg-radial from-cyan-500/5 to-transparent" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] bg-radial from-violet-600/5 to-transparent" />

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
                        {/* Payment Method */}
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

                                {/* SSLCommerz — always selected */}
                                <div className="flex w-full items-center gap-4 rounded-2xl bg-gradient-to-b from-cyan-50/50 to-white p-5 shadow-[0_0_32px_rgba(34,211,238,0.2),0_8px_24px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(34,211,238,0.4),inset_0_2px_4px_rgba(255,255,255,0.8)] dark:from-cyan-950/30 dark:to-zinc-900 dark:shadow-[0_0_32px_rgba(34,211,238,0.15),0_8px_24px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(34,211,238,0.4),inset_0_1px_2px_rgba(255,255,255,0.15)]">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] dark:bg-cyan-500/20 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                                        <CreditCard className="drop-icon-sm h-5 w-5 text-cyan-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white">
                                                SSLCommerz
                                            </span>
                                            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400">
                                                Coming Soon
                                            </span>
                                        </div>
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                            Bangladesh's leading secure payment
                                            gateway
                                        </div>
                                    </div>
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_2px_8px_rgba(34,211,238,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] dark:from-cyan-500 dark:to-cyan-700 dark:shadow-[0_2px_8px_rgba(34,211,238,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                                        <div className="h-2 w-2 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                                    </div>
                                </div>

                                {/* SSLCommerz info */}
                                <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                                    <div className="mb-3 flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-cyan-500" />
                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                            About SSLCommerz
                                        </span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                        SSLCommerz is Bangladesh's largest and
                                        most trusted payment gateway, processing
                                        transactions for thousands of merchants.
                                        It supports{' '}
                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                            bKash, Nagad, Rocket, Visa,
                                            Mastercard, DBBL Nexus, and 20+ more
                                        </span>{' '}
                                        payment options — all under a single,
                                        PCI-DSS compliant, SSL-encrypted
                                        checkout.
                                    </p>
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        {(
                                            [
                                                {
                                                    label: 'SSL Encrypted',
                                                    icon: Lock,
                                                },
                                                {
                                                    label: 'PCI-DSS Compliant',
                                                    icon: Shield,
                                                },
                                                {
                                                    label: '20+ Methods',
                                                    icon: CreditCard,
                                                },
                                            ] as const
                                        ).map(({ label, icon: Icon }) => (
                                            <div
                                                key={label}
                                                className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-3 text-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05),0_2px_8px_rgba(0,0,0,0.04)] dark:bg-zinc-800 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                                            >
                                                <Icon className="h-4 w-4 text-cyan-500" />
                                                <span className="text-[10px] leading-tight font-semibold text-zinc-600 dark:text-zinc-300">
                                                    {label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <p className="mt-5 flex items-center gap-2 text-xs text-theme-subtle">
                                    <Lock className="h-3.5 w-3.5" /> SSLCommerz
                                    integration coming soon — your order will be
                                    confirmed shortly.
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

                                {/* Total + currency switcher */}
                                <div className="pt-5">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                                            Total
                                        </span>
                                        <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] dark:bg-zinc-800">
                                            {(['USD', 'BDT'] as Currency[]).map(
                                                (c) => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() =>
                                                            setCurrency(c)
                                                        }
                                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                                                            currency === c
                                                                ? 'bg-white text-zinc-900 shadow-[0_1px_4px_rgba(0,0,0,0.1)] dark:bg-zinc-700 dark:text-white'
                                                                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                                                        }`}
                                                    >
                                                        {c}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    {rateLoading && currency === 'BDT' ? (
                                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                            Fetching rate…
                                        </div>
                                    ) : (
                                        <span className="drop-icon-subtle dark:drop-icon-md text-2xl font-black text-zinc-900 dark:text-white">
                                            {displayPrice}
                                        </span>
                                    )}
                                </div>

                                {/* Visible Pay Now button */}
                                <button
                                    type="button"
                                    onClick={handlePay}
                                    disabled={isProcessing}
                                    className="neo-btn-accent group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-4 text-sm font-black tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                                >
                                    {isProcessing ? (
                                        <span className="drop-icon flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Opening payment…
                                        </span>
                                    ) : (
                                        <span className="drop-icon flex items-center gap-2">
                                            Pay Now
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </span>
                                    )}
                                </button>

                                {/* Hidden SSLCommerz trigger — attributes required by embed.min.js */}
                                <button
                                    ref={sslBtnRef}
                                    id="sslczPayBtn"
                                    type="button"
                                    className="hidden"
                                    aria-hidden="true"
                                    {...({
                                        endpoint: '/pay-via-ajax',
                                        order: 'init',
                                    } as Record<string, string>)}
                                />
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

            {/* Missing profile fields modal */}
            {missingFields.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="neo-panel-elevated relative w-full max-w-md rounded-3xl p-8"
                    >
                        <button
                            type="button"
                            onClick={() => setMissingFields([])}
                            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]">
                            <AlertCircle className="h-6 w-6 text-amber-500" />
                        </div>

                        <h3 className="text-lg font-black tracking-tight text-theme">
                            Complete Your Profile First
                        </h3>
                        <p className="mt-2 text-sm text-theme-muted">
                            The following details are required for SSLCommerz to
                            process your payment securely:
                        </p>

                        <ul className="mt-4 space-y-2">
                            {missingFields.map((field) => (
                                <li
                                    key={field}
                                    className="flex items-center gap-2.5 rounded-xl bg-amber-50/60 px-3 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                >
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                    {field}
                                </li>
                            ))}
                        </ul>

                        <p className="mt-5 text-xs text-theme-muted">
                            Head to{' '}
                            <span className="font-semibold text-theme">
                                Account Settings
                            </span>{' '}
                            in your profile to fill in the missing information,
                            then return here to complete your payment.
                        </p>

                        <Link
                            href="/profile?tab=settings"
                            className="neo-btn-accent mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Settings className="h-4 w-4" />
                            Go to Account Settings
                        </Link>
                    </motion.div>
                </div>
            )}
        </>
    );
}
