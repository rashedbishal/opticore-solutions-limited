import type { LeadDetail, LeadDuplicate } from '@/types/leads';
import { Link, router } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import { Copy, GitMerge } from 'lucide-react';
import { useState } from 'react';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/components/Admin/Leads/ui';
import { formatDate } from '@/lib/leadColors';
import leadRoutes from '@/routes/admin/leads';
import duplicateRoutes from '@/routes/admin/leads/duplicates';

/**
 * "Possible duplicate" warnings (same email or phone). Managers can merge
 * the two leads or mark them as not a duplicate.
 */
export default function DuplicatesCard({ lead }: { lead: LeadDetail }) {
    const [merging, setMerging] = useState<LeadDuplicate | null>(null);

    if (lead.duplicates.length === 0) {
        return null;
    }

    return (
        <div className="relative rounded-xl border border-amber-400/30 bg-amber-500/[0.05] p-4 sm:p-5">
            <AnimatePresence>
                {merging && (
                    <MergeDialog
                        lead={lead}
                        duplicate={merging}
                        onClose={() => setMerging(null)}
                    />
                )}
            </AnimatePresence>
            <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-amber-300/80 uppercase">
                <Copy className="h-3.5 w-3.5" /> Possible duplicate
            </p>
            <ul className="space-y-2">
                {lead.duplicates.map((dup) => (
                    <li
                        key={dup.link_id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-[#060c1a]/60 px-3 py-2.5"
                    >
                        <div className="min-w-0 text-sm">
                            <p className="text-white">
                                {dup.other.can_view ? (
                                    <Link
                                        href={leadRoutes.show.url(dup.other.id)}
                                        className="font-mono text-cyan-300 hover:underline"
                                    >
                                        {dup.other.identifier}
                                    </Link>
                                ) : (
                                    <span className="font-mono text-zinc-300">
                                        {dup.other.identifier}
                                    </span>
                                )}{' '}
                                · {dup.other.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                                Same {dup.matched_fields.join(' and ')} ·{' '}
                                {dup.other.source} ·{' '}
                                {formatDate(dup.other.created_at)}
                            </p>
                        </div>
                        {dup.can_merge && (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.post(
                                            duplicateRoutes.dismiss.url([
                                                lead.id,
                                                dup.link_id,
                                            ]),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className={`${SECONDARY_BUTTON} py-1.5 text-xs`}
                                >
                                    Not a duplicate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMerging(dup)}
                                    className={`${PRIMARY_BUTTON} py-1.5 text-xs`}
                                >
                                    <GitMerge className="h-3.5 w-3.5" /> Merge
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function MergeDialog({
    lead,
    duplicate,
    onClose,
}: {
    lead: LeadDetail;
    duplicate: LeadDuplicate;
    onClose: () => void;
}) {
    const [keep, setKeep] = useState<'this' | 'other'>('this');
    const [choices, setChoices] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const conflicts =
        keep === 'this'
            ? duplicate.conflicts_keep_this
            : duplicate.conflicts_keep_other;
    const kept = keep === 'this' ? lead : duplicate.other;
    const removed = keep === 'this' ? duplicate.other : lead;

    const submit = () => {
        setProcessing(true);
        router.post(
            duplicateRoutes.merge.url([lead.id, duplicate.link_id]),
            { keep, choices },
            { onFinish: () => setProcessing(false) },
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.96, y: 8 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 8 }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-violet-500/25 bg-[#070a17] p-5 shadow-2xl"
            >
                <h2 className="text-lg font-semibold text-white">
                    Merge two leads
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                    Notes, messages, deals, tasks, tags, consents and history
                    all move to the lead you keep. The other one is hidden, not
                    deleted.
                </p>

                <p className="mt-4 mb-2 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                    Which lead do you keep?
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(
                        [
                            ['this', lead.identifier, lead.name],
                            [
                                'other',
                                duplicate.other.identifier,
                                duplicate.other.name,
                            ],
                        ] as const
                    ).map(([value, identifier, name]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => {
                                setKeep(value);
                                setChoices({});
                            }}
                            className={`rounded-lg border px-3 py-2 text-left ${
                                keep === value
                                    ? 'border-violet-400/60 bg-violet-500/10'
                                    : 'border-white/10 hover:border-white/20'
                            }`}
                        >
                            <p className="font-mono text-xs text-cyan-300">
                                {identifier}
                            </p>
                            <p className="truncate text-sm text-white">
                                {name}
                            </p>
                        </button>
                    ))}
                </div>

                {Object.keys(conflicts).length > 0 && (
                    <>
                        <p className="mt-5 mb-2 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                            These details differ — pick one of each
                        </p>
                        <div className="space-y-3">
                            {Object.entries(conflicts).map(([key, c]) => (
                                <div key={key}>
                                    <p className="mb-1 text-xs text-zinc-500">
                                        {c.label}
                                    </p>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {(
                                            [
                                                [
                                                    'survivor',
                                                    c.survivor,
                                                    kept.identifier,
                                                ],
                                                [
                                                    'loser',
                                                    c.loser,
                                                    removed.identifier,
                                                ],
                                            ] as const
                                        ).map(([side, value, from]) => {
                                            const selected =
                                                (choices[key] ?? 'survivor') ===
                                                side;

                                            return (
                                                <button
                                                    key={side}
                                                    type="button"
                                                    onClick={() =>
                                                        setChoices({
                                                            ...choices,
                                                            [key]: side,
                                                        })
                                                    }
                                                    className={`rounded-lg border px-3 py-2 text-left text-sm ${
                                                        selected
                                                            ? 'border-violet-400/60 bg-violet-500/10 text-white'
                                                            : 'border-white/10 text-zinc-400 hover:border-white/20'
                                                    }`}
                                                >
                                                    <span className="block break-words">
                                                        {value || '—'}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-zinc-500">
                                                        from {from}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className={SECONDARY_BUTTON}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={processing}
                        onClick={submit}
                        className={PRIMARY_BUTTON}
                    >
                        <GitMerge className="h-4 w-4" /> Merge into{' '}
                        {kept.identifier}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
