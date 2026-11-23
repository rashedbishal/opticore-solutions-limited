import type {
    AssignableUser,
    LeadStatusOption,
    LeadTagOption,
    PriorityOption,
} from '@/types/leads';
import { router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import {
    PRIMARY_BUTTON,
    SECONDARY_BUTTON,
    SELECT,
} from '@/components/Admin/Leads/ui';
import leadRoutes from '@/routes/admin/leads';

const MAX = 100;

type Action =
    | 'status'
    | 'priority'
    | 'assign'
    | 'unassign'
    | 'tag_attach'
    | 'tag_detach'
    | 'delete';

const ACTIONS: { value: Action; label: string }[] = [
    { value: 'status', label: 'Change status' },
    { value: 'priority', label: 'Change priority' },
    { value: 'assign', label: 'Assign to' },
    { value: 'unassign', label: 'Unassign' },
    { value: 'tag_attach', label: 'Add tag' },
    { value: 'tag_detach', label: 'Remove tag' },
    { value: 'delete', label: 'Delete' },
];

/**
 * Appears above the managers' lead list once leads are ticked.
 */
export default function BulkBar({
    selected,
    statuses,
    priorities,
    assignableUsers,
    tags,
    onClear,
    onErrors,
}: {
    selected: string[];
    statuses: LeadStatusOption[];
    priorities: PriorityOption[];
    assignableUsers: AssignableUser[];
    tags: LeadTagOption[];
    onClear: () => void;
    onErrors: (messages: string[]) => void;
}) {
    const [action, setAction] = useState<Action>('status');
    const [value, setValue] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [processing, setProcessing] = useState(false);
    const tooMany = selected.length > MAX;

    const choices: { value: string; label: string }[] | null =
        action === 'status'
            ? statuses.map((s) => ({ value: s.id, label: s.name }))
            : action === 'priority'
              ? priorities.map((p) => ({ value: p.value, label: p.label }))
              : action === 'assign'
                ? assignableUsers.map((u) => ({
                      value: String(u.id),
                      label: u.name,
                  }))
                : action === 'tag_attach' || action === 'tag_detach'
                  ? tags.map((t) => ({ value: t.id, label: t.name }))
                  : null;

    const field: Record<Action, string | null> = {
        status: 'status_id',
        priority: 'priority',
        assign: 'assigned_to',
        unassign: null,
        tag_attach: 'tag_id',
        tag_detach: 'tag_id',
        delete: null,
    };

    const run = () => {
        const key = field[action];
        setProcessing(true);
        router.post(
            leadRoutes.bulk.url(),
            { action, lead_ids: selected, ...(key ? { [key]: value } : {}) },
            {
                preserveScroll: true,
                onSuccess: onClear,
                onError: (e) => onErrors(Object.values(e).filter(Boolean)),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="sticky top-2 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-violet-500/30 bg-[#0b1024]/95 px-3 py-2.5 shadow-lg backdrop-blur">
            <CmsDeleteDialog
                open={confirming}
                message={`Delete ${selected.length} lead${selected.length === 1 ? '' : 's'}? Their notes and history are deleted too. This cannot be undone.`}
                onConfirm={() => {
                    setConfirming(false);
                    run();
                }}
                onCancel={() => setConfirming(false)}
            />
            <span className="text-sm text-white">
                {selected.length} selected
            </span>
            {tooMany && (
                <span className="text-xs text-red-300">
                    (at most {MAX} at once)
                </span>
            )}
            <select
                aria-label="Action"
                className={`${SELECT} w-auto py-1.5 text-sm`}
                value={action}
                onChange={(e) => {
                    setAction(e.target.value as Action);
                    setValue('');
                }}
            >
                {ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                        {a.label}
                    </option>
                ))}
            </select>
            {choices && (
                <select
                    aria-label="Value"
                    className={`${SELECT} w-auto py-1.5 text-sm`}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                >
                    <option value="">Choose…</option>
                    {choices.map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.label}
                        </option>
                    ))}
                </select>
            )}
            <button
                type="button"
                disabled={
                    processing || tooMany || (choices !== null && value === '')
                }
                onClick={() =>
                    action === 'delete' ? setConfirming(true) : run()
                }
                className={`${PRIMARY_BUTTON} py-1.5`}
            >
                Apply
            </button>
            <button
                type="button"
                onClick={onClear}
                className={`${SECONDARY_BUTTON} ml-auto py-1.5`}
            >
                <X className="h-4 w-4" /> Clear
            </button>
        </div>
    );
}
