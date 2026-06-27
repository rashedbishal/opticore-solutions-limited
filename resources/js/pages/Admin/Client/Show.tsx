import type { ElementType, ReactNode } from 'react';
import { Link, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    Bell,
    BellOff,
    Briefcase,
    Calendar,
    CheckCircle,
    ChevronLeft,
    Clock,
    CreditCard,
    DollarSign,
    ExternalLink,
    FileText,
    Globe,
    Image as ImageIcon,
    Layers,
    Mail,
    MapPin,
    MessageSquare,
    Package,
    Phone,
    ShoppingBag,
    UserX,
    Workflow,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import useEchoReady from '@/hooks/useEchoReady';
import adminRoutes from '@/routes/admin';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Client {
    id: number;
    name: string;
    email: string;
    phone_number: string | null;
    address: string | null;
    country: string | null;
    avatar: string | null;
    is_deleted: boolean;
    email_verified_at: string | null;
    created_at: string | null;
    notify_order_updates: boolean;
    notify_security_alerts: boolean;
    notify_promotional_emails: boolean;
}

interface TaskRow {
    id: number;
    task_name: string;
    category: string;
    sub_category: string | null;
    state: 'pending' | 'in progress' | 'delivered';
    order_number: string | null;
    date: string | null;
    created_at: string | null;
}

interface OrderRow {
    id: number;
    order_number: string | null;
    amount: number | null;
    currency: string | null;
    status: string | null;
    category: string | null;
    subcategory_name: string | null;
    created_at: string;
}

interface TransactionRow {
    transaction_id: string;
    order_number: string | null;
    amount: number | null;
    currency: string | null;
    status: string | null;
    tran_date: string | null;
    created_at: string;
    card_type: string | null;
}

interface OfferMilestone {
    id: number;
    offer_id: number;
    name: string;
    description: string | null;
    revisions: number;
    delivery_days: number;
    price: string;
    sort_order: number;
}

interface ChatOffer {
    id: number;
    conversation_id: number;
    sub_category_id: number | null;
    category_slug: string | null;
    payment_type: 'single' | 'milestone';
    description: string;
    request_requirements: boolean;
    price: string | null;
    delivery_days: number | null;
    revisions: number | null;
    expires_at: string | null;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    offer_token: string;
    sub_category: {
        id: number;
        name: string;
        image: string | null;
        category_slug: string;
    } | null;
    milestones: OfferMilestone[];
    created_at: string | null;
}

interface ChatMessage {
    id: number;
    sender_type: 'admin' | 'user';
    message: string | null;
    has_attachment: boolean;
    attachment_type: string | null;
    created_at: string | null;
    offer: ChatOffer | null;
}

interface Props {
    client: Client;
    tasks: TaskRow[];
    orders: OrderRow[];
    transactions: TransactionRow[];
    conversation_id: number | null;
    messages: ChatMessage[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-700',
];

function avatarGradient(name: string): string {
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

function formatCategory(slug: string): string {
    return slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

const TASK_STATE_STYLES = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'in progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
} as const;

const ORDER_STATUS_STYLES: Record<string, string> = {
    Complete: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    Cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const MONO_LABEL =
    'font-mono text-[10px] tracking-[0.18em] text-violet-400/50 uppercase';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
    icon: Icon,
    title,
    count,
}: {
    icon: ElementType<{ className?: string }>;
    title: string;
    count?: number;
}) {
    return (
        <div className="flex items-center gap-2 border-b border-white/5 px-6 py-4">
            <Icon className="h-4 w-4 text-violet-400/60" />
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            {count !== undefined && (
                <span className="ml-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] text-violet-400">
                    {count}
                </span>
            )}
        </div>
    );
}

function InfoCard({
    icon: Icon,
    label,
    value,
    mono,
}: {
    icon: ElementType<{ className?: string }>;
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="rounded-lg border border-white/8 bg-white/4 px-4 py-3">
            <div className={`mb-1 flex items-center gap-1.5 ${MONO_LABEL}`}>
                <Icon className="h-3 w-3" />
                {label}
            </div>
            <p
                className={`text-sm font-medium text-white ${mono ? 'font-mono text-xs' : ''}`}
            >
                {value}
            </p>
        </div>
    );
}

function NotifBadge({ on, label }: { on: boolean; label: string }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                on
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/8 bg-white/4 text-zinc-500'
            }`}
        >
            {on ? (
                <Bell className="h-3 w-3" />
            ) : (
                <BellOff className="h-3 w-3" />
            )}
            {label}
        </span>
    );
}

// ─── Read-only Offer Card ─────────────────────────────────────────────────────

const OFFER_STATUS_BADGE: Record<
    ChatOffer['status'],
    { label: string; className: string }
> = {
    pending: {
        label: 'Pending',
        className: 'bg-yellow-500/15 text-yellow-400',
    },
    accepted: {
        label: 'Accepted',
        className: 'bg-emerald-500/15 text-emerald-400',
    },
    declined: { label: 'Declined', className: 'bg-red-500/15 text-red-400' },
    expired: { label: 'Expired', className: 'bg-slate-500/15 text-slate-400' },
};

function OfferCard({ offer }: { offer: ChatOffer }) {
    const totalPrice =
        offer.payment_type === 'single'
            ? parseFloat(offer.price ?? '0')
            : offer.milestones.reduce((sum, m) => sum + parseFloat(m.price), 0);

    const totalDays =
        offer.payment_type === 'single'
            ? (offer.delivery_days ?? 0)
            : offer.milestones.reduce((sum, m) => sum + m.delivery_days, 0);

    const badge = OFFER_STATUS_BADGE[offer.status];

    return (
        <div className="relative w-full max-w-72 overflow-hidden rounded-xl border border-violet-500/20 bg-[#060c1a]/95 shadow-2xl backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
            <div className="flex items-center justify-between border-b border-violet-500/10 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                    <Package size={13} className="text-cyan-400" />
                    <span className="text-[11px] font-semibold tracking-wide text-cyan-400 uppercase">
                        Service Offer
                    </span>
                </div>
                <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                >
                    {badge.label}
                </span>
            </div>
            <div className="p-4">
                {offer.sub_category && (
                    <p className="mb-1 text-sm font-semibold text-white">
                        {offer.sub_category.name}
                    </p>
                )}
                <p className="mb-3 line-clamp-2 text-xs text-slate-400">
                    {offer.description}
                </p>
                <div className="mb-3 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                        <DollarSign size={11} className="text-emerald-400" />
                        <span className="font-semibold text-white">
                            ${totalPrice.toFixed(2)}
                        </span>
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {totalDays} day{totalDays !== 1 ? 's' : ''}
                    </span>
                    {offer.payment_type === 'milestone' ? (
                        <span className="flex items-center gap-1">
                            <Layers size={11} />
                            {offer.milestones.length} milestone
                            {offer.milestones.length !== 1 ? 's' : ''}
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <CreditCard size={11} />
                            Full Payment
                        </span>
                    )}
                </div>
                <a
                    href={`/offer/${offer.offer_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 py-2 text-xs font-semibold text-white transition before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:from-violet-500 hover:to-cyan-500 hover:before:translate-x-full"
                >
                    View Offer Details
                    <ExternalLink size={11} />
                </a>
            </div>
        </div>
    );
}

// ─── Live Chat Echo Listener ──────────────────────────────────────────────────

function ChatEchoListener({
    conversationId,
    onMessage,
}: {
    conversationId: number;
    onMessage: (msg: ChatMessage) => void;
}) {
    useEcho(
        `conversations.${conversationId}`,
        'MessageSent',
        (e: { message: any }) => {
            const m = e.message ?? e;
            onMessage({
                id: m.id,
                sender_type: m.sender_type,
                message: m.message ?? null,
                has_attachment: Boolean(m.attachment_path),
                attachment_type: m.attachment_type ?? null,
                created_at: m.created_at
                    ? new Date(m.created_at)
                          .toLocaleString('sv-SE')
                          .slice(0, 16)
                    : null,
                offer: null,
            });
        },
        [conversationId, onMessage],
    );

    return null;
}

// ─── Realtime Listeners ───────────────────────────────────────────────────────

function AdminTasksListener({
    clientId,
    onTaskUpdated,
    onReloadTasks,
}: {
    clientId: number;
    onTaskUpdated: (task: { id: number; state: TaskRow['state'] }) => void;
    onReloadTasks: () => void;
}) {
    useEcho(
        'admin.tasks',
        'TaskUpdated',
        (e: {
            task: { id: number; user_id: number; state: TaskRow['state'] };
        }) => {
            if (e.task.user_id === clientId) {
                onTaskUpdated(e.task);
            }
        },
        [clientId, onTaskUpdated],
    );
    useEcho('admin.tasks', 'TaskCreated', onReloadTasks, [onReloadTasks]);

    return null;
}

function AdminOrdersListener({ onReload }: { onReload: () => void }) {
    useEcho('admin.orders', 'OrderCreated', onReload, [onReload]);
    useEcho('admin.orders', 'OrderUpdated', onReload, [onReload]);

    return null;
}

function AdminTransactionsListener({ onReload }: { onReload: () => void }) {
    useEcho('admin.transactions', 'TransactionUpdated', onReload, [onReload]);

    return null;
}

function ConversationOfferListener({
    conversationId,
    onStatusChanged,
    onOfferUpdated,
    onOfferDeleted,
}: {
    conversationId: number;
    onStatusChanged: (offerId: number, status: ChatOffer['status']) => void;
    onOfferUpdated: (offer: ChatOffer) => void;
    onOfferDeleted: (messageId: number) => void;
}) {
    useEcho(
        `conversations.${conversationId}`,
        'OfferStatusChanged',
        (e: { offer_id: number; status: ChatOffer['status'] }) => {
            onStatusChanged(e.offer_id, e.status);
        },
        [conversationId, onStatusChanged],
    );
    useEcho(
        `conversations.${conversationId}`,
        'OfferUpdated',
        (e: { offer: any }) => {
            onOfferUpdated(e.offer);
        },
        [conversationId, onOfferUpdated],
    );
    useEcho(
        `conversations.${conversationId}`,
        'OfferDeleted',
        (e: { message_id: number }) => {
            onOfferDeleted(e.message_id);
        },
        [conversationId, onOfferDeleted],
    );

    return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShowClient({
    client,
    tasks: initialTasks,
    orders: initialOrders,
    transactions: initialTransactions,
    conversation_id,
    messages: initialMessages,
}: Props) {
    const echoReady = useEchoReady();

    const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
    const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
    const [transactions, setTransactions] =
        useState<TransactionRow[]>(initialTransactions);
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleNewMessage = (msg: ChatMessage) => {
        setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) {
                return prev;
            }

            return [...prev, msg];
        });
    };

    const handleTaskUpdated = (task: {
        id: number;
        state: TaskRow['state'];
    }) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === task.id ? { ...t, state: task.state } : t,
            ),
        );
    };

    const handleOfferStatusChanged = (
        offerId: number,
        status: ChatOffer['status'],
    ) => {
        setMessages((prev) =>
            prev.map((m) =>
                m.offer?.id === offerId
                    ? { ...m, offer: { ...m.offer!, status } }
                    : m,
            ),
        );
    };

    const handleOfferUpdated = (offer: any) => {
        setMessages((prev) =>
            prev.map((m) =>
                m.offer?.id === offer.id
                    ? {
                          ...m,
                          offer: {
                              ...m.offer!,
                              status: offer.status,
                              description: offer.description,
                              price: offer.price,
                              delivery_days: offer.delivery_days,
                              revisions: offer.revisions,
                              payment_type: offer.payment_type,
                              milestones:
                                  offer.milestones ?? m.offer!.milestones,
                              sub_category:
                                  offer.sub_category ?? m.offer!.sub_category,
                          },
                      }
                    : m,
            ),
        );
    };

    const handleOfferDeleted = (messageId: number) => {
        setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, offer: null } : m)),
        );
    };

    return (
        <div className="space-y-6">
            {/* Realtime listeners */}
            {echoReady && (
                <>
                    <AdminTasksListener
                        clientId={client.id}
                        onTaskUpdated={handleTaskUpdated}
                        onReloadTasks={() =>
                            router.reload({
                                only: ['tasks'],
                                onSuccess: (page) =>
                                    setTasks(
                                        (page.props as unknown as Props).tasks,
                                    ),
                            })
                        }
                    />
                    <AdminOrdersListener
                        onReload={() =>
                            router.reload({
                                only: ['orders'],
                                onSuccess: (page) =>
                                    setOrders(
                                        (page.props as unknown as Props).orders,
                                    ),
                            })
                        }
                    />
                    <AdminTransactionsListener
                        onReload={() =>
                            router.reload({
                                only: ['transactions'],
                                onSuccess: (page) =>
                                    setTransactions(
                                        (page.props as unknown as Props)
                                            .transactions,
                                    ),
                            })
                        }
                    />
                    {conversation_id && (
                        <>
                            <ChatEchoListener
                                conversationId={conversation_id}
                                onMessage={handleNewMessage}
                            />
                            <ConversationOfferListener
                                conversationId={conversation_id}
                                onStatusChanged={handleOfferStatusChanged}
                                onOfferUpdated={handleOfferUpdated}
                                onOfferDeleted={handleOfferDeleted}
                            />
                        </>
                    )}
                </>
            )}

            {/* ── Page header ── */}
            <div className="flex items-center gap-4">
                <Link
                    href={adminRoutes.clients.index.url()}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-slate-400 transition-colors hover:bg-violet-500/10 hover:text-violet-400"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div>
                    <p className="font-mono text-[10px] tracking-[0.22em] text-violet-400/40 uppercase">
                        Client Profile
                    </p>
                    <h1 className="text-2xl font-bold text-white">
                        {client.name}
                    </h1>
                </div>
            </div>

            {/* ── Profile card ── */}
            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

                <div className="flex flex-wrap items-center gap-5 px-6 py-5">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        {client.avatar ? (
                            <img
                                src={client.avatar}
                                alt={client.name}
                                className="h-20 w-20 rounded-2xl object-cover"
                            />
                        ) : (
                            <div
                                className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarGradient(client.name)} text-2xl font-bold text-white`}
                                style={{
                                    boxShadow: '0 0 24px rgba(124,58,237,0.25)',
                                }}
                            >
                                {getInitials(client.name)}
                            </div>
                        )}
                        {client.is_deleted && (
                            <span
                                className="absolute -right-1.5 -bottom-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-red-500/40 bg-red-500/20"
                                title="Account deleted"
                            >
                                <UserX className="h-3 w-3 text-red-400" />
                            </span>
                        )}
                    </div>

                    {/* Identity */}
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-bold text-white">
                                {client.name}
                            </h2>
                            {client.is_deleted ? (
                                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 font-mono text-[10px] text-red-400">
                                    Deleted
                                </span>
                            ) : client.email_verified_at ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] text-emerald-400">
                                    <CheckCircle className="h-2.5 w-2.5" />
                                    Verified
                                </span>
                            ) : (
                                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] text-amber-400">
                                    Unverified
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-400">
                            {client.email}
                        </p>
                        {client.created_at && (
                            <p className="mt-1 font-mono text-[10px] text-violet-400/40">
                                Joined {client.created_at}
                            </p>
                        )}
                    </div>

                    {/* Quick stats */}
                    <div className="flex shrink-0 flex-wrap gap-3">
                        <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 px-4 py-3 text-center">
                            <p className="text-xl font-bold text-violet-300">
                                {tasks.length}
                            </p>
                            <p className={MONO_LABEL}>Workflows</p>
                        </div>
                        <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3 text-center">
                            <p className="text-xl font-bold text-cyan-300">
                                {orders.length}
                            </p>
                            <p className={MONO_LABEL}>Orders</p>
                        </div>
                        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 text-center">
                            <p className="text-xl font-bold text-emerald-300">
                                {transactions.length}
                            </p>
                            <p className={MONO_LABEL}>Transactions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Details grid ── */}
            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <SectionHeader icon={Mail} title="Contact & Account Details" />
                <div className="space-y-4 p-6">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <InfoCard
                            icon={Mail}
                            label="Email"
                            value={client.email}
                        />
                        {client.phone_number && (
                            <InfoCard
                                icon={Phone}
                                label="Phone"
                                value={client.phone_number}
                            />
                        )}
                        {client.country && (
                            <InfoCard
                                icon={Globe}
                                label="Country"
                                value={client.country}
                            />
                        )}
                        {client.address && (
                            <InfoCard
                                icon={MapPin}
                                label="Address"
                                value={client.address}
                            />
                        )}
                        {client.created_at && (
                            <InfoCard
                                icon={Calendar}
                                label="Joined"
                                value={client.created_at}
                                mono
                            />
                        )}
                        {client.email_verified_at && (
                            <InfoCard
                                icon={CheckCircle}
                                label="Email Verified"
                                value={client.email_verified_at}
                                mono
                            />
                        )}
                    </div>

                    {/* Notification preferences */}
                    <div>
                        <p className={`mb-2 ${MONO_LABEL}`}>
                            Notification Preferences
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <NotifBadge
                                on={client.notify_order_updates}
                                label="Order Updates"
                            />
                            <NotifBadge
                                on={client.notify_security_alerts}
                                label="Security Alerts"
                            />
                            <NotifBadge
                                on={client.notify_promotional_emails}
                                label="Promotional Emails"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Workflows ── */}
            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <SectionHeader
                    icon={Workflow}
                    title="Workflows"
                    count={tasks.length}
                />
                <div className="max-h-64 overflow-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-violet-500/10 bg-[#060c1a]">
                                {[
                                    'Order #',
                                    'Task',
                                    'Category',
                                    'Status',
                                    'Date',
                                    '',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-5 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase last:text-right"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-10 text-center font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase"
                                    >
                                        No workflows yet
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                                    >
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="font-mono text-xs font-semibold text-violet-400">
                                                {t.order_number ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                                <span className="text-sm text-white">
                                                    {t.task_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div>
                                                <span className="text-sm text-zinc-300 capitalize">
                                                    {formatCategory(t.category)}
                                                </span>
                                                {t.sub_category && (
                                                    <p className="text-xs text-zinc-500">
                                                        {t.sub_category}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span
                                                className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wider capitalize ${TASK_STATE_STYLES[t.state]}`}
                                            >
                                                {t.state}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-sm whitespace-nowrap text-zinc-500">
                                            {t.date ?? '—'}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <Link
                                                href={adminRoutes.tasks.show.url(
                                                    t.id,
                                                )}
                                                className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wide text-violet-400/60 transition-colors hover:text-violet-300"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Orders ── */}
            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <SectionHeader
                    icon={ShoppingBag}
                    title="Orders"
                    count={orders.length}
                />
                <div className="max-h-64 overflow-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-violet-500/10 bg-[#060c1a]">
                                {[
                                    'Order #',
                                    'Amount',
                                    'Category',
                                    'Status',
                                    'Date',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-5 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-10 text-center font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase"
                                    >
                                        No orders yet
                                    </td>
                                </tr>
                            ) : (
                                orders.map((o) => (
                                    <tr
                                        key={o.id}
                                        className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                                    >
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="font-mono text-xs font-semibold text-violet-400">
                                                {o.order_number ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="font-semibold text-white">
                                                {o.currency}{' '}
                                                {o.amount != null
                                                    ? Number(
                                                          o.amount,
                                                      ).toLocaleString()
                                                    : '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div>
                                                {o.category ? (
                                                    <span className="font-mono text-xs text-cyan-400/80">
                                                        {formatCategory(
                                                            o.category,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-600">
                                                        —
                                                    </span>
                                                )}
                                                {o.subcategory_name && (
                                                    <p className="text-xs text-zinc-500">
                                                        {o.subcategory_name}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span
                                                className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wider ${ORDER_STATUS_STYLES[o.status ?? ''] ?? 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400'}`}
                                            >
                                                {o.status ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-sm whitespace-nowrap text-zinc-500">
                                            {o.created_at
                                                ? new Date(
                                                      o.created_at,
                                                  ).toLocaleDateString(
                                                      'en-US',
                                                      {
                                                          year: 'numeric',
                                                          month: 'short',
                                                          day: 'numeric',
                                                      },
                                                  )
                                                : '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Transactions ── */}
            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <SectionHeader
                    icon={CreditCard}
                    title="Transactions"
                    count={transactions.length}
                />
                <div className="max-h-64 overflow-auto">
                    <table className="w-full" style={{ minWidth: '640px' }}>
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-violet-500/10 bg-[#060c1a]">
                                {[
                                    'Order #',
                                    'Transaction ID',
                                    'Amount',
                                    'Card',
                                    'Status',
                                    'Date',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-5 py-3 text-left font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/60 uppercase"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-10 text-center font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase"
                                    >
                                        No transactions yet
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn) => (
                                    <tr
                                        key={txn.transaction_id}
                                        className="border-b border-white/4 transition-colors last:border-0 hover:bg-violet-500/5"
                                    >
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="font-mono text-xs font-semibold text-violet-400">
                                                {txn.order_number ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="font-mono text-xs text-zinc-400">
                                                {txn.transaction_id}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span className="font-semibold text-white">
                                                {txn.currency}{' '}
                                                {txn.amount != null
                                                    ? Number(
                                                          txn.amount,
                                                      ).toLocaleString()
                                                    : '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-xs whitespace-nowrap text-zinc-400">
                                            {txn.card_type ?? '—'}
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <span
                                                className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wider ${ORDER_STATUS_STYLES[txn.status ?? ''] ?? 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400'}`}
                                            >
                                                {txn.status ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-sm whitespace-nowrap text-zinc-500">
                                            {txn.tran_date ?? txn.created_at}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Chat History ── */}
            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <div className="flex items-center gap-2 border-b border-white/5 px-6 py-4">
                    <MessageSquare className="h-4 w-4 text-violet-400/60" />
                    <h2 className="text-sm font-semibold text-white">
                        Chat History
                    </h2>
                    {messages.length > 0 && (
                        <span className="ml-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] text-violet-400">
                            {messages.length}
                        </span>
                    )}
                    {conversation_id && echoReady && (
                        <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-emerald-400/60 uppercase">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            Live
                        </span>
                    )}
                </div>

                {!conversation_id ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <MessageSquare className="h-8 w-8 text-violet-500/20" />
                        <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                            No conversation started
                        </p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <MessageSquare className="h-8 w-8 text-violet-500/20" />
                        <p className="font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                            No messages yet
                        </p>
                    </div>
                ) : (
                    <div className="max-h-64 space-y-3 overflow-y-auto p-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className="max-w-[75%]">
                                    {/* Sender label */}
                                    <p
                                        className={`mb-1 font-mono text-[9px] tracking-[0.15em] uppercase ${msg.sender_type === 'admin' ? 'text-right text-violet-400/40' : 'text-cyan-400/40'}`}
                                    >
                                        {msg.sender_type === 'admin'
                                            ? 'Admin'
                                            : client.name}
                                    </p>
                                    {msg.offer ? (
                                        <OfferCard offer={msg.offer} />
                                    ) : (
                                        <div
                                            className={`rounded-2xl px-4 py-2.5 text-sm ${
                                                msg.sender_type === 'admin'
                                                    ? 'rounded-br-none bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-[0_4px_20px_rgba(124,58,237,0.25)]'
                                                    : 'rounded-bl-none border border-violet-500/10 bg-[#060c1a]/80 text-slate-200'
                                            }`}
                                        >
                                            {msg.has_attachment && (
                                                <div className="mb-1.5 flex items-center gap-1.5 text-xs opacity-70">
                                                    {msg.attachment_type ===
                                                    'image' ? (
                                                        <ImageIcon className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <FileText className="h-3.5 w-3.5" />
                                                    )}
                                                    Attachment
                                                </div>
                                            )}
                                            {msg.message && (
                                                <p className="break-words whitespace-pre-wrap">
                                                    {msg.message}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {msg.created_at && (
                                        <p
                                            className={`mt-0.5 font-mono text-[9px] text-zinc-600 ${msg.sender_type === 'admin' ? 'text-right' : ''}`}
                                        >
                                            {msg.created_at}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
        </div>
    );
}

ShowClient.layout = (page: ReactNode) => (
    <AdminLayout title="Client Profile">{page}</AdminLayout>
);
