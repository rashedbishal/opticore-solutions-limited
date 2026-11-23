import type {
    LeadDetail as LeadDetailData,
    LeadDetailOptions,
} from '@/types/leads';
import type { FormEvent, ReactNode } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
    AlarmClock,
    Building2,
    CalendarClock,
    Check,
    ExternalLink,
    Handshake,
    Loader2,
    MessageSquareText,
    Pencil,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import ConsentCard from '@/components/Admin/Leads/ConsentCard';
import ConversationCard from '@/components/Admin/Leads/ConversationCard';
import LeadActivity from '@/components/Admin/Leads/LeadActivity';
import {
    CustomFieldsCard,
    DealsCard,
    TagsCard,
    TasksCard,
} from '@/components/Admin/Leads/PipelineCards';
import SentMessagesCard from '@/components/Admin/Leads/SentMessagesCard';
import {
    CARD,
    CARD_TITLE,
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
    SELECT,
} from '@/components/Admin/Leads/ui';
import {
    badgeClass,
    dotClass,
    formatDate,
    formatDateTime,
} from '@/lib/leadColors';
import leadRoutes from '@/routes/admin/leads';

interface Props extends LeadDetailOptions {
    lead: LeadDetailData;
    /** Rendered inside the side panel (shows "open full page" and close). */
    inPanel?: boolean;
    onClose?: () => void;
}

const VISIT_OPTIONS = { preserveScroll: true, preserveState: true } as const;

function errorList(errors: Record<string, string>): string[] {
    return Object.values(errors).filter(Boolean);
}

/**
 * One lead, in full: shared by the side panel and the lead's own page.
 * Every change is a normal request; the server checks permissions again.
 */
