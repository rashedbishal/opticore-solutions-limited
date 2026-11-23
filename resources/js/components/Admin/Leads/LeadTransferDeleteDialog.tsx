import { AnimatePresence, m as motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SELECT } from '@/components/Admin/Leads/ui';

interface Props {
    admin: { id: number; name: string; owned_leads_count: number } | null;
    receivers: { id: number; name: string }[];
    onConfirm: (receiverId: number) => void;
    onCancel: () => void;
}

/**
 * Deleting an admin who still owns leads: the mother admin picks who
 * receives those leads before the delete goes ahead.
 */
export default function LeadTransferDeleteDialog({
    admin,
    receivers,
    onConfirm,
    onCancel,
}: Props) {
    const [receiverId, setReceiverId] = useState('');
    const options = receivers.filter((r) => r.id !== admin?.id);

    return (
        <AnimatePresence>
            {admin && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#060c1a] p-6 shadow-2xl"
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                                <Trash2 className="h-5 w-5 text-red-400" />
                            </span>
                            <h2 className="text-lg font-bold text-white">
                                Delete {admin.name}?
                            </h2>
                        </div>
                        <p className="text-sm text-zinc-400">
                            {admin.name} still owns {admin.owned_leads_count}{' '}
                            {admin.owned_leads_count === 1 ? 'lead' : 'leads'}.
                            Choose who should receive{' '}
                            {admin.owned_leads_count === 1 ? 'it' : 'them'}.
                            This cannot be undone.
                        </p>
                        <select
                            aria-label="Give the leads to"
                            className={`${SELECT} mt-4`}
                            value={receiverId}
                            onChange={(e) => setReceiverId(e.target.value)}
                        >
                            <option value="">Choose a person…</option>
                            {options.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                        {options.length === 0 && (
                            <p className="mt-2 text-xs text-amber-300">
                                Nobody else has a lead role yet. Give someone a
                                lead role first.
                            </p>
                        )}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={receiverId === ''}
                                onClick={() => {
                                    onConfirm(Number(receiverId));
                                    setReceiverId('');
                                }}
                                className="rounded-lg border border-red-500/30 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/25 disabled:opacity-40"
                            >
                                Move leads & delete
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
