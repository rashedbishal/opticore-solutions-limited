import type { SharedPageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BadgeCheck,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    FileText,
    Mail,
    Package,
    ShoppingBag,
    Smartphone,
    User,
} from 'lucide-react';

interface Invoice {
    invoice_id: string;
    service: string;
    plan: string;
    price: string;
    delivery: string;
    payment_method: string;
    ordered_at: string;
}

interface Props {
    flash: {
        invoice?: Invoice;
        success?: string | null;
        error?: string | null;
    };
}

const PAYMENT_LABELS: Record<
    string,
    { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
    bkash: { label: 'bKash', icon: Smartphone },
    nagad: { label: 'Nagad', icon: Smartphone },
    card: { label: 'Visa / Mastercard', icon: CreditCard },
};

const DEMO_INVOICES: Invoice[] = [
    {
        invoice_id: 'A3F7B2C1',
        service: 'Brand Identity Design',
        plan: 'Premium',
        price: '$25',
        delivery: '7 Days',
        payment_method: 'card',
        ordered_at: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
    },
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

function InvoiceCard({
    invoice,
    isNew,
}: {
    invoice: Invoice;
    isNew?: boolean;
}) {
    const payment = PAYMENT_LABELS[invoice.payment_method] ?? {
        label: invoice.payment_method,
        icon: CreditCard,
    };
    const PayIcon = payment.icon;

    const orderedDate = new Date(invoice.ordered_at).toLocaleDateString(
        'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' },
    );

    return (
        <motion.div
            variants={fadeUp}
            className={`bg-theme-surface/40 hover:bg-theme-surface/60 relative overflow-hidden rounded-3xl border border-theme p-6 transition-colors ${
                isNew ? 'border-cyan-500/40 ring-1 ring-cyan-500/20' : ''
            }`}
        >
            {isNew && (
                <span className="absolute top-4 right-4 rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-[10px] font-black tracking-widest text-cyan-500 uppercase">
                    New
                </span>
            )}

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                    <Package className="h-6 w-6" />
                </div>

                <div className="flex-1 space-y-3">
                    <div>
                        <div className="text-base font-bold text-theme">
                            {invoice.service}
                        </div>
                        <div className="text-sm text-theme-muted">
                            {invoice.plan} Plan
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-theme-muted">
                            <Clock className="h-3.5 w-3.5 text-cyan-500" />
                            Delivery: {invoice.delivery}
                        </div>
                        <div className="flex items-center gap-1.5 text-theme-muted">
                            <PayIcon className="h-3.5 w-3.5 text-cyan-500" />
                            {payment.label}
                        </div>
                        <div className="flex items-center gap-1.5 text-theme-muted">
                            <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                            {orderedDate}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className="text-xl font-black text-theme">
                        {invoice.price}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-500">
                        <CheckCircle className="h-3 w-3" />
                        Paid
                    </span>
                    <div className="font-mono text-[10px] text-theme-subtle">
                        #{invoice.invoice_id}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function Profile() {
    const { auth, flash } = usePage<SharedPageProps & Props>().props;
    const newInvoice = flash?.invoice as Invoice | undefined;
    const allInvoices = newInvoice
        ? [newInvoice, ...DEMO_INVOICES]
        : DEMO_INVOICES;

    return (
        <>
            <Head title="My Profile — Opticore" />

            <div className="relative min-h-screen bg-background pb-24">
                <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[140px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[140px]" />

                <div className="relative mx-auto max-w-5xl px-4 pt-32">
                    {/* Header */}
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                        className="mb-12 space-y-10"
                    >
                        {/* Success Banner */}
                        {newInvoice && (
                            <motion.div
                                variants={fadeUp}
                                className="flex items-center gap-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4"
                            >
                                <CheckCircle className="h-6 w-6 shrink-0 text-emerald-500" />
                                <div>
                                    <div className="text-sm font-bold text-emerald-500">
                                        Payment Successful!
                                    </div>
                                    <div className="text-xs text-theme-muted">
                                        Your order for{' '}
                                        <span className="font-semibold">
                                            {newInvoice.service}
                                        </span>{' '}
                                        has been confirmed. Invoice #
                                        {newInvoice.invoice_id}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Profile Overview */}
                        <motion.div
                            variants={fadeUp}
                            className="glass-panel flex flex-col items-start gap-6 rounded-[2rem] border-theme p-8 sm:flex-row sm:items-center"
                        >
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-500">
                                <User className="h-10 w-10" />
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-black text-theme">
                                        {auth.user?.name}
                                    </h1>
                                    <BadgeCheck className="h-5 w-5 text-cyan-500" />
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-sm text-theme-muted">
                                    <Mail className="h-4 w-4" />
                                    {auth.user?.email}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-3">
                                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-cyan-500 uppercase">
                                        Verified Client
                                    </span>
                                    <span className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-widest text-theme-muted uppercase">
                                        Member since{' '}
                                        {new Date(
                                            auth.user?.created_at as string,
                                        ).getFullYear()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-row gap-4 sm:flex-col sm:items-end">
                                <div className="text-center">
                                    <div className="text-2xl font-black text-theme">
                                        {allInvoices.length}
                                    </div>
                                    <div className="text-xs font-bold text-theme-muted">
                                        Orders
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Invoices Section */}
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        <motion.div
                            variants={fadeUp}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-theme">
                                        My Invoices
                                    </h2>
                                    <p className="text-xs text-theme-muted">
                                        {allInvoices.length} order
                                        {allInvoices.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/hire-us"
                                className="flex items-center gap-2 rounded-full border border-theme bg-theme-surface px-4 py-2 text-xs font-bold text-theme-muted transition-all hover:bg-theme-surface-hover hover:text-theme"
                            >
                                <ShoppingBag className="h-3.5 w-3.5" />
                                Order More
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </motion.div>

                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            animate="visible"
                            className="space-y-4"
                        >
                            {allInvoices.map((invoice, i) => (
                                <InvoiceCard
                                    key={invoice.invoice_id}
                                    invoice={invoice}
                                    isNew={i === 0 && !!newInvoice}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
