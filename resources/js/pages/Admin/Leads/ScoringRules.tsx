import type { FormEvent, ReactNode } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import {
    CARD,
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
    SELECT,
} from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import scoring from '@/routes/admin/leads/scoring';

interface FieldMeta {
    value: string;
    label: string;
    kind: 'numeric' | 'choice' | 'yes_no';
    operators: { value: string; label: string }[];
    options: Record<string, string> | null;
}

interface RuleRow {
    id: string;
    name: string;
    field: string;
    operator: string;
    value: unknown;
    points: number;
    is_active: boolean;
    sort_order: number;
    summary: string;
}

interface Props {
    rules: RuleRow[];
    fields: FieldMeta[];
}

type FormData = {
    name: string;
    field: string;
    operator: string;
    value: string | string[];
    points: string;
    is_active: boolean;
    sort_order: string;
};

const LIST_OPERATORS = ['in', 'not_in'];

function emptyForm(fields: FieldMeta[]): FormData {
    const field = fields[0];

    return {
        name: '',
        field: field?.value ?? '',
        operator: field?.operators[0]?.value ?? '',
        value: '',
        points: '10',
        is_active: true,
        sort_order: '0',
    };
}

function asFormValue(value: unknown): string | string[] {
    if (Array.isArray(value)) {
        return value.map(String);
    }

    if (typeof value === 'boolean') {
        return value ? '1' : '0';
    }

    return value === null || value === undefined ? '' : String(value);
}

/**
 * Leads → Scoring Rules (managers): points that add up to each lead's
 * 0–100 score.
 */
