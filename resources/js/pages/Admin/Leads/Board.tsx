import type {
    AssignableUser,
    CurrencyOption,
    LeadDetail,
    LeadFilterValues,
    LeadRow,
    LeadStatusOption,
    PriorityOption,
} from '@/types/leads';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { router } from '@inertiajs/react';
import { AlarmClock, CalendarClock, Plus } from 'lucide-react';
import { useState } from 'react';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import CreateLeadModal from '@/components/Admin/Leads/CreateLeadModal';
import LeadFiltersBar from '@/components/Admin/Leads/LeadFiltersBar';
import LeadPanel from '@/components/Admin/Leads/LeadPanel';
import LeadsLiveRefresh from '@/components/Admin/Leads/LeadsLiveRefresh';
import { setPanelLead } from '@/components/Admin/Leads/panel';
import { TagChips } from '@/components/Admin/Leads/PipelineCards';
import { PRIMARY_BUTTON } from '@/components/Admin/Leads/ui';
import AdminLayout from '@/components/Layout/AdminLayout';
import { badgeClass, columnClass, dotClass } from '@/lib/leadColors';
import leadRoutes from '@/routes/admin/leads';

interface Props {
    leads: LeadRow[];
    filters: LeadFilterValues;
    statuses: LeadStatusOption[];
    priorities: PriorityOption[];
    currencies: CurrencyOption[];
    assignableUsers: AssignableUser[];
    can: { create: boolean; assign: boolean; export: boolean };
    selectedLead: LeadDetail | null;
}

/**
 * Leads → All Leads, for agents: a Kanban board with one column per
 * status. Drag a card to another column to change its status; tap a card
 * to open it.
 */
export default function LeadsBoard({
    leads,
    filters,
    statuses,
    priorities,
    currencies,
    assignableUsers,
    can,
    selectedLead,
}: Props) {
    const [creating, setCreating] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [moved, setMoved] = useState<Record<string, string>>({});
    const [syncedFrom, setSyncedFrom] = useState(leads);
    const [activeId, setActiveId] = useState<string | null>(null);
    const options = { statuses, priorities, currencies, assignableUsers };
    const priorityByValue = Object.fromEntries(
        priorities.map((p) => [p.value, p]),
    );

    // Fresh data from the server replaces any optimistic moves.
    if (syncedFrom !== leads) {
        setSyncedFrom(leads);
        setMoved({});
    }

    const statusOf = (lead: LeadRow) => moved[lead.id] ?? lead.status_id;
    const activeLead = leads.find((l) => l.id === activeId) ?? null;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 180, tolerance: 8 },
        }),
        useSensor(KeyboardSensor),
    );

    const onDragStart = ({ active }: DragStartEvent) =>
        setActiveId(String(active.id));

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveId(null);

        const lead = leads.find((l) => l.id === active.id);
        const target = over ? String(over.id) : null;

        if (!lead || !target || statusOf(lead) === target) {
            return;
        }

        setMoved((current) => ({ ...current, [lead.id]: target }));
        router.put(
            leadRoutes.status.url(lead.id),
            { status_id: target },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['leads', 'selectedLead'],
                onError: (e) => {
                    setMoved((current) =>
                        Object.fromEntries(
                            Object.entries(current).filter(
                                ([id]) => id !== lead.id,
                            ),
                        ),
                    );
                    setErrors(Object.values(e).filter(Boolean));
                },
            },
        );
    };

    return (
        <div className="relative space-y-5">
            <LeadsLiveRefresh />
            <CmsErrorDialog messages={errors} onClose={() => setErrors([])} />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Leads</h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Drag a card to another column to change its status.
                    </p>
                </div>
                {can.create && (
                    <button
                        type="button"
                        onClick={() => setCreating(true)}
                        className={PRIMARY_BUTTON}
                    >
                        <Plus className="h-4 w-4" /> Add Lead
                    </button>
                )}
            </div>

            <LeadFiltersBar
                filters={filters}
                statuses={statuses}
                priorities={priorities}
                assignableUsers={[]}
                showStatus={false}
                showOwner={false}
            />

            <DndContext
                sensors={sensors}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragCancel={() => setActiveId(null)}
            >
                <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
                    {statuses.map((status) => {
                        const columnLeads = leads.filter(
                            (lead) => statusOf(lead) === status.id,
                        );

                        return (
                            <Column
                                key={status.id}
                                status={status}
                                count={columnLeads.length}
                            >
                                {columnLeads.map((lead) => (
                                    <DraggableCard
                                        key={lead.id}
                                        lead={lead}
                                        priority={
                                            priorityByValue[lead.priority]
                                        }
                                    />
                                ))}
                            </Column>
                        );
                    })}
                </div>
                <DragOverlay
                    dropAnimation={{
                        duration: 200,
                        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    {activeLead && (
                        <Card
                            lead={activeLead}
                            priority={priorityByValue[activeLead.priority]}
                            lifted
                        />
                    )}
                </DragOverlay>
            </DndContext>

            <CreateLeadModal
                open={creating}
                onClose={() => setCreating(false)}
                onErrors={setErrors}
                canAssign={can.assign}
                {...options}
            />
            <LeadPanel
                lead={selectedLead}
                onClose={() => setPanelLead(null)}
                {...options}
            />
        </div>
    );
}

function Column({
    status,
    count,
    children,
}: {
    status: LeadStatusOption;
    count: number;
    children: ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: status.id });

    return (
        <section
            ref={setNodeRef}
            aria-label={status.name}
            className={`flex w-[82vw] max-w-[300px] shrink-0 snap-start flex-col rounded-xl border p-2.5 transition-colors sm:w-72 ${columnClass(status.color)} ${
                isOver ? 'ring-2 ring-violet-400/50 ring-inset' : ''
            }`}
        >
            <header className="mb-2 flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span
                        className={`h-2 w-2 rounded-full ${dotClass(status.color)}`}
                    />
                    {status.name}
                </h2>
                <span className="rounded-full bg-white/5 px-2 font-mono text-[11px] text-zinc-400">
                    {count}
                </span>
            </header>
            <div className="flex min-h-24 flex-1 flex-col gap-2">
                {children}
            </div>
        </section>
    );
}

