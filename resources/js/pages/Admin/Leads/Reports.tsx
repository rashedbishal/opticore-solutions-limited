import type { FormEvent, ReactNode } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
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
import { dotClass, formatDate } from '@/lib/leadColors';
import reportRoutes from '@/routes/admin/leads/reports';

interface Report {
    total: number;
    daily: { date: string; count: number }[];
    statuses: { name: string; color: string; count: number }[];
    sources: { name: string; count: number }[];
    people: { name: string; count: number }[];
    first_response: {
        responded: number;
        average_hours: number | null;
        median_hours: number | null;
    };
    costs: {
        rows: {
            source: string;
            currency: string;
            total: number;
            leads: number;
            cost_per_lead: number | null;
        }[];
        excluded_months: string[];
    };
}

interface SpendRow {
    id: string;
    source: string;
    month: string;
    amount: string;
    currency: string | null;
    recorded_by_name: string | null;
}

interface Props {
    from: string;
    to: string;
    rangeError: string | null;
    report: Report;
    spend: SpendRow[];
    sources: { id: string; name: string }[];
    currencies: { id: string; code: string }[];
}

function hours(value: number | null): string {
    if (value === null) {
        return '—';
    }

    return value < 1
        ? `${Math.round(value * 60)} min`
        : value < 48
          ? `${value} h`
          : `${(value / 24).toFixed(1)} days`;
}

/**
 * Leads → Reports (managers): what came in, from where, to whom, and how
 * fast it was answered, for a chosen date range (Bangladesh dates).
 */
