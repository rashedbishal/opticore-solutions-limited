import type { ConversationItem, LeadMessaging } from '@/types/leads';
import { router } from '@inertiajs/react';
import {
    FileText,
    ImageOff,
    Loader2,
    MessagesSquare,
    Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import ReplyBox from '@/components/Admin/Leads/ReplyBox';
import {
    MessageStatusIcon,
    STATUS_LABEL,
} from '@/components/Admin/Leads/status';
import { CARD, CARD_TITLE } from '@/components/Admin/Leads/ui';
import { formatDateTime } from '@/lib/leadColors';
import conversationRoutes from '@/routes/admin/leads/conversation';

const CHANNEL_LABEL: Record<string, string> = {
    messenger: 'Messenger',
    instagram: 'Instagram',
    whatsapp: 'WhatsApp',
};

/**
 * The chat with this lead (Messenger / Instagram / WhatsApp), oldest first,
 * scrolled to the newest message, with the reply box underneath.
 */
export default function ConversationCard({
    items,
    leadId,
    messaging,
    canReply,
    canDelete,
    onErrors,
}: {
    items: ConversationItem[];
    leadId: string;
    messaging: LeadMessaging | null;
    canReply: boolean;
    canDelete: boolean;
    onErrors: (messages: string[]) => void;
}) {
    const scroller = useRef<HTMLDivElement>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
    }, [items.length]);

    if (items.length === 0 && !messaging?.has_conversation) {
        return null;
    }

    return (
        <div className={CARD}>
            <CmsDeleteDialog
                open={confirmDelete}
                message="Delete this lead's whole conversation (messages, pictures and files)? The lead itself stays. This cannot be undone."
                onConfirm={() => {
                    setConfirmDelete(false);
                    router.delete(conversationRoutes.destroy.url(leadId), {
                        preserveScroll: true,
                    });
                }}
                onCancel={() => setConfirmDelete(false)}
            />
            <div className="mb-3 flex items-center justify-between">
                <p className={`${CARD_TITLE} flex items-center gap-2`}>
                    <MessagesSquare className="h-3.5 w-3.5" /> Conversation
                </p>
                {canDelete && (
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="rounded-md p-1.5 text-red-400/60 hover:bg-red-500/10 hover:text-red-300"
                        title="Delete conversation"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            <div
                ref={scroller}
                className="max-h-[28rem] space-y-2 overflow-y-auto pr-1"
            >
                {items.map((item) => (
                    <Bubble key={`${item.kind}-${item.id}`} item={item} />
                ))}
            </div>
            {messaging && canReply && (
                <div className="mt-3 border-t border-white/5 pt-3">
                    <ReplyBox
                        leadId={leadId}
                        messaging={messaging}
                        onErrors={onErrors}
                    />
                </div>
            )}
        </div>
    );
}

function Bubble({ item }: { item: ConversationItem }) {
    const outbound = item.kind === 'message' && item.direction === 'outbound';

    return (
        <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    outbound
                        ? 'rounded-br-md bg-violet-600/30 text-violet-50'
                        : 'rounded-bl-md border border-white/8 bg-white/[0.04] text-zinc-200'
                }`}
            >
                {item.kind === 'message' ? (
                    <SentContent item={item} />
                ) : (
                    <Attachment item={item} />
                )}
                <p className="mt-1 flex flex-wrap items-center gap-1 font-mono text-[10px] text-zinc-500">
                    {item.kind === 'message' &&
                        `${CHANNEL_LABEL[item.channel] ?? item.channel} · `}
                    {item.kind === 'message' &&
                        outbound &&
                        item.sent_by_name &&
                        `${item.sent_by_name} · `}
                    {formatDateTime(item.at)}
                    {item.kind === 'message' && outbound && (
                        <span
                            className="ml-1 inline-flex"
                            title={STATUS_LABEL[item.status ?? ''] ?? ''}
                        >
                            <MessageStatusIcon status={item.status} />
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}

function SentContent({
    item,
}: {
    item: Extract<ConversationItem, { kind: 'message' }>;
}) {
    return (
        <>
            {item.attachment_url &&
                (item.attachment_mime?.startsWith('image/') ? (
                    <a
                        href={item.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            src={item.attachment_url}
                            alt={item.attachment_name ?? 'Sent picture'}
                            loading="lazy"
                            className="mb-1 max-h-64 rounded-lg"
                        />
                    </a>
                ) : (
                    <a
                        href={item.attachment_url}
                        className="mb-1 flex items-center gap-2 text-cyan-200 hover:underline"
                    >
                        <FileText className="h-4 w-4" /> {item.attachment_name}
                    </a>
                ))}
            {item.message_type === 'template' ? (
                <p className="text-violet-200/90 italic">
                    Template: {item.template_name}
                </p>
            ) : (
                (item.body || !item.attachment_url) && (
                    <p className="break-words whitespace-pre-wrap">
                        {item.body || (
                            <span className="text-zinc-500 italic">
                                (no text)
                            </span>
                        )}
                    </p>
                )
            )}
            {item.status === 'failed' && item.failure_reason && (
                <p className="mt-1 text-xs text-red-300">
                    {item.failure_reason}
                </p>
            )}
        </>
    );
}

function Attachment({
    item,
}: {
    item: Extract<ConversationItem, { kind: 'attachment' }>;
}) {
    if (item.status === 'downloading') {
        return (
            <span className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Downloading{' '}
                {item.type}…
            </span>
        );
    }

    if (item.status === 'failed' || !item.url) {
        return (
            <span className="flex items-center gap-2 text-zinc-500">
                <ImageOff className="h-4 w-4" /> {item.type} couldn&apos;t be
                downloaded
            </span>
        );
    }

    const mime = item.mime ?? '';

    if (mime.startsWith('image/')) {
        return (
            <a href={item.url} target="_blank" rel="noopener noreferrer">
                <img
                    src={item.url}
                    alt="Picture sent by the lead"
                    loading="lazy"
                    className="max-h-64 rounded-lg"
                />
            </a>
        );
    }

    if (mime.startsWith('video/')) {
        return (
            <video
                src={item.url}
                controls
                preload="metadata"
                className="max-h-64 rounded-lg"
            />
        );
    }

    if (mime.startsWith('audio/')) {
        return (
            <audio
                src={item.url}
                controls
                preload="metadata"
                className="w-64 max-w-full"
            />
        );
    }

    return (
        <a
            href={item.url}
            className="flex items-center gap-2 text-cyan-300 hover:underline"
        >
            <FileText className="h-4 w-4" /> Download {item.type}
        </a>
    );
}
