import type { FormEvent, ReactNode } from 'react';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import {
    CARD,
    CARD_TITLE,
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SELECT,
} from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import generalRoutes from '@/routes/admin/lead-settings/general';

interface Settings {
    distribution_mode: 'manual' | 'automatic';
    auto_distribution_method: string | null;
    lead_id_prefix: string;
    next_lead_number: number;
    meeting_alert_enabled: boolean;
    meeting_alert_days_before: number;
    followup_alert_enabled: boolean;
    followup_alert_days_before: number;
    task_alert_enabled: boolean;
    task_alert_days_before: number;
}

interface Props {
    settings: Settings;
    methodOptions: { value: string; label: string }[];
}

/** Lead Settings → General (mother admin only). */
export default function LeadGeneralSettings({
    settings,
    methodOptions,
}: Props) {
    const [errors, setErrors] = useState<string[]>([]);
    const form = useForm({
        distribution_mode: settings.distribution_mode,
        auto_distribution_method:
            settings.auto_distribution_method ??
            methodOptions[0]?.value ??
            'round_robin',
        lead_id_prefix: settings.lead_id_prefix,
        meeting_alert_enabled: settings.meeting_alert_enabled,
        meeting_alert_days_before: settings.meeting_alert_days_before,
        followup_alert_enabled: settings.followup_alert_enabled,
        followup_alert_days_before: settings.followup_alert_days_before,
        task_alert_enabled: settings.task_alert_enabled,
        task_alert_days_before: settings.task_alert_days_before,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(generalRoutes.update.url(), {
            preserveScroll: true,
            onError: (errs) => setErrors(Object.values(errs).filter(Boolean)),
        });
    };

    const prefix = (form.data.lead_id_prefix || 'OCS').toUpperCase();

    return (
        <form
            onSubmit={submit}
            className="relative mx-auto max-w-3xl space-y-5"
        >
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />
            <div>
                <h1 className="text-2xl font-bold text-white">Lead Settings</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    How new leads are handed out, how they're numbered, and
                    reminders.
                </p>
            </div>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-4`}>Who gets new leads</p>
                <div className="space-y-2">
                    {[
                        {
                            value: 'manual',
                            label: 'Manual',
                            hint: 'New leads stay unowned until a manager assigns them.',
                        },
                        {
                            value: 'automatic',
                            label: 'Automatic',
                            hint: 'New leads are given to an agent straight away.',
                        },
                    ].map((option) => (
                        <label
                            key={option.value}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5"
                        >
                            <input
                                type="radio"
                                name="distribution_mode"
                                checked={
                                    form.data.distribution_mode === option.value
                                }
                                onChange={() =>
                                    form.setData(
                                        'distribution_mode',
                                        option.value as Settings['distribution_mode'],
                                    )
                                }
                                className="mt-1 accent-violet-500"
                            />
                            <span className="text-sm text-zinc-200">
                                {option.label}
                                <span className="block text-xs text-zinc-500">
                                    {option.hint}
                                </span>
                            </span>
                        </label>
                    ))}
                </div>
                {form.data.distribution_mode === 'automatic' && (
                    <label className="mt-4 block">
                        <span className={LABEL}>How to share them out</span>
                        <select
                            className={SELECT}
                            value={form.data.auto_distribution_method}
                            onChange={(e) =>
                                form.setData(
                                    'auto_distribution_method',
                                    e.target.value,
                                )
                            }
                        >
                            {methodOptions.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </section>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-4`}>Lead numbers</p>
                <label className="block max-w-xs">
                    <span className={LABEL}>Prefix</span>
                    <input
                        className={`${INPUT} font-mono uppercase`}
                        maxLength={20}
                        value={form.data.lead_id_prefix}
                        onChange={(e) =>
                            form.setData(
                                'lead_id_prefix',
                                e.target.value.toUpperCase(),
                            )
                        }
                    />
                </label>
                <p className="mt-2 text-sm text-zinc-500">
                    The next lead will be{' '}
                    <span className="font-mono text-violet-300">
                        {prefix}-LEAD-{settings.next_lead_number}
                    </span>
                    . Numbers never repeat, even after a lead is deleted.
                </p>
            </section>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-4`}>Reminders</p>
                <p className="mb-4 text-sm text-zinc-500">
                    A glowing reminder on the lead, plus a bell alert at 8:00 AM
                    (Bangladesh time), starting some days before the date.
                </p>
                <div className="space-y-3">
                    <ReminderRow
                        label="Meeting reminders"
                        enabled={form.data.meeting_alert_enabled}
                        days={form.data.meeting_alert_days_before}
                        onEnabled={(v) =>
                            form.setData('meeting_alert_enabled', v)
                        }
                        onDays={(v) =>
                            form.setData('meeting_alert_days_before', v)
                        }
                    />
                    <ReminderRow
                        label="Follow-up reminders"
                        enabled={form.data.followup_alert_enabled}
                        days={form.data.followup_alert_days_before}
                        onEnabled={(v) =>
                            form.setData('followup_alert_enabled', v)
                        }
                        onDays={(v) =>
                            form.setData('followup_alert_days_before', v)
                        }
                    />
                    <ReminderRow
                        label="Task reminders"
                        enabled={form.data.task_alert_enabled}
                        days={form.data.task_alert_days_before}
                        onEnabled={(v) => form.setData('task_alert_enabled', v)}
                        onDays={(v) =>
                            form.setData('task_alert_days_before', v)
                        }
                    />
                </div>
            </section>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={form.processing}
                    className={PRIMARY_BUTTON}
                >
                    {form.processing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Save Settings'
                    )}
                </button>
            </div>
        </form>
    );
}

function ReminderRow({
    label,
    enabled,
    days,
    onEnabled,
    onDays,
}: {
    label: string;
    enabled: boolean;
    days: number;
    onEnabled: (value: boolean) => void;
    onDays: (value: number) => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5">
            <label className="flex flex-1 cursor-pointer items-center gap-3 text-sm text-zinc-200">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => onEnabled(e.target.checked)}
                    className="h-4 w-4 accent-violet-500"
                />
                {label}
            </label>
            <label
                className={`flex items-center gap-2 text-sm text-zinc-400 ${enabled ? '' : 'opacity-40'}`}
            >
                Start
                <input
                    type="number"
                    min={0}
                    max={365}
                    disabled={!enabled}
                    value={days}
                    onChange={(e) => onDays(Number(e.target.value))}
                    className={`${INPUT} w-20 text-center`}
                />
                {days === 0
                    ? 'days before (on the day)'
                    : days === 1
                      ? 'day before'
                      : 'days before'}
            </label>
        </div>
    );
}

LeadGeneralSettings.layout = (page: ReactNode) => (
    <AdminLayout title="Lead Settings">{page}</AdminLayout>
);
