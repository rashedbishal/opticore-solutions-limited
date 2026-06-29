import type { SharedPageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { m as motion } from 'framer-motion';
import {
    ArrowRight,
    BadgeCheck,
    Bell,
    Briefcase,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
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
import { useEffect, useState } from 'react';
import {
    deleteAccount,
    update as profileUpdate,
    updatePassword,
    updatePreferences,
} from '@/actions/App/Http/Controllers/ProfileController';
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
    order_number: string | null;
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

interface PendingOrder {
    id: string;
    service: string;
    plan: string;
    amount: string;
    currency: string;
    date: string | null;
    checkout_url: string;
}

interface Props {
    tasks: WorkflowTask[];
    orders: Order[];
    pendingOrders: PendingOrder[];
    notifyOrderUpdates: boolean;
    notifySecurityAlerts: boolean;
    notifyPromotionalEmails: boolean;
    isSocialAccount: boolean;
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

const TASKS_PER_PAGE = 4;
const ORDERS_PER_PAGE = 3;
const PENDING_ORDERS_PER_PAGE = 3;

function Pagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-center gap-3 pt-2">
            <button
                type="button"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="neo-btn-ghost flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 dark:text-zinc-300"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-theme-muted">
                Page {page} of {totalPages}
            </span>
            <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="neo-btn-ghost flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 dark:text-zinc-300"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

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
            className="neo-panel relative overflow-hidden rounded-xl p-2.5 sm:rounded-2xl sm:p-4"
        >
            <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-violet-400/15 to-violet-600/15 text-violet-500 shadow-[0_2px_8px_rgba(139,92,246,0.15),inset_0_0_0_1px_rgba(139,92,246,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] sm:h-10 sm:w-10 sm:rounded-xl dark:shadow-[0_2px_8px_rgba(139,92,246,0.1),inset_0_0_0_1px_rgba(139,92,246,0.25),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                    {task.image_url ? (
                        <img
                            src={task.image_url}
                            alt={task.task_name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <Package className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                        <div className="truncate text-xs font-bold text-theme sm:text-sm">
                            {task.task_name}
                        </div>
                        {task.order_number && (
                            <div className="hidden font-mono text-xs text-theme-muted sm:block">
                                {task.order_number}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-x-2 text-[10px] text-theme-muted capitalize sm:text-xs">
                        <span className="truncate">
                            {task.category.replace(/-/g, ' ')}
                            {task.sub_category ? ` · ${task.sub_category}` : ''}
                        </span>
                        {formattedDate && (
                            <span className="hidden items-center gap-1 normal-case sm:flex">
                                <Calendar className="h-3 w-3 text-cyan-500" />
                                {formattedDate}
                            </span>
                        )}
                    </div>
                </div>

                <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase sm:px-3 sm:py-1 sm:text-[10px] ${stateInfo.className}`}
                >
                    <StateIcon className="hidden h-2.5 w-2.5 sm:block" />
                    {stateInfo.label}
                </span>
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
            className="neo-panel relative overflow-hidden rounded-xl p-2.5 sm:rounded-2xl sm:p-4"
        >
            <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-cyan-400/15 to-cyan-600/15 text-cyan-500 shadow-[0_2px_8px_rgba(6,182,212,0.15),inset_0_0_0_1px_rgba(6,182,212,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] sm:h-10 sm:w-10 sm:rounded-xl dark:shadow-[0_2px_8px_rgba(6,182,212,0.1),inset_0_0_0_1px_rgba(6,182,212,0.25),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                    <FileText className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                        <div className="truncate text-xs font-bold text-theme capitalize sm:text-sm">
                            {serviceName}
                        </div>
                        <div className="hidden font-mono text-xs text-theme-muted sm:block">
                            {order.order_number}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-theme-muted sm:text-xs">
                        <span className="flex items-center gap-1">
                            <CreditCard className="h-2.5 w-2.5 text-cyan-500 sm:h-3 sm:w-3" />
                            {order.currency}{' '}
                            {Number(order.amount).toLocaleString()}
                        </span>
                        {formattedDate && (
                            <span className="hidden items-center gap-1 sm:flex">
                                <Calendar className="h-3 w-3 text-cyan-500" />
                                {formattedDate}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500 sm:px-3 sm:py-1 sm:text-[10px]">
                        <CheckCircle className="hidden h-2.5 w-2.5 sm:block" />
                        Paid
                    </span>
                    {order.invoice_number && (
                        <a
                            href={ordersRoutes.invoice.url({
                                transaction: order.id,
                            })}
                            download={`Invoice-${order.invoice_number}.pdf`}
                            className="neo-btn-ghost flex h-6 w-fit items-center rounded-lg px-1.5 text-[9px] font-bold text-zinc-600 transition-all hover:scale-105 sm:h-7 sm:px-2 dark:text-zinc-300"
                        >
                            <Download className="h-3 w-3 text-cyan-500 sm:mr-1.5" />
                            <span className="hidden sm:inline">
                                Download Invoice
                            </span>
                        </a>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function PendingOrderCard({ order }: { order: PendingOrder }) {
    const formattedDate = order.date
        ? new Date(order.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    return (
        <Link href={order.checkout_url} className="block">
            <motion.div
                variants={fadeUp}
                className="neo-panel group relative cursor-pointer overflow-hidden rounded-xl p-2.5 sm:rounded-2xl sm:p-4"
            >
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-amber-400/15 to-amber-600/15 text-amber-500 shadow-[0_2px_8px_rgba(245,158,11,0.15),inset_0_0_0_1px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] sm:h-10 sm:w-10 sm:rounded-xl dark:shadow-[0_2px_8px_rgba(245,158,11,0.1),inset_0_0_0_1px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                        <Clock className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                            <div className="truncate text-xs font-bold text-theme capitalize sm:text-sm">
                                {order.service}
                            </div>
                            <div className="shrink-0 text-[10px] text-theme-muted sm:text-xs">
                                {order.plan}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-theme-muted sm:text-xs">
                            <span className="flex items-center gap-1">
                                <CreditCard className="h-2.5 w-2.5 text-amber-500 sm:h-3 sm:w-3" />
                                {order.currency}{' '}
                                {Number(order.amount).toLocaleString()}
                            </span>
                            {formattedDate && (
                                <span className="hidden items-center gap-1 sm:flex">
                                    <Calendar className="h-3 w-3 text-amber-500" />
                                    {formattedDate}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-500 sm:px-3 sm:py-1 sm:text-[10px]">
                            <Clock className="hidden h-2.5 w-2.5 sm:block" />
                            <span className="sm:hidden">Pending</span>
                            <span className="hidden sm:inline">
                                Awaiting Payment
                            </span>
                        </span>
                        <span className="neo-btn-ghost hidden h-7 w-fit items-center rounded-lg px-2 text-[9px] font-bold text-zinc-600 transition-all group-hover:scale-105 sm:flex dark:text-zinc-300">
                            Proceed to Checkout
                            <ArrowRight className="ml-1.5 h-3 w-3 text-amber-500" />
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-amber-500 sm:hidden" />
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

export default function Profile() {
    const {
        auth,
        flash,
        tasks = [],
        orders = [],
        pendingOrders = [],
        notifyOrderUpdates = true,
        notifySecurityAlerts = true,
        notifyPromotionalEmails = false,
        isSocialAccount = false,
    } = usePage<SharedPageProps & Props>().props;

    const searchParams = new URLSearchParams(window.location.search);
    const requestedTab = searchParams.get('tab') ?? 'overview';
    const initialTab =
        isSocialAccount && requestedTab === 'security'
            ? 'overview'
            : requestedTab;

    const [promoEmails, setPromoEmails] = useState(notifyPromotionalEmails);
    const [orderUpdates, setOrderUpdates] = useState(notifyOrderUpdates);
    const [securityAlerts, setSecurityAlerts] = useState(notifySecurityAlerts);
    const [paymentModalOpen, setPaymentModalOpen] = useState(
        !!flash?.payment_success,
    );
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Unlike the other two toggles, this one can also change from outside its
    // own click handler (footer newsletter form, admin removing a subscriber),
    // delivered via the realtime partial reload below — keep local state synced.
    useEffect(() => {
        setPromoEmails(notifyPromotionalEmails);
    }, [notifyPromotionalEmails]);

    const {
        data: deleteData,
        setData: setDeleteData,
        delete: deleteSubmit,
        processing: deleteProcessing,
        errors: deleteErrors,
        reset: deleteReset,
    } = useForm({ password: '' });
    const [taskPage, setTaskPage] = useState(1);
    const [orderPage, setOrderPage] = useState(1);
    const [pendingOrderPage, setPendingOrderPage] = useState(1);
    const echoReady = useEchoReady();

    const taskTotalPages = Math.max(
        1,
        Math.ceil(tasks.length / TASKS_PER_PAGE),
    );
    const currentTaskPage = Math.min(taskPage, taskTotalPages);
    const paginatedTasks = tasks.slice(
        (currentTaskPage - 1) * TASKS_PER_PAGE,
        currentTaskPage * TASKS_PER_PAGE,
    );

    const orderTotalPages = Math.max(
        1,
        Math.ceil(orders.length / ORDERS_PER_PAGE),
    );
    const currentOrderPage = Math.min(orderPage, orderTotalPages);
    const paginatedOrders = orders.slice(
        (currentOrderPage - 1) * ORDERS_PER_PAGE,
        currentOrderPage * ORDERS_PER_PAGE,
    );

    const pendingOrderTotalPages = Math.max(
        1,
        Math.ceil(pendingOrders.length / PENDING_ORDERS_PER_PAGE),
    );
    const currentPendingOrderPage = Math.min(
        pendingOrderPage,
        pendingOrderTotalPages,
    );
    const paginatedPendingOrders = pendingOrders.slice(
        (currentPendingOrderPage - 1) * PENDING_ORDERS_PER_PAGE,
        currentPendingOrderPage * PENDING_ORDERS_PER_PAGE,
    );

    const { data, setData, put, processing, wasSuccessful } = useForm({
        name: auth.user?.name ?? '',
        phone_number: (auth.user?.phone_number as string) ?? '',
        address: (auth.user?.address as string) ?? '',
        country: (auth.user?.country as string) ?? '',
    });

    const {
        data: pwData,
        setData: setPwData,
        put: pwPut,
        processing: pwProcessing,
        wasSuccessful: pwWasSuccessful,
        errors: pwErrors,
        reset: pwReset,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    return (
        <>
            <Head title="My Profile — Opticore" />

            {echoReady && auth.user && (
                <>
                    <RealtimeTableListener
                        channel={`App.Models.User.${auth.user.id}`}
                        event="TaskUpdated"
                        only={['tasks']}
                    />
                    <RealtimeTableListener
                        channel={`App.Models.User.${auth.user.id}`}
                        event="PromotionalEmailPreferenceUpdated"
                        only={['notifyPromotionalEmails']}
                    />
                    <RealtimeTableListener
                        channel={`App.Models.User.${auth.user.id}`}
                        event="PendingPaymentDeleted"
                        only={['pendingOrders']}
                    />
                </>
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
                            <div className="relative mb-8">
                                <div className="-my-4 overflow-x-auto overflow-y-hidden py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    <TabsList className="flex h-auto w-full min-w-max gap-2 bg-transparent p-1">
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
                                        )
                                            .filter(
                                                ({ value }) =>
                                                    !(
                                                        isSocialAccount &&
                                                        value === 'security'
                                                    ),
                                            )
                                            .map(
                                                ({
                                                    value,
                                                    icon: Icon,
                                                    label,
                                                }) => (
                                                    <TabsTrigger
                                                        key={value}
                                                        value={value}
                                                        className="profile-tab group neo-btn-ghost relative flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-2.5 text-xs font-semibold text-zinc-600 transition-all duration-300 after:!hidden hover:-translate-y-0.5 hover:text-zinc-900 active:scale-95 data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-b data-[state=active]:from-cyan-400 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] data-[state=active]:hover:translate-y-0 sm:px-6 sm:py-3.5 sm:text-sm dark:text-zinc-400 dark:hover:text-white"
                                                    >
                                                        <Icon className="h-4 w-4 shrink-0" />
                                                        <span>
                                                            {value ===
                                                            'settings' ? (
                                                                <>
                                                                    <span className="sm:hidden">
                                                                        Settings
                                                                    </span>
                                                                    <span className="hidden sm:inline">
                                                                        {label}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                label
                                                            )}
                                                        </span>
                                                    </TabsTrigger>
                                                ),
                                            )}
                                    </TabsList>
                                </div>
                            </div>

                            {/* Overview Tab */}
                            <TabsContent
                                value="overview"
                                className="space-y-8 outline-none sm:space-y-10"
                            >
                                {/* L1 — Profile Overview Card */}
                                <motion.div
                                    variants={fadeUp}
                                    className="neo-panel flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-8"
                                >
                                    {/* L2 — Avatar: elevated atop the card */}
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-cyan-400/20 to-cyan-600/20 text-cyan-500 shadow-[0_4px_12px_rgba(6,182,212,0.18),inset_0_0_0_1px_rgba(6,182,212,0.25),inset_0_1px_2px_rgba(255,255,255,0.5)] sm:h-20 sm:w-20 sm:rounded-3xl dark:shadow-[0_4px_12px_rgba(6,182,212,0.12),inset_0_0_0_1px_rgba(6,182,212,0.3),inset_0_1px_1px_rgba(255,255,255,0.18)]">
                                        <User className="drop-icon-sm h-7 w-7 sm:h-10 sm:w-10" />
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
                                        <div className="mt-2 flex flex-row flex-wrap gap-2 sm:mt-4 sm:gap-3">
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
                                        <>
                                            <motion.div
                                                variants={stagger}
                                                initial="hidden"
                                                animate="visible"
                                                className="space-y-3"
                                            >
                                                {paginatedTasks.map((task) => (
                                                    <WorkflowTaskCard
                                                        key={task.id}
                                                        task={task}
                                                    />
                                                ))}
                                            </motion.div>
                                            <Pagination
                                                page={currentTaskPage}
                                                totalPages={taskTotalPages}
                                                onPageChange={setTaskPage}
                                            />
                                        </>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Orders Tab */}
                            <TabsContent
                                value="orders"
                                className="space-y-8 outline-none sm:space-y-10"
                            >
                                {pendingOrders.length > 0 && (
                                    <div className="space-y-6">
                                        <motion.div
                                            variants={fadeUp}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-400/15 to-amber-600/15 text-amber-500 shadow-[0_2px_8px_rgba(245,158,11,0.15),inset_0_0_0_1px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[0_2px_8px_rgba(245,158,11,0.1),inset_0_0_0_1px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.12)]">
                                                <Clock className="drop-icon-sm h-5 w-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-theme">
                                                    Pending Orders
                                                </h2>
                                                <p className="text-xs text-theme-muted">
                                                    {pendingOrders.length} order
                                                    {pendingOrders.length !== 1
                                                        ? 's'
                                                        : ''}{' '}
                                                    awaiting payment
                                                </p>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            variants={stagger}
                                            initial="hidden"
                                            animate="visible"
                                            className="space-y-3"
                                        >
                                            {paginatedPendingOrders.map(
                                                (order) => (
                                                    <PendingOrderCard
                                                        key={order.id}
                                                        order={order}
                                                    />
                                                ),
                                            )}
                                        </motion.div>
                                        <Pagination
                                            page={currentPendingOrderPage}
                                            totalPages={pendingOrderTotalPages}
                                            onPageChange={setPendingOrderPage}
                                        />
                                    </div>
                                )}

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
                                        <>
                                            <motion.div
                                                variants={stagger}
                                                initial="hidden"
                                                animate="visible"
                                                className="space-y-3"
                                            >
                                                {paginatedOrders.map(
                                                    (order) => (
                                                        <OrderCard
                                                            key={order.id}
                                                            order={order}
                                                        />
                                                    ),
                                                )}
                                            </motion.div>
                                            <Pagination
                                                page={currentOrderPage}
                                                totalPages={orderTotalPages}
                                                onPageChange={setOrderPage}
                                            />
                                        </>
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

                            {/* Security Tab — not rendered for social-login accounts, which have no known password to change */}
                            {!isSocialAccount && (
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
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                pwPut(updatePassword.url(), {
                                                    preserveScroll: true,
                                                    onSuccess: () => pwReset(),
                                                });
                                            }}
                                            className="neo-panel space-y-8 p-6 sm:p-8"
                                        >
                                            <div>
                                                <h2 className="text-lg font-bold text-theme sm:text-xl">
                                                    Change Password
                                                </h2>
                                                <p className="text-sm text-theme-muted">
                                                    Ensure your account is using
                                                    a long, random password to
                                                    stay secure.
                                                </p>
                                            </div>

                                            {pwWasSuccessful && (
                                                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-500">
                                                    <CheckCircle className="h-4 w-4 shrink-0" />
                                                    Password updated
                                                    successfully.
                                                </div>
                                            )}

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
                                                        value={
                                                            pwData.current_password
                                                        }
                                                        onChange={(e) =>
                                                            setPwData(
                                                                'current_password',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="neo-field rounded-xl"
                                                    />
                                                    {pwErrors.current_password && (
                                                        <p className="text-xs text-red-500">
                                                            {
                                                                pwErrors.current_password
                                                            }
                                                        </p>
                                                    )}
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
                                                        value={pwData.password}
                                                        onChange={(e) =>
                                                            setPwData(
                                                                'password',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="neo-field rounded-xl"
                                                    />
                                                    {pwErrors.password && (
                                                        <p className="text-xs text-red-500">
                                                            {pwErrors.password}
                                                        </p>
                                                    )}
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
                                                        value={
                                                            pwData.password_confirmation
                                                        }
                                                        onChange={(e) =>
                                                            setPwData(
                                                                'password_confirmation',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="neo-field rounded-xl"
                                                    />
                                                    {pwErrors.password_confirmation && (
                                                        <p className="text-xs text-red-500">
                                                            {
                                                                pwErrors.password_confirmation
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-start border-t border-slate-200 pt-4 dark:border-zinc-700">
                                                <Button
                                                    type="submit"
                                                    disabled={pwProcessing}
                                                    className="neo-btn-primary min-w-[160px] rounded-xl transition-all hover:scale-[1.02]"
                                                >
                                                    {pwProcessing ? (
                                                        <span className="flex items-center gap-2">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Updating…
                                                        </span>
                                                    ) : (
                                                        'Update Password'
                                                    )}
                                                </Button>
                                            </div>
                                        </motion.form>
                                    </motion.div>
                                </TabsContent>
                            )}

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
                                                        Receive emails when your
                                                        order status changes.
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next =
                                                            !orderUpdates;
                                                        setOrderUpdates(next);
                                                        router.patch(
                                                            updatePreferences.url(),
                                                            {
                                                                notify_order_updates:
                                                                    next,
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    }}
                                                    className={`transition-colors ${orderUpdates ? 'drop-icon-emerald text-emerald-500' : 'text-theme-muted'}`}
                                                >
                                                    {orderUpdates ? (
                                                        <ToggleRight className="h-8 w-8" />
                                                    ) : (
                                                        <ToggleLeft className="h-8 w-8" />
                                                    )}
                                                </button>
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
                                                    onClick={() => {
                                                        const next =
                                                            !promoEmails;
                                                        setPromoEmails(next);
                                                        router.patch(
                                                            updatePreferences.url(),
                                                            {
                                                                notify_promotional_emails:
                                                                    next,
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    }}
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
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next =
                                                            !securityAlerts;
                                                        setSecurityAlerts(next);
                                                        router.patch(
                                                            updatePreferences.url(),
                                                            {
                                                                notify_security_alerts:
                                                                    next,
                                                            },
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    }}
                                                    className={`transition-colors ${securityAlerts ? 'drop-icon-emerald text-emerald-500' : 'text-theme-muted'}`}
                                                >
                                                    {securityAlerts ? (
                                                        <ToggleRight className="h-8 w-8" />
                                                    ) : (
                                                        <ToggleLeft className="h-8 w-8" />
                                                    )}
                                                </button>
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
                                                Deactivate your account and
                                                disable login access. Your
                                                orders and data remain intact.
                                                You can sign up again with the
                                                same email to restore access.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() =>
                                                    setDeleteModalOpen(true)
                                                }
                                                className="rounded-xl border border-red-500/30 bg-gradient-to-b from-red-500/8 to-red-500/15 text-red-500 shadow-[0_2px_8px_rgba(239,68,68,0.1),inset_0_0_0_1px_rgba(239,68,68,0.2),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02] hover:border-red-500 hover:from-red-500 hover:to-red-600 hover:text-white hover:shadow-[0_6px_16px_rgba(239,68,68,0.4),inset_0_0_0_1px_rgba(239,68,68,0.5),inset_0_1px_2px_rgba(255,255,255,0.25)]"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />{' '}
                                                Delete Account
                                            </Button>
                                        </div>
                                    </motion.div>

                                    {/* Delete account confirmation modal */}
                                    <Modal
                                        open={deleteModalOpen}
                                        title="Delete Account"
                                        onClose={() => {
                                            if (!deleteProcessing) {
                                                setDeleteModalOpen(false);
                                                deleteReset();
                                            }
                                        }}
                                    >
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                deleteSubmit(
                                                    deleteAccount.url(),
                                                    {
                                                        onSuccess: () => {
                                                            setDeleteModalOpen(
                                                                false,
                                                            );
                                                            deleteReset();
                                                        },
                                                    },
                                                );
                                            }}
                                            className="space-y-6"
                                        >
                                            {/* Warning notice */}
                                            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                                                <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                                                <p className="text-sm leading-relaxed text-red-500/80">
                                                    {isSocialAccount
                                                        ? 'Your account will be deactivated and you will be signed out immediately. All your orders and data remain intact. You can sign in again with Google or Facebook to restore full access.'
                                                        : 'Your account will be deactivated and you will be signed out immediately. All your orders and data remain intact. You can sign up again with the same email and password to restore full access.'}
                                                </p>
                                            </div>

                                            {/* Password confirmation — only for non-social accounts */}
                                            {!isSocialAccount && (
                                                <div className="space-y-2">
                                                    <Label
                                                        htmlFor="delete_password"
                                                        className="text-theme"
                                                    >
                                                        Confirm your password to
                                                        continue
                                                    </Label>
                                                    <Input
                                                        id="delete_password"
                                                        type="password"
                                                        autoComplete="current-password"
                                                        placeholder="Enter your current password"
                                                        value={
                                                            deleteData.password
                                                        }
                                                        onChange={(e) =>
                                                            setDeleteData(
                                                                'password',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="neo-field rounded-xl"
                                                    />
                                                    {deleteErrors.password && (
                                                        <p className="text-xs text-red-500">
                                                            {
                                                                deleteErrors.password
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={deleteProcessing}
                                                    onClick={() => {
                                                        setDeleteModalOpen(
                                                            false,
                                                        );
                                                        deleteReset();
                                                    }}
                                                    className="rounded-xl"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        deleteProcessing ||
                                                        (!isSocialAccount &&
                                                            !deleteData.password)
                                                    }
                                                    className="rounded-xl border border-red-500/30 bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_rgba(239,68,68,0.4)] disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    {deleteProcessing ? (
                                                        <span className="flex items-center gap-2">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Deleting…
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            <Trash2 className="h-4 w-4" />
                                                            Yes, Delete My
                                                            Account
                                                        </span>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </Modal>
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