export default function LeadDetail({
    lead,
    statuses,
    priorities,
    currencies,
    assignableUsers,
    inPanel = false,
    onClose,
}: Props) {
    const [errors, setErrors] = useState<string[]>([]);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState<
        'meeting' | 'follow_up' | null
    >(null);
    const status = statuses.find((s) => s.id === lead.status_id);
    const priority = priorities.find((p) => p.value === lead.priority);
    const statusIndex = statuses.findIndex((s) => s.id === lead.status_id);
    const canUpdate = lead.can.update;

    const send = (
        method: 'put' | 'post',
        url: string,
        data: Record<string, unknown>,
    ) =>
        router[method](url, data as never, {
            ...VISIT_OPTIONS,
            onError: (e) => setErrors(errorList(e)),
        });

    const resolveDate = (
        kind: 'meeting' | 'follow_up',
        outcome: 'done' | 'cancelled',
    ) => send('post', leadRoutes.dates.url(lead.id), { kind, outcome });

    return (
        <div className="space-y-4">
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />
            <CmsDeleteDialog
                open={confirmDelete}
                message={`Delete ${lead.identifier} (${lead.name})? Its notes and history are deleted too. This cannot be undone.`}
                onConfirm={() => {
                    setConfirmDelete(false);
                    router.delete(leadRoutes.destroy.url(lead.id));
                }}
                onCancel={() => setConfirmDelete(false)}
            />
            <CmsDeleteDialog
                open={confirmCancel !== null}
                message={
                    confirmCancel === 'meeting'
                        ? 'Cancel this meeting? The other managers will be told.'
                        : 'Cancel this follow-up? The other managers will be told.'
                }
                onConfirm={() => {
                    if (confirmCancel) {
                        resolveDate(confirmCancel, 'cancelled');
                    }

                    setConfirmCancel(null);
                }}
                onCancel={() => setConfirmCancel(null)}
            />

            {/* Header */}
            <div className={CARD}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        {lead.avatar_url && (
                            <img
                                src={lead.avatar_url}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        )}
                        <div className="min-w-0">
                            <p className="font-mono text-[11px] tracking-[0.18em] text-violet-400/70 uppercase">
                                {lead.identifier}
                            </p>
                            <h2 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl">
                                {lead.name}
                            </h2>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${badgeClass(status?.color)}`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${dotClass(status?.color)}`}
                                    />
                                    {status?.name ?? 'Unknown'}
                                </span>
                                <span
                                    className={`rounded-full border px-2 py-0.5 ${badgeClass(priority?.color)}`}
                                >
                                    {priority?.label ?? lead.priority}
                                </span>
                                <span className="rounded-full border border-white/10 px-2 py-0.5 text-zinc-400">
                                    {lead.source.name}
                                </span>
                                <span className="text-zinc-500">
                                    Added {formatDate(lead.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        {inPanel && (
                            <Link
                                href={leadRoutes.show.url(lead.id)}
                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                                title="Open full page"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        )}
                        {lead.can.delete && (
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                className="rounded-lg p-2 text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-300"
                                title="Delete lead"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                        {inPanel && onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                                title="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Pipeline progress */}
                <div className="mt-4 flex gap-1" aria-hidden>
                    {statuses.map((s, index) => (
                        <div
                            key={s.id}
                            title={s.name}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                                index <= statusIndex
                                    ? dotClass(status?.color)
                                    : 'bg-white/8'
                            }`}
                        />
                    ))}
                </div>

                {/* Status / priority / owner */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                        <label className={LABEL} htmlFor={`status-${lead.id}`}>
                            Status
                        </label>
                        <select
                            id={`status-${lead.id}`}
                            className={SELECT}
                            value={lead.status_id}
                            disabled={!canUpdate}
                            onChange={(e) =>
                                send('put', leadRoutes.status.url(lead.id), {
                                    status_id: e.target.value,
                                })
                            }
                        >
                            {statuses.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label
                            className={LABEL}
                            htmlFor={`priority-${lead.id}`}
                        >
                            Priority
                        </label>
                        <select
                            id={`priority-${lead.id}`}
                            className={SELECT}
                            value={lead.priority}
                            disabled={!canUpdate}
                            onChange={(e) =>
                                send('put', leadRoutes.status.url(lead.id), {
                                    priority: e.target.value,
                                })
                            }
                        >
                            {priorities.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={LABEL} htmlFor={`owner-${lead.id}`}>
                            Assigned to
                        </label>
                        {lead.can.assign ? (
                            <select
                                id={`owner-${lead.id}`}
                                className={SELECT}
                                value={lead.assigned_to ?? ''}
                                onChange={(e) =>
                                    send(
                                        'put',
                                        leadRoutes.assign.url(lead.id),
                                        {
                                            assigned_to:
                                                e.target.value === ''
                                                    ? null
                                                    : Number(e.target.value),
                                        },
                                    )
                                }
                            >
                                <option value="">Unassigned</option>
                                {lead.assigned_to !== null &&
                                    !assignableUsers.some(
                                        (u) => u.id === lead.assigned_to,
                                    ) && (
                                        <option value={lead.assigned_to}>
                                            {lead.assigned_to_name}
                                        </option>
                                    )}
                                {assignableUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="py-2 text-sm text-zinc-300">
                                {lead.assigned_to_name ?? 'Unassigned'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Reminders */}
            {(lead.meeting_date || lead.next_follow_up_at) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {lead.meeting_date && (
                        <DateCard
                            icon={<CalendarClock className="h-4 w-4" />}
                            title="Meeting"
                            value={`${formatDate(lead.meeting_date)}${lead.meeting_time_label ? ` · ${lead.meeting_time_label}` : ''}`}
                            glowing={lead.meeting_alert}
                            canDone={canUpdate && lead.meeting_due}
                            canCancel={canUpdate}
                            onDone={() => resolveDate('meeting', 'done')}
                            onCancel={() => setConfirmCancel('meeting')}
                        />
                    )}
                    {lead.next_follow_up_at && (
                        <DateCard
                            icon={<AlarmClock className="h-4 w-4" />}
                            title="Next follow-up"
                            value={formatDate(lead.next_follow_up_at)}
                            glowing={lead.follow_up_alert}
                            canDone={canUpdate && lead.follow_up_due}
                            canCancel={canUpdate}
                            onDone={() => resolveDate('follow_up', 'done')}
                            onCancel={() => setConfirmCancel('follow_up')}
                        />
                    )}
                </div>
            )}

            <TagsCard lead={lead} canUpdate={canUpdate} onErrors={setErrors} />

            {(lead.message || lead.html_body) && <MessageCard lead={lead} />}

            <ConversationCard
                items={lead.conversation}
                leadId={lead.id}
                messaging={lead.messaging}
                canReply={canUpdate}
                canDelete={lead.can_delete_conversation}
                onErrors={setErrors}
            />

            {lead.messaging && canUpdate && (
                <SentMessagesCard
                    leadId={lead.id}
                    messaging={lead.messaging}
                    messages={lead.sent_messages}
                    canHide={lead.can.delete}
                    onErrors={setErrors}
                />
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <ContactCard
                    lead={lead}
                    canUpdate={canUpdate}
                    onErrors={setErrors}
                />
                <CompanyCard
                    lead={lead}
                    canUpdate={canUpdate}
                    onErrors={setErrors}
                />
            </div>

            <DealCard
                lead={lead}
                currencies={currencies}
                canUpdate={canUpdate}
                onErrors={setErrors}
            />

            <CustomFieldsCard
                lead={lead}
                canUpdate={canUpdate}
                onErrors={setErrors}
            />

            <TasksCard
                lead={lead}
                priorities={priorities}
                canUpdate={canUpdate}
                onErrors={setErrors}
            />

            <DealsCard
                lead={lead}
                currencies={currencies}
                canUpdate={canUpdate}
                onErrors={setErrors}
            />

            <ConsentCard lead={lead} />

            {canUpdate && <NoteForm leadId={lead.id} onErrors={setErrors} />}

            <div className={CARD}>
                <p className={`${CARD_TITLE} mb-3`}>History</p>
                <LeadActivity events={lead.activity} />
            </div>
        </div>
    );
}

function DateCard({
    icon,
    title,
    value,
    glowing,
    canDone,
    canCancel,
    onDone,
    onCancel,
}: {
    icon: ReactNode;
    title: string;
    value: string;
    glowing: boolean;
    canDone: boolean;
    canCancel: boolean;
    onDone: () => void;
    onCancel: () => void;
}) {
    return (
        <div
            className={`relative overflow-hidden rounded-xl border p-4 ${
                glowing
                    ? 'border-amber-400/40 bg-amber-500/10 shadow-[0_0_24px_rgba(251,191,36,0.18)]'
                    : 'border-violet-500/15 bg-[#060c1a]/80'
            }`}
        >
            {glowing && (
                <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-amber-300/5 to-transparent" />
            )}
            <div className="relative flex items-center justify-between gap-3">
                <div>
                    <p
                        className={`flex items-center gap-2 ${CARD_TITLE} ${glowing ? 'text-amber-300/90' : ''}`}
                    >
                        {icon} {title}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                        {value}
                    </p>
                </div>
                <div className="flex gap-1.5">
                    {canDone && (
                        <button
                            type="button"
                            onClick={onDone}
                            className={SECONDARY_BUTTON}
                            title="Mark as done"
                        >
                            <Check className="h-4 w-4" />
                            <span className="hidden sm:inline">Done</span>
                        </button>
                    )}
                    {canCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className={SECONDARY_BUTTON}
                            title="Cancel"
                        >
                            <X className="h-4 w-4" />
                            <span className="hidden sm:inline">Cancel</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function EditableCard({
    title,
    icon,
    canUpdate,
    editing,
    onEdit,
    children,
}: {
    title: string;
    icon: ReactNode;
    canUpdate: boolean;
    editing: boolean;
    onEdit: () => void;
    children: ReactNode;
}) {
    return (
        <div className={CARD}>
            <div className="mb-3 flex items-center justify-between">
                <p className={`${CARD_TITLE} flex items-center gap-2`}>
                    {icon} {title}
                </p>
                {canUpdate && !editing && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex items-center gap-1 font-mono text-xs text-cyan-400/70 transition-colors hover:text-cyan-300"
                    >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                )}
            </div>
            {children}
        </div>
    );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-4 border-b border-white/4 py-2 last:border-0">
            <span className="shrink-0 text-xs text-zinc-500">{label}</span>
            <span className="min-w-0 text-right text-sm break-words text-zinc-200">
                {value || '—'}
            </span>
        </div>
    );
}

function FormButtons({
    processing,
    onCancel,
}: {
    processing: boolean;
    onCancel: () => void;
}) {
    return (
        <div className="flex justify-end gap-2 pt-1">
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
                {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    'Save'
                )}
            </button>
        </div>
    );
}

function ContactCard({
    lead,
    canUpdate,
    onErrors,
}: {
    lead: LeadDetailData;
    canUpdate: boolean;
    onErrors: (e: string[]) => void;
}) {
    const [editing, setEditing] = useState(false);
    const form = useForm({
        name: lead.name,
        email: lead.email ?? '',
        phone: lead.phone ?? '',
    });

    const start = () => {
        form.setData({
            name: lead.name,
            email: lead.email ?? '',
            phone: lead.phone ?? '',
        });
        setEditing(true);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(leadRoutes.contact.url(lead.id), {
            ...VISIT_OPTIONS,
            onSuccess: () => setEditing(false),
            onError: (errs) => onErrors(errorList(errs)),
        });
    };

    return (
        <EditableCard
            title="Contact"
            icon={<User className="h-3.5 w-3.5" />}
            canUpdate={canUpdate}
            editing={editing}
            onEdit={start}
        >
            {editing ? (
                <form onSubmit={submit} className="space-y-3">
                    <TextInput
                        label="Contact person"
                        value={form.data.name}
                        onChange={(v) => form.setData('name', v)}
                    />
                    <TextInput
                        label="Email"
                        type="email"
                        value={form.data.email}
                        onChange={(v) => form.setData('email', v)}
                    />
                    <TextInput
                        label="Phone"
                        value={form.data.phone}
                        onChange={(v) => form.setData('phone', v)}
                    />
                    <FormButtons
                        processing={form.processing}
                        onCancel={() => setEditing(false)}
                    />
                </form>
            ) : (
                <div>
                    <Field label="Contact person" value={lead.name} />
                    <Field
                        label="Email"
                        value={
                            lead.email && (
                                <a
                                    className="text-cyan-300 hover:underline"
                                    href={`mailto:${lead.email}`}
                                >
                                    {lead.email}
                                </a>
                            )
                        }
                    />
                    <Field
                        label="Phone"
                        value={
                            lead.phone && (
                                <a
                                    className="text-cyan-300 hover:underline"
                                    href={`tel:${lead.phone}`}
                                >
                                    {lead.phone}
                                </a>
                            )
                        }
                    />
                </div>
            )}
        </EditableCard>
    );
}

function CompanyCard({
    lead,
    canUpdate,
    onErrors,
}: {
    lead: LeadDetailData;
    canUpdate: boolean;
    onErrors: (e: string[]) => void;
}) {
    const [editing, setEditing] = useState(false);
    const initial = () => ({
        company: lead.company ?? '',
        website: lead.website ?? '',
        industry: lead.industry ?? '',
        location: lead.location ?? '',
    });
    const form = useForm(initial());

    const start = () => {
        form.setData(initial());
        setEditing(true);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(leadRoutes.company.url(lead.id), {
            ...VISIT_OPTIONS,
            onSuccess: () => setEditing(false),
            onError: (errs) => onErrors(errorList(errs)),
        });
    };

    return (
        <EditableCard
            title="Company"
            icon={<Building2 className="h-3.5 w-3.5" />}
            canUpdate={canUpdate}
            editing={editing}
            onEdit={start}
        >
            {editing ? (
                <form onSubmit={submit} className="space-y-3">
                    <TextInput
                        label="Company"
                        value={form.data.company}
                        onChange={(v) => form.setData('company', v)}
                    />
                    <TextInput
                        label="Website"
                        placeholder="https://"
                        value={form.data.website}
                        onChange={(v) => form.setData('website', v)}
                    />
                    <TextInput
                        label="Industry"
                        value={form.data.industry}
                        onChange={(v) => form.setData('industry', v)}
                    />
                    <TextInput
                        label="Location"
                        value={form.data.location}
                        onChange={(v) => form.setData('location', v)}
                    />
                    <FormButtons
                        processing={form.processing}
                        onCancel={() => setEditing(false)}
                    />
                </form>
            ) : (
                <div>
                    <Field label="Company" value={lead.company} />
                    <Field
                        label="Website"
                        value={
                            lead.website && (
                                <a
                                    className="text-cyan-300 hover:underline"
                                    href={lead.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {lead.website}
                                </a>
                            )
                        }
                    />
                    <Field label="Industry" value={lead.industry} />
                    <Field label="Location" value={lead.location} />
                </div>
            )}
        </EditableCard>
    );
}

function DealCard({
    lead,
    currencies,
    canUpdate,
    onErrors,
}: {
    lead: LeadDetailData;
    currencies: LeadDetailOptions['currencies'];
    canUpdate: boolean;
    onErrors: (e: string[]) => void;
}) {
    const [editing, setEditing] = useState(false);
    const initial = () => ({
        service_interest: lead.service_interest ?? '',
        lead_source: lead.lead_source ?? '',
        estimated_budget: lead.estimated_budget ?? '',
        estimated_budget_currency_id: lead.estimated_budget_currency_id ?? '',
        deal_value: lead.deal_value ?? '',
        deal_value_currency_id: lead.deal_value_currency_id ?? '',
        win_probability: lead.win_probability?.toString() ?? '',
        next_follow_up_at: lead.next_follow_up_at ?? '',
        meeting_at: lead.meeting_date
            ? `${lead.meeting_date}T${lead.meeting_time ?? '09:00'}`
            : '',
    });
    const form = useForm(initial());

    const start = () => {
        form.setData(initial());
        setEditing(true);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(leadRoutes.deal.url(lead.id), {
            ...VISIT_OPTIONS,
            onSuccess: () => setEditing(false),
            onError: (errs) => onErrors(errorList(errs)),
        });
    };

    const money = (amount: string | null, code: string | null) =>
        amount
            ? `${code ? `${code} ` : ''}${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : null;

    return (
        <EditableCard
            title="Deal"
            icon={<Handshake className="h-3.5 w-3.5" />}
            canUpdate={canUpdate}
            editing={editing}
            onEdit={start}
        >
            {editing ? (
                <form
                    onSubmit={submit}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                    <TextInput
                        label="Service interested"
                        value={form.data.service_interest}
                        onChange={(v) => form.setData('service_interest', v)}
                    />
                    {lead.is_manual && (
                        <TextInput
                            label="Lead source"
                            value={form.data.lead_source}
                            onChange={(v) => form.setData('lead_source', v)}
                        />
                    )}
                    <MoneyInput
                        label="Estimated budget"
                        amount={form.data.estimated_budget}
                        currencyId={form.data.estimated_budget_currency_id}
                        currencies={currencies}
                        onAmount={(v) => form.setData('estimated_budget', v)}
                        onCurrency={(v) =>
                            form.setData('estimated_budget_currency_id', v)
                        }
                    />
                    <MoneyInput
                        label="Deal value"
                        amount={form.data.deal_value}
                        currencyId={form.data.deal_value_currency_id}
                        currencies={currencies}
                        onAmount={(v) => form.setData('deal_value', v)}
                        onCurrency={(v) =>
                            form.setData('deal_value_currency_id', v)
                        }
                    />
                    <TextInput
                        label="Win probability (%)"
                        type="number"
                        value={form.data.win_probability}
                        onChange={(v) => form.setData('win_probability', v)}
                    />
                    <TextInput
                        label="Next follow-up"
                        type="date"
                        value={form.data.next_follow_up_at}
                        onChange={(v) => form.setData('next_follow_up_at', v)}
                    />
                    <TextInput
                        label="Meeting"
                        type="datetime-local"
                        value={form.data.meeting_at}
                        onChange={(v) => form.setData('meeting_at', v)}
                    />
                    <div className="sm:col-span-2">
                        <FormButtons
                            processing={form.processing}
                            onCancel={() => setEditing(false)}
                        />
                    </div>
                </form>
            ) : (
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <div>
                        <Field
                            label="Service interested"
                            value={lead.service_interest}
                        />
                        {lead.is_manual && (
                            <Field
                                label="Lead source"
                                value={lead.lead_source}
                            />
                        )}
                        <Field
                            label="Estimated budget"
                            value={money(
                                lead.estimated_budget,
                                lead.estimated_budget_currency,
                            )}
                        />
                        <Field
                            label="Deal value"
                            value={money(
                                lead.deal_value,
                                lead.deal_value_currency,
                            )}
                        />
                    </div>
                    <div>
                        <Field
                            label="Win probability"
                            value={
                                lead.win_probability !== null
                                    ? `${lead.win_probability}%`
                                    : null
                            }
                        />
                        <Field
                            label="Next follow-up"
                            value={
                                lead.next_follow_up_at &&
                                formatDate(lead.next_follow_up_at)
                            }
                        />
                        <Field
                            label="Meeting"
                            value={
                                lead.meeting_date &&
                                `${formatDate(lead.meeting_date)}${lead.meeting_time_label ? ` · ${lead.meeting_time_label}` : ''}`
                            }
                        />
                        <Field
                            label="First contacted"
                            value={
                                lead.first_contacted_at &&
                                formatDateTime(lead.first_contacted_at)
                            }
                        />
                    </div>
                </div>
            )}
        </EditableCard>
    );
}

function NoteForm({
    leadId,
    onErrors,
}: {
    leadId: string;
    onErrors: (e: string[]) => void;
}) {
    const form = useForm({ note: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(leadRoutes.notes.url(leadId), {
            ...VISIT_OPTIONS,
            onSuccess: () => form.reset(),
            onError: (errs) => onErrors(errorList(errs)),
        });
    };

    return (
        <form onSubmit={submit} className={CARD}>
            <label
                className={`${CARD_TITLE} mb-2 block`}
                htmlFor={`note-${leadId}`}
            >
                Add a note
            </label>
            <textarea
                id={`note-${leadId}`}
                rows={3}
                maxLength={2000}
                value={form.data.note}
                onChange={(e) => form.setData('note', e.target.value)}
                className={INPUT}
                placeholder="What happened? What's next?"
            />
            <div className="mt-2 flex justify-end">
                <button
                    type="submit"
                    disabled={form.processing || form.data.note.trim() === ''}
                    className={PRIMARY_BUTTON}
                >
                    {form.processing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Add note'
                    )}
                </button>
            </div>
        </form>
    );
}

export function TextInput({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    required,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className={LABEL}>
                {label}
                {required && <span className="text-rose-400"> *</span>}
            </span>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className={INPUT}
                step={type === 'number' ? 'any' : undefined}
            />
        </label>
    );
}

export function MoneyInput({
    label,
    amount,
    currencyId,
    currencies,
    onAmount,
    onCurrency,
}: {
    label: string;
    amount: string;
    currencyId: string;
    currencies: LeadDetailOptions['currencies'];
    onAmount: (value: string) => void;
    onCurrency: (value: string) => void;
}) {
    return (
        <div>
            <span className={LABEL}>{label}</span>
            <div className="flex gap-2">
                <select
                    aria-label={`${label} currency`}
                    value={currencyId}
                    onChange={(e) => onCurrency(e.target.value)}
                    className={`${SELECT} w-24 shrink-0`}
                >
                    <option value="">—</option>
                    {currencies.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.code}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => onAmount(e.target.value)}
                    className={INPUT}
                    aria-label={label}
                />
            </div>
        </div>
    );
}

/**
 * The lead's original message. For emails, a switch shows the formatted
 * (HTML) version inside a locked-down frame: no scripts, no forms, no
 * access to the CMS.
 */
function MessageCard({ lead }: { lead: LeadDetailData }) {
    const [formatted, setFormatted] = useState(false);

    return (
        <div className={CARD}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className={`${CARD_TITLE} flex items-center gap-2`}>
                    <MessageSquareText className="h-3.5 w-3.5" /> Message
                </p>
                {lead.html_body && (
                    <div className="flex rounded-lg border border-white/8 p-0.5 text-xs">
                        {(['Text', 'Formatted'] as const).map((label) => {
                            const active =
                                (label === 'Formatted') === formatted;

                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() =>
                                        setFormatted(label === 'Formatted')
                                    }
                                    className={`rounded-md px-2.5 py-1 transition-colors ${
                                        active
                                            ? 'bg-violet-500/20 text-violet-100'
                                            : 'text-zinc-500 hover:text-zinc-200'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            {lead.subject && (
                <p className="mb-2 text-sm font-semibold text-white">
                    {lead.subject}
                </p>
            )}
            {formatted && lead.html_body ? (
                <iframe
                    title="Formatted email"
                    sandbox=""
                    srcDoc={lead.html_body}
                    className="h-96 w-full rounded-lg border border-white/8 bg-white"
                />
            ) : (
                <p className="text-sm whitespace-pre-wrap text-zinc-300">
                    {lead.message}
                </p>
            )}
        </div>
    );
}
