import type {
    CurrencyOption,
    LeadDeal,
    LeadDetail,
    LeadTask,
    PriorityOption,
} from '@/types/leads';
import type { FormEvent, ReactNode } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    BellRing,
    Briefcase,
    CheckSquare,
    ListPlus,
    Pencil,
    Plus,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import {
    CARD,
    CARD_TITLE,
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
    SELECT,
} from '@/components/Admin/Leads/ui';
import { badgeClass, formatDate } from '@/lib/leadColors';
import customFieldRoutes from '@/routes/admin/leads/custom-fields';
import dealRoutes from '@/routes/admin/leads/deals';
import tagRoutes from '@/routes/admin/leads/tags';
import taskRoutes from '@/routes/admin/leads/tasks';

const VISIT = { preserveScroll: true, preserveState: true } as const;

type OnErrors = (messages: string[]) => void;

const toList = (e: Record<string, string>) => Object.values(e).filter(Boolean);

const DEAL_STATUS: Record<string, { label: string; color: string }> = {
    open: { label: 'Open', color: 'blue' },
    won: { label: 'Won', color: 'green' },
    lost: { label: 'Lost', color: 'red' },
};

const TASK_STATUS: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'blue' },
    completed: { label: 'Completed', color: 'green' },
    cancelled: { label: 'Cancelled', color: 'red' },
};

