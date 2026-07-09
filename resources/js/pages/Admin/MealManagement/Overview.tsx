import type { FormEventHandler, ReactNode } from 'react';
import { router, useForm } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    AlertTriangle,
    CalendarOff,
    CalendarPlus,
    CheckCircle2,
    Circle,
    Clock,
    Download,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Radio,
    Save,
    ShieldAlert,
    Trash2,
    UserCheck,
    Users,
    UtensilsCrossed,
    X,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import MealManagementController from '@/actions/App/Http/Controllers/Admin/MealManagementController';
import MealReportController from '@/actions/App/Http/Controllers/Admin/MealReportController';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import RealtimeTableListener from '@/components/Admin/RealtimeTableListener';
import AdminLayout from '@/components/Layout/AdminLayout';
import useEchoReady from '@/hooks/useEchoReady';

interface RosterEntry {
    admin_id: number;
    name: string;
    email: string;
    status: 'accepted' | 'declined' | 'pending';
    is_auto_declined: boolean;
    decided_at: string | null;
    overridden_at: string | null;
}

interface Holiday {
    id: number;
    start_date: string;
    end_date: string;
    note: string | null;
}

interface Props {
    today: string;
    settings: {
        accept_start_time: string | null;
        lock_time: string | null;
        weekly_holiday_day: number;
        is_configured: boolean;
    };
    todaysItem: string | null;
    blockedReason: string | null;
    roster: RosterEntry[];
    totals: { accepted: number; declined: number; pending: number };
    holidays: Holiday[];
}

const CARD =
    'relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-8 backdrop-blur-sm';
const CARD_ACCENT =
    'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent';
const SECTION_TITLE =
    'mb-6 flex items-center gap-2 text-sm font-semibold text-white';
const LABEL =
    'mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase';
const INPUT =
    'block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5';
const PRIMARY_BUTTON =
    'relative flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45)] transition-all hover:shadow-[0_0_32px_rgba(124,58,237,0.6)] disabled:opacity-50';

const WEEKDAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

function monthOptions(): { value: string; label: string }[] {
    const now = new Date();

    return Array.from({ length: 3 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('en-US', {
            month: 'long',
            year: 'numeric',
        });

        return { value, label };
    });
}

/**
 * Icon-only status indicator: accepted -> light green ring, declined/expired
 * (auto-declined) -> red cross, pending -> gray square. Expired and Declined
 * look identical (red cross) — the title/sr-only text keeps the reason
 * legible without adding visible label text next to the icon.
 */
function StatusBadge({ entry }: { entry: RosterEntry }) {
    if (entry.status === 'pending') {
        return (
            <span title="Pending" className="inline-flex items-center">
                <span
                    aria-hidden
                    className="block h-4 w-4 shrink-0 rounded-sm bg-zinc-500"
                />
                <span className="sr-only">Pending</span>
            </span>
        );
    }

    if (entry.status === 'accepted') {
        return (
            <span title="Accepted" className="inline-flex items-center">
                <Circle
                    aria-hidden
                    strokeWidth={3}
                    className="h-5 w-5 shrink-0 text-emerald-400"
                />
                <span className="sr-only">Accepted</span>
            </span>
        );
    }

    const label = entry.is_auto_declined ? 'Expired' : 'Declined';

    return (
        <span title={label} className="inline-flex items-center">
            <X
                aria-hidden
                strokeWidth={3}
                className="h-5 w-5 shrink-0 text-red-500"
            />
            <span className="sr-only">{label}</span>
        </span>
    );
}

