import type { SharedPageProps } from '@/types';
import type { LucideIcon } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    Box,
    Calendar,
    Check,
    ChevronLeft,
    Clock,
    Code,
    CreditCard,
    DollarSign,
    Layers,
    Package,
    Palette,
    Plus,
    RotateCcw,
    Sparkles,
    Trash2,
    TrendingUp,
    Video,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/apiFetch';

// Cosmetic-only: a dedicated icon for the categories this agency originally
// shipped with. This must never be the source of truth for which
// category_slug values are selectable — that has to come from the live
// `categories` prop (which mirrors what the backend actually validates
// against), otherwise a renamed/removed category here would still render as
// pickable but fail with a 422 the moment it's submitted.
const CATEGORY_STYLES: Record<string, { Icon: LucideIcon; color: string }> = {
    'graphic-design': {
        Icon: Palette,
        color: 'from-purple-600 to-violet-700',
    },
    'digital-marketing': {
        Icon: TrendingUp,
        color: 'from-blue-600 to-sky-700',
    },
    'video-editing': { Icon: Video, color: 'from-orange-600 to-red-700' },
    '3d-production': { Icon: Box, color: 'from-cyan-600 to-teal-700' },
    'web-development': { Icon: Code, color: 'from-green-600 to-emerald-700' },
};

// Neutral fallback styling for any category without a dedicated style above.
const DEFAULT_CATEGORY_STYLE = {
    Icon: Sparkles,
    color: 'from-slate-600 to-slate-700',
};

type CategorySlug = string;

interface CategoryOption {
    slug: string;
    label: string;
    Icon: LucideIcon;
    color: string;
}

interface MilestoneForm {
    name: string;
    description: string;
    revisions: string;
    delivery_days: string;
    price: string;
}

export interface OfferMilestone {
    id: number;
    offer_id: number;
    name: string;
    description: string | null;
    revisions: number;
    delivery_days: number;
    price: string;
    sort_order: number;
}

export interface Offer {
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
    created_at: string;
}

export interface OfferMessage {
    id: number;
    conversation_id: number;
    sender_type: 'user' | 'admin';
    message: string | null;
    attachment_path: string | null;
    attachment_type: string | null;
    delivered_at: string | null;
    read_at: string | null;
    offer_id: number | null;
    offer: Offer | null;
    created_at: string;
}

interface CreateOfferModalProps {
    conversationId: number;
    userName: string;
    onOfferSent: (message: OfferMessage) => void;
    onClose: () => void;
}

function emptyMilestone(): MilestoneForm {
    return {
        name: '',
        description: '',
        revisions: '0',
        delivery_days: '',
        price: '',
    };
}

const STEP_LABELS = ['Select Service', 'Payment Type', 'Offer Details'];

const stepVariants = {
    enter: (dir: number) => ({
        x: dir > 0 ? 60 : -60,
        opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
        x: dir > 0 ? -60 : 60,
        opacity: 0,
    }),
};