function Badge({ color, children }: { color: string; children: ReactNode }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${badgeClass(color)}`}
        >
            {children}
        </span>
    );
}

function Title({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <p className={`${CARD_TITLE} flex items-center gap-2`}>
            {icon} {children}
        </p>
    );
}

/** Small coloured chips for a lead's tags (list rows, board cards). */
export function TagChips({ tags }: { tags: LeadDetail['tags'] }) {
    if (tags.length === 0) {
        return null;
    }

    return (
        <span className="inline-flex flex-wrap gap-1">
            {tags.map((tag) => (
                <span
                    key={tag.id}
                    className={`rounded-full border px-1.5 py-px text-[10px] ${badgeClass(tag.color)}`}
                >
                    {tag.name}
                </span>
            ))}
        </span>
    );
}

export function TagsCard({
    lead,
    canUpdate,
    onErrors,
}: {
    lead: LeadDetail;
    canUpdate: boolean;
    onErrors: OnErrors;
}) {
    const available = lead.pipeline.all_tags.filter(
        (t) => !lead.tags.some((own) => own.id === t.id),
    );

    return (
        <div className={CARD}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Title icon={<Tag className="h-3.5 w-3.5" />}>Tags</Title>
                {canUpdate && available.length > 0 && (
                    <select
                        aria-label="Add a tag"
                        className={`${SELECT} w-auto py-1.5 text-xs`}
                        value=""
                        onChange={(e) =>
                            e.target.value &&
                            router.post(
                                tagRoutes.attach.url(lead.id),
                                { tag_id: e.target.value },
                                {
                                    ...VISIT,
                                    onError: (x) => onErrors(toList(x)),
                                },
                            )
                        }
                    >
                        <option value="">+ Add tag</option>
                        {available.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            {lead.tags.length === 0 ? (
                <p className="text-sm text-zinc-500">
                    {lead.pipeline.all_tags.length === 0
                        ? 'No tags exist yet. Managers add them under Leads → Tags.'
                        : 'No tags on this lead.'}
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag) => (
                        <span
                            key={tag.id}
                            className={`inline-flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-2.5 text-xs ${badgeClass(tag.color)}`}
                        >
                            {tag.name}
                            {canUpdate && (
                                <button
                                    type="button"
                                    title={`Remove ${tag.name}`}
                                    onClick={() =>
                                        router.delete(
                                            tagRoutes.detach.url([
                                                lead.id,
                                                tag.id,
                                            ]),
                                            VISIT,
                                        )
                                    }
                                    className="rounded-full p-0.5 hover:bg-white/10"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export function DealsCard({
    lead,
    currencies,
    canUpdate,
    onErrors,
}: {
    lead: LeadDetail;
    currencies: CurrencyOption[];
    canUpdate: boolean;
    onErrors: OnErrors;
}) {
    const [editing, setEditing] = useState<LeadDeal | 'new' | null>(null);
    const [deleting, setDeleting] = useState<LeadDeal | null>(null);
    const { deals, people, can_delete_deals } = lead.pipeline;

    return (
        <div className={CARD}>
            <CmsDeleteDialog
                open={deleting !== null}
                message={`Delete the deal "${deleting?.name}"? Its history is deleted too.`}
                onConfirm={() => {
                    if (deleting) {
                        router.delete(
                            dealRoutes.destroy.url([lead.id, deleting.id]),
                            VISIT,
                        );
                    }

                    setDeleting(null);
                }}
                onCancel={() => setDeleting(null)}
            />
            <div className="mb-3 flex items-center justify-between gap-2">
                <Title icon={<Briefcase className="h-3.5 w-3.5" />}>
                    Deals
                </Title>
                {canUpdate && editing === null && (
                    <button
                        type="button"
                        onClick={() => setEditing('new')}
                        className={`${SECONDARY_BUTTON} py-1.5 text-xs`}
                    >
                        <Plus className="h-3.5 w-3.5" /> New deal
                    </button>
                )}
            </div>
            {editing !== null && (
                <DealForm
                    leadId={lead.id}
                    deal={editing === 'new' ? null : editing}
                    currencies={currencies}
                    people={people}
                    onDone={() => setEditing(null)}
                    onErrors={onErrors}
                />
            )}
            {deals.length === 0 && editing === null && (
                <p className="text-sm text-zinc-500">No deals yet.</p>
            )}
            <ul className="space-y-2">
                {deals.map((deal) => (
                    <li
                        key={deal.id}
                        className="rounded-lg border border-white/8 px-3 py-2.5"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-white">
                                    {deal.name}
                                    <Badge
                                        color={DEAL_STATUS[deal.status].color}
                                    >
                                        {DEAL_STATUS[deal.status].label}
                                    </Badge>
                                </p>
                                <p className="mt-0.5 text-xs text-zinc-500">
                                    {[
                                        deal.value &&
                                            `${deal.currency ?? ''} ${Number(deal.value).toLocaleString()}`.trim(),
                                        deal.probability !== null &&
                                            `${deal.probability}% likely`,
                                        deal.expected_close_date &&
                                            `closes ${formatDate(deal.expected_close_date)}`,
                                        deal.actual_close_date &&
                                            `closed ${formatDate(deal.actual_close_date)}`,
                                        deal.owner_name &&
                                            `owner: ${deal.owner_name}`,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ') || 'No details yet'}
                                </p>
                                {deal.notes && (
                                    <p className="mt-1 text-xs whitespace-pre-wrap text-zinc-400">
                                        {deal.notes}
                                    </p>
                                )}
                            </div>
                            {canUpdate && (
                                <div className="flex shrink-0 flex-wrap items-center gap-1">
                                    {deal.status === 'open' ? (
                                        <>
                                            <StatusButton
                                                url={dealRoutes.status.url([
                                                    lead.id,
                                                    deal.id,
                                                ])}
                                                status="won"
                                                label="Won"
                                            />
                                            <StatusButton
                                                url={dealRoutes.status.url([
                                                    lead.id,
                                                    deal.id,
                                                ])}
                                                status="lost"
                                                label="Lost"
                                            />
                                        </>
                                    ) : (
                                        <StatusButton
                                            url={dealRoutes.status.url([
                                                lead.id,
                                                deal.id,
                                            ])}
                                            status="open"
                                            label="Reopen"
                                        />
                                    )}
                                    <IconButton
                                        title="Edit"
                                        onClick={() => setEditing(deal)}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </IconButton>
                                    {can_delete_deals && (
                                        <IconButton
                                            title="Delete"
                                            danger
                                            onClick={() => setDeleting(deal)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </IconButton>
                                    )}
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function DealForm({
    leadId,
    deal,
    currencies,
    people,
    onDone,
    onErrors,
}: {
    leadId: string;
    deal: LeadDeal | null;
    currencies: CurrencyOption[];
    people: { id: number; name: string }[];
    onDone: () => void;
    onErrors: OnErrors;
}) {
    const form = useForm({
        name: deal?.name ?? '',
        value: deal?.value ?? '',
        currency_id: deal?.currency_id ?? currencies[0]?.id ?? '',
        probability: deal?.probability?.toString() ?? '',
        expected_close_date: deal?.expected_close_date ?? '',
        owner_id: deal?.owner_id?.toString() ?? '',
        notes: deal?.notes ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = {
            ...VISIT,
            onSuccess: onDone,
            onError: (x: Record<string, string>) => onErrors(toList(x)),
        };

        if (deal) {
            form.put(dealRoutes.update.url([leadId, deal.id]), options);
        } else {
            form.post(dealRoutes.store.url(leadId), options);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="mb-3 grid grid-cols-1 gap-3 rounded-lg border border-violet-500/20 bg-violet-500/[0.03] p-3 sm:grid-cols-2"
        >
            <label className="block sm:col-span-2">
                <span className={LABEL}>Deal name</span>
                <input
                    className={INPUT}
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    placeholder="Website redesign"
                    required
                />
            </label>
            <label className="block">
                <span className={LABEL}>Value</span>
                <div className="flex gap-2">
                    <select
                        aria-label="Currency"
                        className={`${SELECT} w-24`}
                        value={form.data.currency_id}
                        onChange={(e) =>
                            form.setData('currency_id', e.target.value)
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
                        value={form.data.value}
                        onChange={(e) => form.setData('value', e.target.value)}
                        placeholder="0.00"
                    />
                </div>
            </label>
            <label className="block">
                <span className={LABEL}>Chance of winning (%)</span>
                <input
                    type="number"
                    min={0}
                    max={100}
                    className={INPUT}
                    value={form.data.probability}
                    onChange={(e) =>
                        form.setData('probability', e.target.value)
                    }
                />
            </label>
            <label className="block">
                <span className={LABEL}>Expected close date</span>
                <input
                    type="date"
                    className={INPUT}
                    value={form.data.expected_close_date}
                    onChange={(e) =>
                        form.setData('expected_close_date', e.target.value)
                    }
                />
            </label>
            <label className="block">
                <span className={LABEL}>Owner</span>
                <PeopleSelect
                    value={form.data.owner_id}
                    onChange={(v) => form.setData('owner_id', v)}
                    people={people}
                    current={
                        deal?.owner_id
                            ? { id: deal.owner_id, name: deal.owner_name }
                            : null
                    }
                    empty="No owner"
                />
            </label>
            <label className="block sm:col-span-2">
                <span className={LABEL}>Notes</span>
                <textarea
                    rows={2}
                    maxLength={2000}
                    className={INPUT}
                    value={form.data.notes}
                    onChange={(e) => form.setData('notes', e.target.value)}
                />
            </label>
            <FormFooter processing={form.processing} onCancel={onDone} />
        </form>
    );
}

export function TasksCard({
    lead,
    priorities,
    canUpdate,
    onErrors,
}: {
    lead: LeadDetail;
    priorities: PriorityOption[];
    canUpdate: boolean;
    onErrors: OnErrors;
}) {
    const [editing, setEditing] = useState<LeadTask | 'new' | null>(null);
    const [deleting, setDeleting] = useState<LeadTask | null>(null);
    const { tasks } = lead.pipeline;

    return (
        <div className={CARD}>
            <CmsDeleteDialog
                open={deleting !== null}
                message={`Delete the task "${deleting?.title}"?`}
                onConfirm={() => {
                    if (deleting) {
                        router.delete(
                            taskRoutes.destroy.url([lead.id, deleting.id]),
                            VISIT,
                        );
                    }

                    setDeleting(null);
                }}
                onCancel={() => setDeleting(null)}
            />
            <div className="mb-3 flex items-center justify-between gap-2">
                <Title icon={<CheckSquare className="h-3.5 w-3.5" />}>
                    Tasks
                </Title>
                {canUpdate && editing === null && (
                    <button
                        type="button"
                        onClick={() => setEditing('new')}
                        className={`${SECONDARY_BUTTON} py-1.5 text-xs`}
                    >
                        <Plus className="h-3.5 w-3.5" /> New task
                    </button>
                )}
            </div>
            {editing !== null && (
                <TaskForm
                    lead={lead}
                    task={editing === 'new' ? null : editing}
                    priorities={priorities}
                    onDone={() => setEditing(null)}
                    onErrors={onErrors}
                />
            )}
            {tasks.length === 0 && editing === null && (
                <p className="text-sm text-zinc-500">No tasks yet.</p>
            )}
            <ul className="space-y-2">
                {tasks.map((task) => {
                    const priority = priorities.find(
                        (p) => p.value === task.priority,
                    );
                    const url = taskRoutes.status.url([lead.id, task.id]);

                    return (
                        <li
                            key={task.id}
                            className={`rounded-lg border px-3 py-2.5 ${
                                task.alert
                                    ? 'border-amber-400/40 bg-amber-500/[0.06] shadow-[0_0_18px_rgba(251,191,36,0.18)]'
                                    : 'border-white/8'
                            }`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p
                                        className={`flex flex-wrap items-center gap-2 text-sm font-medium ${
                                            task.status === 'pending'
                                                ? 'text-white'
                                                : 'text-zinc-500 line-through'
                                        }`}
                                    >
                                        {task.alert && (
                                            <BellRing className="h-3.5 w-3.5 text-amber-300" />
                                        )}
                                        {task.title}
                                        <Badge
                                            color={
                                                TASK_STATUS[task.status].color
                                            }
                                        >
                                            {TASK_STATUS[task.status].label}
                                        </Badge>
                                    </p>
                                    <p className="mt-0.5 text-xs text-zinc-500">
                                        {[
                                            task.due_date &&
                                                `due ${formatDate(task.due_date)}${task.due_time ? ` ${task.due_time}` : ''}`,
                                            priority &&
                                                `${priority.label} priority`,
                                            task.assigned_to_name &&
                                                `for ${task.assigned_to_name}`,
                                            task.deal_name &&
                                                `deal: ${task.deal_name}`,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                    {task.description && (
                                        <p className="mt-1 text-xs whitespace-pre-wrap text-zinc-400">
                                            {task.description}
                                        </p>
                                    )}
                                </div>
                                {canUpdate && (
                                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                                        {task.status === 'pending' ? (
                                            <>
                                                <StatusButton
                                                    url={url}
                                                    status="completed"
                                                    label="Done"
                                                />
                                                <StatusButton
                                                    url={url}
                                                    status="cancelled"
                                                    label="Cancel"
                                                />
                                            </>
                                        ) : (
                                            <StatusButton
                                                url={url}
                                                status="pending"
                                                label="Reopen"
                                            />
                                        )}
                                        <IconButton
                                            title="Edit"
                                            onClick={() => setEditing(task)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </IconButton>
                                        {task.can_delete && (
                                            <IconButton
                                                title="Delete"
                                                danger
                                                onClick={() =>
                                                    setDeleting(task)
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </IconButton>
                                        )}
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function TaskForm({
    lead,
    task,
    priorities,
    onDone,
    onErrors,
}: {
    lead: LeadDetail;
    task: LeadTask | null;
    priorities: PriorityOption[];
    onDone: () => void;
    onErrors: OnErrors;
}) {
    const form = useForm({
        title: task?.title ?? '',
        description: task?.description ?? '',
        deal_id: task?.deal_id ?? '',
        due_date: task?.due_date ?? '',
        due_time: task?.due_time ?? '',
        priority: task?.priority ?? 'medium',
        assigned_to: task?.assigned_to?.toString() ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = {
            ...VISIT,
            onSuccess: onDone,
            onError: (x: Record<string, string>) => onErrors(toList(x)),
        };

        if (task) {
            form.put(taskRoutes.update.url([lead.id, task.id]), options);
        } else {
            form.post(taskRoutes.store.url(lead.id), options);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="mb-3 grid grid-cols-1 gap-3 rounded-lg border border-violet-500/20 bg-violet-500/[0.03] p-3 sm:grid-cols-2"
        >
            <label className="block sm:col-span-2">
                <span className={LABEL}>Task</span>
                <input
                    className={INPUT}
                    value={form.data.title}
                    onChange={(e) => form.setData('title', e.target.value)}
                    placeholder="Send the quotation"
                    required
                />
            </label>
            <label className="block">
                <span className={LABEL}>Due date</span>
                <input
                    type="date"
                    className={INPUT}
                    value={form.data.due_date}
                    onChange={(e) => form.setData('due_date', e.target.value)}
                />
            </label>
            <label className="block">
                <span className={LABEL}>Time (optional)</span>
                <input
                    type="time"
                    className={INPUT}
                    value={form.data.due_time}
                    onChange={(e) => form.setData('due_time', e.target.value)}
                />
            </label>
            <label className="block">
                <span className={LABEL}>Priority</span>
                <select
                    className={SELECT}
                    value={form.data.priority}
                    onChange={(e) => form.setData('priority', e.target.value)}
                >
                    {priorities.map((p) => (
                        <option key={p.value} value={p.value}>
                            {p.label}
                        </option>
                    ))}
                </select>
            </label>
            <label className="block">
                <span className={LABEL}>Assigned to</span>
                <PeopleSelect
                    value={form.data.assigned_to}
                    onChange={(v) => form.setData('assigned_to', v)}
                    people={lead.pipeline.people}
                    current={
                        task?.assigned_to
                            ? {
                                  id: task.assigned_to,
                                  name: task.assigned_to_name,
                              }
                            : null
                    }
                    empty="Nobody"
                />
            </label>
            {lead.pipeline.deals.length > 0 && (
                <label className="block sm:col-span-2">
                    <span className={LABEL}>For deal (optional)</span>
                    <select
                        className={SELECT}
                        value={form.data.deal_id}
                        onChange={(e) =>
                            form.setData('deal_id', e.target.value)
                        }
                    >
                        <option value="">No deal</option>
                        {lead.pipeline.deals.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            <label className="block sm:col-span-2">
                <span className={LABEL}>Details</span>
                <textarea
                    rows={2}
                    maxLength={2000}
                    className={INPUT}
                    value={form.data.description}
                    onChange={(e) =>
                        form.setData('description', e.target.value)
                    }
                />
            </label>
            <FormFooter processing={form.processing} onCancel={onDone} />
        </form>
    );
}

export function CustomFieldsCard({
    lead,
    canUpdate,
    onErrors,
}: {
    lead: LeadDetail;
    canUpdate: boolean;
    onErrors: OnErrors;
}) {
    const fields = lead.pipeline.custom_fields;
    const [editing, setEditing] = useState(false);
    const form = useForm({
        fields: Object.fromEntries(
            fields.map((f) => [f.id, f.value ?? '']),
        ) as Record<string, string>,
    });

    if (fields.length === 0) {
        return null;
    }

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(customFieldRoutes.save.url(lead.id), {
            ...VISIT,
            onSuccess: () => setEditing(false),
            onError: (x) => onErrors(toList(x)),
        });
    };

    const display = (value: string | null, type: string) =>
        value === null || value === ''
            ? '—'
            : type === 'date'
              ? formatDate(value)
              : value;

    return (
        <div className={CARD}>
            <div className="mb-3 flex items-center justify-between gap-2">
                <Title icon={<ListPlus className="h-3.5 w-3.5" />}>
                    More details
                </Title>
                {canUpdate && !editing && (
                    <button
                        type="button"
                        onClick={() => {
                            form.setData(
                                'fields',
                                Object.fromEntries(
                                    fields.map((f) => [f.id, f.value ?? '']),
                                ),
                            );
                            setEditing(true);
                        }}
                        className={`${SECONDARY_BUTTON} py-1.5 text-xs`}
                    >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                )}
            </div>
            {editing ? (
                <form
                    onSubmit={submit}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                    {fields.map((field) => {
                        const value = form.data.fields[field.id] ?? '';
                        const set = (v: string) =>
                            form.setData('fields', {
                                ...form.data.fields,
                                [field.id]: v,
                            });

                        return (
                            <label key={field.id} className="block">
                                <span className={LABEL}>
                                    {field.name}
                                    {field.is_required && ' *'}
                                </span>
                                {field.type === 'select' ? (
                                    <select
                                        className={SELECT}
                                        value={value}
                                        onChange={(e) => set(e.target.value)}
                                    >
                                        <option value="">—</option>
                                        {field.options.map((o) => (
                                            <option key={o} value={o}>
                                                {o}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={
                                            field.type === 'date'
                                                ? 'date'
                                                : 'text'
                                        }
                                        inputMode={
                                            field.type === 'number'
                                                ? 'decimal'
                                                : undefined
                                        }
                                        className={INPUT}
                                        value={value}
                                        onChange={(e) => set(e.target.value)}
                                    />
                                )}
                            </label>
                        );
                    })}
                    <FormFooter
                        processing={form.processing}
                        onCancel={() => setEditing(false)}
                    />
                </form>
            ) : (
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {fields.map((field) => (
                        <div key={field.id}>
                            <dt className={LABEL}>{field.name}</dt>
                            <dd className="text-sm text-zinc-200">
                                {display(field.value, field.type)}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}

function PeopleSelect({
    value,
    onChange,
    people,
    current,
    empty,
}: {
    value: string;
    onChange: (v: string) => void;
    people: { id: number; name: string }[];
    current: { id: number; name: string | null } | null;
    empty: string;
}) {
    return (
        <select
            className={SELECT}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">{empty}</option>
            {current && !people.some((p) => p.id === current.id) && (
                <option value={current.id}>
                    {current.name ?? 'Former admin'}
                </option>
            )}
            {people.map((p) => (
                <option key={p.id} value={p.id}>
                    {p.name}
                </option>
            ))}
        </select>
    );
}

function StatusButton({
    url,
    status,
    label,
}: {
    url: string;
    status: string;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={() => router.post(url, { status }, VISIT)}
            className={`${SECONDARY_BUTTON} px-2 py-1 text-xs`}
        >
            {label}
        </button>
    );
}

function IconButton({
    title,
    danger = false,
    onClick,
    children,
}: {
    title: string;
    danger?: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className={`rounded-lg p-1.5 ${danger ? 'text-red-400/70 hover:bg-red-500/10' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
        >
            {children}
        </button>
    );
}

function FormFooter({
    processing,
    onCancel,
}: {
    processing: boolean;
    onCancel: () => void;
}) {
    return (
        <div className="flex justify-end gap-2 sm:col-span-2">
            <button
                type="button"
                onClick={onCancel}
                className={SECONDARY_BUTTON}
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={processing}
                className={PRIMARY_BUTTON}
            >
                Save
            </button>
        </div>
    );
}
