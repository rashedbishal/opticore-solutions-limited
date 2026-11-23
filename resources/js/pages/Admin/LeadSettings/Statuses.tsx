import type { DragEndEvent } from '@dnd-kit/core';
import type { FormEvent, ReactNode } from 'react';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router, useForm } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import {
    Edit,
    GripVertical,
    Loader2,
    Lock,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { CmsDeleteDialog } from '@/components/Admin/CmsDeleteDialog';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import statusRoutes from '@/routes/admin/lead-settings/statuses';

interface LeadStatus {
    id: string;
    name: string;
    color: string;
    is_closed: boolean;
    sort_order: number;
}

interface Props {
    statuses: LeadStatus[];
    colorOptions: string[];
}

/** Literal class strings so Tailwind's scanner keeps every swatch colour. */
const SWATCH: Record<string, string> = {
    blue: 'bg-blue-500',
    sky: 'bg-sky-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    zinc: 'bg-zinc-400',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
    pink: 'bg-pink-500',
};

const PRIMARY_BUTTON =
    'relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 disabled:opacity-50';
const SECONDARY_BUTTON =
    'rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white';
const LABEL =
    'mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase';

export default function LeadStatusesIndex({ statuses, colorOptions }: Props) {
    const [order, setOrder] = useState<LeadStatus[]>(statuses);
    const [syncedFrom, setSyncedFrom] = useState(statuses);
    const [editing, setEditing] = useState<LeadStatus | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<LeadStatus | null>(null);

    // Server data changed (after add/edit/delete) — show it.
    if (syncedFrom !== statuses) {
        setSyncedFrom(statuses);
        setOrder(statuses);
    }

    const form = useForm({
        name: '',
        color: colorOptions[0] ?? 'blue',
        is_closed: false as boolean,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) {
            return;
        }

        const previous = order;
        const next = arrayMove(
            order,
            order.findIndex((s) => s.id === active.id),
            order.findIndex((s) => s.id === over.id),
        );

        setOrder(next);
        router.post(
            statusRoutes.reorder.url(),
            { ids: next.map((s) => s.id) },
            {
                preserveScroll: true,
                onError: (errors) => {
                    setOrder(previous);
                    setErrorMessages(
                        Object.values(errors).filter(Boolean) as string[],
                    );
                },
            },
        );
    };

    const openCreate = () => {
        form.clearErrors();
        form.setData({
            name: '',
            color: colorOptions[0] ?? 'blue',
            is_closed: false,
        });
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (status: LeadStatus) => {
        form.clearErrors();
        form.setData({
            name: status.name,
            color: status.color,
            is_closed: status.is_closed,
        });
        setEditing(status);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        form.clearErrors();
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: (errors: Record<string, string>) =>
                setErrorMessages(Object.values(errors).filter(Boolean)),
        };

        if (editing) {
            form.put(statusRoutes.update.url(editing.id), options);
        } else {
            form.post(statusRoutes.store.url(), options);
        }
    };

    return (
        <div className="relative space-y-6">
            <CmsErrorDialog
                messages={errorMessages}
                onClose={() => setErrorMessages([])}
            />
            <CmsDeleteDialog
                open={deleteTarget !== null}
                message={
                    deleteTarget
                        ? `Delete the "${deleteTarget.name}" status? This cannot be undone.`
                        : undefined
                }
                onConfirm={() => {
                    if (deleteTarget) {
                        router.delete(
                            statusRoutes.destroy.url(deleteTarget.id),
                            {
                                preserveScroll: true,
                            },
                        );
                    }

                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Lead Statuses
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        The columns of the lead board, left to right. Drag to
                        change the order.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className={PRIMARY_BUTTON}
                >
                    <Plus className="h-4 w-4" /> Add Status
                </button>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

                {order.length === 0 ? (
                    <p className="px-6 py-16 text-center font-mono text-xs tracking-[0.2em] text-violet-400/30 uppercase">
                        No statuses yet
                    </p>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEnd}
                    >
                        <SortableContext
                            items={order.map((s) => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <ul>
                                {order.map((status, index) => (
                                    <SortableStatusRow
                                        key={status.id}
                                        status={status}
                                        position={index + 1}
                                        onEdit={() => openEdit(status)}
                                        onDelete={() => setDeleteTarget(status)}
                                    />
                                ))}
                            </ul>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-violet-500/20 bg-[#060c1a] p-6 shadow-2xl"
                        >
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">
                                    {editing ? 'Edit Status' : 'Add Status'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="text-zinc-400 transition-colors hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="status-name"
                                        className={LABEL}
                                    >
                                        Name
                                    </label>
                                    <input
                                        id="status-name"
                                        type="text"
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData('name', e.target.value)
                                        }
                                        className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                        placeholder="e.g. Proposal Sent"
                                        autoComplete="off"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <span className={LABEL}>Colour</span>
                                    <div className="flex flex-wrap gap-2">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() =>
                                                    form.setData('color', color)
                                                }
                                                aria-label={color}
                                                aria-pressed={
                                                    form.data.color === color
                                                }
                                                className={`h-8 w-8 rounded-full ${SWATCH[color] ?? 'bg-zinc-400'} ring-offset-2 ring-offset-[#060c1a] transition-transform hover:scale-110 ${
                                                    form.data.color === color
                                                        ? 'ring-2 ring-white'
                                                        : ''
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <label className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_closed}
                                        onChange={(e) =>
                                            form.setData(
                                                'is_closed',
                                                e.target.checked,
                                            )
                                        }
                                        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-violet-500"
                                    />
                                    <span className="text-sm text-zinc-300">
                                        Final status
                                        <span className="block text-xs text-zinc-500">
                                            A lead in this status is finished
                                            (like Won, Lost or Unqualified).
                                        </span>
                                    </span>
                                </label>

                                <div className="flex justify-end gap-3 border-t border-violet-500/10 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className={SECONDARY_BUTTON}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className={PRIMARY_BUTTON}
                                    >
                                        {form.processing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Status'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SortableStatusRow({
    status,
    position,
    onEdit,
    onDelete,
}: {
    status: LeadStatus;
    position: number;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: status.id });

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`relative flex items-center gap-3 border-b border-white/4 px-3 py-3 last:border-0 sm:px-5 ${
                isDragging
                    ? 'z-10 bg-violet-500/10 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)]'
                    : 'hover:bg-violet-500/5'
            }`}
        >
            <button
                ref={setActivatorNodeRef}
                type="button"
                {...attributes}
                {...listeners}
                aria-label={`Drag to reorder ${status.name}`}
                className="cursor-grab touch-none rounded-md p-1.5 text-zinc-600 transition-colors hover:text-violet-300 active:cursor-grabbing"
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <span className="w-6 shrink-0 text-right font-mono text-xs text-zinc-600">
                {position}
            </span>
            <span
                className={`h-3 w-3 shrink-0 rounded-full ${SWATCH[status.color] ?? 'bg-zinc-400'}`}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                {status.name}
            </span>
            {status.is_closed && (
                <span className="hidden items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] tracking-wide text-zinc-400 sm:inline-flex">
                    <Lock className="h-3 w-3" /> Final
                </span>
            )}
            <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-cyan-400/70 transition-colors hover:text-cyan-300"
            >
                <Edit className="h-4 w-4" />{' '}
                <span className="hidden sm:inline">Edit</span>
            </button>
            <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-red-400/60 transition-colors hover:text-red-400"
            >
                <Trash2 className="h-4 w-4" />{' '}
                <span className="hidden sm:inline">Delete</span>
            </button>
        </li>
    );
}

LeadStatusesIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Lead Statuses">{page}</AdminLayout>
);
