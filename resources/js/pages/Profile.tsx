import type { SharedPageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BadgeCheck,
    Bell,
    Briefcase,
    Calendar,
    Camera,
    CheckCircle,
    Clock,
    CreditCard,
    Download,
    FileText,
    Loader2,
    Mail,
    MapPin,
    Package,
    Phone,
    Receipt,
    Settings,
    Shield,
    ShoppingBag,
    ToggleLeft,
    ToggleRight,
    Trash2,
    User,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { update as profileUpdate } from '@/actions/App/Http/Controllers/ProfileController';
import RealtimeTableListener from '@/components/Admin/RealtimeTableListener';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import Modal from '@/components/UI/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/tabs';
import useEchoReady from '@/hooks/useEchoReady';
import ordersRoutes from '@/routes/orders';

interface WorkflowTask {
    id: number;
    task_name: string;
    category: string;
    sub_category: string | null;
    date: string | null;
    state: 'pending' | 'in progress' | 'delivered';
    image_url: string | null;
}

interface Order {
    id: number;
    order_number: string | null;
    invoice_number: string | null;
    category: string | null;
    sub_category: string | null;
    amount: string;
    currency: string | null;
    transaction_id: string;
    date: string | null;
}

interface Props {
    tasks: WorkflowTask[];
    orders: Order[];
}

const TASK_STATE_STYLES: Record<
    WorkflowTask['state'],
    {
        label: string;
        className: string;
        icon: React.ComponentType<{ className?: string }>;
    }
> = {
    pending: {
        label: 'Pending',
        className: 'bg-yellow-500/10 text-yellow-500',
        icon: Clock,
    },
    'in progress': {
        label: 'In Progress',
        className: 'bg-blue-500/10 text-blue-500',
        icon: Loader2,
    },
    delivered: {
        label: 'Delivered',
        className: 'bg-emerald-500/10 text-emerald-500',
        icon: CheckCircle,
    },
};

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

function WorkflowTaskCard({ task }: { task: WorkflowTask }) {
    const stateInfo = TASK_STATE_STYLES[task.state];
    const StateIcon = stateInfo.icon;

    const formattedDate = task.date
        ? new Date(task.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    return (
        <motion.div
            variants={fadeUp}
            className="neo-panel relative overflow-hidden rounded-3xl p-6"
        >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-violet-400/15 to-violet-600/15 text-violet-500 shadow-[0_2px_8px_rgba(139,92,246,0.15),inset_0_0_0_1px_rgba(139,92,246,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_2px_8px_rgba(139,92,246,0.1),inset_0_0_0_1px_rgba(139,92,246,0.25),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                    {task.image_url ? (
                        <img
                            src={task.image_url}
                            alt={task.task_name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <Package className="h-6 w-6" />
                    )}
                </div>

                <div className="flex-1 space-y-3">
                    <div>
                        <div className="text-base font-bold text-theme">
                            {task.task_name}
                        </div>
                        <div className="text-sm text-theme-muted capitalize">
                            {task.category.replace(/-/g, ' ')}
                            {task.sub_category ? ` · ${task.sub_category}` : ''}
                        </div>
                    </div>

                    {formattedDate && (
                        <div className="flex items-center gap-1.5 text-[10px] text-theme-muted sm:text-xs">
                            <Calendar className="h-3 w-3 text-cyan-500 sm:h-3.5 sm:w-3.5" />
                            {formattedDate}
                        </div>
                    )}
                </div>

                <div className="flex flex-row items-center sm:flex-col sm:items-end">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase sm:px-3 sm:py-1 sm:text-[10px] ${stateInfo.className}`}
                    >
                        <StateIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {stateInfo.label}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

function OrderCard({ order }: { order: Order }) {
    const formattedDate = order.date
        ? new Date(order.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    const serviceName =
        order.sub_category ??
        (order.category
            ? order.category.replace(/-/g, ' ')
            : 'Digital Service');

    return (
        <motion.div
            variants={fadeUp}
            className="neo-panel relative overflow-hidden rounded-3xl p-6"
        >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-cyan-400/15 to-cyan-600/15 text-cyan-500 shadow-[0_2px_8px_rgba(6,182,212,0.15),inset_0_0_0_1px_rgba(6,182,212,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_2px_8px_rgba(6,182,212,0.1),inset_0_0_0_1px_rgba(6,182,212,0.25),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                    <FileText className="h-6 w-6" />
                </div>

                <div className="flex-1 space-y-3">
                    <div>
                        <div className="text-base font-bold text-theme capitalize">
                            {serviceName}
                        </div>
                        <div className="font-mono text-sm text-theme-muted">
                            {order.order_number}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-[10px] sm:flex sm:flex-wrap sm:text-xs">
                        <div className="flex items-center gap-1.5 text-theme-muted">
                            <CreditCard className="h-3 w-3 text-cyan-500 sm:h-3.5 sm:w-3.5" />
                            {order.currency}{' '}
                            {Number(order.amount).toLocaleString()}
                        </div>
                        {formattedDate && (
                            <div className="flex items-center gap-1.5 text-theme-muted">
                                <Calendar className="h-3 w-3 text-cyan-500 sm:h-3.5 sm:w-3.5" />
                                {formattedDate}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-500 sm:px-3 sm:py-1 sm:text-[10px]">
                        <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Paid
                    </span>
                    {order.invoice_number && (
                        <a
                            href={ordersRoutes.invoice.url({
                                transaction: order.id,
                            })}
                            download={`Invoice-${order.invoice_number}.pdf`}
                            className="neo-btn-ghost mt-2 flex h-7 w-fit items-center rounded-lg px-2 text-[9px] font-bold text-zinc-600 transition-all hover:scale-105 dark:text-zinc-300"
                        >
                            <Download className="mr-1.5 h-3 w-3 text-cyan-500" />
                            Download Invoice
                        </a>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function Profile() {
    const { auth, flash, tasks, orders } = usePage<SharedPageProps & Props>()
        .props;

    const searchParams = new URLSearchParams(window.location.search);
    const initialTab = searchParams.get('tab') ?? 'overview';

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [promoEmails, setPromoEmails] = useState(true);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(
        !!flash?.payment_success,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const echoReady = useEchoReady();

    const { data, setData, put, processing, wasSuccessful } = useForm({
        name: auth.user?.name ?? '',
        phone_number: (auth.user?.phone_number as string) ?? '',
        address: (auth.user?.address as string) ?? '',
        country: (auth.user?.country as string) ?? '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    return (
        <>
            <Head title="My Profile — Opticore" />

            {echoReady && auth.user && (
                <RealtimeTableListener
                    channel={`App.Models.User.${auth.user.id}`}
                    event="TaskUpdated"
                    only={['tasks']}
                />
            )}

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
                        {/* Payment Success Modal */}
                        {flash?.payment_success && (
                            <Modal
                                open={paymentModalOpen}
                                title="Payment Successful"
                                onClose={() => setPaymentModalOpen(false)}
                            >
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
                                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-theme">
                                                {flash.payment_success.currency}{' '}
                                                {parseFloat(
                                                    flash.payment_success
                                                        .amount,
                                                ).toLocaleString()}
                                            </p>
                                            <p className="mt-1 text-sm text-theme-muted">
                                                Payment confirmed — invoice sent
                                                to your email.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-theme-muted">
                                                Invoice
                                            </span>
                                            <span className="font-mono font-semibold text-theme">
                                                #
                                                {
                                                    flash.payment_success
                                                        .invoice_number
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-theme-muted">
                                                Transaction ID
                                            </span>
                                            <span className="font-mono text-theme-subtle">
                                                {flash.payment_success.tran_id}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        className="neo-btn-primary w-full"
                                        onClick={() =>
                                            setPaymentModalOpen(false)
                                        }
                                    >
                                        Done
                                    </Button>
                                </div>
                            </Modal>
                        )}

                        <Tabs defaultValue={initialTab} className="w-full">
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
                                                value: 'orders',
                                                icon: Receipt,
                                                label: 'Orders',
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
                                            className="neo-tab-item flex items-center gap-2 px-4 py-2.5 text-xs transition-all duration-300 hover:scale-[1.02] sm:px-6 sm:py-3 sm:text-sm"
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
                                    className="neo-panel flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center sm:p-8"
                                >
                                    {/* L2 — Avatar: elevated atop the card */}
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-cyan-400/20 to-cyan-600/20 text-cyan-500 shadow-[0_4px_12px_rgba(6,182,212,0.18),inset_0_0_0_1px_rgba(6,182,212,0.25),inset_0_1px_2px_rgba(255,255,255,0.5)] dark:shadow-[0_4px_12px_rgba(6,182,212,0.12),inset_0_0_0_1px_rgba(6,182,212,0.3),inset_0_1px_1px_rgba(255,255,255,0.18)]">
                                        {previewImage ? (
                                            <img
                                                src={previewImage}
                                                alt="Profile Preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <User className="drop-icon-sm h-10 w-10" />
                                        )}
                                    </div>

                                    <div className="w-full flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h1 className="text-xl font-black text-theme sm:text-2xl">
                                                {auth.user?.name}
                                            </h1>
                                            <BadgeCheck className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <div className="mt-1 flex items-center gap-2 text-sm break-all text-theme-muted">
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
                                                {tasks.length}
                                            </div>
                                            <div className="text-xs font-bold text-theme-muted">
                                                Orders
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Workflow Tasks Section */}
                                <div className="space-y-6">
                                    <motion.div
                                        variants={fadeUp}
                                        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* L2 — Section icon: elevated */}
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-violet-400/15 to-violet-600/15 text-violet-500 shadow-[0_2px_8px_rgba(139,92,246,0.15),inset_0_0_0_1px_rgba(139,92,246,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_2px_8px_rgba(139,92,246,0.1),inset_0_0_0_1px_rgba(139,92,246,0.25),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                                                <Briefcase className="drop-icon-sm h-5 w-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-theme">
                                                    My Workflow
                                                </h2>
                                                <p className="text-xs text-theme-muted">
                                                    {tasks.length} task
                                                    {tasks.length !== 1
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

                                    {tasks.length === 0 ? (
                                        <motion.div
                                            variants={fadeUp}
                                            className="neo-panel flex flex-col items-center gap-3 rounded-3xl p-10 text-center"
                                        >
                                            <Briefcase className="h-10 w-10 text-theme-subtle" />
                                            <p className="text-sm text-theme-muted">
                                                No workflow tasks yet. Once you
                                                place an order, it will appear
                                                here.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            variants={stagger}
                                            initial="hidden"
                                            animate="visible"
                                            className="space-y-4"
                                        >
                                            {tasks.map((task) => (
                                                <WorkflowTaskCard
                                                    key={task.id}
                                                    task={task}
                                                />
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Orders Tab */}
                            <TabsContent
                                value="orders"
                                className="space-y-8 outline-none sm:space-y-10"
                            >
                                <div className="space-y-6">
                                    <motion.div
                                        variants={fadeUp}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-cyan-400/15 to-cyan-600/15 text-cyan-500 shadow-[0_2px_8px_rgba(6,182,212,0.15),inset_0_0_0_1px_rgba(6,182,212,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_2px_8px_rgba(6,182,212,0.1),inset_0_0_0_1px_rgba(6,182,212,0.25),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                                            <Receipt className="drop-icon-sm h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-theme">
                                                My Orders
                                            </h2>
                                            <p className="text-xs text-theme-muted">
                                                {orders.length} order
                                                {orders.length !== 1
                                                    ? 's'
                                                    : ''}{' '}
                                                in progress
                                            </p>
                                        </div>
                                    </motion.div>

                                    {orders.length === 0 ? (
                                        <motion.div
                                            variants={fadeUp}
                                            className="neo-panel flex flex-col items-center gap-3 rounded-3xl p-10 text-center"
                                        >
                                            <Receipt className="h-10 w-10 text-theme-subtle" />
                                            <p className="text-sm text-theme-muted">
                                                No orders are currently being
                                                processed.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            variants={stagger}
                                            initial="hidden"
                                            animate="visible"
                                            className="space-y-4"
                                        >
                                            {orders.map((order) => (
                                                <OrderCard
                                                    key={order.id}
                                                    order={order}
                                                />
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent
                                value="settings"
                                className="outline-none"
                            >
                                <motion.form
                                    variants={fadeUp}
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        put(profileUpdate.url());
                                    }}
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

                                    {wasSuccessful && (
                                        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-500">
                                            <CheckCircle className="h-4 w-4 shrink-0" />
                                            Profile updated successfully.
                                        </div>
                                    )}

                                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <div
                                            onClick={triggerFileInput}
                                            className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50 shadow-[0_4px_12px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.9)] dark:border-zinc-600 dark:from-zinc-700 dark:to-zinc-800 dark:shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_1px_rgba(255,255,255,0.12)]"
                                        >
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Camera className="h-6 w-6 text-white" />
                                            </div>
                                            {previewImage ? (
                                                <img
                                                    src={previewImage}
                                                    alt="Preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <User className="h-10 w-10 text-theme-muted" />
                                            )}
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={triggerFileInput}
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
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                className="neo-field rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="email"
                                                className="text-theme"
                                            >
                                                Email Address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={auth.user?.email}
                                                disabled
                                                className="neo-field rounded-xl opacity-60"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="phone_number"
                                                className="flex items-center gap-1.5 text-theme"
                                            >
                                                <Phone className="h-3.5 w-3.5 text-cyan-500" />
                                                Phone Number
                                                <span className="text-[10px] text-theme-subtle">
                                                    (optional)
                                                </span>
                                            </Label>
                                            <Input
                                                id="phone_number"
                                                type="tel"
                                                placeholder="+880 1XXXXXXXXX"
                                                value={data.phone_number}
                                                onChange={(e) =>
                                                    setData(
                                                        'phone_number',
                                                        e.target.value,
                                                    )
                                                }
                                                className="neo-field rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="country"
                                                className="flex items-center gap-1.5 text-theme"
                                            >
                                                <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                                                Country
                                                <span className="text-[10px] text-theme-subtle">
                                                    (optional)
                                                </span>
                                            </Label>
                                            <Input
                                                id="country"
                                                placeholder="Bangladesh"
                                                value={data.country}
                                                onChange={(e) =>
                                                    setData(
                                                        'country',
                                                        e.target.value,
                                                    )
                                                }
                                                className="neo-field rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label
                                                htmlFor="address"
                                                className="flex items-center gap-1.5 text-theme"
                                            >
                                                <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                                                Address
                                                <span className="text-[10px] text-theme-subtle">
                                                    (optional)
                                                </span>
                                            </Label>
                                            <Input
                                                id="address"
                                                placeholder="93 B, New Eskaton Road, Dhaka"
                                                value={data.address}
                                                onChange={(e) =>
                                                    setData(
                                                        'address',
                                                        e.target.value,
                                                    )
                                                }
                                                className="neo-field rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <p className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs text-theme-muted">
                                        Phone, address and country are required
                                        for payment processing via SSLCommerz.
                                    </p>

                                    <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-zinc-700">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="neo-btn-primary min-w-[140px] rounded-xl transition-all hover:scale-[1.02]"
                                        >
                                            {processing ? (
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
                                        onSubmit={(e) => e.preventDefault()}
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
                                                disabled={false}
                                                className="neo-btn-primary min-w-[160px] rounded-xl transition-all hover:scale-[1.02]"
                                            >
                                                Update Password
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
                                        className="relative overflow-hidden rounded-[2rem] border border-red-500/20 bg-gradient-to-b from-red-500/5 to-red-500/10 p-6 shadow-[0_8px_32px_rgba(239,68,68,0.06),inset_0_0_0_1px_rgba(239,68,68,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] sm:p-8 dark:shadow-[0_8px_32px_rgba(239,68,68,0.04),inset_0_0_0_1px_rgba(239,68,68,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]"
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
