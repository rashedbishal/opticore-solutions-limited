import type { LeadMessaging, SentMessage } from '@/types/leads';
import type { FormEvent } from 'react';
import { router, useForm } from '@inertiajs/react';
import { EyeOff, FileText, Loader2, RotateCcw, Send } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import {
    MessageStatusIcon,
    STATUS_LABEL,
} from '@/components/Admin/Leads/status';
import {
    CARD,
    CARD_TITLE,
    INPUT,
    LABEL,
    PRIMARY_BUTTON,
    SELECT,
} from '@/components/Admin/Leads/ui';
import { formatDateTime } from '@/lib/leadColors';
import messageRoutes from '@/routes/admin/leads/messages';

interface Props {
    leadId: string;
    messaging: LeadMessaging;
    messages: SentMessage[];
    canHide: boolean;
    onErrors: (messages: string[]) => void;
}

/**
 * Messages staff sent to this lead, with their delivery status, plus
 * "Send a template" for when the 24-hour reply window has closed.
 */
export default function SentMessagesCard({
    leadId,
    messaging,
    messages,
    canHide,
    onErrors,
}: Props) {
    const [hideTarget, setHideTarget] = useState<SentMessage | null>(null);

    return (
        <div className={CARD}>
            <CmsDeleteDialog
                open={hideTarget !== null}
                message="Hide this message from the list? It isn't unsent — the lead keeps it."
                onConfirm={() => {
                    if (hideTarget) {
                        router.post(
                            messageRoutes.hide.url([leadId, hideTarget.id]),
                            {},
                            { preserveScroll: true },
                        );
                    }

                    setHideTarget(null);
                }}
                onCancel={() => setHideTarget(null)}
            />
            <p className={`${CARD_TITLE} mb-3`}>Messages sent</p>

            {messaging.supports_templates && (
                <TemplateForm
                    leadId={leadId}
                    messaging={messaging}
                    onErrors={onErrors}
                />
            )}

            {messages.length === 0 ? (
                <p className="text-sm text-zinc-500">Nothing sent yet.</p>
            ) : (
                <ul className="divide-y divide-white/5">
                    {messages.map((m) => (
                        <li
                            key={m.id}
                            className="flex items-start justify-between gap-3 py-2.5"
                        >
                            <div className="min-w-0">
                                <p className="text-sm text-zinc-200">
                                    {m.type === 'template' ? (
                                        <>
                                            <span className="text-violet-300">
                                                Template
                                            </span>{' '}
                                            {m.template_name}
                                            {m.template_variables &&
                                                m.template_variables.length >
                                                    0 && (
                                                    <span className="text-zinc-500">
                                                        {' '}
                                                        (
                                                        {m.template_variables.join(
                                                            ', ',
                                                        )}
                                                        )
                                                    </span>
                                                )}
                                        </>
                                    ) : m.attachment_url ? (
                                        <a
                                            href={m.attachment_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-cyan-300 hover:underline"
                                        >
                                            <FileText className="h-3.5 w-3.5" />{' '}
                                            {m.attachment_name}
                                        </a>
                                    ) : (
                                        <span className="whitespace-pre-wrap">
                                            {m.body}
                                        </span>
                                    )}
                                    {m.attachment_url && m.body && (
                                        <span className="block text-zinc-400">
                                            {m.body}
                                        </span>
                                    )}
                                </p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                                    <MessageStatusIcon status={m.status} />
                                    {STATUS_LABEL[m.status ?? ''] ??
                                        m.status} · {m.sent_by_name ?? 'System'}{' '}
                                    · {formatDateTime(m.at)}
                                </p>
                                {m.status === 'failed' && m.failure_reason && (
                                    <p className="mt-0.5 text-xs text-red-300">
                                        {m.failure_reason}
                                    </p>
                                )}
                            </div>
                            <div className="flex shrink-0 gap-1">
                                {m.status === 'failed' && !m.resent && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.post(
                                                messageRoutes.resend.url([
                                                    leadId,
                                                    m.id,
                                                ]),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onError: (e) =>
                                                        onErrors(
                                                            Object.values(
                                                                e,
                                                            ).filter(Boolean),
                                                        ),
                                                },
                                            )
                                        }
                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-cyan-300 hover:bg-white/5"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" />{' '}
                                        Resend
                                    </button>
                                )}
                                {canHide && (
                                    <button
                                        type="button"
                                        onClick={() => setHideTarget(m)}
                                        className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
                                        title="Hide from this list"
                                    >
                                        <EyeOff className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function TemplateForm({
    leadId,
    messaging,
    onErrors,
}: {
    leadId: string;
    messaging: LeadMessaging;
    onErrors: (m: string[]) => void;
}) {
    const form = useForm<{ template_id: string; variables: string[] }>({
        template_id: '',
        variables: [],
    });
    const selected = messaging.templates.find(
        (t) => t.id === form.data.template_id,
    );

    if (!messaging.has_conversation) {
        return null;
    }

    if (!messaging.can_send_template) {
        return (
            <p className="mb-3 text-xs text-zinc-500">
                {messaging.template_blocked_reason}
            </p>
        );
    }

    if (messaging.templates.length === 0) {
        return (
            <p className="mb-3 text-xs text-zinc-500">
                No {messaging.channel_label} templates yet. A manager can add
                them under Leads → Templates.
            </p>
        );
    }

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(messageRoutes.template.url(leadId), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
            onError: (errors) =>
                onErrors(Object.values(errors).filter(Boolean)),
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mb-4 space-y-2 rounded-lg border border-white/8 bg-white/[0.02] p-3"
        >
            <label className="block">
                <span className={LABEL}>Send a template</span>
                <select
                    className={SELECT}
                    value={form.data.template_id}
                    onChange={(e) => {
                        const t = messaging.templates.find(
                            (x) => x.id === e.target.value,
                        );
                        form.setData({
                            template_id: e.target.value,
                            variables: Array.from(
                                { length: t?.variable_count ?? 0 },
                                () => '',
                            ),
                        });
                    }}
                >
                    <option value="">Choose a template…</option>
                    {messaging.templates.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name} ({t.language})
                        </option>
                    ))}
                </select>
            </label>
            {selected?.body_text && (
                <p className="rounded-md bg-black/30 px-3 py-2 text-xs whitespace-pre-wrap text-zinc-400">
                    {selected.body_text}
                </p>
            )}
            {form.data.variables.map((value, index) => (
                <input
                    key={index}
                    value={value}
                    maxLength={255}
                    onChange={(e) =>
                        form.setData(
                            'variables',
                            form.data.variables.map((v, i) =>
                                i === index ? e.target.value : v,
                            ),
                        )
                    }
                    className={INPUT}
                    placeholder={`Blank {{${index + 1}}}`}
                    aria-label={`Template blank ${index + 1}`}
                />
            ))}
            {selected && (
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className={PRIMARY_BUTTON}
                    >
                        {form.processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}{' '}
                        Send template
                    </button>
                </div>
            )}
        </form>
    );
}
