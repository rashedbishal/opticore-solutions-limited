import type { LeadMessaging } from '@/types/leads';
import type { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Loader2, Paperclip, Send, X } from 'lucide-react';
import { useRef } from 'react';
import { INPUT, PRIMARY_BUTTON } from '@/components/Admin/Leads/ui';
import { formatDateTime } from '@/lib/leadColors';
import messageRoutes from '@/routes/admin/leads/messages';

interface Props {
    leadId: string;
    messaging: LeadMessaging;
    onErrors: (messages: string[]) => void;
}

/**
 * Write a reply on the lead's channel — text, or one picture/PDF (with the
 * text as its caption on WhatsApp). Only open inside the 24-hour window.
 */
export default function ReplyBox({ leadId, messaging, onErrors }: Props) {
    const fileInput = useRef<HTMLInputElement>(null);
    const form = useForm<{ body: string; file: File | null }>({
        body: '',
        file: null,
    });

    if (!messaging.can_reply) {
        return (
            <p className="rounded-lg border border-amber-400/20 bg-amber-500/[0.06] px-3 py-2 text-sm text-amber-200/90">
                {messaging.reply_blocked_reason}
                {messaging.can_send_template && ' Use "Send a template" below.'}
            </p>
        );
    }

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(messageRoutes.send.url(leadId), {
            preserveScroll: true,
            forceFormData: form.data.file !== null,
            onSuccess: () => {
                form.reset();

                if (fileInput.current) {
                    fileInput.current.value = '';
                }
            },
            onError: (errors) =>
                onErrors(Object.values(errors).filter(Boolean)),
        });
    };

    const accept = [...messaging.image_types, 'application/pdf'].join(',');

    return (
        <form onSubmit={submit} className="space-y-2">
            <textarea
                rows={2}
                maxLength={
                    form.data.file && messaging.caption_supported ? 1024 : 4096
                }
                value={form.data.body}
                onChange={(e) => form.setData('body', e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        submit(e);
                    }
                }}
                className={INPUT}
                placeholder={
                    form.data.file
                        ? messaging.caption_supported
                            ? 'Add a caption (optional)…'
                            : 'Add a message (sent before the file)…'
                        : `Reply on ${messaging.channel_label}…`
                }
                aria-label="Reply"
            />
            {form.data.file && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300">
                    <span className="truncate">{form.data.file.name}</span>
                    <button
                        type="button"
                        onClick={() => {
                            form.setData('file', null);

                            if (fileInput.current) {
                                fileInput.current.value = '';
                            }
                        }}
                        className="text-zinc-500 hover:text-white"
                        aria-label="Remove file"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInput}
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={(e) =>
                            form.setData('file', e.target.files?.[0] ?? null)
                        }
                    />
                    <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
                        title={`Picture (up to ${messaging.image_max_mb} MB) or PDF (up to ${messaging.document_max_mb} MB)`}
                    >
                        <Paperclip className="h-4 w-4" /> Picture / PDF
                    </button>
                    {messaging.window_closes_at && (
                        <span className="text-[11px] text-zinc-500">
                            Window open until{' '}
                            {formatDateTime(messaging.window_closes_at)}
                        </span>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={
                        form.processing ||
                        (!form.data.body.trim() && !form.data.file)
                    }
                    className={PRIMARY_BUTTON}
                >
                    {form.processing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}{' '}
                    Send
                </button>
            </div>
        </form>
    );
}