function OverrideModal({
    entry,
    today,
    onClose,
}: {
    entry: RosterEntry;
    today: string;
    onClose: () => void;
}) {
    const [status, setStatus] = useState<'accepted' | 'declined'>(
        entry.status === 'accepted' ? 'declined' : 'accepted',
    );
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setError(null);

        router.post(
            MealManagementController.override.url(),
            { date: today, admin_id: entry.admin_id, status, password },
            {
                preserveScroll: true,
                onSuccess: onClose,
                onError: (errs) =>
                    setError(errs.password ?? 'Something went wrong.'),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                style={{
                    backdropFilter: 'blur(4px)',
                    background: 'rgba(0,0,0,0.6)',
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="relative w-full max-w-md overflow-hidden rounded-2xl"
                    style={{
                        background: 'linear-gradient(148deg, #0e1225, #090d1b)',
                        border: '1px solid rgba(239,68,68,0.35)',
                        boxShadow:
                            '0 0 0 1px rgba(239,68,68,0.08), 0 32px 80px rgba(0,0,0,0.85), 0 0 70px rgba(239,68,68,0.14)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

                    <div
                        className="flex items-center justify-between px-4 py-2.5"
                        style={{
                            background:
                                'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(239,68,68,0.05))',
                            borderBottom: '1px solid rgba(239,68,68,0.18)',
                        }}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="flex gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                                <div className="h-2.5 w-2.5 rounded-full bg-green-500/25" />
                            </div>
                            <span className="font-mono text-[9px] tracking-[0.25em] text-red-400/80 uppercase">
                                ◈ Identity Verification
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-5 w-5 items-center justify-center rounded border border-red-500/30 bg-red-500/10 text-red-400/60 transition-all hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-300"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    <div className="px-5 py-5">
                        <div className="flex items-start gap-4">
                            <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                style={{
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.28)',
                                }}
                            >
                                <ShieldAlert className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <p className="mb-1 font-mono text-[9px] tracking-[0.22em] text-red-400/70 uppercase">
                                    Override Selection
                                </p>
                                <h3 className="text-sm font-semibold text-white">
                                    {entry.name}
                                </h3>
                                <p className="mt-2 text-xs text-white/55">
                                    Confirm your password to set this
                                    admin&rsquo;s lunch for today.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submit} className="mt-5">
                            <div className="mb-4 flex gap-2">
                                {(['accepted', 'declined'] as const).map(
                                    (option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => setStatus(option)}
                                            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase transition-all ${
                                                status === option
                                                    ? option === 'accepted'
                                                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                                                        : 'border-red-500/40 bg-red-500/15 text-red-300'
                                                    : 'border-white/10 bg-white/4 text-zinc-400'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ),
                                )}
                            </div>

                            <label className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-red-400/70 uppercase">
                                ◈ Your Password
                            </label>
                            <div className="group relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Mother admin password"
                                    autoFocus
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-11 pl-4 text-sm text-white placeholder-white/20 outline-none focus:border-red-500/50 focus:bg-red-500/5"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/25 hover:text-red-400"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            {error && (
                                <p className="mt-2 font-mono text-[10px] tracking-[0.1em] text-red-400">
                                    ◈ {error}
                                </p>
                            )}

                            <div className="mt-5 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !password}
                                    className="flex-1 rounded-lg border border-red-500/30 bg-gradient-to-br from-red-600 to-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_18px_rgba(239,68,68,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Confirming...
                                        </span>
                                    ) : (
                                        'Confirm Override'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/35 to-transparent" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function MealManagementOverview({
    today,
    settings,
    todaysItem,
    blockedReason,
    roster,
    totals,
    holidays,
}: Props) {
    const echoReady = useEchoReady();
    const [overrideEntry, setOverrideEntry] = useState<RosterEntry | null>(
        null,
    );
    const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(
        null,
    );
    const [exportErrors, setExportErrors] = useState<string[]>([]);
    const [exporting, setExporting] = useState(false);
    const months = useMemo(monthOptions, []);
    const [month, setMonth] = useState(months[0]?.value ?? '');

    const itemForm = useForm({ item_name: todaysItem ?? '' });
    const settingsForm = useForm({
        accept_start_time: settings.accept_start_time?.slice(0, 5) ?? '',
        lock_time: settings.lock_time?.slice(0, 5) ?? '',
        weekly_holiday_day: settings.weekly_holiday_day,
    });
    const holidayForm = useForm({
        start_date: today,
        end_date: today,
        note: '',
    });
    const cancellationForm = useForm({ date: today, note: '' });

    const saveItem: FormEventHandler = (e) => {
        e.preventDefault();
        itemForm.put(MealManagementController.updateItem.url(), {
            preserveScroll: true,
        });
    };

    const saveSettings: FormEventHandler = (e) => {
        e.preventDefault();
        settingsForm.put(MealManagementController.updateSettings.url(), {
            preserveScroll: true,
        });
    };

    const addHoliday: FormEventHandler = (e) => {
        e.preventDefault();
        holidayForm.post(MealManagementController.storeHoliday.url(), {
            preserveScroll: true,
            onSuccess: () => holidayForm.reset('note'),
        });
    };

    const cancelDay: FormEventHandler = (e) => {
        e.preventDefault();

        if (
            !confirm(
                'This clears any selections already made for that date and excludes it from the report. Continue?',
            )
        ) {
            return;
        }

        cancellationForm.post(
            MealManagementController.storeCancellation.url(),
            {
                preserveScroll: true,
                onSuccess: () => cancellationForm.reset('note'),
            },
        );
    };

    const handleExport = async () => {
        setExporting(true);
        setExportErrors([]);

        try {
            const response = await fetch(
                MealReportController.export.url({ query: { month } }),
                { headers: { 'X-Requested-With': 'XMLHttpRequest' } },
            );

            if (!response.ok) {
                const body = await response.json().catch(() => null);
                setExportErrors([
                    body?.message ?? 'Unable to export the report.',
                ]);

                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Lunch-Report-${month}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch {
            setExportErrors(['Unable to export the report.']);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <CmsErrorDialog
                messages={exportErrors}
                onClose={() => setExportErrors([])}
            />
            <CmsDeleteDialog
                open={deletingHoliday !== null}
                message={
                    deletingHoliday
                        ? `Remove the holiday from ${deletingHoliday.start_date} to ${deletingHoliday.end_date}?`
                        : undefined
                }
                onConfirm={() => {
                    if (deletingHoliday) {
                        router.delete(
                            MealManagementController.destroyHoliday.url(
                                deletingHoliday.id,
                            ),
                            { preserveScroll: true },
                        );
                    }

                    setDeletingHoliday(null);
                }}
                onCancel={() => setDeletingHoliday(null)}
            />
            {overrideEntry && (
                <OverrideModal
                    entry={overrideEntry}
                    today={today}
                    onClose={() => setOverrideEntry(null)}
                />
            )}

            {blockedReason && (
                <div className="flex items-start gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <CalendarOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    <div>
                        <p className="text-sm font-semibold text-amber-200">
                            No lunch selection today
                        </p>
                        <p className="mt-1 text-xs text-amber-300/70">
                            {blockedReason}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    {
                        label: 'Accepted',
                        value: totals.accepted,
                        icon: CheckCircle2,
                        color: 'emerald',
                    },
                    {
                        label: 'Declined',
                        value: totals.declined,
                        icon: XCircle,
                        color: 'red',
                    },
                    {
                        label: 'Pending',
                        value: totals.pending,
                        icon: Users,
                        color: 'zinc',
                    },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className={CARD}>
                        <div className={CARD_ACCENT} />
                        <div className="flex items-center gap-3">
                            <Icon
                                className={`h-5 w-5 ${
                                    color === 'emerald'
                                        ? 'text-emerald-400'
                                        : color === 'red'
                                          ? 'text-red-400'
                                          : 'text-zinc-400'
                                }`}
                            />
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {value}
                                </p>
                                <p className="font-mono text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
                                    {label}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <div className={CARD}>
                    <div className={CARD_ACCENT} />
                    <h2 className={SECTION_TITLE}>
                        <UtensilsCrossed className="h-4 w-4 text-violet-400" />{' '}
                        Today&rsquo;s Meal Item
                    </h2>
                    <form onSubmit={saveItem} className="space-y-4">
                        <div>
                            <label className={LABEL}>Item Name</label>
                            <input
                                type="text"
                                value={itemForm.data.item_name}
                                onChange={(e) =>
                                    itemForm.setData(
                                        'item_name',
                                        e.target.value,
                                    )
                                }
                                placeholder="e.g. Chicken Biryani"
                                className={INPUT}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={itemForm.processing}
                                className={PRIMARY_BUTTON + ' flex-1'}
                            >
                                <Save className="h-4 w-4" /> Save
                            </button>
                            <button
                                type="button"
                                disabled={itemForm.processing}
                                onClick={() => {
                                    itemForm.setData('item_name', '');
                                    router.put(
                                        MealManagementController.updateItem.url(),
                                        { item_name: '' },
                                        { preserveScroll: true },
                                    );
                                }}
                                className="rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-red-500/25 hover:bg-red-500/[0.08] hover:text-white"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </div>

                <div className={CARD}>
                    <div className={CARD_ACCENT} />
                    <h2 className={SECTION_TITLE}>
                        <Clock className="h-4 w-4 text-violet-400" /> Selection
                        Schedule
                    </h2>
                    <form onSubmit={saveSettings} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>Opens At</label>
                                <input
                                    type="time"
                                    value={settingsForm.data.accept_start_time}
                                    onChange={(e) =>
                                        settingsForm.setData(
                                            'accept_start_time',
                                            e.target.value,
                                        )
                                    }
                                    className={INPUT}
                                />
                            </div>
                            <div>
                                <label className={LABEL}>Locks At</label>
                                <input
                                    type="time"
                                    value={settingsForm.data.lock_time}
                                    onChange={(e) =>
                                        settingsForm.setData(
                                            'lock_time',
                                            e.target.value,
                                        )
                                    }
                                    className={INPUT}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={LABEL}>Weekly Holiday</label>
                            <select
                                value={settingsForm.data.weekly_holiday_day}
                                onChange={(e) =>
                                    settingsForm.setData(
                                        'weekly_holiday_day',
                                        parseInt(e.target.value, 10),
                                    )
                                }
                                className={INPUT}
                            >
                                {WEEKDAYS.map((day, i) => (
                                    <option key={day} value={i}>
                                        {day}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {(settingsForm.errors.accept_start_time ||
                            settingsForm.errors.lock_time) && (
                            <p className="text-xs text-red-400">
                                {settingsForm.errors.accept_start_time ??
                                    settingsForm.errors.lock_time}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={settingsForm.processing}
                            className={PRIMARY_BUTTON + ' w-full'}
                        >
                            <Save className="h-4 w-4" /> Save Schedule
                        </button>
                    </form>
                </div>
            </div>

            <div className={CARD}>
                <div className={CARD_ACCENT} />
                {echoReady && (
                    <RealtimeTableListener
                        channel="admin.meal-management"
                        event="MealSelectionUpdated"
                        only={['roster', 'totals']}
                    />
                )}
                <div className="mb-6 flex items-center justify-between gap-4">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <UserCheck className="h-4 w-4 text-violet-400" />
                        Today&rsquo;s Roster
                    </h2>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-emerald-400/60 uppercase">
                        <Radio className="h-3 w-3 animate-pulse" />
                        Live
                    </span>
                </div>
                {roster.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                        No admins have the Meal Management permission yet.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/8 text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
                                    <th className="py-2 pr-4 font-medium">
                                        Admin
                                    </th>
                                    <th className="py-2 pr-4 font-medium">
                                        Status
                                    </th>
                                    <th className="py-2 pr-4 font-medium" />
                                </tr>
                            </thead>
                            <tbody>
                                {roster.map((entry) => (
                                    <tr
                                        key={entry.admin_id}
                                        className="border-b border-white/5 last:border-0"
                                    >
                                        <td className="py-3 pr-4">
                                            <p className="font-medium text-white">
                                                {entry.name}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {entry.email}
                                            </p>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <StatusBadge entry={entry} />
                                        </td>
                                        <td className="py-3 pr-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOverrideEntry(entry)
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-red-500/25 hover:bg-red-500/[0.08] hover:text-white"
                                            >
                                                <KeyRound className="h-3.5 w-3.5" />
                                                Override
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <div className={CARD}>
                    <div className={CARD_ACCENT} />
                    <h2 className={SECTION_TITLE}>
                        <CalendarPlus className="h-4 w-4 text-violet-400" />{' '}
                        Holidays
                    </h2>
                    <form onSubmit={addHoliday} className="mb-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>Start Date</label>
                                <input
                                    type="date"
                                    value={holidayForm.data.start_date}
                                    onChange={(e) =>
                                        holidayForm.setData(
                                            'start_date',
                                            e.target.value,
                                        )
                                    }
                                    className={INPUT}
                                />
                            </div>
                            <div>
                                <label className={LABEL}>End Date</label>
                                <input
                                    type="date"
                                    value={holidayForm.data.end_date}
                                    onChange={(e) =>
                                        holidayForm.setData(
                                            'end_date',
                                            e.target.value,
                                        )
                                    }
                                    className={INPUT}
                                />
                            </div>
                        </div>
                        <input
                            type="text"
                            value={holidayForm.data.note}
                            onChange={(e) =>
                                holidayForm.setData('note', e.target.value)
                            }
                            placeholder="Note (optional)"
                            className={INPUT}
                        />
                        {holidayForm.errors.end_date && (
                            <p className="text-xs text-red-400">
                                {holidayForm.errors.end_date}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={holidayForm.processing}
                            className={PRIMARY_BUTTON + ' w-full'}
                        >
                            <CalendarPlus className="h-4 w-4" /> Add Holiday
                        </button>
                    </form>

                    <div className="space-y-2">
                        {holidays.length === 0 && (
                            <p className="text-xs text-zinc-500">
                                No holidays configured.
                            </p>
                        )}
                        {holidays.map((holiday) => (
                            <div
                                key={holiday.id}
                                className="flex items-center justify-between rounded-lg border border-white/8 bg-white/4 px-4 py-2.5"
                            >
                                <div>
                                    <p className="text-xs font-medium text-white">
                                        {holiday.start_date} &ndash;{' '}
                                        {holiday.end_date}
                                    </p>
                                    {holiday.note && (
                                        <p className="text-[11px] text-zinc-500">
                                            {holiday.note}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDeletingHoliday(holiday)}
                                    className="text-zinc-500 hover:text-red-400"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={CARD}>
                    <div className={CARD_ACCENT} />
                    <h2 className={SECTION_TITLE}>
                        <AlertTriangle className="h-4 w-4 text-violet-400" />{' '}
                        Cancel a Day
                    </h2>
                    <form onSubmit={cancelDay} className="space-y-4">
                        <div>
                            <label className={LABEL}>Date</label>
                            <input
                                type="date"
                                value={cancellationForm.data.date}
                                onChange={(e) =>
                                    cancellationForm.setData(
                                        'date',
                                        e.target.value,
                                    )
                                }
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Note</label>
                            <textarea
                                value={cancellationForm.data.note}
                                onChange={(e) =>
                                    cancellationForm.setData(
                                        'note',
                                        e.target.value,
                                    )
                                }
                                rows={3}
                                placeholder="Explain why lunch is cancelled that day — admins will see this note."
                                className={INPUT}
                            />
                        </div>
                        {cancellationForm.errors.note && (
                            <p className="text-xs text-red-400">
                                {cancellationForm.errors.note}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={cancellationForm.processing}
                            className="w-full rounded-lg border border-amber-400/30 bg-gradient-to-br from-amber-600 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(217,119,6,0.35)] disabled:opacity-50"
                        >
                            Cancel That Day&rsquo;s Lunch
                        </button>
                    </form>
                </div>
            </div>

            <div className={CARD}>
                <div className={CARD_ACCENT} />
                <h2 className={SECTION_TITLE}>
                    <Download className="h-4 w-4 text-violet-400" /> Monthly
                    Report
                </h2>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className={INPUT + ' sm:max-w-xs'}
                    >
                        {months.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        disabled={exporting}
                        onClick={handleExport}
                        className={PRIMARY_BUTTON}
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        Export to Excel
                    </button>
                </div>
            </div>
        </div>
    );
}

MealManagementOverview.layout = (page: ReactNode) => (
    <AdminLayout title="Meal Management">{page}</AdminLayout>
);
