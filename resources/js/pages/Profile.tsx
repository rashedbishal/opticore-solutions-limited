import type { SharedPageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Settings,
    Shield,
    Bell,
    Camera,
    Loader2,
    Trash2,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/tabs';

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
            className={`neo-panel relative overflow-hidden rounded-3xl p-6 transition-all ${
                isNew ? 'border-cyan-500/40 ring-1 ring-cyan-500/20' : ''
            }`}
        >
            {isNew && (
                <span className="absolute top-4 right-4 rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-[10px] font-black tracking-widest text-cyan-500 uppercase">
                    New
                </span>
            )}

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-cyan-400/15 to-cyan-600/15 text-cyan-500 shadow-[0_2px_8px_rgba(6,182,212,0.15),inset_0_0_0_1px_rgba(6,182,212,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_2px_8px_rgba(6,182,212,0.1),inset_0_0_0_1px_rgba(6,182,212,0.25),inset_0_1px_1px_rgba(255,255,255,0.12)]">
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

                    <div className="grid grid-cols-1 gap-y-2 gap-x-4 text-[10px] sm:flex sm:flex-wrap sm:text-xs">
                        <div className="flex items-center gap-1.5 text-theme-muted">
                            <Clock className="h-3 w-3 text-cyan-500 sm:h-3.5 sm:w-3.5" />
                            Delivery: {invoice.delivery}
                        </div>
                        <div className="flex items-center gap-1.5 text-theme-muted">
                            <PayIcon className="h-3 w-3 text-cyan-500 sm:h-3.5 sm:w-3.5" />
                            {payment.label}
                        </div>
                        <div className="flex items-center gap-1.5 text-theme-muted">
                            <Calendar className="h-3 w-3 text-cyan-500 sm:h-3.5 sm:w-3.5" />
                            {orderedDate}
                        </div>
                    </div>
                </div>

                <div className="flex flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
                    <span className="text-lg font-black text-theme sm:text-xl">
                        {invoice.price}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-500 sm:px-3 sm:py-1 sm:text-[10px]">
                            <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Paid
                        </span>
                        <div className="font-mono text-[9px] text-theme-subtle sm:text-[10px]">
                            #{invoice.invoice_id}
                        </div>
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

    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [promoEmails, setPromoEmails] = useState(true);

    const handleMockSubmit = (e: React.FormEvent, msg: string) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMsg('');
        setTimeout(() => {
            setIsSaving(false);
            setSuccessMsg(msg);
            setTimeout(() => setSuccessMsg(''), 3000);
        }, 1500);
    };

    return (
        <>
            <Head title="My Profile — Opticore" />

            <div className="relative min-h-screen pb-24">
                <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] bg-radial from-cyan-500/5 to-transparent" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] bg-radial from-violet-600/5 to-transparent" />

                <div className="relative mx-auto max-w-5xl px-4 pt-20 sm:pt-32">
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                        className="space-y-10"
                    >
                        {/* Success Banner */}
                        <AnimatePresence>
                            {(newInvoice || successMsg) && (
                                <motion.div
                                    variants={fadeUp}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="flex items-center gap-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 sm:px-6 sm:py-4"
                                >
                                    <CheckCircle className="h-6 w-6 shrink-0 text-emerald-500" />
                                    <div>
                                        <div className="text-sm font-bold text-emerald-500">
                                            {successMsg
                                                ? 'Success'
                                                : 'Payment Successful!'}
                                        </div>
                                        <div className="text-xs text-theme-muted">
                                            {successMsg ? (
                                                successMsg
                                            ) : (
                                                <>
                                                    Your order for{' '}
                                                    <span className="font-semibold">
                                                        {newInvoice?.service}
                                                    </span>{' '}
                                                    has been confirmed. Invoice
                                                    #{newInvoice?.invoice_id}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Tabs defaultValue="overview" className="w-full">
                            <div className="relative">
                                {/* Scroll Indicators: Stronger "Peek" effect */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background via-background/60 to-transparent sm:hidden" />
                                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background via-background/60 to-transparent sm:hidden" />

                                <TabsList className="neo-tab-list mb-8 gap-4 overflow-x-auto overflow-y-hidden sm:gap-6">
                                    {/* L3 — Tab triggers: 3D buttons atop the bar */}
                                    {(
                                        [
                                            {
                                                value: 'overview',
                                                icon: User,
                                                label: 'Overview',
                                            },
                                            {
                                                value: 'settings',
                                                icon: Settings,
                                                label: 'Account Settings',
                                            },
                                            {
                                                value: 'security',
                                                icon: Shield,
                                                label: 'Security',
                                            },
                                            {
                                                value: 'preferences',
                                                icon: Bell,
                                                label: 'Preferences',
                                            },
                                        ] as const
                                    ).map(({ value, icon: Icon, label }) => (
                                        <TabsTrigger
                                            key={value}
                                            value={value}
                                            className="neo-tab-item flex items-center gap-2 px-4 py-2.5 text-xs sm:px-6 sm:py-3 sm:text-sm transition-all duration-300 hover:scale-[1.02]"
                                        >
                                            <Icon className="drop-icon-sm h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            {label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            {/* Overview Tab */}
                            <TabsContent
                                value="overview"
                                className="space-y-8 outline-none sm:space-y-10"
                            >
                                {/* L1 — Profile Overview Card */}
                                <motion.div
                                    variants={fadeUp}
                                    className="neo-panel flex flex-col items-start gap-6 p-6 sm:p-8 sm:flex-row sm:items-center"
                                >
                                    {/* L2 — Avatar: elevated atop the card */}
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-b from-cyan-400/20 to-cyan-600/20 text-cyan-500 shadow-[0_4px_12px_rgba(6,182,212,0.18),inset_0_0_0_1px_rgba(6,182,212,0.25),inset_0_1px_2px_rgba(255,255,255,0.5)] dark:shadow-[0_4px_12px_rgba(6,182,212,0.12),inset_0_0_0_1px_rgba(6,182,212,0.3),inset_0_1px_1px_rgba(255,255,255,0.18)]">
                                        <User className="drop-icon-sm h-10 w-10" />
                                    </div>

                                    <div className="flex-1 w-full">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h1 className="text-xl font-black text-theme sm:text-2xl">
                                                {auth.user?.name}
                                            </h1>
                                            <BadgeCheck className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <div className="mt-1 flex items-center gap-2 text-sm text-theme-muted break-all">
                                            <Mail className="h-4 w-4 shrink-0" />
                                            {auth.user?.email}
                                        </div>
                                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                                            <span className="w-fit rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[9px] font-bold tracking-widest text-cyan-500 uppercase sm:text-[10px]">
                                                Verified Client
                                            </span>
                                            <span className="w-fit rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[9px] font-bold tracking-widest text-theme-muted uppercase sm:text-[10px]">
                                                Member since{' '}
                                                {new Date(
                                                    auth.user
                                                        ?.created_at as string,
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

                                {/* Invoices Section */}
                                <div className="space-y-6">
                                    <motion.div
                                        variants={fadeUp}
                                        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* L2 — Section icon: elevated */}
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-cyan-400/15 to-cyan-600/15 text-cyan-500 shadow-[0_2px_8px_rgba(6,182,212,0.15),inset_0_0_0_1px_rgba(6,182,212,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_2px_8px_rgba(6,182,212,0.1),inset_0_0_0_1px_rgba(6,182,212,0.25),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                                                <FileText className="drop-icon-sm h-5 w-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-theme">
                                                    My Invoices
                                                </h2>
                                                <p className="text-xs text-theme-muted">
                                                    {allInvoices.length} order
                                                    {allInvoices.length !== 1
                                                        ? 's'
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>

                                        {/* L2 — Order More: 3D pill button */}
                                        <Link
                                            href="/hire-us"
                                            className="neo-btn-ghost flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-zinc-600 transition-all hover:scale-105 dark:text-zinc-300"
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
                                </div>
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent
                                value="settings"
                                className="outline-none"
                            >
                                {/* L1 — Settings card */}
                                <motion.form
                                    variants={fadeUp}
                                    onSubmit={(e) =>
                                        handleMockSubmit(
                                            e,
                                            'Profile information updated successfully.',
                                        )
                                    }
                                    className="neo-panel space-y-8 p-6 sm:p-8"
                                >
                                    <div>
                                            <h2 className="text-lg font-bold text-theme sm:text-xl">
                                                Account Settings
                                            </h2>
                                        <p className="text-sm text-theme-muted">
                                            Update your personal information and
                                            profile picture.
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                                        {/* L2 — Avatar upload: 3D elevated container */}
                                        <div className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50 shadow-[0_4px_12px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.9)] dark:border-zinc-600 dark:from-zinc-700 dark:to-zinc-800 dark:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Camera className="h-6 w-6 text-white" />
                                            </div>
                                            <User className="h-10 w-10 text-theme-muted" />
                                        </div>
                                        <div className="text-center sm:text-left">
                                            {/* L2 — Upload button: 3D */}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="neo-btn-ghost rounded-xl text-zinc-600 transition-all hover:scale-[1.02] dark:text-zinc-300"
                                            >
                                                Upload Avatar
                                            </Button>
                                            <p className="mt-2 text-xs text-theme-muted">
                                                JPG, GIF or PNG. Max size of
                                                800K
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="name"
                                                className="text-theme"
                                            >
                                                Full Name
                                            </Label>
                                            {/* L-1 — Input: depressed */}
                                            <Input
                                                id="name"
                                                defaultValue={auth.user?.name}
                                                className="neo-field rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="username"
                                                className="text-theme"
                                            >
                                                Username
                                            </Label>
                                            <Input
                                                id="username"
                                                defaultValue={auth.user?.name
                                                    ?.toLowerCase()
                                                    .replace(/\s+/g, '')}
                                                className="neo-field rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label
                                                htmlFor="email"
                                                className="text-theme"
                                            >
                                                Email Address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                defaultValue={auth.user?.email}
                                                className="neo-field rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-zinc-700">
                                        {/* L2 — Primary button: 3D violet */}
                                        <Button
                                            type="submit"
                                            disabled={isSaving}
                                            className="neo-btn-primary min-w-[140px] rounded-xl transition-all hover:scale-[1.02]"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Save Changes'
                                            )}
                                        </Button>
                                    </div>
                                </motion.form>
                            </TabsContent>

                            {/* Security Tab */}
                            <TabsContent
                                value="security"
                                className="outline-none"
                            >
                                <motion.div
                                    variants={stagger}
                                    className="space-y-8"
                                >
                                    {/* L1 — Change Password card */}
                                    <motion.form
                                        variants={fadeUp}
                                        onSubmit={(e) =>
                                            handleMockSubmit(
                                                e,
                                                'Password changed successfully.',
                                            )
                                        }
                                        className="neo-panel space-y-8 p-6 sm:p-8"
                                    >
                                        <div>
                                            <h2 className="text-lg font-bold text-theme sm:text-xl">
                                                Change Password
                                            </h2>
                                            <p className="text-sm text-theme-muted">
                                                Ensure your account is using a
                                                long, random password to stay
                                                secure.
                                            </p>
                                        </div>

                                        <div className="max-w-md space-y-6">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="current_password"
                                                    className="text-theme"
                                                >
                                                    Current Password
                                                </Label>
                                                <Input
                                                    id="current_password"
                                                    type="password"
                                                    className="neo-field rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="new_password"
                                                    className="text-theme"
                                                >
                                                    New Password
                                                </Label>
                                                <Input
                                                    id="new_password"
                                                    type="password"
                                                    className="neo-field rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="confirm_password"
                                                    className="text-theme"
                                                >
                                                    Confirm New Password
                                                </Label>
                                                <Input
                                                    id="confirm_password"
                                                    type="password"
                                                    className="neo-field rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-start border-t border-slate-200 pt-4 dark:border-zinc-700">
                                            <Button
                                                type="submit"
                                                disabled={isSaving}
                                                className="neo-btn-primary min-w-[160px] rounded-xl transition-all hover:scale-[1.02]"
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    'Update Password'
                                                )}
                                            </Button>
                                        </div>
                                    </motion.form>

                                    {/* L1 — 2FA card */}
                                    <motion.div
                                        variants={fadeUp}
                                        className="neo-panel space-y-6 p-6 sm:p-8"
                                    >
                                        <div>
                                            <h2 className="text-lg font-bold text-theme sm:text-xl">
                                                Two-Factor Authentication
                                            </h2>
                                            <p className="text-sm text-theme-muted">
                                                Add additional security to your
                                                account using two-factor
                                                authentication.
                                            </p>
                                        </div>

                                        {/* L2 — Toggle row: inner card */}
                                        <div className="neo-row flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="font-bold text-theme">
                                                    Secure your account
                                                </div>
                                                <div className="mt-1 text-sm text-theme-muted">
                                                    Two-factor authentication is
                                                    currently{' '}
                                                    {twoFactorEnabled
                                                        ? 'enabled'
                                                        : 'disabled'}
                                                    .
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTwoFactorEnabled(
                                                        !twoFactorEnabled,
                                                    )
                                                }
                                                className={`w-fit transition-colors ${twoFactorEnabled ? 'drop-icon-emerald text-emerald-500' : 'text-theme-muted hover:text-theme'}`}
                                            >
                                                {twoFactorEnabled ? (
                                                    <ToggleRight className="h-10 w-10" />
                                                ) : (
                                                    <ToggleLeft className="h-10 w-10" />
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </TabsContent>

                            {/* Preferences Tab */}
                            <TabsContent
                                value="preferences"
                                className="outline-none"
                            >
                                <motion.div
                                    variants={stagger}
                                    className="space-y-8"
                                >
                                    {/* L1 — Notifications card */}
                                    <motion.div
                                        variants={fadeUp}
                                        className="neo-panel space-y-6 p-6 sm:p-8"
                                    >
                                        <div>
                                            <h2 className="text-lg font-bold text-theme sm:text-xl">
                                                Notifications
                                            </h2>
                                            <p className="text-sm text-theme-muted">
                                                Manage how you receive
                                                communications from Opticore.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            {/* L2 — Notification rows: inner cards */}
                                            <div className="neo-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <div className="text-sm font-bold text-theme">
                                                        Order Updates
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-theme-muted">
                                                        Receive emails about
                                                        your order status.
                                                    </div>
                                                </div>
                                                <ToggleRight className="drop-icon-emerald h-8 w-8 cursor-not-allowed text-emerald-500" />
                                            </div>

                                            <div className="neo-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <div className="text-sm font-bold text-theme">
                                                        Promotional Emails
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-theme-muted">
                                                        Receive offers, updates,
                                                        and marketing emails.
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPromoEmails(
                                                            !promoEmails,
                                                        )
                                                    }
                                                    className={`transition-colors ${promoEmails ? 'drop-icon-emerald text-emerald-500' : 'text-theme-muted'}`}
                                                >
                                                    {promoEmails ? (
                                                        <ToggleRight className="h-8 w-8" />
                                                    ) : (
                                                        <ToggleLeft className="h-8 w-8" />
                                                    )}
                                                </button>
                                            </div>

                                            <div className="neo-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <div className="text-sm font-bold text-theme">
                                                        Security Alerts
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-theme-muted">
                                                        Receive notifications
                                                        for logins and password
                                                        changes.
                                                    </div>
                                                </div>
                                                <ToggleRight className="drop-icon-emerald h-8 w-8 cursor-not-allowed text-emerald-500" />
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Danger Zone */}
                                    <motion.div
                                        variants={fadeUp}
                                        className="relative overflow-hidden rounded-[2rem] border border-red-500/20 bg-gradient-to-b from-red-500/5 to-red-500/10 p-6 sm:p-8 shadow-[0_8px_32px_rgba(239,68,68,0.06),inset_0_0_0_1px_rgba(239,68,68,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(239,68,68,0.04),inset_0_0_0_1px_rgba(239,68,68,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Trash2 className="h-32 w-32 text-red-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <h2 className="text-xl font-bold text-red-500">
                                                Danger Zone
                                            </h2>
                                            <p className="mt-2 mb-6 max-w-xl text-sm text-red-500/70">
                                                Permanently delete your account
                                                and all of your data. This
                                                action cannot be undone. All
                                                your current active orders will
                                                be cancelled.
                                            </p>
                                            {/* L2 — Destructive button: 3D red */}
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                className="rounded-xl border border-red-500/30 bg-gradient-to-b from-red-500/8 to-red-500/15 text-red-500 shadow-[0_2px_8px_rgba(239,68,68,0.1),inset_0_0_0_1px_rgba(239,68,68,0.2),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02] hover:border-red-500 hover:from-red-500 hover:to-red-600 hover:text-white hover:shadow-[0_6px_16px_rgba(239,68,68,0.4),inset_0_0_0_1px_rgba(239,68,68,0.5),inset_0_1px_2px_rgba(255,255,255,0.25)]"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />{' '}
                                                Delete Account
                                            </Button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </TabsContent>
                        <div className="mb-24 sm:mb-0" />
                         </Tabs>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