export default function CreateOfferModal({
    conversationId,
    userName,
    onOfferSent,
    onClose,
}: CreateOfferModalProps) {
    const { categories } = usePage<SharedPageProps>().props;

    // Every selectable option comes straight from the live category list —
    // the same list the backend validates category_slug against — so a
    // category that's been renamed or removed in the CMS can never show up
    // here as a pickable-but-doomed-to-422 option.
    const displayCategories: CategoryOption[] = Object.entries(categories).map(
        ([slug, category]) => {
            const style = CATEGORY_STYLES[slug] ?? DEFAULT_CATEGORY_STYLE;

            return {
                slug,
                label: category.label,
                Icon: style.Icon,
                color: style.color,
            };
        },
    );

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [direction, setDirection] = useState(1);
    const [categorySlug, setCategorySlug] = useState<CategorySlug | null>(null);
    const [paymentType, setPaymentType] = useState<
        'single' | 'milestone' | null
    >(null);

    const [description, setDescription] = useState('');
    const [requestRequirements, setRequestRequirements] = useState(true);
    const [price, setPrice] = useState('');
    const [deliveryDays, setDeliveryDays] = useState('');
    const [revisions, setRevisions] = useState('0');
    const [hasExpiry, setHasExpiry] = useState(false);
    const [expiresAt, setExpiresAt] = useState('');
    const [milestones, setMilestones] = useState<MilestoneForm[]>([
        emptyMilestone(),
    ]);

    const [isSending, setIsSending] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const totalMilestonePrice = milestones.reduce(
        (sum, m) => sum + (parseFloat(m.price) || 0),
        0,
    );
    const totalMilestoneDays = milestones.reduce(
        (sum, m) => sum + (parseInt(m.delivery_days) || 0),
        0,
    );

    const goTo = (next: 1 | 2 | 3) => {
        setDirection(next > step ? 1 : -1);
        setStep(next);
    };

    const handleSendOffer = async () => {
        const newErrors: Record<string, string> = {};

        if (!description.trim()) {
            newErrors.description = 'Description is required.';
        }

        if (paymentType === 'single') {
            if (!price || parseFloat(price) < 0) {
                newErrors.price = 'Price is required.';
            }

            if (!deliveryDays || parseInt(deliveryDays) < 1) {
                newErrors.delivery_days = 'Delivery time is required.';
            }
        }

        if (paymentType === 'milestone') {
            milestones.forEach((m, i) => {
                if (!m.name.trim()) {
                    newErrors[`milestone_${i}_name`] =
                        'Milestone name is required.';
                }

                if (!m.delivery_days || parseInt(m.delivery_days) < 1) {
                    newErrors[`milestone_${i}_days`] =
                        'Delivery time is required.';
                }

                if (!m.price || parseFloat(m.price) < 0) {
                    newErrors[`milestone_${i}_price`] = 'Price is required.';
                }
            });
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);

            return;
        }

        setErrors({});
        setIsSending(true);

        try {
            const payload: Record<string, unknown> = {
                category_slug: categorySlug,
                payment_type: paymentType,
                description,
                request_requirements: requestRequirements,
            };

            if (paymentType === 'single') {
                payload.price = parseFloat(price);
                payload.delivery_days = parseInt(deliveryDays);
                payload.revisions = parseInt(revisions) || 0;

                if (hasExpiry && expiresAt) {
                    payload.expires_at = expiresAt;
                }
            } else {
                payload.milestones = milestones.map((m) => ({
                    name: m.name,
                    description: m.description || null,
                    revisions: parseInt(m.revisions) || 0,
                    delivery_days: parseInt(m.delivery_days),
                    price: parseFloat(m.price),
                }));
            }

            const res = await api.post<OfferMessage>(
                `/admin/api/customer-conversations/${conversationId}/offer`,
                payload,
            );

            onOfferSent(res.data);
            onClose();
        } catch (err: unknown) {
            const serverErrors = (err as any)?.response?.data?.errors ?? {};
            const mapped: Record<string, string> = {};

            Object.entries(serverErrors).forEach(([key, val]) => {
                mapped[key] = Array.isArray(val) ? val[0] : String(val);
            });

            // Only these keys have a dedicated field in the UI below. Any
            // other key (category_slug, payment_type, revisions,
            // expires_at, a top-level milestones array error, ...) would
            // otherwise be captured here and never shown anywhere, leaving
            // the admin staring at a modal that silently does nothing.
            const renderedKeys = new Set([
                'description',
                'price',
                'delivery_days',
            ]);
            const isRendered = (key: string) =>
                renderedKeys.has(key) ||
                /^milestone_\d+_(name|days|price)$/.test(key);

            const hasUnrenderedErrors = Object.keys(mapped).some(
                (key) => !isRendered(key),
            );

            if (hasUnrenderedErrors || Object.keys(mapped).length === 0) {
                mapped.general =
                    Object.keys(mapped).length > 0
                        ? Object.values(mapped).join(' ')
                        : 'Failed to send offer. Please try again.';
            }

            setErrors(mapped);
        } finally {
            setIsSending(false);
        }
    };

    const updateMilestone = (
        index: number,
        field: keyof MilestoneForm,
        value: string,
    ) => {
        setMilestones((prev) =>
            prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
        );
    };

    const removeMilestone = (index: number) => {
        setMilestones((prev) => prev.filter((_, i) => i !== index));
    };

    const selectedCat =
        displayCategories.find((c) => c.slug === categorySlug) ?? null;

    const content = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
                style={{ maxHeight: '90vh' }}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">
                            Create an Offer
                        </h2>
                        <p className="text-xs text-slate-400">For {userName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="flex shrink-0 items-center gap-0 border-b border-white/5 bg-slate-950/40 px-6 py-3">
                    {STEP_LABELS.map((label, i) => {
                        const n = (i + 1) as 1 | 2 | 3;
                        const done = step > n;
                        const active = step === n;

                        return (
                            <div key={n} className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                                            done
                                                ? 'bg-cyan-600 text-white'
                                                : active
                                                  ? 'border-2 border-cyan-500 bg-cyan-500/10 text-cyan-400'
                                                  : 'border border-white/10 bg-white/5 text-slate-500'
                                        }`}
                                    >
                                        {done ? <Check size={11} /> : n}
                                    </div>
                                    <span
                                        className={`text-xs font-medium transition-colors ${
                                            active
                                                ? 'text-white'
                                                : done
                                                  ? 'text-cyan-400'
                                                  : 'text-slate-500'
                                        }`}
                                    >
                                        {label}
                                    </span>
                                </div>
                                {i < STEP_LABELS.length - 1 && (
                                    <div className="mx-3 h-px w-8 bg-white/10" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Body */}
                <div className="relative min-h-0 flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait" custom={direction}>
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.18 }}
                                className="p-6"
                            >
                                <p className="mb-4 text-sm font-medium text-slate-300">
                                    Select the service category (optional)
                                </p>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {displayCategories.map((cat) => {
                                        const isSelected =
                                            categorySlug === cat.slug;

                                        return (
                                            <button
                                                key={cat.slug}
                                                onClick={() =>
                                                    setCategorySlug(
                                                        isSelected
                                                            ? null
                                                            : cat.slug,
                                                    )
                                                }
                                                className={`group relative overflow-hidden rounded-xl border p-0 text-left transition-all ${
                                                    isSelected
                                                        ? 'border-cyan-500 ring-2 ring-cyan-500/40'
                                                        : 'border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                {/* Gradient with icon */}
                                                <div
                                                    className={`flex h-28 items-center justify-center bg-gradient-to-br ${cat.color}`}
                                                >
                                                    <cat.Icon
                                                        size={36}
                                                        className="text-white/80"
                                                    />
                                                </div>

                                                {/* Label */}
                                                <div className="bg-slate-800/80 p-3">
                                                    <p className="truncate text-xs font-semibold text-white">
                                                        {cat.label}
                                                    </p>
                                                </div>

                                                {/* Selected checkmark */}
                                                {isSelected && (
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
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                custom={direction}
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.18 }}
                                className="p-6"
                            >
                                {/* Selected category chip */}
                                {selectedCat && (
                                    <div className="mb-5 flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5">
                                        <selectedCat.Icon
                                            size={14}
                                            className="text-cyan-400"
                                        />
                                        <span className="text-sm font-medium text-cyan-300">
                                            {selectedCat.label}
                                        </span>
                                    </div>
                                )}

                                <p className="mb-4 text-sm font-medium text-slate-300">
                                    How would you like to receive payment?
                                </p>

                                <div className="space-y-3">
                                    {/* Single Payment */}
                                    <button
                                        onClick={() => setPaymentType('single')}
                                        className={`w-full rounded-xl border p-4 text-left transition-all ${
                                            paymentType === 'single'
                                                ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30'
                                                : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                    paymentType === 'single'
                                                        ? 'bg-cyan-600'
                                                        : 'bg-slate-700'
                                                }`}
                                            >
                                                <CreditCard
                                                    size={18}
                                                    className="text-white"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-white">
                                                        Full Payment
                                                    </p>
                                                    {paymentType ===
                                                        'single' && (
                                                        <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    Client pays the full amount
                                                    upfront when accepting the
                                                    offer.
                                                </p>
                                                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                                                    <DollarSign size={11} />
                                                    <span>
                                                        Single charge to client
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Milestone Payment */}
                                    <button
                                        onClick={() =>
                                            setPaymentType('milestone')
                                        }
                                        className={`w-full rounded-xl border p-4 text-left transition-all ${
                                            paymentType === 'milestone'
                                                ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30'
                                                : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                    paymentType === 'milestone'
                                                        ? 'bg-cyan-600'
                                                        : 'bg-slate-700'
                                                }`}
                                            >
                                                <Layers
                                                    size={18}
                                                    className="text-white"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-white">
                                                        Milestone Payments
                                                    </p>
                                                    {paymentType ===
                                                        'milestone' && (
                                                        <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    Break the project into
                                                    stages. Client pays at the
                                                    completion of each
                                                    milestone.
                                                </p>
                                                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                                                    <Layers size={11} />
                                                    <span>
                                                        Multiple charges over
                                                        time
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                custom={direction}
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.18 }}
                                className="p-6"
                            >
                                {/* Service + Payment Type Summary */}
                                <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/5 bg-slate-800/60 px-4 py-3">
                                    {selectedCat ? (
                                        <>
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${selectedCat.color}`}
                                            >
                                                <selectedCat.Icon
                                                    size={16}
                                                    className="text-white/80"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">
                                                    {selectedCat.label}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700">
                                                <Package
                                                    size={16}
                                                    className="text-slate-400"
                                                />
                                            </div>
                                            <span className="text-sm text-slate-400">
                                                General Service
                                            </span>
                                        </>
                                    )}
                                    <div className="ml-auto">
                                        <span
                                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                paymentType === 'single'
                                                    ? 'bg-blue-600/20 text-blue-400'
                                                    : 'bg-purple-600/20 text-purple-400'
                                            }`}
                                        >
                                            {paymentType === 'single' ? (
                                                <>
                                                    <CreditCard size={10} />{' '}
                                                    Full Payment
                                                </>
                                            ) : (
                                                <>
                                                    <Layers size={10} />{' '}
                                                    Milestones
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* General Error */}
                                {errors.general && (
                                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                                        {errors.general}
                                    </div>
                                )}

                                {/* Description */}
                                <div className="mb-4">
                                    <label className="mb-1.5 block text-xs font-medium text-slate-300">
                                        Description{' '}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        placeholder="Describe what's included in this offer, scope of work, deliverables..."
                                        rows={3}
                                        className={`w-full resize-none rounded-xl border bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${
                                            errors.description
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                                                : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'
                                        }`}
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                {/* Request Requirements */}
                                <label className="mb-5 flex cursor-pointer items-center gap-3">
                                    <div
                                        onClick={() =>
                                            setRequestRequirements((v) => !v)
                                        }
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                                            requestRequirements
                                                ? 'border-cyan-500 bg-cyan-600'
                                                : 'border-white/20 bg-slate-800'
                                        }`}
                                    >
                                        {requestRequirements && (
                                            <Check
                                                size={11}
                                                className="text-white"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-200">
                                            Request requirements before starting
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Ask the client to fill in
                                            requirements before work begins
                                        </p>
                                    </div>
                                </label>

                                {/* ── Single Payment Fields ── */}
                                {paymentType === 'single' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            {/* Price */}
                                            <div>
                                                <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-300">
                                                    <DollarSign
                                                        size={11}
                                                        className="text-green-400"
                                                    />
                                                    Price (USD){' '}
                                                    <span className="text-red-400">
                                                        *
                                                    </span>
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
                                                    className={`w-full rounded-xl border bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${
                                                        errors.price
                                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                                                            : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'
                                                    }`}
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
                                                    />
                                                    Delivery (days){' '}
                                                    <span className="text-red-400">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    value={deliveryDays}
                                                    onChange={(e) =>
                                                        setDeliveryDays(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="7"
                                                    className={`w-full rounded-xl border bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${
                                                        errors.delivery_days
                                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                                                            : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'
                                                    }`}
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
                                                    />
                                                    Revisions
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={revisions}
                                                    onChange={(e) =>
                                                        setRevisions(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="0"
                                                    className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none"
                                                />
                                                <p className="mt-1 text-[10px] text-slate-500">
                                                    0 = unlimited
                                                </p>
                                            </div>
                                        </div>

                                        {/* Expiry Toggle */}
                                        <div>
                                            <label className="mb-2 flex cursor-pointer items-center gap-3">
                                                <div
                                                    onClick={() =>
                                                        setHasExpiry((v) => !v)
                                                    }
                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                                                        hasExpiry
                                                            ? 'border-cyan-500 bg-cyan-600'
                                                            : 'border-white/20 bg-slate-800'
                                                    }`}
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
                                                    />
                                                    Set offer expiry date
                                                </span>
                                            </label>
                                            {hasExpiry && (
                                                <input
                                                    type="date"
                                                    value={expiresAt}
                                                    onChange={(e) =>
                                                        setExpiresAt(
                                                            e.target.value,
                                                        )
                                                    }
                                                    min={
                                                        new Date(
                                                            Date.now() +
                                                                86400000,
                                                        )
                                                            .toISOString()
                                                            .split('T')[0]
                                                    }
                                                    className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Milestone Fields ── */}
                                {paymentType === 'milestone' && (
                                    <div className="space-y-3">
                                        {milestones.map((milestone, i) => (
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
                                                                removeMilestone(
                                                                    i,
                                                                )
                                                            }
                                                            className="rounded-lg p-1 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Name */}
                                                <div className="mb-3">
                                                    <input
                                                        type="text"
                                                        value={milestone.name}
                                                        onChange={(e) =>
                                                            updateMilestone(
                                                                i,
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Milestone name (e.g. Initial Design Draft)"
                                                        className={`w-full rounded-xl border bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${
                                                            errors[
                                                                `milestone_${i}_name`
                                                            ]
                                                                ? 'border-red-500 focus:ring-red-500/30'
                                                                : 'border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20'
                                                        }`}
                                                    />
                                                    {errors[
                                                        `milestone_${i}_name`
                                                    ] && (
                                                        <p className="mt-1 text-[10px] text-red-400">
                                                            {
                                                                errors[
                                                                    `milestone_${i}_name`
                                                                ]
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Description */}
                                                <div className="mb-3">
                                                    <textarea
                                                        value={
                                                            milestone.description
                                                        }
                                                        onChange={(e) =>
                                                            updateMilestone(
                                                                i,
                                                                'description',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="What will be delivered in this milestone? (optional)"
                                                        rows={2}
                                                        className="w-full resize-none rounded-xl border border-white/10 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:outline-none"
                                                    />
                                                </div>

                                                {/* Price / Days / Revisions */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="mb-1 flex items-center gap-1 text-[10px] text-slate-400">
                                                            <DollarSign
                                                                size={9}
                                                                className="text-green-400"
                                                            />
                                                            Price *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                milestone.price
                                                            }
                                                            onChange={(e) =>
                                                                updateMilestone(
                                                                    i,
                                                                    'price',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="0.00"
                                                            className={`w-full rounded-xl border bg-slate-700/50 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${
                                                                errors[
                                                                    `milestone_${i}_price`
                                                                ]
                                                                    ? 'border-red-500'
                                                                    : 'border-white/10 focus:border-cyan-500'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 flex items-center gap-1 text-[10px] text-slate-400">
                                                            <Clock
                                                                size={9}
                                                                className="text-blue-400"
                                                            />
                                                            Days *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={
                                                                milestone.delivery_days
                                                            }
                                                            onChange={(e) =>
                                                                updateMilestone(
                                                                    i,
                                                                    'delivery_days',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="7"
                                                            className={`w-full rounded-xl border bg-slate-700/50 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:outline-none ${
                                                                errors[
                                                                    `milestone_${i}_days`
                                                                ]
                                                                    ? 'border-red-500'
                                                                    : 'border-white/10 focus:border-cyan-500'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 flex items-center gap-1 text-[10px] text-slate-400">
                                                            <RotateCcw
                                                                size={9}
                                                                className="text-purple-400"
                                                            />
                                                            Revisions
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={
                                                                milestone.revisions
                                                            }
                                                            onChange={(e) =>
                                                                updateMilestone(
                                                                    i,
                                                                    'revisions',
                                                                    e.target
                                                                        .value,
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
                                                <Plus size={14} />
                                                Add Milestone
                                            </button>
                                        )}

                                        {/* Totals */}
                                        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-800/60 px-4 py-3">
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-slate-400">
                                                    Total
                                                </span>
                                                <span className="font-semibold text-white">
                                                    $
                                                    {totalMilestonePrice.toFixed(
                                                        2,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock
                                                    size={13}
                                                    className="text-slate-400"
                                                />
                                                <span className="text-slate-400">
                                                    {totalMilestoneDays} day
                                                    {totalMilestoneDays !== 1
                                                        ? 's'
                                                        : ''}{' '}
                                                    delivery
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between border-t border-white/5 bg-slate-950/40 px-6 py-4">
                    <button
                        onClick={
                            step === 1
                                ? onClose
                                : () => goTo((step - 1) as 1 | 2 | 3)
                        }
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        {step > 1 && <ChevronLeft size={15} />}
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => {
                                if (step === 1) {
                                    goTo(2);
                                } else {
                                    goTo(3);
                                }
                            }}
                            disabled={step === 2 && paymentType === null}
                            className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={handleSendOffer}
                            disabled={isSending}
                            className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSending ? (
                                <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Sending…
                                </>
                            ) : (
                                'Send Offer'
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );

    return createPortal(content, document.body);
}