function DraggableCard({
    lead,
    priority,
}: {
    lead: LeadRow;
    priority?: PriorityOption;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: lead.id,
    });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={`touch-manipulation ${isDragging ? 'opacity-30' : ''}`}
        >
            <Card
                lead={lead}
                priority={priority}
                onOpen={() => setPanelLead(lead.id)}
            />
        </div>
    );
}

function Card({
    lead,
    priority,
    onOpen,
    lifted = false,
}: {
    lead: LeadRow;
    priority?: PriorityOption;
    onOpen?: () => void;
    lifted?: boolean;
}) {
    const alert = lead.meeting_alert || lead.follow_up_alert;

    return (
        <button
            type="button"
            onClick={onOpen}
            className={`w-full rounded-lg border p-3 text-left transition-all ${
                alert
                    ? 'border-amber-400/40 bg-amber-500/10 shadow-[0_0_18px_rgba(251,191,36,0.15)]'
                    : 'border-white/8 bg-[#070b18] hover:border-violet-500/30'
            } ${lifted ? 'rotate-2 cursor-grabbing shadow-[0_20px_40px_-10px_rgba(124,58,237,0.6)]' : 'cursor-grab'}`}
        >
            <div className="flex items-start justify-between gap-2">
                <p
                    className={`min-w-0 truncate text-sm text-white ${lead.has_unseen_update ? 'font-bold' : 'font-medium'}`}
                >
                    {lead.name}
                </p>
                {lead.has_unseen_update && (
                    <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400"
                        title="Updated since last opened"
                    />
                )}
            </div>
            <p className="font-mono text-[10px] text-zinc-500">
                {lead.identifier}
            </p>
            {lead.company && (
                <p className="mt-1 truncate text-xs text-zinc-400">
                    {lead.company}
                </p>
            )}
            {lead.tags.length > 0 && (
                <div className="mt-1.5">
                    <TagChips tags={lead.tags} />
                </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] ${badgeClass(priority?.color)}`}
                >
                    {priority?.label ?? lead.priority}
                </span>
                {lead.assigned_to === null && (
                    <span className="rounded-full border border-cyan-400/30 px-1.5 py-0.5 text-[10px] text-cyan-300">
                        Unowned
                    </span>
                )}
                {lead.meeting_alert && (
                    <CalendarClock
                        className="h-3.5 w-3.5 animate-pulse text-amber-300"
                        aria-label="Meeting reminder"
                    />
                )}
                {lead.follow_up_alert && (
                    <AlarmClock
                        className="h-3.5 w-3.5 animate-pulse text-amber-300"
                        aria-label="Follow-up reminder"
                    />
                )}
            </div>
        </button>
    );
}

LeadsBoard.layout = (page: ReactNode) => (
    <AdminLayout title="My Leads">{page}</AdminLayout>
);
