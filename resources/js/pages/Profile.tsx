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
                <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[140px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[140px]" />

                <div className="relative mx-auto max-w-5xl px-4 pt-32">
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
                                    className="flex items-center gap-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4"
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
                            <TabsList className="bg-theme-surface/50 hide-scrollbar mb-8 flex w-full justify-start overflow-x-auto rounded-[2rem] border border-theme p-2 backdrop-blur-md">
                                <TabsTrigger
                                    value="overview"
                                    className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-colors data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-500"
                                >
                                    <User className="h-4 w-4" /> Overview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="settings"
                                    className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-colors data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-500"
                                >
                                    <Settings className="h-4 w-4" /> Account
                                    Settings
                                </TabsTrigger>
                                <TabsTrigger
                                    value="security"
                                    className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-colors data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-500"
                                >
                                    <Shield className="h-4 w-4" /> Security
                                </TabsTrigger>
                                <TabsTrigger
                                    value="preferences"
                                    className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-colors data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-500"
                                >
                                    <Bell className="h-4 w-4" /> Preferences
                                </TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent
                                value="overview"
                                className="space-y-10 outline-none"
                            >
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
                                                    {allInvoices.length !== 1
                                                        ? 's'
                                                        : ''}
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
                                </div>
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent
                                value="settings"
                                className="outline-none"
                            >
                                <motion.form
                                    variants={fadeUp}
                                    onSubmit={(e) =>
                                        handleMockSubmit(
                                            e,
                                            'Profile information updated successfully.',
                                        )
                                    }
                                    className="glass-panel space-y-8 rounded-[2rem] border-theme p-8"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-theme">
                                            Account Settings
                                        </h2>
                                        <p className="text-sm text-theme-muted">
                                            Update your personal information and
                                            profile picture.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-dashed border-theme bg-theme-surface">
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Camera className="h-6 w-6 text-white" />
                                            </div>
                                            <User className="h-10 w-10 text-theme-muted" />
                                        </div>
                                        <div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="rounded-xl border-theme bg-theme-surface hover:bg-theme-surface-hover hover:text-theme"
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
                                            <Input
                                                id="name"
                                                defaultValue={auth.user?.name}
                                                className="bg-theme-surface/50 rounded-xl border-theme text-theme"
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
                                                className="bg-theme-surface/50 rounded-xl border-theme text-theme"
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
                                                className="bg-theme-surface/50 rounded-xl border-theme text-theme"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end border-t border-theme pt-4">
                                        <Button
                                            type="submit"
                                            disabled={isSaving}
                                            className="min-w-[140px] rounded-xl bg-violet-600 text-white hover:bg-violet-700"
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
                                    <motion.form
                                        variants={fadeUp}
                                        onSubmit={(e) =>
                                            handleMockSubmit(
                                                e,
                                                'Password changed successfully.',
                                            )
                                        }
                                        className="glass-panel space-y-8 rounded-[2rem] border-theme p-8"
                                    >
                                        <div>
                                            <h2 className="text-xl font-bold text-theme">
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
                                                    className="bg-theme-surface/50 rounded-xl border-theme text-theme"
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
                                                    className="bg-theme-surface/50 rounded-xl border-theme text-theme"
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
                                                    className="bg-theme-surface/50 rounded-xl border-theme text-theme"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-start border-t border-theme pt-4">
                                            <Button
                                                type="submit"
                                                disabled={isSaving}
                                                className="min-w-[160px] rounded-xl bg-violet-600 text-white hover:bg-violet-700"
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    'Update Password'
                                                )}
                                            </Button>
                                        </div>
                                    </motion.form>

                                    <motion.div
                                        variants={fadeUp}
                                        className="glass-panel space-y-6 rounded-[2rem] border-theme p-8"
                                    >
                                        <div>
                                            <h2 className="text-xl font-bold text-theme">
                                                Two-Factor Authentication
                                            </h2>
                                            <p className="text-sm text-theme-muted">
                                                Add additional security to your
                                                account using two-factor
                                                authentication.
                                            </p>
                                        </div>

                                        <div className="bg-theme-surface/30 flex items-center justify-between rounded-2xl border border-theme p-6">
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
                                                className={`transition-colors ${twoFactorEnabled ? 'text-emerald-500' : 'text-theme-muted hover:text-theme'}`}
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
                                    <motion.div
                                        variants={fadeUp}
                                        className="glass-panel space-y-6 rounded-[2rem] border-theme p-8"
                                    >
                                        <div>
                                            <h2 className="text-xl font-bold text-theme">
                                                Notifications
                                            </h2>
                                            <p className="text-sm text-theme-muted">
                                                Manage how you receive
                                                communications from Opticore.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-theme-surface/30 flex items-center justify-between rounded-2xl border border-theme p-4">
                                                <div>
                                                    <div className="text-sm font-bold text-theme">
                                                        Order Updates
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-theme-muted">
                                                        Receive emails about
                                                        your order status.
                                                    </div>
                                                </div>
                                                <ToggleRight className="h-8 w-8 cursor-not-allowed text-emerald-500" />
                                            </div>

                                            <div className="bg-theme-surface/30 flex items-center justify-between rounded-2xl border border-theme p-4">
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
                                                    className={`transition-colors ${promoEmails ? 'text-emerald-500' : 'text-theme-muted'}`}
                                                >
                                                    {promoEmails ? (
                                                        <ToggleRight className="h-8 w-8" />
                                                    ) : (
                                                        <ToggleLeft className="h-8 w-8" />
                                                    )}
                                                </button>
                                            </div>

                                            <div className="bg-theme-surface/30 flex items-center justify-between rounded-2xl border border-theme p-4">
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
                                                <ToggleRight className="h-8 w-8 cursor-not-allowed text-emerald-500" />
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        variants={fadeUp}
                                        className="relative overflow-hidden rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8"
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
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                className="rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 transition-all hover:border-red-500 hover:bg-red-500 hover:text-white"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />{' '}
                                                Delete Account
                                            </Button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