export default function ScoringRules({ rules, fields }: Props) {
    const [errors, setErrors] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<RuleRow | null>(null);
    const form = useForm<FormData>(emptyForm(fields));
    const field = fields.find((f) => f.value === form.data.field);
    const isList = LIST_OPERATORS.includes(form.data.operator);
    const maxTotal = rules
        .filter((r) => r.is_active && r.points > 0)
        .reduce((sum, r) => sum + r.points, 0);

    const onError = (e: Record<string, string>) =>
        setErrors(Object.values(e).filter(Boolean));

    const reset = () => {
        setEditingId(null);
        form.setData(emptyForm(fields));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: reset, onError };

        if (editingId) {
            form.put(scoring.update.url(editingId), options);
        } else {
            form.post(scoring.store.url(), options);
        }
    };

    const changeField = (value: string) => {
        const next = fields.find((f) => f.value === value);
        form.setData({
            ...form.data,
            field: value,
            operator: next?.operators[0]?.value ?? '',
            value: '',
        });
    };

    const changeOperator = (value: string) => {
        const toList = LIST_OPERATORS.includes(value);
        form.setData({
            ...form.data,
            operator: value,
            value: toList ? [] : '',
        });
    };

    const listValue = Array.isArray(form.data.value) ? form.data.value : [];

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />
            <CmsDeleteDialog
                open={deleting !== null}
                message={`Delete the rule "${deleting?.name}"? Scores are updated afterwards.`}
                onConfirm={() => {
                    if (deleting) {
                        router.delete(scoring.destroy.url(deleting.id), {
                            preserveScroll: true,
                        });
                    }

                    setDeleting(null);
                }}
                onCancel={() => setDeleting(null)}
            />
            <div>
                <h1 className="text-2xl font-bold text-white">Scoring Rules</h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Each matching rule adds (or takes away) points. A
                    lead&apos;s score is the total, kept between 0 and 100.
                    Changing rules updates every lead&apos;s score in the
                    background.
                </p>
            </div>

            <form
                onSubmit={submit}
                className={`${CARD} grid grid-cols-1 gap-4 sm:grid-cols-2`}
            >
                <label className="block sm:col-span-2">
                    <span className={LABEL}>
                        {editingId ? 'Edit rule' : 'New rule'} — name
                    </span>
                    <input
                        className={INPUT}
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="High priority"
                        maxLength={255}
                        required
                    />
                </label>
                <label className="block">
                    <span className={LABEL}>If</span>
                    <select
                        className={SELECT}
                        value={form.data.field}
                        onChange={(e) => changeField(e.target.value)}
                    >
                        {fields.map((f) => (
                            <option key={f.value} value={f.value}>
                                {f.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className={LABEL}>Comparison</span>
                    <select
                        className={SELECT}
                        value={form.data.operator}
                        onChange={(e) => changeOperator(e.target.value)}
                    >
                        {field?.operators.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="block sm:col-span-2">
                    <span className={LABEL}>Value</span>
                    {field?.options && isList ? (
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(field.options).map(
                                ([value, label]) => (
                                    <label
                                        key={value}
                                        className="flex items-center gap-2 text-sm text-zinc-300"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={listValue.includes(value)}
                                            onChange={(e) =>
                                                form.setData(
                                                    'value',
                                                    e.target.checked
                                                        ? [...listValue, value]
                                                        : listValue.filter(
                                                              (v) =>
                                                                  v !== value,
                                                          ),
                                                )
                                            }
                                        />
                                        {label}
                                    </label>
                                ),
                            )}
                        </div>
                    ) : field?.options ? (
                        <select
                            className={SELECT}
                            value={
                                typeof form.data.value === 'string'
                                    ? form.data.value
                                    : ''
                            }
                            onChange={(e) =>
                                form.setData('value', e.target.value)
                            }
                        >
                            <option value="">Choose…</option>
                            {Object.entries(field.options).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                    ) : (
                        <input
                            inputMode="decimal"
                            className={INPUT}
                            value={
                                typeof form.data.value === 'string'
                                    ? form.data.value
                                    : ''
                            }
                            onChange={(e) =>
                                form.setData('value', e.target.value)
                            }
                            placeholder="e.g. 14"
                        />
                    )}
                </div>
                <label className="block">
                    <span className={LABEL}>Points (use − to take away)</span>
                    <input
                        type="number"
                        min={-1000}
                        max={1000}
                        className={INPUT}
                        value={form.data.points}
                        onChange={(e) => form.setData('points', e.target.value)}
                    />
                </label>
                <label className="block">
                    <span className={LABEL}>Order</span>
                    <input
                        type="number"
                        min={0}
                        max={9999}
                        className={INPUT}
                        value={form.data.sort_order}
                        onChange={(e) =>
                            form.setData('sort_order', e.target.value)
                        }
                    />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm text-zinc-300">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(e) =>
                                form.setData('is_active', e.target.checked)
                            }
                        />
                        Turned on
                    </label>
                    <div className="flex gap-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={reset}
                                className={SECONDARY_BUTTON}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className={PRIMARY_BUTTON}
                        >
                            <Plus className="h-4 w-4" />
                            {editingId ? 'Save rule' : 'Add rule'}
                        </button>
                    </div>
                </div>
            </form>

            <section className={CARD}>
                {rules.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                        No rules yet — until you add one, leads show “Not
                        scored”.
                    </p>
                ) : (
                    <>
                        <p className="mb-3 text-xs text-zinc-500">
                            If a lead matched every “+” rule it would get{' '}
                            {maxTotal} points
                            {maxTotal > 100 && ' (shown as 100)'}.
                        </p>
                        <ul className="divide-y divide-white/5">
                            {rules.map((rule) => (
                                <li
                                    key={rule.id}
                                    className="flex items-center justify-between gap-3 py-2.5"
                                >
                                    <div className="min-w-0">
                                        <p
                                            className={`text-sm ${rule.is_active ? 'text-white' : 'text-zinc-500'}`}
                                        >
                                            {rule.name}{' '}
                                            <span
                                                className={`ml-1 font-mono ${rule.points >= 0 ? 'text-emerald-300' : 'text-red-300'}`}
                                            >
                                                {rule.points >= 0 ? '+' : ''}
                                                {rule.points}
                                            </span>
                                        </p>
                                        <p className="truncate text-xs text-zinc-500">
                                            {rule.summary}
                                            {!rule.is_active && ' · Off'}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <button
                                            type="button"
                                            title={
                                                rule.is_active
                                                    ? 'Turn off'
                                                    : 'Turn on'
                                            }
                                            onClick={() =>
                                                router.post(
                                                    scoring.toggle.url(rule.id),
                                                    {},
                                                    { preserveScroll: true },
                                                )
                                            }
                                            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5"
                                        >
                                            <Power
                                                className={`h-4 w-4 ${rule.is_active ? 'text-emerald-400' : ''}`}
                                            />
                                        </button>
                                        <button
                                            type="button"
                                            title="Edit"
                                            onClick={() => {
                                                setEditingId(rule.id);
                                                form.setData({
                                                    name: rule.name,
                                                    field: rule.field,
                                                    operator: rule.operator,
                                                    value: asFormValue(
                                                        rule.value,
                                                    ),
                                                    points: String(rule.points),
                                                    is_active: rule.is_active,
                                                    sort_order: String(
                                                        rule.sort_order,
                                                    ),
                                                });
                                            }}
                                            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            title="Delete"
                                            onClick={() => setDeleting(rule)}
                                            className="rounded-lg p-2 text-red-400/70 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </section>
        </div>
    );
}

ScoringRules.layout = (page: ReactNode) => (
    <AdminLayout title="Scoring Rules">{page}</AdminLayout>
);
