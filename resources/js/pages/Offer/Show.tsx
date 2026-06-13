import type { SharedPageProps } from '@/types';
import type { LucideIcon } from 'lucide-react';
import { Head, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import axios from 'axios';
import {
    Box,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Code,
    CreditCard,
    DollarSign,
    Layers,
    Package,
    Palette,
    Plus,
    RotateCcw,
    ShieldAlert,
    Sparkles,
    Trash2,
    TrendingUp,
    Video,
    X,
    XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import AppLayout from '@/components/Layout/AppLayout';
import useEchoReady from '@/hooks/useEchoReady';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
    {
        slug: 'graphic-design',
        label: 'Graphic Design',
        Icon: Palette,
        color: 'from-purple-600 to-violet-700',
    },
    {
        slug: 'digital-marketing',
        label: 'Digital Marketing',
        Icon: TrendingUp,
        color: 'from-blue-600 to-sky-700',
    },
    {
        slug: 'video-editing',
        label: 'Video Editing',
        Icon: Video,
        color: 'from-orange-600 to-red-700',
    },
    {
        slug: '3d-production',
        label: '3D Production',
        Icon: Box,
        color: 'from-cyan-600 to-teal-700',
    },
    {
        slug: 'web-development',
        label: 'Web Development',
        Icon: Code,
        color: 'from-green-600 to-emerald-700',
    },
] as const;

type CategorySlug = string;

// Neutral fallback styling for categories added via the CMS beyond the
// original 5 hardcoded ones above.
const EXTRA_CATEGORY_COLOR = 'from-slate-600 to-slate-700';

interface CategoryOption {
    slug: string;
    label: string;
    Icon: LucideIcon;
    color: string;
}

function getExtraCategories(
    categories: Record<string, { label: string }>,
): CategoryOption[] {
    return Object.entries(categories)
        .filter(([slug]) => !CATEGORIES.some((cat) => cat.slug === slug))
        .map(([slug, category]) => ({
            slug,
            label: category.label,
            Icon: Sparkles,
            color: EXTRA_CATEGORY_COLOR,
        }));
}

const STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        Icon: Clock,
        cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    },
    accepted: {
        label: 'Accepted',
        Icon: CheckCircle2,
        cls: 'bg-green-500/15 text-green-400 border-green-500/20',
    },
    declined: {
        label: 'Declined',
        Icon: XCircle,
        cls: 'bg-red-500/15 text-red-400 border-red-500/20',
    },
    expired: {
        label: 'Expired',
        Icon: ShieldAlert,
        cls: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfferMilestone {
    id: number;
    name: string;
    description: string | null;
    revisions: number;
    delivery_days: number;
    price: string;
    sort_order: number;
}

interface Offer {
    id: number;
    conversation_id: number;
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
    conversation: { user: { id: number; name: string; email: string } };
    created_at: string;
}

interface MilestoneForm {
    name: string;
    description: string;
    revisions: string;
    delivery_days: string;
    price: string;
}

interface Props {
    offer: Offer;
    canRespond: boolean;
    isAdmin: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyMilestone(): MilestoneForm {
    return {
        name: '',
        description: '',
        revisions: '0',
        delivery_days: '',
        price: '',
    };
}

function getCategoryMeta(
    slug: string | null,
    categories: Record<string, { label: string }>,
): CategoryOption | null {
    return (
        [...CATEGORIES, ...getExtraCategories(categories)].find(
            (c) => c.slug === slug,
        ) ?? null
    );
}

function totalPrice(offer: Offer): number {
    if (offer.payment_type === 'single') {
        return parseFloat(offer.price ?? '0');
    }

    return offer.milestones.reduce((s, m) => s + parseFloat(m.price), 0);
}

function totalDays(offer: Offer): number {
    if (offer.payment_type === 'single') {
        return offer.delivery_days ?? 0;
    }

    return offer.milestones.reduce((s, m) => s + m.delivery_days, 0);
}

// ─── Echo listener ────────────────────────────────────────────────────────────

interface EchoListenerProps {
    offer: Offer;
    isAdmin: boolean;
    setOffer: React.Dispatch<React.SetStateAction<Offer>>;
    setIsDeleted: React.Dispatch<React.SetStateAction<boolean>>;
    syncFormToOffer: (updated: Offer) => void;
}

function OfferPageEchoListener({
    offer,
    isAdmin,
    setOffer,
    setIsDeleted,
    syncFormToOffer,
}: EchoListenerProps) {
    // Status changed (client accepts / declines)
    useEcho<{ offer_id: number; status: Offer['status'] }>(
        `conversations.${offer.conversation_id}`,
        'OfferStatusChanged',
        useCallback(
            (e) => {
                if (e.offer_id !== offer.id) {
                    return;
                }

                setOffer((prev) => ({ ...prev, status: e.status }));
            },
            [offer.id, setOffer],
        ),
    );

    // Full offer updated by admin — client receives new offer data
    useEcho<{ offer: Offer }>(
        `conversations.${offer.conversation_id}`,
        'OfferUpdated',
        useCallback(
            (e) => {
                if (e.offer.id !== offer.id) {
                    return;
                }

                setOffer(e.offer);

                if (!isAdmin) {
                    // Client: sync their display to the new data
                    syncFormToOffer(e.offer);
                }
            },
            [offer.id, isAdmin, setOffer, syncFormToOffer],
        ),
    );

    // Offer deleted from chatbox
    useEcho<{ offer_id: number; conversation_id: number }>(
        `conversations.${offer.conversation_id}`,
        'OfferDeleted',
        useCallback(
            (e) => {
                if (e.offer_id !== offer.id) {
                    return;
                }

                setIsDeleted(true);
            },
            [offer.id, setIsDeleted],
        ),
    );

    return null;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Offer['status'] }) {
    const cfg = STATUS_CONFIG[status];

    return (
        <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.cls}`}
        >
            <cfg.Icon size={12} />
            {cfg.label}
        </span>
    );
}

// ─── Client view ──────────────────────────────────────────────────────────────

interface ClientViewProps {
    offer: Offer;
    isDeleted: boolean;
    onAccept: () => void;
    onDecline: () => void;
    isAccepting: boolean;
    isDeclining: boolean;
}

function ClientView({
    offer,
    isDeleted,
    onAccept,
    onDecline,
    isAccepting,
    isDeclining,
}: ClientViewProps) {
    const { categories } = usePage<SharedPageProps>().props;
    const catMeta = getCategoryMeta(
        offer.sub_category?.category_slug ?? offer.category_slug,
        categories,
    );
    const price = totalPrice(offer);
    const days = totalDays(offer);
    const canRespond = offer.status === 'pending';

    if (isDeleted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
                <div className="rounded-2xl border border-white/10 bg-slate-900 p-10 text-center">
                    <XCircle
                        size={40}
                        className="mx-auto mb-4 text-red-500/60"
                    />
                    <h2 className="mb-2 text-lg font-semibold text-white">
                        Offer Removed
                    </h2>
                    <p className="text-sm text-slate-400">
                        This offer has been removed by the team.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-10 sm:pt-32">
            <div className="mx-auto max-w-2xl px-4">
                {/* Header */}
                <div className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                    <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                        <div className="flex items-center gap-3">
                            {catMeta ? (
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${catMeta.color}`}
                                >
                                    <catMeta.Icon
                                        size={18}
                                        className="text-white/80"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700">
                                    <Package
                                        size={18}
                                        className="text-slate-400"
                                    />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-semibold text-white">
                                    {offer.sub_category?.name ??
                                        catMeta?.label ??
                                        'General Service'}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Service Offer
                                </p>
                            </div>
                        </div>
                        <StatusBadge status={offer.status} />
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 border-b border-white/5 px-6 py-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <DollarSign size={12} className="text-green-400" />
                            <span className="font-semibold text-white">
                                ${price.toFixed(2)}
                            </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={12} className="text-blue-400" />
                            {days} day{days !== 1 ? 's' : ''}
                        </span>
                        {offer.payment_type === 'milestone' ? (
                            <span className="flex items-center gap-1.5">
                                <Layers size={12} className="text-purple-400" />
                                {offer.milestones.length} milestone
                                {offer.milestones.length !== 1 ? 's' : ''}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <CreditCard
                                    size={12}
                                    className="text-slate-400"
                                />
                                Full Payment
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div className="px-6 py-5">
                        <h3 className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                            Description
                        </h3>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
                            {offer.description}
                        </p>
                    </div>

                    {offer.expires_at && (
                        <div className="flex items-center gap-2 border-t border-white/5 px-6 py-3 text-xs text-slate-400">
                            <Calendar size={12} className="text-orange-400" />
                            Offer expires{' '}
                            {new Date(offer.expires_at).toLocaleDateString(
                                'en-US',
                                {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                },
                            )}
                        </div>
                    )}

                    {offer.request_requirements && (
                        <div className="flex items-center gap-2 border-t border-white/5 px-6 py-3 text-xs text-slate-400">
                            <Check size={12} className="text-cyan-400" />
                            You'll be asked to fill in project requirements
                            before work begins
                        </div>
                    )}
                </div>

                {/* Payment details */}
                {offer.payment_type === 'single' && (
                    <div className="mb-5 rounded-2xl border border-white/10 bg-slate-900 p-6">
                        <h3 className="mb-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                            Payment Details
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-xl border border-white/5 bg-slate-800/60 p-4">
                                <DollarSign
                                    size={14}
                                    className="mb-1.5 text-green-400"
                                />
                                <p className="text-lg font-bold text-white">
                                    ${parseFloat(offer.price ?? '0').toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Total Price
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-slate-800/60 p-4">
                                <Clock
                                    size={14}
                                    className="mb-1.5 text-blue-400"
                                />
                                <p className="text-lg font-bold text-white">
                                    {offer.delivery_days}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Days Delivery
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-slate-800/60 p-4">
                                <RotateCcw
                                    size={14}
                                    className="mb-1.5 text-purple-400"
                                />
                                <p className="text-lg font-bold text-white">
                                    {offer.revisions === 0
                                        ? '∞'
                                        : (offer.revisions ?? 0)}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Revisions
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {offer.payment_type === 'milestone' && (
                    <div className="mb-5 rounded-2xl border border-white/10 bg-slate-900 p-6">
                        <h3 className="mb-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                            Milestones
                        </h3>
                        <div className="space-y-3">
                            {offer.milestones.map((m, i) => (
                                <div
                                    key={m.id}
                                    className="rounded-xl border border-white/5 bg-slate-800/60 p-4"
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600/20 text-[10px] font-bold text-cyan-400">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm font-semibold text-white">
                                                {m.name}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-green-400">
                                            ${parseFloat(m.price).toFixed(2)}
                                        </span>
                                    </div>
                                    {m.description && (
                                        <p className="mb-3 text-xs text-slate-400">
                                            {m.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock
                                                size={10}
                                                className="text-blue-400"
                                            />
                                            {m.delivery_days} day
                                            {m.delivery_days !== 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <RotateCcw
                                                size={10}
                                                className="text-purple-400"
                                            />
                                            {m.revisions === 0
                                                ? 'Unlimited'
                                                : m.revisions}{' '}
                                            revision
                                            {m.revisions !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-slate-800/40 px-4 py-3">
                            <span className="text-sm text-slate-400">
                                Total
                            </span>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-slate-400">
                                    <Clock size={12} /> {days} days
                                </span>
                                <span className="font-bold text-white">
                                    ${price.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* CTA */}
                {canRespond ? (
                    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                        <p className="mb-4 text-sm text-slate-300">
                            Ready to proceed? Accept the offer to get started,
                            or decline if it doesn't fit your needs.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onAccept}
                                disabled={isAccepting || isDeclining}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isAccepting ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}
                                Accept Offer
                            </button>
                            <button
                                onClick={onDecline}
                                disabled={isAccepting || isDeclining}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-red-600/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isDeclining ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                    <XCircle size={16} />
                                )}
                                Decline
                            </button>
                        </div>
                    </div>
                ) : offer.status !== 'pending' ? (
                    <div className="mt-8 flex justify-center">
                        <div
                            className={`w-full max-w-md rounded-2xl border p-8 text-center sm:p-10 ${
                                offer.status === 'accepted'
                                    ? 'border-green-500/20 bg-green-500/10 shadow-[0_0_40px_-10px_rgba(34,197,94,0.15)]'
                                    : offer.status === 'declined'
                                      ? 'border-red-500/20 bg-red-500/10 shadow-[0_0_40px_-10px_rgba(239,68,68,0.15)]'
                                      : 'border-slate-500/20 bg-slate-500/10 shadow-[0_0_40px_-10px_rgba(100,116,139,0.15)]'
                            }`}
                        >
                            <div
                                className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border ${
                                    offer.status === 'accepted'
                                        ? 'border-green-500/30 bg-green-500/20 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                                        : offer.status === 'declined'
                                          ? 'border-red-500/30 bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                          : 'border-slate-500/30 bg-slate-500/20 text-slate-400 shadow-[0_0_20px_rgba(100,116,139,0.2)]'
                                }`}
                            >
                                {(() => {
                                    const Icon =
                                        STATUS_CONFIG[offer.status].Icon;

                                    return <Icon size={32} strokeWidth={2.5} />;
                                })()}
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-white">
                                Offer {STATUS_CONFIG[offer.status].label}
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-400">
                                {offer.status === 'accepted'
                                    ? 'You accepted this offer. The team will be in touch shortly.'
                                    : offer.status === 'declined'
                                      ? 'You declined this offer.'
                                      : 'This offer has expired.'}
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

// ─── Admin edit view ──────────────────────────────────────────────────────────

function AdminView({ offer }: { offer: Offer }) {
    const { categories } = usePage<SharedPageProps>().props;
    const displayCategories: CategoryOption[] = [
        ...CATEGORIES,
        ...getExtraCategories(categories),
    ];

    // Form state — initialised from the current offer
    const [category, setCategory] = useState<CategorySlug | null>(
        (offer.sub_category?.category_slug ??
            offer.category_slug) as CategorySlug | null,
    );
    const [paymentType, setPaymentType] = useState<'single' | 'milestone'>(
        offer.payment_type,
    );
    const [description, setDescription] = useState(offer.description);
    const [requestReqs, setRequestReqs] = useState(offer.request_requirements);
    const [price, setPrice] = useState(offer.price ?? '');
    const [deliveryDays, setDeliveryDays] = useState(
        offer.delivery_days?.toString() ?? '',
    );
    const [revisions, setRevisions] = useState(
        offer.revisions?.toString() ?? '0',
    );
    const [hasExpiry, setHasExpiry] = useState(!!offer.expires_at);
    const [expiresAt, setExpiresAt] = useState(
        offer.expires_at
            ? new Date(offer.expires_at).toISOString().split('T')[0]
            : '',
    );
    const [milestones, setMilestones] = useState<MilestoneForm[]>(
        offer.milestones.length > 0
            ? offer.milestones.map((m) => ({
                  name: m.name,
                  description: m.description ?? '',
                  revisions: m.revisions.toString(),
                  delivery_days: m.delivery_days.toString(),
                  price: parseFloat(m.price).toString(),
              }))
            : [emptyMilestone()],
    );

    const [isSaving, setIsSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saveError, setSaveError] = useState<string | null>(null);

    const totalMilestonePrice = milestones.reduce(
        (s, m) => s + (parseFloat(m.price) || 0),
        0,
    );
    const totalMilestoneDays = milestones.reduce(
        (s, m) => s + (parseInt(m.delivery_days) || 0),
        0,
    );

    const updateMilestone = (
        i: number,
        field: keyof MilestoneForm,
        val: string,
    ) =>
        setMilestones((prev) =>
            prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)),
        );

    const handleSave = async () => {
        setErrors({});
        setSaveError(null);
        setIsSaving(true);

        try {
            const payload: Record<string, unknown> = {
                category_slug: category,
                payment_type: paymentType,
                description,
                request_requirements: requestReqs,
            };

            if (paymentType === 'single') {
                payload.price = parseFloat(price);
                payload.delivery_days = parseInt(deliveryDays);
                payload.revisions = parseInt(revisions) || 0;
                payload.expires_at = hasExpiry && expiresAt ? expiresAt : null;
            } else {
                payload.milestones = milestones.map((m) => ({
                    name: m.name,
                    description: m.description || null,
                    revisions: parseInt(m.revisions) || 0,
                    delivery_days: parseInt(m.delivery_days),
                    price: parseFloat(m.price),
                }));
            }

            const { data: fresh } = await axios.put<Offer>(
                `/offer/${offer.offer_token}`,
                payload,
            );

            // Sync form to confirmed server state
            setCategory(
                (fresh.sub_category?.category_slug ??
                    fresh.category_slug) as CategorySlug | null,
            );
            setPaymentType(fresh.payment_type);
            setDescription(fresh.description);
            setRequestReqs(fresh.request_requirements);
            setPrice(fresh.price ?? '');
            setDeliveryDays(fresh.delivery_days?.toString() ?? '');
            setRevisions(fresh.revisions?.toString() ?? '0');
            setHasExpiry(!!fresh.expires_at);
            setExpiresAt(
                fresh.expires_at
                    ? new Date(fresh.expires_at).toISOString().split('T')[0]
                    : '',
            );
            setMilestones(
                fresh.milestones.length > 0
                    ? fresh.milestones.map((m) => ({
                          name: m.name,
                          description: m.description ?? '',
                          revisions: m.revisions.toString(),
                          delivery_days: m.delivery_days.toString(),
                          price: parseFloat(m.price).toString(),
                      }))
                    : [emptyMilestone()],
            );

            setSavedOk(true);
            window.close();
        } catch (err: unknown) {
            const serverErrors = (err as any)?.response?.data?.errors ?? {};
            const mapped: Record<string, string> = {};
            Object.entries(serverErrors).forEach(([k, v]) => {
                mapped[k] = Array.isArray(v) ? v[0] : String(v);
            });
            setErrors(mapped);

            if (Object.keys(mapped).length === 0) {
                setSaveError('Failed to save. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 py-8">
            <div className="mx-auto max-w-2xl px-4">
                {/* Page header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-white">
                            Edit Offer
                        </h1>
                        <p className="text-xs text-slate-500">
                            For {offer.conversation.user.name} — changes are
                            pushed to the client instantly
                        </p>
                    </div>
                    <StatusBadge status={offer.status} />
                </div>

                {/* Save success */}
                {savedOk && (
                    <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                        <Check size={15} />
                        Changes saved — the client's view has been updated
                        instantly.
                    </div>
                )}

                {/* Save error */}
                {saveError && (
                    <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        <X size={15} />
                        {saveError}
                    </div>
                )}

                {/* General error */}
                {errors.general && (
                    <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {errors.general}
                    </div>
                )}

                {/* Step 1 — Category */}
                <section className="mb-5 rounded-2xl border border-white/10 bg-slate-900 p-6">
                    <h2 className="mb-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Service Category (optional)
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {displayCategories.map((cat) => {
                            const selected = category === cat.slug;

                            return (
                                <button
                                    key={cat.slug}
                                    onClick={() =>
                                        setCategory(selected ? null : cat.slug)
                                    }
                                    className={`group relative overflow-hidden rounded-xl border p-0 text-left transition-all ${selected ? 'border-cyan-500 ring-2 ring-cyan-500/40' : 'border-white/10 hover:border-white/20'}`}
                                >
                                    <div
                                        className={`flex h-24 items-center justify-center bg-gradient-to-br ${cat.color}`}
                                    >
                                        <cat.Icon
                                            size={32}
                                            className="text-white/80"
                                        />
                                    </div>
                                    <div className="bg-slate-800/80 p-2.5">
                                        <p className="truncate text-xs font-semibold text-white">
                                            {cat.label}
                                        </p>
                                    </div>
                                    {selected && (
                                        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500">
                                            <Check
                                                size={11}
                                                className="text-white"
                                            />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Step 2 — Payment type */}
                <section className="mb-5 rounded-2xl border border-white/10 bg-slate-900 p-6">
                    <h2 className="mb-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Payment Type
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {(['single', 'milestone'] as const).map((type) => {
                            const selected = paymentType === type;

                            return (
                                <button
                                    key={type}
                                    onClick={() => setPaymentType(type)}
                                    className={`rounded-xl border p-4 text-left transition-all ${selected ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30' : 'border-white/10 bg-white/3 hover:border-white/20'}`}
                                >
                                    <div
                                        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${selected ? 'bg-cyan-600' : 'bg-slate-700'}`}
                                    >
                                        {type === 'single' ? (
                                            <CreditCard
                                                size={15}
                                                className="text-white"
                                            />
                                        ) : (
                                            <Layers
                                                size={15}
                                                className="text-white"
                                            />
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold text-white">
                                        {type === 'single'
                                            ? 'Full Payment'
                                            : 'Milestones'}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        {type === 'single'
                                            ? 'Single upfront charge'
                                            : 'Multiple staged payments'}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Step 3 — Offer details */}
                <section className="mb-5 rounded-2xl border border-white/10 bg-slate-900 p-6">
                    <h2 className="mb-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Offer Details
                    </h2>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="mb-1.5 block text-xs font-medium text-slate-300">
                            Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Describe the scope, deliverables, and what's included..."
                            className={`w-full resize-none rounded-xl border bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${errors.description ? 'border-red-500 focus:ring-red-500/30' : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'}`}
                        />
                        {errors.description && (
                            <p className="mt-1 text-xs text-red-400">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Request requirements toggle */}
                    <label className="mb-5 flex cursor-pointer items-center gap-3">
                        <div
                            onClick={() => setRequestReqs((v) => !v)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${requestReqs ? 'border-cyan-500 bg-cyan-600' : 'border-white/20 bg-slate-800'}`}
                        >
                            {requestReqs && (
                                <Check size={11} className="text-white" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-slate-200">
                                Request requirements before starting
                            </p>
                            <p className="text-xs text-slate-500">
                                Ask the client to fill in requirements before
                                work begins
                            </p>
                        </div>
                    </label>

                    {/* Single payment fields */}
                    {paymentType === 'single' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                {/* Price */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-300">
                                        <DollarSign
                                            size={11}
                                            className="text-green-400"
                                        />{' '}
                                        Price (USD){' '}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) =>
                                            setPrice(e.target.value)
                                        }
                                        placeholder="0.00"
                                        className={`w-full rounded-xl border bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${errors.price ? 'border-red-500' : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'}`}
                                    />
                                    {errors.price && (
                                        <p className="mt-1 text-[10px] text-red-400">
                                            {errors.price}
                                        </p>
                                    )}
                                </div>
                                {/* Delivery */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-300">
                                        <Clock
                                            size={11}
                                            className="text-blue-400"
                                        />{' '}
                                        Delivery (days){' '}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={deliveryDays}
                                        onChange={(e) =>
                                            setDeliveryDays(e.target.value)
                                        }
                                        placeholder="7"
                                        className={`w-full rounded-xl border bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${errors.delivery_days ? 'border-red-500' : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'}`}
                                    />
                                    {errors.delivery_days && (
                                        <p className="mt-1 text-[10px] text-red-400">
                                            {errors.delivery_days}
                                        </p>
                                    )}
                                </div>
                                {/* Revisions */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-300">
                                        <RotateCcw
                                            size={11}
                                            className="text-purple-400"
                                        />{' '}
                                        Revisions
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={revisions}
                                        onChange={(e) =>
                                            setRevisions(e.target.value)
                                        }
                                        placeholder="0"
                                        className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none"
                                    />
                                    <p className="mt-1 text-[10px] text-slate-500">
                                        0 = unlimited
                                    </p>
                                </div>
                            </div>

                            {/* Expiry */}
                            <div>
                                <label className="mb-2 flex cursor-pointer items-center gap-3">
                                    <div
                                        onClick={() => setHasExpiry((v) => !v)}
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${hasExpiry ? 'border-cyan-500 bg-cyan-600' : 'border-white/20 bg-slate-800'}`}
                                    >
                                        {hasExpiry && (
                                            <Check
                                                size={11}
                                                className="text-white"
                                            />
                                        )}
                                    </div>
                                    <span className="flex items-center gap-1.5 text-sm text-slate-200">
                                        <Calendar
                                            size={13}
                                            className="text-orange-400"
                                        />{' '}
                                        Set offer expiry date
                                    </span>
                                </label>
                                {hasExpiry && (
                                    <input
                                        type="date"
                                        value={expiresAt}
                                        onChange={(e) =>
                                            setExpiresAt(e.target.value)
                                        }
                                        min={
                                            new Date(Date.now() + 86400000)
                                                .toISOString()
                                                .split('T')[0]
                                        }
                                        className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Milestone fields */}
                    {paymentType === 'milestone' && (
                        <div className="space-y-3">
                            {milestones.map((m, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl border border-white/10 bg-slate-800/40 p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-300">
                                            Milestone {i + 1}
                                        </span>
                                        {milestones.length > 1 && (
                                            <button
                                                onClick={() =>
                                                    setMilestones((prev) =>
                                                        prev.filter(
                                                            (_, idx) =>
                                                                idx !== i,
                                                        ),
                                                    )
                                                }
                                                className="rounded-lg p-1 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={m.name}
                                        onChange={(e) =>
                                            updateMilestone(
                                                i,
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Milestone name"
                                        className={`mb-3 w-full rounded-xl border bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${errors[`milestones.${i}.name`] ? 'border-red-500' : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'}`}
                                    />
                                    <textarea
                                        value={m.description}
                                        onChange={(e) =>
                                            updateMilestone(
                                                i,
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Description (optional)"
                                        rows={2}
                                        className="mb-3 w-full resize-none rounded-xl border border-white/10 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none"
                                    />
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="mb-1 flex items-center gap-1 text-[10px] text-slate-400">
                                                <DollarSign
                                                    size={9}
                                                    className="text-green-400"
                                                />{' '}
                                                Price *
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={m.price}
                                                onChange={(e) =>
                                                    updateMilestone(
                                                        i,
                                                        'price',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="0.00"
                                                className={`w-full rounded-xl border bg-slate-700/50 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${errors[`milestones.${i}.price`] ? 'border-red-500' : 'border-white/10 focus:border-cyan-500'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 flex items-center gap-1 text-[10px] text-slate-400">
                                                <Clock
                                                    size={9}
                                                    className="text-blue-400"
                                                />{' '}
                                                Days *
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={m.delivery_days}
                                                onChange={(e) =>
                                                    updateMilestone(
                                                        i,
                                                        'delivery_days',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="7"
                                                className={`w-full rounded-xl border bg-slate-700/50 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${errors[`milestones.${i}.delivery_days`] ? 'border-red-500' : 'border-white/10 focus:border-cyan-500'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 flex items-center gap-1 text-[10px] text-slate-400">
                                                <RotateCcw
                                                    size={9}
                                                    className="text-purple-400"
                                                />{' '}
                                                Revisions
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={m.revisions}
                                                onChange={(e) =>
                                                    updateMilestone(
                                                        i,
                                                        'revisions',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="0"
                                                className="w-full rounded-xl border border-white/10 bg-slate-700/50 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {milestones.length < 20 && (
                                <button
                                    onClick={() =>
                                        setMilestones((prev) => [
                                            ...prev,
                                            emptyMilestone(),
                                        ])
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-2.5 text-sm text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-400"
                                >
                                    <Plus size={14} /> Add Milestone
                                </button>
                            )}

                            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-800/60 px-4 py-3">
                                <span className="text-sm text-slate-400">
                                    Total
                                </span>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1 text-slate-400">
                                        <Clock size={11} /> {totalMilestoneDays}{' '}
                                        day{totalMilestoneDays !== 1 ? 's' : ''}
                                    </span>
                                    <span className="font-bold text-white">
                                        ${totalMilestonePrice.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Save */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <Check size={15} /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Root page ────────────────────────────────────────────────────────────────

export default function OfferShow({ offer: initial, isAdmin }: Props) {
    const { categories } = usePage<SharedPageProps>().props;
    const [offer, setOffer] = useState<Offer>(initial);
    const [isDeleted, setIsDeleted] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);
    const echoReady = useEchoReady();

    // No-op for admin (client-only callback used by echo listener)
    const syncFormToOffer = useCallback(() => {}, []);

    const handleAccept = async () => {
        setIsAccepting(true);

        try {
            await axios.post(`/offer/${offer.offer_token}/accept`);
            window.close();
        } catch {
            setIsAccepting(false);
        }
    };

    const handleDecline = async () => {
        setIsDeclining(true);

        try {
            await axios.post(`/offer/${offer.offer_token}/decline`);
            window.close();
        } catch {
            setIsDeclining(false);
        }
    };

    const catMeta = getCategoryMeta(
        offer.sub_category?.category_slug ?? offer.category_slug,
        categories,
    );
    const title = `Offer – ${offer.sub_category?.name ?? catMeta?.label ?? 'General Service'}`;

    const echoListener = echoReady ? (
        <OfferPageEchoListener
            offer={offer}
            isAdmin={isAdmin}
            setOffer={setOffer}
            setIsDeleted={setIsDeleted}
            syncFormToOffer={syncFormToOffer}
        />
    ) : null;

    if (isAdmin) {
        return (
            <AdminLayout title="Edit Offer">
                <Head title={title} />
                {echoListener}
                <AdminView offer={offer} />
            </AdminLayout>
        );
    }

    return (
        <>
            <Head title={title} />
            {echoListener}
            <AppLayout>
                <ClientView
                    offer={offer}
                    isDeleted={isDeleted}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    isAccepting={isAccepting}
                    isDeclining={isDeclining}
                />
            </AppLayout>
        </>
    );
}

// The component renders its own layout (AdminLayout or AppLayout) based on
// isAdmin, so prevent app.tsx from double-wrapping it with AppLayout.
OfferShow.layout = (page: React.ReactNode) => <>{page}</>;
