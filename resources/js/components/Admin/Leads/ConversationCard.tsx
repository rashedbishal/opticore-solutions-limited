import type { ConversationItem } from '@/types/leads';
import { FileText, ImageOff, Loader2, MessagesSquare } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { CARD, CARD_TITLE } from '@/components/Admin/Leads/ui';
import { formatDateTime } from '@/lib/leadColors';

const CHANNEL_LABEL: Record<string, string> = {
    messenger: 'Messenger',
    instagram: 'Instagram',
    whatsapp: 'WhatsApp',
};

/**
 * The chat with this lead (Messenger / Instagram / WhatsApp), oldest first,
 * scrolled to the newest message. Replying arrives in Phase 3.
 */
export default function ConversationCard({
    items,
}: {
    items: ConversationItem[];
}) {
    const scroller = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
    }, [items.length]);

    if (items.length === 0) {
        return null;
    }

    return (
        <div className={CARD}>
            <p className={`${CARD_TITLE} mb-3 flex items-center gap-2`}>
                <MessagesSquare className="h-3.5 w-3.5" /> Conversation
            </p>
            <div
                ref={scroller}
                className="max-h-[28rem] space-y-2 overflow-y-auto pr-1"
            >
                {items.map((item) => (
                    <Bubble key={`${item.kind}-${item.id}`} item={item} />
                ))}
            </div>
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
                    <p className="break-words whitespace-pre-wrap">
                        {item.body || (
                            <span className="text-zinc-500 italic">
                                (no text)
                            </span>
                        )}
                    </p>
                ) : (
                    <Attachment item={item} />
                )}
                <p className="mt-1 font-mono text-[10px] text-zinc-500">
                    {item.kind === 'message' &&
                        `${CHANNEL_LABEL[item.channel] ?? item.channel} · `}
                    {formatDateTime(item.at)}
                </p>
            </div>
        </div>
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
