import type { LeadActivityEvent } from '@/types/leads';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    Briefcase,
    CalendarCheck,
    CalendarX,
    CheckSquare,
    GitMerge,
    Pencil,
    StickyNote,
    UserCheck,
    UserMinus,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/leadColors';

/**
 * The lead's history, newest first: status changes, assignments, notes,
 * edits, and meeting / follow-up outcomes.
 */
export default function LeadActivity({
    events,
}: {
    events: LeadActivityEvent[];
}) {
    if (events.length === 0) {
        return (
            <p className="text-sm text-zinc-500">Nothing has happened yet.</p>
        );
    }

    return (
        <ol className="relative space-y-4 border-l border-white/8 pl-5">
            {events.map((event, index) => {
                const { icon: Icon, text } = describe(event);

                return (
                    <li
                        key={`${event.type}-${event.created_at}-${index}`}
                        className="relative"
                    >
                        <span className="absolute top-0.5 -left-[29px] flex h-5 w-5 items-center justify-center rounded-full border border-violet-500/30 bg-[#070a17]">
                            <Icon className="h-3 w-3 text-violet-300" />
                        </span>
                        <p className="text-sm text-zinc-200">{text}</p>
                        {event.note && event.type !== 'assignment' && (
                            <p className="mt-1 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm whitespace-pre-wrap text-zinc-300">
                                {event.note}
                            </p>
                        )}
                        <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
                            {formatDateTime(event.created_at)}
                        </p>
                    </li>
                );
            })}
        </ol>
    );
}

function describe(event: LeadActivityEvent): {
    icon: LucideIcon;
    text: string;
} {
    const who = event.user ?? 'System';

    switch (event.type) {
        case 'status_change':
            return {
                icon: ArrowRight,
                text: `${who} moved it from ${event.old_status ?? '—'} to ${event.new_status ?? '—'}`,
            };
        case 'assignment':
            return {
                icon: UserCheck,
                text: event.user
                    ? `${who} assigned it to ${event.assigned_to ?? 'someone'}`
                    : `Assigned to ${event.assigned_to ?? 'someone'}${event.note ? ` (${event.note})` : ''}`,
            };
        case 'unassigned':
            return { icon: UserMinus, text: `${who} removed the assignee` };
        case 'merged':
            return {
                icon: GitMerge,
                text: `${who} merged ${(event.fields ?? []).join(', ')} into this lead`,
            };
        case 'deal_status':
            return {
                icon: Briefcase,
                text: `${who} moved deal "${event.name ?? ''}" from ${event.old_status ?? '—'} to ${event.new_status ?? '—'}`,
            };
        case 'task_status':
            return {
                icon: CheckSquare,
                text: `${who} marked task "${event.name ?? ''}" as ${event.new_status ?? '—'}`,
            };
        case 'note':
            return { icon: StickyNote, text: `${who} added a note` };
        case 'meeting_done':
            return {
                icon: CalendarCheck,
                text: `${who} marked the ${formatDate(event.action_date)} meeting as done`,
            };
        case 'meeting_cancelled':
            return {
                icon: CalendarX,
                text: `${who} cancelled the ${formatDate(event.action_date)} meeting`,
            };
        case 'followup_done':
            return {
                icon: CalendarCheck,
                text: `${who} marked the ${formatDate(event.action_date)} follow-up as done`,
            };
        case 'followup_cancelled':
            return {
                icon: CalendarX,
                text: `${who} cancelled the ${formatDate(event.action_date)} follow-up`,
            };
        default:
            return {
                icon: Pencil,
                text: `${who} updated ${(event.fields ?? []).join(', ') || 'the details'}`,
            };
    }
}