export default function Reports({
    from,
    to,
    rangeError,
    report,
    spend,
    sources,
    currencies,
}: Props) {
    const [errors, setErrors] = useState<string[]>(
        rangeError ? [rangeError] : [],
    );
    const [range, setRange] = useState({ from, to });
    const [deleting, setDeleting] = useState<SpendRow | null>(null);
    const spendForm = useForm({
        lead_source_id: sources[0]?.id ?? '',
        month: new Date().toISOString().slice(0, 7),
        amount: '',
        currency_id: currencies[0]?.id ?? '',
    });
    const maxDaily = Math.max(1, ...report.daily.map((d) => d.count));

    const apply = (e: FormEvent) => {
        e.preventDefault();
        router.get(reportRoutes.index.url(), range, { preserveScroll: true });
    };

    const saveSpend = (e: FormEvent) => {
        e.preventDefault();
        spendForm.post(reportRoutes.spend.store.url(), {
            preserveScroll: true,
            onSuccess: () => spendForm.reset('amount'),
            onError: (x) => setErrors(Object.values(x).filter(Boolean)),
        });
    };

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />
            <CmsDeleteDialog
                open={deleting !== null}
                message={`Delete the ${deleting?.month} spend for ${deleting?.source}?`}
                onConfirm={() => {
                    if (deleting) {
                        router.delete(
                            reportRoutes.spend.destroy.url(deleting.id),
                            { preserveScroll: true },
                        );
                    }

                    setDeleting(null);
                }}
                onCancel={() => setDeleting(null)}
            />
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Lead Reports
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Leads added {formatDate(from)} – {formatDate(to)}
                    </p>
                </div>
                <form
                    onSubmit={apply}
                    className="flex flex-wrap items-end gap-2"
                >
                    <label>
                        <span className={LABEL}>From</span>
                        <input
                            type="date"
                            className={INPUT}
                            value={range.from}
                            onChange={(e) =>
                                setRange({ ...range, from: e.target.value })
                            }
                        />
                    </label>
                    <label>
                        <span className={LABEL}>To</span>
                        <input
                            type="date"
                            className={INPUT}
                            value={range.to}
                            onChange={(e) =>
                                setRange({ ...range, to: e.target.value })
                            }
                        />
                    </label>
                    <button type="submit" className={PRIMARY_BUTTON}>
                        Show
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat
                    label="Leads added"
                    value={report.total.toLocaleString()}
                />
                <Stat
                    label="Got a first reply"
                    value={report.first_response.responded.toLocaleString()}
                />
                <Stat
                    label="Average reply time"
                    value={hours(report.first_response.average_hours)}
                />
                <Stat
                    label="Typical (median) reply time"
                    value={hours(report.first_response.median_hours)}
                />
            </div>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-4`}>Leads per day</p>
                <div className="flex h-36 items-end gap-px overflow-x-auto">
                    {report.daily.map((d) => (
                        <div
                            key={d.date}
                            title={`${formatDate(d.date)}: ${d.count}`}
                            className="flex h-full min-w-[6px] flex-1 flex-col justify-end"
                        >
                            <div
                                className="rounded-t bg-gradient-to-t from-violet-600 to-cyan-400 transition-all"
                                style={{
                                    height: `${(d.count / maxDaily) * 100}%`,
                                    minHeight: d.count > 0 ? 2 : 0,
                                }}
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-600">
                    <span>{formatDate(report.daily[0]?.date)}</span>
                    <span>
                        busiest day: {report.total === 0 ? 0 : maxDaily}
                    </span>
                    <span>{formatDate(report.daily.at(-1)?.date)}</span>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <BarList
                    title="By status (now)"
                    rows={report.statuses.map((s) => ({
                        label: s.name,
                        count: s.count,
                        dot: dotClass(s.color),
                    }))}
                />
                <BarList title="By source" rows={report.sources} />
                <BarList title="By person" rows={report.people} />
            </div>

            <section className={CARD}>
                <p className={`${CARD_TITLE} mb-1`}>Cost per lead</p>
                <p className="mb-4 text-xs text-zinc-500">
                    Uses whole calendar months inside the dates above.
                    {report.costs.excluded_months.length > 0 &&
                        ` Not counted (only part of the month is in range): ${report.costs.excluded_months.join(', ')}.`}
                </p>
                {report.costs.rows.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                        No spend recorded for these months.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-zinc-500">
                                    <th className="py-2 pr-4">Source</th>
                                    <th className="py-2 pr-4">Spent</th>
                                    <th className="py-2 pr-4">Leads</th>
                                    <th className="py-2">Cost per lead</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.costs.rows.map((row) => (
                                    <tr
                                        key={row.source}
                                        className="border-t border-white/5 text-zinc-200"
                                    >
                                        <td className="py-2 pr-4">
                                            {row.source}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {row.currency}{' '}
                                            {row.total.toLocaleString()}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {row.leads}
                                        </td>
                                        <td className="py-2 font-semibold">
                                            {row.cost_per_lead === null
                                                ? '—'
                                                : `${row.currency} ${row.cost_per_lead.toLocaleString()}`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <form
                    onSubmit={saveSpend}
                    className="mt-5 grid grid-cols-1 gap-3 border-t border-white/5 pt-4 sm:grid-cols-5"
                >
                    <label className="block sm:col-span-2">
                        <span className={LABEL}>Source</span>
                        <select
                            className={SELECT}
                            value={spendForm.data.lead_source_id}
                            onChange={(e) =>
                                spendForm.setData(
                                    'lead_source_id',
                                    e.target.value,
                                )
                            }
                        >
                            {sources.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className={LABEL}>Month</span>
                        <input
                            type="month"
                            className={INPUT}
                            value={spendForm.data.month}
                            onChange={(e) =>
                                spendForm.setData('month', e.target.value)
                            }
                        />
                    </label>
                    <label className="block">
                        <span className={LABEL}>Spent</span>
                        <div className="flex gap-2">
                            <select
                                aria-label="Currency"
                                className={`${SELECT} w-24`}
                                value={spendForm.data.currency_id}
                                onChange={(e) =>
                                    spendForm.setData(
                                        'currency_id',
                                        e.target.value,
                                    )
                                }
                            >
                                {currencies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.code}
                                    </option>
                                ))}
                            </select>
                            <input
                                inputMode="decimal"
                                className={INPUT}
                                value={spendForm.data.amount}
                                onChange={(e) =>
                                    spendForm.setData('amount', e.target.value)
                                }
                                placeholder="0.00"
                            />
                        </div>
                    </label>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={spendForm.processing}
                            className={`${PRIMARY_BUTTON} w-full`}
                        >
                            Save spend
                        </button>
                    </div>
                </form>
                {spend.length > 0 && (
                    <ul className="mt-4 divide-y divide-white/5">
                        {spend.map((row) => (
                            <li
                                key={row.id}
                                className="flex items-center justify-between gap-3 py-2 text-sm"
                            >
                                <span className="text-zinc-300">
                                    {row.month} · {row.source}
                                </span>
                                <span className="flex items-center gap-2 text-zinc-400">
                                    {row.currency}{' '}
                                    {Number(row.amount).toLocaleString()}
                                    <button
                                        type="button"
                                        title="Delete"
                                        onClick={() => setDeleting(row)}
                                        className="rounded-lg p-1.5 text-red-400/70 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className={CARD}>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
        </div>
    );
}

function BarList({
    title,
    rows,
}: {
    title: string;
    rows: { label?: string; name?: string; count: number; dot?: string }[];
}) {
    const max = Math.max(1, ...rows.map((r) => r.count));

    return (
        <section className={CARD}>
            <p className={`${CARD_TITLE} mb-3`}>{title}</p>
            {rows.length === 0 ? (
                <p className="text-sm text-zinc-500">No leads.</p>
            ) : (
                <ul className="space-y-2.5">
                    {rows.map((row) => {
                        const label = row.label ?? row.name ?? '';

                        return (
                            <li key={label}>
                                <div className="mb-1 flex justify-between gap-2 text-sm">
                                    <span className="flex min-w-0 items-center gap-2 truncate text-zinc-300">
                                        {row.dot && (
                                            <span
                                                className={`h-2 w-2 shrink-0 rounded-full ${row.dot}`}
                                            />
                                        )}
                                        {label}
                                    </span>
                                    <span className="font-mono text-zinc-400">
                                        {row.count}
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                                        style={{
                                            width: `${(row.count / max) * 100}%`,
                                        }}
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

Reports.layout = (page: ReactNode) => (
    <AdminLayout title="Lead Reports">{page}</AdminLayout>
);
